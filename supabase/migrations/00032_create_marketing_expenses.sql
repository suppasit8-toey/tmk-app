-- Marketing Expenses (line items per campaign)
CREATE TABLE IF NOT EXISTS marketing_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    expense_date DATE DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'other',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read expenses" ON marketing_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON marketing_expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON marketing_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON marketing_expenses;

CREATE POLICY "Authenticated users can read expenses" ON marketing_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON marketing_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON marketing_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete expenses" ON marketing_expenses FOR DELETE TO authenticated USING (true);
