document.addEventListener("DOMContentLoaded", function () {
  const THEME_KEY = "schemeconnect:theme";
  const USER_KEY = "schemeconnect:user";
  
  function setupSmoothNavigation() {
    document.body.classList.add("page-transition-ready");

    document.addEventListener("click", function (e) {
      const link = e.target.closest("a");
      if (!link || !link.href) return;
      
      const isExternal = link.hasAttribute("target") || link.hostname !== window.location.hostname;
      if (isExternal) return;
      
      const isSamePage = link.pathname === window.location.pathname && 
                         (link.hash === window.location.hash || !link.hash);
      if (isSamePage) return;
      
      e.preventDefault();
      if (!prefersReducedMotion()) {
        document.body.classList.add("page-transition-out");
      }
      
      setTimeout(function () {
        window.location.href = link.href;
      }, prefersReducedMotion() ? 0 : 180);
    }, true);
  }
  
  setupSmoothNavigation();

  const scrollBtn = document.getElementById("scroll-to-top");
  const cursorGlow = document.getElementById("cursor-glow");
  const surpriseBtn = document.getElementById("surprise-btn");
  const surpriseCard = document.getElementById("surprise-card");
  const comparePanel = document.getElementById("compare-panel");
  const schemeSearchInput = document.getElementById("scheme-search");
  const voiceSearchBtn = document.getElementById("voice-search-btn");
  const bestMatchBadge = document.getElementById("best-match-badge");
  const commandPaletteBtn = document.getElementById("command-palette-btn");
  const focusModeBtn = document.getElementById("focus-mode-btn");
  const shortcutHintBtn = document.getElementById("shortcut-hint-btn");
  const magneticTargets = document.querySelectorAll(
    ".btn-primary, .btn-secondary, .btn-ghost, .sign-in, .filter-btn, .style-chip, .apply-btn"
  );

  let schemes = [];
  const FOCUS_MODE_KEY = "schemeconnect:focus-mode";
  const PREFERENCES_KEY = "schemeconnect:preferences";
  const FAVORITES_KEY = "schemeconnect:favorites";
  const LEGACY_QUIZ_FAVORITES_KEY = "sc_saved_schemes";
  const COMPARE_LIMIT = 3;
  let favorites = [];
  let compareList = [];
  let openShortcutGuide = null;
  let openCommandPalette = null;
  let closeCommandPalette = null;

  function isPagesFolderPage() {
    return /\/pages\//i.test(String(window.location.pathname || ""));
  }

  function appRoute(pageName) {
    return isPagesFolderPage() ? pageName : ("pages/" + pageName);
  }

  function schemesRouteWithQuery(idOrName) {
    return appRoute("schemes.html") + "?scheme=" + encodeURIComponent(String(idOrName || ""));
  }

  function prefersReducedMotion() {
    const systemReduced = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (systemReduced) return true;
    try {
      const prefs = JSON.parse(localStorage.getItem("schemeconnect:preferences") || "{}");
      return prefs && prefs.animations === false;
    } catch (e) {
      return false;
    }
  }

  function getActiveThemeName() {
    if (document.body.classList.contains("theme-aurora")) return "aurora";
    if (document.body.classList.contains("theme-sunset")) return "sunset";
    if (document.body.classList.contains("theme-ocean")) return "ocean";
    if (document.body.classList.contains("theme-forest")) return "forest";
    return "mint";
  }

  function getThemePalette(theme, darkModeEnabled) {
    const light = {
      mint: ["#1a7a4a", "#0c5e37"],
      aurora: ["#0ea5e9", "#0284c7"],
      sunset: ["#ff6b35", "#ff4500"],
      ocean: ["#1e40af", "#1e3a8a"],
      forest: ["#047857", "#065f46"]
    };
    const dark = {
      mint: ["#10b981", "#059669"],
      aurora: ["#00d9ff", "#0099cc"],
      sunset: ["#ff6b35", "#cc5500"],
      ocean: ["#0ea5e9", "#0284c7"],
      forest: ["#10b981", "#059669"]
    };
    const bank = darkModeEnabled ? dark : light;
    return bank[theme] || bank.mint;
  }

  function playThemeTransition(options) {
    if (prefersReducedMotion()) return;

    const opts = options || {};
    const x = typeof opts.x === "number" ? opts.x : window.innerWidth * 0.5;
    const y = typeof opts.y === "number" ? opts.y : window.innerHeight * 0.5;
    const colors = Array.isArray(opts.colors) && opts.colors.length >= 2 ? opts.colors : ["#1a7a4a", "#0c5e37"];
    const modeClass = opts.mode === "dark-toggle" ? (opts.toDark ? "to-dark" : "to-light") : "theme-shift";

    const overlay = document.createElement("div");
    overlay.className = "theme-wave-overlay " + modeClass;
    overlay.style.setProperty("--wave-x", x + "px");
    overlay.style.setProperty("--wave-y", y + "px");
    overlay.style.setProperty("--wave-c1", colors[0]);
    overlay.style.setProperty("--wave-c2", colors[1]);

    document.body.appendChild(overlay);

    window.requestAnimationFrame(function () {
      overlay.classList.add("play");
    });

    window.clearTimeout(playThemeTransition._timer);
    playThemeTransition._timer = window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 340);
  }

  function runVisualTransition(mutateFn, animate) {
    if (!animate || prefersReducedMotion()) {
      mutateFn();
      return;
    }

    const hasNativeViewTransition = typeof document.startViewTransition === "function";

    if (hasNativeViewTransition) {
      document.body.classList.add("theme-transitioning");
      const vt = document.startViewTransition(function () {
        mutateFn();
      });

      vt.finished.finally(function () {
        document.body.classList.remove("theme-transitioning");
      });
      return;
    }

    document.body.classList.add("theme-transitioning");
    mutateFn();
    window.clearTimeout(runVisualTransition._timer);
    runVisualTransition._timer = window.setTimeout(function () {
      document.body.classList.remove("theme-transitioning");
    }, 280);
  }

  function setupCinematicReveal() {
    if (prefersReducedMotion()) return;

    const targets = Array.from(document.querySelectorAll(
      ".hero-left, .hero-right, .stat-card, .story-card, .auth-card, .about-hero, .about-card, .about-wide, .path-step, .footer-content > div"
    ));
    if (!targets.length) return;

    targets.forEach(function (el, idx) {
      el.classList.add("cinematic-reveal");
      el.style.transitionDelay = ((idx % 8) * 42) + "ms";
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function setupMotionFinesse() {
    const body = document.body;
    if (!body) return;

    if (prefersReducedMotion()) {
      body.classList.add("animations-off");
      return;
    }

    body.classList.add("motion-finesse");

    const motionTargets = Array.from(document.querySelectorAll(
      ".hero-badge, .hero-left h2, .hero-left p, .hero-actions, .hero-quick-links, .hero-trust, .stats-grid, .stat-card, .section-head, .scheme-card, .benefit-card, .story-card, .chat-sidebar, .chat-panel, .quiz-card, .prog-wrap, .about-hero, .about-card, .about-wide, .path-step, .footer-main, .footer-bottom"
    ));

    motionTargets.forEach(function (el, idx) {
      el.classList.add("motion-lift");
      el.style.setProperty("--motion-delay", ((idx % 12) * 34) + "ms");
    });

    if (motionTargets.length) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("motion-in");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });

      motionTargets.forEach(function (el) {
        observer.observe(el);
      });
    }

    if (window.matchMedia("(max-width: 900px)").matches) return;

    const parallaxTargets = Array.from(document.querySelectorAll(".hero-bg, .about-hero-visual"));
    if (!parallaxTargets.length) return;

    let rafId = 0;
    let px = 0;
    let py = 0;

    function renderParallax() {
      parallaxTargets.forEach(function (el, index) {
        const depth = index === 0 ? 0.018 : 0.026;
        const tx = px * depth;
        const ty = py * depth;
        el.style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0)";
      });
      rafId = 0;
    }

    document.addEventListener("mousemove", function (event) {
      px = event.clientX - window.innerWidth * 0.5;
      py = event.clientY - window.innerHeight * 0.5;
      if (!rafId) rafId = window.requestAnimationFrame(renderParallax);
    });
  }

  // Premium 3D stage is now in js/premium-3d-stage.js (external module)
  // It initializes automatically and provides sophisticated page/theme-specific animations

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || !user.avatar) return null;
        if (!user.avatar.ring) user.avatar.ring = "ring-green";
        if (!Object.prototype.hasOwnProperty.call(user.avatar, "image")) user.avatar.image = "";
      return user;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function initialsFromName(name) {
    const parts = String(name || "User").trim().split(/\s+/);
    const one = (parts[0] || "U").charAt(0).toUpperCase();
    const two = (parts[1] || "").charAt(0).toUpperCase();
    return (one + two).trim() || "U";
  }

  function showToast(message) {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
      if (prefs && prefs.notifications === false) return;
    } catch (e) {
      // Ignore invalid preference payloads.
    }
    const toast = document.createElement("div");
    toast.className = "cool-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 2300);
  }

  function readPreferences() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
      return {
        notifications: parsed.notifications !== false,
        animations: parsed.animations !== false,
        suggestions: parsed.suggestions !== false,
        defaultView: parsed.defaultView === "list" ? "list" : "grid"
      };
    } catch (e) {
      return {
        notifications: true,
        animations: true,
        suggestions: true,
        defaultView: "grid"
      };
    }
  }

  function applyUserPreferences() {
    const prefs = readPreferences();

    if (prefs.animations === false) {
      document.body.classList.add("animations-off");
    } else {
      document.body.classList.remove("animations-off");
    }

    const suggestionsWrap = document.getElementById("ai-suggestions");
    if (suggestionsWrap) {
      suggestionsWrap.style.display = prefs.suggestions ? "" : "none";
    }

    const sidebarPrompts = document.getElementById("sb-chips");
    if (sidebarPrompts) {
      sidebarPrompts.style.display = prefs.suggestions ? "" : "none";
    }

    // Keep schemes page default view in sync with the settings panel selection.
    localStorage.setItem("schemeconnect:schemes-view", prefs.defaultView);

    const schemesContainer = document.getElementById("schemesContainer");
    const viewGridBtn = document.getElementById("viewGridBtn");
    const viewListBtn = document.getElementById("viewListBtn");
    const viewMode = prefs.defaultView === "list" ? "list" : "grid";
    if (schemesContainer) {
      schemesContainer.classList.toggle("list-view", viewMode === "list");
    }
    if (viewGridBtn) {
      viewGridBtn.classList.toggle("active", viewMode === "grid");
    }
    if (viewListBtn) {
      viewListBtn.classList.toggle("active", viewMode === "list");
    }

    document.dispatchEvent(new CustomEvent("schemeconnect:preferences-updated", { detail: prefs }));
  }

  function loadFavorites() {
    function normalizeFavoriteItem(item) {
      if (!item || typeof item !== "object") return null;
      const id = String(item.id || item.name || "").trim();
      const name = String(item.name || item.id || "Unnamed Scheme").trim();
      if (!name) return null;
      const category = String(item.category || "General").trim() || "General";
      const benefit = String(item.benefit || item.benefits || "Benefit details available").trim() || "Benefit details available";
      const description = String(item.description || "").trim();
      const href = String(item.href || schemesRouteWithQuery(id || name));
      return {
        id: id || name,
        name: name,
        category: category,
        benefit: benefit,
        description: description,
        href: href,
        savedFrom: item.savedFrom || "home"
      };
    }

    function dedupeFavorites(list) {
      const map = new Map();
      list.forEach(function (item) {
        const normalized = normalizeFavoriteItem(item);
        if (!normalized) return;
        const key = String(normalized.id || normalized.name).toLowerCase();
        if (!map.has(key)) {
          map.set(key, normalized);
        }
      });
      return Array.from(map.values()).slice(0, 30);
    }

    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const currentFavorites = raw ? JSON.parse(raw) : [];
      const legacyRaw = localStorage.getItem(LEGACY_QUIZ_FAVORITES_KEY);
      const legacyFavorites = legacyRaw ? JSON.parse(legacyRaw) : [];

      favorites = dedupeFavorites([].concat(
        Array.isArray(currentFavorites) ? currentFavorites : [],
        Array.isArray(legacyFavorites) ? legacyFavorites.map(function (item) {
          const normalized = normalizeFavoriteItem(item);
          if (normalized) normalized.savedFrom = "quiz";
          return normalized;
        }) : []
      ));

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      if (Array.isArray(legacyFavorites) && legacyFavorites.length) {
        localStorage.removeItem(LEGACY_QUIZ_FAVORITES_KEY);
      }
    } catch (e) {
      favorites = [];
    }
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    document.dispatchEvent(new CustomEvent("schemeconnect:favorites-updated", { detail: favorites.slice() }));
  }

  function createFavoritesUI() {
    const fab = document.createElement("button");
    fab.className = "favorites-fab";
    fab.id = "favorites-fab";

    const panel = document.createElement("div");
    panel.className = "favorites-panel";
    panel.id = "favorites-panel";

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function renderFavorites() {
      fab.textContent = "Saved " + favorites.length;
      if (!favorites.length) {
        panel.innerHTML = '<h4 class="favorites-title">Saved Schemes</h4><p class="favorites-empty">No favorites yet. Tap heart on any card.</p>';
        return;
      }

      panel.innerHTML = [
        '<h4 class="favorites-title">Saved Schemes</h4>',
        favorites
          .map(function (item, idx) {
            const safeHref = String(item.href || schemesRouteWithQuery(item.id || item.name || "")).replace(/"/g, "&quot;");
            return (
              '<div class="favorites-item">' +
              '<div class="favorites-item-content">' +
              "<strong>" + item.name + "</strong>" +
              "<small>" + item.category + " · " + item.benefit + "</small>" +
              '<div class="favorites-item-actions">' +
              '<a class="favorites-open-link" href="' + safeHref + '">Open</a>' +
              "</div>" +
              '</div>' +
              '<button class="favorites-remove-btn" type="button" data-fav-idx="' + idx + '" aria-label="Remove saved scheme">×</button>' +
              "</div>"
            );
          })
          .join("")
      ].join("");
    }

    fab.addEventListener("click", function () {
      panel.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (e.target === fab || panel.contains(e.target)) return;
      panel.classList.remove("open");
    });

    renderFavorites();
    return renderFavorites;
  }

  function setupFavoritesFeature() {
    loadFavorites();
    const renderFavorites = createFavoritesUI();

    function applySavedState() {
      const set = new Set(favorites.map(function (f) { return f.name; }));
      document.querySelectorAll(".fav-btn").forEach(function (btn) {
        const name = btn.getAttribute("data-fav") || "";
        btn.classList.toggle("saved", set.has(name));
      });
    }

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".fav-btn");
      if (!btn) return;

      const card = btn.closest(".scheme-card");
      if (!card) return;

      const item = {
        id: card.getAttribute("data-scheme-id") || card.getAttribute("data-scheme-name") || "",
        name: card.getAttribute("data-scheme-name") || "Unknown Scheme",
        category: card.getAttribute("data-scheme-category") || "General",
        benefit: card.getAttribute("data-scheme-benefit") || "N/A",
        description: card.getAttribute("data-scheme-description") || "",
        href: card.getAttribute("data-scheme-href") || schemesRouteWithQuery(card.getAttribute("data-scheme-id") || card.getAttribute("data-scheme-name") || ""),
        savedFrom: "home"
      };

      const key = String(item.id || item.name).toLowerCase();
      const exists = favorites.find(function (f) { return String(f.id || f.name).toLowerCase() === key; });
      if (exists) {
        favorites = favorites.filter(function (f) { return String(f.id || f.name).toLowerCase() !== key; });
        showToast("Removed from saved");
      } else {
        favorites.unshift(item);
        favorites = favorites.slice(0, 30);
        showToast("Saved to favorites");
      }

      saveFavorites();
      renderFavorites();
      applySavedState();
    });

    document.addEventListener("click", function (e) {
      const removeBtn = e.target.closest(".favorites-remove-btn");
      if (!removeBtn) return;

      const idx = parseInt(removeBtn.getAttribute("data-fav-idx"), 10);
      if (idx >= 0 && idx < favorites.length) {
        const removed = favorites[idx];
        favorites.splice(idx, 1);
        saveFavorites();
        renderFavorites();
        applySavedState();
        showToast("Removed: " + removed.name);
      }
    });

    document.addEventListener("schemes-ready", function () {
      window.setTimeout(applySavedState, 60);
    });

    document.addEventListener("schemeconnect:favorites-updated", function (event) {
      const next = Array.isArray(event.detail) ? event.detail : [];
      favorites = next;
      renderFavorites();
      applySavedState();
    });

    window.addEventListener("storage", function (event) {
      if (event.key !== FAVORITES_KEY) return;
      loadFavorites();
      renderFavorites();
      applySavedState();
    });

    applySavedState();
  }

  function setupRadarWidget() {
    const radar = document.createElement("aside");
    radar.className = "radar-widget";
    radar.innerHTML = [
      '<div class="radar-top">',
      '  <strong>Live Scheme Radar</strong>',
      '  <button type="button" id="radar-next">Shuffle</button>',
      "</div>",
      '<div class="radar-content" id="radar-content">Loading suggestions...</div>'
    ].join("");
    document.body.appendChild(radar);

    const content = radar.querySelector("#radar-content");
    const nextBtn = radar.querySelector("#radar-next");

    function pickScheme() {
      if (!schemes.length) {
        content.textContent = "Schemes are loading...";
        return;
      }

      const item = schemes[Math.floor(Math.random() * schemes.length)];
      const benefitText = item.benefit || item.benefits || "Benefit details available";
      content.innerHTML =
        "<strong>" + item.name + "</strong><br>" +
        item.category + " · " + benefitText + "<br>" +
        "<span>" + item.description + "</span>";
    }

    nextBtn.addEventListener("click", pickScheme);
    document.addEventListener("schemes-ready", pickScheme);
    window.setInterval(pickScheme, 6500);
  }

  function setupScrollToTop() {
    if (!scrollBtn) return;

    window.addEventListener("scroll", function () {
      if (window.scrollY > 320) {
        scrollBtn.classList.add("show");
      } else {
        scrollBtn.classList.remove("show");
      }
    });

    scrollBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setupCursorGlow() {
    if (!cursorGlow || window.matchMedia("(max-width: 820px)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    function render() {
      cursorGlow.style.left = x + "px";
      cursorGlow.style.top = y + "px";
      raf = 0;
    }

    document.addEventListener("mousemove", function (e) {
      x = e.clientX;
      y = e.clientY;
      cursorGlow.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(render);
    });

    document.addEventListener("mouseleave", function () {
      cursorGlow.style.opacity = "0";
    });
  }

  function setupCardSpotlight() {
    const spotlightCards = document.querySelectorAll(".scheme-card, .benefit-card, .story-card");
    if (!spotlightCards.length) return;

    spotlightCards.forEach(function (card) {
      card.addEventListener("mousemove", function (event) {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mx", x.toFixed(2) + "%");
        card.style.setProperty("--my", y.toFixed(2) + "%");
      });
    });
  }

  function setupFluidScroll() {
    if (prefersReducedMotion()) return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    const blockedSelectors = [
      ".command-list",
      ".compare-table-scroll",
      ".favorites-panel",
      ".mobile-menu",
      ".export-modal-card",
      ".preferences-modal-card",
      ".advanced-filters-panel"
    ];

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId = 0;

    function isBlockedTarget(node) {
      if (!(node instanceof Element)) return false;
      return blockedSelectors.some(function (selector) {
        return Boolean(node.closest(selector));
      });
    }

    function animate() {
      const diff = targetY - currentY;
      currentY += diff * 0.14;
      if (Math.abs(diff) < 0.4) {
        currentY = targetY;
        rafId = 0;
        return;
      }
      window.scrollTo(0, currentY);
      rafId = window.requestAnimationFrame(animate);
    }

    function onWheel(event) {
      if (event.ctrlKey || event.metaKey) return;
      if (isBlockedTarget(event.target)) return;

      const maxY = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      targetY = Math.max(0, Math.min(maxY, targetY + event.deltaY * 0.92));
      event.preventDefault();
      if (!rafId) rafId = window.requestAnimationFrame(animate);
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", function (event) {
      const keys = ["PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp", " "];
      if (!keys.includes(event.key)) return;
      targetY = window.scrollY;
      currentY = window.scrollY;
    });
  }

  function setupPremiumCardTilt() {
    if (prefersReducedMotion()) return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    const cards = document.querySelectorAll(".scheme-card, .stat-card, .story-card, .benefit-card, .auth-card");
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.classList.add("premium-tilt");
      card.addEventListener("mousemove", function (event) {
        const rect = card.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = (event.clientY - rect.top) / rect.height;
        const ry = (nx - 0.5) * 5;
        const rx = (0.5 - ny) * 4;
        card.style.setProperty("--rx", rx.toFixed(2) + "deg");
        card.style.setProperty("--ry", ry.toFixed(2) + "deg");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  function setupAdaptiveNavTransparency() {
    if (prefersReducedMotion()) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const header = document.getElementById("main-header");
    if (!header) return;

    const sections = document.querySelectorAll("section[id]");
    if (!sections.length) return;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let rafId = 0;
    let currentSectionId = "";
    let targetOpacity = 0.88;

    function detectCurrentSection() {
      let mostVisibleId = "";
      let maxVisibility = 0;

      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const sectionTop = rect.top;
        const sectionBottom = rect.bottom;

        if (sectionTop < viewportHeight && sectionBottom > 0) {
          const visibleHeight = Math.min(sectionBottom, viewportHeight) - Math.max(sectionTop, 0);
          const visibility = visibleHeight / viewportHeight;
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisibleId = section.id;
          }
        }
      });

      return mostVisibleId;
    }

    function updateNavOpacity() {
      const heroSection = document.querySelector(".hero");
      const isHeroVisible = heroSection && heroSection.getBoundingClientRect().bottom > 0;

      // Base opacity depends on section context
      let baseOpacity = isHeroVisible ? 0.74 : 0.88;

      // Adjust based on scroll velocity (capped at 1.0)
      const velocityFactor = Math.min(Math.abs(scrollVelocity) / 120, 0.26);
      targetOpacity = Math.min(baseOpacity + velocityFactor, 1.0);

      // Smooth interpolation
      const currentOpacity = parseFloat(getComputedStyle(header).getPropertyValue("--nav-opacity")) || baseOpacity;
      const nextOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.15;

      header.style.setProperty("--nav-opacity", nextOpacity.toFixed(3));
    }

    window.addEventListener(
      "scroll",
      function () {
        const currentY = window.scrollY;
        const deltaTime = 16; // ~60fps
        scrollVelocity = (currentY - lastScrollY) / deltaTime;
        lastScrollY = currentY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          updateNavOpacity();
          currentSectionId = detectCurrentSection();
        });
      },
      { passive: true }
    );

    // Initialize
    header.style.setProperty("--nav-opacity", "0.88");
  }

  function setupFocusMode() {
    if (!focusModeBtn) return;

    function applyFocusMode(enabled) {
      document.body.classList.toggle("focus-mode", enabled);
      focusModeBtn.classList.toggle("active", enabled);
      focusModeBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
      focusModeBtn.textContent = enabled ? "◉ Focus Mode" : "⦿ Focus Mode";
    }

    const storedEnabled = localStorage.getItem(FOCUS_MODE_KEY) === "1";
    applyFocusMode(storedEnabled);

    focusModeBtn.addEventListener("click", function () {
      const nextEnabled = !document.body.classList.contains("focus-mode");
      localStorage.setItem(FOCUS_MODE_KEY, nextEnabled ? "1" : "0");
      applyFocusMode(nextEnabled);
      showToast(nextEnabled ? "Focus mode enabled" : "Focus mode disabled");
    });
  }

  function setupShortcutGuide() {
    if (!shortcutHintBtn) return;

    const layer = document.createElement("div");
    layer.className = "shortcut-guide";
    layer.innerHTML = [
      '<div class="shortcut-guide-card" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">',
      '  <div class="shortcut-guide-head">',
      '    <h4>Keyboard Shortcuts</h4>',
      '    <button class="shortcut-guide-close" type="button" aria-label="Close shortcuts">×</button>',
      "  </div>",
      '  <ul class="shortcut-list">',
      '    <li><span>Focus search</span><kbd>/</kbd></li>',
      '    <li><span>Open command palette</span><kbd>Ctrl/Cmd + K</kbd></li>',
      '    <li><span>Surprise scheme</span><kbd>Shift + S</kbd></li>',
      '    <li><span>Open this guide</span><kbd>?</kbd></li>',
      '    <li><span>Close overlays</span><kbd>Esc</kbd></li>',
      "  </ul>",
      "</div>"
    ].join("");
    document.body.appendChild(layer);

    function openGuide() {
      layer.classList.add("open");
    }

    function closeGuide() {
      layer.classList.remove("open");
    }

    openShortcutGuide = openGuide;
    shortcutHintBtn.addEventListener("click", openGuide);

    const closeBtn = layer.querySelector(".shortcut-guide-close");
    if (closeBtn) closeBtn.addEventListener("click", closeGuide);

    layer.addEventListener("click", function (event) {
      if (event.target === layer) closeGuide();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeGuide();
    });
  }

  function setupCommandPalette() {
    if (!commandPaletteBtn) return;

    const layer = document.createElement("div");
    layer.className = "command-palette";
    layer.innerHTML = [
      '<div class="command-palette-card" role="dialog" aria-modal="true" aria-label="Quick actions">',
      '  <input class="command-search" id="command-search" type="text" placeholder="Type an action..." aria-label="Search actions" />',
      '  <ul class="command-list" id="command-list"></ul>',
      "</div>"
    ].join("");
    document.body.appendChild(layer);

    const searchInput = layer.querySelector("#command-search");
    const commandList = layer.querySelector("#command-list");
    let filteredActions = [];
    let highlightedIndex = 0;

    const actions = [
      {
        title: "Shuffle scheme cards",
        key: "Shift + C",
        run: function () {
          const shuffleBtn = document.getElementById("shuffle-btn");
          if (shuffleBtn) shuffleBtn.click();
          showToast("Cards shuffled");
        }
      },
      {
        title: "Show surprise scheme",
        key: "Shift + S",
        run: function () {
          if (surpriseBtn) surpriseBtn.click();
          showToast("Surprise scheme loaded");
        }
      },
      {
        title: "Toggle focus mode",
        key: "F",
        run: function () {
          if (focusModeBtn) focusModeBtn.click();
        }
      },
      {
        title: "Open AI advisor",
        key: "A",
        run: function () {
          const aiPanel = document.getElementById("ai-panel");
          const aiFab = document.getElementById("ai-fab");
          const aiInput = document.getElementById("ai-input");
          if (!aiPanel) return;
          aiPanel.classList.add("open");
          if (aiFab) aiFab.style.display = "none";
          if (aiInput) aiInput.focus();
          showToast("AI advisor opened");
        }
      },
      {
        title: "Go to schemes page",
        key: "G",
        run: function () {
          window.location.href = appRoute("schemes.html");
        }
      }
    ];

    function executeActionByTitle(title) {
      const action = actions.find(function (item) {
        return item.title === title;
      });
      if (!action) return;
      closePalette();
      action.run();
    }

    function syncActiveItem() {
      const items = commandList.querySelectorAll(".command-item");
      items.forEach(function (item, index) {
        item.classList.toggle("active", index === highlightedIndex);
      });

      const activeItem = items[highlightedIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }

    function renderActions(filterText) {
      const keyword = String(filterText || "").trim().toLowerCase();
      filteredActions = actions.filter(function (item) {
        return !keyword || item.title.toLowerCase().includes(keyword);
      });

      if (highlightedIndex >= filteredActions.length) {
        highlightedIndex = 0;
      }

      commandList.innerHTML = filteredActions.map(function (item, index) {
        return (
          '<li>' +
          '<button class="command-item' + (index === highlightedIndex ? " active" : "") + '" type="button" data-action-title="' + item.title + '">' +
          '<span>' + item.title + '</span>' +
          '<span class="command-key">' + item.key + '</span>' +
          '</button>' +
          '</li>'
        );
      }).join("");

      if (!filteredActions.length) {
        commandList.innerHTML = '<li><div class="command-item" style="cursor:default;">No matching actions</div></li>';
      }

      syncActiveItem();
    }

    function openPalette() {
      layer.classList.add("open");
      highlightedIndex = 0;
      renderActions("");
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
    }

    function closePalette() {
      layer.classList.remove("open");
    }

    openCommandPalette = openPalette;
    closeCommandPalette = closePalette;

    commandPaletteBtn.addEventListener("click", openPalette);

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        highlightedIndex = 0;
        renderActions(searchInput.value);
      });

      searchInput.addEventListener("keydown", function (event) {
        if (!layer.classList.contains("open")) return;
        if (!filteredActions.length) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          highlightedIndex = (highlightedIndex + 1) % filteredActions.length;
          syncActiveItem();
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          highlightedIndex = (highlightedIndex - 1 + filteredActions.length) % filteredActions.length;
          syncActiveItem();
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const selected = filteredActions[highlightedIndex];
          if (!selected) return;
          executeActionByTitle(selected.title);
        }
      });
    }

    commandList.addEventListener("click", function (event) {
      const button = event.target.closest(".command-item");
      if (!button) return;
      const title = button.getAttribute("data-action-title") || "";
      executeActionByTitle(title);
    });

    commandList.addEventListener("mousemove", function (event) {
      const button = event.target.closest(".command-item");
      if (!button) return;
      const items = Array.from(commandList.querySelectorAll(".command-item"));
      const nextIndex = items.indexOf(button);
      if (nextIndex < 0) return;
      highlightedIndex = nextIndex;
      syncActiveItem();
    });

    layer.addEventListener("click", function (event) {
      if (event.target === layer) closePalette();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePalette();
    });
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (event) {
      const target = event.target;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;

      if (event.key === "/") {
        if (!schemeSearchInput) return;
        event.preventDefault();
        schemeSearchInput.focus();
        showToast("Search focused");
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        if (!openCommandPalette) return;
        event.preventDefault();
        openCommandPalette();
        showToast("Quick actions opened");
      }

      if (event.key === "?") {
        if (!openShortcutGuide) return;
        event.preventDefault();
        openShortcutGuide();
      }

      if (event.shiftKey && event.key.toLowerCase() === "s") {
        if (!surpriseBtn) return;
        event.preventDefault();
        surpriseBtn.click();
        showToast("Surprise scheme loaded");
      }
    });
  }

  function setupThemeSwitcher() {
    const themeButtons = Array.from(document.querySelectorAll(".style-chip"));
    if (!themeButtons.length) return;

    function applyTheme(theme, animate, sourceElement) {
      runVisualTransition(function () {
        document.body.classList.remove("theme-aurora", "theme-sunset", "theme-ocean", "theme-forest");
        if (theme === "aurora") document.body.classList.add("theme-aurora");
        if (theme === "sunset") document.body.classList.add("theme-sunset");
        if (theme === "ocean") document.body.classList.add("theme-ocean");
        if (theme === "forest") document.body.classList.add("theme-forest");

        themeButtons.forEach(function (item) {
          item.classList.toggle("active", item.getAttribute("data-theme") === theme);
        });
      }, animate);
    }

    const storedTheme = localStorage.getItem(THEME_KEY) || "mint";
    applyTheme(storedTheme, false);

    themeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const theme = btn.getAttribute("data-theme") || "mint";
        if (btn.classList.contains("active")) return;
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme, true, btn);
      });
    });
  }

  function renderSurpriseScheme() {
    if (!surpriseCard || !schemes.length) return;

    const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];
    const benefitText = randomScheme.benefit || randomScheme.benefits || "Benefit details available";
    surpriseCard.innerHTML = [
      '<div class="surprise-inner">',
      '  <h4>' + (randomScheme.icon || "🏛️") + " " + randomScheme.name + "</h4>",
      '  <div class="surprise-meta"><span>Category: ' + randomScheme.category + "</span><span>Benefit: " + benefitText + "</span></div>",
      '  <p class="surprise-desc">' + randomScheme.description + "</p>",
      "</div>"
    ].join("");
    surpriseCard.classList.add("show");
  }

  function setupSurpriseFeature() {
    if (!surpriseBtn) return;
    surpriseBtn.addEventListener("click", renderSurpriseScheme);
    document.addEventListener("schemes-ready", function (event) {
      schemes = Array.isArray(event.detail) ? event.detail : [];
    });
  }

  function setupBestMatchBadge() {
    if (!bestMatchBadge) return;

    function renderBadge() {
      if (!schemes.length) {
        bestMatchBadge.textContent = "Best Match of the Day loading...";
        return;
      }

      const dayIndex = new Date().getDate();
      const pick = schemes[dayIndex % schemes.length];
      const benefitText = pick.benefit || pick.benefits || "Benefit details available";
      bestMatchBadge.innerHTML =
        "✨ Best Match of the Day: <strong>" +
        pick.name +
        "</strong> · " +
        pick.category +
        " · " +
        benefitText;
    }

    document.addEventListener("schemes-ready", renderBadge);
    renderBadge();
  }

  function setupVoiceSearch() {
    if (!voiceSearchBtn || !schemeSearchInput) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceSearchBtn.disabled = true;
      voiceSearchBtn.textContent = "Voice N/A";
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceSearchBtn.addEventListener("click", function () {
      try {
        recognition.start();
      } catch (e) {
        // Ignore rapid restart errors from browser implementation
      }
    });

    recognition.onstart = function () {
      voiceSearchBtn.classList.add("listening");
      voiceSearchBtn.textContent = "Listening...";
    };

    recognition.onresult = function (event) {
      const transcript = (event.results[0][0].transcript || "").trim();
      if (!transcript) return;
      schemeSearchInput.value = transcript;
      schemeSearchInput.dispatchEvent(new Event("input", { bubbles: true }));
      showToast("Voice search applied");
    };

    recognition.onend = function () {
      voiceSearchBtn.classList.remove("listening");
      voiceSearchBtn.textContent = "🎤 Voice";
    };
  }

  function setupCompareFeature() {
    if (!comparePanel) return;

    function safeText(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderDocuments(item) {
      if (!Array.isArray(item.documents) || !item.documents.length) return "N/A";
      return '<ul class="compare-list">' + item.documents.map(function (doc) {
        return "<li>" + safeText(doc) + "</li>";
      }).join("") + "</ul>";
    }

    function renderEligibility(item) {
      if (!item.eligibility || typeof item.eligibility !== "object") return "N/A";
      const minAge = item.eligibility.minAge != null ? item.eligibility.minAge : "N/A";
      const maxAge = item.eligibility.maxAge != null ? item.eligibility.maxAge : "N/A";
      const maxIncome = item.eligibility.maxIncome != null ? "Rs " + item.eligibility.maxIncome : "N/A";
      const gender = item.eligibility.gender || "all";
      return (
        '<ul class="compare-list">' +
        "<li><strong>Age:</strong> " + safeText(minAge) + " - " + safeText(maxAge) + "</li>" +
        "<li><strong>Gender:</strong> " + safeText(gender) + "</li>" +
        "<li><strong>Max Income:</strong> " + safeText(maxIncome) + "</li>" +
        "</ul>"
      );
    }

    function renderComparePanel() {
      if (!compareList.length) {
        comparePanel.classList.remove("open");
        comparePanel.innerHTML = "";
        return;
      }

      const compareCountClass = compareList.length === 2 ? "is-two" : "is-three";
      comparePanel.classList.add("open");
      comparePanel.innerHTML = [
        '<div class="compare-wrap ' + compareCountClass + '">',
        '<div class="compare-toolbar">',
        '<h4 class="compare-heading">Scheme Comparison</h4>',
        '<button class="compare-close-btn" type="button" aria-label="Close comparison">×</button>',
        "</div>",
        '<div class="compare-table-scroll">',
        '<table class="compare-table">',
        "<thead>",
        "<tr>",
        '<th class="feature-col">Feature</th>',
        compareList.map(function (item, idx) {
          return (
            '<th class="scheme-col">' +
            '<button class="compare-remove-icon" type="button" data-remove-compare-index="' + idx + '" aria-label="Remove scheme from compare">×</button>' +
            '<div class="scheme-name">' + safeText(item.name) + '</div>' +
            '<div class="scheme-category">' + safeText(item.category || "General") + '</div>' +
            '<div class="compare-scheme-actions">' +
            '<a class="compare-apply-btn" href="' + safeText(item.applyPath || "#") + '">Apply</a>' +
            "</div>" +
            "</th>"
          );
        }).join(""),
        "</tr>",
        "</thead>",
        "<tbody>",
        "<tr><td class=\"feature-col\">Benefit</td>" + compareList.map(function (item) { return "<td>" + safeText(item.benefit || "N/A") + "</td>"; }).join("") + "</tr>",
        "<tr><td class=\"feature-col\">Ministry</td>" + compareList.map(function (item) { return "<td>" + safeText(item.ministry || "Government Ministry") + "</td>"; }).join("") + "</tr>",
        "<tr><td class=\"feature-col\">Description</td>" + compareList.map(function (item) { return "<td>" + safeText(item.description || "Details available") + "</td>"; }).join("") + "</tr>",
        "<tr><td class=\"feature-col\">Documents</td>" + compareList.map(function (item) { return "<td>" + renderDocuments(item) + "</td>"; }).join("") + "</tr>",
        "<tr><td class=\"feature-col\">Eligibility</td>" + compareList.map(function (item) { return "<td>" + renderEligibility(item) + "</td>"; }).join("") + "</tr>",
        "</tbody>",
        "</table>",
        "</div>",
        "</div>"
      ].join("");

      const closeBtn = comparePanel.querySelector(".compare-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          comparePanel.classList.remove("open");
        });
      }

      // Delegated fallback: keeps remove working even after dynamic re-renders.
      comparePanel.onclick = function (event) {
        const removeBtn = event.target.closest(".compare-remove-icon");
        if (!removeBtn) return;
        event.preventDefault();
        event.stopPropagation();
        const idx = parseInt(removeBtn.getAttribute("data-remove-compare-index") || "-1", 10);
        if (idx < 0 || idx >= compareList.length) return;
        compareList.splice(idx, 1);
        showToast("Removed one scheme from compare");
        renderComparePanel();
        syncCompareButtons();
      };
    }

    function syncCompareButtons() {
      const names = new Set(compareList.map(function (item) { return item.name; }));
      document.querySelectorAll(".compare-btn").forEach(function (btn) {
        const name = btn.getAttribute("data-compare") || "";
        btn.classList.toggle("active", names.has(name));
      });
    }

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".compare-btn");
      if (!btn) return;

      const card = btn.closest(".scheme-card");
      if (!card) return;

      const item = {
        name: card.getAttribute("data-scheme-name") || "Unknown Scheme",
        category: card.getAttribute("data-scheme-category") || "General",
        benefit: card.getAttribute("data-scheme-benefit") || "N/A",
        ministry: card.getAttribute("data-scheme-ministry") || "Ministry",
        description: card.getAttribute("data-scheme-description") || "N/A",
        documents: card.getAttribute("data-scheme-documents") ? JSON.parse(card.getAttribute("data-scheme-documents")) : [],
        eligibility: card.getAttribute("data-scheme-eligibility") ? JSON.parse(card.getAttribute("data-scheme-eligibility")) : {},
        applyLink: card.getAttribute("data-scheme-apply") || "#",
        applyPath: card.getAttribute("data-scheme-href") || schemesRouteWithQuery(card.getAttribute("data-scheme-id") || card.getAttribute("data-scheme-name") || "")
      };

      const exists = compareList.find(function (x) { return x.name === item.name; });
      if (exists) {
        compareList = compareList.filter(function (x) { return x.name !== item.name; });
        showToast("Removed from compare");
      } else {
        if (compareList.length >= COMPARE_LIMIT) {
          showToast("Compare supports up to 3 schemes");
          return;
        }
        compareList.push(item);
        showToast("Added to compare");
      }

      renderComparePanel();
      syncCompareButtons();
    });

    document.addEventListener("schemes-ready", function () {
      window.setTimeout(syncCompareButtons, 60);
    });

    renderComparePanel();
    syncCompareButtons();
  }

  function setupMagneticButtons() {
    magneticTargets.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = "translate(" + x * 0.08 + "px, " + y * 0.08 + "px)";
      });

      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  function setupAvatarUi() {
    const user = getUser();
    if (!user) return;

    const signInLinks = Array.from(document.querySelectorAll(".sign-in"));
    signInLinks.forEach(function (link) {
      link.style.display = "none";
    });

    const desktopNav = document.querySelector(".desktop-nav");
    const mobileMenu = document.querySelector("#mobile-menu");

    function buildAvatarTrigger(size) {
      const trigger = document.createElement("button");
      trigger.className = "avatar-trigger";
      trigger.type = "button";
      trigger.style.background = user.avatar.color;
      trigger.style.color = "#fff";
      trigger.classList.add(user.avatar.ring || "ring-green");
      trigger.style.width = size + "px";
      trigger.style.height = size + "px";
      if (user.avatar.image) {
        trigger.innerHTML =
          '<span class="avatar-image" style="background-image:url(' + user.avatar.image + ')"></span>' +
          '<span class="avatar-emoji">' + (user.avatar.emoji || "🟢") + "</span>";
      } else {
        trigger.innerHTML =
          '<span class="avatar-text">' + (user.avatar.initials || initialsFromName(user.name)) + "</span>" +
          '<span class="avatar-emoji">' + (user.avatar.emoji || "🟢") + "</span>";
      }
      return trigger;
    }

    const desktopTrigger = buildAvatarTrigger(40);
    const mobileTrigger = buildAvatarTrigger(40);

    if (desktopNav) desktopNav.appendChild(desktopTrigger);
    if (mobileMenu) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "center";
      wrapper.style.paddingTop = "6px";
      wrapper.appendChild(mobileTrigger);
      mobileMenu.appendChild(wrapper);
    }

    const menu = document.createElement("div");
    menu.className = "avatar-menu";
    menu.innerHTML = [
      '<div class="avatar-head">',
      '  <button class="avatar-trigger ' + (user.avatar.ring || "ring-green") + '" type="button" style="width:36px;height:36px;background:' + user.avatar.color + ';color:#fff;">',
      (user.avatar.image
        ? '    <span class="avatar-image" style="background-image:url(' + user.avatar.image + ')"></span>'
        : '    <span class="avatar-text">' + (user.avatar.initials || initialsFromName(user.name)) + '</span>') +
      '    <span class="avatar-emoji">' + (user.avatar.emoji || "🟢") + '</span>',
      "  </button>",
      "  <div><strong>" + (user.name || "SchemeConnect User") + "</strong><small>" + (user.email || "") + "</small></div>",
      "</div>",
      '<button class="avatar-action" type="button" id="customize-avatar-btn">Customize Avatar</button>',
      '<button class="avatar-action" type="button" id="profile-page-btn">Open Profile Page</button>',
      '<button class="avatar-action logout" type="button" id="logout-btn">Log Out</button>'
    ].join("");
    document.body.appendChild(menu);

    function toggleMenu() {
      menu.classList.toggle("open");
    }

    desktopTrigger.addEventListener("click", toggleMenu);
    mobileTrigger.addEventListener("click", toggleMenu);

    document.addEventListener("click", function (e) {
      if (menu.contains(e.target) || e.target === desktopTrigger || e.target === mobileTrigger) return;
      menu.classList.remove("open");
    });

    const customizeLayer = document.createElement("div");
    customizeLayer.className = "avatar-customize";
    const colors = ["#1a7a4a", "#2563eb", "#7c3aed", "#dc2626", "#0f766e", "#d97706"];
    const emojis = ["🟢", "✨", "🚀", "💎", "🔥", "🌟"];
    const rings = ["ring-green", "ring-blue", "ring-purple", "ring-gold"];
    let draft = {
      initials: user.avatar.initials || initialsFromName(user.name),
      color: user.avatar.color || "#1a7a4a",
      emoji: user.avatar.emoji || "🟢",
      ring: user.avatar.ring || "ring-green",
      image: user.avatar.image || ""
    };

    function loadImageFromFile(file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          const img = new Image();
          img.onload = function () {
            resolve(img);
          };
          img.onerror = function () {
            reject(new Error("Invalid image"));
          };
          img.src = String(reader.result || "");
        };
        reader.onerror = function () {
          reject(new Error("Unable to read file"));
        };
        reader.readAsDataURL(file);
      });
    }

    async function processAvatarImage(file) {
      const img = await loadImageFromFile(file);
      const size = 320;
      const side = Math.min(img.width, img.height);
      const sx = Math.floor((img.width - side) / 2);
      const sy = Math.floor((img.height - side) / 2);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      return canvas.toDataURL("image/jpeg", 0.86);
    }

    function normalizeInitials(value) {
      const clean = String(value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
      return clean;
    }

    function normalizeEmoji(value) {
      const chars = Array.from(String(value || "").trim());
      return chars.slice(0, 2).join("");
    }

    function renderCustomizer() {
      customizeLayer.innerHTML = [
        '<div class="avatar-customize-card">',
        "  <h4>Customize Avatar</h4>",
        '  <div class="avatar-preview" style="background:' + draft.color + '">',
        (draft.image
          ? '    <span class="avatar-image" style="background-image:url(' + draft.image + ')"></span>'
          : '    <span class="avatar-initials-preview">' + draft.initials + "</span>") +
        '    <span class="avatar-emoji">' + draft.emoji + "</span>",
        "  </div>",
        '  <input id="avatar-initials" class="avatar-input" maxlength="2" value="' + draft.initials + '" />',
        '  <input id="avatar-emoji-input" class="avatar-input" maxlength="4" value="' + draft.emoji + '" placeholder="Enter emoji for avatar badge" />',
        '  <input id="avatar-upload" class="avatar-input" type="file" accept="image/*" />',
        '  <div class="avatar-swatches">' +
        colors
          .map(function (c) {
            return '<button type="button" class="swatch' + (c === draft.color ? " active" : "") + '" data-color="' + c + '" style="background:' + c + '"></button>';
          })
          .join("") +
        "</div>",
        '  <div class="avatar-rings">' +
        rings
          .map(function (ring) {
            return '<button type="button" class="ring-pick ' + ring + (ring === draft.ring ? " active" : "") + '" data-ring="' + ring + '"></button>';
          })
          .join("") +
        "</div>",
        '  <div class="avatar-emojis">' +
        emojis
          .map(function (em) {
            return '<button type="button" class="emoji-pick' + (em === draft.emoji ? " active" : "") + '" data-emoji="' + em + '">' + em + "</button>";
          })
          .join("") +
        "</div>",
        '  <div class="avatar-customize-actions">',
        '    <button type="button" id="avatar-cancel">Cancel</button>',
        '    <button type="button" class="save" id="avatar-save">Save</button>',
        "  </div>",
        "</div>"
      ].join("");

      const initialsInput = customizeLayer.querySelector("#avatar-initials");
      const emojiInput = customizeLayer.querySelector("#avatar-emoji-input");
      initialsInput.addEventListener("input", function () {
        const val = normalizeInitials(initialsInput.value);
        draft.initials = val;
        initialsInput.value = val;
        const preview = customizeLayer.querySelector(".avatar-initials-preview");
        if (preview) preview.textContent = draft.initials;
      });

      emojiInput.addEventListener("input", function () {
        const normalized = normalizeEmoji(emojiInput.value);
        draft.emoji = normalized || "🟢";
        emojiInput.value = normalized;
        const previewEmoji = customizeLayer.querySelector(".avatar-preview .avatar-emoji");
        if (previewEmoji) previewEmoji.textContent = draft.emoji;
      });

      const uploadInput = customizeLayer.querySelector("#avatar-upload");
      uploadInput.addEventListener("change", async function () {
        const file = uploadInput.files && uploadInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
          showToast("Please upload an image file");
          return;
        }

        try {
          const processed = await processAvatarImage(file);
          draft.image = processed;
          renderCustomizer();
          showToast("Avatar image optimized");
        } catch (err) {
          showToast("Unable to process image");
        }
      });

      customizeLayer.querySelectorAll(".swatch").forEach(function (btn) {
        btn.addEventListener("click", function () {
          draft.color = btn.getAttribute("data-color") || draft.color;
          renderCustomizer();
        });
      });

      customizeLayer.querySelectorAll(".emoji-pick").forEach(function (btn) {
        btn.addEventListener("click", function () {
          draft.emoji = btn.getAttribute("data-emoji") || draft.emoji;
          renderCustomizer();
        });
      });

      customizeLayer.querySelectorAll(".ring-pick").forEach(function (btn) {
        btn.addEventListener("click", function () {
          draft.ring = btn.getAttribute("data-ring") || draft.ring;
          renderCustomizer();
        });
      });

      customizeLayer.querySelector("#avatar-cancel").addEventListener("click", function () {
        customizeLayer.classList.remove("open");
      });

      customizeLayer.querySelector("#avatar-save").addEventListener("click", function () {
        user.avatar = {
          initials: draft.initials || initialsFromName(user.name),
          color: draft.color,
          emoji: draft.emoji || "🟢",
          ring: draft.ring,
          image: draft.image
        };
        setUser(user);
        showToast("Avatar updated");
        window.location.reload();
      });
    }

    renderCustomizer();
    document.body.appendChild(customizeLayer);

    menu.querySelector("#customize-avatar-btn").addEventListener("click", function () {
      menu.classList.remove("open");
      customizeLayer.classList.add("open");
    });

    menu.querySelector("#profile-page-btn").addEventListener("click", function () {
      window.location.href = appRoute("profile.html");
    });

    menu.querySelector("#logout-btn").addEventListener("click", function () {
      localStorage.removeItem(USER_KEY);
      showToast("Logged out");
      window.setTimeout(function () {
        window.location.reload();
      }, 300);
    });
  }

  function setupDarkMode() {
    const DARK_MODE_KEY = "schemeconnect:dark-mode";
    const existingToggle = document.getElementById("dark-mode-toggle");
    if (existingToggle) {
      return;
    }

    const darkModeToggle = document.createElement("button");
    darkModeToggle.id = "dark-mode-toggle";
    darkModeToggle.className = "dark-mode-toggle";
    darkModeToggle.type = "button";
    darkModeToggle.setAttribute("aria-label", "Toggle dark mode");
    darkModeToggle.innerHTML = '<span class="theme-icon icon-sun" aria-hidden="true">☀</span><span class="theme-icon icon-moon" aria-hidden="true">🌙</span>';

    const navShell = document.getElementById("nav-shell");
    const mobileToggle = document.getElementById("mobile-toggle");
    const topbar = document.querySelector(".topbar");

    if (navShell) {
      if (mobileToggle && mobileToggle.parentElement === navShell) {
        navShell.insertBefore(darkModeToggle, mobileToggle);
      } else {
        navShell.appendChild(darkModeToggle);
      }
    } else if (topbar) {
      topbar.appendChild(darkModeToggle);
    } else {
      darkModeToggle.classList.add("floating-toggle");
      document.body.appendChild(darkModeToggle);
    }

    function applyDarkMode(enabled, animate, sourceElement) {
      if (animate) {
        const rect = sourceElement && sourceElement.getBoundingClientRect ? sourceElement.getBoundingClientRect() : null;
        const x = rect ? rect.left + rect.width * 0.5 : undefined;
        const y = rect ? rect.top + rect.height * 0.5 : undefined;
        playThemeTransition({
          mode: "dark-toggle",
          toDark: enabled,
          x: x,
          y: y,
          colors: getThemePalette(getActiveThemeName(), enabled)
        });
      }

      runVisualTransition(function () {
        document.body.classList.toggle("dark-mode", enabled);
        darkModeToggle.classList.toggle("is-dark", enabled);
        darkModeToggle.setAttribute("aria-label", enabled ? "Switch to light mode" : "Switch to dark mode");
      }, false);
    }

    const isDarkMode = localStorage.getItem(DARK_MODE_KEY) === "1";
    applyDarkMode(isDarkMode, false);

    darkModeToggle.addEventListener("click", function () {
      const nextEnabled = !document.body.classList.contains("dark-mode");
      localStorage.setItem(DARK_MODE_KEY, nextEnabled ? "1" : "0");
      applyDarkMode(nextEnabled, true, darkModeToggle);
      showToast(nextEnabled ? "Dark mode enabled" : "Light mode enabled");
    });
  }

  function setupSearchHistory() {
    const SEARCH_HISTORY_KEY = "schemeconnect:search-history";
    
    function getSearchHistory() {
      try {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function addSearchToHistory(query) {
      if (!query || query.trim().length < 2) return;
      const history = getSearchHistory();
      const filtered = history.filter(function (h) { return h !== query; });
      filtered.unshift(query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered.slice(0, 10)));
    }

    if (schemeSearchInput) {
      schemeSearchInput.addEventListener("change", function () {
        addSearchToHistory(schemeSearchInput.value);
      });

      // Show history on focus
      schemeSearchInput.addEventListener("focus", function () {
        const history = getSearchHistory();
        if (!history.length) return;
        const datalist = schemeSearchInput.getAttribute("list");
        if (!datalist) {
          const list = document.createElement("datalist");
          list.id = "search-history-list";
          history.forEach(function (item) {
            const option = document.createElement("option");
            option.value = item;
            list.appendChild(option);
          });
          schemeSearchInput.setAttribute("list", "search-history-list");
          document.body.appendChild(list);
        }
      });
    }
  }

  function setupExportShare() {
    const EXPORT_KEY = "export-share";
    const exportBtn = document.createElement("button");
    exportBtn.id = "export-share-btn";
    exportBtn.className = "export-share-btn smart-chip";
    exportBtn.type = "button";
    exportBtn.textContent = "📤 Export";
    exportBtn.style.position = "fixed";
    exportBtn.style.bottom = "80px";
    exportBtn.style.right = "18px";
    exportBtn.style.zIndex = "42";
    document.body.appendChild(exportBtn);

    const modal = document.createElement("div");
    modal.className = "export-modal";
    modal.innerHTML = [
      '<div class="export-modal-card" role="dialog" aria-modal="true">',
      '  <div class="export-modal-head">',
      '    <h4>Export & Share</h4>',
      '    <button class="export-modal-close" type="button">×</button>',
      '  </div>',
      '  <div class="export-modal-content">',
      '    <button class="export-option" data-export="copy-favorites">📋 Copy Favorites</button>',
      '    <button class="export-option" data-export="copy-compare">📋 Copy Comparison</button>',
      '    <button class="export-option" data-export="share-link">🔗 Share via Link</button>',
      '  </div>',
      '</div>'
    ].join("");
    document.body.appendChild(modal);

    exportBtn.addEventListener("click", function () {
      modal.classList.add("open");
    });

    modal.querySelector(".export-modal-close").addEventListener("click", function () {
      modal.classList.remove("open");
    });

    document.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.remove("open");
    });

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".export-option");
      if (!btn) return;
      
      const type = btn.getAttribute("data-export");
      if (type === "copy-favorites") {
        const text = "My Favorites:\n" + favorites.map(function (f) {
          return f.name + " (" + f.category + ")";
        }).join("\n");
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          showToast("Clipboard access is unavailable on this browser");
          return;
        }
        navigator.clipboard.writeText(text).then(function () {
          showToast("Favorites copied to clipboard");
          modal.classList.remove("open");
        }).catch(function () {
          showToast("Could not copy favorites");
        });
      } else if (type === "copy-compare") {
        const text = "Scheme Comparison:\n" + compareList.map(function (c) {
          return c.name + " - " + c.benefit;
        }).join("\n");
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          showToast("Clipboard access is unavailable on this browser");
          return;
        }
        navigator.clipboard.writeText(text).then(function () {
          showToast("Comparison copied to clipboard");
          modal.classList.remove("open");
        }).catch(function () {
          showToast("Could not copy comparison");
        });
      } else if (type === "share-link") {
        const url = window.location.origin + window.location.pathname;
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          showToast("Clipboard access is unavailable on this browser");
          return;
        }
        navigator.clipboard.writeText(url).then(function () {
          showToast("Link copied to clipboard");
          modal.classList.remove("open");
        }).catch(function () {
          showToast("Could not copy link");
        });
      }
    });
  }

  function setupNotifications() {
    // Enhanced notification system with different types
    window.showNotification = function (message, type) {
      const prefs = readPreferences();
      if (!prefs.notifications) return;
      type = type || "info";
      const notification = document.createElement("div");
      notification.className = "notification notification-" + type;
      notification.setAttribute("role", "alert");
      notification.innerHTML = [
        '<div class="notification-content">',
        (type === "success" ? "✓ " : type === "error" ? "✕ " : "ℹ "),
        message,
        '</div>'
      ].join("");
      document.body.appendChild(notification);
      
      window.setTimeout(function () {
        notification.classList.add("show");
      }, 10);
      
      window.setTimeout(function () {
        notification.classList.remove("show");
        window.setTimeout(function () { notification.remove(); }, 300);
      }, 3000);
    };
  }

  function setupUserPreferences() {
    const prefBtn = document.createElement("button");
    prefBtn.id = "preferences-btn";
    prefBtn.className = "preferences-btn smart-chip";
    prefBtn.type = "button";
    prefBtn.textContent = "⚙️ Settings";
    prefBtn.style.position = "fixed";
    prefBtn.style.bottom = "120px";
    prefBtn.style.right = "18px";
    prefBtn.style.zIndex = "42";
    document.body.appendChild(prefBtn);

    const modal = document.createElement("div");
    modal.className = "preferences-modal";
    modal.innerHTML = [
      '<div class="preferences-modal-card" role="dialog" aria-modal="true">',
      '  <div class="preferences-modal-head">',
      '    <h4>User Preferences</h4>',
      '    <button class="preferences-modal-close" type="button">×</button>',
      '  </div>',
      '  <div class="preferences-modal-content">',
      '    <div class="preference-group">',
      '      <label><input type="checkbox" id="pref-notifications" /> Enable Notifications</label>',
      '    </div>',
      '    <div class="preference-group">',
      '      <label><input type="checkbox" id="pref-animations" /> Animations</label>',
      '    </div>',
      '    <div class="preference-group">',
      '      <label><input type="checkbox" id="pref-suggestions" /> Show AI Suggestions</label>',
      '    </div>',
      '    <div class="preference-group">',
      '      <label>Default View:',
      '        <select id="pref-view">',
      '          <option value="grid">Grid</option>',
      '          <option value="list">List</option>',
      '        </select>',
      '      </label>',
      '    </div>',
      '    <div class="preference-group">',
      '      <label>AI Assistant</label>',
      '      <small>Gemini is managed by SchemeConnect for all users. No personal API key is required.</small>',
      '    </div>',
      '    <button class="save-preferences-btn" type="button">Save Preferences</button>',
      '  </div>',
      '</div>'
    ].join("");
    document.body.appendChild(modal);

    function loadPreferences() {
      const prefs = readPreferences();
      document.getElementById("pref-notifications").checked = prefs.notifications;
      document.getElementById("pref-animations").checked = prefs.animations;
      document.getElementById("pref-suggestions").checked = prefs.suggestions;
      document.getElementById("pref-view").value = prefs.defaultView;
    }

    prefBtn.addEventListener("click", function () {
      loadPreferences();
      modal.classList.add("open");
    });

    modal.querySelector(".preferences-modal-close").addEventListener("click", function () {
      modal.classList.remove("open");
    });

    modal.querySelector(".save-preferences-btn").addEventListener("click", function () {
      const prefs = {
        notifications: document.getElementById("pref-notifications").checked,
        animations: document.getElementById("pref-animations").checked,
        suggestions: document.getElementById("pref-suggestions").checked,
        defaultView: document.getElementById("pref-view").value
      };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      applyUserPreferences();
      showToast("Preferences saved");
      modal.classList.remove("open");
    });

    document.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.remove("open");
    });
  }

  function setupAdvancedFilters() {
    // Add advanced filter indicators and handler
    const filterPanel = document.createElement("div");
    filterPanel.className = "advanced-filters-panel";
    filterPanel.innerHTML = [
      '<div class="advanced-filters-wrap">',
      '  <div class="filter-group">',
      '    <label>Age Range:</label>',
      '    <input type="range" min="0" max="100" id="filter-age" class="filter-input" />',
      '  </div>',
      '  <div class="filter-group">',
      '    <label>Income Limit:</label>',
      '    <select id="filter-income" class="filter-input">',
      '      <option value="">All</option>',
      '      <option value="100000">Below 1 Lakh</option>',
      '      <option value="300000">Below 3 Lakh</option>',
      '      <option value="500000">Below 5 Lakh</option>',
      '      <option value="1000000">Below 10 Lakh</option>',
      '    </select>',
      '  </div>',
      '  <div class="filter-group">',
      '    <label>Gender:</label>',
      '    <select id="filter-gender" class="filter-input">',
      '      <option value="">All</option>',
      '      <option value="male">Male</option>',
      '      <option value="female">Female</option>',
      '      <option value="other">Other</option>',
      '    </select>',
      '  </div>',
      '</div>'
    ].join("");

    const filterBtn = document.createElement("button");
    filterBtn.id = "advanced-filters-toggle";
    filterBtn.className = "advanced-filters-toggle smart-chip";
    filterBtn.type = "button";
    filterBtn.textContent = "🔍 Filters";
    filterBtn.style.position = "fixed";
    filterBtn.style.bottom = "160px";
    filterBtn.style.right = "18px";
    filterBtn.style.zIndex = "42";

    document.body.appendChild(filterBtn);
    document.body.appendChild(filterPanel);

    filterBtn.addEventListener("click", function () {
      filterPanel.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!filterPanel.contains(e.target) && !filterBtn.contains(e.target)) {
        filterPanel.classList.remove("open");
      }
    });
  }

  setupScrollToTop();
  applyUserPreferences();
  setupCursorGlow();
  setupCardSpotlight();
  setupPremiumCardTilt();
  setupAdaptiveNavTransparency();
  setupFocusMode();
  setupShortcutGuide();
  setupCommandPalette();
  setupKeyboardShortcuts();
  setupThemeSwitcher();
  setupSurpriseFeature();
  setupBestMatchBadge();
  setupVoiceSearch();
  setupCompareFeature();
  setupMagneticButtons();
  setupFavoritesFeature();
  setupRadarWidget();
  setupAvatarUi();
  setupDarkMode();
  setupSearchHistory();
  setupNotifications();
  setupExportShare();
  setupUserPreferences();
  setupAdvancedFilters();
  setupCinematicReveal();
  setupMotionFinesse();
});
