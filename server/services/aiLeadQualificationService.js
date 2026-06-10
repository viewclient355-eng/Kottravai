const aiProvider = require('./aiProvider');

class AILeadQualificationService {
  
  async analyzeLead(lead) {
    console.log(`[AI Qualification] Analyzing lead: ${lead.id}`);
    
    const prompt = `You are an expert B2B sales qualification assistant.

Analyze the lead information and return ONLY valid JSON.

Lead Details:
Name: ${lead.name || 'Unknown'}
Company: ${lead.company_name || 'Unknown'}
Email: ${lead.email || 'Unknown'}
Phone: ${lead.phone || 'Unknown'}
Location: ${lead.location || 'Unknown'}
Products Interested: Unknown
Order Quantity: Unknown
Additional Notes: ${lead.inquiry || lead.notes || 'Unknown'}

Evaluate:

1. Lead Score (0-100)
2. Buying Intent (High, Medium, Low)
3. Lead Quality (Hot, Warm, Cold)
4. Estimated Deal Size (Small, Medium, Large)
5. Key Insights
6. Recommended Next Action
7. AI Summary

Return exactly in this format:

{
  "score": 85,
  "buying_intent": "High",
  "lead_quality": "Hot",
  "estimated_deal_size": "Large",
  "key_insights": [
    "Insight 1",
    "Insight 2"
  ],
  "recommended_action": "Schedule a sales call within 24 hours",
  "summary": "This lead shows strong purchase intent and commercial potential."
}`;

    let parsedResult = null;

    try {
      // Use the default provider (which will be Groq if the key is present)
      const response = await aiProvider.generateContent(
        'You are an expert B2B sales qualification assistant.',
        prompt
      );

      const jsonStr = response.text.match(/\{[\s\S]*\}/);
      if (jsonStr) {
        parsedResult = JSON.parse(jsonStr[0]);
      }
    } catch (err) {
      console.error('[AI Qualification] AI call failed:', err.message);
    }

    // Process or fallback the results
    const summary = parsedResult?.summary || this.generateSummary(parsedResult, lead);
    const score = parsedResult?.score || this.calculateLeadScore(parsedResult, lead);
    
    let temperature = 'cold';
    if (parsedResult?.lead_quality) {
        temperature = parsedResult.lead_quality.toLowerCase();
    } else {
        temperature = (score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold');
    }
    
    const priority = this.assignPriority(score);
    
    let status = 'needs_nurture';
    if (parsedResult?.buying_intent) {
        status = parsedResult.buying_intent.toLowerCase() === 'high' ? 'qualified' : 'needs_nurture';
    } else {
        status = (score >= 60 ? 'qualified' : 'needs_nurture');
    }
    
    const next_action = parsedResult?.recommended_action || this.recommendNextAction(parsedResult, lead);
    const reasoning = parsedResult?.key_insights?.join(' | ') || `Assigned based on source: ${lead.source}`;
    const buying_intent = parsedResult?.buying_intent || (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low');
    const lead_quality = parsedResult?.lead_quality || (score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold');
    const estimated_deal_size = parsedResult?.estimated_deal_size || (score >= 80 ? 'Large' : score >= 50 ? 'Medium' : 'Small');
    const key_insights = Array.isArray(parsedResult?.key_insights) && parsedResult.key_insights.length
      ? parsedResult.key_insights
      : [reasoning];
    const recommended_action = parsedResult?.recommended_action || next_action;

    return {
      lead_score: score,
      buying_intent,
      lead_quality,
      estimated_deal_size,
      key_insights,
      recommended_action,
      ai_summary: summary,
      ai_reasoning: reasoning,
      lead_temperature: temperature,
      priority: priority,
      qualification_status: status,
      ai_next_action: recommended_action,
      ai_qualification_mode: parsedResult ? 'success' : 'fallback'
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
