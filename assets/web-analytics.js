(() => {
  'use strict';

  // Keep local previews and copied versions out of the live site's statistics.
  if (window.location.protocol !== 'https:' || window.location.hostname !== 'yu11123.github.io') return;

  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  // This is the public site identifier from Cloudflare's installation snippet, not an API key.
  beacon.dataset.cfBeacon = JSON.stringify({token: '372ad5c5d30e4fe5ba2c397055f858b0'});
  document.body.appendChild(beacon);
})();
