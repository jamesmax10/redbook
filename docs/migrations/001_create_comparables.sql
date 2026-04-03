create table public.comparables (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  address text not null,
  transaction_type text not null,
  transaction_date date not null,
  price_or_rent numeric not null,
  gross_internal_area numeric not null,
  rate_per_sqm numeric not null,
  created_at timestamp with time zone default now()
);

create index idx_comparables_case_id on public.comparables(case_id);
