/**
 * BuildTrack — Reports Controller
 * File: js/reports.js
 * Responsibility: Aggregate financial metrics, budget vs. expense comparisons, category breakdowns
 */

(() => {
    "use strict";

    // 1. Verify storage system
    const storage = window.BuildTrackStorage;
    const keys = window.BUILDTRACK_STORAGE_KEYS;

    if (!storage || !keys) {
        console.error("BuildTrack storage is not available.");
        return;
    }

    // 2. DOM Elements
    const totalProjectsElement = document.querySelector("#report-total-projects");
    const totalBudgetElement = document.querySelector("#report-total-budget");
    const totalExpensesElement = document.querySelector("#report-total-expenses");
    const totalInvoicesElement = document.querySelector("#report-total-invoices");
    const paidInvoicesElement = document.querySelector("#report-paid-invoices");
    const pendingInvoicesElement = document.querySelector("#report-pending-invoices");

    const projectReportList = document.querySelector("#project-report-list");
    const expenseReportList = document.querySelector("#expense-report-list");
    const refreshButton = document.querySelector("#refresh-reports");

    if (!projectReportList || !expenseReportList) {
        console.error("Report page elements are missing.");
        return;
    }

    // 3. Render Project Budget Comparison Cards safely
    function renderProjectReports(projects, expenses) {
        projectReportList.replaceChildren();

        if (projects.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            const icon = document.createElement("span");
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "▤";
            const h3 = document.createElement("h3");
            h3.textContent = "No Project Data";
            const p = document.createElement("p");
            p.textContent = "Create projects to view comparative financial reports.";
            empty.append(icon, h3, p);
            projectReportList.appendChild(empty);
            return;
        }

        projects.forEach(project => {
            const projectExpenses = expenses
                .filter(expense => expense.projectId === project.id)
                .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

            const budget = Number(project.budget || 0);
            const remaining = budget - projectExpenses;
            const percentage = budget > 0 ? (projectExpenses / budget) * 100 : 0;
            const isOverBudget = remaining < 0;

            const card = document.createElement("article");
            card.className = "report-item";

            // Header
            const header = document.createElement("div");
            header.className = "report-item-header";

            const h3 = document.createElement("h3");
            h3.textContent = project.name || "Untitled Project";

            const percentSpan = document.createElement("span");
            percentSpan.textContent = percentage.toFixed(1) + "% utilized";
            if (isOverBudget) {
                percentSpan.style.color = "var(--color-danger)";
            }

            header.append(h3, percentSpan);

            // Progress Bar
            const progress = document.createElement("div");
            progress.className = "report-progress";
            progress.setAttribute("role", "progressbar");
            progress.setAttribute("aria-valuenow", String(Math.round(percentage)));
            progress.setAttribute("aria-valuemin", "0");
            progress.setAttribute("aria-valuemax", "100");

            const progressFill = document.createElement("div");
            progressFill.className = "report-progress-fill";
            progressFill.style.width = Math.min(percentage, 100) + "%";
            if (isOverBudget) {
                progressFill.style.backgroundColor = "var(--color-danger)";
            }
            progress.appendChild(progressFill);

            // Details
            const details = document.createElement("div");
            details.className = "report-item-details";

            const budgetSpan = document.createElement("span");
            budgetSpan.textContent = "Budget: " + storage.formatCurrency(budget);

            const expenseSpan = document.createElement("span");
            expenseSpan.textContent = "Spent: " + storage.formatCurrency(projectExpenses);

            const remainingSpan = document.createElement("span");
            remainingSpan.textContent = (isOverBudget ? "Over by: " : "Remaining: ") + storage.formatCurrency(Math.abs(remaining));
            if (isOverBudget) {
                remainingSpan.style.color = "var(--color-danger)";
                remainingSpan.style.fontWeight = "600";
            }

            details.append(budgetSpan, expenseSpan, remainingSpan);
            card.append(header, progress, details);

            projectReportList.appendChild(card);
        });
    }

    // 4. Render Expense Category Breakdown safely
    function renderExpenseReports(expenses) {
        expenseReportList.replaceChildren();

        if (expenses.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            const icon = document.createElement("span");
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "↗";
            const h3 = document.createElement("h3");
            h3.textContent = "No Expense Data";
            const p = document.createElement("p");
            p.textContent = "Record site expenditures to generate spending category analytics.";
            empty.append(icon, h3, p);
            expenseReportList.appendChild(empty);
            return;
        }

        const categoryTotals = {};
        let grandTotal = 0;

        expenses.forEach(expense => {
            const category = expense.category || "Other";
            const amount = Number(expense.amount || 0);
            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
            grandTotal += amount;
        });

        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

        sortedCategories.forEach(([category, amount]) => {
            const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

            const card = document.createElement("article");
            card.className = "report-item";

            // Header
            const header = document.createElement("div");
            header.className = "report-item-header";

            const h3 = document.createElement("h3");
            h3.textContent = category;

            const amountStrong = document.createElement("strong");
            amountStrong.textContent = storage.formatCurrency(amount);

            header.append(h3, amountStrong);

            // Progress Bar
            const progress = document.createElement("div");
            progress.className = "report-progress";
            progress.setAttribute("role", "progressbar");
            progress.setAttribute("aria-valuenow", String(Math.round(percentage)));
            progress.setAttribute("aria-valuemin", "0");
            progress.setAttribute("aria-valuemax", "100");

            const progressFill = document.createElement("div");
            progressFill.className = "report-progress-fill";
            progressFill.style.width = Math.min(percentage, 100) + "%";
            progress.appendChild(progressFill);

            // Description
            const description = document.createElement("p");
            description.className = "report-description";
            description.textContent = percentage.toFixed(1) + "% of total construction spending";

            card.append(header, progress, description);
            expenseReportList.appendChild(card);
        });
    }

    // 5. Aggregate and Render All Reports
    function renderReports() {
        const projects = storage.get(keys.PROJECTS, []);
        const expenses = storage.get(keys.EXPENSES, []);
        const invoices = storage.get(keys.INVOICES, []);

        const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const paidTotal = invoices
            .filter(inv => inv.status === "paid")
            .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

        const pendingTotal = invoices
            .filter(inv => inv.status === "pending")
            .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

        if (totalProjectsElement) totalProjectsElement.textContent = projects.length;
        if (totalBudgetElement) totalBudgetElement.textContent = storage.formatCurrency(totalBudget);
        if (totalExpensesElement) totalExpensesElement.textContent = storage.formatCurrency(totalExpenses);
        if (totalInvoicesElement) totalInvoicesElement.textContent = invoices.length;
        if (paidInvoicesElement) paidInvoicesElement.textContent = storage.formatCurrency(paidTotal);
        if (pendingInvoicesElement) pendingInvoicesElement.textContent = storage.formatCurrency(pendingTotal);

        renderProjectReports(projects, expenses);
        renderExpenseReports(expenses);
    }

    // 6. Initialization
    function initializeReports() {
        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                renderReports();
                refreshButton.classList.add("btn-refreshed");
                setTimeout(() => {
                    refreshButton.classList.remove("btn-refreshed");
                }, 300);
            });
        }

        renderReports();
        console.log("BuildTrack reports module initialized.");
    }

    initializeReports();
})();
