const products = [
  { submitted: 'https://link.amazon/B04G1MEwY', asin: '', listing: '', terms: '', status: 'IDENTITY UNVERIFIED' },
  { submitted: 'https://link.amazon/B02NbDxp3', asin: '', listing: '', terms: '', status: 'IDENTITY UNVERIFIED' },
  { submitted: 'https://link.amazon/B00hJ57DV', asin: '', listing: '', terms: '', status: 'IDENTITY UNVERIFIED' },
  { submitted: 'https://link.amazon/B0c8moW59', asin: '', listing: '', terms: '', status: 'IDENTITY UNVERIFIED' },
  { submitted: 'https://link.amazon/B0f3GKalj', asin: '', listing: '', terms: '', status: 'IDENTITY UNVERIFIED' }
];
const tbody = document.querySelector('#product-rows');
if (tbody) tbody.innerHTML = products.map(p => `<tr><td><a href="${p.submitted}" target="_blank" rel="sponsored nofollow noopener" data-outbound>${p.submitted.replace('https://','')}</a></td><td>${p.asin}</td><td>${p.listing}</td><td>${p.terms}</td><td><span class="status">${p.status}</span></td></tr>`).join('');
// Local, browser-only counter. No request is made and no conversion is inferred.
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-outbound]');
  if (!link) return;
  const key = 'counter-notes-outbound-clicks-v1';
  try { localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + 1)); } catch (_) { /* Storage may be disabled; navigation still works. */ }
});
const menu = document.querySelector('.menu');
if (menu) menu.addEventListener('click', () => {
  const nav = document.querySelector('header nav');
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
