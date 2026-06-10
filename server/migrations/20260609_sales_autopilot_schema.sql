-- Sales AutoPilot schema for Supabase PostgreSQL
-- Creates the lead management, activity, email, meeting, note, task, and AI analysis tables
-- Includes indexes, updated_at triggers, RLS policies, and views for dashboard analytics

-- ================================================================
-- Extensions
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- Audit Timestamp Trigger
-- ================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Leads Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    budget_range TEXT,
    service_interest TEXT,
    inquiry TEXT,
    source TEXT,
    lead_score INTEGER DEFAULT 0,
    ai_summary TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    assigned_to UUID,
    next_action TEXT,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leads_status_check CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'archived')),
    CONSTRAINT leads_score_check CHECK (lead_score >= 0 AND lead_score <= 100)
);

COMMENT ON TABLE public.leads IS 'Master lead record for Sales AutoPilot. Supports AI scoring, assignment, follow-up, and pipeline status.';
COMMENT ON COLUMN public.leads.assigned_to IS 'UUID of the internal user or sales rep assigned to this lead.';
COMMENT ON COLUMN public.leads.next_action IS 'Next planned action for this lead, such as Follow-up Email or Call.';
COMMENT ON COLUMN public.leads.lead_score IS 'AI-generated lead score between 0 and 100.';

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON public.leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_action ON public.leads(next_action);

CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Lead Activities Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    performed_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_activities_type_check CHECK (activity_type IN (
        'Email Sent',
        'Email Opened',
        'Link Clicked',
        'Meeting Scheduled',
        'Proposal Sent',
        'Follow-up Sent',
        'Task Created',
        'Status Changed',
        'Note Added'
    ))
);

COMMENT ON TABLE public.lead_activities IS 'Timeline of interactions and events associated with a lead.';
COMMENT ON COLUMN public.lead_activities.metadata IS 'Structured metadata for workflow and automation context.';

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_performed_by ON public.lead_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at);

CREATE TRIGGER trg_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Lead Emails Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lead_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    subject TEXT,
    email_content TEXT,
    email_type TEXT,
    delivery_status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_emails_delivery_status_check CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed')),
    CONSTRAINT lead_emails_type_check CHECK (email_type IN ('cold_email', 'follow_up', 'proposal', 'nurture', 'notification', 'reminder'))
);

COMMENT ON TABLE public.lead_emails IS 'Email events and delivery lifecycle for a lead.';
COMMENT ON COLUMN public.lead_emails.delivery_status IS 'Current delivery state of the outgoing email.';

CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON public.lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_delivery_status ON public.lead_emails(delivery_status);
CREATE INDEX IF NOT EXISTS idx_lead_emails_email_type ON public.lead_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_lead_emails_sent_at ON public.lead_emails(sent_at);

CREATE TRIGGER trg_lead_emails_updated_at
BEFORE UPDATE ON public.lead_emails
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Lead Meetings Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lead_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    meeting_title TEXT,
    meeting_date TIMESTAMPTZ,
    meeting_status TEXT NOT NULL DEFAULT 'scheduled',
    meeting_notes TEXT,
    meeting_summary TEXT,
    action_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_meetings_status_check CHECK (meeting_status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'))
);

COMMENT ON TABLE public.lead_meetings IS 'Meeting records and outcomes tied to a lead.';
COMMENT ON COLUMN public.lead_meetings.action_items IS 'JSON list of follow-up action items from the meeting.';

CREATE INDEX IF NOT EXISTS idx_lead_meetings_lead_id ON public.lead_meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_meetings_meeting_date ON public.lead_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_lead_meetings_meeting_status ON public.lead_meetings(meeting_status);

CREATE TRIGGER trg_lead_meetings_updated_at
BEFORE UPDATE ON public.lead_meetings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Lead Notes Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.lead_notes IS 'Free-form notes attached to a lead for CRM context and follow-up history.';
COMMENT ON COLUMN public.lead_notes.created_by IS 'UUID of the user who created the note.';

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_by ON public.lead_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at);

