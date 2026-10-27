(function () {
  var STORAGE_KEY = "schemeconnect:custom-schemes";

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeEligibility(raw) {
    var input = raw && typeof raw === "object" ? raw : {};
    return {
      gender: String(input.gender || "all").toLowerCase(),
      minAge: Number.isFinite(Number(input.minAge)) ? Number(input.minAge) : 0,
      maxAge: Number.isFinite(Number(input.maxAge)) ? Number(input.maxAge) : 99,
      maxIncome: Number.isFinite(Number(input.maxIncome)) ? Number(input.maxIncome) : 999999999,
      states: Array.isArray(input.states) && input.states.length ? input.states.map(function (s) { return String(s).toLowerCase(); }) : ["all"]
    };
  }

  function normalizeScheme(input) {
    var raw = input && typeof input === "object" ? input : {};
    var name = String(raw.name || "").trim();
    if (!name) return null;

    var id = String(raw.id || "").trim();
    if (!id) {
      id = slugify(name);
    }

    return {
      id: id,
      name: name,
      category: String(raw.category || "General").trim() || "General",
      ministry: String(raw.ministry || "Government of India").trim(),
      description: String(raw.description || "Details available on official portal.").trim(),
      benefits: String(raw.benefits || raw.benefit || "Benefit details available").trim(),
      howToApply: String(raw.howToApply || "Use official portal to apply.").trim(),
      documents: Array.isArray(raw.documents) ? raw.documents.slice(0, 8).map(function (d) { return String(d).trim(); }).filter(Boolean) : [],
      eligibility: normalizeEligibility(raw.eligibility),
      applyLink: String(raw.applyLink || "").trim(),
      tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 12).map(function (t) { return String(t).trim(); }).filter(Boolean) : [],
      featured: Boolean(raw.featured),
      source: "community"
    };
  }

  function readAll() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeScheme).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    var safeList = (Array.isArray(list) ? list : []).map(normalizeScheme).filter(Boolean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeList));
    document.dispatchEvent(new CustomEvent("schemeconnect:custom-schemes-updated", { detail: safeList.slice() }));
  }

  function addOne(input) {
    var next = normalizeScheme(input);
    if (!next) return null;

    var list = readAll();
    var key = String(next.id || next.name).toLowerCase();
    var exists = list.some(function (item) {
      var itemKey = String(item.id || item.name).toLowerCase();
      return itemKey === key || String(item.name || "").toLowerCase() === String(next.name || "").toLowerCase();
    });

    if (exists) {
      return list.find(function (item) {
        var itemKey = String(item.id || item.name).toLowerCase();
        return itemKey === key || String(item.name || "").toLowerCase() === String(next.name || "").toLowerCase();
      }) || next;
    }

    list.unshift(next);
    list = list.slice(0, 120);
    writeAll(list);
    return next;
  }

  function mergeWith(baseList) {
    var base = Array.isArray(baseList) ? baseList : [];
    var custom = readAll();
    var map = new Map();

    base.forEach(function (item) {
      var normalized = normalizeScheme(item);
      if (!normalized) return;
      map.set(String(normalized.id || normalized.name).toLowerCase(), normalized);
    });

    custom.forEach(function (item) {
      var key = String(item.id || item.name).toLowerCase();
      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
  }

  window.SchemeConnectCustomSchemes = {
    key: STORAGE_KEY,
    normalizeScheme: normalizeScheme,
    readAll: readAll,
    writeAll: writeAll,
    addOne: addOne,
    mergeWith: mergeWith
  };
})();
