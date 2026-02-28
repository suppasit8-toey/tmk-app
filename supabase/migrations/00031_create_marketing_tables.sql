-- ═══════════════════════════════════════════════════════
-- Marketing System Tables
-- ═══════════════════════════════════════════════════════

-- Marketing Campaigns (แคมเปญการตลาด)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    strategy TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC(12,2) DEFAULT 0,
    expected_sales NUMERIC(12,2) DEFAULT 0,
    expected_leads INTEGER DEFAULT 0,
    actual_sales NUMERIC(12,2) DEFAULT 0,
    actual_leads INTEGER DEFAULT 0,
    actual_spend NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Tasks (รายการงาน/หน้าที่)
CREATE TABLE IF NOT EXISTS marketing_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date DATE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Evaluations (ประเมินผล)
CREATE TABLE IF NOT EXISTS marketing_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sales_result NUMERIC(12,2) DEFAULT 0,
    leads_result INTEGER DEFAULT 0,
    spend_result NUMERIC(12,2) DEFAULT 0,
    roi NUMERIC(8,2) DEFAULT 0,
    summary TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_evaluations ENABLE ROW LEVEL SECURITY;

-- Campaigns
CREATE POLICY "Authenticated users can read campaigns"
    ON marketing_campaigns FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
    ON marketing_campaigns FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
    ON marketing_campaigns FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete campaigns"
    ON marketing_campaigns FOR DELETE
    TO authenticated
    USING (true);

-- Tasks
CREATE POLICY "Authenticated users can read tasks"
    ON marketing_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert tasks"
    ON marketing_tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
    ON marketing_tasks FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete tasks"
    ON marketing_tasks FOR DELETE
    TO authenticated
    USING (true);

-- Evaluations
CREATE POLICY "Authenticated users can read evaluations"
    ON marketing_evaluations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert evaluations"
    ON marketing_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update evaluations"
    ON marketing_evaluations FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete evaluations"
    ON marketing_evaluations FOR DELETE
    TO authenticated
    USING (true);
