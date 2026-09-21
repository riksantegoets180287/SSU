import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

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
      JSON.stringify({ valid: false }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { sessionToken } = await req.json();

    if (!sessionToken || typeof sessionToken !== "string") {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const tokenHash = await sha256(sessionToken);
    const now = Date.now();

    const { data: session, error } = await supabase
      .from("admin_sessions")
      .select("id, expires_at, last_activity_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !session) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if session has expired (based on last activity + timeout)
    const lastActivityMs = new Date(session.last_activity_at).getTime();
    const expiresMs = new Date(session.expires_at).getTime();
    const effectiveExpiry = Math.min(expiresMs, lastActivityMs + SESSION_TIMEOUT_MS);

    if (now >= effectiveExpiry) {
      // Session expired — delete it
      await supabase.from("admin_sessions").delete().eq("id", session.id);
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extend the session: update last_activity_at and expires_at
    const newExpiresIso = new Date(now + SESSION_TIMEOUT_MS).toISOString();
    await supabase
      .from("admin_sessions")
      .update({ last_activity_at: new Date(now).toISOString(), expires_at: newExpiresIso })
      .eq("id", session.id);

    return new Response(
      JSON.stringify({ valid: true, expiresAt: newExpiresIso }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
