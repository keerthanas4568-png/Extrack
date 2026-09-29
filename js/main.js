/* ============================================================
   main.js — Smart Expense Tracker landing page interactions
   ============================================================ */
(function () {
  "use strict";
  function loadGlobalProfilePhoto() {

    var token = localStorage.getItem("access_token");

    if (!token) return;

    fetch("http://127.0.0.1:5000/me", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        var user = data.user || data;

        if (!user) return;

        var names = document.querySelectorAll(".profile__name");

names.forEach(function (nameElement) {
    nameElement.textContent =
        user.username ||
        user.full_name ||
        "User";
});

        var avatars = document.querySelectorAll(".profile__avatar");

        avatars.forEach(function(avatar) {

            if (user.profile_image) {

                avatar.style.backgroundImage =
                    "url('" + user.profile_image + "')";

                avatar.style.backgroundSize = "cover";
                avatar.style.backgroundPosition = "center";
                avatar.style.backgroundRepeat = "no-repeat";

                avatar.textContent = "";

            } else {

                var name =
                    user.full_name ||
                    user.username ||
                    "User";

                var initials = name
                    .split(" ")
                    .map(function(word) {
                        return word.charAt(0);
                    })
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                avatar.style.backgroundImage = "";
                avatar.textContent = initials;
            }
        });
    })
    .catch(function(error) {
        console.error(
            "Global profile photo error:",
            error
        );
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupNavbarScroll();
    setupRevealOnScroll();
    setupStatCounters();
    setupActiveNav();
    setupBackToTop();
    setFooterYear();
    loadGlobalProfilePhoto();
  });

  /* ---------- Mobile menu toggle ---------- */
  function setupMobileMenu() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------- Navbar shadow on scroll ---------- */
  function setupNavbarScroll() {
    var navbar = document.getElementById("navbar");
    if (!navbar) return;

    var onScroll = function () {
      navbar.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Reveal elements on scroll ---------- */
  function setupRevealOnScroll() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Animated stat counters ---------- */
  function setupStatCounters() {
    var stats = document.querySelectorAll(".stat__value[data-count]");
    if (!stats.length) return;

    var format = function (n) {
      return Math.round(n).toLocaleString("en-IN");
    };

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var decimals = target % 1 !== 0 ? 1 : 0;
      var duration = 1600;
      var start = null;

      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = target * eased;

        el.textContent =
          prefix +
          (decimals ? value.toFixed(decimals) : format(value)) +
          suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent =
            prefix + (decimals ? target.toFixed(decimals) : format(target)) + suffix;
        }
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      stats.forEach(run);
      return;
    }

    var obs = new IntersectionObserver(
      function (entries, o) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            o.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    stats.forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ---------- Active nav link based on section in view ---------- */
  function setupActiveNav() {
    var links = document.querySelectorAll(".nav__link");
    if (!links.length) return;

    var sections = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href");
      if (id && id.startsWith("#") && id.length > 1) {
        var sec = document.querySelector(id);
        if (sec) sections[id] = link;
      }
    });

    if (!("IntersectionObserver" in window)) return;

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            links.forEach(function (l) {
              l.classList.remove("is-active");
            });
            var active = sections["#" + entry.target.id];
            if (active) active.classList.add("is-active");
          }
        });
      },
      { threshold: 0.4 }
    );

    Object.keys(sections).forEach(function (id) {
      var sec = document.querySelector(id);
      if (sec) obs.observe(sec);
    });
  }

  /* ---------- Back to top button ---------- */
  function setupBackToTop() {
    var btn = document.getElementById("toTop");
    if (!btn) return;

    var toggle = function () {
      var show = window.scrollY > 500;
      btn.hidden = !show;
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Footer year ---------- */
  function setFooterYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }
  /* ==========================
   Show Dashboard / Logout
   if user is already logged in
========================== */

document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("access_token");

    const actions = document.querySelector(".nav__actions");

    if (!actions) return;

    if (token) {

        actions.innerHTML = `
            <a class="btn btn--ghost" href="dashboard.html">Dashboard</a>
            <button class="btn btn--primary" id="logoutBtn">Logout</button>
        `;

        document.getElementById("logoutBtn").addEventListener("click", function () {

            localStorage.removeItem("access_token");

            window.location.href = "login.html";

        });

    }
    function loadGlobalProfilePhoto() {
    var token = localStorage.getItem("access_token");

    if (!token) return;

    fetch("http://127.0.0.1:5000/me", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        var user = data.user || data;

        if (!user) return;

        var avatars = document.querySelectorAll(
            ".profile__avatar"
        );

        avatars.forEach(function(avatar) {

            if (user.profile_image) {

                avatar.style.backgroundImage =
                    "url('" + user.profile_image + "')";

                avatar.style.backgroundSize = "cover";
                avatar.style.backgroundPosition = "center";
                avatar.style.backgroundRepeat = "no-repeat";

                avatar.textContent = "";

            } else {

                var name =
                    user.full_name ||
                    user.username ||
                    "User";

                var initials = name
                    .split(" ")
                    .map(function(word) {
                        return word.charAt(0);
                    })
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                avatar.style.backgroundImage = "";
                avatar.textContent = initials;
            }
        });
    })
    .catch(function(error) {
        console.error(
            "Global profile photo loading error:",
            error
        );
    });
}

});
})();