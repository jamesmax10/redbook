CREATE TABLE public.ppr_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  address text NOT NULL,
  county text,
  eircode text,
  price numeric NOT NULL,
  description text,
  property_size_desc text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ppr_address 
  ON public.ppr_transactions 
  USING gin(to_tsvector('english', address));

CREATE INDEX idx_ppr_county 
  ON public.ppr_transactions(county);

CREATE INDEX idx_ppr_sale_date 
  ON public.ppr_transactions(sale_date DESC);

ALTER TABLE public.ppr_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ppr_read_authenticated" ON public.ppr_transactions
  FOR SELECT
  USING (auth.role() = 'authenticated');
