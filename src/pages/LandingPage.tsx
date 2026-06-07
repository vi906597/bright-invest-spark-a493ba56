import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, ArrowRight, ShieldCheck, TrendingUp, Wallet, Smartphone, Zap, BarChart3,
  CheckCircle2, Star, Users, Award, Lock, HeadphonesIcon, ChevronDown, Sparkles,
  X, Calculator, FolderOpen, Info, Briefcase, Newspaper, Mail, FileText, Shield,
  PiggyBank, Landmark, Percent, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const LandingPage = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");

  const features = [
    { icon: TrendingUp, title: "Smart SIP", desc: "AI-driven SIP recommendations matched to your goals & risk." },
    { icon: ShieldCheck, title: "SEBI Registered", desc: "100% compliant, regulated and bank-grade secure platform." },
    { icon: Zap, title: "Instant Invest", desc: "Start investing in under 60 seconds. No paperwork needed." },
    { icon: Wallet, title: "Zero Commission", desc: "Direct mutual fund plans. Save up to 1.5% more every year." },
    { icon: BarChart3, title: "Live Tracking", desc: "Real-time portfolio insights with beautiful analytics." },
    { icon: Smartphone, title: "Mobile First", desc: "Smooth, modern app experience built for India." },
  ];

  const steps = [
    { n: "01", title: "Sign Up Free", desc: "Create your account with email in just 30 seconds." },
    { n: "02", title: "Pick a Fund", desc: "Browse top performing mutual funds curated for you." },
    { n: "03", title: "Start SIP", desc: "Invest from ₹10. Auto-debit every month. Sit back." },
    { n: "04", title: "Grow Wealth", desc: "Track returns live and compound your money smartly." },
  ];

  const funds = [
    { name: "Bluechip Growth", cat: "Large Cap", ret: "16.8%", risk: "Moderate", color: "from-blue-500 to-indigo-600" },
    { name: "Tech Pioneers", cat: "Sectoral", ret: "22.4%", risk: "High", color: "from-purple-500 to-pink-600" },
    { name: "Balanced Wealth", cat: "Hybrid", ret: "12.3%", risk: "Low", color: "from-green-500 to-emerald-600" },
    { name: "Smallcap Star", cat: "Small Cap", ret: "28.1%", risk: "High", color: "from-orange-500 to-red-600" },
  ];

  const testimonials = [
    { name: "Rohan Mehta", role: "Software Engineer", text: "Started with ₹500/month. In 3 years my SIP has grown 22%. Best app I've used.", rating: 5 },
    { name: "Priya Sharma", role: "Doctor", text: "Zypeus made investing feel as easy as ordering food. Love the clean dashboard.", rating: 5 },
    { name: "Arjun Verma", role: "Business Owner", text: "Zero commission and real-time insights — switched all my SIPs here.", rating: 5 },
  ];

  const faqs = [
    { q: "What is the minimum SIP amount?", a: "You can start a SIP with as little as ₹10 per month on Zypeus." },
    { q: "Is Zypeus safe and regulated?", a: "Yes, Zypeus is SEBI registered and uses 256-bit bank-grade encryption to keep your money and data fully secure." },
    { q: "Are there any hidden charges?", a: "No. We offer 100% direct mutual fund plans with zero commission and no hidden fees." },
    { q: "Can I withdraw my money anytime?", a: "Yes, except for ELSS funds (3-year lock-in), you can redeem your investment anytime in 1-3 business days." },
    { q: "How do I track my returns?", a: "Your dashboard updates in real-time with NAV, XIRR and absolute returns for every SIP." },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/40">
        <button onClick={goAuth} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-primary text-primary-foreground font-bold shadow-elevated">Z</div>
          <span className="font-semibold text-foreground text-base tracking-tight">Zypeus</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hidden sm:inline">SEBI Registered</span>
          <Button onClick={goAuth} className="hidden md:inline-flex h-9 rounded-full gradient-primary text-primary-foreground px-5">
            Get Started
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
                    {[
                      { label: "Smart SIP", icon: TrendingUp },
                      { label: "Mutual Funds", icon: BarChart3 },
                      { label: "Portfolio", icon: FolderOpen },
                      { label: "Calculator", icon: Calculator },
                    ].map((item) => (
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Why SIP</h4>
                  <div className="space-y-1">
                    {[
                      { label: "Start from ₹10 / month", icon: PiggyBank },
                      { label: "Power of compounding", icon: TrendingUp },
                      { label: "Tax benefit u/s 80C", icon: Landmark },
                      { label: "Zero commission direct plans", icon: Percent },
                    ].map((item) => (
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Company</h4>
                  <div className="space-y-1">
                    {[
                      { label: "About", icon: Info },
                      { label: "Careers", icon: Briefcase },
                      { label: "Press", icon: Newspaper },
                      { label: "Contact", icon: Mail },
                    ].map((item) => (
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
                    {[
                      { label: "Privacy", icon: Shield },
                      { label: "Terms", icon: FileText },
                      { label: "Disclosures", icon: FileText },
                      { label: "Grievance", icon: Mail },
                    ].map((item) => (
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
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
              <button key={s.l} onClick={goAuth} className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-card hover:shadow-elevated transition-all text-center">
                <div className="text-xl md:text-2xl font-extrabold text-primary">{s.v}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-1">{s.l}</div>
              </button>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-muted-foreground flex-wrap text-xs">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> SEBI Regulated</div>
            <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-500" /> 256-bit SSL</div>
            <div className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> ISO Certified</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Why Zypeus</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Built for smarter <span className="text-primary">investing</span></h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Everything you need to start, grow and track your wealth — beautifully designed for Indians.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-elevated">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Start in <span className="text-primary">4 simple steps</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="relative bg-card border border-border rounded-2xl p-6">
                <div className="absolute -top-4 left-6 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold tracking-wider">{s.n}</div>
                <h3 className="text-lg font-semibold mt-3 mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Funds */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Top Funds</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Trending mutual funds</h2>
            </div>
            <Button onClick={goAuth} variant="outline" className="rounded-full">View All <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {funds.map((f) => (
              <button key={f.name} onClick={goAuth} className="text-left bg-card border border-border rounded-2xl overflow-hidden hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className={`h-24 bg-gradient-to-br ${f.color} relative`}>
                  <Sparkles className="absolute top-3 right-3 w-5 h-5 text-white/70" />
                  <div className="absolute bottom-3 left-4 text-white/90 text-xs uppercase tracking-wider">{f.cat}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold mb-2">{f.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">3Y Return</div>
                      <div className="text-green-600 font-bold">{f.ret}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Risk</div>
                      <div className="font-medium">{f.risk}</div>
                    </div>
                  </div>
                  <Button onClick={goAuth} className="w-full mt-4 h-9 rounded-xl gradient-primary text-primary-foreground text-xs">Invest Now</Button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Why Choose Zypeus</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Investing made <span className="text-primary">effortless</span></h2>
            <div className="space-y-4">
              {[
                "100% paperless onboarding in 60 seconds",
                "Direct mutual fund plans — zero commission",
                "Smart SIP suggestions based on your goals",
                "Real-time portfolio analytics & insights",
                "24x7 customer support in your language",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
            <Button onClick={goAuth} className="mt-8 h-12 px-7 rounded-full gradient-primary text-primary-foreground font-semibold">
              Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, v: "5L+", l: "Happy Investors" },
              { icon: TrendingUp, v: "₹2000Cr", l: "Wealth Created" },
              { icon: Award, v: "4.8★", l: "App Store Rating" },
              { icon: HeadphonesIcon, v: "24/7", l: "Customer Support" },
            ].map((s) => (
              <div key={s.l} className="bg-card border border-border rounded-2xl p-6 text-center shadow-card">
                <div className="w-12 h-12 rounded-xl gradient-primary mx-auto mb-3 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-2xl font-extrabold">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Loved by <span className="text-primary">5 lakh+</span> investors</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Got questions?</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-2xl px-5">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl gradient-primary p-10 md:p-16 text-center shadow-elevated">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 text-primary-foreground">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Start your wealth journey today</h2>
            <p className="opacity-90 max-w-xl mx-auto mb-8">Join 5 lakh+ Indians building their dreams with smart SIPs. Get started in 60 seconds — completely free.</p>
            <Button onClick={goAuth} className="h-12 px-8 rounded-full bg-white text-primary hover:bg-white/90 font-bold">
              Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <button onClick={goAuth} className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center shadow-elevated">Z</div>
              <span className="font-semibold tracking-tight">Zypeus</span>
            </button>
            <p className="text-xs text-muted-foreground">Smart SIPs and mutual fund investments for every Indian.</p>
          </div>
          {[
            { h: "Product", l: ["Smart SIP", "Mutual Funds", "Portfolio", "Calculator"] },
            { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
            { h: "Legal", l: ["Privacy", "Terms", "Disclosures", "Grievance"] },
          ].map((c) => (
            <div key={c.h}>
              <h4 className="font-semibold text-sm mb-3">{c.h}</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {c.l.map((i) => (
                  <li key={i}><button onClick={goAuth} className="hover:text-foreground">{i}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-3">
          <div>© {new Date().getFullYear()} Zypeus. All rights reserved.</div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> SEBI Registered · 256-bit Secure</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
