import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Bell, Shield, CreditCard, FileText, HelpCircle,
  ChevronRight, LogOut, Star, Share2, Moon, Globe, Lock,
  Smartphone, MessageSquare, Info, Sparkles, Mail, Phone,
  CheckCircle, AlertCircle, Loader2, Download, Copy, ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import BottomNav from "@/components/BottomNav";
import KycDialog from "@/components/KycDialog";
import BankAccountsDialog from "@/components/BankAccountsDialog";
import EaishaCardDialog from "@/components/EaishaCardDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// 1) DialogKey me withdraw add karo
type DialogKey =
  | "personal" | "phone" | "kyc" | "bank" | "withdraw" | "security" | "card"
  | "watchlist" | "statements"
  | "language" | "applock"
  | "help" | "contact" | "refer" | "about"
  | null;

const MorePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState<DialogKey>(null);
const [withdrawAmount, setWithdrawAmount] = useState("");
const [withdrawBusy, setWithdrawBusy] = useState(false);
const [withdrawals, setWithdrawals] = useState<any[]>([]);
const [kycStatus, setKycStatus] = useState<string>("none");
const [accounts, setAccounts] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  useEffect(() => {
  const fetchBanks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setAccounts(data);
    }
  };

  fetchBanks();
}, [user]);
  useEffect(() => {
  const fetchTotalValue = async () => {
    if (!user) return;

    const [{ data: txs }, { data: credits }] = await Promise.all([
      supabase.from("transactions").select("amount, type, status").eq("user_id", user.id),
      supabase.from("daily_interest_credits").select("amount").eq("user_id", user.id),
    ]);

    const invested = (txs || [])
      .filter((t: any) => {
        const type = (t.type || "").toLowerCase().trim();
        const status = (t.status || "").toLowerCase().trim();
        return status === "success" && (type === "sip" || type === "deposit" || type === "credit");
      })
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const withdrawn = (txs || [])
      .filter((t: any) => (t.type || "").toLowerCase().trim() === "withdraw")
      .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);

    const totalInterest = (credits || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

    setTotalValue(invested + totalInterest - withdrawn);
  };

  fetchTotalValue();
}, [user]);

useEffect(() => {
  const loadExtras = async () => {
    if (!user) return;
    const [w, k] = await Promise.all([
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("kyc_submissions").select("status").eq("user_id", user.id).maybeSingle(),
    ]);
    if (w.data) setWithdrawals(w.data);
    setKycStatus((k.data as any)?.status || "none");
  };
  loadExtras();
}, [user, activeDialog]);

