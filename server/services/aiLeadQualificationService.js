const aiProvider = require('./aiProvider');

class AILeadQualificationService {
  
  async analyzeLead(lead) {
    console.log(`[AI Qualification] Analyzing lead: ${lead.id}`);
    
    const prompt = `You are an expert Sales Development Representative (SDR).
Analyze the following lead and output ONLY a valid JSON object.
Lead Info:
- Name: ${lead.name || 'Unknown'}
- Company: ${lead.company_name || 'Unknown'}
- Source: ${lead.source || 'Unknown'}
- Inquiry: ${lead.inquiry || lead.notes || 'Unknown'}

Required JSON structure:
{
  "summary": "A 1-sentence overview of the opportunity",
  "reasoning": "A 1-sentence explanation of why the score/temperature was assigned",
  "score": integer between 1 and 100 based on buying intent and budget/timeline clarity,
  "temperature": "hot" | "warm" | "cold",
  "qualification_status": "qualified" | "needs_nurture" | "disqualified",
  "next_action": "Specific next step for the sales team"
}
Output nothing but the JSON object.`;

    let parsedResult = null;

    try {
      // Use OpenAI as the provider as previously configured in leadHelpers
      const response = await aiProvider.generateContent(
        'You are an expert SDR AI.',
        prompt,
        [],
        { provider: 'openai' }
      );

      const jsonStr = response.text.match(/\{[\s\S]*\}/);
      if (jsonStr) {
        parsedResult = JSON.parse(jsonStr[0]);
      }
    } catch (err) {
      console.error('[AI Qualification] AI call failed:', err.message);
    }

    // Process or fallback the results
    const summary = this.generateSummary(parsedResult, lead);
    const score = this.calculateLeadScore(parsedResult, lead);
    const temperature = parsedResult?.temperature || (score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold');
    const priority = this.assignPriority(score);
    const status = parsedResult?.qualification_status || (score >= 60 ? 'qualified' : 'needs_nurture');
    const next_action = this.recommendNextAction(parsedResult, lead);
    const reasoning = parsedResult?.reasoning || `Assigned based on source: ${lead.source}`;

    return {
      ai_summary: summary,
      ai_reasoning: reasoning,
      lead_score: score,
      lead_temperature: temperature,
      priority: priority,
      qualification_status: status,
      ai_next_action: next_action
    };
  }

  generateSummary(aiData, lead) {
    if (aiData && aiData.summary) return aiData.summary;
    if (lead.source === 'b2b_inquiry' && lead.inquiry && lead.inquiry.includes('Budget')) {
        return 'Corporate gifting opportunity with defined budget and timeline.';
    }
    return `Lead captured from ${lead.source}. Needs review.`;
  }

  calculateLeadScore(aiData, lead) {
    if (aiData && typeof aiData.score === 'number') {
      return Math.min(Math.max(aiData.score, 1), 100);
    }
    // Fallback heuristic
    let score = 10;
    if (lead.source === 'b2b_inquiry') score += 40;
    if (lead.company_name) score += 20;
    if (lead.inquiry && lead.inquiry.length > 20) score += 15;
    return score;
  }

  assignPriority(score) {
    if (score >= 75) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  recommendNextAction(aiData, lead) {
    if (aiData && aiData.next_action) return aiData.next_action;
    if (lead.source === 'b2b_inquiry') return 'Schedule consultation within 24 hours.';
    return 'Send welcome email and product catalog.';
  }
}

module.exports = new AILeadQualificationService();
