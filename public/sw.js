/* RenewPilot service worker — receives Web Push events and shows
   notifications. Lives at the origin root so its scope is the whole app. */

self.addEventListener("install", (event) => {
  // Activate immediately on first install — no need to wait for tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: "RenewPilot", body: event.data.text() };
  }

  const title = payload.title || "RenewPilot";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.svg",
    badge: payload.badge || "/favicon.svg",
    tag: payload.tag || "renewpilot",
    data: { url: payload.url || "/dashboard", ...(payload.data || {}) },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // If a tab for this app is already open, focus it and navigate.
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          const selfUrl = new URL(self.registration.scope);
          if (clientUrl.origin === selfUrl.origin) {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }
            return;
          }
        } catch {
          /* ignore */
        }
      }

      // No tab open — open a fresh one.
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
