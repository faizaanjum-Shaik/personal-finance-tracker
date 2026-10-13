// ============================================================
// Personal Finance Tracker — script.js
// ============================================================

console.log("Finance Tracker loaded.");

// ── State ────────────────────────────────────────────────────

/** @type {Array<{id:string, description:string, amount:number, type:string, category:string, date:string}>} */
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

/**
 * Index of the transaction currently being edited.
 * -1 when no edit is in progress.
 * @type {number}
 */
let editingIndex = -1;

// ── Element references ────────────────────────────────────────

const form            = document.getElementById("transactionForm");
const list            = document.getElementById("transactionList");
const emptyMessage    = document.getElementById("emptyMessage");

const budgetInput     = document.getElementById("monthlyBudget");
const saveBudgetBtn   = document.getElementById("saveBudget");

const searchInput     = document.getElementById("searchInput");
const filterType      = document.getElementById("filterType");
const filterCategory  = document.getElementById("filterCategory");
const clearFiltersBtn = document.getElementById("clearFilters");

const editModal       = document.getElementById("editModal");
const editForm        = document.getElementById("editForm");
const cancelEditBtn   = document.getElementById("cancelEdit");

// ── Utilities ─────────────────────────────────────────────────

/**
 * Returns today's date as a YYYY-MM-DD string using local time,
 * avoiding UTC offset bugs.
 * @returns {string}
 */
