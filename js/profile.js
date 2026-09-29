/* ============================================================
   profile.js — Profile & Account page interactions
   Sidebar drawer, password visibility toggles, client-side
   validation (via window.Validators), photo preview and
   preference switches. UI only — no backend / no fetch.
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    setupSidebar();
    setupTheme();
    setupPasswordToggles();
    setupPhoto();
    setupPersonalForm();
    setupSecurityForm();
    setupPreferences();
    loadCurrentUser();
  });

  /* ---------- Small helpers ---------- */
  function $(id) {
    return document.getElementById(id);
  }
  function V() {
    return window.Validators || {};
  }

  /* ---------- Sidebar drawer ---------- */
  function setupSidebar() {
    var toggle = $("sidebarToggle");
    var overlay = $("sidebarOverlay");
    var sidebar = $("sidebar");
    if (!toggle || !sidebar) return;

    function open() {
      document.body.classList.add("sidebar-open");
      toggle.setAttribute("aria-expanded", "true");
      if (overlay) overlay.hidden = false;
    }
    function close() {
      document.body.classList.remove("sidebar-open");
      toggle.setAttribute("aria-expanded", "false");
      if (overlay) overlay.hidden = true;
    }

    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("sidebar-open")) close();
      else open();
    });
    if (overlay) overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) close();
    });
  }

  /* ---------- Theme (shared with Dark Mode switch) ---------- */
  function setTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    var btn = $("themeToggle");
    if (btn) btn.setAttribute("aria-pressed", String(dark));
    var pref = $("prefDark");
    if (pref) pref.checked = dark;
  }

  function setupTheme() {
    var btn = $("themeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        setTheme(document.documentElement.getAttribute("data-theme") !== "dark");
      });
    }
    // Initialise from a stored/preference state (defaults to light).
    setTheme(document.documentElement.getAttribute("data-theme") === "dark");
  }

  /* ---------- Password show / hide ---------- */
  function setupPasswordToggles() {
    var toggles = document.querySelectorAll(".password-toggle");
    toggles.forEach(function (btn) {
      var input = btn.parentElement
        ? btn.parentElement.querySelector("input")
        : null;
      if (!input) return;
      btn.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.classList.toggle("is-visible", show);
        btn.setAttribute("aria-pressed", String(show));
      });
    });
  }

  /* ---------- Photo upload / remove (UI only, client preview) ---------- */
  function setupPhoto() {
  var upload = $("uploadPhoto");
  var remove = $("removePhoto");
  var file = $("photoFile");
  var avatar = $("profileAvatar");

  if (!avatar) return;

  var initials = avatar.getAttribute("data-initials") || "AK";

  // Upload button
  if (upload && file) {
    upload.addEventListener("click", function () {
      file.click();
    });
  }

  // File selected
  if (file) {
    file.addEventListener("change", async function (e) {
      var f = e.target.files && e.target.files[0];

      if (!f) return;

      if (f.type.indexOf("image") !== 0) {
        alert("Please select an image file.");
        file.value = "";
        return;
      }

      var reader = new FileReader();

      reader.onload = async function (ev) {
        var imageData = ev.target.result;

        // Show immediately
        avatar.style.backgroundImage = "url('" + imageData + "')";
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.textContent = "";

        try {
          var token = localStorage.getItem("access_token");

          var response = await fetch("http://127.0.0.1:5000/me/photo", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
              profile_image: imageData
            })
          });

          var data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Photo upload failed");
          }

          alert("Profile photo uploaded successfully!");

        } catch (error) {
          console.error("Photo upload error:", error);
          alert("Unable to upload profile photo.");
        }
      };

      reader.readAsDataURL(f);
    });
  }

  // Remove photo
  if (remove) {
    remove.addEventListener("click", async function () {

      try {
        var token = localStorage.getItem("access_token")

        var response = await fetch("http://127.0.0.1:5000/me/photo", {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer " + token
          }
        });

        var data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Photo removal failed");
        }

        // Reset avatar
        avatar.style.backgroundImage = "";
        avatar.textContent = initials;

        if (file) {
          file.value = "";
        }

        alert("Profile photo removed successfully!");

      } catch (error) {
        console.error("Photo removal error:", error);
        alert("Unable to remove profile photo.");
      }
    });
  }
}

  /* ---------- Personal information form ---------- */
  function setupPersonalForm() {
    var form = $("personalForm");
    if (!form) return;
    var v = V();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ok = check($("fullName"), v.validateFullName) && ok;
      ok = check($("username"), v.validateUsername) && ok;
      ok = check($("email"), v.validateEmail) && ok;
      ok = check($("phone"), v.validatePhone) && ok;
      if (!ok) return;

      var token = localStorage.getItem("access_token");

fetch("http://127.0.0.1:5000/me", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  },
  body: JSON.stringify({
    username: $("username").value,
    full_name: $("fullName").value,
    email: $("email").value,
    phone: $("phone").value,
    date_of_birth: $("dob").value,
    gender: $("gender").value
  })
})
.then(function(response) {
  return response.json();
})
.then(function(data) {

  console.log("Profile update:", data);

  if (data.status === "success") {

    var btn = $("saveProfile");

    if (btn) {
      var label = btn.textContent;
      btn.textContent = "Saved ✓";

      setTimeout(function() {
        btn.textContent = label;
      }, 1500);
    }

  } else {
    alert(data.message || "Failed to update profile");
  }

})
.catch(function(error) {
  console.error("Profile update error:", error);
});
    });

    var cancel = $("cancelProfile");
    if (cancel) {
      cancel.addEventListener("click", function () {
        form.reset();
        form.querySelectorAll(".field--invalid").forEach(function (f) {
          f.classList.remove("field--invalid");
        });
        form.querySelectorAll(".field__error").forEach(function (el) {
          el.textContent = "";
        });
      });
    }
  }


