import { supabase } from './supabaseClient';

export interface PinVerifyResult {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  error?: string;
  lockedUntil?: string;
}

export interface SessionValidateResult {
  valid: boolean;
  expiresAt?: string;
}

/**
 * Verifies the admin PIN by calling the server-side edge function.
 * The PIN is never stored or compared in the frontend.
 * On success, a server-side session token is returned and kept in memory only.
 */
export async function verifyAdminPin(pin: string): Promise<PinVerifyResult> {
  if (!pin || pin.length !== 6) {
    return { success: false, error: 'Ongeldige code.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('verify-admin-pin', {
      body: { pin },
    });

    if (error) {
      return { success: false, error: 'Ongeldige code.' };
    }

    if (data?.success && data?.sessionToken) {
      return {
        success: true,
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
      };
    }

    if (data?.locked) {
      return {
        success: false,
        error: 'Te veel pogingen. Probeer het later opnieuw.',
        lockedUntil: data.lockedUntil,
      };
    }

    if (data?.configMissing) {
      return { success: false, error: 'Adminconfiguratie ontbreekt.' };
    }

    return { success: false, error: 'Ongeldige code.' };
  } catch {
    return { success: false, error: 'Ongeldige code.' };
  }
}

/**
 * Validates a session token server-side. The server checks the token
 * against the admin_sessions table and extends the session on success.
 */
export async function validateAdminSession(sessionToken: string): Promise<SessionValidateResult> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-admin-session', {
      body: { sessionToken },
    });

    if (error) {
      return { valid: false };
    }

    if (data?.valid) {
      return { valid: true, expiresAt: data.expiresAt };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Logs out the admin by deleting the server-side session.
 */
export async function logoutAdminSession(sessionToken: string): Promise<void> {
  try {
    await supabase.functions.invoke('admin-logout', {
      body: { sessionToken },
    });
  } catch {
    // Best-effort logout — session will expire on its own
  }
}
