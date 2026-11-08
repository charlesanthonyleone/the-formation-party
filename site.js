(() => {
  const button = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!button || !nav) return;
  button.hidden = false;
  document.documentElement.classList.add('js');
  const close = () => { button.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { close(); button.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) close(); });
  window.addEventListener('hashchange', close);
  window.matchMedia('(min-width: 761px)').addEventListener('change', close);
})();
