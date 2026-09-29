document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("resetPasswordForm");

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const newPasswordError =
        document.getElementById("newPasswordError");

    const confirmPasswordError =
        document.getElementById("confirmPasswordError");

    const resetMessage =
        document.getElementById("resetMessage");

    const resetButton =
        document.getElementById("resetPasswordBtn");


    // =========================================
    // Get token from URL
    // =========================================

    const params = new URLSearchParams(
        window.location.search
    );

    const token = params.get("token");


    // =========================================
    // Check token
    // =========================================

    if (!token) {

        resetMessage.textContent =
            "Invalid or missing password reset link.";

        resetMessage.style.color =
            "var(--color-danger)";

        resetButton.disabled = true;

        return;
    }


    // =========================================
    // Reset Password
    // =========================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();


        // Clear old errors

        newPasswordError.textContent = "";
        confirmPasswordError.textContent = "";
        resetMessage.textContent = "";


        const password =
            newPassword.value.trim();

        const confirmPasswordValue =
            confirmPassword.value.trim();


        // =====================================
        // Validate password
        // =====================================

        if (!password) {

            newPasswordError.textContent =
                "Please enter a new password.";

            return;
        }


        if (password.length < 6) {

            newPasswordError.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        // =====================================
        // Confirm password
        // =====================================

        if (!confirmPasswordValue) {

            confirmPasswordError.textContent =
                "Please confirm your password.";

            return;
        }


        if (password !== confirmPasswordValue) {

            confirmPasswordError.textContent =
                "Passwords do not match.";

            return;
        }


        // =====================================
        // Disable button
        // =====================================

        resetButton.disabled = true;

        resetButton.textContent =
            "Resetting...";


        try {

            const response = await fetch(
                "http://127.0.0.1:5000/reset-password",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        token: token,
                        new_password: password
                    })
                }
            );


            const data = await response.json();


            // =====================================
            // Backend error
            // =====================================

            if (!response.ok) {

                resetMessage.textContent =
                    data.message ||
                    "Unable to reset password.";

                resetMessage.style.color =
                    "var(--color-danger)";

                resetButton.disabled = false;

                resetButton.textContent =
                    "Reset Password";

                return;
            }


            // =====================================
            // Success
            // =====================================

            resetMessage.textContent =
                data.message ||
                "Password reset successfully!";

            resetMessage.style.color =
                "green";


            resetButton.disabled = true;


            // Redirect to login

            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 2000);


        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );

            resetMessage.textContent =
                "Unable to connect to the server.";

            resetMessage.style.color =
                "var(--color-danger)";

            resetButton.disabled = false;

            resetButton.textContent =
                "Reset Password";
        }

    });


    // =========================================
    // Password visibility toggle
    // =========================================

    document
        .querySelectorAll(".password-toggle")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.getAttribute("data-target");

                    const input =
                        document.getElementById(targetId);

                    const eye =
                        button.querySelector(".icon-eye");

                    const eyeOff =
                        button.querySelector(".icon-eye-off");


                    if (input.type === "password") {

                        input.type = "text";

                        eye.style.display = "none";

                        eyeOff.style.display = "inline";

                        button.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    } else {

                        input.type = "password";

                        eye.style.display = "inline";

                        eyeOff.style.display = "none";

                        button.setAttribute(
                            "aria-label",
                            "Show password"
                        );
                    }

                }
            );

        });


    // =========================================
    // Hide eye-off icon initially
    // =========================================

    document
        .querySelectorAll(".icon-eye-off")
        .forEach(function (icon) {

            icon.style.display = "none";

        });

});
