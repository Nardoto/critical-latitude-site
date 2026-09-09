'use strict';

document.documentElement.classList.add('js');

// Mobile navigation: native button, Escape support, and no hidden desktop links.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
const desktop = window.matchMedia('(min-width: 1024px)');

function closeMenu(restoreFocus = false) {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a') && !desktop.matches) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu(true);
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header') && menuButton.getAttribute('aria-expanded') === 'true') closeMenu();
});

desktop.addEventListener('change', () => closeMenu());

// FAQ: allow one answer at a time. Native details work when JS is unavailable.
const faqItems = [...document.querySelectorAll('.faq-item')];
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

// Smooth scrolling uses CSS and native fragment links, preserving browser history,
// focus behavior, file:// compatibility, and prefers-reduced-motion support.
