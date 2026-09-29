alert("add_transaction.js loaded");

const BASE_URL = "http://127.0.0.1:5000";

document
    .getElementById("txnForm")
    .addEventListener("submit", saveTransaction);

// ---------------------------
// Save Transaction
// ---------------------------
function saveTransaction(e) {

    e.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const title = document.getElementById("title").value;
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    
    const editId = localStorage.getItem("edit_transaction_id");

    const transaction_type =
        document.querySelector('input[name="type"]:checked').value === "income"
            ? "Income"
            : "Expense";

    const url = editId
    ? `${BASE_URL}/transactions/${editId}`
    : `${BASE_URL}/transactions`;

const method = editId ? "PUT" : "POST";

fetch(url, {
    method: method,
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
        title: title,
        amount: amount,
        category: category,
        transaction_type: transaction_type
    })
})
    .then(response => response.json())
    .then(data => {

        console.log("Server Response:", data);

        if (data.status === "success") {

        alert(editId
            ? "Transaction Updated Successfully!"
            : "Transaction Added Successfully!");
            localStorage.removeItem("edit_transaction_id");

            document.getElementById("txnForm").reset();

            window.location.href = "dashboard.html";

        } else if (data.msg === "Token has expired") {

            alert("Session expired. Please login again.");

            localStorage.removeItem("access_token");

            window.location.href = "login.html";

        } else {

            alert(data.message || data.msg || "Something went wrong.");

        }

    })
    .catch(error => {

        console.error(error);

        alert("Unable to connect to server.");

    });

}

// ---------------------------
// Load Transaction For Edit
// ---------------------------
async function loadTransactionForEdit() {

    const editId = localStorage.getItem("edit_transaction_id");

    if (!editId) return;

    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {

        const response = await fetch(`${BASE_URL}/transactions/${editId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log("Edit Transaction:", data);

        if (data.status === "success") {

            const t = data.transaction;

            document.getElementById("title").value = t.title;
            document.getElementById("amount").value = t.amount;
            document.getElementById("category").value = t.category;

            if (t.transaction_type === "Income") {
                document.getElementById("typeIncome").checked = true;
            } else {
                document.getElementById("typeExpense").checked = true;
            }

            if (t.date) {
                document.getElementById("date").value =
                    new Date(t.date).toISOString().split("T")[0];
            }

        }

    } catch (error) {

        console.error("Load Edit Error:", error);

    }

}

// ---------------------------
// Run when page opens
// ---------------------------
loadTransactionForEdit();