export const SW_REGISTER_SCRIPT = `(function(){
    if (!('serviceWorker' in navigator)) return;
    var blocked = ${import.meta.env.PROD ? "false" : "true"} || window.self !== window.top || new URLSearchParams(location.search).get('sw') === 'off';
    if (blocked) {
      navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){
        var w = r.active || r.waiting || r.installing;
        if (w) w.postMessage({ type: 'SKIP_WAITING' });
        r.unregister();
      }); });
      return;
    }
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { type: 'classic' });
    });
  })();`;

export async function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV || window.self !== window.top || new URLSearchParams(window.location.search).get("sw") === "off") {
    const rs = await navigator.serviceWorker.getRegistrations();
    rs.forEach(r => r.unregister());
    return;
  }
  try {
    await navigator.serviceWorker.register("/sw.js", { type: "classic" });
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}
