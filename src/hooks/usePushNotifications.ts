import { useCallback, useEffect, useState } from "react";
import { pushApi } from "@/lib/api";
import {
  getPushStatus,
  isPushSupported,
  serializeSubscription,
  subscribeBrowser,
  unsubscribeBrowser,
  type PushStatus,
} from "@/lib/push";

interface UsePushNotificationsResult {
  status: PushStatus;
  /** True while subscribe/unsubscribe is in flight. */
  busy: boolean;
  /** Last error message (e.g. permission denied, network error). Cleared on next call. */
  error: string | null;
  /** Initiate the full subscribe flow. Resolves true on success. */
  subscribe: () => Promise<boolean>;
  /** Tear down browser sub + tell backend. Resolves true on success. */
  unsubscribe: () => Promise<boolean>;
  /** Re-check current state — useful after the user changes browser permission. */
  refresh: () => Promise<void>;
}

/**
 * Single source of truth for the push toggle in Settings.
 * Owns: status detection, permission request, subscribe/unsubscribe round-trips.
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const [status, setStatus] = useState<PushStatus>(
    isPushSupported() ? "prompt" : "unsupported",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await getPushStatus());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setError("This browser does not support push notifications");
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const { publicKey } = await pushApi.getPublicKey();
      if (!publicKey) {
        setError("Push notifications are not configured on the server");
        return false;
      }

      const sub = await subscribeBrowser(publicKey);
      const serialized = serializeSubscription(sub);

      try {
        await pushApi.subscribe({
          ...serialized,
          userAgent: navigator.userAgent,
        });
      } catch (err) {
        // Server registration failed — undo the browser subscription so we
        // don't end up with a dangling browser sub the server doesn't know.
        await sub.unsubscribe().catch(() => undefined);
        throw err;
      }

      setStatus("subscribed");
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to enable push notifications";
      setError(msg);
      // Re-read the status so the UI reflects whatever ended up persisting.
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const endpoint = await unsubscribeBrowser();
      if (endpoint) {
        // Best-effort — even if backend delete fails, the browser sub is gone.
        await pushApi.unsubscribe(endpoint).catch(() => undefined);
      }
      setStatus("unsubscribed");
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to disable push notifications";
      setError(msg);
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { status, busy, error, subscribe, unsubscribe, refresh };
}
