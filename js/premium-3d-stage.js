/**
 * Premium Live 3D Animation Engine v3
 * Theme-mapped 3D animations:
 * - Leaf: Mint Glass + Forest Green
 * - Ocean: Ocean Blue + Aurora Pop
 * - Fire: Sunset Glow
 */

(function () {
  "use strict";

  function getActiveTheme() {
    // Sunset Glow -> fire
    if (document.body.classList.contains("theme-sunset") || document.body.classList.contains("theme-sunset-glow")) return "fire";

    // Ocean Blue + Aurora Pop -> ocean
    if (document.body.classList.contains("theme-ocean") || document.body.classList.contains("theme-ocean-blue")) return "ocean";
    if (document.body.classList.contains("theme-aurora") || document.body.classList.contains("theme-aurora-pop")) return "ocean";

    // Forest Green + Mint Glass -> leaf
    if (document.body.classList.contains("theme-forest") || document.body.classList.contains("theme-forest-green")) return "leaf";
    if (document.body.classList.contains("theme-mint") || document.body.classList.contains("theme-mint-glass")) return "leaf";

    // Default (mint)
    return "leaf";
  }

  function isDarkMode() {
    return document.body.classList.contains("dark-mode");
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

  const THEME_PALETTES = {
    leaf: {
      light: {
        primary: [34, 197, 94],
        secondary: [22, 163, 74],
        accent: [5, 150, 105],
        branch: [86, 180, 90],
        glow: [187, 247, 208]
      },
      dark: {
        primary: [52, 211, 153],
        secondary: [16, 185, 129],
        accent: [34, 197, 94],
        branch: [34, 211, 238],
        glow: [110, 231, 183]
      }
    },
    ocean: {
      light: {
        primary: [14, 165, 233],
        secondary: [37, 99, 235],
        accent: [6, 182, 212],
        wave: [59, 130, 246],
        glow: [191, 219, 254]
      },
      dark: {
        primary: [56, 189, 248],
        secondary: [96, 165, 250],
        accent: [34, 211, 238],
        wave: [30, 58, 138],
        glow: [125, 211, 252]
      }
    },
    fire: {
      light: {
        primary: [249, 115, 22],
        secondary: [239, 68, 68],
        accent: [245, 158, 11],
        ember: [250, 204, 21],
        glow: [254, 243, 199]
      },
      dark: {
        primary: [251, 146, 60],
        secondary: [244, 63, 94],
        accent: [251, 113, 133],
        ember: [250, 204, 21],
        glow: [254, 226, 92]
      }
    }
  };

  const ANIMATION_PROFILES = {
    leaf: {
      density: 70,
      particleSize: [0.9, 3.1],
      glowIntensity: 0.24,
      bloomRadius: 3.6,
      windStrength: 0.18,
      flutterFreq: 0.00082,
      rotationSpeed: 155,
      linkRange: 0.09
    },
    ocean: {
      density: 74,
      particleSize: [0.8, 2.9],
      glowIntensity: 0.28,
      bloomRadius: 4.2,
      waveAmplitude: 0.23,
      waveFreq: 0.00058,
      drift: 0.06,
      buoyancy: 0.036,
      linkRange: 0.15
    },
    fire: {
      density: 64,
      particleSize: [0.7, 2.6],
      glowIntensity: 0.36,
      bloomRadius: 4.8,
      riseSpeed: 0.09,
      flickerFreq: 0.00115,
      turbulence: 0.24,
      linkRange: 0.07
    }
  };

  function initPremium3D() {
    if (prefersReducedMotion() || !window.HTMLCanvasElement) return;
    if (document.body.classList.contains("animations-off")) return;

    const initialTheme = getActiveTheme();
    const initialDark = isDarkMode();

    const stage = document.createElement("div");
    stage.className = "fx-premium-stage";
    stage.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    canvas.className = "fx-premium-canvas";
    stage.appendChild(canvas);

    document.body.prepend(stage);
    document.body.classList.add("fx-premium-3d");

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let raf = 0;
    let lastRender = performance.now();
    let globalTime = 0;
    let scrollProgress = 0;

    const pointer = { x: 0, y: 0 };

    let currentTheme = initialTheme;
    let currentDark = initialDark;
    let currentProfile = ANIMATION_PROFILES[currentTheme];
    let currentPalette = JSON.parse(JSON.stringify(THEME_PALETTES[currentTheme][currentDark ? "dark" : "light"]));
    let targetPalette = JSON.parse(JSON.stringify(currentPalette));

    function lerp(a, b, t) {
      return a + (b - a) * Math.max(0, Math.min(1, t));
    }

    function rgb(arr, alpha) {
      return "rgba(" + Math.round(arr[0]) + "," + Math.round(arr[1]) + "," + Math.round(arr[2]) + "," + alpha.toFixed(4) + ")";
    }

    function makeParticle(i, total) {
      const p = {
        x: (Math.random() * 2 - 1) * 1.6,
        y: (Math.random() * 2 - 1) * 1.4,
        z: 0.2 + Math.random() * 1.8,
        vx: (Math.random() * 2 - 1) * 0.06,
        vy: (Math.random() * 2 - 1) * 0.06,
        r: currentProfile.particleSize[0] + Math.random() * (currentProfile.particleSize[1] - currentProfile.particleSize[0]),
        phase: Math.random() * Math.PI * 2,
        seed: (i / Math.max(total, 1)) * Math.PI * 2,
        age: 0,
        maxAge: 3200 + Math.random() * 2800,
        rotation: Math.random() * 360,
        heat: 1,
        wavePhase: Math.random() * Math.PI * 2
      };

      if (currentTheme === "leaf") {
        p.y = -1.25 - Math.random() * 0.35;
        p.vx = (Math.random() - 0.5) * currentProfile.windStrength;
        p.vy = 0.08 + Math.random() * 0.12;
      } else if (currentTheme === "ocean") {
        p.y = (Math.random() - 0.5) * 1.5;
        p.vx = (Math.random() - 0.5) * currentProfile.drift;
        p.vy = (Math.random() - 0.5) * 0.04;
      } else {
        p.y = 1.15 + Math.random() * 0.25;
        p.vx = (Math.random() - 0.5) * currentProfile.turbulence;
        p.vy = -(currentProfile.riseSpeed + Math.random() * 0.08);
      }

      return p;
    }

    function rebuildParticles() {
      const areaScale = Math.max(0.6, Math.min(1.45, (width * height) / 900000));
      const mobileFactor = window.matchMedia("(max-width: 860px)").matches ? 0.72 : 1;
      const total = Math.max(36, Math.round(currentProfile.density * areaScale * mobileFactor));
      points = Array.from({ length: total }, function (_, i) {
        return makeParticle(i, total);
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildParticles();
    }

    function updateScrollDynamics() {
      const doc = document.documentElement;
      const y = window.scrollY || window.pageYOffset || 0;
      const max = Math.max((doc ? doc.scrollHeight : 0) - window.innerHeight, 1);
      scrollProgress = Math.max(0, Math.min(1, y / max));

      const depthShift = scrollProgress * 18;
      const depthScale = 1 + scrollProgress * 0.015;
      canvas.style.transform = "translate3d(0," + (-depthShift).toFixed(2) + "px,0) scale(" + depthScale.toFixed(3) + ")";

      const baseOpacity = currentDark ? 0.78 : 0.82;
      canvas.style.opacity = (baseOpacity + scrollProgress * 0.08).toFixed(3);
    }

    function syncTheme() {
      const nextTheme = getActiveTheme();
      const nextDark = isDarkMode();
      const changed = nextTheme !== currentTheme || nextDark !== currentDark;

      if (!changed) return;

      currentTheme = nextTheme;
      currentDark = nextDark;
      currentProfile = ANIMATION_PROFILES[currentTheme];
      targetPalette = JSON.parse(JSON.stringify(THEME_PALETTES[currentTheme][currentDark ? "dark" : "light"]));
      rebuildParticles();
      updateScrollDynamics();
    }

    function blendPalette() {
      const keys = Object.keys(targetPalette);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!currentPalette[key]) {
          currentPalette[key] = targetPalette[key].slice();
          continue;
        }
        for (let c = 0; c < 3; c++) {
          currentPalette[key][c] = lerp(currentPalette[key][c], targetPalette[key][c], 0.08);
        }
      }
    }

    function renderThemeAccent(t) {
      const accentBoost = 1 + scrollProgress * 0.24;

      if (currentTheme === "leaf") {
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = rgb(currentPalette.branch || currentPalette.secondary, 0.11 * accentBoost);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const startY = height * 0.2 + i * height * 0.3;
          ctx.moveTo(-width * 0.1, startY);
          for (let x = 0; x <= width; x += 78) {
            const wave = Math.sin((x / width) * Math.PI + t * 0.00045 + i) * (34 + scrollProgress * 14);
            ctx.lineTo(x, startY + wave);
          }
          ctx.stroke();
        }
      } else if (currentTheme === "ocean") {
        ctx.lineWidth = 1.3;
        for (let w = 0; w < 3; w++) {
          const phase = t * 0.0005 + w * 0.45;
          const baseY = height * (0.24 + w * 0.2);
          ctx.strokeStyle = rgb(currentPalette.wave || currentPalette.secondary, (0.15 + w * 0.03) * accentBoost);
          ctx.beginPath();
          for (let x = 0; x <= width; x += 16) {
            const y = baseY + Math.sin((x / width) * Math.PI * 2 + phase) * (26 + scrollProgress * 16);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = rgb(currentPalette.ember || currentPalette.accent, 0.09 * accentBoost);
        for (let i = 0; i < 20; i++) {
          const x = (i / 20 * width + t * 0.08) % width;
          const y = height * (0.7 + Math.sin(t * 0.0012 + i) * 0.22);
          const size = 46 + Math.sin(t * 0.0022 + i * 0.8) * (24 + scrollProgress * 12);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame(ts) {
      const delta = Math.min(48, ts - lastRender);
      lastRender = ts;
      globalTime += delta;

      syncTheme();
      blendPalette();

      ctx.clearRect(0, 0, width, height);
      renderThemeAccent(globalTime);

      const dt = delta * 0.0046 * (1 + scrollProgress * 0.32);
      const projected = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.age += delta;
        if (p.age > p.maxAge) {
          Object.assign(p, makeParticle(i, points.length));
        }

        if (currentTheme === "leaf") {
          p.y += p.vy * dt;
          p.x += (p.vx + Math.sin(p.phase + globalTime * currentProfile.flutterFreq) * 0.09) * dt;
          p.rotation = (p.rotation + currentProfile.rotationSpeed * delta * 0.0012) % 360;
          p.vx += Math.sin(globalTime * 0.0002 + p.seed) * currentProfile.windStrength * 0.0035;
          p.vx *= 0.998;
        } else if (currentTheme === "ocean") {
          p.wavePhase = (p.wavePhase + delta * 0.00022) % (Math.PI * 2);
          p.y += (p.vy + Math.sin(p.wavePhase + globalTime * currentProfile.waveFreq) * (currentProfile.waveAmplitude * 1.8)) * dt;
          p.x += p.vx * dt + Math.cos(p.wavePhase) * 0.008;
          p.vy += currentProfile.buoyancy * Math.sin(globalTime * 0.001 + p.seed) * 0.03;
          p.vy *= 0.998;
        } else {
          p.y += p.vy * dt;
          p.x += (p.vx + Math.sin(p.phase + globalTime * currentProfile.flickerFreq) * (currentProfile.turbulence * 1.6)) * dt;
          p.heat -= delta * 0.00042;
          p.vy *= 0.999;
        }

        if (Math.abs(p.x) > 1.7) p.x *= -1;
        if (currentTheme === "leaf" && p.y > 1.65) {
          p.y = -1.25;
          p.x = (Math.random() * 2 - 1) * 1.6;
        } else if (currentTheme === "fire" && p.y < -1.65) {
          p.y = 1.25;
          p.x = (Math.random() * 2 - 1) * 1.4;
          p.heat = 1;
        } else if (Math.abs(p.y) > 1.65) {
          p.y *= -1;
        }
        if (p.z < -0.3 || p.z > 2.1) p.z = 0.2 + Math.random() * 1.8;

        const persp = 1.3 + p.z * 0.85;
        const sx = width * (0.5 + p.x * 0.32 / persp) + pointer.x * (18 + p.z * 12);
        const sy = height * (0.5 + p.y * 0.32 / persp) + pointer.y * (14 + p.z * 8);
        const sr = p.r * (0.32 + 1.3 / persp);

        projected.push({ sx: sx, sy: sy, z: p.z, sr: sr, p: p });

        let color = currentPalette.primary;
        if (p.z > 0.92) color = currentPalette.accent;
        else if (p.z > 0.55) color = currentPalette.secondary;

        if (currentTheme === "fire") {
          if (p.heat > 0.7) color = currentPalette.primary;
          else if (p.heat > 0.4) color = currentPalette.ember || currentPalette.accent;
          else color = currentPalette.secondary;
        }

        const alphaBase = currentProfile.glowIntensity - p.z * 0.1 + scrollProgress * 0.06;
        const bloomRadius = sr * currentProfile.bloomRadius;

        const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomRadius);
        bloom.addColorStop(0, rgb(color, alphaBase + 0.2));
        bloom.addColorStop(0.35, rgb(color, alphaBase * 0.6));
        bloom.addColorStop(1, rgb(color, 0));
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(sx, sy, bloomRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = rgb(color, Math.min(0.84, alphaBase + 0.15));
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.7, sr), 0, Math.PI * 2);
        ctx.fill();

        if (currentTheme === "leaf") {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = rgb(color, alphaBase * 0.8);
          ctx.beginPath();
          ctx.ellipse(0, 0, sr * 1.35, sr * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (currentProfile.linkRange > 0.01) {
        const linkDist = 110 * currentProfile.linkRange / 0.18;
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i];
          for (let j = i + 1; j < projected.length; j++) {
            const b = projected[j];
            const dx = a.sx - b.sx;
            const dy = a.sy - b.sy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > linkDist) continue;

            const linkAlpha = (1 - d / linkDist) * currentProfile.linkRange;
            let linkColor = a.z > b.z ? currentPalette.secondary : currentPalette.accent;
            if (currentTheme === "fire") linkColor = currentPalette.ember || currentPalette.accent;

            ctx.strokeStyle = rgb(linkColor, linkAlpha);
            ctx.lineWidth = 0.65 + Math.sin(globalTime * 0.002 + i + j) * 0.2;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      raf = window.requestAnimationFrame(frame);
    }

    document.addEventListener("pointermove", function (e) {
      const nx = (e.clientX / Math.max(1, width)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, height)) * 2 - 1;
      pointer.x = lerp(pointer.x, nx, 0.14);
      pointer.y = lerp(pointer.y, ny, 0.14);
    }, { passive: true });

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateScrollDynamics, { passive: true });

    const classObserver = new MutationObserver(function () {
      syncTheme();
    });
    classObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastRender = performance.now();
        raf = window.requestAnimationFrame(frame);
      }
    });

    resize();
    updateScrollDynamics();
    raf = window.requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPremium3D);
  } else {
    initPremium3D();
  }
})();