function getTodayDate() {
    const d = new Date();
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day   = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Returns the YYYY-MM prefix for the current month in local time.
 * @returns {string}
 */
function getCurrentMonth() {
    return getTodayDate().slice(0, 7);
}

/**
 * Format a number as a currency string with ₹ prefix.
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
    return "₹" + value.toFixed(2);
}

/**
 * Format a YYYY-MM-DD date string into a human-readable format.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return "Date unknown";
    // Parse as local date (split avoids UTC offset issues)
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

/**
 * Save the transactions array to localStorage.
 */
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ── Budget ────────────────────────────────────────────────────

// Populate saved budget on load
budgetInput.value = monthlyBudget > 0 ? monthlyBudget : "";

/**
 * Recalculate and display all budget stats.
 */
function updateBudget() {
    const currentMonth = getCurrentMonth();

    let monthlyExpenses = 0;
    transactions.forEach(function (tx) {
        if (tx.type === "expense") {
            // Fallback for old transactions without a date
            const txDate = tx.date || getTodayDate();
            if (txDate.startsWith(currentMonth)) {
                monthlyExpenses += Number(tx.amount) || 0;
            }
        }
    });

    const remaining = monthlyBudget - monthlyExpenses;

    document.getElementById("budgetAmount").textContent    = formatCurrency(monthlyBudget);
    document.getElementById("budgetSpent").textContent     = formatCurrency(monthlyExpenses);
    document.getElementById("budgetRemaining").textContent = formatCurrency(remaining);

    const msg = document.getElementById("budgetMessage");
    msg.className = ""; // clear old classes

    if (monthlyBudget <= 0) {
        msg.textContent = "💡 Set a budget above to start tracking monthly spending.";
        msg.classList.add("unset");
    } else if (remaining < 0) {
        msg.textContent =
            "⚠️ Budget exceeded by " + formatCurrency(Math.abs(remaining)) + " this month!";
        msg.classList.add("exceeded");
    } else if (remaining === 0) {
        msg.textContent = "⚠️ You have used your entire budget this month.";
        msg.classList.add("warning");
    } else if (monthlyExpenses / monthlyBudget >= 0.8) {
        msg.textContent =
            "⚠️ You have used " +
            Math.round((monthlyExpenses / monthlyBudget) * 100) +
            "% of your budget. Spend carefully!";
        msg.classList.add("warning");
    } else {
        msg.textContent = "✅ You are within your budget!";
        msg.classList.add("ok");
    }
}

saveBudgetBtn.addEventListener("click", function () {
    const raw = budgetInput.value.trim();
    const amount = Number(raw);

    if (raw === "" || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid budget greater than ₹0.");
        return;
    }

    monthlyBudget = amount;
    localStorage.setItem("monthlyBudget", String(monthlyBudget));
    updateBudget();
});

// ── Dashboard ─────────────────────────────────────────────────

/**
 * Recalculate income, expenses, and balance; update the dashboard cards.
 */
function updateDashboard() {
    let income   = 0;
    let expenses = 0;

    transactions.forEach(function (tx) {
        const amount = Number(tx.amount) || 0;
        if (tx.type === "income") {
            income += amount;
        } else {
            expenses += amount;
        }
    });

    document.getElementById("income").textContent   = formatCurrency(income);
    document.getElementById("expenses").textContent = formatCurrency(expenses);

    const balanceEl = document.getElementById("balance");
    const balance   = income - expenses;
    balanceEl.textContent = formatCurrency(balance);
    // Colour the balance card value based on positive/negative
    balanceEl.style.color = balance < 0 ? "#dc2626" : "";

    updateBudget();
}

// ── Transaction list rendering ────────────────────────────────

/**
 * Build and return a filtered array of { tx, originalIndex } pairs
 * based on the current search and filter values.
 * @returns {Array<{tx: object, originalIndex: number}>}
 */
function getFilteredTransactions() {
    const query    = searchInput.value.trim().toLowerCase();
    const typeVal  = filterType.value;
    const catVal   = filterCategory.value;

    return transactions
        .map(function (tx, i) { return { tx: tx, originalIndex: i }; })
        .filter(function (entry) {
            const tx = entry.tx;

            const matchesSearch =
                !query ||
                tx.description.toLowerCase().includes(query);

            const matchesType =
                typeVal === "all" || tx.type === typeVal;

            const matchesCategory =
                catVal === "all" || tx.category === catVal;

            return matchesSearch && matchesType && matchesCategory;
        });
}

/**
 * Render the transaction list using the current filters.
 */
function renderTransactions() {
    list.innerHTML = "";
    const filtered = getFilteredTransactions();

    if (filtered.length === 0) {
        emptyMessage.hidden = false;
    } else {
        emptyMessage.hidden = true;

        // Render newest first for better UX
        const reversedFiltered = filtered.slice().reverse();

        reversedFiltered.forEach(function (entry) {
            const tx    = entry.tx;
            const index = entry.originalIndex;
            const amount = Number(tx.amount) || 0;

            const item = document.createElement("li");

            // Info block
            const info = document.createElement("div");
            info.className = "tx-info";

            const descEl = document.createElement("div");
            descEl.className = "tx-description";
            descEl.textContent = tx.description;

            const metaEl = document.createElement("div");
            metaEl.className = "tx-meta";
            metaEl.textContent =
                (tx.category || "Other") + " · " + formatDate(tx.date || getTodayDate());

            info.appendChild(descEl);
            info.appendChild(metaEl);

            // Badge
            const badge = document.createElement("span");
            badge.className =
                "tx-badge " +
                (tx.type === "income" ? "badge-income" : "badge-expense");
            badge.textContent = tx.type === "income" ? "Income" : "Expense";

            // Amount
            const amountEl = document.createElement("span");
            amountEl.className =
                "tx-amount " + (tx.type === "income" ? "income" : "expense");
            amountEl.textContent =
                (tx.type === "income" ? "+" : "−") + formatCurrency(amount);

            // Actions
            const actions = document.createElement("div");
            actions.className = "tx-actions";

            const editBtn = document.createElement("button");
            editBtn.textContent = "✏️ Edit";
            editBtn.type = "button";
            editBtn.className = "btn-edit";
            editBtn.setAttribute("aria-label", "Edit transaction: " + tx.description);
            editBtn.addEventListener("click", function () {
                openEditModal(index);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️ Delete";
            deleteBtn.type = "button";
            deleteBtn.className = "btn-delete";
            deleteBtn.setAttribute("aria-label", "Delete transaction: " + tx.description);
            deleteBtn.addEventListener("click", function () {
                deleteTransaction(index, tx.description);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(info);
            item.appendChild(badge);
            item.appendChild(amountEl);
            item.appendChild(actions);

            list.appendChild(item);
        });
    }
}

/**
 * Full refresh: update dashboard totals, re-render the list, and update charts.
 */
function refresh() {
    updateDashboard();
    renderTransactions();
    renderCharts();
}

// ── Add transaction ───────────────────────────────────────────

// Pre-fill date input with today
document.getElementById("date").value = getTodayDate();

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = document.getElementById("description").value.trim();
    const amountText  = document.getElementById("amount").value.trim();
    const type        = document.getElementById("type").value;
    const category    = document.getElementById("category").value;
    const dateVal     = document.getElementById("date").value;

    const amount = Number(amountText);

    if (
        description === "" ||
        amountText === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        category === "" ||
        dateVal === ""
    ) {
        alert("Please fill in all fields with valid values.");
        return;
    }

    transactions.push({
        description: description,
        amount:      amount,
        type:        type,
        category:    category,
        date:        dateVal
    });

    saveTransactions();
    refresh();
    form.reset();
    // Restore today's date after reset
    document.getElementById("date").value = getTodayDate();
});

// ── Delete transaction ────────────────────────────────────────

/**
 * Delete a transaction by its index in the transactions array.
 * @param {number} index
 * @param {string} description
 */
function deleteTransaction(index, description) {
    if (!confirm('Delete "' + description + '"? This cannot be undone.')) return;
    transactions.splice(index, 1);
    saveTransactions();
    refresh();
}

// ── Edit transaction (modal) ──────────────────────────────────

/**
 * Open the edit modal and populate it with the transaction at `index`.
 * @param {number} index
 */
function openEditModal(index) {
    const tx = transactions[index];
    if (!tx) return;

    editingIndex = index;

    document.getElementById("editDescription").value = tx.description;
    document.getElementById("editAmount").value      = tx.amount;
    document.getElementById("editType").value        = tx.type;
    document.getElementById("editCategory").value    = tx.category || "Other";
    document.getElementById("editDate").value        = tx.date || getTodayDate();

    editModal.hidden = false;
    document.getElementById("editDescription").focus();
}

/** Close the edit modal without saving. */
function closeEditModal() {
    editModal.hidden = true;
    editingIndex = -1;
}

cancelEditBtn.addEventListener("click", closeEditModal);

// Close modal when clicking the backdrop
editModal.addEventListener("click", function (event) {
    if (event.target === editModal) closeEditModal();
});

// Close modal on Escape key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !editModal.hidden) closeEditModal();
});

editForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (editingIndex < 0 || editingIndex >= transactions.length) {
        closeEditModal();
        return;
    }

    const newDescription = document.getElementById("editDescription").value.trim();
    const newAmountText  = document.getElementById("editAmount").value.trim();
    const newType        = document.getElementById("editType").value;
    const newCategory    = document.getElementById("editCategory").value;
    const newDate        = document.getElementById("editDate").value;

    const newAmount = Number(newAmountText);

    if (
        newDescription === "" ||
        newAmountText === "" ||
        !Number.isFinite(newAmount) ||
        newAmount <= 0 ||
        newCategory === "" ||
        newDate === ""
    ) {
        alert("Please fill in all fields with valid values.");
        return;
    }

    transactions[editingIndex] = {
        ...transactions[editingIndex],
        description: newDescription,
        amount:      newAmount,
        type:        newType,
        category:    newCategory,
        date:        newDate
    };

    saveTransactions();
    closeEditModal();
    refresh();
});

