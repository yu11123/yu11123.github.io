(() => {
  const link = document.querySelector('[data-redirect]');
  if (!link) return;
  const target = new URL(link.getAttribute('href'), location.href);
  if (target.origin !== location.origin) return;
  if (!target.hash) target.hash = location.hash;
  location.replace(target.href);
})();