CREATE TRIGGER trg_lead_notes_updated_at
BEFORE UPDATE ON public.lead_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Lead Tasks Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lead_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    task_description TEXT,
    task_status TEXT NOT NULL DEFAULT 'open',
    due_date TIMESTAMPTZ,
    assigned_to UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_tasks_status_check CHECK (task_status IN ('open', 'in_progress', 'completed', 'blocked', 'cancelled'))
);

COMMENT ON TABLE public.lead_tasks IS 'Action items assigned to the team for individual lead follow-up.';
COMMENT ON COLUMN public.lead_tasks.assigned_to IS 'UUID of the internal team member responsible for this task.';

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON public.lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON public.lead_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_task_status ON public.lead_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON public.lead_tasks(due_date);

CREATE TRIGGER trg_lead_tasks_updated_at
BEFORE UPDATE ON public.lead_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Lead AI Analysis Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lead_ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    ai_score INTEGER DEFAULT 0,
    buying_intent TEXT,
    recommended_service TEXT,
    pain_points TEXT,
    opportunity_summary TEXT,
    confidence_score NUMERIC(5,4) DEFAULT 0,
    analysis_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_ai_analysis_score_check CHECK (ai_score >= 0 AND ai_score <= 100),
    CONSTRAINT lead_ai_analysis_confidence_check CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

COMMENT ON TABLE public.lead_ai_analysis IS 'AI-generated signals and analysis for each lead, for scoring and recommendation workflows.';
COMMENT ON COLUMN public.lead_ai_analysis.analysis_json IS 'Raw AI analysis payload for future training, auditing, and workflow automation.';

CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_lead_id ON public.lead_ai_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_ai_score ON public.lead_ai_analysis(ai_score);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_confidence_score ON public.lead_ai_analysis(confidence_score);
CREATE INDEX IF NOT EXISTS idx_lead_ai_analysis_created_at ON public.lead_ai_analysis(created_at);

CREATE TRIGGER trg_lead_ai_analysis_updated_at
BEFORE UPDATE ON public.lead_ai_analysis
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ================================================================
-- Row Level Security
-- ================================================================
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Lead row visibility for assigned reps and service role
CREATE POLICY IF NOT EXISTS leads_select_for_assigned_reps
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (assigned_to = auth.uid());

CREATE POLICY IF NOT EXISTS leads_insert_for_web_capture
    ON public.leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        COALESCE(email, '') <> ''
        AND COALESCE(source, '') <> ''
    );

CREATE POLICY IF NOT EXISTS leads_manage_service_role
    ON public.leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS leads_block_anon_select
    ON public.leads
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS leads_block_updates_for_non_service_role
    ON public.leads
    FOR UPDATE
    TO authenticated, anon
    USING (false);

CREATE POLICY IF NOT EXISTS leads_block_deletes_for_all
    ON public.leads
    FOR DELETE
    TO PUBLIC
    USING (false);

-- Support tables use lead assignment rules through the parent lead
CREATE POLICY IF NOT EXISTS lead_activities_select_for_assigned_reps
    ON public.lead_activities
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_activities.lead_id
              AND l.assigned_to = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS lead_activities_insert_service_role
    ON public.lead_activities
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lead_activities_block_anon_select
    ON public.lead_activities
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS lead_activities_block_updates
    ON public.lead_activities
    FOR UPDATE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_activities_block_deletes
    ON public.lead_activities
    FOR DELETE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_emails_select_for_assigned_reps
    ON public.lead_emails
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_emails.lead_id
              AND l.assigned_to = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS lead_emails_insert_service_role
    ON public.lead_emails
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lead_emails_block_anon_select
    ON public.lead_emails
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS lead_emails_block_updates
    ON public.lead_emails
    FOR UPDATE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_emails_block_deletes
    ON public.lead_emails
    FOR DELETE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_meetings_select_for_assigned_reps
    ON public.lead_meetings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_meetings.lead_id
              AND l.assigned_to = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS lead_meetings_insert_service_role
    ON public.lead_meetings
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lead_meetings_block_anon_select
    ON public.lead_meetings
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS lead_meetings_block_updates
    ON public.lead_meetings
    FOR UPDATE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_meetings_block_deletes
    ON public.lead_meetings
    FOR DELETE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_notes_select_for_assigned_reps
    ON public.lead_notes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_notes.lead_id
              AND l.assigned_to = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS lead_notes_insert_service_role
    ON public.lead_notes
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lead_notes_block_anon_select
    ON public.lead_notes
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS lead_notes_block_updates
    ON public.lead_notes
    FOR UPDATE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_notes_block_deletes
    ON public.lead_notes
    FOR DELETE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_tasks_select_for_assigned_reps
    ON public.lead_tasks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_tasks.lead_id
              AND l.assigned_to = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS lead_tasks_insert_service_role
    ON public.lead_tasks
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lead_tasks_block_anon_select
    ON public.lead_tasks
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS lead_tasks_block_updates
    ON public.lead_tasks
    FOR UPDATE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_tasks_block_deletes
    ON public.lead_tasks
    FOR DELETE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_ai_analysis_select_for_assigned_reps
    ON public.lead_ai_analysis
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_ai_analysis.lead_id
              AND l.assigned_to = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS lead_ai_analysis_insert_service_role
    ON public.lead_ai_analysis
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS lead_ai_analysis_block_anon_select
    ON public.lead_ai_analysis
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY IF NOT EXISTS lead_ai_analysis_block_updates
    ON public.lead_ai_analysis
    FOR UPDATE
    TO PUBLIC
    USING (false);

