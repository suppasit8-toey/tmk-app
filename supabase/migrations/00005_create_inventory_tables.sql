-- 1. Create the Inventory Items table (stock of products/materials)
CREATE TABLE public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,                     -- e.g., "FAB-001", "RAIL-M01"
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'fabric',      -- fabric, rail, accessory, other
  unit TEXT NOT NULL DEFAULT 'เมตร',            -- เมตร, ชิ้น, ม้วน, ชุด
  quantity NUMERIC(15, 2) DEFAULT 0,
  min_quantity NUMERIC(15, 2) DEFAULT 0,        -- alert threshold
  cost_price NUMERIC(15, 2) DEFAULT 0,
  sell_price NUMERIC(15, 2) DEFAULT 0,
  supplier TEXT,
  location TEXT,                                -- storage location
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Purchase Orders table
CREATE TYPE public.po_status AS ENUM ('draft', 'ordered', 'received', 'cancelled');

CREATE TABLE public.purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,               -- e.g., "PO-20260222-1234"
  supplier TEXT NOT NULL,
  status public.po_status DEFAULT 'draft'::public.po_status,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  notes TEXT,
  ordered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Purchase Order Items
CREATE TABLE public.purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users (inventory_items)"
ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users (purchase_orders)"
ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users (purchase_order_items)"
ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
