/* Harmonia site script: header, mega menu, drawer, catalog filters, gallery, contact form.
   Vanilla, ~4 KB, no jQuery. Category data comes from the Rentlyz embed (`rentlyz:ready`). */
(function () {
  'use strict';
  var d = document;
  var q = function (s, r) { return (r || d).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* Header shadow once scrolled */
  var header = q('.hd-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mega menu (keyboard: the toggle button; pointer: CSS :hover) */
  var megaToggle = q('.hd-nav__toggle');
  var mega = q('.hd-mega');
  if (megaToggle && mega) {
    megaToggle.addEventListener('click', function () {
      var open = megaToggle.getAttribute('aria-expanded') !== 'true';
      megaToggle.setAttribute('aria-expanded', String(open));
      mega.hidden = !open;
      mega.classList.toggle('is-open', open);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mega.classList.contains('is-open')) { megaToggle.click(); megaToggle.focus(); }
    });
    d.addEventListener('click', function (e) {
      if (mega.classList.contains('is-open') && !e.target.closest('.hd-nav__item--mega')) { megaToggle.click(); }
    });
  }

  /* Mobile drawer */
  var burger = q('.hd-burger');
  var drawer = q('#hd-drawer');
  var lastFocus = null;
  var setDrawer = function (open) {
    if (!drawer || !burger) return;
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    d.body.classList.toggle('hd-drawer-open', open);
    if (open) { lastFocus = d.activeElement; (q('.hd-drawer__close') || drawer).focus(); }
    else if (lastFocus) { lastFocus.focus(); }
  };
  if (burger) burger.addEventListener('click', function () { setDrawer(drawer.hidden); });
  qa('[data-close-drawer]').forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer && !drawer.hidden) setDrawer(false); });

  /* Catalog: mobile filter drawer */
  var filters = q('#hd-filters');
  var filterToggle = q('.hd-filter-toggle');
  var setFilters = function (open) {
    if (!filters) return;
    filters.classList.toggle('is-open', open);
    if (filterToggle) filterToggle.setAttribute('aria-expanded', String(open));
  };
  if (filterToggle) filterToggle.addEventListener('click', function () { setFilters(!filters.classList.contains('is-open')); });
  qa('[data-close-filters]').forEach(function (el) { el.addEventListener('click', function () { setFilters(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && filters && filters.classList.contains('is-open')) setFilters(false); });

  /* Gallery lightbox (<dialog>) */
  var lightbox = q('.hd-lightbox');
  if (lightbox && lightbox.showModal) {
    var lbImg = q('img', lightbox);
    d.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lightbox]');
      if (!a) return;
      e.preventDefault();
      lbImg.src = a.href;
      lbImg.alt = (q('img', a) || {}).alt || '';
      lightbox.showModal();
    });
    q('.hd-lightbox__close', lightbox).addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
  }

  /* Contact form → prefilled WhatsApp message (works on static hosting, no mail server needed) */
  var form = q('.hd-contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = function (n) { return (form.elements[n] && form.elements[n].value.trim()) || ''; };
      var lines = [f('subject') || 'פנייה מהאתר', '', f('name'), f('phone'), f('email'), '', f('message')].filter(function (l, i) { return l !== '' || i === 1 || i === 5; });
      window.open(form.dataset.whatsapp + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* ---------- Things that need the Rentlyz business payload ---------- */
  var titleOf = function (c, locale) { return typeof c.title === 'object' ? (c.title[locale] || c.title.he || c.title.en) : c.title; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
  var catHref = function (base, c, sub) {
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    return base + sep + 'rentlyz_category=' + c.id + (sub ? '&rentlyz_subcategory=' + sub.id : '');
  };

  var onReady = function (R) {
    var business = R && R.business;
    if (!business) return;
    var locale = (R.options && R.options.locale) || 'he';
    var cats = business.categories || [];

    /* Mega menu columns */
    var megaInner = q('.hd-mega__inner');
    if (megaInner && !megaInner.dataset.filled) {
      megaInner.dataset.filled = '1';
      var base = megaInner.dataset.href;
      var html = cats.map(function (c) {
        var subs = (c.subcategories || []).filter(function (s) { return s.listings_count !== 0; });
        return '<div class="hd-mega__group"><a href="' + esc(catHref(base, c)) + '">' + esc(titleOf(c, locale)) + '</a>' +
          (subs.length ? '<ul>' + subs.map(function (s) { return '<li><a href="' + esc(catHref(base, c, s)) + '">' + esc(titleOf(s, locale)) + '</a></li>'; }).join('') + '</ul>' : '') +
          '</div>';
      }).join('');
      megaInner.insertAdjacentHTML('afterbegin', html);
    }

    /* Drawer category list */
    var drawerCats = q('.hd-drawer__cats');
    if (drawerCats && !drawerCats.children.length) {
      drawerCats.innerHTML = cats.map(function (c) {
        return '<li><a href="' + esc(catHref(drawerCats.dataset.href, c)) + '">' + esc(titleOf(c, locale)) + '</a></li>';
      }).join('');
    }

    /* Footer "top categories": the site lists the chair subcategories */
    var footerCats = q('.hd-footer__cats');
    if (footerCats) {
      var parent = cats.filter(function (c) { return String(c.id) === footerCats.dataset.category; })[0] || cats[0];
      var subs = parent ? (parent.subcategories || []).slice(0, 6) : [];
      if (subs.length) {
        footerCats.innerHTML = subs.map(function (s) {
          return '<li><a href="' + esc(catHref(footerCats.dataset.href, parent, s)) + '">' + esc(titleOf(s, locale)) + '</a></li>';
        }).join('');
      }
    }

    /* Catalog: "N פריטים" */
    var count = q('[data-listings-count]');
    if (count && business.listings_count) {
      q('[data-count]', count).textContent = Number(business.listings_count).toLocaleString(locale === 'he' ? 'he-IL' : 'en-US');
      count.hidden = false;
    }

    /* Home: events collage from the business gallery */
    var collage = q('.hd-events__collage');
    if (collage && !collage.children.length) {
      var pics = (business.gallery_preview || []).map(function (g) { return g.url; }).filter(Boolean).slice(0, 4);
      while (pics.length < 4 && collage.dataset.fallback) pics.push(collage.dataset.fallback);
      collage.innerHTML = pics.map(function (u) { return '<img src="' + esc(u) + '" alt="" loading="lazy" decoding="async" />'; }).join('');
    }

    /* Gallery page: append the business gallery */
    var gallery = q('[data-rentlyz-gallery]');
    if (gallery) {
      (business.gallery_preview || []).forEach(function (g) {
        if (!g.url || q('a[href="' + g.url + '"]', gallery)) return;
        gallery.insertAdjacentHTML('beforeend', '<a class="hd-gallery__item" href="' + esc(g.url) + '" data-lightbox><img src="' + esc(g.url) + '" alt="" loading="lazy" decoding="async" /></a>');
      });
    }
  };

  if (window.Rentlyz && window.Rentlyz.business) onReady(window.Rentlyz);
  d.addEventListener('rentlyz:ready', function (e) { onReady(e.detail); });
})();