function showError(input, message) {
    if (!input) return;

    input.classList.add("field--invalid");
    input.setAttribute("aria-invalid", "true");

    var errorElement = input.parentElement
        ? input.parentElement.querySelector(".field__error")
        : null;

    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearError(input) {
    if (!input) return;

    input.classList.remove("field--invalid");
    input.removeAttribute("aria-invalid");

    var errorElement = input.parentElement
        ? input.parentElement.querySelector(".field__error")
        : null;

    if (errorElement) {
        errorElement.textContent = "";
    }
}
  /* ---------- Security / password form ---------- */
  function setupSecurityForm() {

    var form = $("securityForm");

    if (!form) return;

    var v = V();

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        var current = $("currentPassword");
        var next = $("newPassword");
        var confirm = $("confirmPassword");

        var ok = true;

        // Current password
        if (!current.value) {

            showError(
                current,
                "Current password is required."
            );

            ok = false;

        } else {

            clearError(current);
        }


        // New password
        if (!next.value) {

            showError(
                next,
                "New password is required."
            );

            ok = false;

        } else {

            var passwordResult =
                v.validatePassword(next.value);

            if (!passwordResult.valid) {

                showError(
                    next,
                    passwordResult.message
                );

                ok = false;

            } else {

                clearError(next);
            }
        }


        // Confirm password
        var confirmResult =
            v.validateConfirmPassword(
                next.value,
                confirm.value
            );

        if (!confirmResult.valid) {

            showError(
                confirm,
                confirmResult.message
            );

            ok = false;

        } else {

            clearError(confirm);
        }


        if (!ok) return;


        // Get JWT token
        var token =
            localStorage.getItem("access_token");

        if (!token) {

            alert("Please login again.");

            return;
        }


        var btn = $("updatePassword");

        if (btn) {
            btn.disabled = true;
            btn.textContent = "Updating...";
        }


        // Send password to Flask
        fetch("http://127.0.0.1:5000/me/password", {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({

                current_password: current.value,

                new_password: next.value

            })

        })

        .then(function(response) {

            return response.json()
                .then(function(data) {

                    return {
                        status: response.status,
                        data: data
                    };

                });

        })

        .then(function(result) {

            if (result.data.status === "success") {

                alert(
                    "Password updated successfully!"
                );

                form.reset();

            } else {

                alert(
                    result.data.message ||
                    "Unable to update password."
                );
            }

        })

        .catch(function(error) {

            console.error(
                "Password update error:",
                error
            );

            alert(
                "Unable to connect to server."
            );

        })

        .finally(function() {

            if (btn) {

                btn.disabled = false;

                btn.textContent =
                    "Update Password";
            }

        });

    });
}

  /* ---------- Preference switches ---------- */
  function setupPreferences() {
    var dark = $("prefDark");
    if (dark) {
      dark.addEventListener("change", function () {
        setTheme(dark.checked);
      });
    }
  }
  function loadProfileStatistics() {

    var token = localStorage.getItem("access_token");

    if (!token) {
        console.error("No access token found.");
        return;
    }

    fetch("http://127.0.0.1:5000/transactions", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("Profile transactions:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var totalTransactions = data.transactions.length;
        var totalIncome = 0;
        var totalExpenses = 0;

        data.transactions.forEach(function(transaction) {

            var amount =
                Number(transaction.amount || 0);

            if (transaction.transaction_type === "Income") {
                totalIncome += amount;
            }

            if (transaction.transaction_type === "Expense") {
                totalExpenses += amount;
            }

        });

        var savings =
            totalIncome - totalExpenses;


        const totalTransactionsElement =
    document.getElementById("profileTotalTransactions");

const totalIncomeElement =
    document.getElementById("profileTotalIncome");

const totalExpensesElement =
    document.getElementById("profileTotalExpenses");

const totalSavingsElement =
    document.getElementById("profileTotalSavings");


console.log("Profile elements:", {
    totalTransactionsElement,
    totalIncomeElement,
    totalExpensesElement,
    totalSavingsElement
});


if (totalTransactionsElement) {
    totalTransactionsElement.textContent =
        totalTransactions.toLocaleString("en-IN");
}

if (totalIncomeElement) {
    totalIncomeElement.textContent =
        "₹" + totalIncome.toLocaleString("en-IN");
}

if (totalExpensesElement) {
    totalExpensesElement.textContent =
        "₹" + totalExpenses.toLocaleString("en-IN");
}

if (totalSavingsElement) {
    totalSavingsElement.textContent =
        "₹" + savings.toLocaleString("en-IN");
}


        console.log("Profile statistics:", {
            totalTransactions: totalTransactions,
            totalIncome: totalIncome,
            totalExpenses: totalExpenses,
            savings: savings
        });

    })
    .catch(function(error) {

        console.error(
            "Profile statistics error:",
            error
        );

    });
}
loadProfileStatistics();

