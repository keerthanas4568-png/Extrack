/* ============================================================
   transactions.js — add_transaction page behavior
   - Sidebar drawer + dark mode (dashboard shell)
   - Type -> category switching
   - Live preview card
   - Client-side validation (via Validators)
   - Save (spinner + success), reset, receipt UI
   No backend, no fetch().
   ============================================================ */
const token = localStorage.getItem("access_token");

const tableBody = document.getElementById("txnTableBody");

console.log("Token:", token);
console.log("Table:", tableBody);
   (function () {
  "use strict";

  /* Category options per transaction type. */
  var CATEGORIES = {
    income: ["Salary", "Freelance", "Investment", "Bonus", "Other"],
    expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Medical", "Education", "Others"]
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupSidebar();
    setupTheme();
    setupCategorySwitch();
    setupLivePreview();
    setupReceipt();
    setupForm();
    setupTransactionsPage();

    setupEditModal();
});
  /* ---------- Sidebar drawer (mobile/tablet) ---------- */
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
      if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) close();
    });
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
    try { stored = localStorage.getItem("et-theme"); } catch (e) {}
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

  /* ---------- Category list depends on type ---------- */
  function setupCategorySwitch() {
    var category = document.getElementById("category");
    var typeInputs = document.querySelectorAll('input[name="type"]');
    if (!category) return;

    function render(type) {
      var list = CATEGORIES[type] || [];
      category.innerHTML = '<option value="" disabled selected>Select category</option>';
      list.forEach(function (name) {
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        category.appendChild(opt);
      });
    }

    typeInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        if (input.checked) render(input.value);
      });
    });

    /* Initial population based on the checked type. */
    var checked = document.querySelector('input[name="type"]:checked');
    render(checked ? checked.value : "expense");
  }

  /* ---------- Live preview ---------- */
  function setupLivePreview() {
    var els = {
      type: document.querySelector('input[name="type"]:checked'),
      category: document.getElementById("category"),
      amount: document.getElementById("amount"),
      date: document.getElementById("date"),
      method: document.getElementById("method"),
      badge: document.getElementById("pvBadge"),
      big: document.getElementById("pvBig"),
      pvType: document.getElementById("pvType"),
      pvCategory: document.getElementById("pvCategory"),
      pvAmount: document.getElementById("pvAmount"),
      pvDate: document.getElementById("pvDate"),
      pvMethod: document.getElementById("pvMethod")
    };
    if (!els.amount) return;

    function formatMoney(n) {
      var num = Number(n);
      if (isNaN(num) || num <= 0) return "₹0.00";
      return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function update() {
      var type = document.querySelector('input[name="type"]:checked');
      var typeVal = type ? type.value : "expense";

      els.badge.textContent = typeVal === "income" ? "Income" : "Expense";
      els.badge.className = "preview-badge " + (typeVal === "income" ? "preview-badge--income" : "preview-badge--expense");

      var amount = els.amount.value.trim();
      els.big.textContent = formatMoney(amount);
      els.pvType.textContent = typeVal === "income" ? "Income" : "Expense";
      els.pvCategory.textContent = els.category && els.category.value ? els.category.value : "—";
      els.pvAmount.textContent = formatMoney(amount);
      els.pvDate.textContent = els.date && els.date.value ? els.date.value : "—";
      els.pvMethod.textContent = els.method && els.method.value ? els.method.value : "—";
    }

    /* Update on any change. */
    document.getElementById("txnForm").addEventListener("input", update);
    document.getElementById("txnForm").addEventListener("change", update);

    /* Default date = today. */
    if (els.date && !els.date.value) {
      var today = new Date();
      var iso = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
      els.date.value = iso;
    }
    update();
  }

  /* ---------- Receipt upload (UI only) ---------- */
  function setupReceipt() {
    var input = document.getElementById("receipt");
    var name = document.getElementById("receiptName");
    var drop = input ? input.closest(".upload") : null;
    if (!input || !name) return;

    input.addEventListener("change", function () {
      name.textContent = input.files && input.files.length
        ? "Selected: " + input.files[0].name
        : "";
    });

    if (!drop) return;
    ["dragover", "dragenter"].forEach(function (evt) {
      drop.addEventListener(evt, function (e) {
        e.preventDefault();
        drop.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      drop.addEventListener(evt, function (e) {
        e.preventDefault();
        drop.classList.remove("is-dragover");
      });
    });
  }

  /* ---------- Form validation + submit ---------- */
  function setupForm() {
    var form = document.getElementById("txnForm");
    if (!form) return;

    var refs = {
      type: document.querySelector('input[name="type"]:checked'),
      category: document.getElementById("category"),
      amount: document.getElementById("amount"),
      date: document.getElementById("date"),
      method: document.getElementById("method"),
      typeError: document.getElementById("typeError"),
      categoryError: document.getElementById("categoryError"),
      amountError: document.getElementById("amountError"),
      dateError: document.getElementById("dateError"),
      methodError: document.getElementById("methodError"),
      saveBtn: document.getElementById("saveBtn"),
      resetBtn: document.getElementById("resetBtn")
    };

    function showError(el, errorEl, message) {
      if (el && el.classList) el.classList.add("field--invalid");
      if (el && el.setAttribute) el.setAttribute("aria-invalid", "true");
      if (errorEl) errorEl.textContent = message;
    }
    function clearError(el, errorEl) {
      if (el && el.classList) el.classList.remove("field--invalid");
      if (el && el.removeAttribute) el.removeAttribute("aria-invalid");
      if (errorEl) errorEl.textContent = "";
    }

    /* Clear errors as the user fixes fields. */
    ["category", "amount", "date", "method"].forEach(function (key) {
      var el = refs[key];
      if (!el) return;
      el.addEventListener("input", function () { clearError(el, refs[key + "Error"]); });
      el.addEventListener("change", function () { clearError(el, refs[key + "Error"]); });
    });
    document.querySelectorAll('input[name="type"]').forEach(function (r) {
      r.addEventListener("change", function () { clearError(null, refs.typeError); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var typeVal = document.querySelector('input[name="type"]:checked');
      typeVal = typeVal ? typeVal.value : "";

      var checks = {
        type: window.Validators.validateRequired(typeVal, "Transaction type"),
        category: window.Validators.validateRequired(refs.category.value, "Category"),
        amount: window.Validators.validateAmount(refs.amount.value),
        date: window.Validators.validateDate(refs.date.value),
        method: window.Validators.validateRequired(refs.method.value, "Payment method")
      };

      var firstInvalid = null;
      Object.keys(checks).forEach(function (key) {
        var r = checks[key];
        var el = refs[key];
        if (!r.valid) {
          showError(el, refs[key + "Error"], r.message);
          if (!firstInvalid) firstInvalid = el;
        } else {
          clearError(el, refs[key + "Error"]);
        }
      });

      if (firstInvalid) {
        if (firstInvalid.focus) firstInvalid.focus();
        return;
      }

      /* Valid — simulate save with a spinner. */
      setLoading(refs.saveBtn, true);
      window.setTimeout(function () {
        setLoading(refs.saveBtn, false);
        showSuccess(form, refs.saveBtn);
      }, 1400);
    });

    /* Reset clears errors, preview and re-applies defaults. */
    if (refs.resetBtn) {
      refs.resetBtn.addEventListener("click", function () {
        window.setTimeout(function () {
          ["type", "category", "amount", "date", "method"].forEach(function (key) {
            clearError(refs[key], refs[key + "Error"]);
          });
          var name = document.getElementById("receiptName");
          if (name) name.textContent = "";
          var ev = new Event("change", { bubbles: true });
          form.dispatchEvent(ev);
        }, 0);
      });
    }
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle("btn--loading", loading);
    btn.disabled = loading;
    if (loading) btn.setAttribute("aria-busy", "true");
    else btn.removeAttribute("aria-busy");
  }

  function showSuccess(form, btn) {
    var label = btn.querySelector(".btn__label");
    if (label) label.textContent = "Saved!";
    var note = document.createElement("p");
    note.className = "txn-success";
    note.setAttribute("role", "status");
    note.textContent = "Transaction saved successfully.";
    form.appendChild(note);
  }

  /* ---------- Transactions list page (filter / sort / paginate) ---------- */
  function setupTransactionsPage() {
    var tbody = document.getElementById("txnTableBody");
    if (!tbody) return;

    var rows = [];
    var search = document.getElementById("txnSearch");
    var segBtns = document.querySelectorAll(".seg__btn");
    var catFilter = document.getElementById("catFilter");
    var dateFrom = document.getElementById("dateFrom");
    var dateTo = document.getElementById("dateTo");
    var sortBy = document.getElementById("sortBy");
    var pagination = document.getElementById("pagination");
    var prevBtn = document.getElementById("prevPage");
    var nextBtn = document.getElementById("nextPage");
    var emptyState = document.getElementById("emptyState");
    var tableCard = tbody.closest(".dash__panel");
    var resultCount = document.getElementById("resultCount");
    var exportBtn = document.getElementById("exportBtn");

    var PAGE_SIZE = 4;
    var currentPage = 1;
    var typeFilter = "all";
    function loadTransactionsFromAPI() {

    fetch(`${BASE_URL}/transactions`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {

        console.log("Transactions response:", data);

        if (!data.transactions) {
            console.log("No transactions found");
            return;
        }

        tbody.innerHTML = "";

        data.transactions.forEach(function (transaction) {

            var row = document.createElement("tr");

            row.setAttribute("data-type", transaction.transaction_type || "");
            row.setAttribute("data-category", transaction.category || "");
            row.setAttribute("data-amount", transaction.amount || 0);
            row.setAttribute("data-date", transaction.date || "");

            row.innerHTML = `
                <td>${transaction.date || ""}</td>
                <td>${transaction.title || ""}</td>
                <td>${transaction.category || ""}</td>
                <td>${transaction.payment_method || ""}</td>
                <td>${transaction.transaction_type || ""}</td>
                <td class="ta-right">
                    ₹${Number(transaction.amount || 0).toLocaleString("en-IN")}
                </td>
                <td>Completed</td>
              <td>
                 <button onclick="editTransaction(${transaction.id})">
                     Edit
                 </button>

                 <button onclick="deleteTransaction(${transaction.id})">
                     Delete
                 </button>
              </td>  
            `;

            tbody.appendChild(row);
        });

        rows = Array.prototype.slice.call(
            tbody.querySelectorAll("tr")
        );

        console.log("Rows loaded:", rows.length);

        currentPage = 1;
        render();
    })
   .catch(function(error) {
    console.error("GET TRANSACTIONS ERROR:", error);
}); 
}

    function getFiltered() {
      var q = (search && search.value || "").trim().toLowerCase();
      var cat = catFilter ? catFilter.value : "all";
      var from = dateFrom && dateFrom.value ? new Date(dateFrom.value) : null;
      var to = dateTo && dateTo.value ? new Date(dateTo.value) : null;
      if (to) to.setHours(23, 59, 59, 999);

      return rows.filter(function (row) {
        var type = row.getAttribute("data-type");
        var category = row.getAttribute("data-category");
        var amount = Number(row.getAttribute("data-amount"));
        var date = new Date(row.getAttribute("data-date"));

        if (typeFilter !== "all" && type !== typeFilter) return false;
        if (cat !== "all" && category !== cat) return false;
        if (from && date < from) return false;
        if (to && date > to) return false;
        if (q) {
          var text = (row.textContent || "").toLowerCase();
          if (text.indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function sortRows(list) {
      var mode = sortBy ? sortBy.value : "latest";
      var copy = list.slice();
      copy.sort(function (a, b) {
        var da = new Date(a.getAttribute("data-date"));
        var db = new Date(b.getAttribute("data-date"));
        var na = Number(a.getAttribute("data-amount"));
        var nb = Number(b.getAttribute("data-amount"));
        if (mode === "latest") return db - da;
        if (mode === "oldest") return da - db;
        if (mode === "high") return nb - na;
        if (mode === "low") return na - nb;
        return 0;
      });
      return copy;
    }

    function render() {
      var filtered = getFiltered();
      var sorted = sortRows(filtered);
      var totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      var start = (currentPage - 1) * PAGE_SIZE;
      var pageRows = sorted.slice(start, start + PAGE_SIZE);

      /* Show only the rows for the current page. */
      rows.forEach(function (row) { row.style.display = "none"; });
      pageRows.forEach(function (row) { row.style.display = ""; });

      /* Empty state. */
      if (emptyState && tableCard) {
        var isEmpty = sorted.length === 0;
        emptyState.hidden = !isEmpty;
        tableCard.hidden = isEmpty;
      }

      /* Result count text. */
      if (resultCount) {
        resultCount.textContent = sorted.length + " result" + (sorted.length === 1 ? "" : "s");
      }

      /* Pagination + summary cards. */
      renderPagination(totalPages);
      updateSummary(filtered);
    }

    function renderPagination(totalPages) {
      if (!pagination) return;
      pagination.querySelectorAll(".page-btn[data-page]").forEach(function (btn) {
        var p = Number(btn.getAttribute("data-page"));
        btn.style.display = p > totalPages ? "none" : "";
        btn.classList.toggle("is-active", p === currentPage);
      });
      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    }

    function updateSummary(list) {
      var count = list.length;
      var income = 0;
      var expense = 0;
      list.forEach(function (row) {
        var amt = Number(row.getAttribute("data-amount"));
        if (row.getAttribute("data-type") === "income") income += amt;
        else expense += amt;
      });
      var set = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      var money = function (n) {
        return "₹" + n.toLocaleString("en-IN");
      };
      set("sumCount", count);
      set("sumIncome", money(income));
      set("sumExpense", money(expense));
      set("sumBalance", money(income - expense));
    }

    /* Toolbar events */
    if (search) search.addEventListener("input", function () { currentPage = 1; render(); });
    if (catFilter) catFilter.addEventListener("change", function () { currentPage = 1; render(); });
    if (dateFrom) dateFrom.addEventListener("change", function () { currentPage = 1; render(); });
    if (dateTo) dateTo.addEventListener("change", function () { currentPage = 1; render(); });
    if (sortBy) sortBy.addEventListener("change", render);

    segBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        segBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        typeFilter = btn.getAttribute("data-filter");
        currentPage = 1;
        render();
      });
    });

    if (prevBtn) prevBtn.addEventListener("click", function () { currentPage--; render(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { currentPage++; render(); });
    pagination && pagination.querySelectorAll(".page-btn[data-page]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentPage = Number(btn.getAttribute("data-page"));
        render();
      });
    });

    if (exportBtn) {
    exportBtn.addEventListener("click", function () {

        var filtered = getFiltered();
        var sorted = sortRows(filtered);

        if (sorted.length === 0) {
            alert("No transactions to export.");
            return;
        }

        var csv = [];

        // CSV header
        csv.push([
            "Date",
            "Title",
            "Category",
            "Payment Method",
            "Transaction Type",
            "Amount",
            "Status"
        ].join(","));

        // Transaction rows
        sorted.forEach(function (row) {

            var cells = row.querySelectorAll("td");

            var date = cells[0] ? cells[0].textContent.trim() : "";
            var title = cells[1] ? cells[1].textContent.trim() : "";
            var category = cells[2] ? cells[2].textContent.trim() : "";
            var paymentMethod = cells[3] ? cells[3].textContent.trim() : "";
            var transactionType = cells[4] ? cells[4].textContent.trim() : "";
            var amountText = cells[5] ? cells[5].textContent.trim() : "";
            var amount = amountText
                .replace("₹", "")
                .replace(/,/g, "")
                .trim();
            var status = cells[6] ? cells[6].textContent.trim() : "";

            function escapeCSV(value) {
                value = String(value).replace(/"/g, '""');
                return '"' + value + '"';
            }

            csv.push([
                escapeCSV(date),
                escapeCSV(title),
                escapeCSV(category),
                escapeCSV(paymentMethod),
                escapeCSV(transactionType),
                escapeCSV(amount),
                escapeCSV(status)
            ].join(","));
        });

        // Create CSV file
        var csvContent = csv.join("\n");

        var blob = new Blob(
            [csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        var url = URL.createObjectURL(blob);

        var link = document.createElement("a");
        link.href = url;
        var today = new Date().toISOString().split("T")[0];

        link.download = "expense_transactions_" + today + ".csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    });
}
    loadTransactionsFromAPI();
  }
  function deleteTransaction(id) {

    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    fetch(`${BASE_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("Delete response:", data);

        alert(data.message || "Transaction deleted successfully");

        // Reload transactions
        location.reload();

    })
    .catch(function(error) {
        console.error("Delete error:", error);
        alert("Failed to delete transaction");
    });
    loadTransactionsFromAPI();
}
window.deleteTransaction = deleteTransaction;
function editTransaction(id) {

    var tbody = document.getElementById("txnTableBody");

    if (!tbody) {
        console.error("Transaction table not found");
        return;
    }

    var rows = Array.prototype.slice.call(
        tbody.querySelectorAll("tr")
    );

    var row = rows.find(function(row) {

        return row.querySelector(
            `button[onclick="editTransaction(${id})"]`
        );

    });

    if (!row) {
        console.error("Transaction row not found:", id);
        return;
    }

    var cells = row.querySelectorAll("td");

    document.getElementById("editTransactionId").value = id;

    document.getElementById("editTitle").value =
        cells[1].textContent.trim();

    document.getElementById("editAmount").value =
        row.getAttribute("data-amount") || "0";

    document.getElementById("editCategory").value =
        row.getAttribute("data-category") || "";

    document.getElementById("editType").value =
        row.getAttribute("data-type") || "expense";

    document.getElementById("editModal").hidden = false;
}

window.editTransaction = editTransaction;
document.getElementById("editTransactionForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        var id = document.getElementById("editTransactionId").value;
        var title = document.getElementById("editTitle").value.trim();
        var amount = Number(document.getElementById("editAmount").value);
        var category = document.getElementById("editCategory").value;
        var transactionType = document.getElementById("editType").value;

        console.log("Updating transaction:", {
            id: id,
            title: title,
            amount: amount,
            category: category,
            transaction_type: transactionType
        });

        fetch(`${BASE_URL}/transactions/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                amount: amount,
                category: category,
                transaction_type: transactionType
            })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {

            console.log("UPDATE RESPONSE:", data);

            if (data.status === "success") {

                alert("Transaction updated successfully!");

                document.getElementById("editModal").hidden = true;

                window.location.reload(); 

            } else {

                alert(data.message || "Update failed.");

            }
        })
        .catch(function (error) {

          console.error("UPDATE ERROR:", error);

          alert("Update failed. Check the console.");

        });
    }
);
document.getElementById("cancelEdit").addEventListener(
    "click",
    function () {
        document.getElementById("editModal").hidden = true;
    }
);
function setupEditModal() {

    var editForm = document.getElementById("editTransactionForm");
    var cancelButton = document.getElementById("cancelEdit");

    if (!editForm) {
        console.error("Edit form not found!");
        return;
    }

    editForm.addEventListener("submit", function (event) {

        event.preventDefault();

        var id = document.getElementById("editTransactionId").value;
        var title = document.getElementById("editTitle").value.trim();

        var amount = Number(
            document.getElementById("editAmount").value
        );

        var category =
            document.getElementById("editCategory").value;

        var transactionType =
            document.getElementById("editType").value;

        console.log("Updating:", {
            id: id,
            title: title,
            amount: amount,
            category: category,
            transaction_type: transactionType
        });

        fetch(`${BASE_URL}/transactions/${id}`, {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                title: title,
                amount: amount,
                category: category,
                transaction_type: transactionType
            })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {

            console.log("UPDATE RESPONSE:", data);

            if (data.status === "success") {

                alert("Transaction updated successfully!");

                document.getElementById("editModal").hidden = true;

                // Reload the page to show the updated transaction
                window.location.reload();

            } else {

                alert(data.message || "Update failed.");

            }
        })
        .catch(function (error) {

            console.error("UPDATE ERROR:", error);

            alert("Update failed. Check the console.");

        });

    });

    if (cancelButton) {

        cancelButton.addEventListener("click", function () {

            document.getElementById("editModal").hidden = true;

        });

    }
}
}());
