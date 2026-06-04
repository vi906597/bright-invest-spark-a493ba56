
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS ifsc_code text,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'bank',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_by uuid,
  ADD COLUMN IF NOT EXISTS utr text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.withdrawals ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.withdrawals ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.withdrawals ALTER COLUMN user_id SET NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins update all withdrawals" ON public.withdrawals;

CREATE POLICY "Users view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all withdrawals" ON public.withdrawals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all withdrawals" ON public.withdrawals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS withdrawals_updated_at ON public.withdrawals;
CREATE TRIGGER withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
