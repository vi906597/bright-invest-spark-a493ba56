import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, ArrowDownLeft, ArrowUpRight, Search, Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

type Item = {
  id: string;
  created_at: string;
  plan_name: string;
  amount: number;
  status: string;
  type: string; // sip, deposit, withdraw, interest
  razorpay_payment_id: string | null;
  returns_amount: number | null;
  current_value: number | null;
};

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  success: { icon: CheckCircle2, label: "Success", className: "text-green-500 bg-green-500/10" },
  failed: { icon: XCircle, label: "Failed", className: "text-destructive bg-destructive/10" },
  pending: { icon: Clock, label: "Pending", className: "text-amber-500 bg-amber-500/10" },
};
const defaultStatus = { icon: Clock, label: "Unknown", className: "text-muted-foreground bg-secondary" };
const normStatus = (s: string) => (s || "").toLowerCase();
const isOutflow = (t: Item) => t.type === "withdraw" || t.type === "withdrawal";
const isInvest = (t: Item) => t.type === "sip" || t.type === "deposit";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      const [txRes, crRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, created_at, plan_name, amount, status, type, razorpay_payment_id, returns_amount, current_value")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("daily_interest_credits")
          .select("id, amount, credit_date, note, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      const txs: Item[] = (txRes.data || []).map((t: any) => ({ ...t, status: normStatus(t.status) }));
      const credits: Item[] = (crRes.data || []).map((c: any) => ({
        id: c.id,
        created_at: c.created_at || c.credit_date,
        plan_name: c.note || "Daily Interest",
        amount: Number(c.amount),
        status: "success",
        type: "interest",
        razorpay_payment_id: null,
        returns_amount: null,
        current_value: null,
      }));
      const merged = [...txs, ...credits].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setItems(merged);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const filtered = items.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.plan_name.toLowerCase().includes(q) && !(t.razorpay_payment_id || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const successInvest = items.filter(t => t.status === "success" && isInvest(t));
  const successWithdraw = items.filter(t => t.status === "success" && isOutflow(t));
  const interestPaid = items.filter(t => t.type === "interest").reduce((s, t) => s + Number(t.amount), 0);
  const totalInvested = Math.max(0,
    successInvest.reduce((s, t) => s + Number(t.amount), 0) -
    successWithdraw.reduce((s, t) => s + Number(t.amount), 0)
  );
  const totalReturns = successInvest.reduce((s, t) => s + Number(t.returns_amount || 0), 0) + interestPaid;
  const currentValue = totalInvested + totalReturns;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">Transactions</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl space-y-5 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 rounded-2xl shadow-card">
            <p className="text-[10px] text-muted-foreground">Invested</p>
            <p className="text-lg font-bold text-primary">₹{totalInvested.toLocaleString()}</p>
          </Card>
          <Card className="p-4 rounded-2xl shadow-card">
            <p className="text-[10px] text-muted-foreground">Current Value</p>
            <p className="text-lg font-bold text-foreground">₹{currentValue.toLocaleString()}</p>
          </Card>
          <Card className="p-4 rounded-2xl shadow-card">
            <p className="text-[10px] text-muted-foreground">Returns</p>
            <p className={`text-lg font-bold flex items-center gap-1 ${totalReturns >= 0 ? "text-green-500" : "text-destructive"}`}>
              <TrendingUp className="w-3 h-3" />₹{totalReturns.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search plan or payment ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "success", "failed", "pending"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="p-8 rounded-2xl shadow-card text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-8 rounded-2xl shadow-card text-center">
              <p className="text-muted-foreground">
                {transactions.length === 0 ? "Abhi tak koi transaction nahi. Pehla SIP shuru karein!" : "No transactions found"}
              </p>
            </Card>
          ) : filtered.map(tx => {
            const sc = statusConfig[tx.status] || defaultStatus;
            const returns = Number(tx.returns_amount || 0);
            const wd = isWithdraw(tx);
            return (
              <Card key={tx.id} className="p-4 rounded-2xl shadow-card border-border hover:shadow-elevated transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${wd ? "bg-amber-500/10" : "bg-secondary"}`}>
                    {wd ? (
                      <ArrowUpRight className="w-5 h-5 text-amber-500" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground text-sm truncate">{tx.plan_name}</p>
                      <p className={`font-bold text-sm ${wd ? "text-amber-500" : "text-primary"}`}>
                        {wd ? "-" : "+"}₹{Number(tx.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.className}`}>
                        <sc.icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </div>
                    {returns !== 0 && (
                      <p className={`text-xs mt-1 font-medium ${returns >= 0 ? "text-green-500" : "text-destructive"}`}>
                        Returns: {returns >= 0 ? "+" : ""}₹{returns.toLocaleString()}
                      </p>
                    )}
                    {tx.razorpay_payment_id && (
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">{tx.razorpay_payment_id}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default TransactionHistory;
