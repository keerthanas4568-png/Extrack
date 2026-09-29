/* ============================================================
   dashboard.js — dashboard interactions
   - Sidebar open/close (mobile + tablet)
   - Dark mode toggle (persisted)
   - Animate progress bars & bar chart from data attributes
   - Export button (placeholder feedback)
    Backend connected using Flask API.
   ============================================================ */
(function () {
  "use strict";

  alert("dashboard.js loaded");

  const BASE_URL = "http://127.0.0.1:5000";

  document.addEventListener("DOMContentLoaded", function () {

    setupSidebar();
    setupTheme();
    setupProgressBars();
    setupBarChart();
    setupExport();

    loadDashboard();

    
      setupSearch();
      setupFilter();
      
      drawExpenseChart();
      drawMonthlyChart();   // <-- Add this

});

  /* ---------- Sidebar (hamburger / overlay) ---------- */
  function setupSidebar() {
    var toggle = document.getElementById("sidebarToggle");
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    if (!toggle || !sidebar) return;

    function close() {
      document.body.classList.remove("sidebar-open");
      toggle.setAttribute("aria-expanded", "false");
      if (overlay) overlay.hidden = true;
    }

    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("sidebar-open");
      toggle.setAttribute("aria-expanded", String(open));
      if (overlay) overlay.hidden = !open;
    });

    if (overlay) overlay.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) {
        close();
      }
    });

    /* Close drawer after selecting a link on small screens. */
    sidebar.querySelectorAll(".nav-item").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 992px)").matches) close();
      });
    });
  }

  /* ---------- Dark mode ---------- */
  function setupTheme() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;

    var stored = null;
    try {
      stored = localStorage.getItem("et-theme");
    } catch (e) {}

    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      btn.setAttribute("aria-pressed", "true");
    }

    btn.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        btn.setAttribute("aria-pressed", "false");
        try { localStorage.setItem("et-theme", "light"); } catch (e) {}
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        btn.setAttribute("aria-pressed", "true");
        try { localStorage.setItem("et-theme", "dark"); } catch (e) {}
      }
    });
  }

  /* ---------- Budget progress bars ---------- */
  function setupProgressBars() {
    var bars = document.querySelectorAll(".progress__bar[data-width]");
    bars.forEach(function (bar) {
      var w = bar.getAttribute("data-width");
      /* Defer to next frame so the width transition animates. */
      requestAnimationFrame(function () {
        bar.style.width = w + "%";
      });
    });
  }

  /* ---------- Bar chart heights ---------- */
  function setupBarChart() {
    var bars = document.querySelectorAll("#barChart span[data-h]");
    bars.forEach(function (bar) {
      var h = bar.getAttribute("data-h");
      requestAnimationFrame(function () {
        bar.style.height = h + "%";
      });
    });
  }

  /* ---------- Export (placeholder) ---------- */
