import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const UPI_ID = "9065978244@upi";
const PAYEE_NAME = "ZYPEUS";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planName: string;
  onSubmitted?: () => void;
}

const UpiPaymentDialog = ({ open, onOpenChange, amount, planName, onSubmitted }: Props) => {
  const { toast } = useToast();
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE_NAME,
      am: String(amount),
      cu: "INR",
      tn: planName,
    });
    return `upi://pay?${params.toString()}`;
  }, [amount, planName]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiLink)}`;

  const reset = () => {
    setUtr("");
    setSubmitted(false);
    setBusy(false);
  };

  const handleSubmit = async () => {
    const trimmed = utr.trim();
    if (trimmed.length < 8) {
      toast({ title: "Invalid UTR", description: "Please enter a valid UTR / transaction ID", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please login first", variant: "destructive" });
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount,
      plan_name: planName,
      type: "sip",
      status: "pending",
      notes: `UPI UTR: ${trimmed} | Paid to ${UPI_ID}`,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>{submitted ? "Verification in progress" : `Pay ₹${amount.toLocaleString()}`}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-semibold">UTR submitted successfully</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /> Your payment will be verified within 24 hours
            </div>
            <Button onClick={() => onOpenChange(false)} className="rounded-xl mt-2">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl border-2 border-primary/20 bg-white shadow-lg">
                <img src={qrUrl} alt="UPI QR" className="w-64 h-64 sm:w-72 sm:h-72 rounded-lg" />
              </div>
            </div>

            <div className="text-sm text-center text-muted-foreground leading-relaxed">
              Scan with any UPI app (GPay, PhonePe, Paytm) and pay <b>₹{amount.toLocaleString()}</b>
            </div>

            <div>
              <label className="text-sm font-medium">UTR / Transaction ID</label>
              <Input
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 412345678901"
                className="mt-1 rounded-xl"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full rounded-xl gradient-primary text-primary-foreground font-semibold"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit UTR
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpiPaymentDialog;
