import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let payload: any = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const txt = await req.text();
      try { payload = JSON.parse(txt); }
      catch {
        const params = new URLSearchParams(txt);
        payload = Object.fromEntries(params.entries());
      }
    }

    const order_id = payload.order_id || payload.orderId;
    const status = String(payload.status || "").toUpperCase();
    const utr = payload.utr || null;

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id missing" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let mapped = "pending";
    if (status === "SUCCESS") mapped = "success";
    else if (status === "FAILED" || status === "FAILURE") mapped = "failed";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase
      .from("transactions")
      .update({ status: mapped, razorpay_payment_id: utr })
      .eq("razorpay_order_id", order_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
