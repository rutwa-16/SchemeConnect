(function () {
  const THEME_KEY = "schemeconnect:theme";
  const DARK_MODE_KEY = "schemeconnect:dark-mode";

  function q(selector) {
    return document.querySelector(selector);
  }

  function qa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function applyTheme(theme) {
    document.body.classList.remove("theme-aurora", "theme-sunset", "theme-ocean", "theme-forest");
    if (theme === "aurora") document.body.classList.add("theme-aurora");
    if (theme === "sunset") document.body.classList.add("theme-sunset");
    if (theme === "ocean") document.body.classList.add("theme-ocean");
    if (theme === "forest") document.body.classList.add("theme-forest");

    qa(".style-chip").forEach(function (btn) {
      btn.classList.toggle("active", (btn.getAttribute("data-theme") || "mint") === theme);
    });
  }

  function setupThemeDock() {
    const buttons = qa(".style-chip");
    if (!buttons.length) return;

    const storedTheme = localStorage.getItem(THEME_KEY) || "mint";
    applyTheme(storedTheme);

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const theme = btn.getAttribute("data-theme") || "mint";
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
      });
    });
  }

  function setupDarkModeToggle() {
    const navShell = q("#nav-shell");
    if (!navShell) return;

    const existing = q("#dark-mode-toggle");
    if (existing) return;

    const toggle = document.createElement("button");
    toggle.id = "dark-mode-toggle";
    toggle.className = "dark-mode-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Toggle dark mode");
    toggle.innerHTML = '<span class="theme-icon icon-sun" aria-hidden="true">☀</span><span class="theme-icon icon-moon" aria-hidden="true">🌙</span>';

    const mobileToggle = q("#mobile-toggle");
    if (mobileToggle && mobileToggle.parentElement === navShell) {
      navShell.insertBefore(toggle, mobileToggle);
    } else {
      navShell.appendChild(toggle);
    }

    function applyDarkMode(enabled) {
      document.body.classList.toggle("dark-mode", enabled);
      toggle.classList.toggle("is-dark", enabled);
      toggle.setAttribute("aria-label", enabled ? "Switch to light mode" : "Switch to dark mode");
    }

    applyDarkMode(localStorage.getItem(DARK_MODE_KEY) === "1");

    toggle.addEventListener("click", function () {
      const nextEnabled = !document.body.classList.contains("dark-mode");
      localStorage.setItem(DARK_MODE_KEY, nextEnabled ? "1" : "0");
      applyDarkMode(nextEnabled);
    });
  }

  function setupMobileMenu() {
    const mobileToggle = q("#mobile-toggle");
    const mobileMenu = q("#mobile-menu");
    if (!mobileToggle || !mobileMenu) return;

    function closeMobileMenu() {
      mobileMenu.classList.remove("open");
      mobileToggle.innerHTML = "&#9776;";
    }

    mobileToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      mobileMenu.classList.toggle("open");
      mobileToggle.innerHTML = mobileMenu.classList.contains("open") ? "&#10005;" : "&#9776;";
    });

    qa("#mobile-menu a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", function (event) {
      if (!mobileMenu.contains(event.target) && event.target !== mobileToggle) {
        closeMobileMenu();
      }
    });
  }

  function setupScrollToTop() {
    const scrollBtn = q("#scroll-to-top");
    if (!scrollBtn) return;

    window.addEventListener("scroll", function () {
      if (window.scrollY > 280) {
        scrollBtn.classList.add("show");
      } else {
        scrollBtn.classList.remove("show");
      }
    });

    scrollBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function init() {
    setupThemeDock();
    setupDarkModeToggle();
    setupMobileMenu();
    setupScrollToTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();