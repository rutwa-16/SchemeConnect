(function () {
  // Replace with your Gemini API Key or leave empty for offline/local matching
  var SITE_GEMINI_API_KEY = "";
  var SCHEME_DATA_PATH = "../data/schemes.json";

  var schemes = [];

  var QUICK_PROMPTS = [
    "I am a farmer. Which schemes are best for me?",
    "I am a student from Maharashtra. Any scholarship schemes?",
    "How can I apply for PM Awas Yojana?",
    "I want support schemes for women entrepreneurs",
    "Tell me documents needed before applying for schemes",
    "I run a small business. Any MSME support schemes?"
  ];

  function now() {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(input) {
    return $("<div>").text(String(input || "")).html();
  }

  function formatModelText(input) {
    var text = String(input || "");
    text = escapeHtml(text);
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\n/g, "<br>");
    return text;
  }

  function scrollBottom() {
    var node = document.getElementById("msgs");
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }

  function appendBot(htmlText) {
    $("#msgs").append(
      '<div class="mrow bot"><div class="mav bav">🤖</div><div><div class="mbub">' + htmlText + '</div></div></div>' +
      '<div class="mtime" style="margin-left:44px;">' + now() + "</div>"
    );
    scrollBottom();
  }

  function createBotBubbleShell() {
    var msgs = document.getElementById("msgs");
    if (!msgs) return null;

    var row = document.createElement("div");
    row.className = "mrow bot";

    var avatar = document.createElement("div");
    avatar.className = "mav bav";
    avatar.textContent = "🤖";

    var holder = document.createElement("div");
    var bubble = document.createElement("div");
    bubble.className = "mbub";
    holder.appendChild(bubble);

    row.appendChild(avatar);
    row.appendChild(holder);

    var time = document.createElement("div");
    time.className = "mtime";
    time.style.marginLeft = "44px";
    time.textContent = now();

    msgs.appendChild(row);
    msgs.appendChild(time);
    return bubble;
  }

  function isRichHtmlResponse(htmlText) {
    var text = String(htmlText || "");
    return /<details|<div style=|<a\s|<summary|<strong>Relevant schemes|<strong>New scheme/i.test(text);
  }

  function splitIntoCadenceChunks(htmlText) {
    var text = String(htmlText || "");
    if (text.indexOf("<br>") >= 0) {
      return text.split(/<br\s*\/?>/i).filter(Boolean);
    }

    var chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (!chunks || !chunks.length) return [text];
    return chunks.map(function (part) { return part.trim(); }).filter(Boolean);
  }

  function appendBotWithCadence(htmlText) {
    if (isRichHtmlResponse(htmlText)) {
      appendBot(htmlText);
      return Promise.resolve();
    }

    var chunks = splitIntoCadenceChunks(htmlText);
    if (chunks.length <= 1) {
      appendBot(htmlText);
      return Promise.resolve();
    }

    var bubble = createBotBubbleShell();
    if (!bubble) {
      appendBot(htmlText);
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      var idx = 0;

      function tick() {
        var current = chunks[idx] || "";
        if (idx === 0) {
          bubble.innerHTML = current;
        } else {
          bubble.innerHTML += "<br>" + current;
        }
        scrollBottom();

        idx += 1;
        if (idx >= chunks.length) {
          resolve();
          return;
        }

        var delay = 140 + Math.min(current.length * 6, 420);
        window.setTimeout(tick, delay);
      }

      tick();
    });
  }

  function appendUser(rawText) {
    $("#msgs").append(
      '<div class="mrow user"><div class="mav uav">👤</div><div><div class="mbub">' + escapeHtml(rawText) + '</div></div></div>' +
      '<div class="mtime" style="text-align:right;margin-right:44px;">' + now() + "</div>"
    );
    scrollBottom();
  }

  function showTyping() {
    $("#msgs").append('<div class="typing-row" id="typing-row"><div class="mav bav">🤖</div><div class="tdots"><span></span><span></span><span></span></div></div>');
    scrollBottom();
  }

  function removeTyping() {
    $("#typing-row").remove();
  }

  function normalizeSchemes(raw) {
    var list = Array.isArray(raw && raw.schemes) ? raw.schemes : (Array.isArray(raw) ? raw : []);
    return list.map(function (item) {
      return {
        id: item.id || item.name || "",
        name: item.name || "Unnamed Scheme",
        category: item.category || "General",
        ministry: item.ministry || "Government of India",
        description: item.description || "Details available on official portal.",
        benefits: item.benefits || item.benefit || "Benefit details available",
        howToApply: item.howToApply || "Visit official portal for application steps.",
        documents: Array.isArray(item.documents) ? item.documents : [],
        eligibility: item.eligibility && typeof item.eligibility === "object" ? item.eligibility : {},
        applyLink: item.applyLink || "#",
        tags: Array.isArray(item.tags) ? item.tags : []
      };
    });
  }

  function mergeWithCustomSchemes(list) {
    var base = Array.isArray(list) ? list : [];
    if (!window.SchemeConnectCustomSchemes || typeof window.SchemeConnectCustomSchemes.mergeWith !== "function") {
      return base;
    }
    return window.SchemeConnectCustomSchemes.mergeWith(base);
  }

  function addCustomScheme(scheme) {
    if (!window.SchemeConnectCustomSchemes || typeof window.SchemeConnectCustomSchemes.addOne !== "function") {
      return null;
    }
    return window.SchemeConnectCustomSchemes.addOne(scheme);
  }

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(function (part) { return part.length > 2; });
  }

  function scoreScheme(scheme, queryText) {
    var tokens = tokenize(queryText);
    if (!tokens.length) return 0;

    var haystack = [
      scheme.name,
      scheme.category,
      scheme.ministry,
      scheme.description,
      scheme.benefits,
      scheme.tags.join(" ")
    ].join(" ").toLowerCase();

    var score = 0;
    tokens.forEach(function (t) {
      if (String(scheme.name || "").toLowerCase().indexOf(t) >= 0) score += 8;
      if (String(scheme.category || "").toLowerCase().indexOf(t) >= 0) score += 5;
      if (String(scheme.benefits || "").toLowerCase().indexOf(t) >= 0) score += 4;
      if (haystack.indexOf(t) >= 0) score += 2;
    });
    return score;
  }

  function findTopMatches(queryText, limit) {
    var ranked = schemes
      .map(function (scheme) {
        return { scheme: scheme, score: scoreScheme(scheme, queryText) };
      })
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });

    return ranked.slice(0, limit || 4).map(function (item) { return item.scheme; });
  }

  function renderSchemeCards(results) {
    if (!results.length) return "";

    return results.map(function (s) {
      var docs = s.documents.slice(0, 3).map(function (d) { return escapeHtml(d); }).join(", ");
      var applyLink = s.applyLink && s.applyLink !== "#" ? s.applyLink : "official-portal.html";
      var eligibility = s.eligibility || {};
      var ageLabel = String((eligibility.minAge != null ? eligibility.minAge : "Any") + " - " + (eligibility.maxAge != null ? eligibility.maxAge : "Any"));
      var incomeLabel = eligibility.maxIncome != null ? ("Rs " + escapeHtml(eligibility.maxIncome)) : "Not specified";
      var statesLabel = Array.isArray(eligibility.states) && eligibility.states.length ? escapeHtml(eligibility.states.join(", ")) : "all";
      var howToApply = escapeHtml(s.howToApply || "Visit official portal for application details.");
      return [
        '<div style="margin-top:10px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card)">',
        '<strong>' + escapeHtml(s.name) + '</strong><br>',
        '<small style="color:var(--muted)">' + escapeHtml(s.category) + ' · ' + escapeHtml(s.ministry) + '</small><br>',
        '<span>' + escapeHtml(s.description) + '</span><br>',
        '<span style="color:var(--primary);font-weight:700">Benefit: ' + escapeHtml(s.benefits) + '</span><br>',
        '<details style="margin-top:8px;">',
        '<summary style="cursor:pointer;color:var(--primary);font-weight:600;">Show details</summary>',
        '<div style="margin-top:8px;font-size:13px;line-height:1.5;">',
        '<div><strong>Eligibility:</strong> Gender ' + escapeHtml(eligibility.gender || "all") + ', Age ' + ageLabel + ', Max income ' + incomeLabel + '</div>',
        '<div><strong>States:</strong> ' + statesLabel + '</div>',
        '<div><strong>How to apply:</strong> ' + howToApply + '</div>',
        (docs ? '<div><strong>Documents:</strong> ' + docs + '</div>' : ''),
        '</div>',
        '</details>',
        '<a href="' + escapeHtml(applyLink) + '" target="_blank" rel="noopener noreferrer">Official apply/details</a>',
        '</div>'
      ].join("");
    }).join("");
  }

  function hasGeminiKey() {
    return Boolean(String(SITE_GEMINI_API_KEY || "").trim());
  }

  function extractJsonObject(text) {
    var raw = String(text || "").trim();
    if (!raw) return null;
    raw = raw.replace(/^```json\s*/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

    try {
      return JSON.parse(raw);
    } catch (e) {
      var first = raw.indexOf("{");
      var last = raw.lastIndexOf("}");
      if (first < 0 || last <= first) return null;
      try {
        return JSON.parse(raw.slice(first, last + 1));
      } catch (e2) {
        return null;
      }
    }
  }

  async function discoverAndStoreUnknownScheme(userQuery, localMatches) {
    var apiKey = String(SITE_GEMINI_API_KEY || "").trim();
    if (!apiKey) return null;

    var endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
    var discoveryPrompt = [
      "You are validating if a user query refers to a real Indian government scheme missing from local site data.",
      "Return ONLY JSON with this exact structure:",
      "{",
      '  "found": true|false,',
      '  "isIndianGovernmentScheme": true|false,',
      '  "confidence": 0.0,',
      '  "scheme": {',
      '    "id": "kebab-case-id",',
      '    "name": "",',
      '    "category": "",',
      '    "ministry": "",',
      '    "description": "",',
      '    "benefits": "",',
      '    "howToApply": "",',
      '    "documents": [""],',
      '    "eligibility": {"gender":"all|male|female|other","minAge":0,"maxAge":99,"maxIncome":0,"states":["all"]},',
      '    "applyLink": "https://...",',
      '    "tags": ["..."]',
      "  }",
      "}",
      "If not found or not Indian government scheme, set found=false.",
      "Local matched schemes:",
      JSON.stringify((localMatches || []).map(function (s) { return s.name; })),
      "User query: " + userQuery
    ].join("\n");

    var response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: discoveryPrompt }] }]
      })
    });

    if (!response.ok) return null;

    var result = await response.json();
    var text = result && result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text;
    var parsed = extractJsonObject(text || "");
    if (!parsed || !parsed.found || !parsed.isIndianGovernmentScheme || !parsed.scheme) return null;

    var confidence = Number(parsed.confidence || 0);
    if (!Number.isFinite(confidence) || confidence < 0.55) return null;

    var candidate = parsed.scheme;
    if (!candidate.name || !candidate.description) return null;

    var saved = addCustomScheme(candidate);
    if (!saved) return null;

    schemes = normalizeSchemes(mergeWithCustomSchemes(schemes));
    return saved;
  }

  async function askGemini(userQuery, localMatches) {
    var apiKey = String(SITE_GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return "AI service is temporarily unavailable. Please try again in a while.";
    }

    var contextRows = (localMatches || []).slice(0, 6).map(function (s) {
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        ministry: s.ministry,
        benefits: s.benefits,
        eligibility: s.eligibility,
        applyLink: s.applyLink
      };
    });

    var modelPrompt = [
      "You are SchemeConnect Assistant.",
      "Answer naturally like a friendly human assistant.",
      "Keep the response focused on Indian government schemes.",
      "If user asks unrelated questions, gently steer back to scheme guidance.",
      "Prefer the provided local scheme context over assumptions.",
      "Use practical steps and mention eligibility/documents where relevant.",
      "Do not sound robotic. Avoid rigid bullet-heavy output unless user asks for bullets.",
      "If uncertain, clearly ask user to verify on official portal.",
      "\nLocal matched schemes context:",
      JSON.stringify(contextRows),
      "\nUser query:",
      userQuery
    ].join("\n");

    var endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
    var response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: modelPrompt }] }]
      })
    });

    var result = await response.json();
    if (!response.ok) {
      var errMsg = result && result.error && result.error.message ? result.error.message : "Gemini request failed.";
      return "Google AI request failed: " + escapeHtml(errMsg);
    }

    var text = result && result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text;
    if (!text) {
      return "I could not generate a model response right now. Please try again.";
    }

    var formatted = formatModelText(text);
    if (localMatches && localMatches.length) {
      formatted += "<br><br><strong>Relevant schemes from SchemeConnect:</strong>" + renderSchemeCards(localMatches.slice(0, 3));
    }
    return formatted;
  }

  async function answerQuery(raw) {
    var localMatches = findTopMatches(raw, 4);
    var discovered = null;

    if (localMatches.length === 0 && hasGeminiKey()) {
      discovered = await discoverAndStoreUnknownScheme(raw, localMatches);
      if (discovered) {
        localMatches = [discovered];
      }
    }

    if (hasGeminiKey()) {
      var aiReply = await askGemini(raw, localMatches);
      if (!discovered) return aiReply;

      return [
        aiReply,
        "<br><br><strong>New scheme added to your site:</strong>",
        renderSchemeCards([discovered]),
        "This card is now available in Home and Schemes pages."
      ].join("");
    }

    if (localMatches.length) {
      return "I found relevant schemes from SchemeConnect:" + renderSchemeCards(localMatches);
    }

    return "I could not find this in local data right away. Ask with a little more detail and I will try to discover and add it automatically.";
  }

  async function sendMessage() {
    var raw = String($("#cinp").val() || "").trim();
    if (!raw) return;

    appendUser(raw);
    $("#cinp").val("").css("height", "auto");

    showTyping();
    try {
      var result = await answerQuery(raw);
      removeTyping();
      await appendBotWithCadence(result);
    } catch (error) {
      removeTyping();
      appendBot("I could not process that request right now. Please try again.");
    }
  }

  function wirePromptChips() {
    var box = $("#sb-chips");
    box.empty();

    QUICK_PROMPTS.forEach(function (q) {
      box.append('<div class="sq" data-q="' + escapeHtml(q) + '">' + escapeHtml(q) + "</div>");
    });

    $(document).on("click", ".sq", function () {
      $("#cinp").val(String($(this).data("q") || ""));
      sendMessage();
    });
  }

  function bindComposer() {
    $("#btn-send").on("click", sendMessage);
    $("#cinp").on("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    $("#cinp").on("input", function () {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 120) + "px";
    });
  }

  function loadSchemes() {
    return $.getJSON(SCHEME_DATA_PATH)
      .done(function (data) {
        schemes = normalizeSchemes(mergeWithCustomSchemes(data));
      })
      .fail(function () {
        schemes = normalizeSchemes(mergeWithCustomSchemes([]));
      });
  }

  function init() {
    wirePromptChips();
    bindComposer();

    appendBot(
      "Namaste! I am your <strong>SchemeConnect AI Assistant</strong>.<br>" +
      "Ask naturally about eligibility, benefits, documents, and application for any India scheme."
    );

    loadSchemes();

    document.addEventListener("schemeconnect:custom-schemes-updated", function () {
      loadSchemes();
    });

    window.addEventListener("storage", function (event) {
      if (event.key !== "schemeconnect:custom-schemes") return;
      loadSchemes();
    });

    if (hasGeminiKey()) {
      appendBot("Google AI is connected. I can discover missing India schemes and add them to your site automatically.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
