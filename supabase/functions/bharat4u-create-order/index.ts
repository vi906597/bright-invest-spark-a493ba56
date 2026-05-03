import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { amount, plan_name, customer_mobile } = await req.json();

    if (!amount || Number(amount) < 1) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mid = Deno.env.get("BHARAT4U_MID");
    const key = Deno.env.get("BHARAT4U_KEY");
    if (!mid || !key) {
      return new Response(JSON.stringify({ error: "Bharat4u credentials missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth user
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order_id = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const mobile = customer_mobile || "9999999999";

    const body = new URLSearchParams({
      bharat_mid: mid,
      bharat_key: key,
      order_id,
      amount: String(amount),
      customer_mobile: String(mobile),
    });

    const resp = await fetch("https://api.bharat4ubiz.site/api/payin/v1/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await resp.json();

    if (!data?.status || !data?.result?.payment_url) {
      return new Response(JSON.stringify({ error: data?.message || "Order failed", raw: data }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert pending transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      plan_name: plan_name || "Custom SIP",
      amount: Number(amount),
      type: "sip",
      status: "pending",
      razorpay_order_id: order_id,
    });

    return new Response(JSON.stringify({
      order_id,
      payment_url: data.result.payment_url,
      amount: data.result.amount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
