# AI Lead Scoring Workflow

## Goal
Automatically score and prioritize every incoming lead with AI, persist the results in Supabase, and trigger a notification after analysis.

## Workflow Overview

1. Lead Created
   - Source: public website forms, alliance applications, cart capture, newsletter, chat, etc.
   - Backend route: `POST /api/leads/capture` or existing lead creation flows that use `createLeadWithActivity()`.
2. AI Analysis
   - Service: `server/services/aiProvider.js`
   - Route: `POST /api/leads/:id/ai-analysis`
   - Computed outputs:
     - `lead_score` (1-100)
     - `buying_intent`
     - `recommended_service`
     - `opportunity_summary`
     - `confidence_score` (0-1)
3. CRM Update
   - Persist into `lead_ai_analysis`
   - Update `leads.lead_score`
   - Update `leads.ai_summary`
4. Notification
   - Notify sales team or internal webhook after AI analysis completes.

## n8n Workflow Design

### Trigger
- `Webhook` node
- Endpoint: `/webhook/lead-created`
- Payload includes `lead_id`

### Step 1: Fetch Lead
- `HTTP Request` node or `Supabase` node
- Query by `lead_id`:

```sql
SELECT id, name, email, phone, company_name, source, inquiry, status
FROM leads
WHERE id = $1;
```

### Step 2: Analyze Lead via Backend API
- `HTTP Request` node
- Method: `POST`
- URL: `{{ $json["lead_ai_analysis_url"] }}/api/leads/{{ $json["lead_id"] }}/ai-analysis`
- Headers: `Authorization: Bearer {{ $env.OPENAI_WORKFLOW_TOKEN }}`

### Step 3: Update CRM / Supabase
- If backend route does not update the CRM directly, use a Supabase node to upsert `lead_ai_analysis`
- Example query:

```sql
INSERT INTO lead_ai_analysis (
  lead_id,
  ai_score,
  buying_intent,
  recommended_service,
  opportunity_summary,
  confidence_score,
  analysis_json
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (lead_id)
DO UPDATE SET
  ai_score = EXCLUDED.ai_score,
  buying_intent = EXCLUDED.buying_intent,
  recommended_service = EXCLUDED.recommended_service,
  opportunity_summary = EXCLUDED.opportunity_summary,
  confidence_score = EXCLUDED.confidence_score,
  analysis_json = EXCLUDED.analysis_json,
  updated_at = NOW();
```

### Step 4: Notification
- `Slack`, `Email`, or `Webhook` node
- Notify sales team with:
  - `Lead Name`
  - `lead_score`
  - `buying_intent`
  - `recommended_service`
  - `confidence_score`
  - `Opportunity Summary`

## Recommended n8n Node Sequence

1. `Webhook` (Lead Created)  
2. `HTTP Request` (Fetch lead details / Supabase query)  
3. `HTTP Request` (Call backend AI analysis)  
4. `IF` node (check success)  
5. `Slack` or `Email` notification node  
6. `NoOp` or `Set` node for audit logging

## OpenAI Prompt Template

```text
You are a CRM lead scoring assistant.

Evaluate the following lead and return only valid JSON with these fields:
- lead_score (integer 1-100)
- buying_intent (short phrase)
- recommended_service (short phrase)
- opportunity_summary (one paragraph)
- confidence_score (decimal 0.0-1.0)
- notes (optional free-form text)

Lead details:
- Name: {{name}}
- Email: {{email}}
- Phone: {{phone}}
- Company: {{company_name}}
- Source: {{source}}
- Inquiry: {{inquiry}}

Respond only with JSON, no markdown, no explanation.
```

## Supabase Query Examples

### Select lead for analysis
```sql
SELECT id, name, email, phone, company_name, source, inquiry
FROM leads
WHERE id = $1;
```

### Update lead after AI analysis
```sql
UPDATE leads
SET lead_score = $1,
    ai_summary = $2
WHERE id = $3;
```

### Insert AI analysis record
```sql
INSERT INTO lead_ai_analysis (
  lead_id,
  ai_score,
  buying_intent,
  recommended_service,
  opportunity_summary,
  confidence_score,
  analysis_json
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
```

## API Integration Code

### Backend route
- `POST /api/leads/:id/ai-analysis`

### Example request
```json
{
  "lead_id": "<uuid>"
}
```

### Example response
```json
{
  "status": "success",
  "analysis": {
    "id": "<uuid>",
    "lead_id": "<uuid>",
    "ai_score": 80,
    "buying_intent": "Ready to buy",
    "recommended_service": "Corporate gifting consultation",
    "opportunity_summary": "Lead is seeking bulk corporate gifting for Diwali, good match for premium hampers.",
    "confidence_score": 0.92,
    "analysis_json": { ... }
  }
}
```

## Notes
- The backend now automatically triggers AI scoring every time `createLeadWithActivity()` is called.
- The `lead_ai_analysis` table stores detailed AI output and the raw JSON payload.
- Use the `POST /api/leads/:id/ai-analysis` route as an n8n retry or manual reanalysis entry point.
