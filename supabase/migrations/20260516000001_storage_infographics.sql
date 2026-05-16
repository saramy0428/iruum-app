-- Storage bucket for generated PDF infographics.
-- Private bucket: clients never read directly. Server (service role) writes
-- PDFs here and hands out signed URLs scoped to the requesting result.

insert into storage.buckets (id, name, public)
values ('infographics', 'infographics', false)
on conflict (id) do nothing;

-- No RLS policies on storage.objects for this bucket.
-- Service role bypasses RLS, and there is no public read path by design.
-- Signed URLs (created in /api/render-pdf) are the only access path for clients.
