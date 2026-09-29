const token = localStorage.getItem("access_token");
console.log("Token:", token);

const form = document.getElementById("budgetForm");
const tableBody = document.getElementById("budgetTable");
console.log(tableBody);
// ------------------------------
// Load Budgets
// ------------------------------
function loadBudgets() {
    console.log("Token:", token);

    fetch(`${BASE_URL}/budget`, {

        headers: {
            "Authorization": `Bearer ${token}`
        }

    })
    .then(res => res.json())
    .then(data => {

    console.log("Received:", data);
    console.log("Budgets:", data.budgets);

    tableBody.innerHTML = "";

    if (!data.budgets) {
        console.log(data);
        alert("Not authorized");
        return;
    }
    // Calculate summary values
const budgets = data.budgets;

const total = budgets.reduce(
    (sum, budget) => sum + Number(budget.monthly_budget),
    0
);

const count = budgets.length;

const average = count > 0 ? total / count : 0;

const highest = count > 0
    ? Math.max(...budgets.map(budget => Number(budget.monthly_budget)))
    : 0;

// Update summary cards
document.getElementById("totalBudget").textContent =
    `₹${total.toLocaleString("en-IN")}`;

document.getElementById("catCount").textContent =
    count;

document.getElementById("avgBudget").textContent =
    `₹${Math.round(average).toLocaleString("en-IN")}`;

document.getElementById("highBudget").textContent =
    `₹${highest.toLocaleString("en-IN")}`;

    data.budgets.forEach(budget => {
        console.log("Adding:", budget);

        tableBody.innerHTML += `
        <tr>
            <td>${budget.category}</td>
            <td>₹${budget.monthly_budget}</td>
            <td>
    <button
        class="edit-btn"
        onclick="editBudget(${budget.id}, '${budget.category}', ${budget.monthly_budget})">
        Edit
    </button>

    <button
        class="delete-btn"
        onclick="deleteBudget(${budget.id})">
        Delete
    </button>
</td>
        </tr>`;
    });

    console.log("Final HTML:", tableBody.innerHTML);

});
}

// ------------------------------
// Save Budget
// ------------------------------
form.addEventListener("submit", function (e) {

    e.preventDefault();

    const category = document.getElementById("category").value;
    const monthly_budget = document.getElementById("monthly_budget").value;

    console.log("Category:", category);
    console.log("Budget:", monthly_budget);

    fetch(`${BASE_URL}/budget`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            category: category,
            monthly_budget: monthly_budget
        })
    })
    .then(res => res.json())
    .then(data => {

        console.log("Response:", data);

        alert(data.message);

        if (data.status === "success") {
            form.reset();
            loadBudgets();
        }

    })
    .catch(error => {
        console.error("Error:", error);
    });

});
function editBudget(id, category, monthlyBudget) {

    const newCategory = prompt(
        "Enter category:",
        category
    );

    if (newCategory === null) {
        return;
    }

    const newBudget = prompt(
        "Enter monthly budget:",
        monthlyBudget
    );

    if (newBudget === null) {
        return;
    }

    if (!newCategory.trim() || !newBudget.trim()) {
        alert("Category and budget are required.");
        return;
    }

    fetch(`${BASE_URL}/budget/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
            category: newCategory.trim(),
            monthly_budget: Number(newBudget)
        })

    })
    .then(res => res.json())
    .then(data => {

        alert(data.message);

        loadBudgets();

    })
    .catch(error => {

        console.error("Update error:", error);

        alert("Failed to update budget.");

    });
}
// ------------------------------
// Delete Budget
// ------------------------------
function deleteBudget(id){

    fetch(`${BASE_URL}/budget/${id}`,{

        method:"DELETE",

        headers:{

            "Authorization":`Bearer ${token}`

        }

    })

    .then(res=>res.json())

    .then(data=>{

        alert(data.message);

        loadBudgets();

    });

}

// ------------------------------

loadBudgets();