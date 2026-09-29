document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // PREFERENCES
    // =========================================================

    const prefDark = document.getElementById("prefDark");
    const prefEmail = document.getElementById("prefEmail");
    const prefSms = document.getElementById("prefSms");
    const prefReports = document.getElementById("prefReports");
    const prefAlerts = document.getElementById("prefAlerts");

    const preferenceDefaults = {
        darkMode: false,
        emailNotifications: true,
        smsNotifications: false,
        monthlyReports: true,
        budgetAlerts: true
    };


    // ---------------------------------------------------------
    // Load saved preferences
    // ---------------------------------------------------------

    function loadPreferences() {

        const saved = JSON.parse(
            localStorage.getItem("expenseTrackerPreferences")
        ) || preferenceDefaults;


        if (prefDark) {
            prefDark.checked = saved.darkMode;
        }

        if (prefEmail) {
            prefEmail.checked = saved.emailNotifications;
        }

        if (prefSms) {
            prefSms.checked = saved.smsNotifications;
        }

        if (prefReports) {
            prefReports.checked = saved.monthlyReports;
        }

        if (prefAlerts) {
            prefAlerts.checked = saved.budgetAlerts;
        }


        // Sync dark mode with the existing theme button
        syncDarkMode(saved.darkMode);
    }


    // ---------------------------------------------------------
    // Save preferences
    // ---------------------------------------------------------

    function savePreferences() {

        const preferences = {

            darkMode: prefDark
                ? prefDark.checked
                : false,

            emailNotifications: prefEmail
                ? prefEmail.checked
                : true,

            smsNotifications: prefSms
                ? prefSms.checked
                : false,

            monthlyReports: prefReports
                ? prefReports.checked
                : true,

            budgetAlerts: prefAlerts
                ? prefAlerts.checked
                : true
        };


        localStorage.setItem(
            "expenseTrackerPreferences",
            JSON.stringify(preferences)
        );
    }


    // ---------------------------------------------------------
    // Dark mode
    // ---------------------------------------------------------

    function syncDarkMode(enabled) {

        const themeToggle =
            document.getElementById("themeToggle");

        if (!themeToggle) {
            return;
        }


        const currentState =
            themeToggle.getAttribute("aria-pressed") === "true";


        if (enabled !== currentState) {
            themeToggle.click();
        }
    }


    // ---------------------------------------------------------
    // Preference change events
    // ---------------------------------------------------------

    if (prefDark) {

        prefDark.addEventListener("change", function () {

            syncDarkMode(prefDark.checked);

            savePreferences();

            addActivity(
                "Changed Preferences",
                "Updated dark mode setting",
                "primary"
            );

        });

    }


    if (prefEmail) {

        prefEmail.addEventListener("change", function () {

            savePreferences();

            addActivity(
                "Changed Preferences",
                "Updated email notification setting",
                "success"
            );

        });

    }


    if (prefSms) {

        prefSms.addEventListener("change", function () {

            savePreferences();

            addActivity(
                "Changed Preferences",
                "Updated SMS notification setting",
                "success"
            );

        });

    }


    if (prefReports) {

        prefReports.addEventListener("change", function () {

            savePreferences();

            addActivity(
                "Changed Preferences",
                "Updated monthly report setting",
                "success"
            );

        });

    }


    if (prefAlerts) {

        prefAlerts.addEventListener("change", function () {

            savePreferences();

            addActivity(
                "Changed Preferences",
                "Updated budget alert setting",
                "success"
            );

        });

    }


    // =========================================================
    // RECENT ACTIVITY
    // =========================================================

    const recentActivity =
        document.getElementById("recentActivity");


    // ---------------------------------------------------------
    // Get saved activity
    // ---------------------------------------------------------

    function getActivities() {

        return JSON.parse(
            localStorage.getItem("expenseTrackerActivities")
        ) || [];

    }


    // ---------------------------------------------------------
    // Save activity
    // ---------------------------------------------------------

    function saveActivities(activities) {

        localStorage.setItem(
            "expenseTrackerActivities",
            JSON.stringify(activities)
        );

    }


    // ---------------------------------------------------------
    // Add activity
    // ---------------------------------------------------------

    window.addActivity = function (
        title,
        description,
        type = "primary"
    ) {

        const activities = getActivities();


        activities.unshift({

            title: title,

            description: description,

            type: type,

            time: new Date().toISOString()

        });


        // Keep only latest 10 activities
        const limitedActivities =
            activities.slice(0, 10);


        saveActivities(limitedActivities);

        renderActivities();

    };


    // ---------------------------------------------------------
    // Format time
    // ---------------------------------------------------------

    function formatActivityTime(dateString) {

        const date =
            new Date(dateString);

        const now =
            new Date();


        const difference =
            now - date;


        const minutes =
            Math.floor(difference / 60000);


        const hours =
            Math.floor(difference / 3600000);


        const days =
            Math.floor(difference / 86400000);


        if (minutes < 1) {
            return "Just now";
        }


        if (minutes < 60) {
            return minutes + " min ago";
        }


        if (hours < 24) {
            return hours + " hr ago";
        }


        if (days === 1) {
            return "Yesterday";
        }


        if (days < 7) {
            return days + " days ago";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }


    // ---------------------------------------------------------
    // Render activities
    // ---------------------------------------------------------

    function renderActivities() {

        if (!recentActivity) {
            return;
        }


        const activities =
            getActivities();


        if (activities.length === 0) {

            recentActivity.innerHTML = `
                <li class="timeline__item">

                    <span
                        class="timeline__dot timeline__dot--primary"
                        aria-hidden="true">
                    </span>

                    <div class="timeline__body">

                        <p class="timeline__title">
                            No recent activity
                        </p>

                        <p class="timeline__text">
                            Your recent account activity will appear here.
                        </p>

                    </div>

                    <span class="timeline__time">
                        -
                    </span>

                </li>
            `;

            return;
        }


        recentActivity.innerHTML =
            activities.map(function (activity) {

                return `
                    <li class="timeline__item">

                        <span
                            class="timeline__dot timeline__dot--${activity.type}"
                            aria-hidden="true">
                        </span>

                        <div class="timeline__body">

                            <p class="timeline__title">
                                ${escapeHTML(activity.title)}
                            </p>

                            <p class="timeline__text">
                                ${escapeHTML(activity.description)}
                            </p>

                        </div>

                        <span class="timeline__time">
                            ${formatActivityTime(activity.time)}
                        </span>

                    </li>
                `;

            }).join("");

    }


    // ---------------------------------------------------------
    // Prevent HTML injection in activity text
    // ---------------------------------------------------------

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // Load everything
    loadPreferences();

    renderActivities();


    // ---------------------------------------------------------
    // Add profile page opened activity
    // ---------------------------------------------------------

    const activities = getActivities();

    const alreadyAdded =
        activities.length > 0 &&
        activities[0].title === "Opened Profile";

    if (!alreadyAdded) {

        addActivity(
            "Opened Profile",
            "Viewed your profile",
            "primary"
        );

    }

});