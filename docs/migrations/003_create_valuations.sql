create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  adopted_rate_per_sqm numeric,
  adopted_rate_rationale text,
  created_at timestamp with time zone default now()
);

create index idx_valuations_case_id on public.valuations(case_id);
