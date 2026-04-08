create table public.properties (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  address text not null,
  property_type text not null,
  gross_internal_area numeric not null,
  condition text not null,
  tenure text not null,
  created_at timestamp with time zone default now()
);

create index idx_properties_case_id on public.properties(case_id);
