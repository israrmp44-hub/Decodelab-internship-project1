/**
 * BuildTrack — Invoices Controller
 * File: js/invoices.js
 * Responsibility: Create and manage invoices, validate dates, associate with projects, safe DOM rendering
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
    const form = document.querySelector("#invoice-form");
    const formHeading = document.querySelector("#invoice-form-heading");
    const numberInput = document.querySelector("#invoice-number");
    const clientInput = document.querySelector("#invoice-client");
    const projectInput = document.querySelector("#invoice-project");
    const amountInput = document.querySelector("#invoice-amount");
    const issueDateInput = document.querySelector("#invoice-issue-date");
    const dueDateInput = document.querySelector("#invoice-due-date");
    const statusInput = document.querySelector("#invoice-status");

    const invoiceList = document.querySelector("#invoice-list");
    const message = document.querySelector("#invoice-message");
    const saveButton = document.querySelector("#save-invoice-button");
    const cancelButton = document.querySelector("#cancel-invoice-edit");

    const searchInput = document.querySelector("#invoice-search");
    const statusFilter = document.querySelector("#invoice-filter-status");

    // 3. Application State
    let invoices = storage.get(keys.INVOICES, []);
    let projects = storage.get(keys.PROJECTS, []);
    let editingInvoiceId = null;

    // 4. Utility: Generate unique ID
    function generateInvoiceId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "invoice-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    // 5. Messaging Helper
    function showMessage(text, type = "success") {
        if (!message) return;
        message.textContent = text;
        message.className = "form-message message-" + type;
        message.hidden = false;
    }

    function clearMessage() {
        if (!message) return;
        message.textContent = "";
        message.hidden = true;
    }

    // 6. Save Invoices
    function saveInvoices() {
        const saved = storage.save(keys.INVOICES, invoices);
        if (!saved) {
            showMessage("Unable to save invoice records to storage.", "error");
        }
        return saved;
    }

    // 7. Dynamic Project Options Loader
    function loadProjects(selectedId = "") {
        if (!projectInput) return;

        projects = storage.get(keys.PROJECTS, []);
        projectInput.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = projects.length > 0 ? "Select a project *" : "No projects found (Create one first)";
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

    // Helper: Lookup project name
    function getProjectName(projectId) {
        const found = projects.find(p => p.id === projectId);
        return found ? found.name : "Unassigned / Deleted Project";
    }

    // 8. Reset Form
    function resetForm() {
        if (!form) return;

        form.reset();
        editingInvoiceId = null;

        if (formHeading) {
            formHeading.textContent = "Create New Invoice";
        }

        if (saveButton) {
            saveButton.textContent = "Create Invoice";
        }

        if (cancelButton) {
            cancelButton.hidden = true;
        }

        // Set default issue and due dates (today and +30 days)
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);

        if (issueDateInput) {
            issueDateInput.value = today.toISOString().slice(0, 10);
        }
        if (dueDateInput) {
            dueDateInput.value = thirtyDaysLater.toISOString().slice(0, 10);
        }

        loadProjects();
        clearMessage();
    }

    // 9. Render Invoices using safe DOM methods (No innerHTML)
    function renderInvoices() {
        if (!invoiceList) return;

        invoiceList.replaceChildren();

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const selectedStatus = statusFilter ? statusFilter.value : "all";

        const filtered = invoices.filter(invoice => {
            const num = String(invoice.number || "").toLowerCase();
            const client = String(invoice.client || "").toLowerCase();
            const projectName = getProjectName(invoice.projectId).toLowerCase();

            const matchesSearch = !searchTerm || num.includes(searchTerm) || client.includes(searchTerm) || projectName.includes(searchTerm);
            const matchesStatus = selectedStatus === "all" || invoice.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const icon = document.createElement("span");
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "▧";

            const heading = document.createElement("h3");
            heading.textContent = invoices.length === 0 ? "No invoices found" : "No matching invoices";

            const msg = document.createElement("p");
            msg.textContent = invoices.length === 0
                ? "Create invoices for your clients and track payment receipts."
                : "Try a different search keyword or status filter.";

            emptyState.append(icon, heading, msg);
            invoiceList.appendChild(emptyState);
            return;
        }

        // Render newest invoices first
        [...filtered].reverse().forEach(invoice => {
            const card = document.createElement("article");
            card.className = "project-card invoice-card";

            const details = document.createElement("div");
            details.className = "project-card-details";

            const number = document.createElement("h3");
            number.textContent = "#" + (invoice.number || "INV-000");

            const client = document.createElement("p");
            client.textContent = "Client: " + (invoice.client || "Not specified");

            const project = document.createElement("p");
            project.textContent = "Project: " + getProjectName(invoice.projectId);

            const issue = document.createElement("p");
            issue.textContent = "Issued: " + storage.formatDate(invoice.issueDate);

            const due = document.createElement("p");
            due.textContent = "Due: " + storage.formatDate(invoice.dueDate);

            const amount = document.createElement("p");
            amount.className = "invoice-amount";
            amount.textContent = storage.formatCurrency(invoice.amount);

            const status = document.createElement("span");
            const invoiceStatus = String(invoice.status || "pending").toLowerCase();
            status.className = "status-badge status-" + invoiceStatus;
            status.textContent = invoiceStatus;

            details.append(number, client, project, issue, due, amount, status);

            // Action Buttons
            const actions = document.createElement("div");
            actions.className = "project-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "button button-secondary";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.id = invoice.id;
            editButton.setAttribute("aria-label", "Edit invoice " + invoice.number);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "button button-danger";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = invoice.id;
            deleteButton.setAttribute("aria-label", "Delete invoice " + invoice.number);

            actions.append(editButton, deleteButton);
            card.append(details, actions);

            invoiceList.appendChild(card);
        });
    }

    // 10. Handle Form Submission
    function handleSubmit(event) {
        event.preventDefault();
        clearMessage();

        const number = numberInput.value.trim();
        const client = clientInput.value.trim();
        const projectId = projectInput.value;
        const amount = Number(amountInput.value);
        const issueDate = issueDateInput.value;
        const dueDate = dueDateInput.value;
        const status = statusInput.value;

        // Validation
        if (!number) {
            showMessage("Please enter an invoice number.", "error");
            numberInput.focus();
            return;
        }

        if (!client) {
            showMessage("Please enter the client name.", "error");
            clientInput.focus();
            return;
        }

        if (!projectId) {
            showMessage("Please select a valid project for this invoice.", "error");
            projectInput.focus();
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage("Please enter a valid invoice amount greater than 0.", "error");
            amountInput.focus();
            return;
        }

        if (!issueDate) {
            showMessage("Please select an issue date.", "error");
            issueDateInput.focus();
            return;
        }

        if (!dueDate) {
            showMessage("Please select a due date.", "error");
            dueDateInput.focus();
            return;
        }

        if (dueDate < issueDate) {
            showMessage("Due date cannot be before the issue date.", "error");
            dueDateInput.focus();
            return;
        }

        if (!["pending", "paid"].includes(status)) {
            showMessage("Please select a valid payment status.", "error");
            return;
        }

        // Duplicate Invoice Number Check
        const isDuplicate = invoices.some(inv =>
            inv.number.toLowerCase() === number.toLowerCase() && inv.id !== editingInvoiceId
        );

        if (isDuplicate) {
            showMessage(`An invoice with number "${number}" already exists. Please use a unique number.`, "error");
            numberInput.focus();
            return;
        }

        if (editingInvoiceId) {
            // Update
            const index = invoices.findIndex(inv => inv.id === editingInvoiceId);
            if (index === -1) {
                showMessage("Invoice record not found.", "error");
                resetForm();
                return;
            }

            invoices[index] = {
                ...invoices[index],
                number,
                client,
                projectId,
                amount,
                issueDate,
                dueDate,
                status,
                updatedAt: new Date().toISOString()
            };

            if (!saveInvoices()) return;
            showMessage(`Invoice #${number} updated successfully.`, "success");
        } else {
            // Create
            const newInvoice = {
                id: generateInvoiceId(),
                number,
                client,
                projectId,
                amount,
                issueDate,
                dueDate,
                status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            invoices.push(newInvoice);
            if (!saveInvoices()) {
                invoices.pop();
                return;
            }
            showMessage(`Invoice #${number} created successfully.`, "success");
        }

        resetForm();
        renderInvoices();
    }

    // 11. Start Edit
    function editInvoice(id) {
        const invoice = invoices.find(inv => inv.id === id);
        if (!invoice) return;

        editingInvoiceId = id;
        loadProjects(invoice.projectId);

        numberInput.value = invoice.number;
        clientInput.value = invoice.client;
        projectInput.value = invoice.projectId;
        amountInput.value = invoice.amount;
        issueDateInput.value = invoice.issueDate;
        dueDateInput.value = invoice.dueDate;
        statusInput.value = invoice.status || "pending";

        if (formHeading) {
            formHeading.textContent = "Edit Invoice: #" + invoice.number;
        }

        if (saveButton) {
            saveButton.textContent = "Update Invoice";
        }

        if (cancelButton) {
            cancelButton.hidden = false;
        }

        showMessage("Editing invoice: #" + invoice.number, "info");
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        clientInput.focus();
    }

    // 12. Delete Invoice
    function deleteInvoice(id) {
        const invoice = invoices.find(inv => inv.id === id);
        if (!invoice) return;

        const confirmed = window.confirm(`Are you sure you want to delete invoice #${invoice.number}?`);
        if (!confirmed) return;

        const prev = [...invoices];
        invoices = invoices.filter(inv => inv.id !== id);

        if (!saveInvoices()) {
            invoices = prev;
            return;
        }

        if (editingInvoiceId === id) {
            resetForm();
        }

        renderInvoices();
        showMessage(`Invoice #${invoice.number} was deleted.`, "success");
    }

    // 13. Delegate Action Buttons
    function handleInvoiceActions(event) {
        const button = event.target.closest("button[data-action]");
        if (!button || !invoiceList.contains(button)) return;

        const { action, id } = button.dataset;
        if (action === "edit") editInvoice(id);
        if (action === "delete") deleteInvoice(id);
    }

    // 14. Initialization
    function initializeInvoices() {
        if (!form || !invoiceList) return;

        resetForm();

        form.addEventListener("submit", handleSubmit);
        invoiceList.addEventListener("click", handleInvoiceActions);

        if (cancelButton) {
            cancelButton.addEventListener("click", resetForm);
        }

        if (searchInput) {
            searchInput.addEventListener("input", renderInvoices);
        }

        if (statusFilter) {
            statusFilter.addEventListener("change", renderInvoices);
        }

        renderInvoices();
        console.log("BuildTrack invoices module initialized.");
    }

    initializeInvoices();
})();