const userBank = accounts.find(acc => acc.is_primary) || accounts[0] || null;

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Preferences (persisted in localStorage)
  const [notifications, setNotifications] = useState(() => localStorage.getItem("pref_notifications") !== "false");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("pref_dark") !== "false");
  const [appLock, setAppLock] = useState(() => localStorage.getItem("pref_applock") === "true");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/");
        return;
      }
      setUser(authUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      setProfile(profileData);
      setEditName(profileData?.full_name || authUser.user_metadata?.full_name || "");
      setEditPhone(profileData?.phone || "");
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("pref_dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => { localStorage.setItem("pref_notifications", String(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("pref_applock", String(appLock)); }, [appLock]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email Sent! 📧", description: "Verification email bhej diya gaya hai." });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      full_name: editName.trim() || null,
      phone: editPhone.trim() || null,
    };
    const { error } = profile
      ? await supabase.from("profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("profiles").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved ✓", description: "Profile updated successfully" });
      setProfile({ ...(profile || {}), ...payload });
      setActiveDialog(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Email Sent 📧", description: "Password reset link aapke email par bhej diya gaya hai" });
  };

  const referralCode = user?.id ? `EAISHA${user.id.slice(0, 6).toUpperCase()}` : "EAISHA000";
  const shareLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} ✓`, description: text });
  };

  const handleShare = async () => {
    const shareData = {
      title: "Join eAisha Invest",
      text: `Use my referral code ${referralCode} to start investing!`,
      url: shareLink,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else handleCopy(shareLink, "Link copied");
    } catch {}
  };

  const handleDownloadStatement = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error || !data) {
      toast({ title: "Error", description: "Could not load transactions", variant: "destructive" });
      return;
    }
    const headers = ["Date", "Plan", "Amount", "Status", "Payment ID"];
    const rows = data.map((t: any) => [
      new Date(t.created_at).toLocaleDateString(),
      t.plan_name,
      t.amount,
      t.status,
      t.razorpay_payment_id || "-",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eaisha-statement-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded ✓", description: "Statement saved" });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const emailVerified = user?.email_confirmed_at ? true : false;
  const phoneNumber = profile?.phone || user?.user_metadata?.phone || "";
  const initials = displayName.charAt(0).toUpperCase();

  const open = (k: DialogKey) => setActiveDialog(k);

const handleWithdraw = async () => {
  if (!withdrawAmount || Number(withdrawAmount) <= 0) {
    toast({ title: "Invalid amount", description: "Enter a valid amount", variant: "destructive" });
    return;
  }
  if (kycStatus !== "approved") {
    toast({ title: "KYC required", description: "Complete KYC verification before withdrawing.", variant: "destructive" });
    return;
  }
  if (Number(withdrawAmount) > totalValue) {
    toast({ title: "Limit exceeded ❌", description: `Max withdraw ₹${totalValue.toLocaleString()}`, variant: "destructive" });
    return;
  }
  if (!userBank) {
    toast({ title: "No bank account", description: "Please add a primary bank account first.", variant: "destructive" });
    return;
  }
  setWithdrawBusy(true);
  const amt = Number(withdrawAmount);
  const { data: wRow, error } = await supabase.from("withdrawals").insert({
    user_id: user.id,
    amount: amt,
    bank_name: userBank.bank_name,
    account_number: userBank.account_number,
    account_holder: userBank.account_holder,
    ifsc_code: userBank.ifsc_code,
    method: "bank",
    status: "pending",
  }).select().maybeSingle();
  if (error) {
    setWithdrawBusy(false);
    toast({ title: "Error", description: error.message, variant: "destructive" });
    return;
  }
  // Deduct amount from balance immediately (debit transaction)
  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: -amt,
    plan_name: "Withdrawal",
    type: "withdraw",
    status: "success",
    notes: `Withdraw request${wRow?.id ? ` #${wRow.id}` : ""} to ${userBank.bank_name} A/C ${userBank.account_number}`,
  });
  setWithdrawBusy(false);
  toast({ title: "Withdraw request sent 💸", description: `₹${amt.toLocaleString()} deducted. Admin will verify within 24 hours.` });
  setWithdrawAmount("");
  setTotalValue((v) => v - amt);
  const { data: w } = await supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (w) setWithdrawals(w);
};

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Details", desc: `${displayName} • ${user?.email || ""}`, action: () => open("personal") },
        {
          icon: Mail,
          label: "Email Verification",
          desc: user?.email || "",
          badge: emailVerified ? "Verified" : "Unverified",
          badgeColor: emailVerified ? "text-green-500 bg-green-500/10" : "text-amber-500 bg-amber-500/10",
          action: !emailVerified ? handleResendVerification : () => toast({ title: "Email Verified ✓", description: user?.email }),
        },
        {
          icon: Phone,
          label: "Phone Number",
          desc: phoneNumber ? `+91 ${phoneNumber}` : "Not added",
          badge: profile?.phone_verified ? "Verified" : phoneNumber ? "Unverified" : "Add",
          badgeColor: profile?.phone_verified ? "text-green-500 bg-green-500/10" : "text-amber-500 bg-amber-500/10",
          action: () => open("phone"),
        },
        { icon: Shield, label: "KYC Verification",
          desc: kycStatus === "approved" ? "Your KYC is verified" : kycStatus === "pending" ? "Under review by admin" : kycStatus === "rejected" ? "KYC rejected — resubmit" : "Complete your KYC",
          badge: kycStatus === "approved" ? "Verified" : kycStatus === "pending" ? "Pending" : kycStatus === "rejected" ? "Rejected" : "Pending",
          badgeColor: kycStatus === "approved" ? "text-green-500 bg-green-500/10" : kycStatus === "rejected" ? "text-destructive bg-destructive/10" : "text-amber-500 bg-amber-500/10",
          action: () => open("kyc") },
        { icon: CreditCard, label: "ZYPEUS CARD", desc: "View your unique investor card", badge: "New", badgeColor: "text-primary bg-primary/10", action: () => open("card") },
        { icon: CreditCard, label: "Bank Accounts", desc: "Manage linked accounts", action: () => open("bank") },
        { icon: Download, label: "Withdraw", desc: "Request fund withdrawal", action: () => open("withdraw") },
        { icon: Lock, label: "Security", desc: "Password, 2FA settings", action: () => open("security") },
      ],
    },
    {
      title: "Investments",
      items: [
        { icon: FileText, label: "Transaction History", desc: "View all transactions", action: () => navigate("/transactions") },
        { icon: Star, label: "My Watchlist", desc: "Saved funds & plans", action: () => open("watchlist") },
        { icon: FileText, label: "Statements & Reports", desc: "Download CSV report", action: () => open("statements") },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: notifications ? "Enabled" : "Disabled", toggle: true, value: notifications, onToggle: setNotifications },
        { icon: Moon, label: "Dark Mode", desc: darkMode ? "On" : "Off", toggle: true, value: darkMode, onToggle: setDarkMode },
        { icon: Globe, label: "Language", desc: "English", action: () => open("language") },
        { icon: Smartphone, label: "App Lock", desc: appLock ? "Enabled" : "Disabled", toggle: true, value: appLock, onToggle: setAppLock },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help & FAQ", desc: "Get answers", action: () => open("help") },
        { icon: MessageSquare, label: "Contact Support", desc: "Chat with us", action: () => open("contact") },
        { icon: Share2, label: "Refer & Earn", desc: "Invite friends, earn rewards", action: () => open("refer") },
        { icon: Info, label: "About ZYPEUS", desc: "Version 1.0.0", action: () => open("about") },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">Profile</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl space-y-5 animate-fade-in">
        {/* Profile Card */}
        <Card className="p-5 rounded-2xl shadow-card border-border cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => open("personal")}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {phoneNumber && <p className="text-xs text-muted-foreground">+91 {phoneNumber}</p>}
            </div>
            <div className="flex items-center gap-1">
              {emailVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
          </div>
        </Card>

        {!emailVerified && (
          <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Email Verify Karein</p>
                <p className="text-xs text-muted-foreground">Aapka email abhi verified nahi hai</p>
              </div>
              <Button size="sm" onClick={handleResendVerification} className="rounded-xl text-xs gradient-primary text-primary-foreground">
                Resend
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 rounded-2xl shadow-card border-border text-center cursor-pointer hover:bg-secondary/30" onClick={() => navigate("/portfolio")}>
            <p className="text-[10px] text-muted-foreground">Total Invested</p>
            <p className="text-sm font-bold text-foreground mt-1">View</p>
          </Card>
          <Card className="p-3 rounded-2xl shadow-card border-border text-center cursor-pointer hover:bg-secondary/30" onClick={() => navigate("/portfolio")}>
            <p className="text-[10px] text-muted-foreground">Current Value</p>
            <p className="text-sm font-bold text-green-500 mt-1">View</p>
          </Card>
          <Card className="p-3 rounded-2xl shadow-card border-border text-center cursor-pointer hover:bg-secondary/30" onClick={() => navigate("/portfolio")}>
            <p className="text-[10px] text-muted-foreground">Active SIPs</p>
            <p className="text-sm font-bold text-primary mt-1">View</p>
          </Card>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <Card className="rounded-2xl shadow-card border-border overflow-hidden divide-y divide-border">
              {section.items.map((item: any) => (
                <div
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50"
                >
                  <button
                    onClick={item.action}
                    disabled={item.toggle}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-default"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        {item.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || "bg-amber-500/10 text-amber-500"}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.desc && <p className="text-xs text-muted-foreground truncate">{item.desc}</p>}
                    </div>
                  </button>
                  {item.toggle ? (
                    <Switch checked={item.value} onCheckedChange={item.onToggle} />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </Card>
          </div>
        ))}

        <Card className="rounded-2xl shadow-card border-border overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-destructive/5"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-destructive/10">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">Log Out</p>
          </button>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-4">eAisha Invest v1.0.0</p>
      </main>
      <BottomNav />

      {/* Personal Details */}
      <Dialog open={activeDialog === "personal"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Personal Details</DialogTitle>
            <DialogDescription>Update your name and phone number</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div>
              <Label>Phone (10 digits)</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-primary-foreground rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone */}
      <Dialog open={activeDialog === "phone"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Phone Number</DialogTitle>
            <DialogDescription>Add or update your phone number</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Phone (10 digits)</Label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
            <p className="text-xs text-muted-foreground">Phone OTP verification coming soon.</p>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProfile} disabled={saving || editPhone.length !== 10} className="gradient-primary text-primary-foreground rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC */}
      {user && <KycDialog open={activeDialog === "kyc"} onOpenChange={(o) => !o && setActiveDialog(null)} userId={user.id} />}

      {/* Bank */}
      {user && <BankAccountsDialog open={activeDialog === "bank"} onOpenChange={(o) => !o && setActiveDialog(null)} userId={user.id} />}

    {/* Withdraw */}
<Dialog open={activeDialog === "withdraw"} onOpenChange={(o) => !o && setActiveDialog(null)}>
  <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Withdraw Funds</DialogTitle>
      <DialogDescription>Available balance: ₹{totalValue.toLocaleString()}</DialogDescription>
    </DialogHeader>

    {kycStatus !== "approved" && (
      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400">
        ⚠️ KYC {kycStatus === "pending" ? "is pending verification" : kycStatus === "rejected" ? "was rejected" : "not submitted"}. Withdrawals are only allowed after KYC approval.
      </div>
    )}

    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Amount (₹)</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          className="w-full mt-1 p-2 rounded-xl border border-border bg-background"
        />
        <div className="flex gap-2 mt-2">
          {[500, 1000, 5000].filter(a => a <= totalValue).map(a => (
            <Button key={a} size="sm" variant="outline" className="rounded-full text-xs h-7" onClick={() => setWithdrawAmount(String(a))}>₹{a}</Button>
          ))}
          {totalValue > 0 && <Button size="sm" variant="outline" className="rounded-full text-xs h-7" onClick={() => setWithdrawAmount(String(totalValue))}>Max</Button>}
        </div>
      </div>

      <div className="p-3 rounded-xl border border-border bg-secondary/30">
        <p className="text-sm font-medium">Bank Account</p>
        <p className="text-xs text-muted-foreground">
          {userBank
            ? `${userBank.account_holder} • ${userBank.bank_name} • ****${userBank.account_number.slice(-4)} • ${userBank.ifsc_code}`
            : "No bank linked — add one from Bank Accounts"}
        </p>
      </div>

      {withdrawals.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Recent Withdrawals</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {withdrawals.slice(0, 8).map(w => (
              <div key={w.id} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs">
                <div>
                  <p className="font-medium">₹{Number(w.amount).toLocaleString()}</p>
                  <p className="text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                  {w.utr && <p className="text-muted-foreground">UTR: {w.utr}</p>}
                  {w.rejection_reason && <p className="text-destructive">{w.rejection_reason}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full ${w.status === "approved" ? "bg-green-500/10 text-green-500" : w.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"}`}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    <DialogFooter>
      <Button onClick={handleWithdraw} className="rounded-xl" disabled={withdrawBusy || kycStatus !== "approved" || !userBank}>
        {withdrawBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Withdraw Now
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      {/* eAisha Card */}
      {user && <EaishaCardDialog open={activeDialog === "card"} onOpenChange={(o) => !o && setActiveDialog(null)} userId={user.id} userEmail={user.email} userName={displayName} userPhone={phoneNumber} />}

      {/* Security */}
      <Dialog open={activeDialog === "security"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Security</DialogTitle>
            <DialogDescription>Manage password and account security</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button onClick={handlePasswordReset} variant="outline" className="w-full rounded-xl justify-start">
              <Lock className="w-4 h-4 mr-2" /> Reset Password via Email
            </Button>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium">App Lock</p>
                <p className="text-xs text-muted-foreground">Biometric / PIN</p>
              </div>
              <Switch checked={appLock} onCheckedChange={setAppLock} />
            </div>
            <p className="text-xs text-muted-foreground">2FA coming soon.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Watchlist */}
      <Dialog open={activeDialog === "watchlist"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>My Watchlist</DialogTitle>
            <DialogDescription>Your saved SIP plans</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground text-center py-6">
            <Star className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            <p>Watchlist is empty.</p>
            <p className="text-xs mt-1">Star SIP plans on the Invest page to save them here.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setActiveDialog(null); navigate("/calculator"); }} className="rounded-xl">Browse Plans</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statements */}
      <Dialog open={activeDialog === "statements"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Statements & Reports</DialogTitle>
            <DialogDescription>Download your transaction history</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button onClick={handleDownloadStatement} className="w-full gradient-primary text-primary-foreground rounded-xl">
              <Download className="w-4 h-4 mr-2" /> Download Full Statement (CSV)
            </Button>
            <Button onClick={() => { setActiveDialog(null); navigate("/transactions"); }} variant="outline" className="w-full rounded-xl">
              View Transaction History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language */}
      <Dialog open={activeDialog === "language"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Language</DialogTitle>
            <DialogDescription>Choose your preferred language</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {["English", "हिंदी (Hindi)", "मराठी (Marathi)"].map((lang) => (
              <button
                key={lang}
                onClick={() => { localStorage.setItem("pref_lang", lang); toast({ title: "Language set", description: `${lang} (full translation coming soon)` }); setActiveDialog(null); }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/50"
              >
                <span className="text-sm">{lang}</span>
                {(localStorage.getItem("pref_lang") || "English") === lang && <CheckCircle className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & FAQ */}
      <Dialog open={activeDialog === "help"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & FAQ</DialogTitle>
          </DialogHeader>
          <Accordion type="single" collapsible>
            <AccordionItem value="1">
              <AccordionTrigger>What is SIP?</AccordionTrigger>
              <AccordionContent>SIP (Systematic Investment Plan) lets you invest a fixed amount regularly into mutual funds.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>How do I start investing?</AccordionTrigger>
              <AccordionContent>Go to the Invest tab, choose a plan (₹100 to ₹10,000), and pay via Razorpay.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Is my money safe?</AccordionTrigger>
              <AccordionContent>Yes. Payments are secured by Razorpay and your data is protected by industry-standard encryption.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="4">
              <AccordionTrigger>How are returns calculated?</AccordionTrigger>
              <AccordionContent>Returns are updated by our admin team based on actual market performance of your invested plan.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="5">
              <AccordionTrigger>Can I withdraw anytime?</AccordionTrigger>
              <AccordionContent>Yes, contact support to initiate a withdrawal. Processing takes 3-5 business days.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </DialogContent>
      </Dialog>

      {/* Contact */}
      <Dialog open={activeDialog === "contact"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>We're here to help, 24/7</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <a href="mailto:zypeus90@gmail.com" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50">
              <Mail className="w-4 h-4 text-primary" />
              <div className="flex-1"><p className="text-sm font-medium">Email</p><p className="text-xs text-muted-foreground">zypeus90@gmail.com</p></div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            <a href="tel:+918298813282" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50">
              <Phone className="w-4 h-4 text-primary" />
              <div className="flex-1"><p className="text-sm font-medium">Call</p><p className="text-xs text-muted-foreground">+91 8298813282</p></div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            <a href="https://wa.me/918298813282" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50">
              <MessageSquare className="w-4 h-4 text-primary" />
              <div className="flex-1"><p className="text-sm font-medium">WhatsApp</p><p className="text-xs text-muted-foreground">Chat with us</p></div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refer */}
      <Dialog open={activeDialog === "refer"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Refer & Earn</DialogTitle>
            <DialogDescription>Invite friends and earn ₹100 on each successful signup</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-xl gradient-primary text-primary-foreground text-center">
              <p className="text-xs opacity-80">Your Referral Code</p>
              <p className="text-2xl font-bold tracking-wider mt-1">{referralCode}</p>
            </div>
            <Button onClick={() => handleCopy(referralCode, "Code copied")} variant="outline" className="w-full rounded-xl">
              <Copy className="w-4 h-4 mr-2" /> Copy Code
            </Button>
            <Button onClick={handleShare} className="w-full gradient-primary text-primary-foreground rounded-xl">
              <Share2 className="w-4 h-4 mr-2" /> Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About */}
      <Dialog open={activeDialog === "about"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>About ZYPEUS</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="font-bold text-base">ZYPEUS</p>
            <p className="text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs text-muted-foreground">Smart SIP investing platform powered by AI insights. Build wealth, one SIP at a time.</p>
            <div className="flex justify-center gap-3 pt-2 text-xs">
              <a href="#" className="text-primary hover:underline">Privacy</a>
              <span className="text-muted-foreground">•</span>
              <a href="#" className="text-primary hover:underline">Terms</a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MorePage;
