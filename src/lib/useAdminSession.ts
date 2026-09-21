import { useState, useRef, useEffect, useCallback } from 'react';
import { validateAdminSession, logoutAdminSession } from './verifyAdminPin';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const VALIDATION_INTERVAL_MS = 5 * 60 * 1000; // validate every 5 minutes

export interface AdminSessionState {
  isAuthenticated: boolean;
  sessionToken: string | null;
  authenticating: boolean;
  login: (token: string) => void;
  logout: () => void;
}

/**
 * Shared admin session manager.
 *
 * - The session token is kept in memory only (never localStorage/sessionStorage/cookies).
 * - After 30 minutes of inactivity (no user input), the admin is automatically logged out.
 * - Every 5 minutes, the session is validated server-side.
 * - On logout, the server-side session is deleted.
 */
export function useAdminSession(): AdminSessionState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (validationTimerRef.current) {
      clearInterval(validationTimerRef.current);
      validationTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = tokenRef.current;
    if (token) {
      await logoutAdminSession(token);
    }
    tokenRef.current = null;
    setSessionToken(null);
    setIsAuthenticated(false);
    clearTimers();
  }, [clearTimers]);

  const resetInactivityTimer = useCallback(() => {
    if (!tokenRef.current) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  const login = useCallback((token: string) => {
    tokenRef.current = token;
    setSessionToken(token);
    setIsAuthenticated(true);
    setAuthenticating(false);

    // Start inactivity timer
    resetInactivityTimer();

    // Start periodic server-side validation
    validationTimerRef.current = setInterval(async () => {
      const currentToken = tokenRef.current;
      if (!currentToken) return;
      const result = await validateAdminSession(currentToken);
      if (!result.valid) {
        tokenRef.current = null;
        setSessionToken(null);
        setIsAuthenticated(false);
        clearTimers();
      }
    }, VALIDATION_INTERVAL_MS);
  }, [resetInactivityTimer, clearTimers]);

  // Track user activity to reset the inactivity timer
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    isAuthenticated,
    sessionToken,
    authenticating,
    login,
    logout,
  };
}
