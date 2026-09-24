-- Phase 1: close Supabase security-advisor gaps and add booking query indexes.

alter function public.touch_test_suite_updated_at()
  set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_workspace_project(text, text) from public, anon, authenticated;

create index if not exists appointments_service_id_idx
  on public.appointments(service_id);

create index if not exists appointments_business_start_at_idx
  on public.appointments(business_id, start_at);
