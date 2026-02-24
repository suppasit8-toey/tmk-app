-- 1. Create Invoice / Receipt types
CREATE TYPE public.doc_type AS ENUM ('invoice', 'receipt', 'expense');
CREATE TYPE public.doc_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash', 'transfer', 'credit', 'other');

-- 2. Accounting Documents
CREATE TABLE public.accounting_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_number TEXT NOT NULL UNIQUE,              -- e.g., "INV-20260222-0001"
  doc_type public.doc_type NOT NULL DEFAULT 'invoice',
  status public.doc_status DEFAULT 'draft'::public.doc_status,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 7,            -- VAT 7%
  tax_amount NUMERIC(15, 2) DEFAULT 0,
  grand_total NUMERIC(15, 2) DEFAULT 0,
  payment_method public.payment_method,
  payment_date DATE,
  due_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.accounting_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users (accounting_docs)"
ON public.accounting_docs FOR ALL TO authenticated USING (true) WITH CHECK (true);
