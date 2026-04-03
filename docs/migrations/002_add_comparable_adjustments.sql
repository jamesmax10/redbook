alter table public.comparables
  add column adjustments jsonb,
  add column adjusted_rate_per_sqm numeric;

comment on column public.comparables.adjustments is
  'Array of {factor, percentage, rationale} adjustment objects';
comment on column public.comparables.adjusted_rate_per_sqm is
  'rate_per_sqm * (1 + sum(percentage) / 100)';
