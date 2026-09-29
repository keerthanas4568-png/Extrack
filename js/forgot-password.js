(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {

    var form = document.getElementById("forgotPasswordForm");
    var emailInput = document.getElementById("forgotEmail");
    var emailError = document.getElementById("forgotEmailError");
    var button = document.getElementById("forgotPasswordBtn");
    var buttonLabel = button
      ? button.querySelector(".btn__label")
      : null;

    if (!form || !emailInput) return;

    form.addEventListener("submit", function (event) {

      event.preventDefault();

      var email = emailInput.value.trim();

      // Clear previous error
      emailInput.classList.remove("field--invalid");
      emailInput.removeAttribute("aria-invalid");

      if (emailError) {
        emailError.textContent = "";
      }

      // Validate email
      if (!email) {

        emailInput.classList.add("field--invalid");
        emailInput.setAttribute("aria-invalid", "true");

        if (emailError) {
          emailError.textContent = "Email address is required.";
        }

        return;
      }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {

        emailInput.classList.add("field--invalid");
        emailInput.setAttribute("aria-invalid", "true");

        if (emailError) {
          emailError.textContent = "Please enter a valid email address.";
        }

        return;
      }

      // Disable button while sending
      if (button) {
        button.disabled = true;
      }

      if (buttonLabel) {
        buttonLabel.textContent = "Sending...";
      }

      fetch("http://127.0.0.1:5000/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email
        })
      })

      .then(function (response) {
        return response.json().then(function (data) {
          return {
            ok: response.ok,
            data: data
          };
        });
      })

      .then(function (result) {

        if (!result.ok) {
          throw new Error(
            result.data.message || "Unable to process request."
          );
        }

        alert(
          result.data.message ||
          "If the email is registered, a reset link has been sent."
        );

        form.reset();
      })

      .catch(function (error) {

        console.error("Forgot password error:", error);

        alert(
          error.message ||
          "Something went wrong. Please try again."
        );
      })

      .finally(function () {

        if (button) {
          button.disabled = false;
        }

        if (buttonLabel) {
          buttonLabel.textContent = "Send Reset Link";
        }

      });

    });

  });

})();