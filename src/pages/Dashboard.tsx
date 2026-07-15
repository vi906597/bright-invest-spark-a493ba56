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

const REDIRECT_URL = "https://instant-pay-wait.lovable.app";

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
  const [stats, setStats] = useState({
    invested: 0,
    currentValue: 0,
    activeSips: 0,
    todayInterest: 0,
    totalInterest: 0,
  });

  const loadStats = async (uid: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("amount, current_value, status, type, plan_name")
      .eq("user_id", uid);

    const today = new Date().toISOString().split("T")[0];

    const { data: credits } = await supabase
      .from("daily_interest_credits")
      .select("amount, credit_date")
      .eq("user_id", uid);

    const txs = data || [];

    const invested = txs
      .filter((t) => {
        const type = (t.type || "").toLowerCase().trim();
        const status = (t.status || "").toLowerCase().trim();
        return (
          status === "success" &&
          (type === "sip" || type === "deposit" || type === "credit")
        );
      })
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const withdrawn = txs
      .filter((t) => (t.type || "").toLowerCase().trim() === "withdraw")
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);

    const todayInterest = (credits || [])
      .filter((c) => c.credit_date === today)
      .reduce((s, c) => s + Number(c.amount || 0), 0);

    const totalInterest = (credits || [])
      .reduce((s, c) => s + Number(c.amount || 0), 0);

    const activeSips = new Set(
      txs
        .filter((t) => (t.type || "").toLowerCase().trim() === "sip")
        .map((t) => t.plan_name)
    ).size;

    setStats({
      invested: invested - withdrawn,
      currentValue: invested + totalInterest - withdrawn,
      activeSips,
      todayInterest,
      totalInterest,
    });
  };

  React.useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/");
        return;
      }

      setUserId(authUser.id);
      setUserName(
        authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "Investor"
      );

      await loadStats(authUser.id);
    };

    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openUpiPay = (amount: number, planName: string) => {
    setPayAmount(amount);
    setPayPlan(planName);
    setPayOpen(true);
  };

  const handlePayment = () => {
    const plan = sipPlans.find((p) => p.id === selectedPlan);
    if (!plan) return;
    openUpiPay(plan.amount, plan.name);
  };

  const handleCustomPay = () => {
    const amt = parseInt(customAmount);
    if (!amt || amt < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum SIP amount is ₹10",
        variant: "destructive",
      });
      return;
    }
    openUpiPay(amt, "Custom SIP");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">
              ZY<span className="text-blue-800">PEUS</span>
            </h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="rounded-xl text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 max-w-5xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">
            Hello, <span className="text-primary">{userName}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Start your wealth creation journey with monthly SIP
          </p>
        </div>

        {stats.todayInterest > 0 && (
          <Card className="p-4 mb-4 rounded-2xl border-2 border-green-500/30 bg-green-500/5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Today interest amount 🎉</p>
                  <p className="text-xl font-bold text-green-500">
                    +₹{stats.todayInterest.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total interest</p>
                <p className="text-sm font-semibold text-green-500">
                  ₹{stats.totalInterest.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Invested",
              value: `₹${stats.invested.toLocaleString()}`,
              icon: IndianRupee,
              color: "text-primary",
            },
            {
              label: "Current Value",
              value: `₹${stats.currentValue.toLocaleString()}`,
              icon: TrendingUp,
              color: "text-green-500",
            },
            {
              label: "Active SIPs",
              value: String(stats.activeSips),
              icon: Calendar,
              color: "text-accent",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="p-5 rounded-2xl shadow-card border-border hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Monthly SIP Plans
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sipPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative p-6 rounded-2xl cursor-pointer transition-all border-2 hover:shadow-elevated ${
                  selectedPlan === plan.id
                    ? "border-primary shadow-elevated"
                    : "border-transparent shadow-card"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <span className="absolute top-3 right-3 text-xs font-semibold gradient-primary text-primary-foreground px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-primary">
                        ₹{plan.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayment();
                    }}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <input
                type="number"
                placeholder="Enter amount (min ₹10)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min={10}
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              className="h-12 px-6 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90"
              onClick={handleCustomPay}
            >
              Pay <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>
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
