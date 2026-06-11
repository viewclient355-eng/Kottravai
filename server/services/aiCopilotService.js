const aiProvider = require('./aiProvider');
const db = require('../db');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class AICopilotService {
  
  async analyzeNextBestAction(leadId) {
    console.log(`[AICopilot] Analyzing next best action for lead: ${leadId}`);
    
    // 1. Fetch Lead Data & Activities
    const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (leadError || !lead) throw new Error('Lead not found');

    const { data: activities } = await supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });

    const activityContext = activities?.slice(0, 5).map(a => `[${new Date(a.created_at).toLocaleDateString()}] ${a.activity_type}: ${a.activity_description}`).join('\n') || 'No activities logged yet.';
    
    // 2. Build Prompt
    const systemPrompt = 'You are an expert B2B AI Sales Copilot. Analyze the lead CRM data and recommend the strict JSON format output.';
    
    const prompt = `
Lead CRM Data:
Name: ${lead.name || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Status: ${lead.status}
Priority: ${lead.priority}
AI Score: ${lead.lead_score || 'N/A'}
Last Contacted: ${lead.last_contacted_at || 'Never'}
Next Follow-up: ${lead.next_followup_at || 'None'}

Recent Activities:
${activityContext}

Evaluate and return ONLY valid JSON in exactly this format:
{
  "next_action": "<Choose exactly one: Call, Email, WhatsApp, Schedule Demo, Send Proposal, Follow-up, Re-engage, Close Won, Close Lost>",
  "conversion_probability": <integer 0-100>,
  "risk_status": "<Choose exactly one: Healthy, Stalled, Missed Follow-up Risk, Churn Risk, Needs Immediate Attention>",
  "rationale": "<Short 1-2 sentence explanation for the next action and risk>"
}

Rules:
- If priority is 'critical', risk MUST be 'Needs Immediate Attention'.
- If missed follow-up exists and inactivity > 0 days, risk MUST be 'Missed Follow-up Risk' or 'Needs Immediate Attention'.
- If >3 days inactive, risk 'Stalled' (unless critical).
`;

    let parsedResult = null;
    try {
      const response = await aiProvider.generateContent(systemPrompt, prompt);
      const jsonStr = response.text.match(/\{[\s\S]*\}/);
      if (jsonStr) {
        parsedResult = JSON.parse(jsonStr[0]);
      }
    } catch (err) {
      console.error('[AICopilot] AI call failed:', err.message);
      // Fallback
      parsedResult = {
        next_action: 'Follow-up',
        conversion_probability: 50,
        risk_status: lead.priority === 'critical' ? 'Needs Immediate Attention' : 'Healthy',
        rationale: 'Fallback analysis due to AI service timeout.'
      };
    }

    if (!parsedResult) {
       parsedResult = {
        next_action: 'Follow-up',
        conversion_probability: 50,
        risk_status: lead.priority === 'critical' ? 'Needs Immediate Attention' : 'Healthy',
        rationale: 'Failed to parse AI response.'
      };
    }

    // 3. Update Lead in DB
    const updates = {
      conversion_probability: parsedResult.conversion_probability,
      risk_status: parsedResult.risk_status,
      copilot_rationale: parsedResult.rationale,
      copilot_last_analyzed_at: new Date().toISOString()
    };
    // Also save next_action if needed, but we don't have copilot_next_action col, so we map to existing next_action.
    if (parsedResult.next_action) {
      updates.next_action = parsedResult.next_action;
    }

    await supabase.from('leads').update(updates).eq('id', leadId);

    return { success: true, analysis: parsedResult };
  }

  async generateCommunicationDraft(leadId, channel) {
    console.log(`[AICopilot] Generating ${channel} draft for lead: ${leadId}`);
    
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (!lead) throw new Error('Lead not found');

    const systemPrompt = 'You are an expert B2B sales copywriter. Return ONLY valid JSON for the drafted communication.';
    let prompt = `Write a professional B2B ${channel} draft for a lead named ${lead.name} from ${lead.company}. The next intended action is: ${lead.next_action}. Lead context: ${lead.copilot_rationale || lead.ai_summary || 'Interested in our services.'}`;

    if (channel === 'email') {
      prompt += `\nReturn strictly JSON:\n{"subject": "...", "body": "..."}`;
    } else if (channel === 'whatsapp') {
      prompt += `\nKeep under 500 characters. Return strictly JSON:\n{"message": "..."}`;
    } else if (channel === 'call') {
      prompt += `\nReturn strictly JSON:\n{"opening": "...", "questions": ["..."], "closing": "..."}`;
    }

    let parsedResult = null;
    try {
      const response = await aiProvider.generateContent(systemPrompt, prompt);
      const jsonStr = response.text.match(/\{[\s\S]*\}/);
      if (jsonStr) {
        parsedResult = JSON.parse(jsonStr[0]);
      }
    } catch (err) {
       console.error('[AICopilot] Draft generation failed:', err.message);
    }

    if (!parsedResult) {
      console.log(`[AICopilot] Applying fallback draft for channel: ${channel}`);
      if (channel === 'email') {
        parsedResult = {
          subject: `Following up: Kottravai Partnership - ${lead.company}`,
          body: `Hi ${lead.name},\n\nI hope this email finds you well.\n\nI wanted to quickly follow up on our previous conversation regarding your interest in Kottravai. I'd love to schedule a quick 10-minute call this week to discuss how we can align with ${lead.company}'s goals.\n\nPlease let me know what day works best for you.\n\nBest regards,\nTeam Kottravai`
        };
      } else if (channel === 'whatsapp') {
        parsedResult = {
          message: `Hi ${lead.name}, this is Team Kottravai. Just following up on your inquiry. Are you available for a quick chat today to discuss how we can help ${lead.company}? Let us know!`
        };
      } else if (channel === 'call') {
        parsedResult = {
          opening: `Hi ${lead.name}, this is [Your Name] from Kottravai. I'm calling to follow up on your recent inquiry. Is this a good time?`,
          questions: [
            `What is the primary timeline for your project?`,
            `Are there any specific products you are prioritizing right now?`
          ],
          closing: `Great, I'll send over a summary email right now. Let's touch base again on [Date]. Have a great day!`
        };
      }
    }

    return { success: true, draft: parsedResult };
  }

  async analyzeAllLeads() {
     // Fetch active leads that haven't been analyzed today
     const { data: leads } = await db.query(`
        SELECT id FROM public.leads 
        WHERE status NOT IN ('won', 'lost', 'archived') 
          AND (copilot_last_analyzed_at IS NULL OR copilot_last_analyzed_at < NOW() - INTERVAL '1 day')
        LIMIT 50;
     `);

     let count = 0;
     for (const row of leads || []) {
       try {
          await this.analyzeNextBestAction(row.id);
          count++;
       } catch (err) {
          console.error(`[AICopilot] Batch analysis failed for ${row.id}`);
       }
     }
     return { success: true, processed: count };
  }
}

module.exports = new AICopilotService();
