/*
 * Rentlyz website integration loader.
 *
 * Served as  https://<business-slug>.embed.rentlyz.com/rentlyz.js
 * (or any host; the business can also be given as data-business on the
 * script tag or via window.rentlyzOptions.business).
 *
 * Mirrors the Booqable pattern: a tiny per-business loader that fills
 * window.rentlyzOptions with defaults and then loads the shared, CDN cached
 * application bundle which mounts components into placeholder divs:
 *
 *   <div class="rentlyz-datepicker"></div>
 *   <div class="rentlyz-product-list" data-per="12" data-show-search="true"></div>
 *   <div class="rentlyz-product" data-id="<listing uuid>"></div>
 *   <div class="rentlyz-product-button" data-id="<listing uuid>"></div>
 *   <div class="rentlyz-cart-button"></div>
 */
(function () {
  var script = document.currentScript;
  var opts = (window.rentlyzOptions = window.rentlyzOptions || {});

  function setOption(key, value) {
    if (opts[key] === undefined || opts[key] === null || opts[key] === '') {
      opts[key] = value;
    }
  }

  // Business slug or numeric id. Priority: explicit option, data attribute,
  // first label of the script host (<slug>.embed.rentlyz.com).
  var businessFromHost = null;
  if (script && script.src) {
    try {
      var host = new URL(script.src).hostname;
      var match = host.match(/^([a-z0-9-]+)\.embed\.rentlyz\.com$/i);
      if (match) {businessFromHost = match[1];}
    } catch (e) {
      /* ignore */
    }
  }
  setOption('business', (script && script.getAttribute('data-business')) || businessFromHost);

  // Where the shared application bundle lives. Overridable for local dev.
  var assetsURL = (script && script.getAttribute('data-assets-url')) || null;
  if (!assetsURL && script && script.src) {
    try {
      var u = new URL(script.src);
      assetsURL = u.origin + u.pathname.replace(/[^/]*$/, '');
    } catch (e) {
      /* ignore */
    }
  }
  setOption('assetsURL', assetsURL || 'https://cdn.rentlyz.com/embed/');
  setOption('apiURL', 'https://api.rentlyz.com/api');
  setOption('appURL', 'https://rentlyz.com');
  setOption('locale', (script && script.getAttribute('data-locale')) || 'he');
  setOption('primaryColor', (script && script.getAttribute('data-color')) || '#5B47FB');
  setOption('storeProvider', (script && script.getAttribute('data-store-provider')) || 'custom');
  setOption('environment', 'production');

  if (!opts.business) {
    console.warn('[rentlyz] No business configured. Add data-business="<slug>" to the script tag.');
    return;
  }

  function load(src) {
    var el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.crossOrigin = 'anonymous';
    el.charset = 'UTF-8';
    (document.head || document.body).appendChild(el);
  }

  if (!window.__rentlyzAppLoaded) {
    window.__rentlyzAppLoaded = true;
    load(opts.assetsURL + 'rentlyz-app.js');
  }
})();
