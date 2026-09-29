window.BASE_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // Two-Factor Authentication
    // =========================================

    const enable2fa = document.getElementById("enable2fa");
    const twoFactorSetup = document.getElementById("twoFactorSetup");
    const twoFactorQRCode = document.getElementById("twoFactorQRCode");
    const twoFactorSecret = document.getElementById("twoFactorSecret");
    const verify2FA = document.getElementById("verify2FA");
    const twoFactorCode = document.getElementById("twoFactorCode");
    const twoFactorMessage = document.getElementById("twoFactorMessage");


    // =========================================
    // Enable 2FA
    // =========================================

    if (enable2fa) {

        enable2fa.addEventListener("click", async function () {

            const token = localStorage.getItem("access_token");

            if (!token) {
                alert("Please login first.");
                return;
            }

            try {

                const response = await fetch(
                    `${window.BASE_URL}/2fa/setup`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to start 2FA setup."
                    );

                    return;
                }


                // Show 2FA setup section
                if (twoFactorSetup) {
                    twoFactorSetup.style.display = "block";
                }


                // Show secret
                if (twoFactorSecret) {
                    twoFactorSecret.textContent = data.secret;
                }


                // Clear old QR code
                if (twoFactorQRCode) {
                    twoFactorQRCode.innerHTML = "";
                }


                // Generate QR code
                if (
                    twoFactorQRCode &&
                    typeof QRCode !== "undefined"
                ) {

                    new QRCode(twoFactorQRCode, {
                        text: data.qr_code_url,
                        width: 200,
                        height: 200
                    });

                } else {

                    alert(
                        "QR Code library is not loaded."
                    );
                }


            } catch (error) {

                console.error(
                    "2FA setup error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }

        });

    }


    // =========================================
    // Verify 2FA Code
    // =========================================

    if (verify2FA) {

        verify2FA.addEventListener("click", async function () {

            const token = localStorage.getItem("access_token");

            if (!token) {
                alert("Please login first.");
                return;
            }


            const code = twoFactorCode
                ? twoFactorCode.value.trim()
                : "";


            // Check code
            if (!/^\d{6}$/.test(code)) {

                if (twoFactorMessage) {

                    twoFactorMessage.textContent =
                        "Please enter a valid 6-digit code.";
                }

                return;
            }


            try {

                const response = await fetch(
                    `${window.BASE_URL}/2fa/verify`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            code: code
                        })
                    }
                );


                const data = await response.json();


                if (!response.ok) {

                    if (twoFactorMessage) {

                        twoFactorMessage.textContent =
                            data.message ||
                            "Invalid verification code.";
                    }

                    return;
                }


                // Success
                if (twoFactorMessage) {

                    twoFactorMessage.textContent =
                        "Two-Factor Authentication enabled successfully!";
                }


                // Disable setup button
                if (enable2fa) {

                    enable2fa.disabled = true;

                    enable2fa.textContent =
                        "2FA Enabled ✓";
                }


                // Hide setup section
                setTimeout(function () {

                    if (twoFactorSetup) {

                        twoFactorSetup.style.display =
                            "none";
                    }

                }, 2000);


            } catch (error) {

                console.error(
                    "2FA verification error:",
                    error
                );

                if (twoFactorMessage) {

                    twoFactorMessage.textContent =
                        "Unable to connect to the server.";
                }

            }

        });

    }


    // =========================================
    // Manage Devices
    // =========================================

    const manageDevicesButton =
        document.getElementById("manageDevices");


    if (manageDevicesButton) {

        manageDevicesButton.addEventListener(
            "click",
            async function () {

                const token =
                    localStorage.getItem("access_token");


                if (!token) {

                    alert("Please login first.");

                    return;
                }


                try {

                    // ---------------------------------
                    // Get Devices
                    // ---------------------------------

                    const response = await fetch(
                        `${window.BASE_URL}/devices`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        alert(
                            data.message ||
                            "Failed to load devices."
                        );

                        return;
                    }


                    console.log(
                        "Devices:",
                        data.devices
                    );


                    if (
                        !data.devices ||
                        data.devices.length === 0
                    ) {

                        alert(
                            "No active devices found."
                        );

                        return;
                    }


                    // =================================
                    // Create Modal Overlay
                    // =================================

                    const overlay =
                        document.createElement("div");

                    overlay.className = "devices-overlay";

                    overlay.style.position = "fixed";
                    overlay.style.top = "0";
                    overlay.style.left = "0";
                    overlay.style.width = "100vw";
                    overlay.style.height = "100vh";
                    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
                    overlay.style.display = "flex";
                    overlay.style.justifyContent = "center";
                    overlay.style.alignItems = "center";
                    overlay.style.zIndex = "999999";


                    // =================================
                    // Create Modal
                    // =================================

                    const modal =
                        document.createElement("div");

                    modal.className = "devices-modal";

modal.style.backgroundColor = "white";
modal.style.color = "black";
modal.style.width = "600px";
modal.style.maxWidth = "90%";
modal.style.maxHeight = "80vh";
modal.style.padding = "25px";
modal.style.borderRadius = "15px";
modal.style.overflowY = "auto";
modal.style.boxShadow = "0 10px 40px rgba(0,0,0,0.4)";


                    modal.innerHTML = `

                        <div class="devices-header">

                            <h2>
                                Manage Devices
                            </h2>

                            <button
                                class="devices-close"
                                type="button">
                                &times;
                            </button>

                        </div>

                        <div class="devices-list"></div>

                    `;


                    overlay.appendChild(modal);

                    document.body.appendChild(
                        overlay
                    );
                    


                    // =================================
                    // Devices List
                    // =================================

                    const devicesList =
                        modal.querySelector(
                            ".devices-list"
                        );


                    // =================================
                    // Display Each Device
                    // =================================

                    data.devices.forEach(
                        function (device) {

                            const card =
                                document.createElement(
                                    "div"
                                );

                            card.className =
                                "device-card";


                            const currentDevice =
                                device.is_current;


                            // Current device label
                            const currentLabel =
                                currentDevice
                                    ? `
                                        <div
                                            class="current-device">
                                            🟢 This device
                                        </div>
                                      `
                                    : "";


                            // Logout button
                            const logoutButton =
                                currentDevice
                                    ? ""
                                    : `
                                        <button
                                            type="button"
                                            class="logout-device"
                                            data-session-id="${device.id}">
                                            Log Out
                                        </button>
                                      `;


                            card.innerHTML = `

                                <div class="device-icon">
                                    💻
                                </div>

                                <div class="device-info">

                                    <h3>
                                        ${device.device_name}
                                    </h3>

                                    <p>
                                        Browser:
                                        ${device.browser}
                                    </p>

                                    <p>
                                        IP:
                                        ${device.ip_address}
                                    </p>

                                    <p>
                                        Last Active:
                                        ${new Date(
                                            device.last_active
                                        ).toLocaleString()}
                                    </p>

                                    ${currentLabel}

                                    ${logoutButton}

                                </div>

                            `;


                            devicesList.appendChild(
                                card
                            );

                        }
                    );


                    // =================================
                    // Close Button
                    // =================================

                    const closeButton =
                        modal.querySelector(
                            ".devices-close"
                        );


                    closeButton.addEventListener(
                        "click",
                        function () {

                            overlay.remove();

                        }
                    );


                    // =================================
                    // Close When Clicking Outside
                    // =================================

                    overlay.addEventListener(
                        "click",
                        function (event) {

                            if (
                                event.target === overlay
                            ) {

                                overlay.remove();

                            }

                        }
                    );


                    // =================================
                    // Logout Other Device
                    // =================================

                    const logoutButtons =
                        modal.querySelectorAll(
                            ".logout-device"
                        );


                    logoutButtons.forEach(
                        function (button) {

                            button.addEventListener(
                                "click",
                                async function () {

                                    const sessionId =
                                        button.dataset.sessionId;


                                    // Confirmation
                                    const confirmed =
                                        confirm(
                                            "Are you sure you want to log out this device?"
                                        );


                                    if (!confirmed) {
                                        return;
                                    }


                                    try {

                                        // ---------------------------------
                                        // Revoke Device
                                        // ---------------------------------

                                        const revokeResponse =
                                            await fetch(
                                                `${window.BASE_URL}/devices/${sessionId}`,
                                                {
                                                    method: "DELETE",

                                                    headers: {
                                                        "Authorization":
                                                            `Bearer ${token}`
                                                    }
                                                }
                                            );


                                        const revokeData =
                                            await revokeResponse.json();


                                        if (
                                            !revokeResponse.ok
                                        ) {

                                            alert(
                                                revokeData.message ||
                                                "Unable to log out device."
                                            );

                                            return;
                                        }


                                        // Success
                                        alert(
                                            "Device logged out successfully!"
                                        );


                                        // Close current modal
                                        overlay.remove();


                                        // Reload device list
                                        manageDevicesButton.click();

                                    } catch (error) {

                                        console.error(
                                            "Logout device error:",
                                            error
                                        );


                                        alert(
                                            "Unable to connect to the server."
                                        );

                                    }

                                }
                            );

                        }
                    );


                } catch (error) {

                    console.error(
                        "Manage Devices Error:",
                        error
                    );


                    alert(
                        "Unable to connect to the server."
                    );

                }

            }
        );

    }
