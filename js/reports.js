/* ============================================================
   reports.js — Reports & Analytics page interactions
   Handles sidebar drawer, theme toggle, animated progress
   bars, grouped bar chart, line-chart draw, filter and
   export actions (UI only — no backend / no fetch).
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    setupSidebar();
    setupTheme();
    setupProgressBars();
    setupBarChart();
    setupFilters();
    setupExport();
    loadReportSummary();
    loadCategoryReport();
    loadMonthlyIncomeExpense();
    loadMonthlyBudget();
    setupCategoryFilter();
    loadWeeklySpending();
    loadMonthlySummary();
    loadTopSpendingCategories();
    loadFinancialInsights();
    loadCategoryAnalysis();
    loadIncomeSources();
  });

  function loadMonthlyBudget() {

    var token = localStorage.getItem("access_token");

    fetch("http://127.0.0.1:5000/budget", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("Budget response:", data);

        var totalBudget = 0;

        data.budgets.forEach(function(budget) {
            totalBudget += Number(budget.monthly_budget || 0);
        });

        document.getElementById("monthlyBudgetValue").textContent =
            "₹" + totalBudget.toLocaleString("en-IN");


        // Get transactions
        return fetch("http://127.0.0.1:5000/transactions", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        var monthlyExpense = 0;

        if (data.transactions) {

            data.transactions.forEach(function(transaction) {

                if (transaction.transaction_type === "Expense") {

                    monthlyExpense += Number(transaction.amount || 0);

                }

            });
        }

        var budgetText = document.getElementById("monthlyBudgetValue").textContent;

        var totalBudget = Number(
            budgetText.replace(/[₹,]/g, "")
        );

        var usage = 0;

        if (totalBudget > 0) {
            usage = Math.round(
                (monthlyExpense / totalBudget) * 100
            );
        }

        document.getElementById("budgetUsageValue").textContent =
            usage + "% used";

        console.log("Budget:", totalBudget);
        console.log("Expense:", monthlyExpense);
        console.log("Usage:", usage + "%");

    })
    .catch(function(error) {

        console.error("Budget loading error:", error);

    });
}

  /* ---------- Sidebar drawer (mobile / tablet) ---------- */
  function setupSidebar() {
    var toggle = document.getElementById("sidebarToggle");
    var overlay = document.getElementById("sidebarOverlay");
    var sidebar = document.getElementById("sidebar");
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

  /* ---------- Theme toggle (dark mode) ---------- */
  function setupTheme() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
      btn.setAttribute("aria-pressed", String(!isDark));
    });
  }

  /* ---------- Animate progress bars from data-width ---------- */
  function setupProgressBars() {
    var bars = document.querySelectorAll(".progress__bar[data-width]");
    bars.forEach(function (bar) {
      var width = bar.getAttribute("data-width");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.width = width + "%";
        });
      });
    });
  }

  /* ---------- Animate grouped bar chart from data-h ---------- */
  function setupBarChart() {
    var bars = document.querySelectorAll(".bar[data-h]");
    bars.forEach(function (bar) {
      var height = bar.getAttribute("data-h");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.height = height + "%";
        });
      });
    });
  }

  /* ---------- Filters (UI only) ---------- */
  function setupFilters() {

    var form = document.getElementById("filterForm");

    if (!form) return;

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        var range =
            document.getElementById("fRange").value;

        var month =
            document.getElementById("fMonth").value;

        var year =
            document.getElementById("fYear").value;

        var category =
            document.getElementById("fCategory").value;

        var type =
            document.getElementById("fType").value;


        console.log("Filters:", {
            range: range,
            month: month,
            year: year,
            category: category,
            type: type
        });


        var token =
            localStorage.getItem("access_token");

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

            if (!data.transactions) {
                console.error("No transactions found.");
                return;
            }


            var filteredTransactions =
                data.transactions.filter(function(transaction) {

                    var transactionDate =
                        new Date(transaction.date);

                    if (isNaN(transactionDate.getTime())) {
                        return false;
                    }

                    // Date Range filter
                    // Date Range filter
// Apply Date Range only when Month is not selected

var now = new Date();

if (!month) {

    if (range === "This Month") {

        if (
            transactionDate.getFullYear() !== now.getFullYear() ||
            transactionDate.getMonth() !== now.getMonth()
        ) {
            return false;
        }

    }

    if (range === "Last Month") {

        var lastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        if (
            transactionDate.getFullYear() !== lastMonth.getFullYear() ||
            transactionDate.getMonth() !== lastMonth.getMonth()
        ) {
            return false;
        }

    }

    if (range === "Last 3 Months") {

        var threeMonthsAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1
        );

        if (transactionDate < threeMonthsAgo) {
            return false;
        }

    }

    if (range === "Last 6 Months") {

        var sixMonthsAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 5,
            1
        );

        if (transactionDate < sixMonthsAgo) {
            return false;
        }

    }

    if (range === "This Year") {

        if (
            transactionDate.getFullYear() !== now.getFullYear()
        ) {
            return false;
        }

    }
}

                    // Year filter
                    if (
                        year &&
                        String(transactionDate.getFullYear()) !== String(year)
                    ) {
                        return false;
                    }


                    // Month filter
                    if (month) {

                        var transactionMonth =
                            transactionDate.getFullYear() +
                            "-" +
                            String(
                                transactionDate.getMonth() + 1
                            ).padStart(2, "0");

                        if (transactionMonth !== month) {
                            return false;
                        }
                    }


                    // Category filter
                    if (
                        category &&
                        category !== "All Categories" &&
                        transaction.category !== category
                    ) {
                        return false;
                    }


                    // Transaction type filter
                    if (
                        type &&
                        type !== "All" &&
                        transaction.transaction_type !== type
                    ) {
                        return false;
                    }


                    return true;

                });


            console.log(
                "Filtered transactions:",
                filteredTransactions
            );


            updateFilteredSummary(
                filteredTransactions
            );

            updateMonthlyChart(
                filteredTransactions
            );

            updateFilteredCategoryChart(
                filteredTransactions
            );

            updateFilteredWeeklySpending(
                filteredTransactions
            );
            updateFilteredBudgetUsage(
                filteredTransactions
            );

            updateFilteredMonthlySummary(
                filteredTransactions
            );
        

            updateMonthlyChart(filteredTransactions);

            var btn =
                document.getElementById("applyFilters");

            if (btn) {

                var label = btn.textContent;

                btn.textContent = "Applied ✓";

                setTimeout(function() {
                    btn.textContent = label;
                }, 1500);
            }

        })
        .catch(function(error) {

            console.error(
                "Filter error:",
                error
            );

        });

    });
}

  /* ---------- Export actions (UI only) ---------- */
  function setupExport() {
    var pdf = document.getElementById("exportPdf");
    var excel = document.getElementById("exportExcel");
    var print = document.getElementById("printReport");

    if (pdf) {
      pdf.addEventListener("click", function () {
        window.alert("Generating PDF report… (demo only)");
      });
    }
    if (excel) {
      excel.addEventListener("click", function () {
        window.alert("Generating Excel report… (demo only)");
      });
    }
    if (print) {
      print.addEventListener("click", function () {
        window.print();
      });
    }
  }
