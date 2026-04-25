/**
 * Browser Web Push helpers.
 *
 * Flow used by the Settings toggle:
 *   1. fetch /push/public-key
 *   2. registerSW() to ensure /sw.js is active
 *   3. PushManager.subscribe with the VAPID key
 *   4. POST /push/subscribe with the resulting endpoint + keys
 *
 * Unsubscribe is the inverse: PushManager.unsubscribe + DELETE /push/subscribe.
 */

const SW_PATH = "/sw.js";

export type PushStatus =
  | "unsupported"
  | "denied"
  | "prompt"
  | "subscribed"
  | "unsubscribed";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerSW(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser");
  }
  // Reuse an existing registration if one is already active for this scope.
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH);
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

/**
 * Resolve the current high-level status. Used to drive the Settings UI.
 */
export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  const sub = await getCurrentSubscription();
  if (sub) return "subscribed";

  return Notification.permission === "default" ? "prompt" : "unsubscribed";
}

/**
 * VAPID public keys are URL-safe base64. PushManager.subscribe wants a raw
 * Uint8Array, so we have to decode.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Convert a PushSubscription to the JSON shape our backend's /push/subscribe
 * endpoint expects. Browsers expose `toJSON()` but the result types are loose;
 * we narrow it here.
 */
export interface SerializedPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function serializeSubscription(sub: PushSubscription): SerializedPushSubscription {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Push subscription is missing endpoint or keys");
  }
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}

/**
 * Request browser permission and create a PushSubscription. The caller is
 * responsible for sending the result to the backend.
 *
 * Throws when:
 *   - browser doesn't support push (status is "unsupported")
 *   - the user explicitly denies permission
 */
export async function subscribeBrowser(
  vapidPublicKey: string,
): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Browser does not support push notifications");
  }

  // Permission must be requested from a user-gesture handler — Settings
  // page button click qualifies.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const reg = await registerSW();
  // Wait until the worker is actually ready before subscribing — Chrome
  // returns a registration synchronously but PushManager isn't ready yet.
  await navigator.serviceWorker.ready;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

/**
 * Unsubscribe from the browser side. Returns the endpoint that was active so
 * the caller can tell the backend to delete it.
 */
export async function unsubscribeBrowser(): Promise<string | null> {
  const sub = await getCurrentSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}