// =========================================
// Login Activity
// =========================================

const viewLoginActivity =
    document.getElementById("viewLoginActivity");

const loginActivityContainer =
    document.getElementById("loginActivityContainer");

if (viewLoginActivity && loginActivityContainer) {

    viewLoginActivity.addEventListener("click", async function () {

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please login first.");
            return;
        }

        loginActivityContainer.innerHTML =
            "<p>Loading login activity...</p>";

        try {
            const response = await fetch(
                `${window.BASE_URL}/login-activity`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                loginActivityContainer.innerHTML =
                    `<p>${data.message || "Unable to load activity."}</p>`;
                return;
            }

            if (!data.activities || data.activities.length === 0) {
                loginActivityContainer.innerHTML =
                    "<p>No login activity found.</p>";
                return;
            }

            loginActivityContainer.innerHTML = `
                <div class="activity-container">
                    <h2>Recent Login Activity</h2>
                    <div id="activityList"></div>
                </div>
            `;

            const activityList =
                document.getElementById("activityList");

            data.activities.forEach(activity => {

                const card = document.createElement("div");
                card.className = "activity-card";

                const isSuccess =
                    activity.activity_type === "SUCCESS";

                const statusClass = isSuccess
                    ? "activity-success"
                    : "activity-failed";

                const date = new Date(
                    activity.created_at
                ).toLocaleString();

                card.innerHTML = `
                    <div>
                        <h3 class="${statusClass}">
                            ${isSuccess ? "🟢 Successful Login" : "🔴 " + activity.activity_type}
                        </h3>
                        <p>${activity.device_name} • ${activity.browser}</p>
                        <p>IP: ${activity.ip_address || "Unknown"}</p>
                    </div>
                    <div>
                        <p>${date}</p>
                    </div>
                `;

                activityList.appendChild(card);
            });

        } catch (error) {
            console.error("Login Activity Error:", error);
            loginActivityContainer.innerHTML =
                "<p>Unable to connect to the server.</p>";
        }
    });
}

});