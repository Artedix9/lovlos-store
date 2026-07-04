/* LOVLOS service worker — shows new-order alerts pushed to the admin. */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* non-JSON payload — show a generic alert */
  }
  const title = data.title || "LOVLOS";
  const options = {
    body: data.body || "New activity on your store.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: data.url || "/admin" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.includes("/admin") && "focus" in win) return win.focus();
      }
      return clients.openWindow(url);
    })
  );
});
