(function () {
  const USER_KEY = "schemeconnect:user";
  const form = document.getElementById("signin-form");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");
  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");
  const capsWarning = document.getElementById("caps-warning");
  const demoFill = document.getElementById("demo-fill");
  const googleSignin = document.getElementById("google-signin");
  const signinBtn = document.getElementById("signin-btn");
  const toast = document.getElementById("toast");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function buildUserProfile(source) {
    const emailValue = (email.value || "user@schemeconnect.in").trim().toLowerCase();
    const localPart = emailValue.split("@")[0] || "User";
    const first = localPart.charAt(0).toUpperCase();
    const second = localPart.length > 1 ? localPart.charAt(1).toUpperCase() : "";
    const initials = (first + second).trim() || "SC";
    return {
      email: emailValue,
      name: localPart.replace(/[._-]+/g, " ").replace(/\b\w/g, function (ch) { return ch.toUpperCase(); }),
      provider: source,
      avatar: {
        emoji: "🟢",
        color: "#1a7a4a",
        initials: initials,
        ring: "ring-green",
        image: ""
      }
    };
  }

  function persistUser(source) {
    const profile = buildUserProfile(source);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }

  function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score += 25;
    if (/[A-Z]/.test(value)) score += 20;
    if (/[a-z]/.test(value)) score += 20;
    if (/[0-9]/.test(value)) score += 20;
    if (/[^A-Za-z0-9]/.test(value)) score += 15;
    return Math.min(score, 100);
  }

  function updatePasswordStrength() {
    const score = scorePassword(password.value);
    strengthFill.style.width = score + "%";

    let label = "Weak";
    if (score >= 70) label = "Strong";
    else if (score >= 45) label = "Medium";

    strengthText.textContent = "Password strength: " + label;
  }

  togglePassword.addEventListener("click", function () {
    const isPassword = password.type === "password";
    password.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "Hide" : "Show";
  });

  password.addEventListener("input", updatePasswordStrength);
  password.addEventListener("keyup", function (event) {
    capsWarning.hidden = !event.getModifierState("CapsLock");
  });

  demoFill.addEventListener("click", function () {
    email.value = "demo@schemeconnect.in";
    password.value = "Scheme@2026";
    updatePasswordStrength();
    showToast("Demo credentials filled");
  });

  googleSignin.addEventListener("click", function () {
    if (!email.value.trim()) {
      email.value = "google.user@schemeconnect.in";
    }
    persistUser("google");
    showToast("Google sign-in successful");
    window.setTimeout(function () {
      window.location.href = "../index.html";
    }, 520);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    signinBtn.disabled = true;
    signinBtn.textContent = "Signing In...";

    window.setTimeout(function () {
      persistUser("email");
      signinBtn.disabled = false;
      signinBtn.textContent = "Sign In";
      showToast("Sign-in successful. Redirecting...");
      window.setTimeout(function () {
        window.location.href = "../index.html";
      }, 600);
    }, 900);
  });

})();
