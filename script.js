// Scroll progress gives a quiet sense of place on longer pages.
const progressBar = document.querySelector(".scroll-progress span");
let progressFrame = 0;
function updateProgress() {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
    progressBar?.style.setProperty("width", percent + "%");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.style.setProperty("--scroll-parallax", `${-Math.min(window.scrollY * 0.025, 26)}px`);
    }
    progressFrame = 0;
  });
}
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress, { passive: true });
updateProgress();

// Theme preference: Auto follows the operating system until manually changed.
const themeControl = document.querySelector("#theme-mode");
const savedTheme = localStorage.getItem("portfolio-theme") || "auto";
function applyTheme(mode) {
  document.documentElement.classList.remove("dark-theme", "light-theme", "auto-theme");
  document.documentElement.classList.add(mode + "-theme");
  document.documentElement.dataset.theme = mode;
  if (themeControl) themeControl.value = mode;
}
applyTheme(savedTheme);
themeControl?.addEventListener("change", () => {
  localStorage.setItem("portfolio-theme", themeControl.value);
  applyTheme(themeControl.value);
});

// Low-key pointer spotlight; no custom cursor and no layout work on pointermove.
if (matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let pointerFrame = 0;
  document.addEventListener("pointermove", event => {
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--pointer-x", event.clientX + "px");
      document.documentElement.style.setProperty("--pointer-y", event.clientY + "px");
      pointerFrame = 0;
    });
  }, { passive: true });
}

// Keep the navigation highlight in sync with the section in view.
const navLinks = [...document.querySelectorAll('#nav a[href^="#"]')];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => {
        if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-25% 0px -65% 0px" });
  navLinks.forEach(link => { const section = document.querySelector(link.getAttribute("href")); if (section) sectionObserver.observe(section); });
}

// The form prepares a message in the visitor's email app. Set the portfolio email first.
document.querySelector("#contact-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const subject = encodeURIComponent("Portfolio message from " + form.get("name"));
  const body = encodeURIComponent("Name: " + form.get("name") + "\nEmail: " + form.get("email") + "\n\n" + form.get("message"));
  window.location.href = "mailto:shreyabawankar46@gmail.com?subject=" + subject + "&body=" + body;
});

// Small progressive enhancement for the portfolio.
document.documentElement.classList.add("js-motion");

// Reveal the name one character at a time while keeping a single accessible name.
const heroName = document.querySelector(".hero h1");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (heroName && !prefersReducedMotion) {
  const accessibleName = heroName.innerText.replace(/\s+/g, " ").trim();
  const textNodes = [];
  const nameWalker = document.createTreeWalker(heroName, NodeFilter.SHOW_TEXT);
  while (nameWalker.nextNode()) textNodes.push(nameWalker.currentNode);
  let letterIndex = 0;
  for (const textNode of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const character of textNode.textContent) {
      if (/\s/.test(character)) {
        fragment.append(document.createTextNode(character));
        continue;
      }
      const letter = document.createElement("span");
      letter.className = "hero-letter";
      letter.setAttribute("aria-hidden", "true");
      letter.style.setProperty("--letter-delay", `${120 + letterIndex * 38}ms`);
      letter.textContent = character;
      fragment.append(letter);
      letterIndex += 1;
    }
    textNode.replaceWith(fragment);
  }
  heroName.setAttribute("aria-label", accessibleName);
  heroName.classList.add("hero-type-in");
}

// Reveal sections as they enter the viewport; content remains visible without JS.
const revealTargets = document.querySelectorAll(".section-label, .about-grid, .values, .section-heading, .timeline article, .skill-card, .credential, .project, .contribution-inner > div, .gallery-empty, .gallery-photo, .contact-card, .privacy-inner > div");
revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  if (element.matches(".skill-card, .project, .credential, .timeline article")) {
    element.style.transitionDelay = `${(index % 4) * 70}ms`;
  }
});
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  revealTargets.forEach(element => revealObserver.observe(element));
} else {
  revealTargets.forEach(element => element.classList.add("is-visible"));
}

// Add a restrained pointer tilt to project cards on devices that support hover.
// Motion stays off for touchscreens and visitors who prefer reduced motion.
if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".project").forEach(card => {
    card.addEventListener("pointermove", event => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--tilt-x", `${-y * 2.2}deg`);
      card.style.setProperty("--tilt-y", `${x * 2.2}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

// Small magnetic pull for primary navigation and hero actions on desktop only.
if (matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion) {
  document.querySelectorAll(".hero-actions .button, .topbar .nav-cta").forEach(button => {
    button.addEventListener("pointermove", event => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.09;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.09;
      button.style.setProperty("--mag-x", `${Math.max(-4, Math.min(4, x))}px`);
      button.style.setProperty("--mag-y", `${Math.max(-4, Math.min(4, y))}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--mag-x", "0px");
      button.style.setProperty("--mag-y", "0px");
    });
  });
}

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");
menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}));
document.querySelector("#year").textContent = new Date().getFullYear();

// Tell the server the current page; per-visitor details are never returned here.
fetch("/api/visit?page=" + encodeURIComponent(location.pathname + location.hash), {
  method: "GET",
  headers: { "Accept": "application/json" },
  cache: "no-store"
}).catch(() => {});
/* Portfolio visitor tracking */
(() => {
  // Prevent duplicate tracking if this script runs twice.
  if (window.__portfolioVisitTracked) return;
  window.__portfolioVisitTracked = true;

  fetch(
    "/api/visit?page=" +
      encodeURIComponent(window.location.pathname),
    {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin"
    }
  ).catch(() => {
    console.log("Visitor tracking is currently unavailable.");
  });
})();
