import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, Sparkles, Eye, EyeOff, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
}

const rand = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
const randAlnum = (len: number) => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

const EaishaCardDialog = ({ open, onOpenChange, userId, userEmail, userName, userPhone }: Props) => {
  const { toast } = useToast();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("eaisha_cards").select("*").eq("user_id", userId).maybeSingle();
      if (data) {
        setCard(data);
      } else {
        // Auto-generate unique card on first access
        const holder = userName || userEmail?.split("@")[0] || "User";
        const newCard = {
          user_id: userId,
          sip_account_number: rand(11),
          member_code: "EAI" + randAlnum(7),
          sip_id: rand(13),
          secret_code: rand(4),
          card_holder_name: holder,
          phone: userPhone || null,
          eaisha_amount: 100,
        };
        const { data: created, error } = await supabase.from("eaisha_cards").insert(newCard).select().single();
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          setCard(created);
        }
      }
      setLoading(false);
    })();
  }, [open, userId]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied ✓`, description: text });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md p-0 overflow-hidden bg-background">
        <DialogHeader className="px-5 pt-1 pb-1">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> ZYPEUS CARD
          </DialogTitle>
        </DialogHeader>

        {loading || !card ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="px-4 pb-5 space-y-3">
            {/* Flip card */}
            <div className="[perspective:1200px]">
              <div
                onClick={() => setFlipped((f) => !f)}
                className={`relative w-full aspect-[1.6/1] cursor-pointer transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
              >
                {/* FRONT */}
                <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-2xl shadow-lg overflow-hidden text-gray-900">
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-400" />
                  <div className="flex items-center justify-between px-4 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-lg font-bold leading-none">
                        ZY<span className="text-blue-600">PEUS</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Invest Your Money Using This Card</div>
                  </div>
                  <div className="h-0.5 bg-orange-500 mt-2" />

                  <div className="px-4 py-2.5">
                    <div className="text-base font-bold mb-1.5 truncate">{card.card_holder_name}</div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between border-b border-gray-100 pb-1"><span>🏦 SIP A/c</span><b>{card.sip_account_number}</b></div>
                      <div className="flex justify-between border-b border-gray-100 pb-1"><span>🆔 Code</span><b>{card.member_code}</b></div>
                      {card.phone && <div className="flex justify-between border-b border-gray-100 pb-1"><span>📱 Phone</span><b>+91 {card.phone}</b></div>}
                      <div className="flex justify-between border-b border-gray-100 pb-1"><span>💳 SIP ID</span><b>{card.sip_id}</b></div>
                      <div className="flex justify-between"><span>🔑 Secret</span><b>{showSecret ? card.secret_code : "••••"}</b></div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-r from-orange-500 via-white to-green-600" />
                </div>

                {/* BACK */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-2xl shadow-lg overflow-hidden text-gray-900">
                  <div className="h-3 bg-gradient-to-r from-orange-500 to-amber-400" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <h2 className="text-4xl font-extrabold tracking-wide">
                     
                      ZY<span className="text-blue-600">PEUS</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Scan QR for details</p>
                    <div className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-xl mt-3 flex items-center justify-center bg-white">
                      <img
                        alt="QR"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ sip: card.sip_account_number, code: card.member_code }))}`}
                        className="w-full h-full p-1 rounded-lg"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">Secure • Fast • Trusted</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-orange-500 via-white to-green-600" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setFlipped((f) => !f)} variant="outline" className="flex-1 rounded-xl text-xs">
                <RotateCw className="w-3 h-3 mr-1" /> Flip
              </Button>
              <Button onClick={() => setShowSecret((s) => !s)} variant="outline" className="flex-1 rounded-xl text-xs">
                {showSecret ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                {showSecret ? "Hide" : "Show"} Secret
              </Button>
            </div>

            <div className="space-y-1.5 text-xs">
              {[
                { label: "SIP A/c", value: card.sip_account_number },
                { label: "Member Code", value: card.member_code },
                { label: "SIP ID", value: card.sip_id },
              ].map((it) => (
                <button
                  key={it.label}
                  onClick={() => copy(it.value, it.label)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-secondary/50"
                >
                  <span className="text-muted-foreground">{it.label}</span>
                  <span className="flex items-center gap-2 font-mono font-medium">{it.value} <Copy className="w-3 h-3" /></span>
                </button>
              ))}
            </div>

            <p className="text-center text-[10px] text-muted-foreground">Tap card to flip • Keep your secret code safe</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EaishaCardDialog;
