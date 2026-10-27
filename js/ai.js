(function () {
  const INITIAL_MESSAGE = "Hello! I am your AI Scheme Advisor. Tell me about your profession, location, or needs and I will suggest matching government schemes.";
  const SUGGESTIONS = [
    "Scholarships for students",
    "Loans for startup",
    "Farming subsidies",
    "Schemes for women"
  ];

  let allSchemes = [];
  const STOPWORDS = new Set(["the", "and", "for", "with", "from", "that", "this", "need", "want", "about", "scheme", "schemes", "help", "find", "looking", "please"]);

  const INTENT_MAP = [
    {
      triggers: ["student", "students", "scholarship", "study", "education", "college", "school"],
      boosters: ["student", "education", "scholarship", "study"]
    },
    {
      triggers: ["farm", "farmer", "kisan", "agri", "crop", "agriculture"],
      boosters: ["farmer", "agriculture", "kisan", "crop"]
    },
    {
      triggers: ["women", "woman", "female", "girl", "widow", "maternity"],
      boosters: ["women", "girl", "female", "maternity"]
    },
    {
      triggers: ["startup", "business", "entrepreneur", "msme", "loan", "credit"],
      boosters: ["startup", "entrepreneurship", "business", "msme", "loan", "credit"]
    },
    {
      triggers: ["house", "home", "housing", "awas", "shelter"],
      boosters: ["housing", "awas", "home", "shelter"]
    },
    {
      triggers: ["health", "insurance", "hospital", "medical", "treatment"],
      boosters: ["health", "insurance", "medical", "hospital"]
    },
    {
      triggers: ["senior", "elder", "old", "pension"],
      boosters: ["senior", "pension", "elder"]
    },
    {
      triggers: ["job", "employment", "skill", "training", "youth"],
      boosters: ["employment", "skill", "training", "youth"]
    }
  ];

  function qs(sel) {
    return document.querySelector(sel);
  }

  function scrollMessages() {
    const box = qs("#ai-messages");
    box.scrollTop = box.scrollHeight;
  }

  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = "msg " + role;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    msg.appendChild(bubble);
    qs("#ai-messages").appendChild(msg);
    scrollMessages();
  }

  function addRichMessage(role, html) {
    const msg = document.createElement("div");
    msg.className = "msg " + role;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = html;

    msg.appendChild(bubble);
    qs("#ai-messages").appendChild(msg);
    scrollMessages();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(function (token) {
        return token && token.length > 2 && !STOPWORDS.has(token);
      });
  }

  function buildSearchBlob(scheme) {
    return [
      scheme.id || "",
      scheme.name || "",
      scheme.category || "",
      scheme.ministry || "",
      scheme.description || "",
      scheme.benefit || scheme.benefits || "",
      Array.isArray(scheme.tags) ? scheme.tags.join(" ") : ""
    ].join(" ").toLowerCase();
  }

  function scoreScheme(scheme, query, tokens) {
    const name = String(scheme.name || "").toLowerCase();
    const category = String(scheme.category || "").toLowerCase();
    const description = String(scheme.description || "").toLowerCase();
    const benefit = String(scheme.benefit || scheme.benefits || "").toLowerCase();
    const ministry = String(scheme.ministry || "").toLowerCase();
    const tags = Array.isArray(scheme.tags) ? scheme.tags.join(" ").toLowerCase() : "";
    const blob = buildSearchBlob(scheme);

    let score = 0;
    const matchedRanks = {};
    const matchedOrder = {};
    let orderCounter = 0;

    function markMatch(term, rank) {
      if (!Object.prototype.hasOwnProperty.call(matchedRanks, term)) {
        matchedRanks[term] = rank;
        matchedOrder[term] = orderCounter;
        orderCounter += 1;
        return;
      }
      matchedRanks[term] = Math.min(matchedRanks[term], rank);
    }

    tokens.forEach(function (token) {
      if (name.includes(token)) {
        score += 9;
        markMatch(token, 1);
      }
      if (category.includes(token)) {
        score += 7;
        markMatch(token, 2);
      }
      if (benefit.includes(token)) {
        score += 6;
        markMatch(token, 3);
      }
      if (tags.includes(token)) {
        score += 5;
        markMatch(token, 4);
      }
      if (description.includes(token)) {
        score += 4;
        markMatch(token, 5);
      }
      if (ministry.includes(token)) {
        score += 2;
        markMatch(token, 6);
      }
      if (blob.includes(token)) score += 1;
    });

    if (query && name.includes(query)) score += 12;

    INTENT_MAP.forEach(function (intent) {
      const isIntentPresent = intent.triggers.some(function (trigger) {
        return query.includes(trigger);
      });
      if (!isIntentPresent) return;
      intent.boosters.forEach(function (boost) {
        if (blob.includes(boost)) {
          score += 4;
          markMatch(boost, 7);
        }
      });
    });

    const prioritizedTerms = Object.keys(matchedRanks)
      .sort(function (a, b) {
        if (matchedRanks[a] !== matchedRanks[b]) return matchedRanks[a] - matchedRanks[b];
        return matchedOrder[a] - matchedOrder[b];
      })
      .slice(0, 4);

    return {
      score: score,
      matchedTerms: prioritizedTerms
    };
  }

  function matchSchemes(text) {
    const query = String(text || "").toLowerCase().trim();
    const tokens = tokenize(query);
    if (!allSchemes.length || !tokens.length) return [];

    const scored = allSchemes.map(function (scheme) {
      const result = scoreScheme(scheme, query, tokens);
      return {
        scheme: scheme,
        score: result.score,
        matchedTerms: result.matchedTerms
      };
    });

    return scored
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6)
      .map(function (item) {
        return {
          scheme: item.scheme,
          matchedTerms: item.matchedTerms
        };
      });
  }

  function buildSuggestions() {
    const wrap = qs("#ai-suggestions");
    wrap.innerHTML = "";

    SUGGESTIONS.forEach(function (s) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggestion-btn";
      btn.textContent = s;
      btn.addEventListener("click", function () {
        qs("#ai-input").value = s;
        qs("#ai-input").focus();
      });
      wrap.appendChild(btn);
    });
  }

  function openPanel() {
    const panel = qs("#ai-panel");
    const fab = qs("#ai-fab");
    const input = qs("#ai-input");
    if (!panel) return;
    panel.classList.add("open");
    if (fab) fab.style.display = "none";
    if (input) input.focus();
  }

  function closePanel() {
    const panel = qs("#ai-panel");
    const fab = qs("#ai-fab");
    if (!panel) return;
    panel.classList.remove("open");
    if (fab) fab.style.display = "inline-block";
  }

  function setupEvents() {
    const aiFab = qs("#ai-fab");
    const aiClose = qs("#ai-close");
    const openAiBtn = qs("#open-ai-btn");
    const aiForm = qs("#ai-form");

    if (aiFab) aiFab.addEventListener("click", openPanel);
    if (aiClose) aiClose.addEventListener("click", closePanel);
    if (openAiBtn) openAiBtn.addEventListener("click", openPanel);

    if (!aiForm) return;

    aiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = qs("#ai-input");
      const value = input.value.trim();
      if (!value) return;

      addMessage("user", value);
      input.value = "";

      const typingId = "typing-" + Date.now();
      addRichMessage("ai", '<span id="' + typingId + '">Typing...</span>');

      window.setTimeout(function () {
        const typing = document.getElementById(typingId);
        if (typing) {
          typing.closest(".msg")?.remove();
        }

        const matches = matchSchemes(value);

        if (matches.length) {
          const cards = matches.slice(0, 4).map(function (result) {
            const s = result.scheme;
            const matchedText = result.matchedTerms.length
              ? result.matchedTerms.map(function (term) { return escapeHtml(term); }).join(", ")
              : "general relevance";
            return [
              '<div style="padding:8px;border:1px solid #e2e8f0;border-radius:10px;margin-top:6px;background:#fff;">',
              '<strong>' + escapeHtml(s.icon || "🏛️") + ' ' + escapeHtml(s.name) + '</strong><br/>',
              '<span style="font-size:11px;color:#64748b;font-weight:600;">' + escapeHtml(s.category || "General") + '</span><br/>',
              '<span style="font-size:12px;color:#64748b;">' + escapeHtml(s.description || "Details available") + '</span><br/>',
              '<span style="font-size:12px;color:#1a7a4a;font-weight:600;">' + escapeHtml(s.benefit || s.benefits || "Benefit details available") + '</span><br/>',
              '<span style="font-size:11px;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;padding:3px 6px;border-radius:999px;display:inline-block;margin-top:6px;">Matched on: ' + matchedText + '</span>',
              "</div>"
            ].join("");
          }).join("");

          addRichMessage("ai", "I matched your prompt and keywords with these schemes:" + cards);
        } else {
          addMessage("ai", "I could not find a strong match yet. Please add more details like category, age, income, state, or keywords like scholarship, farming, startup loan, health insurance.");
        }
      }, 900);
    });
  }

  function init() {
    addMessage("ai", INITIAL_MESSAGE);
    buildSuggestions();
    setupEvents();

    document.addEventListener("schemes-ready", function (e) {
      allSchemes = (e.detail || []).slice();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