function loadCurrentUser() {

    var token = localStorage.getItem("access_token");

    if (!token) {
        console.error("No access token found.");
        return;
    }

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

        console.log("Current user:", data);

        var user = data.user || data;

if (!user || !user.id) {
    console.error("User information not found.", data);
    return;
}        
        // Account Information

     if ($("fullName")) {
    $("fullName").value = user.full_name || "";
}

var accountUserId = $("accountUserId");
var accountCreated = $("accountCreated");
var lastLogin = $("lastLogin");

if (accountUserId) {
  accountUserId.textContent =
    "ET-" + String(user.id).padStart(5, "0");
}

if (accountCreated) {
  if (user.created_at) {
    accountCreated.textContent = new Date(user.created_at)
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
  } else {
    accountCreated.textContent = "Not available";
  }
}

if (lastLogin) {
  if (user.last_login) {
    lastLogin.textContent = new Date(user.last_login)
      .toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
  } else {
    lastLogin.textContent = "Not available";
  }
}


        // Account Information
var userId = $("profileUserId");
var createdAt = $("profileCreatedAt");
var lastLogin = $("profileLastLogin");

if (userId) {
  userId.textContent = "ET-" + String(user.id).padStart(5, "0");
}

if (createdAt) {
  if (user.created_at) {
    createdAt.textContent = new Date(user.created_at).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  } else {
    createdAt.textContent = "Not available";
  }
}

if (lastLogin) {
  if (user.last_login) {
    lastLogin.textContent = new Date(user.last_login).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  } else {
    lastLogin.textContent = "Not available";
  }
}

        // Username
        var usernameInput =
            document.getElementById("username");

        if (usernameInput) {
            usernameInput.value =
                user.username || "";
        }

        // Email
        var emailInput =
            document.getElementById("email");

        if (emailInput) {
            emailInput.value =
                user.email || "";
        }

        // Phone
var phoneInput = document.getElementById("phone");

if (phoneInput) {
    phoneInput.value = user.phone || "";
}

// Date of Birth
var dobInput = document.getElementById("dob");

if (dobInput) {
    dobInput.value = user.date_of_birth || "";
}

// Gender
var genderInput = document.getElementById("gender");

if (genderInput) {
    genderInput.value = user.gender || "";
}

        // Profile name
        var profileName =
            document.querySelector(
                ".profile-card__name"
            );

        if (profileName) {
            profileName.textContent =
                user.username || "";
        }

        // Profile email
        var profileEmail =
            document.querySelector(
                ".profile-card__email"
            );

        if (profileEmail) {
            profileEmail.textContent =
                user.email || "";
        }

        // Top navigation name
        var navName =
            document.querySelector(
                ".profile__name"
            );

        if (navName) {
            navName.textContent =
                user.username || "";
        }

        // Avatar
      // Avatar
var avatar = document.getElementById("profileAvatar");

if (avatar) {

    // If saved profile photo exists
    if (user.profile_image) {

        avatar.style.backgroundImage =
            "url('" + user.profile_image + "')";

        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.style.backgroundRepeat = "no-repeat";

        avatar.textContent = "";

    } else {

        // No photo → show initials
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

        avatar.setAttribute(
            "data-initials",
            initials
        );
    }

    avatar.setAttribute(
        "aria-label",
        "Profile photo of " +
        (user.full_name ||
         user.username ||
         "User")
    );
}

        // Top navigation avatar
        var navAvatar =
            document.querySelector(
                ".profile__avatar"
            );

        if (navAvatar) {

            navAvatar.textContent =
                (user.username || "U")
                .charAt(0)
                .toUpperCase();
        }

    })
    .catch(function(error) {

        console.error(
            "Current user loading error:",
            error
        );
    }); 
  } 
function clearError(input) {
    if (!input) return;

    input.classList.remove("field--invalid");
    input.removeAttribute("aria-invalid");

    var errorElement = input.parentElement
        ? input.parentElement.querySelector(".field__error")
        : null;

    if (errorElement) {
        errorElement.textContent = "";
    }
}
})();