/**
 * BuildTrack — Expenses Controller
 * File: js/expenses.js
 * Responsibility: Track expenses, link to projects, filter by category/search, safe DOM rendering
 */

(() => {
    "use strict";

    // 1. Verify storage system
    const storage = window.BuildTrackStorage;
    const keys = window.BUILDTRACK_STORAGE_KEYS;

    if (!storage || !keys) {
        console.error("BuildTrack storage is not available!");
        return;
    }

    // 2. DOM Elements
    const expenseForm = document.querySelector("#expense-form");
    const formHeading = document.querySelector("#expense-form-heading");
    const projectInput = document.querySelector("#expense-project");
    const descriptionInput = document.querySelector("#expense-description");
    const amountInput = document.querySelector("#expense-amount");
    const categoryInput = document.querySelector("#expense-category");
    const dateInput = document.querySelector("#expense-date");
    const paymentMethodInput = document.querySelector("#expense-payment-method");

    const expenseList = document.querySelector("#expense-list");
    const expenseMessage = document.querySelector("#expense-message");
    const saveButton = document.querySelector("#save-expense-button");
    const cancelButton = document.querySelector("#cancel-expense-edit");

    const searchInput = document.querySelector("#expense-search");
    const categoryFilter = document.querySelector("#expense-filter-category");

    // 3. Application State
    let expenses = storage.get(keys.EXPENSES, []);
    let projects = storage.get(keys.PROJECTS, []);
    let editingExpenseId = null;

    const validCategories = [
        "Materials",
        "Labour",
        "Equipment",
        "Transportation",
        "Utilities",
        "Rent",
        "Food",
        "Other"
    ];

    // 4. Utility: Generate unique ID
    function generateExpenseId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "expense-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    // 5. Message Display
    function showMessage(text, type = "success") {
        if (!expenseMessage) return;
        expenseMessage.textContent = text;
        expenseMessage.className = "form-message message-" + type;
        expenseMessage.hidden = false;
    }

    function clearMessage() {
        if (!expenseMessage) return;
        expenseMessage.textContent = "";
        expenseMessage.hidden = true;
    }

    // 6. Save expenses
    function saveExpenses() {
        const saved = storage.save(keys.EXPENSES, expenses);
        if (!saved) {
            showMessage("Unable to save expense data to storage.", "error");
        }
        return saved;
    }

    // 7. Load Projects into Select Dropdown
    function loadProjectOptions(selectedId = "") {
        if (!projectInput) return;

        projects = storage.get(keys.PROJECTS, []);
        projectInput.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = projects.length > 0 ? "Select a project *" : "No projects available (Create one first)";
        projectInput.appendChild(defaultOption);

        projects.forEach(project => {
            const opt = document.createElement("option");
            opt.value = project.id;
            opt.textContent = project.name;
            if (project.id === selectedId) {
                opt.selected = true;
            }
            projectInput.appendChild(opt);
        });

        projectInput.disabled = projects.length === 0;
    }

    // Helper to find project name
    function getProjectName(projectId) {
        const found = projects.find(p => p.id === projectId);
        return found ? found.name : "Unassigned / Deleted Project";
    }

    // 8. Reset Form
    function resetForm() {
        if (!expenseForm) return;

        expenseForm.reset();
        editingExpenseId = null;

        if (formHeading) {
            formHeading.textContent = "Add New Expense";
        }

        if (saveButton) {
            saveButton.textContent = "Save Expense";
        }

        if (cancelButton) {
            cancelButton.hidden = true;
        }

        // Set date to today
        if (dateInput) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }

        loadProjectOptions();
        clearMessage();
    }

    // 9. Display Expenses with safe DOM methods
    function displayExpenses() {
        if (!expenseList) return;

        expenseList.replaceChildren();

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const selectedCat = categoryFilter ? categoryFilter.value : "";

        const filtered = expenses.filter(expense => {
            const projectName = getProjectName(expense.projectId).toLowerCase();
            const desc = String(expense.description || "").toLowerCase();

            const matchesSearch = !searchTerm || desc.includes(searchTerm) || projectName.includes(searchTerm);
            const matchesCat = !selectedCat || expense.category === selectedCat;

            return matchesSearch && matchesCat;
        });

        if (filtered.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const icon = document.createElement("span");
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "↗";

            const heading = document.createElement("h3");
            heading.textContent = expenses.length === 0 ? "No expenses recorded" : "No matching expenses";

            const message = document.createElement("p");
            message.textContent = expenses.length === 0
                ? "Record project purchases and site costs to monitor your budget."
                : "Try a different search term or category filter.";

            emptyState.append(icon, heading, message);
            expenseList.appendChild(emptyState);
            return;
        }

        // Display newest expenses first
        [...filtered].reverse().forEach(expense => {
            const card = document.createElement("article");
            card.className = "project-card expense-card";

            const details = document.createElement("div");
            details.className = "project-card-details";

            const heading = document.createElement("h3");
            heading.textContent = expense.description;

            const project = document.createElement("p");
            project.textContent = "Project: " + getProjectName(expense.projectId);

            const category = document.createElement("p");
            category.textContent = "Category: " + (expense.category || "General");

            const date = document.createElement("p");
            date.textContent = "Date: " + storage.formatDate(expense.date);

            const payment = document.createElement("p");
            payment.textContent = "Payment: " + (expense.paymentMethod || "Not specified");

            const amount = document.createElement("p");
            amount.className = "expense-amount";
            amount.textContent = storage.formatCurrency(expense.amount);

            details.append(heading, project, category, date, payment, amount);

            // Action buttons
            const actions = document.createElement("div");
            actions.className = "project-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "button button-secondary";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.id = expense.id;
            editButton.setAttribute("aria-label", "Edit expense " + expense.description);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "button button-danger";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = expense.id;
            deleteButton.setAttribute("aria-label", "Delete expense " + expense.description);

            actions.append(editButton, deleteButton);
            card.append(details, actions);

            expenseList.appendChild(card);
        });
    }

    // 10. Handle Form Submission
    function handleExpenseSubmit(event) {
        event.preventDefault();
        clearMessage();

        const projectId = projectInput.value;
        const description = descriptionInput.value.trim();
        const amount = Number(amountInput.value);
        const category = categoryInput.value;
        const date = dateInput.value;
        const paymentMethod = paymentMethodInput.value;

        // Validation
        if (!projectId) {
            showMessage("Please select a project for this expense.", "error");
            projectInput.focus();
            return;
        }

        if (!description) {
            showMessage("Please enter an expense description.", "error");
            descriptionInput.focus();
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage("Please enter a valid expense amount greater than 0.", "error");
            amountInput.focus();
            return;
        }

        if (!validCategories.includes(category)) {
            showMessage("Please select a valid expense category.", "error");
            categoryInput.focus();
            return;
        }

        if (!date) {
            showMessage("Please select an expense date.", "error");
            dateInput.focus();
            return;
        }

        if (!paymentMethod) {
            showMessage("Please select a payment method.", "error");
            paymentMethodInput.focus();
            return;
        }

        if (editingExpenseId) {
            // Update existing
            const index = expenses.findIndex(e => e.id === editingExpenseId);
            if (index === -1) {
                showMessage("Expense record not found.", "error");
                resetForm();
                return;
            }

            expenses[index] = {
                ...expenses[index],
                projectId,
                description,
                amount,
                category,
                date,
                paymentMethod,
                updatedAt: new Date().toISOString()
            };

            if (!saveExpenses()) return;
            showMessage(`Expense "${description}" updated successfully!`, "success");
        } else {
            // Create new
            const newExpense = {
                id: generateExpenseId(),
                projectId,
                description,
                amount,
                category,
                date,
                paymentMethod,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            expenses.push(newExpense);
            if (!saveExpenses()) {
                expenses.pop();
                return;
            }
            showMessage(`Expense "${description}" recorded successfully!`, "success");
        }

        displayExpenses();
        resetForm();
    }

    // 11. Start Editing
    function editExpense(id) {
        const expense = expenses.find(e => e.id === id);
        if (!expense) {
            showMessage("Expense not found.", "error");
            return;
        }

        editingExpenseId = id;
        loadProjectOptions(expense.projectId);

        projectInput.value = expense.projectId;
        descriptionInput.value = expense.description;
        amountInput.value = expense.amount;
        categoryInput.value = expense.category;
        dateInput.value = expense.date;
        paymentMethodInput.value = expense.paymentMethod;

        if (formHeading) {
            formHeading.textContent = "Edit Expense: " + expense.description;
        }

        if (saveButton) {
            saveButton.textContent = "Update Expense";
        }

        if (cancelButton) {
            cancelButton.hidden = false;
        }

        showMessage("Editing expense: " + expense.description, "info");
        expenseForm.scrollIntoView({ behavior: "smooth", block: "center" });
        descriptionInput.focus();
    }

    // 12. Delete Expense
    function deleteExpense(id) {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        const confirmed = window.confirm(`Are you sure you want to delete this expense of ${storage.formatCurrency(expense.amount)}?`);
        if (!confirmed) return;

        const previousExpenses = [...expenses];
        expenses = expenses.filter(e => e.id !== id);

        if (!saveExpenses()) {
            expenses = previousExpenses;
            return;
        }

        if (editingExpenseId === id) {
            resetForm();
        }

        displayExpenses();
        showMessage(`Expense "${expense.description}" was deleted.`, "success");
    }

    // 13. Delegate Action Buttons
    function handleExpenseActions(event) {
        const button = event.target.closest("button[data-action]");
        if (!button || !expenseList.contains(button)) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") editExpense(id);
        if (action === "delete") deleteExpense(id);
    }

    // 14. Initialization
    function initializeExpenses() {
        if (!expenseForm || !expenseList) return;

        loadProjectOptions();

        if (dateInput) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }

        expenseForm.addEventListener("submit", handleExpenseSubmit);
        expenseList.addEventListener("click", handleExpenseActions);

        if (cancelButton) {
            cancelButton.addEventListener("click", resetForm);
        }

        if (searchInput) {
            searchInput.addEventListener("input", displayExpenses);
        }

        if (categoryFilter) {
            categoryFilter.addEventListener("change", displayExpenses);
        }

        displayExpenses();
        console.log("BuildTrack expenses module initialized.");
    }

    initializeExpenses();
})();
