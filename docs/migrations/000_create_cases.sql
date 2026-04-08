create table public.cases (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  property_address text not null,
  valuation_date date not null,
  purpose text not null,
  basis_of_value text not null,
  created_at timestamp with time zone default now(),
  user_id uuid
);