CREATE POLICY IF NOT EXISTS lead_ai_analysis_block_deletes
    ON public.lead_ai_analysis
    FOR DELETE
    TO PUBLIC
    USING (false);

-- ================================================================
-- Views for Sales Dashboard and Pipeline
-- ================================================================
CREATE VIEW IF NOT EXISTS public.hot_leads AS
SELECT
    l.*
FROM public.leads l
WHERE
    l.lead_score >= 75
    OR l.status IN ('qualified', 'proposal_sent', 'negotiation')
    OR (l.next_action IS NOT NULL AND l.next_action <> '')
ORDER BY l.lead_score DESC, l.created_at DESC;

COMMENT ON VIEW public.hot_leads IS 'Leads with the highest engagement and conversion potential.';

CREATE VIEW IF NOT EXISTS public.recent_leads AS
SELECT
    l.*
FROM public.leads l
WHERE l.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY l.created_at DESC;

COMMENT ON VIEW public.recent_leads IS 'Leads created in the last 30 days for recent activity monitoring.';

CREATE VIEW IF NOT EXISTS public.lead_pipeline_summary AS
SELECT
    l.status,
    COUNT(*) AS total_leads,
    AVG(l.lead_score) AS average_lead_score,
    COUNT(*) FILTER (WHERE l.next_action IS NOT NULL AND l.next_action <> '') AS leads_with_next_action,
    COUNT(*) FILTER (WHERE l.last_contacted_at >= CURRENT_TIMESTAMP - INTERVAL '7 days') AS contacted_last_7_days
FROM public.leads l
GROUP BY l.status
ORDER BY total_leads DESC;

COMMENT ON VIEW public.lead_pipeline_summary IS 'Aggregate counts and lead score summary grouped by pipeline status.';

CREATE VIEW IF NOT EXISTS public.sales_dashboard_metrics AS
SELECT
    COUNT(*) AS total_leads,
    COUNT(*) FILTER (WHERE status = 'new') AS new_leads,
    COUNT(*) FILTER (WHERE status = 'qualified') AS qualified_leads,
    COUNT(*) FILTER (WHERE status = 'proposal_sent') AS proposal_leads,
    COUNT(*) FILTER (WHERE status = 'won') AS won_leads,
    COUNT(*) FILTER (WHERE status = 'lost') AS lost_leads,
    AVG(lead_score) AS average_lead_score,
    COUNT(*) FILTER (WHERE lead_score >= 80) AS hot_leads,
    COUNT(*) FILTER (WHERE next_action IS NOT NULL AND next_action <> '') AS pending_actions,
    MAX(updated_at) AS last_updated_at
FROM public.leads;

COMMENT ON VIEW public.sales_dashboard_metrics IS 'High-level sales metrics for dashboards and executive reporting.';

-- ================================================================
-- Final Notes
-- ================================================================
COMMENT ON SCHEMA public IS 'Sales AutoPilot schema for AI lead scoring, workflow automation, CRM integration, email automation, and meeting scheduling.';
