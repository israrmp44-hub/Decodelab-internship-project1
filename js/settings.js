/**
 * BuildTrack — Settings Controller
 * File: js/settings.js
 * Responsibility: Company profile, regional preferences (currency & date), backup export/import
 */

(() => {
    "use strict";

    // 1. Verify storage system
    const storage = window.BuildTrackStorage;
    const keys = window.BUILDTRACK_STORAGE_KEYS;

    if (!storage || !keys) {
        console.error("BuildTrack storage system is unavailable.");
        return;
    }

    // 2. DOM Elements
    const companyForm = document.getElementById("company-settings-form");
    const regionalForm = document.getElementById("regional-settings-form");

    const companyName = document.getElementById("company-name");
    const companyEmail = document.getElementById("company-email");
    const companyPhone = document.getElementById("company-phone");
    const companyAddress = document.getElementById("company-address");

    const currencySelect = document.getElementById("currency");
    const dateFormatSelect = document.getElementById("date-format");

    const exportButton = document.getElementById("export-backup");
    const importButton = document.getElementById("import-backup");
    const importFile = document.getElementById("import-backup-file");

    // 3. Default Settings Model
    const defaultSettings = {
        company: {
            name: "",
            email: "",
            phone: "",
            address: ""
        },
        regional: {
            currency: "PKR",
            dateFormat: "DD/MM/YYYY"
        }
    };

    let settings = loadSettings();

    // 4. Load Settings from Storage
    function loadSettings() {
        const saved = storage.get(keys.SETTINGS, {});

        return {
            company: {
                ...defaultSettings.company,
                ...(saved?.company || {})
            },
            regional: {
                ...defaultSettings.regional,
                ...(saved?.regional || {})
            }
        };
    }

    // 5. Save Settings to Storage
    function saveSettings() {
        const success = storage.save(keys.SETTINGS, settings);
        if (!success) {
            console.error("Unable to save BuildTrack settings.");
        }
        return success;
    }

    // 6. Display Status Message
    function showMessage(elementId, messageText, type = "success") {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = messageText;
        element.className = `form-message message-${type}`;
        element.hidden = false;
    }

    // 7. Load & Handle Company Profile
    function populateCompanyProfile() {
        if (!companyName) return;
        companyName.value = settings.company.name || "";
        companyEmail.value = settings.company.email || "";
        companyPhone.value = settings.company.phone || "";
        companyAddress.value = settings.company.address || "";
    }

    function handleCompanySubmit(event) {
        event.preventDefault();

        settings.company = {
            name: companyName.value.trim(),
            email: companyEmail.value.trim(),
            phone: companyPhone.value.trim(),
            address: companyAddress.value.trim()
        };

        if (!saveSettings()) {
            showMessage("company-message", "Unable to save company information to storage.", "error");
            return;
        }

        showMessage("company-message", "Company profile saved successfully.");
    }

    // 8. Load & Handle Regional Preferences
    function populateRegionalSettings() {
        if (!currencySelect) return;
        currencySelect.value = settings.regional.currency || "PKR";
        dateFormatSelect.value = settings.regional.dateFormat || "DD/MM/YYYY";
    }

    function handleRegionalSubmit(event) {
        event.preventDefault();

        settings.regional = {
            currency: currencySelect.value,
            dateFormat: dateFormatSelect.value
        };

        if (!saveSettings()) {
            showMessage("regional-message", "Unable to save regional preferences.", "error");
            return;
        }

        showMessage("regional-message", "Regional preferences saved successfully. Numbers and dates will now reflect your choice.");
    }

    // 9. Export Backup to JSON
    function exportBackup() {
        const backup = {
            application: "BuildTrack",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            data: {
                projects: storage.get(keys.PROJECTS, []),
                expenses: storage.get(keys.EXPENSES, []),
                workers: storage.get(keys.WORKERS, []),
                invoices: storage.get(keys.INVOICES, []),
                settings: settings
            }
        };

        const jsonString = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        const dateStamp = new Date().toISOString().slice(0, 10);
        downloadLink.download = `buildtrack-backup-${dateStamp}.json`;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        URL.revokeObjectURL(url);
        showMessage("backup-message", "Backup exported successfully! File downloaded.");
    }

    // 10. Validate Backup Structure
    function validateBackup(backup) {
        if (
            !backup ||
            backup.application !== "BuildTrack" ||
            !backup.data ||
            typeof backup.data !== "object"
        ) {
            return false;
        }

        const data = backup.data;
        const requiredArrays = ["projects", "expenses", "workers", "invoices"];

        const hasValidArrays = requiredArrays.every(key => Array.isArray(data[key]));
        const hasValidSettings = data.settings && typeof data.settings === "object" && !Array.isArray(data.settings);

        return hasValidArrays && hasValidSettings;
    }

    // 11. Import Backup from File
    async function importBackup() {
        const file = importFile.files[0];

        if (!file) {
            showMessage("backup-message", "Please select a JSON backup file first.", "error");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".json")) {
            showMessage("backup-message", "Invalid file type. Please select a .json file.", "error");
            return;
        }

        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            if (!validateBackup(backup)) {
                throw new Error("File is not a valid BuildTrack backup.");
            }

            const confirmed = window.confirm(
                "Restoring this backup will replace your current workspace projects, expenses, workforce, invoices, and settings. Continue?"
            );

            if (!confirmed) return;

            const data = backup.data;

            const importedSettings = {
                company: {
                    ...defaultSettings.company,
                    ...(data.settings.company || {})
                },
                regional: {
                    ...defaultSettings.regional,
                    ...(data.settings.regional || {})
                }
            };

            const recordsToRestore = [
                [keys.PROJECTS, data.projects],
                [keys.EXPENSES, data.expenses],
                [keys.WORKERS, data.workers],
                [keys.INVOICES, data.invoices],
                [keys.SETTINGS, importedSettings]
            ];

            // Snapshot before saving for rollback safety
            const rollbackSnapshot = recordsToRestore.map(([key]) => ({
                key,
                value: localStorage.getItem(key)
            }));

            try {
                for (const [key, value] of recordsToRestore) {
                    if (!storage.save(key, value)) {
                        throw new Error(`Failed to restore data for key: ${key}`);
                    }
                }
            } catch (err) {
                // Rollback
                rollbackSnapshot.forEach(item => {
                    if (item.value === null) {
                        localStorage.removeItem(item.key);
                    } else {
                        localStorage.setItem(item.key, item.value);
                    }
                });
                throw err;
            }

            // Update in-memory state
            settings = importedSettings;
            populateCompanyProfile();
            populateRegionalSettings();

            showMessage(
                "backup-message",
                "Backup restored successfully! All projects, expenses, workers, and invoices are up to date."
            );

            importFile.value = "";
        } catch (error) {
            console.error("Backup restore failed:", error);
            showMessage(
                "backup-message",
                "Restore failed: " + (error.message || "Invalid backup file."),
                "error"
            );
        }
    }

    // 12. Initialization
    function initializeSettings() {
        populateCompanyProfile();
        populateRegionalSettings();

        if (companyForm) {
            companyForm.addEventListener("submit", handleCompanySubmit);
        }

        if (regionalForm) {
            regionalForm.addEventListener("submit", handleRegionalSubmit);
        }

        if (exportButton) {
            exportButton.addEventListener("click", exportBackup);
        }

        if (importButton) {
            importButton.addEventListener("click", importBackup);
        }

        console.log("BuildTrack settings module initialized.");
    }

    initializeSettings();
})();
