/**
 * BuildTrack — Workforce Controller
 * File: js/workforce.js
 * Responsibility: Manage workers, trade roles, wages, safe DOM rendering & filtering
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
    const form = document.querySelector("#worker-form");
    const formHeading = document.querySelector("#worker-form-heading");
    const nameInput = document.querySelector("#worker-name");
    const roleInput = document.querySelector("#worker-role");
    const phoneInput = document.querySelector("#worker-phone");
    const rateInput = document.querySelector("#worker-rate");
    const statusInput = document.querySelector("#worker-status");

    const workerList = document.querySelector("#worker-list");
    const message = document.querySelector("#worker-message");
    const saveButton = document.querySelector("#save-worker-button");
    const cancelButton = document.querySelector("#cancel-worker-edit");

    const searchInput = document.querySelector("#worker-search");
    const statusFilter = document.querySelector("#worker-filter-status");

    // 3. Application State
    let workers = storage.get(keys.WORKERS, []);
    if (!Array.isArray(workers)) {
        workers = [];
    }
    let editingWorkerId = null;

    // 4. Utility: Generate unique ID
    function generateWorkerId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "worker-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    // 5. Message Helper
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

    // 6. Save Workers
    function saveWorkers() {
        const saved = storage.save(keys.WORKERS, workers);
        if (!saved) {
            showMessage("Unable to save worker records to browser storage.", "error");
        }
        return saved;
    }

    // 7. Reset Form
    function resetForm() {
        if (!form) return;

        form.reset();
        editingWorkerId = null;

        if (formHeading) {
            formHeading.textContent = "Add New Worker";
        }

        if (saveButton) {
            saveButton.textContent = "Add Worker";
        }

        if (cancelButton) {
            cancelButton.hidden = true;
        }

        clearMessage();
    }

    // 8. Render Workers using safe DOM methods (No innerHTML)
    function renderWorkers() {
        if (!workerList) return;

        workerList.replaceChildren();

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const selectedStatus = statusFilter ? statusFilter.value : "all";

        const filtered = workers.filter(worker => {
            const name = String(worker.name || "").toLowerCase();
            const role = String(worker.role || "").toLowerCase();
            const phone = String(worker.phone || "").toLowerCase();

            const matchesSearch = !searchTerm || name.includes(searchTerm) || role.includes(searchTerm) || phone.includes(searchTerm);
            const matchesStatus = selectedStatus === "all" || worker.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const icon = document.createElement("span");
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "♙";

            const heading = document.createElement("h3");
            heading.textContent = workers.length === 0 ? "No workers found" : "No matching workers";

            const msg = document.createElement("p");
            msg.textContent = workers.length === 0
                ? "Add team members and track their trade roles and daily rates."
                : "Try a different search keyword or status filter.";

            emptyState.append(icon, heading, msg);
            workerList.appendChild(emptyState);
            return;
        }

        // Render newest workers first
        [...filtered].reverse().forEach(worker => {
            const card = document.createElement("article");
            card.className = "project-card worker-card";

            const details = document.createElement("div");
            details.className = "project-card-details";

            const name = document.createElement("h3");
            name.textContent = worker.name || "Unnamed Worker";

            const role = document.createElement("p");
            role.textContent = "Role: " + (worker.role || "General Labour");

            const phone = document.createElement("p");
            phone.textContent = "Phone: " + (worker.phone || "Not provided");

            const wage = document.createElement("p");
            wage.className = "worker-rate";
            wage.textContent = "Daily Wage: " + storage.formatCurrency(worker.dailyRate);

            const status = document.createElement("span");
            const workerStatus = String(worker.status || "active").toLowerCase();
            status.className = "status-badge status-" + workerStatus;
            status.textContent = workerStatus;

            details.append(name, role, phone, wage, status);

            // Action Buttons
            const actions = document.createElement("div");
            actions.className = "project-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "button button-secondary";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.id = worker.id;
            editButton.setAttribute("aria-label", "Edit worker " + worker.name);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "button button-danger";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = worker.id;
            deleteButton.setAttribute("aria-label", "Delete worker " + worker.name);

            actions.append(editButton, deleteButton);
            card.append(details, actions);

            workerList.appendChild(card);
        });
    }

    // 9. Handle Form Submit
    function handleSubmit(event) {
        event.preventDefault();
        clearMessage();

        const name = nameInput.value.trim();
        const role = roleInput.value.trim();
        const phone = phoneInput.value.trim();
        const dailyRate = Number(rateInput.value);
        const status = statusInput.value;

        // Validation
        if (!name) {
            showMessage("Please enter the worker's name.", "error");
            nameInput.focus();
            return;
        }

        if (!role) {
            showMessage("Please enter the worker's trade role.", "error");
            roleInput.focus();
            return;
        }

        if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
            showMessage("Please enter a valid daily wage greater than 0.", "error");
            rateInput.focus();
            return;
        }

        if (!["active", "inactive"].includes(status)) {
            showMessage("Please select a valid worker status.", "error");
            return;
        }

        if (editingWorkerId) {
            // Update
            const index = workers.findIndex(w => w.id === editingWorkerId);
            if (index === -1) {
                showMessage("Worker record not found.", "error");
                resetForm();
                return;
            }

            workers[index] = {
                ...workers[index],
                name,
                role,
                phone,
                dailyRate,
                status,
                updatedAt: new Date().toISOString()
            };

            if (!saveWorkers()) return;
            showMessage(`Worker "${name}" updated successfully.`, "success");
        } else {
            // Create
            const newWorker = {
                id: generateWorkerId(),
                name,
                role,
                phone,
                dailyRate,
                status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            workers.push(newWorker);
            if (!saveWorkers()) {
                workers.pop();
                return;
            }
            showMessage(`Worker "${name}" added successfully.`, "success");
        }

        resetForm();
        renderWorkers();
    }

    // 10. Start Edit
    function editWorker(id) {
        const worker = workers.find(w => w.id === id);
        if (!worker) return;

        editingWorkerId = id;

        nameInput.value = worker.name;
        roleInput.value = worker.role;
        phoneInput.value = worker.phone || "";
        rateInput.value = worker.dailyRate;
        statusInput.value = worker.status || "active";

        if (formHeading) {
            formHeading.textContent = "Edit Worker: " + worker.name;
        }

        if (saveButton) {
            saveButton.textContent = "Update Worker";
        }

        if (cancelButton) {
            cancelButton.hidden = false;
        }

        showMessage("Editing worker: " + worker.name, "info");
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInput.focus();
    }

    // 11. Delete Worker
    function deleteWorker(id) {
        const worker = workers.find(w => w.id === id);
        if (!worker) return;

        const confirmed = window.confirm(`Are you sure you want to delete worker "${worker.name}"?`);
        if (!confirmed) return;

        const prev = [...workers];
        workers = workers.filter(w => w.id !== id);

        if (!saveWorkers()) {
            workers = prev;
            return;
        }

        if (editingWorkerId === id) {
            resetForm();
        }

        renderWorkers();
        showMessage(`Worker "${worker.name}" was deleted.`, "success");
    }

    // 12. Delegate Clicks
    function handleWorkerActions(event) {
        const button = event.target.closest("button[data-action]");
        if (!button || !workerList.contains(button)) return;

        const { action, id } = button.dataset;
        if (action === "edit") editWorker(id);
        if (action === "delete") deleteWorker(id);
    }

    // 13. Initialization
    function initializeWorkforce() {
        if (!form || !workerList) return;

        form.addEventListener("submit", handleSubmit);
        workerList.addEventListener("click", handleWorkerActions);

        if (cancelButton) {
            cancelButton.addEventListener("click", resetForm);
        }

        if (searchInput) {
            searchInput.addEventListener("input", renderWorkers);
        }

        if (statusFilter) {
            statusFilter.addEventListener("change", renderWorkers);
        }

        renderWorkers();
        console.log("BuildTrack workforce module initialized.");
    }

    initializeWorkforce();
})();
