create table public.research_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  raw_input text not null,
  source_type text not null check (source_type in ('url', 'text')),
  extracted_address text,
  extracted_price numeric,
  extracted_area numeric,
  extracted_property_type text,
  extracted_transaction_type text,
  extraction_status text not null check (extraction_status in ('success', 'partial', 'failed')),
  created_at timestamp with time zone default now()
);

alter table public.research_items enable row level security;

create policy "Allow all access to research_items"
  on public.research_items
  for all
  using (true)
  with check (true);
