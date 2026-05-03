import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mid = Deno.env.get("BHARAT4U_MID")!;
    const key = Deno.env.get("BHARAT4U_KEY")!;

    const body = new URLSearchParams({
      bharat_mid: mid,
      bharat_key: key,
      order_id,
    });

    const resp = await fetch("https://api.bharat4ubiz.site/api/payin/v1/check-status", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await resp.json();

    const status = (data?.result?.status || "").toLowerCase();
    const utr = data?.result?.utr || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let mapped = "pending";
    if (status === "success") mapped = "success";
    else if (status === "failed" || status === "failure") mapped = "failed";

    await supabase
      .from("transactions")
      .update({
        status: mapped,
        razorpay_payment_id: utr,
      })
      .eq("razorpay_order_id", order_id);

    return new Response(JSON.stringify({ status: mapped, utr, raw: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
