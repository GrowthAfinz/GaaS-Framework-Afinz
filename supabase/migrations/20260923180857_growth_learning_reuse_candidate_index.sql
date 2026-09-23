-- Covers the Release 6 action-candidate foreign key and candidate audit lookups.
create index growth_learning_applications_candidate_idx
  on public.growth_learning_applications(action_candidate_id, created_at desc);
