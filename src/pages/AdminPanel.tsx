import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, FileCheck, CreditCard, Loader2, LogOut, CheckCircle2, XCircle, ExternalLink, RefreshCw, IndianRupee, TrendingUp, Coins, Search, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";

type Kyc = {
  id: string; user_id: string; full_name_kyc: string; pan_number: string; aadhaar_number: string;
  status: string; submitted_at: string; rejection_reason: string | null;
  pan_document_url: string | null; aadhaar_front_url: string | null; aadhaar_back_url: string | null; selfie_url: string | null;
};
type Tx = {
  id: string; user_id: string; plan_name: string; amount: number; status: string; type: string;
  created_at: string; razorpay_payment_id: string | null; returns_amount: number | null; current_value: number | null;
};
type Profile = { user_id: string; full_name: string | null; phone: string | null; created_at: string };
type Bank = { id: string; user_id: string; account_holder: string; account_number: string; ifsc_code: string; bank_name: string; is_primary: boolean };

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: roleLoading, isAdmin } = useAdminRole();

  const [authChecking, setAuthChecking] = useState(true);
  const [kycs, setKycs] = useState<Kyc[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [reviewKyc, setReviewKyc] = useState<Kyc | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editTx, setEditTx] = useState<Tx | null>(null);
  const [returnsInput, setReturnsInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [creditUser, setCreditUser] = useState<Profile | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [credits, setCredits] = useState<Array<{ user_id: string; amount: number; credit_date: string }>>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Email lookup
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupData, setLookupData] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositBusy, setDepositBusy] = useState(false);

  // Add SIP plan
  const STANDARD_PLANS = [
    { amount: 100, name: "Stability SIP" },
    { amount: 500, name: "Starter SIP" },
    { amount: 1000, name: "Growth SIP" },
    { amount: 2500, name: "Power SIP" },
    { amount: 5000, name: "Premium SIP" },
    { amount: 10000, name: "Growth Booster SIP" },
  ];
  const [sipPlan, setSipPlan] = useState(STANDARD_PLANS[1].name);
  const [sipAmount, setSipAmount] = useState(String(STANDARD_PLANS[1].amount));
  const [sipDate, setSipDate] = useState("");
  const [sipBusy, setSipBusy] = useState(false);

  const doAddSip = async () => {
    if (!lookupData?.user?.id || !sipAmount) return;
    setSipBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-user-lookup", {
      body: {
        action: "add_sip",
        user_id: lookupData.user.id,
        amount: Number(sipAmount),
        plan_name: sipPlan,
        note: `Admin SIP - ${sipPlan}`,
        created_at: sipDate ? new Date(sipDate).toISOString() : undefined,
      },
    });
    setSipBusy(false);
    if (error || data?.error) return toast({ title: "Add SIP failed", description: data?.error || error?.message, variant: "destructive" });
    toast({ title: "SIP added", description: `${sipPlan} ₹${sipAmount} added to ${lookupData.user.email}` });
    setSipAmount(String(STANDARD_PLANS[1].amount)); setSipDate("");
    await doLookup();
    loadAll();
  };

  const doLookup = async () => {
    if (!lookupEmail.trim()) return;
    setLookupBusy(true); setLookupData(null);
    const { data, error } = await supabase.functions.invoke("admin-user-lookup", {
      body: { action: "lookup", email: lookupEmail.trim() },
    });
    setLookupBusy(false);
    if (error || data?.error) return toast({ title: "Lookup failed", description: data?.error || error?.message, variant: "destructive" });
    setLookupData(data);
  };

  const doDeposit = async () => {
    if (!lookupData?.user?.id || !depositAmount) return;
    setDepositBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-user-lookup", {
      body: { action: "deposit", user_id: lookupData.user.id, amount: Number(depositAmount), note: depositNote || "Admin deposit", plan_name: "Manual Deposit" },
    });
    setDepositBusy(false);
    if (error || data?.error) return toast({ title: "Deposit failed", description: data?.error || error?.message, variant: "destructive" });
    toast({ title: "Deposit added", description: `₹${depositAmount} credited to ${lookupData.user.email}` });
    setDepositAmount(""); setDepositNote("");
    await doLookup();
    loadAll();
  };

  const lookupKycDecision = async (status: "approved" | "rejected", reason?: string) => {
    if (!lookupData?.kyc?.id) return;
    const { error } = await supabase.from("kyc_submissions").update({
      status,
      rejection_reason: status === "rejected" ? (reason || "Rejected by admin") : null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", lookupData.kyc.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: `KYC ${status}` });
    await doLookup();
    loadAll();
  };

  const verifyPhone = async (verified: boolean) => {
    if (!lookupData?.user?.id) return;
    const { error } = await supabase.from("profiles").update({ phone_verified: verified }).eq("user_id", lookupData.user.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: verified ? "Phone verified ✓" : "Phone unverified" });
    await doLookup();
    loadAll();
  };

  const [lookupRejectReason, setLookupRejectReason] = useState("");

  // Auto-refresh lookup data every 15s to always show latest info
  useEffect(() => {
    if (!lookupData?.user?.email) return;
    const id = setInterval(() => {
      if (!lookupBusy) doLookup();
    }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupData?.user?.email]);


  const [pendingKycs, setPendingKycs] = useState<any[]>([]);
  const [pendingKycsBusy, setPendingKycsBusy] = useState(false);
  const loadPendingKycs = async () => {
    setPendingKycsBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-user-lookup", { body: { action: "pending_kycs" } });
    setPendingKycsBusy(false);
    if (error || data?.error) return toast({ title: "Failed to load pending KYC", description: data?.error || error?.message, variant: "destructive" });
    setPendingKycs(data?.kycs || []);
  };

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [rejectInputs, setRejectInputs] = useState<Record<string, string>>({});
  const loadWithdrawals = async () => {
    const { data } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(200);
    if (data) setWithdrawals(data);
  };
  const approveWithdrawal = async (w: any) => {
    const utr = utrInputs[w.id]?.trim();
    if (!utr) return toast({ title: "UTR required", description: "Enter the bank UTR/reference before approving.", variant: "destructive" });
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("withdrawals").update({
      status: "approved", utr, processed_at: new Date().toISOString(), processed_by: user?.id || null, rejection_reason: null,
    }).eq("id", w.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Withdrawal approved ✓", description: `₹${w.amount} marked paid (UTR ${utr})` });
    loadWithdrawals();
  };
  const rejectWithdrawal = async (w: any) => {
    const reason = rejectInputs[w.id]?.trim() || "Rejected by admin";
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("withdrawals").update({
      status: "rejected", rejection_reason: reason, processed_at: new Date().toISOString(), processed_by: user?.id || null,
    }).eq("id", w.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Withdrawal rejected" });
    loadWithdrawals();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/secure-admin-92/login");
      setAuthChecking(false);
    });
  }, [navigate]);

  const loadAll = async () => {
    const [k, t, p, b, c] = await Promise.all([
      supabase.from("kyc_submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, full_name, phone, created_at").order("created_at", { ascending: false }),
      supabase.from("bank_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("daily_interest_credits").select("user_id, amount, credit_date"),
    ]);
    if (k.data) setKycs(k.data as Kyc[]);
    if (t.data) setTxs(t.data as Tx[]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (b.data) setBanks(b.data as Bank[]);
    if (c.data) setCredits(c.data as any);
  };

  useEffect(() => { if (isAdmin) { loadAll(); loadPendingKycs(); loadWithdrawals(); } }, [isAdmin]);

  const signedUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 600);
    return data?.signedUrl || null;
  };

  const openDoc = async (path: string | null) => {
    const url = await signedUrl(path);
    if (url) window.open(url, "_blank");
    else toast({ title: "No document", variant: "destructive" });
  };

  const reviewDecision = async (status: "approved" | "rejected") => {
    if (!reviewKyc) return;
    const { error } = await supabase.from("kyc_submissions").update({
      status,
      rejection_reason: status === "rejected" ? rejectReason : null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", reviewKyc.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: `KYC ${status}` });
    setReviewKyc(null); setRejectReason(""); loadAll();
  };

  const updateTx = async (status?: string) => {
    if (!editTx) return;
    const payload: any = {};
    if (status) payload.status = status;
    if (returnsInput !== "") payload.returns_amount = Number(returnsInput);
    if (valueInput !== "") payload.current_value = Number(valueInput);
    const { error } = await supabase.from("transactions").update(payload).eq("id", editTx.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Updated" });
    setEditTx(null); setReturnsInput(""); setValueInput(""); loadAll();
  };

  const submitCredit = async () => {
    if (!creditUser || !creditAmount) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("daily_interest_credits").insert({
      user_id: creditUser.user_id,
      amount: Number(creditAmount),
      note: creditNote || null,
      created_by: user?.id || null,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Interest credited", description: `₹${creditAmount} added to ${creditUser.full_name || "user"}` });
    setCreditUser(null); setCreditAmount(""); setCreditNote(""); loadAll();
  };

  const submitBulkCredit = async () => {
    const pct = Number(bulkPercent);
    if (!pct || pct <= 0) return toast({ title: "Enter valid percentage", variant: "destructive" });
    setBulkBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const rows = profiles
      .map(p => ({ user_id: p.user_id, invested: userInvested(p.user_id) }))
      .filter(r => r.invested > 0)
      .map(r => ({
        user_id: r.user_id,
        amount: Math.round(r.invested * pct) / 100,
        note: bulkNote || `Daily interest @ ${pct}%`,
        created_by: user?.id || null,
      }));
    if (rows.length === 0) {
      setBulkBusy(false);
      return toast({ title: "No invested users found", variant: "destructive" });
    }
    const { error } = await supabase.from("daily_interest_credits").insert(rows);
    setBulkBusy(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    const totalGiven = rows.reduce((s, r) => s + r.amount, 0);
    toast({ title: `Credited ${rows.length} users`, description: `Total ₹${totalGiven.toLocaleString()} distributed @ ${pct}%` });
    setBulkOpen(false); setBulkPercent(""); setBulkNote(""); loadAll();
  };

  const logout = async () => { await supabase.auth.signOut(); navigate("/secure-admin-92/login"); };

  if (authChecking || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm mt-2">You are not authorized to view this page.</p>
          <Button className="mt-4" onClick={() => navigate("/secure-admin-92/login")}>Sign in as admin</Button>
        </Card>
      </div>
    );
  }

  const pendingCount = kycs.filter(k => k.status === "pending").length;
  const isInvestType = (t: Tx) => t.type === "sip" || t.type === "deposit";
  const userInvested = (uid: string) => txs
    .filter(t => t.user_id === uid && t.status === "success" && (isInvestType(t) || t.type === "withdraw"))
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalInvested = profiles.reduce((s, p) => s + Math.max(0, userInvested(p.user_id)), 0);
  const totalInterestPaid = credits.reduce((s, c) => s + Number(c.amount), 0);
  const today = new Date().toISOString().split("T")[0];
  const todayInterestPaid = credits.filter(c => c.credit_date === today).reduce((s, c) => s + Number(c.amount), 0);
  const userInterest = (uid: string) => credits.filter(c => c.user_id === uid).reduce((s, c) => s + Number(c.amount), 0);

  // ---- Investment tracking (10-day, 40% return) ----
  const activeInvestments = txs.filter(t => t.status === "success" && isInvestType(t));
  const todayInvestedAmount = activeInvestments
    .filter(t => new Date(t.created_at).toISOString().split("T")[0] === today)
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalPayoutDue = activeInvestments.reduce((s, t) => s + Number(t.amount) * 1.4, 0);
  const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const maturityDateOf = (iso: string) => {
    const d = new Date(iso); d.setDate(d.getDate() + 10);
    return d;
  };
  const maturingToday = activeInvestments.filter(t => {
    const md = maturityDateOf(t.created_at).toISOString().split("T")[0];
    return md === today;
  });
  const maturingTodayAmount = maturingToday.reduce((s, t) => s + Number(t.amount) * 1.4, 0);
  const userPayoutDue = (uid: string) => activeInvestments
    .filter(t => t.user_id === uid)
    .reduce((s, t) => s + Number(t.amount) * 1.4, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-bold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Secure access</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setBulkOpen(true)} className="bg-green-600 hover:bg-green-700"><Coins className="w-4 h-4 mr-1" />Credit All by %</Button>
            <Button variant="ghost" size="icon" onClick={loadAll}><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />Total Users</p><p className="text-2xl font-bold">{profiles.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3 h-3" />Today Invested</p><p className="text-2xl font-bold text-primary">₹{todayInvestedAmount.toLocaleString()}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3 h-3" />Total Invested</p><p className="text-2xl font-bold text-primary">₹{totalInvested.toLocaleString()}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />Total Payout Due (10d, 40%)</p><p className="text-2xl font-bold text-green-500">₹{Math.round(totalPayoutDue).toLocaleString()}</p></Card>
          <Card className="p-4 border-amber-500/40 bg-amber-500/5"><p className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" />Maturing Today</p><p className="text-2xl font-bold text-amber-500">₹{Math.round(maturingTodayAmount).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">{maturingToday.length} investment(s)</p></Card>
        </div>

        <Tabs defaultValue="maturity">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="maturity"><Coins className="w-4 h-4 mr-1" />Maturity Today {maturingToday.length > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-500 text-white text-[10px]">{maturingToday.length}</span>}</TabsTrigger>
            <TabsTrigger value="payments"><IndianRupee className="w-4 h-4 mr-1" />Pending Payments {txs.filter(t => t.status === "pending").length > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-500 text-white text-[10px]">{txs.filter(t => t.status === "pending").length}</span>}</TabsTrigger>
            <TabsTrigger value="lookup"><Mail className="w-4 h-4 mr-1" />Lookup</TabsTrigger>
            <TabsTrigger value="tx"><CreditCard className="w-4 h-4 mr-1" />Transactions</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="withdrawals"><IndianRupee className="w-4 h-4 mr-1" />Withdrawals {withdrawals.filter(w => w.status === "pending").length > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-500 text-white text-[10px]">{withdrawals.filter(w => w.status === "pending").length}</span>}</TabsTrigger>
          </TabsList>

          <TabsContent value="maturity">
            <Card className="p-4 overflow-x-auto">
              <p className="text-sm text-muted-foreground mb-3">Aaj jinke 10 din pure ho gaye — user ko 40% profit ke saath total payout karna hai.</p>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Invested Date</TableHead><TableHead>Invested Amount</TableHead><TableHead>Profit (40%)</TableHead><TableHead>Total Payout</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {maturingToday.map(t => {
                    const prof = profiles.find(p => p.user_id === t.user_id);
                    const amt = Number(t.amount);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs"><p className="font-medium">{prof?.full_name || "—"}</p><p className="text-muted-foreground">{prof?.phone || ""}</p></TableCell>
                        <TableCell className="text-xs">{t.plan_name}</TableCell>
                        <TableCell className="text-xs">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>₹{amt.toLocaleString()}</TableCell>
                        <TableCell className="text-green-500">+₹{Math.round(amt * 0.4).toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-primary">₹{Math.round(amt * 1.4).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  {maturingToday.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Aaj koi maturity nahi hai</TableCell></TableRow>)}
                </TableBody>
              </Table>

              <div className="mt-6">
                <p className="font-semibold text-sm mb-2">All Active Investments (10-day cycle)</p>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Invested</TableHead><TableHead>Amount</TableHead><TableHead>Days</TableHead><TableHead>Maturity</TableHead><TableHead>Payout Due</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {activeInvestments.map(t => {
                      const prof = profiles.find(p => p.user_id === t.user_id);
                      const amt = Number(t.amount);
                      const d = daysSince(t.created_at);
                      const remaining = Math.max(0, 10 - d);
                      const md = maturityDateOf(t.created_at);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">{prof?.full_name || "—"}</TableCell>
                          <TableCell className="text-xs">{t.plan_name}</TableCell>
                          <TableCell className="text-xs">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">₹{amt.toLocaleString()}</TableCell>
                          <TableCell className="text-xs"><span className="text-primary font-medium">Day {Math.min(d, 10)}/10</span><br/><span className="text-muted-foreground">{remaining} left</span></TableCell>
                          <TableCell className="text-xs">{md.toLocaleDateString()}</TableCell>
                          <TableCell className="font-bold text-green-500">₹{Math.round(amt * 1.4).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    {activeInvestments.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No active investments</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="p-4 overflow-x-auto">
              <p className="text-sm text-muted-foreground mb-3">UPI payments with UTR awaiting verification. Approve to credit user's portfolio.</p>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>UTR / Notes</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {txs.filter(t => t.status === "pending").map(t => {
                    const prof = profiles.find(p => p.user_id === t.user_id);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">
                          <p className="font-medium">{prof?.full_name || "—"}</p>
                          <p className="text-muted-foreground">{prof?.phone || ""}</p>
                        </TableCell>
                        <TableCell className="text-xs">{t.plan_name}</TableCell>
                        <TableCell className="font-bold text-primary">₹{Number(t.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-xs max-w-[260px] break-words">{(t as any).notes || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={async () => {
                              const { error } = await supabase.from("transactions").update({ status: "success" }).eq("id", t.id);
                              if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
                              toast({ title: "Payment approved ✓", description: `₹${t.amount} credited` });
                              loadAll();
                            }}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>
                            <Button size="sm" variant="destructive" className="h-8" onClick={async () => {
                              const { error } = await supabase.from("transactions").update({ status: "failed" }).eq("id", t.id);
                              if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
                              toast({ title: "Payment rejected" });
                              loadAll();
                            }}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {txs.filter(t => t.status === "pending").length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No pending payments</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* pending-kyc tab removed */}




          <TabsContent value="lookup">
            <Card className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doLookup()}
                />
                <Button onClick={doLookup} disabled={lookupBusy}>
                  {lookupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="ml-1">Search</span>
                </Button>
                {lookupData && (
                  <Button variant="outline" onClick={doLookup} disabled={lookupBusy} title="Refresh latest data">
                    <RefreshCw className={`w-4 h-4 ${lookupBusy ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>


              {lookupData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="font-semibold text-sm truncate">{lookupData.profile?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{lookupData.user.email}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Invested (net)</p>
                      <p className="font-bold text-primary">₹{(lookupData.transactions || [])
                        .filter((t: any) => t.status === "success")
                        .reduce((s: number, t: any) => s + (t.type === "withdraw" ? -1 : 1) * Number(t.amount), 0)
                        .toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Interest Paid</p>
                      <p className="font-bold text-green-500">₹{(lookupData.credits || []).reduce((s: number, c: any) => s + Number(c.amount), 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">KYC</p>
                      <p className="font-semibold capitalize">{lookupData.kyc?.status || "Not submitted"}</p>
                    </div>
                  </div>

                  {/* Phone verification card */}
                  <Card className="p-3 border-blue-500/30 bg-blue-500/5">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1">📱 Phone Verification</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-mono text-sm">{lookupData.profile?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lookupData.profile?.phone_verified ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {lookupData.profile?.phone_verified ? "Verified ✓" : "Not Verified"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lookupData.profile?.email_verified ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {lookupData.profile?.email_verified ? "Verified ✓" : "Pending"}
                        </span>
                      </div>
                      <div className="ml-auto flex gap-2">
                        {!lookupData.profile?.phone_verified ? (
                          <Button size="sm" onClick={() => verifyPhone(true)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" />Verify Phone
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => verifyPhone(false)}>
                            <XCircle className="w-4 h-4 mr-1" />Unverify
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* KYC details + documents + approve/reject */}
                  <Card className="p-3 border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm flex items-center gap-1"><FileCheck className="w-4 h-4" />KYC Verification</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${lookupData.kyc?.status === "approved" ? "bg-green-500/10 text-green-500" : lookupData.kyc?.status === "rejected" ? "bg-destructive/10 text-destructive" : lookupData.kyc ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                        {lookupData.kyc?.status || "Not submitted"}
                      </span>
                    </div>
                    {lookupData.kyc ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium">{lookupData.kyc.full_name_kyc}</p></div>
                          <div><p className="text-xs text-muted-foreground">PAN</p><p className="font-mono">{lookupData.kyc.pan_number}</p></div>
                          <div><p className="text-xs text-muted-foreground">Aadhaar</p><p className="font-mono">{lookupData.kyc.aadhaar_number}</p></div>
                          {lookupData.kyc.date_of_birth && <div><p className="text-xs text-muted-foreground">DOB</p><p>{lookupData.kyc.date_of_birth}</p></div>}
                          {lookupData.kyc.address && <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p className="text-xs">{lookupData.kyc.address}</p></div>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDoc(lookupData.kyc.pan_document_url)}><ExternalLink className="w-3 h-3 mr-1" />PAN Doc</Button>
                          <Button variant="outline" size="sm" onClick={() => openDoc(lookupData.kyc.aadhaar_front_url)}><ExternalLink className="w-3 h-3 mr-1" />Aadhaar Front</Button>
                          <Button variant="outline" size="sm" onClick={() => openDoc(lookupData.kyc.aadhaar_back_url)}><ExternalLink className="w-3 h-3 mr-1" />Aadhaar Back</Button>
                          <Button variant="outline" size="sm" onClick={() => openDoc(lookupData.kyc.selfie_url)}><ExternalLink className="w-3 h-3 mr-1" />Selfie</Button>
                        </div>
                        {lookupData.kyc.rejection_reason && (
                          <p className="text-xs text-destructive">Rejection reason: {lookupData.kyc.rejection_reason}</p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
                          <Input placeholder="Rejection reason (if rejecting)" value={lookupRejectReason} onChange={(e) => setLookupRejectReason(e.target.value)} className="max-w-[280px]" />
                          <Button size="sm" variant="destructive" onClick={() => lookupKycDecision("rejected", lookupRejectReason)}>
                            <XCircle className="w-4 h-4 mr-1" />Reject KYC
                          </Button>
                          <Button size="sm" onClick={() => lookupKycDecision("approved")} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" />Approve KYC
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">User has not submitted KYC yet.</p>
                    )}
                  </Card>

                  {/* Bank accounts */}
                  {lookupData.banks?.length > 0 && (
                    <Card className="p-3">
                      <p className="font-semibold text-sm mb-2 flex items-center gap-1">🏦 Bank Accounts ({lookupData.banks.length})</p>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead>Holder</TableHead><TableHead>Bank</TableHead><TableHead>Account</TableHead><TableHead>IFSC</TableHead><TableHead>Primary</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {lookupData.banks.map((b: any) => (
                              <TableRow key={b.id}>
                                <TableCell className="text-xs">{b.account_holder}</TableCell>
                                <TableCell className="text-xs">{b.bank_name}</TableCell>
                                <TableCell className="font-mono text-xs">{b.account_number}</TableCell>
                                <TableCell className="font-mono text-xs">{b.ifsc_code}</TableCell>
                                <TableCell>{b.is_primary && <CheckCircle2 className="w-4 h-4 text-green-500" />}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  )}

                  <Card className="p-3 border-primary/30 bg-primary/5">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Plus className="w-4 h-4" />Add Deposit for this user</p>
                    <div className="flex flex-wrap gap-2">
                      <Input type="number" placeholder="Amount ₹" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="max-w-[160px]" />
                      <Input placeholder="Note (optional)" value={depositNote} onChange={(e) => setDepositNote(e.target.value)} className="max-w-[260px]" />
                      <Button onClick={doDeposit} disabled={depositBusy || !depositAmount} className="bg-green-600 hover:bg-green-700">
                        {depositBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
                        <span className="ml-1">Credit Deposit</span>
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-3 border-accent/30 bg-accent/5">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" />Add SIP Plan for this user</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={sipPlan}
                        onChange={(e) => {
                          const p = STANDARD_PLANS.find(x => x.name === e.target.value);
                          setSipPlan(e.target.value);
                          if (p) setSipAmount(String(p.amount));
                        }}
                        className="h-9 px-2 rounded-md border border-input bg-background text-sm"
                      >
                        {STANDARD_PLANS.map(p => <option key={p.name} value={p.name}>{p.name} (₹{p.amount})</option>)}
                        <option value="Custom SIP">Custom SIP</option>
                      </select>
                      <Input type="number" placeholder="Amount ₹" value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} className="max-w-[140px]" />
                      <Input type="date" value={sipDate} onChange={(e) => setSipDate(e.target.value)} className="max-w-[160px]" title="Invest date (optional, defaults to today)" />
                      <Button onClick={doAddSip} disabled={sipBusy || !sipAmount} className="bg-primary hover:bg-primary/90">
                        {sipBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span className="ml-1">Add SIP</span>
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">Backdate karne ke liye date select karein — returns us din se calculate honge.</p>
                  </Card>


                  <div>
                    <p className="font-semibold text-sm mb-2">Transactions ({lookupData.transactions?.length || 0})</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Plan</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {(lookupData.transactions || []).slice(0, 30).map((t: any) => (
                            <TableRow key={t.id}>
                              <TableCell className="text-xs">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-xs">{t.plan_name}</TableCell>
                              <TableCell className="text-xs capitalize">{t.type}</TableCell>
                              <TableCell className="text-xs">₹{Number(t.amount).toLocaleString()}</TableCell>
                              <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "success" ? "bg-green-500/10 text-green-500" : t.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"}`}>{t.status}</span></TableCell>
                            </TableRow>
                          ))}
                          {(!lookupData.transactions || lookupData.transactions.length === 0) && (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs">No transactions</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>


          <TabsContent value="tx">
            <Card className="p-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Returns</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {txs.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{t.plan_name}</TableCell>
                      <TableCell>₹{Number(t.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize text-xs">{t.type}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "success" ? "bg-green-500/10 text-green-500" : t.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"}`}>{t.status}</span></TableCell>
                      <TableCell className={`text-xs ${Number(t.returns_amount) >= 0 ? "text-green-500" : "text-destructive"}`}>₹{Number(t.returns_amount || 0).toLocaleString()}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => { setEditTx(t); setReturnsInput(String(t.returns_amount || "")); setValueInput(String(t.current_value || "")); }}>Edit</Button></TableCell>
                    </TableRow>
                  ))}
                  {txs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No transactions</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-4 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Invested</TableHead><TableHead>Payout Due (40%)</TableHead><TableHead>Interest Paid</TableHead><TableHead>Joined</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {profiles.map(p => (
                    <TableRow key={p.user_id}>
                      <TableCell>{p.full_name || "—"}</TableCell>
                      <TableCell>{p.phone || "—"}</TableCell>
                      <TableCell className="font-medium text-primary">₹{userInvested(p.user_id).toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-green-500">₹{Math.round(userPayoutDue(p.user_id)).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-green-500">₹{userInterest(p.user_id).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => setCreditUser(p)}><Coins className="w-3 h-3 mr-1" />Credit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">User withdrawal requests. Enter UTR after sending money, then approve.</p>
                <Button size="sm" variant="outline" onClick={loadWithdrawals}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Bank</TableHead><TableHead>Status</TableHead><TableHead>UTR / Reason</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {withdrawals.map(w => {
                    const prof = profiles.find(p => p.user_id === w.user_id);
                    const isPending = w.status === "pending";
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{new Date(w.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">
                          <p className="font-medium">{prof?.full_name || "—"}</p>
                          <p className="text-muted-foreground">{prof?.phone || ""}</p>
                        </TableCell>
                        <TableCell className="font-bold text-primary">₹{Number(w.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">
                          <p>{w.account_holder}</p>
                          <p className="text-muted-foreground">{w.bank_name} • ****{String(w.account_number || "").slice(-4)}</p>
                          <p className="font-mono text-muted-foreground">{w.ifsc_code || "—"}</p>
                        </TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "approved" ? "bg-green-500/10 text-green-500" : w.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"}`}>{w.status}</span></TableCell>
                        <TableCell className="text-xs">
                          {isPending ? (
                            <div className="space-y-1">
                              <Input value={utrInputs[w.id] || ""} onChange={e => setUtrInputs({ ...utrInputs, [w.id]: e.target.value })} placeholder="Bank UTR" className="h-7 text-xs" />
                              <Input value={rejectInputs[w.id] || ""} onChange={e => setRejectInputs({ ...rejectInputs, [w.id]: e.target.value })} placeholder="Reject reason (optional)" className="h-7 text-xs" />
                            </div>
                          ) : (
                            <div>
                              {w.utr && <p>UTR: <span className="font-mono">{w.utr}</span></p>}
                              {w.rejection_reason && <p className="text-destructive">{w.rejection_reason}</p>}
                              {w.processed_at && <p className="text-muted-foreground">{new Date(w.processed_at).toLocaleString()}</p>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isPending && (
                            <div className="flex flex-col gap-1">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7" onClick={() => approveWithdrawal(w)}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>
                              <Button size="sm" variant="destructive" className="h-7" onClick={() => rejectWithdrawal(w)}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {withdrawals.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No withdrawal requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* KYC Review Dialog */}
      <Dialog open={!!reviewKyc} onOpenChange={(o) => !o && setReviewKyc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review KYC — {reviewKyc?.full_name_kyc}</DialogTitle></DialogHeader>
          {reviewKyc && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-muted-foreground">PAN</p><p className="font-mono">{reviewKyc.pan_number}</p></div>
                <div><p className="text-xs text-muted-foreground">Aadhaar</p><p className="font-mono">{reviewKyc.aadhaar_number}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => openDoc(reviewKyc.pan_document_url)}><ExternalLink className="w-3 h-3 mr-1" />PAN Doc</Button>
                <Button variant="outline" size="sm" onClick={() => openDoc(reviewKyc.aadhaar_front_url)}><ExternalLink className="w-3 h-3 mr-1" />Aadhaar Front</Button>
                <Button variant="outline" size="sm" onClick={() => openDoc(reviewKyc.aadhaar_back_url)}><ExternalLink className="w-3 h-3 mr-1" />Aadhaar Back</Button>
                <Button variant="outline" size="sm" onClick={() => openDoc(reviewKyc.selfie_url)}><ExternalLink className="w-3 h-3 mr-1" />Selfie</Button>
              </div>
              <Textarea placeholder="Rejection reason (if rejecting)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => reviewDecision("rejected")}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
            <Button onClick={() => reviewDecision("approved")} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
          {editTx && (
            <div className="space-y-3">
              <p className="text-sm">{editTx.plan_name} — ₹{Number(editTx.amount).toLocaleString()}</p>
              <div>
                <label className="text-xs text-muted-foreground">Returns Amount (₹)</label>
                <Input type="number" value={returnsInput} onChange={(e) => setReturnsInput(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Current Value (₹)</label>
                <Input type="number" value={valueInput} onChange={(e) => setValueInput(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateTx("success")}>Mark Success</Button>
                <Button size="sm" variant="outline" onClick={() => updateTx("failed")}>Mark Failed</Button>
                <Button size="sm" variant="outline" onClick={() => updateTx("pending")}>Mark Pending</Button>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => updateTx()}>Save Returns</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Daily Interest Dialog */}
      <Dialog open={!!creditUser} onOpenChange={(o) => !o && setCreditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Credit Daily Interest</DialogTitle></DialogHeader>
          {creditUser && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-sm font-medium">{creditUser.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">Invested: ₹{userInvested(creditUser.user_id).toLocaleString()} · Total Interest: ₹{userInterest(creditUser.user_id).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Interest Amount (₹) *</label>
                <Input type="number" placeholder="e.g. 50" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Note (optional)</label>
                <Input placeholder="Daily interest" value={creditNote} onChange={(e) => setCreditNote(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">User will see this on their dashboard as today's interest.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditUser(null)}>Cancel</Button>
            <Button onClick={submitCredit} className="bg-green-600 hover:bg-green-700"><Coins className="w-4 h-4 mr-1" />Credit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk % Credit Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Credit Daily Interest to All Users</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground">Total invested across all users</p>
              <p className="text-xl font-bold text-primary">₹{totalInvested.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Interest % (per invested amount) *</label>
              <Input type="number" step="0.01" placeholder="e.g. 1.83 (means 1.83% of invested)" value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} />
              {bulkPercent && Number(bulkPercent) > 0 && (
                <p className="text-xs text-green-500 mt-1">
                  Example: A user with ₹19,640 invested will get ₹{Math.round(19640 * Number(bulkPercent)) / 100}.
                  Total payout ≈ ₹{(Math.round(totalInvested * Number(bulkPercent)) / 100).toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Note (optional)</label>
              <Input placeholder="Daily interest" value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Each user's "Today's interest" banner will reflect their share immediately.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkBusy}>Cancel</Button>
            <Button onClick={submitBulkCredit} disabled={bulkBusy} className="bg-green-600 hover:bg-green-700">
              {bulkBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Coins className="w-4 h-4 mr-1" />}
              Credit All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
