// Standard inline service-worker registration, injected into the page <head> so
// crawlers like PWABuilder detect it. Refuses (and unregisters) in dev, iframes and Lovable preview.
export const SW_REGISTER_SCRIPT = `(function(){
  if (!('serviceWorker' in navigator)) return;
  var h = location.hostname;
  var blocked = ${import.meta.env.PROD ? "false" : "true"} || window.self !== window.top ||
    h.indexOf('id-preview--') === 0 || h.indexOf('preview--') === 0 ||
    /(^|\\.)lovableproject\\.com$/.test(h) || /(^|\\.)lovableproject-dev\\.com$/.test(h) ||
    /(^|\\.)beta\\.lovable\\.dev$/.test(h) || new URLSearchParams(location.search).get('sw') === 'off';
  if (blocked) {
    navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){
      var w = r.active || r.waiting || r.installing;
      if (w && /\\/sw\\.js$/.test(w.scriptURL)) r.unregister();
    }); });
    return;
  }
  window.addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js'); });
})();`;

export const registerSW = () => {};