// ── Search & filters ──────────────────────────────────────────

searchInput.addEventListener("input", renderTransactions);
filterType.addEventListener("change", renderTransactions);
filterCategory.addEventListener("change", renderTransactions);

clearFiltersBtn.addEventListener("click", function () {
    searchInput.value    = "";
    filterType.value     = "all";
    filterCategory.value = "all";
    renderTransactions();
});

// ── Charts ────────────────────────────────────────────────────

/**
 * One colour per category — consistent across redraws.
 */
var CATEGORY_COLORS = {
    Food:          "#f97316",
    Education:     "#8b5cf6",
    Travel:        "#06b6d4",
    Shopping:      "#ec4899",
    Bills:         "#eab308",
    Salary:        "#22c55e",
    Healthcare:    "#14b8a6",
    Entertainment: "#6366f1",
    Other:         "#94a3b8"
};

/** "month" = current month only | "all" = all-time */
var chartPeriod = "month";

/** Chart.js instances — destroyed and recreated on each update. */
var categoryChartInstance = null;
var monthlyChartInstance  = null;

/**
 * Aggregate expenses by category for the selected period.
 * @returns {{ labels: string[], data: number[], colors: string[] }}
 */
function getCategoryChartData() {
    var currentMonth = getCurrentMonth();
    var totals = {};

    transactions.forEach(function (tx) {
        if (tx.type !== "expense") return;
        var txDate = tx.date || getTodayDate();
        if (chartPeriod === "month" && !txDate.startsWith(currentMonth)) return;
        var cat = tx.category || "Other";
        totals[cat] = (totals[cat] || 0) + (Number(tx.amount) || 0);
    });

    var labels = Object.keys(totals);
    var data   = labels.map(function (l) { return totals[l]; });
    var colors = labels.map(function (l) { return CATEGORY_COLORS[l] || "#94a3b8"; });

    return { labels: labels, data: data, colors: colors };
}

