const db = require('../db');
const aiProvider = require('../services/aiProvider');

const computeLeadScore = (source, inquiry = '') => {
  const normalized = String(inquiry).toLowerCase();
  let score = 5;

  switch (source) {
    case 'b2b_inquiry':
      score += 40;
      break;
    case 'custom_request':
      score += 25;
      break;
    case 'alliance_application':
      score += 20;
      break;
    case 'contact_form':
      score += 15;
      break;
    case 'cart_capture':
      score += 10;
      break;
    case 'newsletter':
      score += 5;
      break;
    default:
      score += 10;
  }

  if (normalized.includes('bulk') || normalized.includes('corporate') || normalized.includes('wedding') || normalized.includes('proposal') || normalized.includes('quote') || normalized.includes('customize')) {
    score += 15;
  }

  if (normalized.includes('urgent') || normalized.includes('asap') || normalized.includes('need by')) {
    score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
};

const buildLeadAnalysisPrompt = ({ name, email, phone, company_name, source, inquiry }) => {
  return `You are a sales CRM analyst. Evaluate this incoming lead to generate a lead score, buying intent, recommended service, opportunity summary, and confidence score for follow-up prioritization.

Lead details:
- Name: ${name || 'Unknown'}
- Email: ${email || 'Unknown'}
- Phone: ${phone || 'Unknown'}
- Company: ${company_name || 'Unknown'}
- Source: ${source || 'Unknown'}
- Inquiry: ${inquiry || 'No inquiry provided'}

Respond only with valid JSON. The JSON must contain the following keys:
- lead_score (integer 1-100)
- buying_intent (short phrase)
- recommended_service (short phrase)
- opportunity_summary (one paragraph)
- confidence_score (decimal 0.0-1.0)
- notes (optional free-form text)

Do not include any markdown or explanation outside the JSON object.`;
};

const parseAIAnalysisResponse = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const payload = jsonMatch ? jsonMatch[0].trim() : raw.trim();

  try {
    return JSON.parse(payload);
  } catch (err) {
    console.warn('⚠️ Failed to parse AI analysis JSON:', err.message);
    try {
      const cleaned = payload
        .replace(/\n/g, ' ')
        .replace(/\"/g, '"')
        .replace(/([\w]+):/g, '"$1":')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(cleaned);
    } catch (secondaryErr) {
      console.error('❌ Could not parse AI response after cleanup:', secondaryErr.message);
      return null;
    }
  }
};

const analyzeLeadWithAI = async (lead) => {
  const prompt = buildLeadAnalysisPrompt(lead);
  let analysis = null;
  let aiResponse = null;

  try {
    const response = await aiProvider.generateContent(
      'You are a CRM lead scoring and prioritization assistant.',
      prompt,
      []
    );
    aiResponse = response.text;
    analysis = parseAIAnalysisResponse(aiResponse);
  } catch (err) {
    console.warn('⚠️ AI analysis failed, falling back to heuristic scoring:', err.message);
  }

  const fallbackScore = computeLeadScore(lead.source, lead.inquiry || '');
  const lead_score = analysis?.lead_score ? Math.min(Math.max(parseInt(analysis.lead_score, 10), 1), 100) : Math.max(1, fallbackScore);
  const confidence_score = analysis?.confidence_score ? Math.min(Math.max(parseFloat(analysis.confidence_score), 0), 1) : 0;
  const buying_intent = analysis?.buying_intent || analysis?.buyingIntent || 'Unknown';
  const recommended_service = analysis?.recommended_service || analysis?.recommendedService || 'General inquiry';
  const opportunity_summary = analysis?.opportunity_summary || analysis?.opportunitySummary || analysis?.notes || `Lead from ${lead.source}. Follow up to qualify.`;

  const insertQuery = `
    INSERT INTO lead_ai_analysis (
      lead_id,
      ai_score,
      buying_intent,
      recommended_service,
      opportunity_summary,
      confidence_score,
      analysis_json,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
    RETURNING *
  `;

  const analysisResult = await db.query(insertQuery, [
    lead.id,
    lead_score,
    buying_intent,
    recommended_service,
    opportunity_summary,
    confidence_score,
    JSON.stringify({ raw: aiResponse, parsed: analysis })
  ]);

  const updateLeadQuery = `
    UPDATE leads
    SET lead_score = $1,
        ai_summary = $2
    WHERE id = $3
    RETURNING *
  `;
  await db.query(updateLeadQuery, [lead_score, opportunity_summary, lead.id]);

  return analysisResult.rows[0];
};

const createLead = async ({
  name,
  email,
  phone,
  company_name,
  source,
  inquiry,
  metadata = {}
}) => {
  const normalizedSource = source || 'contact_form';
  const leadScore = computeLeadScore(normalizedSource, inquiry);
  const leadName = name?.trim() || email?.split('@')[0] || 'Unknown';

  const query = `
    INSERT INTO leads (name, email, phone, company_name, source, inquiry, lead_score, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW())
    RETURNING *
  `;

  const values = [
    leadName,
    email?.trim().toLowerCase() || null,
    phone?.trim() || null,
    company_name?.trim() || null,
    normalizedSource,
    inquiry?.trim() || null,
    leadScore
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

const createLeadActivity = async ({
  lead_id,
  activity_type,
  activity_description,
  performed_by = null,
  metadata = {}
}) => {
  const query = `
    INSERT INTO lead_activities (lead_id, activity_type, activity_description, performed_by, metadata, created_at)
    VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
    RETURNING *
  `;
  const values = [lead_id, activity_type, activity_description || null, performed_by, JSON.stringify(metadata)];
  const result = await db.query(query, values);
  return result.rows[0];
};

const createLeadWithActivity = async (leadPayload, activityPayload) => {
  console.log('[LEAD_AI_PATH] createLeadWithActivity called');
  const lead = await createLead(leadPayload);
  if (activityPayload && lead?.id) {
    await createLeadActivity({ lead_id: lead.id, ...activityPayload });
  }
  console.log('[LEAD_AI_PATH] Lead created, ID:', lead?.id);
  return lead;
};

const analyzeLeadAIById = async (leadId) => {
  const result = await db.query(
    `SELECT id, name, email, phone, company_name, source, inquiry FROM leads WHERE id = $1 LIMIT 1`,
    [leadId]
  );
  const lead = result.rows[0];
  if (!lead) throw new Error('Lead not found');
  return analyzeLeadWithAI(lead);
};

module.exports = {
  computeLeadScore,
  createLead,
  createLeadActivity,
  createLeadWithActivity,
  analyzeLeadWithAI,
  analyzeLeadAIById
};
