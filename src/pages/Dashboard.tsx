import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  LogOut,
  IndianRupee,
  ArrowRight,
  Calendar,
  ChevronRight,
  Star,
  Zap,
  Shield,
  BarChart3,
  Leaf,
  Rocket,
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import UpiPaymentDialog from "@/components/UpiPaymentDialog";

const sipPlans = [
  { id: 1, name: "Stability SIP", amount: 100, returns: "8-12%", risk: "Low", icon: Shield, popular: false },
  { id: 2, name: "Starter SIP", amount: 500, returns: "12-15%", risk: "Low", icon: Leaf, popular: false },
  { id: 3, name: "Growth SIP", amount: 1000, returns: "15-18%", risk: "Medium", icon: TrendingUp, popular: true },
  { id: 4, name: "Power SIP", amount: 2500, returns: "18-22%", risk: "Medium-High", icon: Zap, popular: false },
  { id: 5, name: "Premium SIP", amount: 5000, returns: "20-25%", risk: "High", icon: Star, popular: false },
  { id: 6, name: "Growth Booster SIP", amount: 10000, returns: "23-28%", risk: "High", icon: Rocket, popular: false },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [userName, setUserName] = useState("Investor");
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payPlan, setPayPlan] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
  const [maturedList, setMaturedList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    walletBalance: 0,
    invested: 0,
    activeSips: 0,
  });

  const loadStats = async (uid: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, status, type, plan_name, created_at, notes")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    const txs = data || [];

    // Wallet = deposit + payout + refund − withdraw
    const walletCredits = txs
      .filter((t: any) => {
        const type = (t.type || "").toLowerCase().trim();
        const status = (t.status || "").toLowerCase().trim();
        return status === "success" && (type === "deposit" || type === "payout" || type === "refund" || type === "credit");
      })
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const withdrawn = txs
      .filter((t: any) => (t.type || "").toLowerCase().trim() === "withdraw")
      .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);

    const walletBalance = walletCredits - withdrawn;

    const invested = txs
      .filter((t: any) => (t.type || "").toLowerCase().trim() === "sip" && (t.status || "").toLowerCase().trim() === "success")
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const activeSips = txs.filter((t: any) => (t.type || "").toLowerCase().trim() === "sip" && (t.status || "").toLowerCase().trim() === "success").length;

    setStats({ walletBalance, invested, activeSips });

    // Active investments (sip + success + not yet claimed/cancelled)
    const active = txs.filter((t: any) => {
      const type = (t.type || "").toLowerCase().trim();
      const status = (t.status || "").toLowerCase().trim();
      return type === "sip" && status === "success";
    });
    setActiveInvestments(active);

    // Matured (claimed) & cancelled records
    const done = txs.filter((t: any) => {
      const type = (t.type || "").toLowerCase().trim();
      const status = (t.status || "").toLowerCase().trim();
      return type === "sip" && (status === "matured" || status === "cancelled");
    });
    setMaturedList(done);
  };


  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate("/"); return; }
      setUserId(authUser.id);
      setUserName(authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Investor");
      await loadStats(authUser.id);
    };
    getUser();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const openUpiPay = (amount: number, planName: string) => {
    setPayAmount(amount); setPayPlan(planName); setPayOpen(true);
  };

  const handlePayment = () => {
    const plan = sipPlans.find((p) => p.id === selectedPlan);
    if (!plan) return;
    openUpiPay(plan.amount, plan.name);
  };

  const handleCustomPay = () => {
    const amt = parseInt(customAmount);
    if (!amt || amt < 10) {
      toast({ title: "Invalid Amount", description: "Minimum SIP amount is ₹10", variant: "destructive" });
      return;
    }
    openUpiPay(amt, "Custom SIP");
  };

  const claimPayout = async (inv: any) => {
    const amt = Number(inv.amount);
    const payout = Math.round(amt * 1.4);
    const { error: e1 } = await supabase.from("transactions").update({ status: "matured" }).eq("id", inv.id);
    if (e1) return toast({ title: "Error", description: e1.message, variant: "destructive" });
    const { error: e2 } = await supabase.from("transactions").insert({
      user_id: userId,
      plan_name: `SIP Payout - ${inv.plan_name}`,
      amount: payout,
      type: "payout",
      status: "success",
      notes: `Matured payout for investment ${inv.id}`,
    });
    if (e2) return toast({ title: "Error", description: e2.message, variant: "destructive" });
    toast({ title: "Payout claimed 🎉", description: `₹${payout.toLocaleString()} added to your wallet` });
    loadStats(userId);
  };

  const cancelInvestment = async (inv: any) => {
    if (!confirm("Cancel this investment? You'll get only your principal amount back (no 40% profit).")) return;
    const amt = Number(inv.amount);
    const { error: e1 } = await supabase.from("transactions").update({ status: "cancelled" }).eq("id", inv.id);
    if (e1) return toast({ title: "Error", description: e1.message, variant: "destructive" });
    const { error: e2 } = await supabase.from("transactions").insert({
      user_id: userId,
      plan_name: `SIP Refund - ${inv.plan_name}`,
      amount: amt,
      type: "refund",
      status: "success",
      notes: `Cancelled investment ${inv.id} - principal refund`,
    });
    if (e2) return toast({ title: "Error", description: e2.message, variant: "destructive" });
    toast({ title: "Investment cancelled", description: `₹${amt.toLocaleString()} refunded to wallet` });
    loadStats(userId);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">ZY<span className="text-blue-800">PEUS</span></h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 max-w-5xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Hello, <span className="text-primary">{userName}</span> 👋</h1>
          <p className="text-muted-foreground mt-1">Grow your money with 40% return in 10 days</p>
        </div>

        {/* Wallet Balance - Prominent */}
        <Card className="p-5 mb-4 rounded-2xl border-2 border-primary/30 gradient-primary text-primary-foreground animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs opacity-90">Wallet Balance (Withdrawable)</p>
                <p className="text-3xl font-bold">₹{stats.walletBalance.toLocaleString()}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => navigate("/more")}>
              Withdraw <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-4 rounded-2xl shadow-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Invested (SIP)</p>
                <p className="text-xl font-bold mt-1 text-primary">₹{stats.invested.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-2xl shadow-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active SIPs</p>
                <p className="text-xl font-bold mt-1 text-accent">{stats.activeSips}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
            </div>
          </Card>
        </div>

        {activeInvestments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" /> Your Active Investments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeInvestments.map((inv) => {
                const amt = Number(inv.amount);
                const startMs = new Date(inv.created_at).getTime();
                const daysDone = Math.min(10, Math.floor((Date.now() - startMs) / 86400000));
                const daysLeft = Math.max(0, 10 - daysDone);
                const matured = daysLeft === 0;
                const maturityDate = new Date(startMs + 10 * 86400000);
                const payout = Math.round(amt * 1.4);
                const pct = (daysDone / 10) * 100;
                return (
                  <Card key={inv.id} className={`p-4 rounded-2xl border-2 ${matured ? "border-green-500/40 bg-green-500/5" : "border-primary/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-foreground text-sm">{inv.plan_name}</p>
                        <p className="text-xs text-muted-foreground">₹{amt.toLocaleString()} · {new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${matured ? "bg-green-500/15 text-green-600" : "bg-primary/15 text-primary"}`}>
                        {matured ? "Ready to claim ✓" : `Day ${daysDone}/10`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                      <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div className="rounded-lg bg-secondary px-2 py-1.5">
                        <p className="text-muted-foreground">Days Left</p>
                        <p className="font-bold text-foreground">{daysLeft} days</p>
                      </div>
                      <div className="rounded-lg bg-secondary px-2 py-1.5">
                        <p className="text-muted-foreground">Maturity</p>
                        <p className="font-bold text-foreground">{maturityDate.toLocaleDateString()}</p>
                      </div>
                      <div className="rounded-lg bg-green-500/10 px-2 py-1.5">
                        <p className="text-muted-foreground">Payout</p>
                        <p className="font-bold text-green-600">₹{payout.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {matured ? (
                        <Button size="sm" className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white" onClick={() => claimPayout(inv)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Claim ₹{payout.toLocaleString()}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => cancelInvestment(inv)}>
                          <XCircle className="w-4 h-4 mr-1" /> Cancel (refund ₹{amt.toLocaleString()})
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> SIP Plans · 40% Return in 10 Days
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sipPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative p-6 rounded-2xl cursor-pointer transition-all border-2 hover:shadow-elevated ${
                  selectedPlan === plan.id ? "border-primary shadow-elevated" : "border-transparent shadow-card"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <span className="absolute top-3 right-3 text-xs font-semibold gradient-primary text-primary-foreground px-3 py-1 rounded-full">Popular</span>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-primary">₹{plan.amount.toLocaleString()}</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                        <span className="text-xs font-semibold text-primary">40% Return in 10 Days</span>
                        <span className="text-xs text-muted-foreground">Risk: <span className="text-foreground font-medium">{plan.risk}</span></span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-secondary px-3 py-2">
                          <p className="text-muted-foreground">Profit (10d)</p>
                          <p className="font-bold text-green-500">+₹{(plan.amount * 0.4).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-secondary px-3 py-2">
                          <p className="text-muted-foreground">Total (10d)</p>
                          <p className="font-bold text-foreground">₹{(plan.amount * 1.4).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedPlan === plan.id && (
                  <Button
                    className="w-full mt-4 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90"
                    onClick={(e) => { e.stopPropagation(); handlePayment(); }}
                  >
                    Invest Now <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 rounded-2xl shadow-card border-border">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" /> Custom SIP Amount
          </h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
              <input
                type="number"
                placeholder="Enter amount (min ₹10)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min={10}
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button className="h-12 px-6 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90" onClick={handleCustomPay}>
              Pay <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Completed / Cancelled History */}
        {maturedList.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Completed Investments
            </h2>
            <div className="space-y-2">
              {maturedList.map((inv) => {
                const amt = Number(inv.amount);
                const status = (inv.status || "").toLowerCase();
                const isMatured = status === "matured";
                const payout = isMatured ? Math.round(amt * 1.4) : amt;
                return (
                  <Card key={inv.id} className={`p-4 rounded-2xl border ${isMatured ? "border-green-500/30 bg-green-500/5" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{inv.plan_name}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{amt.toLocaleString()} · {new Date(inv.created_at).toLocaleDateString()} · {isMatured ? "Matured (40% profit)" : "Cancelled (principal refund)"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isMatured ? "bg-green-500/15 text-green-600" : "bg-secondary text-muted-foreground"}`}>
                          {isMatured ? "Matured ✓" : "Cancelled"}
                        </span>
                        <p className={`text-sm font-bold mt-1 ${isMatured ? "text-green-600" : "text-foreground"}`}>+₹{payout.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">credited to wallet</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      <UpiPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={payAmount}
        planName={payPlan}
        onSubmitted={() => userId && loadStats(userId)}
      />
    </div>
  );
};

export default Dashboard;
