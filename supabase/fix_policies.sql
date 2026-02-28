-- Drop existing policies if they exist, then recreate them

-- Campaigns
DROP POLICY IF EXISTS "Authenticated users can read campaigns" ON marketing_campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON marketing_campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON marketing_campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON marketing_campaigns;

CREATE POLICY "Authenticated users can read campaigns" ON marketing_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaigns" ON marketing_campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaigns" ON marketing_campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete campaigns" ON marketing_campaigns FOR DELETE TO authenticated USING (true);

-- Tasks
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON marketing_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON marketing_tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON marketing_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON marketing_tasks;

CREATE POLICY "Authenticated users can read tasks" ON marketing_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON marketing_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON marketing_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tasks" ON marketing_tasks FOR DELETE TO authenticated USING (true);

-- Evaluations
DROP POLICY IF EXISTS "Authenticated users can read evaluations" ON marketing_evaluations;
DROP POLICY IF EXISTS "Authenticated users can insert evaluations" ON marketing_evaluations;
DROP POLICY IF EXISTS "Authenticated users can update evaluations" ON marketing_evaluations;
DROP POLICY IF EXISTS "Authenticated users can delete evaluations" ON marketing_evaluations;

CREATE POLICY "Authenticated users can read evaluations" ON marketing_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert evaluations" ON marketing_evaluations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update evaluations" ON marketing_evaluations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete evaluations" ON marketing_evaluations FOR DELETE TO authenticated USING (true);
