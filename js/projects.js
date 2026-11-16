/**
 * BuildTrack — Projects Controller
 * File: js/projects.js
 * Responsibility: CRUD operations, validation, search/filtering for construction projects
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
    const projectForm = document.querySelector("#project-form");
    const formHeading = document.querySelector("#form-heading");
    const projectNameInput = document.querySelector("#project-name");
    const projectLocationInput = document.querySelector("#project-location");
    const projectBudgetInput = document.querySelector("#project-budget");
    const projectStatusInput = document.querySelector("#project-status");
    const projectDescriptionInput = document.querySelector("#project-description");

    const projectList = document.querySelector("#project-list");
    const formMessage = document.querySelector("#form-message");
    const cancelEditButton = document.querySelector("#cancel-edit");
    const saveButton = document.querySelector("#save-button");

    const searchInput = document.querySelector("#project-search");
    const statusFilter = document.querySelector("#project-filter-status");

    // 3. Application State
    let projects = storage.get(keys.PROJECTS, []);
    if (!Array.isArray(projects)) {
        projects = [];
    }
    let editingProjectId = null;

    // 4. Utility: Generate unique ID
    function generateProjectId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "project-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    // 5. Form Messaging
    function showMessage(text, type = "success") {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.className = "form-message message-" + type;
        formMessage.hidden = false;
    }

    function clearMessage() {
        if (!formMessage) return;
        formMessage.textContent = "";
        formMessage.hidden = true;
    }

    // 6. Save projects to storage
    function saveProjects() {
        const saved = storage.save(keys.PROJECTS, projects);
        if (!saved) {
            showMessage("Unable to save project data. Please check localStorage permissions.", "error");
        }
        return saved;
    }

    // 7. Reset Form State
    function resetForm() {
        if (!projectForm) return;

        projectForm.reset();
        editingProjectId = null;

        if (formHeading) {
            formHeading.textContent = "Add New Project";
        }

        if (saveButton) {
            saveButton.textContent = "Save Project";
        }

        if (cancelEditButton) {
            cancelEditButton.hidden = true;
        }

        clearMessage();
    }

    // 8. Render Project Cards safely using DOM methods
    function displayProjects() {
        if (!projectList) return;

        projectList.replaceChildren();

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const selectedStatus = statusFilter ? statusFilter.value : "all";

        const filtered = projects.filter(project => {
            const name = String(project.name || "").toLowerCase();
            const location = String(project.location || "").toLowerCase();
            const desc = String(project.description || "").toLowerCase();

            const matchesSearch = !searchTerm || name.includes(searchTerm) || location.includes(searchTerm) || desc.includes(searchTerm);
            const matchesStatus = selectedStatus === "all" || String(project.status || "active").toLowerCase() === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const icon = document.createElement("span");
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "▤";

            const heading = document.createElement("h3");
            heading.textContent = projects.length === 0 ? "No projects found" : "No matching projects";

            const message = document.createElement("p");
            message.textContent = projects.length === 0
                ? "Add your first construction project to get started."
                : "Try adjusting your search query or status filter.";

            emptyState.append(icon, heading, message);
            projectList.appendChild(emptyState);
            return;
        }

        // Render newest projects first
        [...filtered].reverse().forEach(project => {
            const card = document.createElement("article");
            card.className = "project-card";

            const details = document.createElement("div");
            details.className = "project-card-details";

            const heading = document.createElement("h3");
            heading.textContent = project.name || "Untitled Project";

            const location = document.createElement("p");
            location.textContent = "Location: " + (project.location || "Not specified");

            const budget = document.createElement("p");
            budget.className = "expense-amount";
            budget.textContent = "Budget: " + storage.formatCurrency(project.budget);

            const status = document.createElement("span");
            const projectStatus = String(project.status || "active").toLowerCase();
            status.className = "status-badge status-" + projectStatus;
            status.textContent = projectStatus;

            const description = document.createElement("p");
            description.textContent = project.description || "No description provided.";

            details.append(heading, location, budget, status, description);

            // Action Buttons
            const actions = document.createElement("div");
            actions.className = "project-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "button button-secondary";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.id = project.id;
            editButton.setAttribute("aria-label", "Edit " + project.name);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "button button-danger";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = project.id;
            deleteButton.setAttribute("aria-label", "Delete " + project.name);

            actions.append(editButton, deleteButton);
            card.append(details, actions);

            projectList.appendChild(card);
        });
    }

    // 9. Handle Form Submission
    function handleProjectSubmit(event) {
        event.preventDefault();
        clearMessage();

        const name = projectNameInput.value.trim();
        const location = projectLocationInput.value.trim();
        const budget = Number(projectBudgetInput.value);
        const status = projectStatusInput ? projectStatusInput.value : "active";
        const description = projectDescriptionInput ? projectDescriptionInput.value.trim() : "";

        // Validation
        if (!name) {
            showMessage("Please enter a project name.", "error");
            projectNameInput.focus();
            return;
        }

        if (!Number.isFinite(budget) || budget <= 0) {
            showMessage("Please enter a valid project budget greater than 0.", "error");
            projectBudgetInput.focus();
            return;
        }

        if (editingProjectId) {
            // Update existing record
            const index = projects.findIndex(p => p.id === editingProjectId);
            if (index === -1) {
                showMessage("Project record not found.", "error");
                resetForm();
                return;
            }

            projects[index] = {
                ...projects[index],
                name,
                location,
                budget,
                status,
                description,
                updatedAt: new Date().toISOString()
            };

            if (!saveProjects()) return;
            showMessage(`Project "${name}" updated successfully!`, "success");
        } else {
            // Create new record
            const newProject = {
                id: generateProjectId(),
                name,
                location,
                budget,
                status,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            projects.push(newProject);
            if (!saveProjects()) {
                projects.pop();
                return;
            }
            showMessage(`Project "${name}" added successfully!`, "success");
        }

        displayProjects();
        resetForm();
    }

    // 10. Start Editing Project
    function editProject(id) {
        const project = projects.find(p => p.id === id);
        if (!project) {
            showMessage("Project not found.", "error");
            return;
        }

        editingProjectId = id;

        projectNameInput.value = project.name;
        projectLocationInput.value = project.location || "";
        projectBudgetInput.value = project.budget;

        if (projectStatusInput) {
            projectStatusInput.value = project.status || "active";
        }
        if (projectDescriptionInput) {
            projectDescriptionInput.value = project.description || "";
        }

        if (formHeading) {
            formHeading.textContent = "Edit Project: " + project.name;
        }

        if (saveButton) {
            saveButton.textContent = "Update Project";
        }

        if (cancelEditButton) {
            cancelEditButton.hidden = false;
        }

        showMessage("Editing project: " + project.name, "info");

        projectForm.scrollIntoView({ behavior: "smooth", block: "center" });
        projectNameInput.focus();
    }

    // 11. Delete Project
    function deleteProject(id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        const confirmed = window.confirm(`Are you sure you want to delete "${project.name}"?`);
        if (!confirmed) return;

        const previousProjects = [...projects];
        projects = projects.filter(p => p.id !== id);

        if (!saveProjects()) {
            projects = previousProjects;
            return;
        }

        if (editingProjectId === id) {
            resetForm();
        }

        displayProjects();
        showMessage(`Project "${project.name}" was deleted.`, "success");
    }

    // 12. Delegate Action Button Clicks
    function handleProjectActions(event) {
        const button = event.target.closest("button[data-action]");
        if (!button || !projectList.contains(button)) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") editProject(id);
        if (action === "delete") deleteProject(id);
    }

    // 13. Initialization
    function initializeProjects() {
        if (!projectForm || !projectList) return;

        projectForm.addEventListener("submit", handleProjectSubmit);
        projectList.addEventListener("click", handleProjectActions);

        if (cancelEditButton) {
            cancelEditButton.addEventListener("click", resetForm);
        }

        if (searchInput) {
            searchInput.addEventListener("input", displayProjects);
        }

        if (statusFilter) {
            statusFilter.addEventListener("change", displayProjects);
        }

        displayProjects();
        console.log("BuildTrack projects module initialized.");
    }

    initializeProjects();
})();