/**
 * Build income and expense totals for the last 6 calendar months.
 * @returns {{ labels: string[], income: number[], expenses: number[] }}
 */
function getMonthlyChartData() {
    var months = [];
    var now = new Date();

    for (var i = 5; i >= 0; i--) {
        var d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
        var year  = d.getFullYear();
        var mon   = String(d.getMonth() + 1).padStart(2, "0");
        months.push({
            key:   year + "-" + mon,
            label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        });
    }

    var incomeMap  = {};
    var expenseMap = {};
    months.forEach(function (m) {
        incomeMap[m.key]  = 0;
        expenseMap[m.key] = 0;
    });

    transactions.forEach(function (tx) {
        var txDate   = tx.date || getTodayDate();
        var monthKey = txDate.slice(0, 7);
        if (!incomeMap.hasOwnProperty(monthKey)) return;
        if (tx.type === "income") {
            incomeMap[monthKey]  += Number(tx.amount) || 0;
        } else {
            expenseMap[monthKey] += Number(tx.amount) || 0;
        }
    });

    return {
        labels:   months.map(function (m) { return m.label; }),
        income:   months.map(function (m) { return incomeMap[m.key]; }),
        expenses: months.map(function (m) { return expenseMap[m.key]; })
    };
}

/**
 * Draw (or redraw) the category doughnut chart.
 */
function renderCategoryChart() {
    var canvas   = document.getElementById("categoryChart");
    var emptyMsg = document.getElementById("categoryChartEmpty");
    var d        = getCategoryChartData();

    if (d.labels.length === 0) {
        canvas.hidden   = true;
        emptyMsg.hidden = false;
        return;
    }

    canvas.hidden   = false;
    emptyMsg.hidden = true;

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels:   d.labels,
            datasets: [{
                data:            d.data,
                backgroundColor: d.colors,
                borderWidth:     2,
                borderColor:     "#ffffff"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { font: { size: 11 }, padding: 14, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                            var pct = total > 0
                                ? " (" + Math.round((ctx.parsed / total) * 100) + "%)"
                                : "";
                            return " " + ctx.label + ": " + formatCurrency(ctx.parsed) + pct;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Draw (or redraw) the monthly income-vs-expenses bar chart.
 */
function renderMonthlyChart() {
    var canvas   = document.getElementById("monthlyChart");
    var emptyMsg = document.getElementById("monthlyChartEmpty");
    var d        = getMonthlyChartData();

    var hasData = d.income.some(function (v) { return v > 0; }) ||
                  d.expenses.some(function (v) { return v > 0; });

    if (!hasData) {
        canvas.hidden   = true;
        emptyMsg.hidden = false;
        return;
    }

    canvas.hidden   = false;
    emptyMsg.hidden = true;

    if (monthlyChartInstance) monthlyChartInstance.destroy();

    monthlyChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: d.labels,
            datasets: [
                {
                    label:           "Income",
                    data:            d.income,
                    backgroundColor: "#22c55e",
                    borderRadius:    5
                },
                {
                    label:           "Expenses",
                    data:            d.expenses,
                    backgroundColor: "#ef4444",
                    borderRadius:    5
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { font: { size: 11 }, padding: 14, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return " " + ctx.dataset.label + ": " + formatCurrency(ctx.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: function (v) { return "₹" + v; } },
                    grid: { color: "#e4eaf4" }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Render both charts. Skips gracefully if Chart.js did not load
 * (e.g. no internet on first visit and not yet cached).
 */
function renderCharts() {
    if (typeof Chart === "undefined") return;
    renderCategoryChart();
    renderMonthlyChart();
}

// Period-toggle button (affects category chart only)
var toggleChartPeriodBtn = document.getElementById("toggleChartPeriod");
var chartPeriodLabel     = document.getElementById("chartPeriodLabel");

toggleChartPeriodBtn.addEventListener("click", function () {
    if (chartPeriod === "month") {
        chartPeriod = "all";
        chartPeriodLabel.textContent     = "Category chart: All Time";
        toggleChartPeriodBtn.textContent = "Switch to This Month";
    } else {
        chartPeriod = "month";
        chartPeriodLabel.textContent     = "Category chart: This Month";
        toggleChartPeriodBtn.textContent = "Switch to All Time";
    }
    renderCategoryChart();
});

// ── Initial render ────────────────────────────────────────────

refresh();
renderCharts();