function setupReportExports() {

    var exportPdf = document.getElementById("exportPdf");
    var exportExcel = document.getElementById("exportExcel");
    var printReport = document.getElementById("printReport");

    function downloadReport(url, filename) {

        var token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please login again.");
            return;
        }

        fetch(`${BASE_URL}${url}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Export failed: " + response.status);
            }

            return response.blob();
        })
        .then(function (blob) {

            var downloadUrl = URL.createObjectURL(blob);

            var link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(downloadUrl);
        })
        .catch(function (error) {

            console.error("REPORT EXPORT ERROR:", error);

            alert("Unable to export report.");
        });
    }

    if (exportPdf) {
        exportPdf.addEventListener("click", function () {
            downloadReport(
                "/export/pdf",
                "transactions.pdf"
            );
        });
    }

    if (exportExcel) {
        exportExcel.addEventListener("click", function () {
            downloadReport(
                "/export/excel",
                "transactions.xlsx"
            );
        });
    }

    if (printReport) {
        printReport.addEventListener("click", function () {
            window.print();
        });
    }
}
function loadReportSummary() {

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

        console.log("Transactions for report:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var totalIncome = 0;
        var totalExpenses = 0;

        data.transactions.forEach(function(transaction) {

            var amount = Number(transaction.amount || 0);

            if (transaction.transaction_type === "Income") {
                totalIncome += amount;
            }

            if (transaction.transaction_type === "Expense") {
                totalExpenses += amount;
            }
        });

        var netSavings = totalIncome - totalExpenses;

        document.getElementById("totalIncome").textContent =
            "₹" + totalIncome.toLocaleString("en-IN");

        document.getElementById("totalExpenses").textContent =
            "₹" + totalExpenses.toLocaleString("en-IN");

        document.getElementById("netSavings").textContent =
            "₹" + netSavings.toLocaleString("en-IN");

        console.log("Total Income:", totalIncome);
        console.log("Total Expenses:", totalExpenses);
        console.log("Net Savings:", netSavings);

    })
    .catch(function(error) {
        console.error("Report summary error:", error);
    });
}
function loadCategoryReport() {

    var token = localStorage.getItem("access_token");

    if (!token) {
        console.error("No access token found.");
        return;
    }

    fetch("http://127.0.0.1:5000/reports/category", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("Category Report:", data);

        if (!data.report) {
            console.error("No category report found.");
            return;
        }

        var total = 0;

        data.report.forEach(function(item) {
            total += Number(item.total || 0);
        });

        // Update total in the center of donut
        var categoryTotal =
            document.getElementById("categoryTotal");

        if (categoryTotal) {
            categoryTotal.textContent =
                "₹" + total.toLocaleString("en-IN");
        }


        // Update legend
        var legend =
            document.getElementById("categoryLegend");

        if (legend) {

            legend.innerHTML = "";

            var colors = [
                "#2563EB",
                "#F59E0B",
                "#10B981",
                "#EF4444",
                "#8B5CF6",
                "#EC4899"
            ];

           data.report.forEach(function(item, index) {

                var amount = Number(item.total || 0);

                var percentage = total > 0
                   ? Math.round((amount / total) * 100)
                   : 0;

                var li = document.createElement("li");

                li.innerHTML = `
                    <span class="dot"
                          style="background:${colors[index % colors.length]}"></span>
                    ${item.category} — ₹${amount.toLocaleString("en-IN")}
                    (${percentage}%)
                `;

               legend.appendChild(li);
            });
        }


        // Update donut chart
        var pie =
            document.querySelector(".chart-pie--expense");

        if (pie && total > 0) {

            var colors = [
                "#2563EB",
                "#F59E0B",
                "#10B981",
                "#EF4444",
                "#8B5CF6",
                "#EC4899"
            ];

            var currentPercentage = 0;
            var segments = [];

            data.report.forEach(function(item, index) {

                var amount = Number(item.total || 0);

                var percentage =
                    (amount / total) * 100;

                var start = currentPercentage;
                var end = currentPercentage + percentage;

                segments.push(
                    `${colors[index % colors.length]} ${start}% ${end}%`
                );

                currentPercentage = end;
            });

            pie.style.background =
                `conic-gradient(${segments.join(", ")})`;
    }

    })
    .catch(function(error) {

        console.error(
            "Category report error:",
            error
        );

    });
}
function loadMonthlyIncomeExpense() {

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

        console.log("Transactions for monthly chart:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var monthly = {};

        data.transactions.forEach(function(transaction) {

            var date = transaction.date;

            if (!date) {
                return;
            }

            var dateObject = new Date(date);

            if (isNaN(dateObject.getTime())) {
                console.warn("Invalid transaction date:", date);
                return;
            }

            var year = dateObject.getFullYear();
            var monthNumber = dateObject.getMonth() + 1;

            var month = year + "-" + String(monthNumber).padStart(2, "0");
            
            if (!monthly[month]) {
                monthly[month] = {
                    income: 0,
                    expense: 0
                };
            }

            var amount = Number(transaction.amount || 0);

            if (transaction.transaction_type === "Income") {
                monthly[month].income += amount;
            }

            if (transaction.transaction_type === "Expense") {
                monthly[month].expense += amount;
            }
        });

        console.log("Monthly totals:", monthly);


        // Get last 6 months
        var months = Object.keys(monthly).sort().slice(-6);

        var barGroups = document.querySelectorAll(
            "#incomeExpenseChart .bar-group"
        );

        var axisLabels = document.querySelectorAll(
            ".bar-chart__axis span"
        );


        // Find maximum value for scaling
        var maxValue = 0;

        months.forEach(function(month) {

            var income = monthly[month].income;
            var expense = monthly[month].expense;

            maxValue = Math.max(
                maxValue,
                income,
                expense
            );

        });


        if (maxValue === 0) {
            maxValue = 1;
        }


        // Update bars
        months.forEach(function(month, index) {

            if (!barGroups[index]) {
                return;
            }

            var income = monthly[month].income;
            var expense = monthly[month].expense;

            var incomeHeight =
                (income / maxValue) * 100;

            var expenseHeight =
                (expense / maxValue) * 100;


            var incomeBar =
                barGroups[index].querySelector(".bar--income");

            var expenseBar =
                barGroups[index].querySelector(".bar--expense");


            if (incomeBar) {
                incomeBar.style.height =
                    incomeHeight + "%";
            }

            if (expenseBar) {
                expenseBar.style.height =
                    expenseHeight + "%";
            }


            // Update month name
            if (axisLabels[index]) {

                var parts = month.split("-");

                var monthNumber = Number(parts[1]);

                var monthNames = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];

                axisLabels[index].textContent =
                monthNames[monthNumber - 1] || "";
            }

        });

    })
    .catch(function(error) {

        console.error(
            "Monthly chart error:",
            error
        );

    });
}
function loadReportSummary() {

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

        console.log("Transactions for summary:", data);

        if (!data.transactions) {
            return;
        }

        var totalIncome = 0;
        var totalExpense = 0;

        data.transactions.forEach(function(transaction) {

            var amount = Number(transaction.amount || 0);

            if (transaction.transaction_type === "Income") {
                totalIncome += amount;
            }

            if (transaction.transaction_type === "Expense") {
                totalExpense += amount;
            }
        });

        var savings = totalIncome - totalExpense;

        // Values
        document.getElementById("totalIncome").textContent =
            "₹" + totalIncome.toLocaleString("en-IN");

        document.getElementById("totalExpenses").textContent =
            "₹" + totalExpense.toLocaleString("en-IN");

        document.getElementById("netSavings").textContent =
            "₹" + savings.toLocaleString("en-IN");


        // -----------------------------
        // Calculate percentages
        // -----------------------------

        // Expense as percentage of income
        var expensePercentage = 0;

        if (totalIncome > 0) {
            expensePercentage =
                Math.round((totalExpense / totalIncome) * 100);
        }

        // Savings as percentage of income
        var savingsPercentage = 0;

        if (totalIncome > 0) {
            savingsPercentage =
                Math.round((savings / totalIncome) * 100);
        }

        // Income percentage
        // Since there is no previous-period data,
        // we use its share of total money.
        var totalMoney = totalIncome + totalExpense;

        var incomePercentage = 0;

        if (totalMoney > 0) {
            incomePercentage =
                Math.round((totalIncome / totalMoney) * 100);
        }


        // -----------------------------
        // Update card percentages
        // -----------------------------

        document.getElementById("incomeTrend").textContent =
            incomePercentage + "%";

        document.getElementById("expenseTrend").textContent =
            expensePercentage + "%";

        document.getElementById("savingsTrend").textContent =
            savingsPercentage + "%";

        console.log("Income:", totalIncome);
        console.log("Expenses:", totalExpense);
        console.log("Savings:", savings);

        console.log("Income %:", incomePercentage);
        console.log("Expense %:", expensePercentage);
        console.log("Savings %:", savingsPercentage);

    })
    .catch(function(error) {

        console.error("Report summary error:", error);

    });
}
document.getElementById("exportPdf").addEventListener("click", function () {

    var token = localStorage.getItem("access_token");

    fetch("http://127.0.0.1:5000/export/pdf", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {

        if (!response.ok) {
            throw new Error("PDF export failed");
        }

        return response.blob();
    })
    .then(function(blob) {

        var url = window.URL.createObjectURL(blob);

        var link = document.createElement("a");

        link.href = url;
        link.download = "transactions.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

    })
    .catch(function(error) {

        console.error("PDF export error:", error);

        alert("Unable to export PDF.");

    });

});
document.getElementById("exportExcel").addEventListener("click", function () {

    var token = localStorage.getItem("access_token");

    fetch("http://127.0.0.1:5000/export/excel", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function(response) {

        if (!response.ok) {
            throw new Error("Excel export failed");
        }

        return response.blob();
    })
    .then(function(blob) {

        var url = window.URL.createObjectURL(blob);

        var link = document.createElement("a");
        link.href = url;
        link.download = "transactions.xlsx";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

    })
    .catch(function(error) {

        console.error("Excel export error:", error);
        alert("Unable to export Excel.");

    });

});
document.getElementById("printReport").addEventListener("click", function () {
    window.print();
});
function updateFilteredSummary(transactions) {

    var income = 0;
    var expense = 0;

    transactions.forEach(function(transaction) {

        var amount = Number(transaction.amount || 0);

        if (transaction.transaction_type === "Income") {
            income += amount;
        }

        if (transaction.transaction_type === "Expense") {
            expense += amount;
        }

    });

    var savings = income - expense;

    console.log("Filtered Income:", income);
    console.log("Filtered Expenses:", expense);
    console.log("Filtered Savings:", savings);


    // Summary values
    var incomeValue =
        document.querySelector(
            ".summary-card:nth-child(1) .summary-card__value"
        );

    var expenseValue =
        document.querySelector(
            ".summary-card:nth-child(2) .summary-card__value"
        );

    var savingsValue =
        document.querySelector(
            ".summary-card:nth-child(3) .summary-card__value"
        );


    // Percentage elements
    var incomeTrend =
        document.querySelector(
            ".summary-card:nth-child(1) .trend"
        );

    var expenseTrend =
        document.querySelector(
            ".summary-card:nth-child(2) .trend"
        );

    var savingsTrend =
        document.querySelector(
            ".summary-card:nth-child(3) .trend"
        );


    // Update amounts
    if (incomeValue) {
        incomeValue.textContent =
            "₹" + income.toLocaleString("en-IN");
    }

    if (expenseValue) {
        expenseValue.textContent =
            "₹" + expense.toLocaleString("en-IN");
    }

    if (savingsValue) {
        savingsValue.textContent =
            "₹" + savings.toLocaleString("en-IN");
    }


    // Calculate percentages
    var total = income + expense;

    var incomePercentage =
        total > 0
            ? Math.round((income / total) * 100)
            : 0;

    var expensePercentage =
        total > 0
            ? Math.round((expense / total) * 100)
            : 0;

    var savingsPercentage =
        income > 0
            ? Math.round((savings / income) * 100)
            : 0;


    // Update percentages
    if (incomeTrend) {
        incomeTrend.textContent =
            incomePercentage + "%";
    }

    if (expenseTrend) {
        expenseTrend.textContent =
            expensePercentage + "%";
    }

    if (savingsTrend) {
        savingsTrend.textContent =
            savingsPercentage + "%";
    }
}
function updateMonthlyChart(transactions) {

    var monthly = {};

    transactions.forEach(function(transaction) {

        var date = transaction.date;

        if (!date) {
            return;
        }

        var dateObject = new Date(date);

        if (isNaN(dateObject.getTime())) {
            return;
        }

        var year = dateObject.getFullYear();
        var monthNumber = dateObject.getMonth() + 1;

        var month =
            year + "-" +
            String(monthNumber).padStart(2, "0");

        if (!monthly[month]) {
            monthly[month] = {
                income: 0,
                expense: 0
            };
        }

        var amount =
            Number(transaction.amount || 0);

        if (transaction.transaction_type === "Income") {
            monthly[month].income += amount;
        }

        if (transaction.transaction_type === "Expense") {
            monthly[month].expense += amount;
        }

    });


    console.log("Filtered monthly totals:", monthly);


    // Get last 6 months
    var months =
        Object.keys(monthly)
        .sort()
        .slice(-6);


    var barGroups =
        document.querySelectorAll(
            "#incomeExpenseChart .bar-group"
        );

    var axisLabels =
        document.querySelectorAll(
            ".bar-chart__axis span"
        );


    // Find maximum value
    var maxValue = 0;

    months.forEach(function(month) {

        maxValue = Math.max(
            maxValue,
            monthly[month].income,
            monthly[month].expense
        );

    });


    if (maxValue === 0) {
        maxValue = 1;
    }


    // Update bars
    months.forEach(function(month, index) {

        if (!barGroups[index]) {
            return;
        }

        var income =
            monthly[month].income;

        var expense =
            monthly[month].expense;


        var incomeHeight =
            (income / maxValue) * 100;

        var expenseHeight =
            (expense / maxValue) * 100;


        var incomeBar =
            barGroups[index].querySelector(
                ".bar--income"
            );

        var expenseBar =
            barGroups[index].querySelector(
                ".bar--expense"
            );


        if (incomeBar) {
            incomeBar.style.height =
                incomeHeight + "%";
        }

        if (expenseBar) {
            expenseBar.style.height =
                expenseHeight + "%";
        }


        // Month label
        if (axisLabels[index]) {

            var monthNumber =
                Number(month.split("-")[1]);

            var monthNames = [
                "Jan", "Feb", "Mar", "Apr",
                "May", "Jun", "Jul", "Aug",
                "Sep", "Oct", "Nov", "Dec"
            ];

            axisLabels[index].textContent =
                monthNames[monthNumber - 1] || "";
        }

    });


    // Clear unused bars
    for (
        var i = months.length;
        i < barGroups.length;
        i++
    ) {

        var incomeBar =
            barGroups[i].querySelector(
                ".bar--income"
            );

        var expenseBar =
            barGroups[i].querySelector(
                ".bar--expense"
            );

        if (incomeBar) {
            incomeBar.style.height = "0%";
        }

        if (expenseBar) {
            expenseBar.style.height = "0%";
        }

        if (axisLabels[i]) {
            axisLabels[i].textContent = "";
        }
    }

}
function updateFilteredCategoryChart(transactions) {

    var categoryTotals = {};
    var total = 0;

    transactions.forEach(function(transaction) {

        if (transaction.transaction_type !== "Expense") {
            return;
        }

        var category = transaction.category || "Other";
        var amount = Number(transaction.amount || 0);

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += amount;
        total += amount;
    });


    console.log(
        "Filtered category totals:",
        categoryTotals
    );


    var pie =
        document.querySelector(".chart-pie--expense");

    var legend =
        document.getElementById("categoryLegend");


    if (!pie || !legend) {
        return;
    }


    // Clear old legend
    legend.innerHTML = "";


    var colors = [
        "#2563EB",
        "#F59E0B",
        "#10B981",
        "#EF4444",
        "#8B5CF6",
        "#EC4899"
    ];


    var categories =
        Object.keys(categoryTotals);


    // Update total in donut
    var categoryTotal =
        document.getElementById("categoryTotal");

    if (categoryTotal) {
        categoryTotal.textContent =
            "₹" + total.toLocaleString("en-IN");
    }


    // Create legend
    categories.forEach(function(category, index) {

        var amount =
            categoryTotals[category];

        var percentage =
            total > 0
                ? Math.round((amount / total) * 100)
                : 0;


        var li =
            document.createElement("li");


        li.innerHTML = `
            <span class="dot"
                  style="background:${colors[index % colors.length]}">
            </span>
            ${category} — ₹${amount.toLocaleString("en-IN")}
            (${percentage}%)
        `;


        legend.appendChild(li);

    });


    // Update donut
    if (total > 0) {

        var currentPercentage = 0;
        var segments = [];


        categories.forEach(function(category, index) {

            var amount =
                categoryTotals[category];

            var percentage =
                (amount / total) * 100;


            var start =
                currentPercentage;

            var end =
                currentPercentage + percentage;


            segments.push(
                `${colors[index % colors.length]} ${start}% ${end}%`
            );


            currentPercentage = end;

        });


        pie.style.background =
            `conic-gradient(${segments.join(", ")})`;

    } else {

        pie.style.background =
            "#E5E7EB";

    }

}
function setupCategoryFilter() {

    var typeSelect = document.getElementById("fType");
    var categorySelect = document.getElementById("fCategory");

    if (!typeSelect || !categorySelect) {
        return;
    }

    function updateCategories() {

        var type = typeSelect.value;

        categorySelect.innerHTML = "";

        var categories = [];

        if (type === "Income") {

            categories = [
                "All Categories",
                "Salary",
                "Freelance",
                "Business",
                "Investment",
                "Other"
            ];

        } else if (type === "Expense") {

            categories = [
                "All Categories",
                "Food",
                "Travel",
                "Shopping",
                "Bills",
                "Entertainment",
                "Medical",
                "Education",
                "Other"
            ];

        } else {

            categories = [
                "All Categories",
                "Food",
                "Travel",
                "Shopping",
                "Bills",
                "Entertainment",
                "Medical",
                "Education",
                "Salary",
                "Freelance",
                "Business",
                "Investment",
                "Other"
            ];
        }

        categories.forEach(function(category) {

            var option = document.createElement("option");

            option.value = category;
            option.textContent = category;

            categorySelect.appendChild(option);

        });
    }

    typeSelect.addEventListener("change", updateCategories);

    updateCategories();
}
var resetButton = document.getElementById("resetFilters");

if (resetButton) {

    resetButton.addEventListener("click", function () {

        setTimeout(function () {

            // Reload original summary
            loadReportSummary();

            // Reload original monthly chart
            loadMonthlyIncomeExpense();

            // Reload original category chart
            loadCategoryReport();

            console.log("Filters reset successfully.");

        }, 50);

    });

}
function loadWeeklySpending() {

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

        console.log("Transactions for weekly spending:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var weekly = {};

        data.transactions.forEach(function(transaction) {

            // Only expenses
            if (transaction.transaction_type !== "Expense") {
                return;
            }

            if (!transaction.date) {
                return;
            }

            var date = new Date(transaction.date);

            if (isNaN(date.getTime())) {
                return;
            }

            // Start of the week
            var day = date.getDay();

            var weekStart = new Date(date);

            weekStart.setDate(
                date.getDate() - day
            );

            weekStart.setHours(0, 0, 0, 0);

            var weekKey =
                weekStart.getFullYear() +
                "-" +
                String(weekStart.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(weekStart.getDate()).padStart(2, "0");


            if (!weekly[weekKey]) {
                weekly[weekKey] = 0;
            }

            weekly[weekKey] +=
                Number(transaction.amount || 0);

        });


        console.log(
            "Weekly spending totals:",
            weekly
        );


        // Get latest 6 weeks
        var weeks =
            Object.keys(weekly)
                .sort()
                .slice(-6);


        var values = weeks.map(function(week) {
            return weekly[week];
        });


        // Make sure we have 6 points
        while (values.length < 6) {
            values.unshift(0);
            weeks.unshift("");
        }


        var line =
            document.querySelector(
                ".line-chart__line"
            );

        var area =
            document.querySelector(
                ".line-chart__area"
            );

        var dots =
            document.querySelectorAll(
                ".line-chart__dot"
            );

        var labels =
            document.querySelectorAll(
                ".line-chart + .bar-chart__axis span"
            );


        if (!line || !area) {
            console.error(
                "Weekly chart elements not found."
            );
            return;
        }


        // Find maximum spending
        var maxValue =
            Math.max.apply(null, values);

        if (maxValue === 0) {
            maxValue = 1;
        }


        var points = [];

        var startX = 20;
        var endX = 300;

        var step =
            (endX - startX) / 5;


        values.forEach(function(value, index) {

            var x =
                startX + (step * index);

            // Higher spending = higher point
            var y =
                120 - ((value / maxValue) * 80);

            points.push(
                x + "," + y
            );


            // Update dot
            if (dots[index]) {
                dots[index].setAttribute(
                    "cx",
                    x
                );

                dots[index].setAttribute(
                    "cy",
                    y
                );
            }


            // Update label
            if (labels[index]) {

                if (weeks[index]) {

                    var dateParts =
                        weeks[index].split("-");

                    labels[index].textContent =
                        "Wk " + (index + 1);

                } else {

                    labels[index].textContent =
                        "";

                }
            }

        });


        var pointsString =
            points.join(" ");


        // Update line
        line.setAttribute(
            "points",
            pointsString
        );


        // Update filled area
        area.setAttribute(
            "d",
            "M" +
            points[0] +
            " L" +
            points.slice(1).join(" L") +
            " L300,140 L20,140 Z"
        );

    })
    .catch(function(error) {

        console.error(
            "Weekly spending error:",
            error
        );

    });
}
function updateFilteredWeeklySpending(transactions) {
    console.log("WEEKLY FILTER FUNCTION CALLED:", transactions);

    var weekly = {};

    transactions.forEach(function(transaction) {

        // Weekly Spending = expenses only
        if (transaction.transaction_type !== "Expense") {
            return;
        }

        if (!transaction.date) {
            return;
        }

        var date = new Date(transaction.date);

        if (isNaN(date.getTime())) {
            return;
        }

        var day = date.getDay();

        var weekStart = new Date(date);

        weekStart.setDate(
            date.getDate() - day
        );

        weekStart.setHours(0, 0, 0, 0);

        var weekKey =
            weekStart.getFullYear() +
            "-" +
            String(weekStart.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(weekStart.getDate()).padStart(2, "0");


        if (!weekly[weekKey]) {
            weekly[weekKey] = 0;
        }

        weekly[weekKey] +=
            Number(transaction.amount || 0);

    });


    console.log(
        "Filtered weekly spending:",
        weekly
    );


    var weeks =
        Object.keys(weekly)
            .sort()
            .slice(-6);


    var values = weeks.map(function(week) {
        return weekly[week];
    });


    // Fill missing weeks with zero
    while (values.length < 6) {
        values.unshift(0);
        weeks.unshift("");
    }


    var line =
        document.querySelector(
            ".line-chart__line"
        );

    var area =
        document.querySelector(
            ".line-chart__area"
        );

    var dots =
        document.querySelectorAll(
            ".line-chart__dot"
        );


    if (!line || !area) {
        return;
    }


    var maxValue =
        Math.max.apply(null, values);

    if (maxValue === 0) {
        maxValue = 1;
    }


    var points = [];

    var startX = 20;
    var endX = 300;

    var step =
        (endX - startX) / 5;


    values.forEach(function(value, index) {

        var x =
            startX + (step * index);

        var y =
            120 - ((value / maxValue) * 80);


        points.push(
            x + "," + y
        );


        if (dots[index]) {

            dots[index].setAttribute(
                "cx",
                x
            );

            dots[index].setAttribute(
                "cy",
                y
            );

        }

    });


    var pointsString =
        points.join(" ");


    // Update line
    line.setAttribute(
        "points",
        pointsString
    );


    // Update filled area
    area.setAttribute(
        "d",
        "M" +
        points[0] +
        " L" +
        points.slice(1).join(" L") +
        " L300,140 L20,140 Z"
    );

}
function updateFilteredBudgetUsage(transactions) {

    var budgetElement =
        document.getElementById("monthlyBudgetValue");

    var usageElement =
        document.getElementById("budgetUsageValue");

    if (!budgetElement || !usageElement) {
        return;
    }


    // Get budget amount
    var totalBudget = Number(
        budgetElement.textContent.replace(/[₹,]/g, "")
    );


    // Calculate filtered expenses
    var filteredExpense = 0;

    transactions.forEach(function(transaction) {

        if (transaction.transaction_type === "Expense") {

            filteredExpense +=
                Number(transaction.amount || 0);

        }

    });


    // Calculate usage percentage
    var usage = 0;

    if (totalBudget > 0) {

        usage = Math.round(
            (filteredExpense / totalBudget) * 100
        );

    }


    usageElement.textContent =
        usage + "% used";


    console.log(
        "Filtered Budget:",
        totalBudget
    );

    console.log(
        "Filtered Expense:",
        filteredExpense
    );

    console.log(
        "Filtered Budget Usage:",
        usage + "%"
    );

}
function loadMonthlySummary() {
    console.log("MONTHLY SUMMARY FUNCTION CALLED");

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

        console.log("Transactions for monthly summary:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var monthly = {};

        data.transactions.forEach(function(transaction) {

            if (!transaction.date) {
                return;
            }

            var date = new Date(transaction.date);

            if (isNaN(date.getTime())) {
                return;
            }

            var key =
                date.getFullYear() +
                "-" +
                String(date.getMonth() + 1).padStart(2, "0");

            if (!monthly[key]) {
                monthly[key] = {
                    income: 0,
                    expense: 0
                };
            }

            var amount =
                Number(transaction.amount || 0);

            if (transaction.transaction_type === "Income") {
                monthly[key].income += amount;
            }

            if (transaction.transaction_type === "Expense") {
                monthly[key].expense += amount;
            }

        });

        console.log("Monthly summary totals:", monthly);

        var body =
            document.getElementById("monthlySummaryBody");

        if (!body) {
            console.error("Monthly summary body not found.");
            return;
        }

        body.innerHTML = "";

        console.log("Monthly summary cleared:", body.innerHTML);

        var months =
            Object.keys(monthly)
                .sort()
                .slice(-6);

        var monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];

        months.forEach(function(key) {

            var parts = key.split("-");

            var year = Number(parts[0]);
            var monthIndex = Number(parts[1]) - 1;

            var income = monthly[key].income;
            var expense = monthly[key].expense;
            var savings = income - expense;

            var statusText =
                savings >= 0
                    ? "On Track"
                    : "Over Budget";

            var statusClass =
                savings >= 0
                    ? "status--done"
                    : "status--failed";

            var row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${monthNames[monthIndex]} ${year}
                </td>

                <td class="ta-right text-success">
                    +₹${income.toLocaleString("en-IN")}
                </td>

                <td class="ta-right text-danger">
                    -₹${expense.toLocaleString("en-IN")}
                </td>

                <td class="ta-right">
                    ₹${savings.toLocaleString("en-IN")}
                </td>

                <td>
                    <span class="status ${statusClass}">
                        ${statusText}
                    </span>
                </td>
            `;

            body.appendChild(row);

        });

    })
    .catch(function(error) {

        console.error(
            "Monthly summary error:",
            error
        );

    });
}
function updateFilteredMonthlySummary(transactions) {

    var monthly = {};

    transactions.forEach(function(transaction) {

        if (!transaction.date) {
            return;
        }

        var date = new Date(transaction.date);

        if (isNaN(date.getTime())) {
            return;
        }

        var key =
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0");

        if (!monthly[key]) {
            monthly[key] = {
                income: 0,
                expense: 0
            };
        }

        var amount =
            Number(transaction.amount || 0);

        if (transaction.transaction_type === "Income") {
            monthly[key].income += amount;
        }

        if (transaction.transaction_type === "Expense") {
            monthly[key].expense += amount;
        }

    });


    console.log(
        "Filtered monthly summary:",
        monthly
    );


    var body =
        document.getElementById("monthlySummaryBody");

    if (!body) {
        console.error("Monthly summary body not found.");
        return;
    }

    body.innerHTML = "";


    var months =
        Object.keys(monthly)
            .sort()
            .slice(-6);


    var monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];


    months.forEach(function(key) {

        var parts = key.split("-");

        var year =
            Number(parts[0]);

        var monthIndex =
            Number(parts[1]) - 1;

        var income =
            monthly[key].income;

        var expense =
            monthly[key].expense;

        var savings =
            income - expense;


        var statusText =
            savings >= 0
                ? "On Track"
                : "Over Budget";

        var statusClass =
            savings >= 0
                ? "status--done"
                : "status--failed";


        var row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${monthNames[monthIndex]} ${year}
            </td>

            <td class="ta-right text-success">
                +₹${income.toLocaleString("en-IN")}
            </td>

            <td class="ta-right text-danger">
                -₹${expense.toLocaleString("en-IN")}
            </td>

            <td class="ta-right">
                ₹${savings.toLocaleString("en-IN")}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${statusText}
                </span>
            </td>
        `;


        body.appendChild(row);

    });

}
function loadTopSpendingCategories() {

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

        console.log(
            "Transactions for top spending categories:",
            data
        );

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var categories = {};

        data.transactions.forEach(function(transaction) {

            if (
                transaction.transaction_type !== "Expense" ||
                !transaction.category
            ) {
                return;
            }

            var category = transaction.category;

            var amount =
                Number(transaction.amount || 0);

            if (!categories[category]) {
                categories[category] = 0;
            }

            categories[category] += amount;

        });


        console.log(
            "Category spending totals:",
            categories
        );


        var sortedCategories =
            Object.entries(categories)
                .sort(function(a, b) {
                    return b[1] - a[1];
                })
                .slice(0, 5);


        var totalExpense = 0;

        Object.values(categories).forEach(function(amount) {
            totalExpense += amount;
        });


        var list =
            document.getElementById(
                "topSpendingCategories"
            );

        if (!list) {
            console.error(
                "Top spending categories list not found."
            );
            return;
        }


        // Remove sample data
        list.innerHTML = "";


        sortedCategories.forEach(function(item, index) {

            var category = item[0];
            var amount = item[1];

            var percentage =
                totalExpense > 0
                    ? Math.round(
                        (amount / totalExpense) * 100
                    )
                    : 0;


            var row =
                document.createElement("li");

            row.className = "rank-item";


            var barClass = "";

            if (index === 0) {
                barClass = "progress__bar--danger";
            } else if (index === 1) {
                barClass = "progress__bar--warn";
            } else if (index === 3) {
                barClass = "progress__bar--success";
            }


            row.innerHTML = `
                <span class="rank-item__no">
                    ${index + 1}
                </span>

                <div class="rank-item__body">

                    <div class="rank-item__top">

                        <span class="rank-item__name">
                            ${category}
                        </span>

                        <span class="rank-item__pct">
                            ${percentage}%
                        </span>

                    </div>

                    <div class="progress">
                        <span
                            class="progress__bar ${barClass}"
                            style="width: ${percentage}%"
                            data-width="${percentage}">
                        </span>
                    </div>

                </div>

                <span class="rank-item__amount">
                    ₹${amount.toLocaleString("en-IN")}
                </span>
            `;


            list.appendChild(row);

        });

    })
    .catch(function(error) {

        console.error(
            "Top spending categories error:",
            error
        );

    });
}
function loadFinancialInsights() {

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

        console.log("Transactions for financial insights:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var expenses = {};
        var totalIncome = 0;
        var totalExpense = 0;

        data.transactions.forEach(function(transaction) {

            var amount = Number(transaction.amount || 0);

            if (transaction.transaction_type === "Income") {
                totalIncome += amount;
            }

            if (transaction.transaction_type === "Expense") {

                totalExpense += amount;

                var category = transaction.category || "Other";

                if (!expenses[category]) {
                    expenses[category] = 0;
                }

                expenses[category] += amount;
            }

        });


        // Find highest spending category
        var topCategory = "No spending";
        var topAmount = 0;

        Object.keys(expenses).forEach(function(category) {

            if (expenses[category] > topAmount) {
                topAmount = expenses[category];
                topCategory = category;
            }

        });


        // Savings
        var savings =
            totalIncome - totalExpense;


        // Insight 1 — highest spending category
        var title1 =
            document.getElementById("insightTitle1");

        var text1 =
            document.getElementById("insightText1");


        if (title1 && text1) {

            title1.textContent =
                topCategory + " is your top expense";

            text1.textContent =
                "You spent ₹" +
                topAmount.toLocaleString("en-IN") +
                " on " +
                topCategory +
                ".";

        }


        // Insight 2 — spending percentage
        var title2 =
            document.getElementById("insightTitle2");

        var text2 =
            document.getElementById("insightText2");


        if (title2 && text2) {

            var expensePercentage =
                totalIncome > 0
                    ? Math.round(
                        (totalExpense / totalIncome) * 100
                    )
                    : 0;


            title2.textContent =
                "Expense level";

            text2.textContent =
                "Your expenses are " +
                expensePercentage +
                "% of your total income.";

        }


        // Insight 3 — savings
        var title3 =
            document.getElementById("insightTitle3");

        var text3 =
            document.getElementById("insightText3");


        if (title3 && text3) {

            var savingsPercentage =
                totalIncome > 0
                    ? Math.round(
                        (savings / totalIncome) * 100
                    )
                    : 0;


            title3.textContent =
                "Savings status";

            text3.textContent =
                "You saved ₹" +
                savings.toLocaleString("en-IN") +
                " (" +
                savingsPercentage +
                "% of your income).";

        }


        console.log(
            "Financial insights:",
            {
                topCategory: topCategory,
                topAmount: topAmount,
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                savings: savings
            }
        );

    })
    .catch(function(error) {

        console.error(
            "Financial insights error:",
            error
        );

    });
}
function loadCategoryAnalysis() {

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

        console.log(
            "Transactions for category analysis:",
            data
        );

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var categories = {};

        data.transactions.forEach(function(transaction) {

            if (
                transaction.transaction_type !== "Expense"
            ) {
                return;
            }

            var category =
                transaction.category || "Other";

            var amount =
                Number(transaction.amount || 0);

            if (!categories[category]) {
                categories[category] = 0;
            }

            categories[category] += amount;

        });


        console.log(
            "Category analysis totals:",
            categories
        );


        var totalExpense = 0;

        Object.values(categories).forEach(function(amount) {

            totalExpense += amount;

        });


        var container =
            document.getElementById(
                "categoryAnalysis"
            );

        if (!container) {
            console.error(
                "Category analysis container not found."
            );
            return;
        }


        container.innerHTML = "";


        var sortedCategories =
            Object.entries(categories)
                .sort(function(a, b) {
                    return b[1] - a[1];
                });


        sortedCategories.forEach(function(item, index) {

            var category = item[0];

            var amount = item[1];

            var percentage =
                totalExpense > 0
                    ? Math.round(
                        (amount / totalExpense) * 100
                    )
                    : 0;


            var barClass = "";

            if (index === 0) {

                barClass =
                    "progress__bar--danger";

            } else if (index === 1) {

                barClass =
                    "progress__bar--warn";

            } else if (index === 2) {

                barClass =
                    "progress__bar--success";

            }


            var card =
                document.createElement("article");

            card.className = "cat-card";


            card.innerHTML = `

                <div class="cat-card__head">

                    <span class="cat-card__name">
                        ${category}
                    </span>

                    <span class="cat-card__pct">
                        ${percentage}%
                    </span>

                </div>


                <p class="cat-card__amount">
                    ₹${amount.toLocaleString("en-IN")}
                </p>


                <div class="progress">

                    <span
                        class="progress__bar ${barClass}"
                        style="width: ${percentage}%"
                        data-width="${percentage}">
                    </span>

                </div>

            `;


            container.appendChild(card);

        });

    })
    .catch(function(error) {

        console.error(
            "Category analysis error:",
            error
        );

    });

}
function loadIncomeSources() {

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

        console.log("Transactions for income sources:", data);

        if (!data.transactions) {
            console.error("No transactions found.");
            return;
        }

        var sources = {};

        data.transactions.forEach(function(transaction) {

            if (
                transaction.transaction_type !== "Income"
            ) {
                return;
            }

            var source =
                transaction.category || "Other";

            var amount =
                Number(transaction.amount || 0);

            if (!sources[source]) {
                sources[source] = 0;
            }

            sources[source] += amount;
        });


        console.log("Income sources:", sources);


        var totalIncome = 0;

        Object.values(sources).forEach(function(amount) {
            totalIncome += amount;
        });


        var pie =
            document.getElementById("incomeSourcesPie");

        var totalElement =
            document.getElementById("incomeSourcesTotal");

        var legend =
            document.getElementById("incomeSourcesLegend");


        if (!pie || !totalElement || !legend) {
            console.error("Income sources elements not found.");
            return;
        }


        // Update total
        totalElement.textContent =
            "₹" + totalIncome.toLocaleString("en-IN");


        // Clear old legend
        legend.innerHTML = "";


        var colors = [
            "#2563EB",
            "#16A34A",
            "#F59E0B",
            "#DC2626",
            "#7C3AED",
            "#0891B2"
        ];


        var segments = [];

        var currentAngle = 0;


        Object.entries(sources).forEach(function(item, index) {

            var source = item[0];

            var amount = item[1];

            var percentage =
                totalIncome > 0
                    ? Math.round(
                        (amount / totalIncome) * 100
                    )
                    : 0;


            var angle =
                totalIncome > 0
                    ? (amount / totalIncome) * 360
                    : 0;


            var nextAngle =
                currentAngle + angle;


            segments.push(
                colors[index % colors.length] +
                " " +
                currentAngle +
                "deg " +
                nextAngle +
                "deg"
            );


            currentAngle = nextAngle;


            // Legend
            var li =
                document.createElement("li");


            li.innerHTML = `
                <span
                    class="dot"
                    style="background:${colors[index % colors.length]}"
                ></span>

                ${source} — ₹${amount.toLocaleString("en-IN")}
                (${percentage}%)
            `;


            legend.appendChild(li);

        });


        // Update donut
        if (segments.length > 0) {

            pie.style.background =
                "conic-gradient(" +
                segments.join(", ") +
                ")";

        } else {

            pie.style.background =
                "conic-gradient(#e5e7eb 0deg 360deg)";

        }


        console.log(
            "Total income:",
            totalIncome
        );

    })
    .catch(function(error) {

        console.error(
            "Income sources error:",
            error
        );

    });

}
})();
