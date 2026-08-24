-- Phase 1: make the intelligence layer data-backed instead of mock-backed.
--
-- 1. Enrich the seeded recommendations with the narrative content that used to
--    live in the app's mock module (issue / expected impact / recommended
--    actions / likely causes) so the app can read it from the database.
-- 2. Add the RLS SELECT policies that were missing. `recommendations`,
--    `recommendation_accuracy`, and `module_snapshots` had RLS enabled but no
--    policy, which means authenticated users could read ZERO rows from them.

-- ---------------------------------------------------------------------------
-- 1. Recommendation content (merged into existing metadata jsonb)
-- ---------------------------------------------------------------------------

update public.recommendations set metadata = metadata || jsonb_build_object(
  'issue', 'Power users are negotiating deeper discounts while competitor entry pricing drops.',
  'expected_impact', 'Protect captured revenue without broadly suppressing conversion.',
  'likely_causes', jsonb_build_array(
    'Discount approvals are inconsistent by segment.',
    'Competitive pricing responses are not centrally coordinated.'
  ),
  'recommended_actions', jsonb_build_array(
    'Freeze exception discounts below the new corridor.',
    'Ship updated sales battlecard by region.',
    'Review close-rate change after 14 days.'
  )
) where id = 'rec-pricing-corridor';

update public.recommendations set metadata = metadata || jsonb_build_object(
  'issue', 'Renewal confidence dropped in onboarding-delayed enterprise accounts.',
  'expected_impact', 'Recover expansion revenue before quarter-close planning locks in.',
  'likely_causes', jsonb_build_array(
    'Implementation blockers are unresolved late in the cycle.',
    'Renewal owners are not aligned with onboarding health signals.'
  ),
  'recommended_actions', jsonb_build_array(
    'Assign named recovery owners for each flagged account.',
    'Escalate onboarding blockers in the war room.',
    'Run weekly renewal recovery review until confidence improves.'
  )
) where id = 'rec-forecasting-renewals';

update public.recommendations set metadata = metadata || jsonb_build_object(
  'issue', 'Operations-led buyers are converting poorly on generic messaging despite stronger intent.',
  'expected_impact', 'Improve conversion quality for the strongest new demand cluster.',
  'likely_causes', jsonb_build_array(
    'Public messaging is too broad for emerging demand clusters.',
    'Proof points for operations teams are missing from the funnel.'
  ),
  'recommended_actions', jsonb_build_array(
    'Create operations-specific landing proof.',
    'Refresh audit funnel messaging for workflow-led use cases.',
    'Track conversion against generic funnel over two weeks.'
  )
) where id = 'rec-market-shift-onboarding';

update public.recommendations set metadata = metadata || jsonb_build_object(
  'issue', 'Enterprise prospects stall on rollout risk during procurement.',
  'expected_impact', 'Reduce procurement friction and improve close rates on larger deals.',
  'likely_causes', jsonb_build_array(
    'No fixed-scope onboarding package exists today.',
    'Procurement teams do not see a clear time-to-value commitment.'
  ),
  'recommended_actions', jsonb_build_array(
    'Package implementation as a fixed-scope offer.',
    'Provide named onboarding contact for first 90 days.'
  )
) where id = 'rec-enterprise-onboarding-bundle';

update public.recommendations set metadata = metadata || jsonb_build_object(
  'issue', 'Manual seat provisioning is still a trial-to-paid blocker for multi-seat teams.',
  'expected_impact', 'Lift conversion for multi-seat prospects with low engineering effort.',
  'likely_causes', jsonb_build_array(
    'Seat creation still depends on support intervention.',
    'No self-serve growth path exists mid-trial.'
  ),
  'recommended_actions', jsonb_build_array(
    'Build a self-serve invite flow.',
    'Let trial admins add seats instantly.'
  )
) where id = 'rec-self-serve-team-invites';

-- ---------------------------------------------------------------------------
-- 2. Missing RLS SELECT policies
-- ---------------------------------------------------------------------------

-- Recommendations are a global catalog; any authenticated user may read them.
drop policy if exists "recommendations_select_authenticated" on public.recommendations;
create policy "recommendations_select_authenticated"
  on public.recommendations
  for select
  to authenticated
  using (true);

-- Recommendation accuracy is aggregate (non-user-identifying); readable by any
-- authenticated user.
drop policy if exists "recommendation_accuracy_select_authenticated" on public.recommendation_accuracy;
create policy "recommendation_accuracy_select_authenticated"
  on public.recommendation_accuracy
  for select
  to authenticated
  using (true);

-- Module snapshots: readable if global (no org) or the user belongs to the org.
drop policy if exists "module_snapshots_select_member" on public.module_snapshots;
create policy "module_snapshots_select_member"
  on public.module_snapshots
  for select
  to authenticated
  using (
    organization_id is null
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = public.module_snapshots.organization_id
        and m.user_id = auth.uid()
    )
  );