function setupExport() {

    const btn = document.getElementById("exportBtn");

    if (!btn) return;

    btn.addEventListener("click", function () {

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        fetch(`${BASE_URL}/export/excel`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => {

            if (!response.ok) {
                throw new Error("Export failed");
            }

            return response.blob();

        })
        .then(blob => {

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");

            a.href = url;
            a.download = "transactions.xlsx";

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);

        })
        .catch(error => {

            console.error(error);

            alert("Unable to export Excel file.");

        });

    });

}  
  async function loadDashboard() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(`${BASE_URL}/dashboard`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log(JSON.stringify(data, null, 2));

      if (data.status === "success") {

    document.getElementById("totalIncome").textContent =
        "₹" + Number(data.total_income).toLocaleString("en-IN");

    document.getElementById("totalExpense").textContent =
        "₹" + Number(data.total_expense).toLocaleString("en-IN");

    document.getElementById("totalBalance").textContent =
        "₹" + Number(data.balance).toLocaleString("en-IN");

    document.getElementById("totalSavings").textContent =
        "₹" + Number(data.savings).toLocaleString("en-IN");

    loadRecentTransactions();

}  

    } catch (error) {

        console.error("Dashboard Error:", error);

    }

}
async function loadRecentTransactions() {

    const token = localStorage.getItem("access_token");

    try {

        const response = await fetch(`${BASE_URL}/transactions`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("Status:", response.status);

        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Full Response:", data);

        if (data.status === "success") {

          const tbody = document.getElementById("recentTransactions");
            
          console.log(tbody);
          console.log(tbody.outerHTML);

            tbody.innerHTML = "";

            data.transactions.forEach(function (t) {

                tbody.innerHTML += `
                    <tr>
                        <td>${new Date(t.date).toLocaleDateString()}</td>
                        <td>${t.category}</td>
                        <td>${t.title}</td>

                        <td>
                            <span class="badge-pill ${
                                t.transaction_type === "Income"
                                    ? "badge-pill--income"
                                    : "badge-pill--expense"
                            }">
                                ${t.transaction_type}
                            </span>
                        </td>

                        <td class="ta-right ${
                            t.transaction_type === "Income"
                                ? "text-success"
                                : "text-danger"
                        }">
                            ${t.transaction_type === "Income" ? "+" : "-"}₹${t.amount}
                        </td>

                        <td>
                            <span class="status status--done">
                                Completed
                            </span>
                        </td>

                    <td>
                        <button class="row-btn edit-btn" data-id="${t.id}">
                            Edit
                        </button>

                        <button class="row-btn delete-btn" data-id="${t.id}">
                            Delete
                        </button>
                    </td>    
                    </tr>
                `;

                console.log("After append:", tbody.innerHTML);

            });
            
            console.log("FINAL:", tbody.innerHTML);
            document.querySelectorAll(".edit-btn").forEach(function(button) {

    button.addEventListener("click", function() {

        const id = this.dataset.id;

        localStorage.setItem("edit_transaction_id", id);

        window.location.href = "add_transaction.html";

    });

});
document.querySelectorAll(".delete-btn").forEach(function(button) {

    button.addEventListener("click", async function() {

        const id = this.dataset.id;

        const confirmDelete = confirm("Are you sure you want to delete this transaction?");

        if (!confirmDelete) {
            return;
        }

        const token = localStorage.getItem("access_token");

        try {

            const response = await fetch(`${BASE_URL}/transactions/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            console.log(data);

            if (data.status === "success") {

                alert("Transaction Deleted Successfully!");

                loadRecentTransactions();

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error(error);

            alert("Unable to connect to server.");

        }

    });

});
        }

    } catch (error) {

        console.error("Transaction Error:", error);

    }

}
function setupSearch() {

    const search = document.getElementById("searchTransaction");

    if (!search) return;

    search.addEventListener("keyup", function () {

        const value = this.value.toLowerCase();

        const rows = document.querySelectorAll("#recentTransactions tr");

        rows.forEach(function(row) {

            const text = row.textContent.toLowerCase();

            if (text.includes(value)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });

}
function setupFilter() {

    const filter = document.getElementById("filterTransaction");
    
    console.log("Filter initialized");

    if (!filter) return;

    filter.addEventListener("change", function () {

        const selectedType = this.value.toLowerCase();

        const rows = document.querySelectorAll("#recentTransactions tr");

        rows.forEach(function(row) {

            if (selectedType === "all") {
                row.style.display = "";
                return;
            }

            const typeText = row.children[3].textContent.trim().toLowerCase();

            if (typeText.includes(selectedType)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

}
async function drawExpenseChart() {

    const token = localStorage.getItem("access_token");

    const response = await fetch(`${BASE_URL}/expense-chart`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (data.status !== "success") return;

    const ctx = document.getElementById("expenseChart");

    if (!ctx) return;

    new Chart(ctx, {
        type: "pie",

        data: {
            labels: data.labels,

            datasets: [{
                data: data.amounts,

                backgroundColor: [
                    "#3B82F6",
                    "#10B981",
                    "#F59E0B",
                    "#EF4444",
                    "#8B5CF6",
                    "#06B6D4",
                    "#84CC16",
                    "#F97316",
                    "#EC4899",
                    "#14B8A6"
                ]
            }]
        },

        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });

}
async function drawMonthlyChart() {

    const token = localStorage.getItem("access_token");

    const response = await fetch(`${BASE_URL}/monthly-chart`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (data.status !== "success") return;

    const ctx = document.getElementById("monthlyChart");

    if (!ctx) return;

    new Chart(ctx, {
        type: "bar",

        data: {
            labels: data.labels,

            datasets: [{
                label: "Monthly Expense",
                data: data.amounts,
                backgroundColor: "#3B82F6",
                borderRadius: 8
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

}
const pdfBtn = document.getElementById("exportPdfBtn");

if (pdfBtn) {

    pdfBtn.addEventListener("click", function () {

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please login first.");
            return;
        }

        fetch(`${BASE_URL}/export/pdf`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => {

            if (!response.ok) {
                throw new Error("PDF Export Failed");
            }

            return response.blob();

        })
        .then(blob => {

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");

            a.href = url;
            a.download = "transactions.pdf";

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);

        })
        .catch(error => {

            console.error(error);

            alert("Unable to export PDF.");

        });

    });

}
const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", function () {

    console.log("Export button clicked");

    fetch(`${BASE_URL}/export/excel`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => {

        console.log("Export response:", response);

        if (!response.ok) {
            throw new Error("Export failed");
        }

        return response.blob();
    })
    .then(blob => {

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.xlsx";

        document.body.appendChild(a);
        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);

        console.log("Excel downloaded successfully");
    })
    .catch(error => {

        console.error("Export error:", error);
        alert("Unable to export transactions.");
    });

});
})();