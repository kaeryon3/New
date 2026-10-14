(function () {
  "use strict";

  var RATE = 160;      // dollars per hour
  var MINIMUM = 80;    // shop minimum
  var SESSION_MAX = 4; // hours per sitting before we split

  var FLASH = {
    dagger: { name: "Dagger", cm: 8, hours: 1, price: 140, style: "traditional", ink: "black" },
    moon: { name: "Moon & star", cm: 6, hours: 0.75, price: 110, style: "traditional", ink: "black" },
    eye: { name: "Weeping eye", cm: 9, hours: 1.5, price: 190, style: "blackwork", ink: "black" },
    heart: { name: "Mom heart", cm: 10, hours: 2, price: 260, style: "traditional", ink: "color" },
    bolt: { name: "Bolt", cm: 5, hours: 0.5, price: 80, style: "traditional", ink: "black" }
  };

  var STYLE = {
    fine: { label: "Fine line", factor: 0.9 },
    traditional: { label: "American traditional", factor: 1 },
    blackwork: { label: "Blackwork / dotwork", factor: 1.2 },
    realism: { label: "Realism", factor: 1.6 },
    lettering: { label: "Lettering only", factor: 0.7 }
  };

  var PLACEMENT = {
    forearm: { label: "Forearm", factor: 1 },
    upperarm: { label: "Upper arm", factor: 1 },
    calf: { label: "Calf", factor: 1 },
    thigh: { label: "Thigh", factor: 1.05 },
    back: { label: "Back", factor: 1.1 },
    chest: { label: "Chest", factor: 1.15 },
    ribs: { label: "Ribs", factor: 1.25 },
    hand: { label: "Hand or fingers", factor: 1.15 },
    neck: { label: "Neck", factor: 1.2 }
  };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }

  /* ---------- Walk-in status ---------- */

  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WALKIN_DAYS = [4, 5, 6]; // Thu, Fri, Sat
  var WALKIN_OPEN = 12;
  var WALKIN_CLOSE = 18;

  function walkinStatus(now) {
    var day = now.getDay();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isWalkinDay = WALKIN_DAYS.indexOf(day) !== -1;

    if (isWalkinDay && hour >= WALKIN_OPEN && hour < WALKIN_CLOSE) {
      return { open: true, text: "Walk-ins open now until 6 pm" };
    }
    if (isWalkinDay && hour < WALKIN_OPEN) {
      return { open: false, text: "Walk-ins open today from 12 to 6 pm" };
    }
    for (var i = 1; i <= 7; i++) {
      var next = (day + i) % 7;
      if (WALKIN_DAYS.indexOf(next) !== -1) {
        var when = i === 1 ? "tomorrow" : DAY_NAMES[next];
        return { open: false, text: "No walk-ins right now. Next: " + when + ", 12 to 6 pm" };
      }
    }
    return { open: false, text: "Walk-ins Thursday to Saturday, 12 to 6 pm" };
  }

  function renderWalkin() {
    var el = $("walkin");
    var status = walkinStatus(new Date());
    el.classList.toggle("is-open", status.open);
    $("walkin-text").textContent = status.text;
  }

  /* ---------- Hero: stencil underneath, ink traced on top ---------- */

  function setupHeroArt() {
    var figure = $("hero-art");
    var ink = $("hero-ink");
    if (!figure || !ink) return;

    var stencil = ink.cloneNode(true);
    stencil.removeAttribute("id");
    stencil.setAttribute("class", "stencil");
    stencil.setAttribute("aria-hidden", "true");
    ink.parentNode.insertBefore(stencil, ink);

    var parts = ink.querySelectorAll(".draw, .banner-text");
    var delay = 0.15;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].classList.contains("draw")) parts[i].setAttribute("pathLength", "1");
      parts[i].style.setProperty("--delay", delay.toFixed(2) + "s");
      delay += 0.16;
    }
    if (!reduceMotion) figure.classList.add("is-drawing");
  }

  /* ---------- Estimator ---------- */

  var form = $("book-form");
  var fields = {
    design: $("design"),
    style: $("style"),
    placement: $("placement"),
    size: $("size"),
    sizeOut: $("size-out"),
    inkBlack: $("ink-black"),
    inkColor: $("ink-color")
  };

  function baseHours(cm) {
    return 0.35 + cm * 0.09 + cm * cm * 0.004;
  }

  function roundHalf(h) {
    return Math.max(0.5, Math.round(h * 2) / 2);
  }

  function priceFor(hours) {
    return Math.max(MINIMUM, Math.round((hours * RATE) / 10) * 10);
  }

  function formatHours(h) {
    if (h < 1) return Math.round(h * 60) + " min";
    var n = Number.isInteger(h) ? String(h) : h.toFixed(1);
    return n + (h === 1 ? " hr" : " hrs");
  }

  function formatRange(lo, hi, fmt) {
    if (lo === hi) return fmt(lo);
    var a = fmt(lo), b = fmt(hi);
    var unitA = a.split(" ")[1], unitB = b.split(" ")[1];
    // "1.5–2.5 hrs" when the units match, "30 min–1 hr" when they don't
    return (unitA === unitB || (unitA === "hr" && unitB === "hrs")) ? a.split(" ")[0] + "–" + b : a + "–" + b;
  }

  function money(n) { return "$" + n.toLocaleString("en-US"); }

  function currentInk() { return fields.inkColor.checked ? "color" : "black"; }

  function estimate() {
    var flash = FLASH[fields.design.value];
    if (flash) {
      return {
        flash: flash,
        time: formatHours(flash.hours),
        price: money(flash.price),
        note: "Flat flash price. The $50 deposit comes off the total."
      };
    }

    var cm = Number(fields.size.value);
    var hours = baseHours(cm) *
      STYLE[fields.style.value].factor *
      PLACEMENT[fields.placement.value].factor *
      (currentInk() === "color" ? 1.3 : 1);

    var lo = roundHalf(hours * 0.85);
    var hi = roundHalf(hours * 1.2);
    var pLo = priceFor(lo);
    var pHi = priceFor(hi);
    var sessions = Math.ceil(hi / SESSION_MAX);

    var note = sessions > 1
      ? "Split over about " + sessions + " sessions of up to " + SESSION_MAX + " hours. "
      : "One session. ";
    note += "Based on $" + RATE + "/hr and the size, style, ink and placement you chose.";

    return {
      flash: null,
      time: formatRange(lo, hi, formatHours),
      price: pLo === pHi ? money(pLo) : money(pLo) + "–" + money(pHi),
      note: note
    };
  }

  function syncFlashLock() {
    var flash = FLASH[fields.design.value];
    var locked = Boolean(flash);
    if (flash) {
      fields.style.value = flash.style;
      fields.size.value = flash.cm;
      fields.inkBlack.checked = flash.ink === "black";
      fields.inkColor.checked = flash.ink === "color";
    }
    fields.style.disabled = locked;
    fields.size.disabled = locked;
    fields.inkBlack.disabled = locked;
    fields.inkColor.disabled = locked;
    $("flash-note").hidden = !locked;
  }

  function renderEstimate() {
    fields.sizeOut.textContent = fields.size.value + " cm";
    var est = estimate();
    $("est-time").textContent = est.time;
    $("est-price").textContent = est.price;
    $("est-note").textContent = est.note;
  }

  function setupEstimator() {
    if (!form) return;
    fields.design.addEventListener("change", function () {
      syncFlashLock();
      renderEstimate();
    });
    ["style", "placement", "size"].forEach(function (key) {
      fields[key].addEventListener("input", renderEstimate);
      fields[key].addEventListener("change", renderEstimate);
    });
    fields.inkBlack.addEventListener("change", renderEstimate);
    fields.inkColor.addEventListener("change", renderEstimate);
    syncFlashLock();
    renderEstimate();
  }

  /* ---------- Claim flash from the wall ---------- */

  function setupClaims() {
    var buttons = document.querySelectorAll(".claim[data-flash]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        var key = event.currentTarget.getAttribute("data-flash");
        fields.design.value = key;
        syncFlashLock();
        renderEstimate();
        $("book").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        $("name").focus({ preventScroll: true });
      });
    }
  }

  /* ---------- Request summary ---------- */

  function checkField(input, errorId, valid) {
    input.setAttribute("aria-invalid", valid ? "false" : "true");
    $(errorId).hidden = valid;
    if (valid) input.removeAttribute("aria-describedby");
    else input.setAttribute("aria-describedby", errorId);
    return valid;
  }

  function buildRequest() {
    var data = new FormData(form);
    var flash = FLASH[fields.design.value];
    var est = estimate();
    var days = data.getAll("days");
    var idea = String(data.get("idea") || "").trim();
    var lines = [
      "Booking request: Ninth Needle Tattoo",
      "",
      "Name:       " + String(data.get("name")).trim(),
      "Email:      " + String(data.get("email")).trim(),
      "Artist:     " + data.get("artist"),
      "Design:     " + (flash ? "Flash, " + flash.name : "Custom piece"),
      "Style:      " + STYLE[fields.style.value].label,
      "Placement:  " + PLACEMENT[fields.placement.value].label,
      "Size:       " + fields.size.value + " cm",
      "Ink:        " + (currentInk() === "color" ? "Full colour" : "Black & grey"),
      "Days:       " + (days.length ? days.join(", ") : "Any"),
      "Estimate:   " + est.time + ", " + est.price
    ];
    if (idea) lines.push("", "Idea:", idea);
    return lines.join("\n");
  }

  function setupForm() {
    if (!form) return;
    var name = $("name");
    var email = $("email");
    var out = $("request-out");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var okName = checkField(name, "name-error", name.value.trim().length > 0);
      var okEmail = checkField(email, "email-error", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
      if (!okName) { name.focus(); return; }
      if (!okEmail) { email.focus(); return; }

      $("request-text").textContent = buildRequest();
      $("request-status").textContent = "Your request is ready. Copy it and email it to us.";
      out.hidden = false;
      out.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    });

    [name, email].forEach(function (input) {
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
          var valid = input === name
            ? input.value.trim().length > 0
            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
          checkField(input, input.id + "-error", valid);
        }
      });
    });

    $("copy-request").addEventListener("click", function () {
      var pre = $("request-text");
      var status = $("request-status");
      function selectText() {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        status.textContent = "Copying isn't available here. The request is selected, so press Ctrl+C or ⌘C.";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          status.textContent = "Copied. Paste it into an email to bookings@ninthneedle.example.";
        }, selectText);
      } else {
        selectText();
      }
    });
  }

  renderWalkin();
  setupHeroArt();
  setupEstimator();
  setupClaims();
  setupForm();
})();
