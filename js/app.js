/**
 * BuildTrack — Dashboard Controller
 * File: js/app.js
 * Responsibility: Aggregate and render overview stats, charts, recent projects, and activity
 */

(() => {
    "use strict";

    // 1. Verify storage system
    const storage = window.BuildTrackStorage;
    const keys = window.BUILDTRACK_STORAGE_KEYS;

    if (!storage || !keys) {
        console.error("BuildTrack storage system is not available!");
        return;
    }

    // 2. DOM Elements
    const totalProjectsElement = document.querySelector("#total-projects");
    const totalBudgetElement = document.querySelector("#total-budget");
    const totalExpensesElement = document.querySelector("#total-expenses");
    const activeProjectsElement = document.querySelector("#active-projects");

    const recentProjectsContainer = document.querySelector("#recent-projects");
    const budgetChart = document.querySelector("#budget-chart");
    const budgetPercentageElement = document.querySelector("#budget-percentage");
    const budgetUsedAmountElement = document.querySelector("#budget-used-amount");
    const budgetRemainingAmountElement = document.querySelector("#budget-remaining-amount");

    const activityContainer = document.querySelector("#recent-activity");
    const globalSearchInput = document.querySelector("#global-search");

    // 3. Load all workspace data
    function loadWorkspaceData() {
        return {
            projects: storage.get(keys.PROJECTS, []),
            expenses: storage.get(keys.EXPENSES, []),
            workers: storage.get(keys.WORKERS, []),
            invoices: storage.get(keys.INVOICES, [])
        };
    }

    // 4. Calculate key metrics
    function calculateStatistics(projects, expenses) {
        const totalProjects = projects.length;

        const totalBudget = projects.reduce((sum, project) => {
            return sum + Number(project.budget || 0);
        }, 0);

        const totalExpenses = expenses.reduce((sum, expense) => {
            return sum + Number(expense.amount || 0);
        }, 0);

        const activeProjects = projects.filter(project => {
            return String(project.status || "active").toLowerCase() === "active";
        }).length;

        return {
            totalProjects,
            totalBudget,
            totalExpenses,
            activeProjects
        };
    }

    // 5. Display KPI cards
    function displayStatistics(stats) {
        if (totalProjectsElement) {
            totalProjectsElement.textContent = stats.totalProjects;
        }

        if (totalBudgetElement) {
            totalBudgetElement.textContent = storage.formatCurrency(stats.totalBudget);
        }

        if (totalExpensesElement) {
            totalExpensesElement.textContent = storage.formatCurrency(stats.totalExpenses);
        }

        if (activeProjectsElement) {
            activeProjectsElement.textContent = stats.activeProjects;
        }
    }

    // 6. Display Recent Projects with safe DOM creation
    function displayRecentProjects(projects, filterQuery = "") {
        if (!recentProjectsContainer) return;

        recentProjectsContainer.replaceChildren();

        const query = filterQuery.trim().toLowerCase();
        let displayList = [...projects].reverse();

        if (query) {
            displayList = displayList.filter(project => {
                const name = String(project.name || "").toLowerCase();
                const location = String(project.location || "").toLowerCase();
                return name.includes(query) || location.includes(query);
            });
        } else {
            displayList = displayList.slice(0, 4);
        }

        if (displayList.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const heading = document.createElement("h3");
            heading.textContent = query ? "No matching projects" : "No projects yet";

            const message = document.createElement("p");
            message.textContent = query
                ? "Try a different search query."
                : "Create your first project to start tracking your construction work.";

            emptyState.append(heading, message);
            recentProjectsContainer.appendChild(emptyState);
            return;
        }

        displayList.forEach(project => {
            const card = document.createElement("article");
            card.className = "project-card";

            const details = document.createElement("div");
            details.className = "project-card-details";

            const name = document.createElement("h3");
            name.textContent = project.name || "Untitled Project";

            const location = document.createElement("p");
            location.textContent = "Location: " + (project.location || "Not specified");

            const budget = document.createElement("p");
            budget.textContent = "Budget: " + storage.formatCurrency(project.budget);

            const status = document.createElement("span");
            const projectStatus = String(project.status || "active").toLowerCase();
            status.className = "status-badge status-" + projectStatus;
            status.textContent = projectStatus;

            details.append(name, location, budget);
            card.append(details, status);

            recentProjectsContainer.appendChild(card);
        });
    }

    // 7. Update Budget Donut & Legend
    function updateBudgetChart(totalBudget, totalExpenses) {
        const remainingBudget = Math.max(0, totalBudget - totalExpenses);

        if (budgetUsedAmountElement) {
            budgetUsedAmountElement.textContent = storage.formatCurrency(totalExpenses);
        }

        if (budgetRemainingAmountElement) {
            budgetRemainingAmountElement.textContent = storage.formatCurrency(remainingBudget);
        }

        if (!budgetChart) return;

        if (totalBudget <= 0) {
            budgetChart.style.background = "conic-gradient(var(--color-border) 360deg, var(--color-border) 360deg)";
            if (budgetPercentageElement) {
                budgetPercentageElement.textContent = "0%";
            }
            return;
        }

        const percentage = Math.min((totalExpenses / totalBudget) * 100, 100);
        const degrees = percentage * 3.6;

        budgetChart.style.background = `conic-gradient(var(--color-primary) ${degrees}deg, var(--color-border) ${degrees}deg)`;

        if (budgetPercentageElement) {
            budgetPercentageElement.textContent = Math.round(percentage) + "%";
        }
    }

    // 8. Display Recent Activity from all modules
    function displayRecentActivity(data) {
        if (!activityContainer) return;

        activityContainer.replaceChildren();

        const activities = [];

        // Collect from Projects
        data.projects.forEach(project => {
            activities.push({
                text: `Project added: "${project.name}"`,
                time: project.createdAt || project.updatedAt || "",
                type: "project"
            });
        });

        // Collect from Expenses
        data.expenses.forEach(expense => {
            activities.push({
                text: `Expense recorded: ${expense.description} (${storage.formatCurrency(expense.amount)})`,
                time: expense.createdAt || expense.date || "",
                type: "expense"
            });
        });

        // Collect from Workers
        data.workers.forEach(worker => {
            activities.push({
                text: `Worker added: ${worker.name} (${worker.role})`,
                time: worker.createdAt || "",
                type: "worker"
            });
        });

        // Collect from Invoices
        data.invoices.forEach(invoice => {
            activities.push({
                text: `Invoice generated: #${invoice.number} (${storage.formatCurrency(invoice.amount)})`,
                time: invoice.createdAt || invoice.issueDate || "",
                type: "invoice"
            });
        });

        if (activities.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            const msg = document.createElement("p");
            msg.textContent = "No recent activity yet. Add projects or expenses to see real-time updates.";
            empty.appendChild(msg);
            activityContainer.appendChild(empty);
            return;
        }

        // Sort by newest time
        activities.sort((a, b) => {
            const timeA = new Date(a.time).getTime() || 0;
            const timeB = new Date(b.time).getTime() || 0;
            return timeB - timeA;
        });

        // Take 5 most recent
        activities.slice(0, 5).forEach(activity => {
            const item = document.createElement("div");
            item.className = "activity-item";

            const textSpan = document.createElement("span");
            textSpan.textContent = activity.text;

            const timeSpan = document.createElement("span");
            timeSpan.className = "activity-time";
            timeSpan.textContent = activity.time ? storage.formatDate(activity.time.slice(0, 10)) : "Recent";

            item.append(textSpan, timeSpan);
            activityContainer.appendChild(item);
        });
    }

    // 9. Initialize Dashboard
    function initializeDashboard() {
        const data = loadWorkspaceData();
        const stats = calculateStatistics(data.projects, data.expenses);

        displayStatistics(stats);
        displayRecentProjects(data.projects);
        updateBudgetChart(stats.totalBudget, stats.totalExpenses);
        displayRecentActivity(data);

        // Global search handler
        if (globalSearchInput) {
            globalSearchInput.addEventListener("input", (event) => {
                displayRecentProjects(data.projects, event.target.value);
            });
        }

        console.log("BuildTrack dashboard initialized successfully.");
    }

    initializeDashboard();
})();
