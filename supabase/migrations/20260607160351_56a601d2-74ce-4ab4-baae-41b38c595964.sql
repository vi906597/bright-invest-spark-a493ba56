
-- Revoke direct EXECUTE on has_role from anon/authenticated; only RLS policies (run as table owner) need it
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Add DELETE policy on kyc-documents storage bucket
DROP POLICY IF EXISTS "Users delete own kyc docs" ON storage.objects;
CREATE POLICY "Users delete own kyc docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
