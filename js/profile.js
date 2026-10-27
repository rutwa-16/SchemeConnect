(function () {
  const USER_KEY = "schemeconnect:user";
  const profileRoot = document.getElementById("profile-content");
  const toast = document.getElementById("toast");
  const colors = ["#1a7a4a", "#2563eb", "#7c3aed", "#dc2626", "#0f766e", "#d97706"];
  const emojis = ["🟢", "✨", "🚀", "💎", "🔥", "🌟"];
  const rings = ["ring-green", "ring-blue", "ring-purple", "ring-gold"];

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function ensureAvatar(user) {
    if (!user.avatar || typeof user.avatar !== "object") {
      user.avatar = {};
    }
    if (!user.avatar.initials) user.avatar.initials = "SC";
    if (!user.avatar.color) user.avatar.color = "#1a7a4a";
    if (!user.avatar.emoji) user.avatar.emoji = "🟢";
    if (!user.avatar.ring) user.avatar.ring = "ring-green";
    if (!Object.prototype.hasOwnProperty.call(user.avatar, "image")) user.avatar.image = "";
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("Invalid image")); };
        img.src = String(reader.result || "");
      };
      reader.onerror = function () { reject(new Error("Unable to read file")); };
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

  function renderAvatarEditor(user, draft) {
    const swatches = colors.map(function (c) {
      return '<button type="button" class="swatch' + (c === draft.color ? ' active' : '') + '" data-color="' + c + '" style="background:' + c + '"></button>';
    }).join("");

    const emojiPicks = emojis.map(function (em) {
      return '<button type="button" class="emoji-pick' + (em === draft.emoji ? ' active' : '') + '" data-emoji="' + em + '">' + em + '</button>';
    }).join("");

    const ringPicks = rings.map(function (ring) {
      return '<button type="button" class="ring-pick ' + ring + (ring === draft.ring ? ' active' : '') + '" data-ring="' + ring + '"></button>';
    }).join("");

    return [
      '<div class="avatar-customize-card" style="margin-top:14px;">',
      '  <h4 style="margin:0 0 10px;">Edit Avatar</h4>',
      '  <div class="avatar-preview ' + draft.ring + '" style="background:' + draft.color + ';">',
      draft.image ? '    <span class="avatar-image" style="background-image:url(' + draft.image + ')"></span>' : '    <span class="avatar-initials-preview">' + draft.initials + '</span>',
      '    <span class="avatar-emoji">' + draft.emoji + '</span>',
      '  </div>',
      '  <input id="avatar-initials" class="avatar-input" maxlength="2" value="' + draft.initials + '" />',
      '  <input id="avatar-emoji-input" class="avatar-input" maxlength="4" value="' + draft.emoji + '" placeholder="Enter emoji for avatar badge" style="margin-top:8px;" />',
      '  <input id="avatar-upload" class="avatar-input" type="file" accept="image/*" style="margin-top:8px;" />',
      '  <div class="avatar-swatches">' + swatches + '</div>',
      '  <div class="avatar-rings">' + ringPicks + '</div>',
      '  <div class="avatar-emojis">' + emojiPicks + '</div>',
      '  <div class="avatar-customize-actions">',
      '    <button type="button" id="avatar-reset">Reset</button>',
      '    <button type="button" class="save" id="avatar-save">Save Avatar</button>',
      '  </div>',
      '</div>'
    ].join("");
  }

  function renderProfile() {
    const user = getUser();
    if (!user) {
      profileRoot.innerHTML = '<p class="sub">You are not signed in yet.</p><a class="signin-btn" href="signin.html" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;">Go to Sign In</a>';
      return;
    }

    ensureAvatar(user);
    const avatar = user.avatar;
    let draft = {
      initials: avatar.initials,
      color: avatar.color,
      emoji: avatar.emoji,
      ring: avatar.ring,
      image: avatar.image || ""
    };

    profileRoot.innerHTML = [
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">',
      '  <div class="avatar-trigger ' + (avatar.ring || "ring-green") + '" style="width:56px;height:56px;background:' + (avatar.color || "#1a7a4a") + ';color:#fff;">',
      (avatar.image
        ? '    <span class="avatar-image" style="background-image:url(' + avatar.image + ')"></span>'
        : '    <span class="avatar-text">' + (avatar.initials || "SC") + '</span>') +
      '    <span class="avatar-emoji">' + (avatar.emoji || "🟢") + '</span>',
      '  </div>',
      '  <div><strong style="display:block;">' + (user.name || "SchemeConnect User") + '</strong><small style="color:#64748b;">' + (user.email || "") + '</small></div>',
      '</div>',
      '<div class="action-row">',
      '  <a class="ghost-btn" href="../index.html" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;">Open Home</a>',
      '  <button id="edit-avatar-btn" class="ghost-btn" type="button">Edit Avatar</button>',
      '  <button id="logout-btn" class="signin-btn" type="button">Log Out</button>',
      '</div>',
      '<div id="avatar-editor" hidden></div>'
    ].join("");

    const logoutBtn = document.getElementById("logout-btn");
    const editAvatarBtn = document.getElementById("edit-avatar-btn");
    const avatarEditor = document.getElementById("avatar-editor");

    function normalizeInitials(value) {
      return String(value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    }

    function normalizeEmoji(value) {
      const chars = Array.from(String(value || "").trim());
      return chars.slice(0, 2).join("");
    }

    function refreshEditor() {
      avatarEditor.innerHTML = renderAvatarEditor(user, draft);
      avatarEditor.hidden = false;

      const initialsInput = document.getElementById("avatar-initials");
      const emojiInput = document.getElementById("avatar-emoji-input");
      const uploadInput = document.getElementById("avatar-upload");

      initialsInput.addEventListener("input", function () {
        const value = normalizeInitials(initialsInput.value);
        draft.initials = value;
        initialsInput.value = value;
        const preview = avatarEditor.querySelector(".avatar-initials-preview");
        if (preview) preview.textContent = draft.initials;
      });

      emojiInput.addEventListener("input", function () {
        const normalized = normalizeEmoji(emojiInput.value);
        draft.emoji = normalized || "🟢";
        emojiInput.value = normalized;
        const previewEmoji = avatarEditor.querySelector(".avatar-preview .avatar-emoji");
        if (previewEmoji) previewEmoji.textContent = draft.emoji;
      });

      uploadInput.addEventListener("change", async function () {
        const file = uploadInput.files && uploadInput.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          showToast("Please choose an image file");
          return;
        }
        try {
          draft.image = await processAvatarImage(file);
          refreshEditor();
          showToast("Avatar image optimized");
        } catch (e) {
          showToast("Could not process this image");
        }
      });

      Array.from(document.querySelectorAll(".swatch")).forEach(function (btn) {
        btn.addEventListener("click", function () {
          draft.color = btn.getAttribute("data-color") || draft.color;
          refreshEditor();
        });
      });

      Array.from(document.querySelectorAll(".emoji-pick")).forEach(function (btn) {
        btn.addEventListener("click", function () {
          draft.emoji = btn.getAttribute("data-emoji") || draft.emoji;
          refreshEditor();
        });
      });

      Array.from(document.querySelectorAll(".ring-pick")).forEach(function (btn) {
        btn.addEventListener("click", function () {
          draft.ring = btn.getAttribute("data-ring") || draft.ring;
          refreshEditor();
        });
      });

      document.getElementById("avatar-reset").addEventListener("click", function () {
        draft = { initials: "SC", color: "#1a7a4a", emoji: "🟢", ring: "ring-green", image: "" };
        refreshEditor();
      });

      document.getElementById("avatar-save").addEventListener("click", function () {
        user.avatar = {
          initials: draft.initials || "SC",
          color: draft.color,
          emoji: draft.emoji || "🟢",
          ring: draft.ring,
          image: draft.image || ""
        };
        setUser(user);
        showToast("Avatar saved");
        window.setTimeout(function () { window.location.reload(); }, 320);
      });
    }

    editAvatarBtn.addEventListener("click", function () {
      if (!avatarEditor.hidden) {
        avatarEditor.hidden = true;
        return;
      }
      refreshEditor();
    });

    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem(USER_KEY);
      showToast("Logged out");
      setTimeout(function () { window.location.href = "../index.html"; }, 480);
    });
  }

  renderProfile();
})();
