import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { pin } = await req.json();

    if (!pin || typeof pin !== "string" || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ success: false, error: "Ongeldige code." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read the PIN hash from the admin_config table (service role bypasses RLS)
    const { data: configRow, error: configError } = await supabase
      .from("admin_config")
      .select("value")
      .eq("key", "admin_pin_hash")
      .maybeSingle();

    if (configError || !configRow?.value) {
      return new Response(
        JSON.stringify({ success: false, configMissing: true, error: "Adminconfiguratie ontbreekt." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminPinHash = configRow.value;

    // Get client IP for rate limiting
    const forwardHeader = req.headers.get("x-forwarded-for") || "";
    const clientIp = forwardHeader.split(",")[0].trim() || "unknown";
    const ipHash = await sha256(clientIp);

    const now = Date.now();

    // Check existing rate-limit record
    const { data: existing } = await supabase
      .from("admin_pin_attempts")
      .select("attempt_count, first_attempt_at, locked_until")
      .eq("ip_hash", ipHash)
      .maybeSingle();

    // If locked, deny
    if (existing?.locked_until) {
      const lockedUntilMs = new Date(existing.locked_until).getTime();
      if (now < lockedUntilMs) {
        return new Response(
          JSON.stringify({
            success: false,
            locked: true,
            lockedUntil: existing.locked_until,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // If the sliding window has expired, reset the attempt count
    let attemptCount = existing?.attempt_count ?? 0;
    if (existing?.first_attempt_at) {
      const windowStartMs = new Date(existing.first_attempt_at).getTime();
      if (now - windowStartMs > WINDOW_MS) {
        attemptCount = 0;
      }
    }

    // Hash the submitted PIN and compare
    const submittedHash = await sha256(pin);

    if (submittedHash === adminPinHash) {
      // Successful: reset rate-limit counter
      if (existing) {
        await supabase
          .from("admin_pin_attempts")
          .update({ attempt_count: 0, first_attempt_at: null, locked_until: null })
          .eq("ip_hash", ipHash);
      }
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Failed attempt: increment counter
    const newAttemptCount = attemptCount + 1;
    const shouldLock = newAttemptCount >= MAX_ATTEMPTS;

    if (existing) {
      await supabase
        .from("admin_pin_attempts")
        .update({
          attempt_count: shouldLock ? 0 : newAttemptCount,
          first_attempt_at: attemptCount === 0 ? new Date(now).toISOString() : existing.first_attempt_at,
          locked_until: shouldLock ? new Date(now + LOCKOUT_MS).toISOString() : existing.locked_until,
        })
        .eq("ip_hash", ipHash);
    } else {
      await supabase
        .from("admin_pin_attempts")
        .insert({
          ip_hash: ipHash,
          attempt_count: shouldLock ? 0 : newAttemptCount,
          first_attempt_at: new Date(now).toISOString(),
          locked_until: shouldLock ? new Date(now + LOCKOUT_MS).toISOString() : null,
        });
    }

    if (shouldLock) {
      return new Response(
        JSON.stringify({
          success: false,
          locked: true,
          lockedUntil: new Date(now + LOCKOUT_MS).toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Ongeldige code." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Er is een fout opgetreden." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
