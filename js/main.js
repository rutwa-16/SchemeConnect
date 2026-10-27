(function () {
  const FILTER_ICONS = {
    All: "✦",
    Farmer: "🌾",
    Student: "📚",
    Women: "👩‍🎓",
    Startup: "🚀",
    General: "🏛️"
  };

  let schemes = [];
  let baseSchemes = [];
  let filters = ["All", "Farmer", "Student", "Women", "Startup", "General"];
  let activeFilter = "All";
  let searchTerm = "";

  function mergeWithCustomSchemes(list) {
    const base = Array.isArray(list) ? list : [];
    if (!window.SchemeConnectCustomSchemes || typeof window.SchemeConnectCustomSchemes.mergeWith !== "function") {
      return base;
    }
    return window.SchemeConnectCustomSchemes.mergeWith(base);
  }

  function normalizeCategory(rawCategory) {
    const value = String(rawCategory || "General").toLowerCase();
    if (value.includes("farm")) return "Farmer";
    if (value.includes("student") || value.includes("education")) return "Student";
    if (value.includes("women") || value.includes("girl")) return "Women";
    if (value.includes("startup") || value.includes("msme") || value.includes("entrepreneur")) return "Startup";
    return "General";
  }

  function eligibilityLabel(eligibility) {
    if (typeof eligibility === "string") return eligibility;
    if (!eligibility || typeof eligibility !== "object") return "Check eligibility";
    const minAge = typeof eligibility.minAge === "number" ? eligibility.minAge : null;
    const maxAge = typeof eligibility.maxAge === "number" ? eligibility.maxAge : null;
    if (minAge !== null && maxAge !== null) {
      return "Age " + minAge + "-" + maxAge;
    }
    return "Check eligibility";
  }

  function normalizeScheme(raw) {
    const normalizedCategory = normalizeCategory(raw.category);
    return {
      id: raw.id || raw.name,
      name: raw.name || "Unnamed Scheme",
      category: normalizedCategory,
      rawCategory: raw.category || normalizedCategory,
      description: raw.description || "Details available on official portal.",
      benefit: raw.benefit || raw.benefits || "Benefit details available",
      eligibility: eligibilityLabel(raw.eligibility),
      icon: raw.icon || "🏛️",
      featured: Boolean(raw.featured)
    };
  }

  function shuffleArray(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function qs(sel) {
    return document.querySelector(sel);
  }

  function qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  function onScrollEffects() {
    const y = window.scrollY;
    const doc = document.documentElement;
    const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const pct = Math.min(y / max, 1);

    const progress = qs("#scroll-progress");
    progress.style.transform = "scaleX(" + pct + ")";
    progress.style.opacity = pct > 0.02 ? "1" : "0";

    qs("#main-header").classList.toggle("scrolled", y > 24);
  }

  function setupReveal() {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.12 }
    );

    qsa(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  }

  function countUp(el) {
    const target = parseInt(el.getAttribute("data-target") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      const value = Math.floor(ease * target);
      el.textContent = String(value) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function setupCounters() {
    const wrap = qs("#stats-wrap");
    if (!wrap) return;

    let run = false;
    const obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !run) {
            run = true;
            qsa(".counter").forEach(countUp);
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(wrap);
  }

  function categoryClass(category) {
    switch (category) {
      case "Farmer":
        return "badge-farmer";
      case "Student":
        return "badge-student";
      case "Women":
        return "badge-women";
      case "Startup":
        return "badge-startup";
      default:
        return "badge-general";
    }
  }

  function renderFilters() {
    const bar = qs("#filter-bar");
    bar.innerHTML = "";

    filters.forEach(function (f) {
      const btn = document.createElement("button");
      btn.className = "filter-btn" + (activeFilter === f ? " active" : "");
      btn.textContent = (FILTER_ICONS[f] || "🏛️") + " " + f;
      btn.addEventListener("click", function () {
        activeFilter = f;
        renderFilters();
        renderSchemes(false);
      });
      bar.appendChild(btn);
    });
  }

  function schemeCardTemplate(s) {
    const safeName = String(s.name || "Unnamed Scheme").replace(/"/g, '&quot;');
    const safeCategory = String(s.category || "General").replace(/"/g, '&quot;');
    const safeBenefit = String(s.benefit || "Benefit details available").replace(/"/g, '&quot;');
    const safeDesc = String(s.description || "Details available on official portal.");
    const schemeHref = "pages/schemes.html?scheme=" + encodeURIComponent(String(s.id || s.name || ""));
    return [
      '<article class="scheme-card" data-scheme-id="' + String(s.id || s.name || "").replace(/"/g, '&quot;') + '" data-scheme-name="' + safeName + '" data-scheme-category="' + safeCategory + '" data-scheme-benefit="' + safeBenefit + '" data-scheme-ministry="' + String(s.ministry || "").replace(/"/g, '&quot;') + '" data-scheme-description="' + String(s.description || "").replace(/"/g, '&quot;') + '" data-scheme-documents="' + String(JSON.stringify(s.documents || [])).replace(/"/g, '&quot;') + '" data-scheme-eligibility="' + String(JSON.stringify(s.eligibility || {})).replace(/"/g, '&quot;') + '" data-scheme-apply="' + String(s.applyLink || "#").replace(/"/g, '&quot;') + '" data-scheme-href="' + String(schemeHref).replace(/"/g, '&quot;') + '">',
      '  <button class="fav-btn" type="button" aria-label="Save scheme" data-fav="' + safeName + '">❤</button>',
      '  <div class="scheme-top">',
      '    <span class="scheme-icon">' + (s.icon || "🏛️") + "</span>",
      '    <span class="scheme-badge ' + categoryClass(s.category) + '">' + s.category + "</span>",
      "  </div>",
      "  <h3>" + s.name + "</h3>",
      '  <p class="desc">' + safeDesc + "</p>",
      '  <div class="card-actions">',
      '    <a class="apply-btn" href="' + schemeHref + '">Apply Now</a>',
      '    <button class="compare-btn" type="button" aria-label="Compare scheme" data-compare="' + safeName + '">⚖️ Compare</button>',
      "  </div>",
      "</article>"
    ].join("");
  }

  function renderSchemes(shuffle) {
    const grid = qs("#schemes-grid");
    if (!grid) return;

    let list = schemes.filter(function (s) {
      const passesCategory = activeFilter === "All" || s.category === activeFilter;
      const haystack = (s.name + " " + s.category + " " + s.benefit + " " + s.description).toLowerCase();
      const passesSearch = !searchTerm || haystack.includes(searchTerm);
      return passesCategory && passesSearch;
    });

    if (shuffle) {
      list = shuffleArray(list);
    }

    const visible = list.slice(0, 12);

    if (!visible.length) {
      grid.innerHTML = '<article class="scheme-card"><h3>No schemes found</h3><p class="desc">Try a different search or filter.</p></article>';
      return;
    }

    grid.innerHTML = visible.map(schemeCardTemplate).join("");
  }

  async function loadSchemes() {
    try {
      // Yield execution to allow enhancements.js to setup cinematic reveals on small container
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const rawData = window.SCHEMES_DATA || [];
      baseSchemes = Array.isArray(rawData) ? rawData : [];
      schemes = mergeWithCustomSchemes(baseSchemes).map(normalizeScheme);

      const discovered = Array.from(new Set(schemes.map(function (s) {
        return s.category;
      }))).sort();
      filters = ["All"].concat(discovered);

      renderSchemes();
      renderFilterBar();
      document.dispatchEvent(new CustomEvent("schemes-ready", { detail: schemes }));
    } catch (error) {
      console.error("Failed to load schemes", error);
    }
  }

  function setupButtons() {
    const exploreBtn = qs("#explore-btn");
    if (exploreBtn) {
      exploreBtn.addEventListener("click", function () {
        const target = qs("#schemes");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    }

    const mobileToggle = qs("#mobile-toggle");
    const mobileMenu = qs("#mobile-menu");
    
    function closeMobileMenu() {
      mobileMenu.classList.remove("open");
      mobileToggle.innerHTML = "&#9776;";
    }
    
    mobileToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      mobileMenu.classList.toggle("open");
      mobileToggle.innerHTML = mobileMenu.classList.contains("open") ? "&#10005;" : "&#9776;";
    });

    // Close menu on link clicks
    qsa("#mobile-menu a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });
    
    // Close menu on sign-in button click
    const mobileSignIn = qs("#mobile-menu .sign-in");
    if (mobileSignIn) {
      mobileSignIn.addEventListener("click", closeMobileMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!mobileMenu.contains(e.target) && e.target !== mobileToggle) {
        closeMobileMenu();
      }
    });

    const searchInput = qs("#scheme-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        searchTerm = searchInput.value.trim().toLowerCase();
        renderSchemes(false);
      });
    }

    const shuffleBtn = qs("#shuffle-btn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", function () {
        renderSchemes(true);
      });
    }
  }

  function setupQuickLinkStatus() {
    const chatStatus = qs("#chat-quick-status");
    const quizStatus = qs("#quiz-quick-status");
    if (!chatStatus && !quizStatus) return;

    function readFavoritesCount() {
      try {
        const favorites = JSON.parse(localStorage.getItem("schemeconnect:favorites") || "[]");
        return Array.isArray(favorites) ? favorites.length : 0;
      } catch (e) {
        return 0;
      }
    }

    function readQuizProgress() {
      try {
        return JSON.parse(localStorage.getItem("schemeconnect:quiz-progress") || "null");
      } catch (e) {
        return null;
      }
    }

    function renderQuickStatus() {
      if (chatStatus) {
        const savedCount = readFavoritesCount();
        chatStatus.textContent = savedCount
          ? (savedCount + " saved scheme" + (savedCount === 1 ? "" : "s") + " ready to review")
          : "Ask anything about schemes";
      }

      if (quizStatus) {
        const progress = readQuizProgress();
        if (progress && progress.step) {
          quizStatus.textContent = "Resume from step " + Math.min(Math.max(progress.step, 1), 5);
        } else {
          quizStatus.textContent = "Get matched schemes in 2 minutes";
        }
      }
    }

    renderQuickStatus();
    window.addEventListener("storage", renderQuickStatus);
    document.addEventListener("schemeconnect:favorites-updated", renderQuickStatus);
  }

  function setupLoading() {
    const loading = qs("#loading-screen");
    window.setTimeout(function () {
      loading.classList.add("fade");
      window.setTimeout(function () {
        loading.style.display = "none";
      }, 520);
    }, 1500);
  }

  async function init() {
    setupLoading();
    setupButtons();
    setupQuickLinkStatus();
    setupReveal();
    setupCounters();
    onScrollEffects();
    window.addEventListener("scroll", onScrollEffects, { passive: true });

    try {
      await loadSchemes();
      renderFilters();
      renderSchemes(false);
      document.dispatchEvent(new CustomEvent("schemes-ready", { detail: schemes }));
    } catch (err) {
      console.error(err);
    }

    document.addEventListener("schemeconnect:custom-schemes-updated", function () {
      schemes = mergeWithCustomSchemes(baseSchemes).map(normalizeScheme);
      const discovered = Array.from(new Set(schemes.map(function (s) {
        return s.category;
      }))).sort();
      filters = ["All"].concat(discovered);
      renderFilters();
      renderSchemes(false);
      document.dispatchEvent(new CustomEvent("schemes-ready", { detail: schemes }));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
