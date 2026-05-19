import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

type Txn = {
  amount: number;
  current_value: number | null;
  created_at: string;
  razorpay_payment_id?: string | null;
  plan_name?: string | null;
  status?: string | null;
  type?: string | null;
};

type Holding = {
  key: string;
  name: string;
  monthlyAmount: number | null;
  totalInvested: number;
  currentValue: number;
  months: number;
  returnPercent: number;
  monthlyData: number[];
  isOther?: boolean;
  txns: Txn[];
};

const STANDARD_PLANS: { amount: number; name: string }[] = [
  { amount: 100, name: "Stability SIP" },
  { amount: 500, name: "Starter SIP" },
  { amount: 1000, name: "Growth SIP" },
  { amount: 2500, name: "Power SIP" },
  { amount: 5000, name: "Premium SIP" },
  { amount: 10000, name: "Growth Booster SIP" },
];

const Portfolio = () => {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Holding | null>(null);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("amount, current_value, plan_name, created_at, status, type, razorpay_payment_id")
        .eq("user_id", user.id)
        .eq("status", "success")
        .order("created_at", { ascending: true });

      if (txError) {
        setLoading(false);
        return;
      }

      const { data: creditsData } = await supabase
        .from("daily_interest_credits")
        .select("amount")
        .eq("user_id", user.id);

      const interest = (creditsData || []).reduce(
        (s, c) => s + Number(c.amount || 0),
        0
      );
      setTotalInterest(interest);

      const data = txData || [];

      if (!data.length) {
        setHoldings([]);
        setLoading(false);
        return;
      }

      const groups = new Map<
        string,
        {
          name: string;
          monthlyAmount: number | null;
          txns: Txn[];
          isOther: boolean;
        }
      >();

      for (const t of data) {
        const amt = Number(t.amount);
        const std = STANDARD_PLANS.find((p) => p.amount === amt);

        if (std) {
          const k = `std_${std.amount}`;
          if (!groups.has(k)) {
            groups.set(k, {
              name: std.name,
              monthlyAmount: std.amount,
              txns: [],
              isOther: false,
            });
          }
          groups.get(k)!.txns.push({
            amount: Number(t.amount),
            current_value: t.current_value,
            created_at: t.created_at,
            razorpay_payment_id: t.razorpay_payment_id || null,
            plan_name: t.plan_name || null,
            status: t.status || null,
            type: t.type || null,
          });
        } else {
          const k = "other";
          if (!groups.has(k)) {
            groups.set(k, {
              name: "Other",
              monthlyAmount: null,
              txns: [],
              isOther: true,
            });
          }
          groups.get(k)!.txns.push({
            amount: Number(t.amount),
            current_value: t.current_value,
            created_at: t.created_at,
            razorpay_payment_id: t.razorpay_payment_id || null,
            plan_name: t.plan_name || null,
            status: t.status || null,
            type: t.type || null,
          });
        }
      }

      const totalInvestedAll = data.reduce(
        (s, t) => s + Number(t.amount || 0),
        0
      );

      const now = Date.now();
      // Time-weighted: each txn contributes amount * days_invested
      const txnWeight = (t: Txn) => {
        const days = Math.max(
          1,
          Math.floor((now - new Date(t.created_at).getTime()) / 86400000)
        );
        return Number(t.amount) * days;
      };
      const totalWeight = data.reduce((s, t) => s + txnWeight(t), 0);

      const result: Holding[] = Array.from(groups.entries()).map(
        ([key, g]) => {
          let cum = 0;
          const monthlyData: number[] = [];
          let invested = 0;
          let weightSum = 0;

          for (const t of g.txns) {
            const a = Number(t.amount);
            invested += a;
            cum += a;
            monthlyData.push(cum);
            weightSum += txnWeight(t);
          }

          const interestShare =
            totalWeight > 0 ? (weightSum / totalWeight) * totalInterest : 0;

          const currentValue = invested + interestShare;

          const ret =
            invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;

          // Distribute interest to each txn by its own weight (within group)
          const txnsWithValue = g.txns.map((t) => {
            const w = txnWeight(t);
            const share = weightSum > 0 ? (w / weightSum) * interestShare : 0;
            return {
              ...t,
              current_value: Number(t.amount) + share,
            };
          });

          return {
            key,
            name: g.name,
            monthlyAmount: g.monthlyAmount,
            totalInvested: invested,
            currentValue,
            months: g.txns.length,
            returnPercent: Number(ret.toFixed(1)),
            monthlyData,
            isOther: g.isOther,
            txns: txnsWithValue,
          };
        }
      );

      result.sort((a, b) => {
        if (a.isOther) return 1;
        if (b.isOther) return -1;
        return (a.monthlyAmount || 0) - (b.monthlyAmount || 0);
      });

      setHoldings(result);
      setLoading(false);
    };

    load();
  }, [navigate]);

  const totalInvested = holdings.reduce((s, h) => s + h.totalInvested, 0);
  const totalCurrent = totalInvested + totalInterest;
  const totalReturn = totalCurrent - totalInvested;
  const totalReturnPercent =
    totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(1) : "0.0";
  const isPositive = totalReturn >= 0;

  const MiniChart = ({
    data,
    positive,
  }: {
    data: number[];
    positive: boolean;
  }) => {
    if (data.length < 2) {
      return (
        <div className="h-10 flex items-end">
          <div
            className={`w-full h-6 rounded-sm ${
              positive ? "gradient-primary" : "bg-destructive"
            } opacity-40`}
          />
        </div>
      );
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="h-10 flex items-end gap-[2px]">
        {data.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm transition-all ${
              positive ? "gradient-primary" : "bg-destructive"
            }`}
            style={{
              height: `${Math.max(((v - min) / range) * 100, 8)}%`,
              opacity: 0.4 + (i / data.length) * 0.6,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">Portfolio</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl space-y-5 animate-fade-in">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : holdings.length === 0 ? (
          <Card className="p-10 rounded-2xl text-center border-border">
            <p className="text-muted-foreground">
              Abhi tak koi successful investment nahi hai.
            </p>
            <Button
              className="mt-4 gradient-primary text-primary-foreground rounded-xl"
              onClick={() => navigate("/dashboard")}
            >
              Start Investing
            </Button>
          </Card>
        ) : (
          <>
            <Card className="p-6 rounded-2xl shadow-elevated border-border gradient-primary text-primary-foreground">
              <p className="text-sm opacity-80">Total Portfolio Value</p>
              <p className="text-3xl font-bold mt-1">
                ₹{totalCurrent.toLocaleString()}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                <span className="opacity-80">
                  Invested: ₹{totalInvested.toLocaleString()}
                </span>
                <span
                  className={`flex items-center gap-1 font-semibold ${
                    isPositive ? "text-green-200" : "text-red-200"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? "+" : ""}
                  ₹{totalReturn.toLocaleString()} ({totalReturnPercent}%)
                </span>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl shadow-card border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" /> Allocation
              </h3>
              <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
                {holdings.map((h, i) => {
                  const colors = [
                    "bg-primary",
                    "bg-accent",
                    "bg-green-500",
                    "bg-amber-500",
                    "bg-blue-500",
                    "bg-pink-500",
                    "bg-muted-foreground",
                  ];
                  return (
                    <div
                      key={h.key}
                      className={`h-full ${colors[i % colors.length]} transition-all`}
                      style={{
                        width: `${totalCurrent > 0 ? (h.currentValue / totalCurrent) * 100 : 0}%`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {holdings.map((h, i) => {
                  const dotColors = [
                    "bg-primary",
                    "bg-accent",
                    "bg-green-500",
                    "bg-amber-500",
                    "bg-blue-500",
                    "bg-pink-500",
                    "bg-muted-foreground",
                  ];
                  return (
                    <span
                      key={h.key}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          dotColors[i % dotColors.length]
                        }`}
                      />
                      {h.name} (
                      {totalCurrent > 0
                        ? ((h.currentValue / totalCurrent) * 100).toFixed(0)
                        : "0"}
                      %)
                    </span>
                  );
                })}
              </div>
            </Card>

            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" /> Active SIPs (
                {holdings.length})
              </h3>
              <div className="space-y-3">
                {holdings.map((h) => {
                  const gain = h.currentValue - h.totalInvested;
                  const pos = gain >= 0;

                  return (
                    <Card
                      key={h.key}
                      onClick={() => setSelected(h)}
                      className="p-4 rounded-2xl shadow-card border-border hover:shadow-elevated transition-shadow cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-foreground">{h.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {h.isOther
                              ? `${h.months} custom payments`
                              : `₹${h.monthlyAmount?.toLocaleString()}/mo · ${h.months} ${
                                  h.months === 1 ? "month" : "months"
                                }`}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                            pos
                              ? "text-green-500 bg-green-500/10"
                              : "text-destructive bg-destructive/10"
                          }`}
                        >
                          {pos ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {pos ? "+" : ""}
                          {h.returnPercent}%
                        </span>
                      </div>

                      <MiniChart data={h.monthlyData} positive={pos} />

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Invested</p>
                          <p className="text-sm font-bold text-foreground">
                            ₹{h.totalInvested.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Current</p>
                          <p className="text-sm font-bold text-foreground">
                            ₹{h.currentValue.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Returns</p>
                          <p
                            className={`text-sm font-bold ${
                              pos ? "text-green-500" : "text-destructive"
                            }`}
                          >
                            {pos ? "+" : ""}
                            ₹{gain.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-secondary">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Invested</p>
                    <p className="text-sm font-bold text-foreground">
                      ₹{selected.totalInvested.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Current</p>
                    <p className="text-sm font-bold text-foreground">
                      ₹{selected.currentValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Returns</p>
                    <p
                      className={`text-sm font-bold ${
                        selected.currentValue - selected.totalInvested >= 0
                          ? "text-green-500"
                          : "text-destructive"
                      }`}
                    >
                      {selected.returnPercent}%
                    </p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-foreground">
                  All Transactions ({selected.txns.length})
                </p>

                <div className="space-y-2">
                  {selected.txns.slice().reverse().map((t, i) => {
                    const cv = Number(t.current_value || t.amount);
                    const gain = cv - Number(t.amount);
                    const pos = gain >= 0;

                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-border flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            ₹{Number(t.amount).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {t.razorpay_payment_id && (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[180px]">
                              {t.razorpay_payment_id}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            ₹{cv.toLocaleString()}
                          </p>
                          <p
                            className={`text-[11px] font-semibold ${
                              pos ? "text-green-500" : "text-destructive"
                            }`}
                          >
                            {pos ? "+" : ""}
                            ₹{gain.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Portfolio;
