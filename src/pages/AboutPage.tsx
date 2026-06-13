import { useNavigate } from "react-router-dom";
import {
  Menu, ArrowRight, TrendingUp, BarChart3, FolderOpen, Calculator,
  ShieldCheck, Zap, Users, Award, Globe, Mail, FileText, Shield,
  Briefcase, Newspaper, Info, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const AboutPage = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");
  const goHome = () => navigate("/");

  const products = [
    { icon: TrendingUp, title: "Smart SIP", desc: "AI-driven SIP recommendations matched to your goals and risk appetite." },
    { icon: BarChart3, title: "Mutual Funds", desc: "Access top-performing direct mutual funds with zero commission." },
    { icon: FolderOpen, title: "Portfolio", desc: "Real-time portfolio tracking with beautiful analytics and insights." },
    { icon: Calculator, title: "Calculator", desc: "Plan your wealth with our advanced SIP and returns calculator." },
  ];

  const companyLinks = [
    { label: "About", icon: Info },
    { label: "Careers", icon: Briefcase },
    { label: "Press", icon: Newspaper },
    { label: "Contact", icon: Mail },
  ];

  const legalLinks = [
    { label: "Privacy", icon: Shield },
    { label: "Terms", icon: FileText },
    { label: "Disclosures", icon: FileText },
    { label: "Grievance", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/40">
        <button onClick={goHome} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-primary text-primary-foreground font-bold shadow-elevated">Z</div>
          <span className="font-semibold text-foreground text-base tracking-tight">Zypeus</span>
        </button>
        <div className="flex items-center gap-3">
          <Button onClick={goAuth} className="hidden md:inline-flex h-9 rounded-full gradient-primary text-primary-foreground px-5">
            Create Free Account
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <button aria-label="Open menu" className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
                <Menu className="w-7 h-7" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0">
              <SheetHeader className="p-6 pb-4 border-b border-border">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-primary text-primary-foreground font-bold shadow-elevated">Z</div>
                  <span className="font-semibold text-foreground text-base tracking-tight">Zypeus</span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
                  <div className="space-y-1">
                    {products.map((item) => (
                      <button
                        key={item.title}
                        onClick={goAuth}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Company</h4>
                  <div className="space-y-1">
                    {companyLinks.map((item) => (
                      <button
                        key={item.label}
                        onClick={goAuth}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
                  <div className="space-y-1">
                    {legalLinks.map((item) => (
                      <button
                        key={item.label}
                        onClick={goAuth}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <Button onClick={goAuth} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
                    Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 md:pt-40 pb-16">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl gradient-primary pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-hero pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-[11px] md:text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
            About Zypeus
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Smart SIPs and mutual fund investments for every <span className="text-primary">Indian</span>.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Zypeus is on a mission to make wealth-building simple, transparent, and accessible to every Indian investor — from first-timers to seasoned pros.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={goAuth} className="h-12 px-7 rounded-full gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-90">
              Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { v: "2.4L+", l: "Active SIPs" },
            { v: "₹1200 Cr", l: "Assets Under Management" },
            { v: "14.2%", l: "Avg. Annual Returns" },
          ].map((s) => (
            <div key={s.l} className="bg-card border border-border rounded-2xl p-5 shadow-card text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">What We Offer</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Everything you need to <span className="text-primary">grow wealth</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p.title} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-elevated">
                  <p.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Trust Zypeus */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Why Trust Zypeus</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Built on <span className="text-primary">trust & transparency</span></h2>
            <div className="space-y-4">
              {[
                "SEBI registered and fully compliant platform",
                "Bank-grade 256-bit SSL encryption for all data",
                "Zero commission direct mutual fund plans",
                "100% paperless onboarding in under 60 seconds",
                "24×7 customer support in your preferred language",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, title: "SEBI Regulated", desc: "Fully compliant" },
              { icon: Zap, title: "Instant Setup", desc: "Under 60 seconds" },
              { icon: Users, title: "2.4L+ Users", desc: "Growing daily" },
              { icon: Award, title: "ISO Certified", desc: "Global standards" },
            ].map((b) => (
              <div key={b.title} className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-card transition-all">
                <b.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-semibold text-sm">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Ready to start your wealth journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join over 2.4 lakh Indians investing smarter with Zypeus. No paperwork, no hidden fees.</p>
          <Button onClick={goAuth} className="h-12 px-8 rounded-full gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-90">
            Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-primary text-primary-foreground font-bold shadow-elevated">Z</div>
                <span className="font-semibold text-foreground text-base tracking-tight">Zypeus</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart SIPs and mutual fund investments for every Indian.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Smart SIP", "Mutual Funds", "Portfolio", "Calculator"].map((l) => (
                  <li key={l}>
                    <button onClick={goAuth} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Careers", "Press", "Contact"].map((l) => (
                  <li key={l}>
                    <button onClick={goAuth} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy", "Terms", "Disclosures", "Grievance"].map((l) => (
                  <li key={l}>
                    <button onClick={goAuth} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Zypeus. All rights reserved.</p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span className="text-xs">Made for India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
