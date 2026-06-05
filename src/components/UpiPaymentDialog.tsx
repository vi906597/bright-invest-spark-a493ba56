import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Clock, CheckCircle2, Download } from "lucide-react";
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
  const [qrLoaded, setQrLoaded] = useState(false);

  React.useEffect(() => {
    if (open) setQrLoaded(false);
  }, [open, amount, planName]);

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

  const downloadQr = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zypeus-qr-${amount}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
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
                <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                  {!qrLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg z-10 animate-fade-in">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Loader2 className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 font-medium">Generating QR...</p>
                      <div className="flex gap-1 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <img
                    src={qrUrl}
                    alt="UPI QR"
                    onLoad={() => setQrLoaded(true)}
                    className={`w-full h-full rounded-lg transition-opacity duration-500 ${qrLoaded ? "opacity-100 animate-scale-in" : "opacity-0"}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQr}
                className="rounded-full gap-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Save QR to Phone
              </Button>
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
