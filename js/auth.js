/* ============================================================
   auth.js — login page behavior
   - Show / hide password toggle
   - Client-side validation (via Validators)
   - Loading spinner inside the Login button
   - Demo success state (no backend, no fetch)
   ============================================================ */
   window.BASE_URL = "http://127.0.0.1:5000";
   console.log("BASE_URL:", window.BASE_URL); 

   (function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    setupPasswordToggle();
    setupLoginForm();
    setupRegisterForm();
    setFooterYear();
  });

  /* ---------- Show / hide password (works for any .password-toggle) ---------- */
  function setupPasswordToggle() {
    var toggles = document.querySelectorAll(".password-toggle");
    toggles.forEach(function (toggle) {
      var wrap = toggle.closest(".input-wrap");
      var input = wrap ? wrap.querySelector(".field__input") : null;
      if (!input) return;

      toggle.addEventListener("click", function () {
        var isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        toggle.setAttribute("aria-pressed", String(isPassword));
        toggle.setAttribute(
          "aria-label",
          isPassword ? "Hide password" : "Show password"
        );
        toggle.classList.toggle("is-visible", isPassword);
      });
    });
  }

  /* ---------- Login form handling ---------- */
function setupLoginForm() {

    var form = document.getElementById("loginForm");
    if (!form) return;

    var emailInput = document.getElementById("email");
    var passwordInput = document.getElementById("password");

    var emailError = document.getElementById("emailError");
    var passwordError = document.getElementById("passwordError");

    var submitBtn = document.getElementById("loginBtn");

    var twoFactorField =
        document.getElementById("twoFactorField");

    var twoFactorCode =
        document.getElementById("twoFactorCode");

    var twoFactorError =
        document.getElementById("twoFactorError");


    // =========================================
    // Clear errors while typing
    // =========================================

    emailInput.addEventListener("input", function () {

        clearError(emailInput, emailError);

    });


    passwordInput.addEventListener("input", function () {

        clearError(passwordInput, passwordError);

    });


    if (twoFactorCode) {

        twoFactorCode.addEventListener("input", function () {

            twoFactorCode.value =
                twoFactorCode.value.replace(/\D/g, "");

            if (twoFactorError) {
                twoFactorError.textContent = "";
            }

        });

    }


    // =========================================
    // Login
    // =========================================

    form.addEventListener("submit", function (e) {

        e.preventDefault();


        var emailResult =
            window.Validators.validateEmail(
                emailInput.value
            );

        var passwordResult =
            window.Validators.validatePassword(
                passwordInput.value
            );


        var ok = true;


        // Email validation

        if (!emailResult.valid) {

            showError(
                emailInput,
                emailError,
                emailResult.message
            );

            ok = false;

        } else {

            clearError(
                emailInput,
                emailError
            );

        }


        // Password validation

        if (!passwordResult.valid) {

            showError(
                passwordInput,
                passwordError,
                passwordResult.message
            );

            ok = false;

        } else {

            clearError(
                passwordInput,
                passwordError
            );

        }


        if (!ok) {

            (
                emailResult.valid
                    ? passwordInput
                    : emailInput
            ).focus();

            return;
        }


        // =========================================
        // Get 2FA code if available
        // =========================================

        var code = twoFactorCode
            ? twoFactorCode.value.trim()
            : "";


        // =========================================
        // Validate 2FA code if field is visible
        // =========================================

        if (
            twoFactorField &&
            twoFactorField.style.display !== "none"
        ) {

            if (!/^\d{6}$/.test(code)) {

                if (twoFactorError) {

                    twoFactorError.textContent =
                        "Please enter the 6-digit authentication code.";

                }

                twoFactorCode.focus();

                return;
            }

        }


        // =========================================
        // Loading
        // =========================================

        setLoading(
            submitBtn,
            true
        );


        // =========================================
        // Login API
        // =========================================

        fetch(
            `${window.BASE_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email:
                        emailInput.value.trim(),

                    password:
                        passwordInput.value,

                    two_factor_code:
                        code || null

                })

            }
        )

        .then(function (response) {

            return response.json();

        })

        .then(function (data) {

            setLoading(
                submitBtn,
                false
            );


            // =====================================
            // 2FA REQUIRED
            // =====================================

            if (
                data.status === "2fa_required" &&
                data.requires_2fa
            ) {

                if (twoFactorField) {

                    twoFactorField.style.display =
                        "block";

                }


                if (twoFactorError) {

                    twoFactorError.textContent =
                        "Enter the 6-digit code from your authenticator app.";

                }


                twoFactorCode.focus();

                return;
            }


            // =====================================
            // LOGIN SUCCESS
            // =====================================

            if (data.status === "success") {

                localStorage.setItem(
                    "access_token",
                    data.access_token
                );

                localStorage.setItem(
                    "user_id",
                    data.user_id
                );

                localStorage.setItem(
                    "username",
                    data.username
                );

                localStorage.setItem(
                    "email",
                    data.email
                );


                alert("Login Successful!");

                window.location.href =
                    "dashboard.html";

                return;
            }


            // =====================================
            // ERROR
            // =====================================

            alert(
                data.message ||
                "Login failed."
            );

        })

        .catch(function (error) {

            setLoading(
                submitBtn,
                false
            );

            console.error(
                "Login error:",
                error
            );

            alert(
                "Unable to connect to server."
            );

        });

    });

}

function setupRegisterForm() {

    console.log("setupRegisterForm loaded");

    const form = document.getElementById("registerForm");
    if (!form) return;

    const submitBtn = document.getElementById("registerBtn");

    form.addEventListener("submit", function (e) {

        console.log("Register button clicked");

        e.preventDefault();

        setLoading(submitBtn, true);

        fetch(`${window.BASE_URL}/register`, {
            
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                username: document.getElementById("username").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value

            })

        })

        .then(response => response.json())

        .then(data => {

            setLoading(submitBtn, false);
         if (data.status === "success") {

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("username", data.username);
    localStorage.setItem("email", data.email);

    alert("Registration Successful!");

    window.location.href = "dashboard.html";

} else {

    alert(data.message);

}   


        })

        .catch(error => {

            setLoading(submitBtn, false);

            console.error(error);

            alert("Unable to connect to server.");

        });

    });

}
function showError(input, errorElement, message) {

    if (!input || !errorElement) return;

    input.classList.add("field--invalid");
    input.setAttribute("aria-invalid", "true");

    errorElement.textContent = message;

}

function clearError(input, errorElement) {

    if (!input || !errorElement) return;

    input.classList.remove("field--invalid");
    input.removeAttribute("aria-invalid");

    errorElement.textContent = "";

}
function setLoading(btn, loading) {

    if (!btn) return;

    btn.disabled = loading;

    if (loading) {
        btn.classList.add("btn--loading");
    } else {
        btn.classList.remove("btn--loading");
    }

}
function setFooterYear() {
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }
}
})();