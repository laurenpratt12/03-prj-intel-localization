/**
 * Dynamic language detection and RTL/LTR switching
 * Detects Google Translate changes and updates site text to the selected language.
 */

const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
const fallbackLanguage = 'en';
const supportedLanguages = Object.keys(translations);

function normalizeLanguageCode(code) {
  if (!code) return fallbackLanguage;
  return code.toLowerCase().split(/[-_]/)[0];
}

function detectGoogleTranslateLanguage() {
  let lang = document.documentElement.lang || document.body.lang || '';
  lang = normalizeLanguageCode(lang);

  if (supportedLanguages.includes(lang)) {
    return lang;
  }

  const classNames = `${document.documentElement.className} ${document.body.className}`;
  if (/translated/i.test(classNames)) {
    if (document.documentElement.dir === 'rtl' || document.body.dir === 'rtl') {
      return 'ar';
    }
  }

  const htmlDir = document.documentElement.dir || document.body.dir;
  if (htmlDir === 'rtl') {
    return 'ar';
  }

  return fallbackLanguage;
}

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

function setTextInElement(parent, selector, text) {
  const element = parent.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

function applyTranslationsForLanguage(languageCode) {
  const code = supportedLanguages.includes(languageCode) ? languageCode : fallbackLanguage;
  const translation = translations[code];
  const direction = translation.direction || 'ltr';

  document.documentElement.lang = translation.langAttribute;
  document.documentElement.dir = direction;
  document.body.dir = direction;
  document.title = translation.content.pageTitle;

  setText('header h1', translation.content.heroTitle);
  setText('header p', translation.content.heroDescription);

  const timelineCards = document.querySelectorAll('section.timeline > div');
  timelineCards.forEach((card, index) => {
    const data = translation.content.cards[index];
    if (!data) return;
    setTextInElement(card, 'h2', data.year);
    setTextInElement(card, 'h3', data.title);
    const overlayText = card.querySelector('.overlay p');
    if (overlayText) overlayText.textContent = data.description;
  });

  const infoCards = document.querySelectorAll('.info-section .p-3.h-100');
  infoCards.forEach((card, index) => {
    const data = translation.content.infoCards[index];
    if (!data) return;
    const heading = card.querySelector('h4');
    if (heading) {
      const icon = heading.querySelector('i');
      heading.textContent = '';
      if (icon) heading.appendChild(icon);
      heading.appendChild(document.createTextNode(data.title));
    }
    const paragraph = card.querySelector('p');
    if (paragraph) paragraph.textContent = data.description;
    const link = card.querySelector('a.learn-more');
    if (link) {
      link.innerHTML = `${data.linkText} <span class="bi bi-arrow-right-short" aria-hidden="true"></span>`;
    }
  });

  setText('.newsletter-section .card-body h2', translation.content.newsletterHeading);
  setText('.newsletter-section .card-body p', translation.content.newsletterDescription);
  const newsletterButton = document.querySelector('.newsletter-section button');
  if (newsletterButton) newsletterButton.textContent = translation.content.newsletterButton;

  const footerCopyright = document.querySelector('.site-footer .col-12.col-md-6.text-center.text-md-start p');
  if (footerCopyright) footerCopyright.textContent = translation.content.footerCopyright;
  setText('body > p', translation.content.footerNote);

  document.body.classList.toggle('rtl-active', direction === 'rtl');

  window.dispatchEvent(new CustomEvent('languageChanged', {
    detail: { language: translation.langAttribute, direction }
  }));
}

function handleLanguageChange() {
  const detectedLanguage = detectGoogleTranslateLanguage();
  const currentLanguage = normalizeLanguageCode(document.documentElement.lang);
  if (detectedLanguage !== currentLanguage) {
    applyTranslationsForLanguage(detectedLanguage);
  }
}

function observeGoogleTranslateChanges() {
  let previousLanguage = normalizeLanguageCode(document.documentElement.lang);

  const observer = new MutationObserver(() => {
    const detectedLanguage = detectGoogleTranslateLanguage();
    if (detectedLanguage !== previousLanguage) {
      applyTranslationsForLanguage(detectedLanguage);
      previousLanguage = detectedLanguage;
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang', 'dir']
  });

  setInterval(() => {
    const detectedLanguage = detectGoogleTranslateLanguage();
    if (detectedLanguage !== previousLanguage) {
      applyTranslationsForLanguage(detectedLanguage);
      previousLanguage = detectedLanguage;
    }
  }, 1000);
}

function initializeLanguageDetection() {
  const initialLanguage = detectGoogleTranslateLanguage();
  applyTranslationsForLanguage(initialLanguage);
  observeGoogleTranslateChanges();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLanguageDetection);
} else {
  initializeLanguageDetection();
}
