-- Enable RLS on all user-facing tables
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_items ENABLE ROW LEVEL SECURITY;

-- Cases: users can only access their own cases
CREATE POLICY "cases_owner_policy" ON public.cases
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Properties: access via case ownership
CREATE POLICY "properties_owner_policy" ON public.properties
  FOR ALL
  USING (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  );

-- Comparables: access via case ownership
CREATE POLICY "comparables_owner_policy" ON public.comparables
  FOR ALL
  USING (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  );

-- Valuations: access via case ownership
CREATE POLICY "valuations_owner_policy" ON public.valuations
  FOR ALL
  USING (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  );

-- Research items: access via case ownership
CREATE POLICY "research_items_owner_policy" ON public.research_items
  FOR ALL
  USING (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    case_id IN (
      SELECT id FROM public.cases WHERE user_id = auth.uid()
    )
  );

-- Backfill user_id on existing cases (replace UUID before running)
-- UPDATE public.cases
-- SET user_id = 'your-user-uuid-here'
-- WHERE user_id IS NULL;
