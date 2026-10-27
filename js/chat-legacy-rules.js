(function () {
  function safeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function findByKeyword(schemes, keyword) {
    var q = String(keyword || "").toLowerCase();
    return (Array.isArray(schemes) ? schemes : []).filter(function (s) {
      var name = String(s.name || "").toLowerCase();
      var category = String(s.category || "").toLowerCase();
      return name.indexOf(q) >= 0 || category.indexOf(q) >= 0;
    }).slice(0, 3);
  }

  function renderQuickList(title, list) {
    if (!list.length) return "";
    var rows = list.map(function (s) {
      return "• <strong>" + safeText(s.name || "Scheme") + "</strong> - " + safeText(s.benefits || s.benefit || "Benefit details available");
    }).join("<br>");
    return title + "<br>" + rows;
  }

  function reply(raw, schemes) {
    var q = String(raw || "").toLowerCase();
    if (!q) return null;

    if (q.indexOf("hello") >= 0 || q.indexOf("hi") >= 0 || q.indexOf("namaste") >= 0) {
      return "Namaste! Ask me about eligibility, benefits, documents, or application steps for any government scheme.";
    }

    if (q.indexOf("farmer") >= 0 || q.indexOf("kisan") >= 0 || q.indexOf("agri") >= 0) {
      var farmer = findByKeyword(schemes, "farm");
      return renderQuickList("Top farmer schemes:", farmer) || "I can help with PM-KISAN, crop insurance, KCC, and other farmer schemes.";
    }

    if (q.indexOf("student") >= 0 || q.indexOf("scholarship") >= 0 || q.indexOf("education") >= 0) {
      var student = findByKeyword(schemes, "student");
      return renderQuickList("Top student schemes:", student) || "Tell me your class/college level and state, and I will suggest scholarships.";
    }

    if (q.indexOf("women") >= 0 || q.indexOf("girl") >= 0 || q.indexOf("female") >= 0) {
      var women = findByKeyword(schemes, "women");
      return renderQuickList("Top women-focused schemes:", women) || "I can suggest schemes for women entrepreneurs, girl child, and self-help groups.";
    }

    if (q.indexOf("document") >= 0 || q.indexOf("documents") >= 0) {
      return "Documents usually needed: Aadhaar, bank passbook/details, income certificate, domicile certificate, and category certificate (if applicable). Use <code>/documents scheme-name</code> for exact list.";
    }

    if (q.indexOf("apply") >= 0 || q.indexOf("registration") >= 0) {
      return "Application flow: 1) check eligibility 2) gather documents 3) apply on official portal 4) submit and track status. Use <code>/apply scheme-name</code> for direct official links.";
    }

    return null;
  }

  window.SchemeConnectLegacyChat = {
    prompts: [
      "What is PM-KISAN scheme?",
      "Who is eligible for MUDRA loan?",
      "How to apply for PM Awas Yojana?",
      "Scholarships for students?",
      "Schemes for women entrepreneurs?",
      "Documents needed for Jan Dhan?"
    ],
    reply: reply
  };
})();
