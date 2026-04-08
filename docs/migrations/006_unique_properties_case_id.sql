-- Enforce one subject property per case.
-- The app already assumes one-to-one via .single() queries;
-- this makes the schema match that assumption.
ALTER TABLE public.properties
  ADD CONSTRAINT properties_case_id_unique UNIQUE (case_id);
