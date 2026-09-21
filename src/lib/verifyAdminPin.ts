import { supabase } from './supabaseClient';

export interface PinVerifyResult {
  success: boolean;
  error?: string;
  lockedUntil?: string;
}

/**
 * Verifies the admin PIN by calling the server-side edge function.
 * The PIN is never stored or compared in the frontend — it is sent
 * to the edge function which compares its hash against ADMIN_PIN_HASH.
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
      return { success: false, error: 'Er is een fout opgetreden. Probeer het opnieuw.' };
    }

    if (data?.success) {
      return { success: true };
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
    return { success: false, error: 'Er is een fout opgetreden. Probeer het opnieuw.' };
  }
}
