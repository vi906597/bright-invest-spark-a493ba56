import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await userClient.auth.getUser(token);
    if (uErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const admin = createClient(url, service);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });

    const body = await req.json();
    const action = body.action as string;

    if (action === "lookup") {
      const email = (body.email as string)?.trim().toLowerCase();
      if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      // Find user by email via admin listUsers (paginated)
      let target: any = null;
      let page = 1;
      while (page <= 20) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) break;
        target = data.users.find((u: any) => (u.email || "").toLowerCase() === email);
        if (target) break;
        if (data.users.length < 200) break;
        page++;
      }
      if (!target) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

      const uid = target.id;
      const [profile, txs, credits, kyc, banks] = await Promise.all([
        admin.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
        admin.from("transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        admin.from("daily_interest_credits").select("*").eq("user_id", uid).order("credit_date", { ascending: false }),
        admin.from("kyc_submissions").select("*").eq("user_id", uid).maybeSingle(),
        admin.from("bank_accounts").select("*").eq("user_id", uid),
      ]);

      return new Response(JSON.stringify({
        user: { id: uid, email: target.email, created_at: target.created_at },
        profile: profile.data,
        transactions: txs.data || [],
        credits: credits.data || [],
        kyc: kyc.data,
        banks: banks.data || [],
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "pending_kycs") {
      const { data: kycs } = await admin.from("kyc_submissions").select("*").eq("status", "pending").order("submitted_at", { ascending: false });
      const list = kycs || [];
      // fetch emails for these users
      const emails: Record<string, string> = {};
      let page = 1;
      while (page <= 20) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) break;
        for (const u of data.users) emails[u.id] = u.email || "";
        if (data.users.length < 200) break;
        page++;
      }
      const withEmails = list.map((k: any) => ({ ...k, email: emails[k.user_id] || "" }));
      return new Response(JSON.stringify({ kycs: withEmails }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "check_kyc") {
      const targetUserId = body.user_id as string;
      const { data } = await admin.from("kyc_submissions").select("status").eq("user_id", targetUserId).maybeSingle();
      return new Response(JSON.stringify({ status: data?.status || "none" }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "deposit" || action === "add_sip") {
      const targetUserId = body.user_id as string;
      const amount = Number(body.amount);
      const note = (body.note as string) || (action === "add_sip" ? "Admin SIP" : "Admin deposit");
      const planName = (body.plan_name as string) || (action === "add_sip" ? "Admin SIP" : "Manual Deposit");
      const txType = action === "add_sip" ? "sip" : ((body.type as string) || "deposit");
      const createdAt = body.created_at as string | undefined;
      if (!targetUserId || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "user_id and positive amount required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      }
      const payload: any = {
        user_id: targetUserId,
        plan_name: planName,
        amount,
        type: txType,
        status: "success",
        notes: note,
        razorpay_payment_id: `ADMIN-${Date.now()}`,
      };
      if (createdAt) payload.created_at = createdAt;
      const { data, error } = await admin.from("transactions").insert(payload).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, transaction: data }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
