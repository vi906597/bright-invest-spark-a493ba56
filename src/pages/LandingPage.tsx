import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 py-5 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/40">
        <button onClick={goAuth} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-primary text-primary-foreground font-bold shadow-elevated">Z</div>
          <span className="font-semibold text-foreground text-base tracking-tight">Zypeus</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hidden sm:inline">SEBI Registered</span>
          <button onClick={goAuth} aria-label="Open menu" className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
            <Menu className="w-7 h-7" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-start justify-center pt-32 md:pt-40 pb-16">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl gradient-primary pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-hero pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-[11px] md:text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
            Smart SIP · Mutual Funds · Wealth Growth
          </p>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-none">
            Zy<span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">peus</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Invest your money smartly through SIPs in top mutual funds. A little every month, a lot in the future.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={goAuth} className="h-12 px-7 rounded-full gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-90">
              Start SIP Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button onClick={goAuth} variant="outline" className="h-12 px-7 rounded-full font-semibold">
              Learn More
            </Button>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-3 md:gap-5 max-w-2xl mx-auto">
            {[
              { v: "2.4L+", l: "Active SIPs" },
              { v: "₹1200 Cr", l: "Assets Under Management" },
              { v: "14.2%", l: "Avg. Annual Returns" },
            ].map((s) => (
              <button
                key={s.l}
                onClick={goAuth}
                className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-card hover:shadow-elevated transition-all text-center"
              >
                <div className="text-xl md:text-2xl font-extrabold text-primary">{s.v}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-1">{s.l}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
