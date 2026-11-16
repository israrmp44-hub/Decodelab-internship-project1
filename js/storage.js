/**
 * BuildTrack — Central Storage & Global Utilities
 * File: js/storage.js
 * Responsibility: Safe localStorage wrapper, settings access, formatting helpers & mobile navigation
 */

(() => {
    "use strict";

    // Standardized storage keys
    const storageKeys = {
        PROJECTS: "buildtrack-projects",
        EXPENSES: "buildtrack-expenses",
        WORKERS: "buildtrack-workers",
        INVOICES: "buildtrack-invoices",
        SETTINGS: "buildtrack-settings"
    };

    const BuildTrackStorage = {
        /**
         * Safely saves serializable data to localStorage.
         * @param {string} key
         * @param {*} data
         * @returns {boolean}
         */
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error("BuildTrack storage save error:", error);
                return false;
            }
        },

        /**
         * Safely retrieves parsed JSON from localStorage.
         * @param {string} key
         * @param {*} fallback
         * @returns {*}
         */
        get(key, fallback = []) {
            try {
                const storedData = localStorage.getItem(key);
                if (storedData === null || storedData === undefined) {
                    return fallback;
                }
                const parsed = JSON.parse(storedData);
                return parsed !== null ? parsed : fallback;
            } catch (error) {
                console.error("BuildTrack storage read error for key '" + key + "':", error);
                return fallback;
            }
        },

        /**
         * Removes a specific key from localStorage.
         * @param {string} key
         * @returns {boolean}
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error("BuildTrack storage remove error:", error);
                return false;
            }
        },

        /**
         * Clears all BuildTrack records.
         * @param {boolean} includeSettings
         * @returns {boolean}
         */
        clearBuildTrack(includeSettings = false) {
            try {
                localStorage.removeItem(storageKeys.PROJECTS);
                localStorage.removeItem(storageKeys.EXPENSES);
                localStorage.removeItem(storageKeys.WORKERS);
                localStorage.removeItem(storageKeys.INVOICES);

                if (includeSettings) {
                    localStorage.removeItem(storageKeys.SETTINGS);
                }

                return true;
            } catch (error) {
                console.error("BuildTrack storage clear error:", error);
                return false;
            }
        },

        /**
         * Returns the current currency code configured in Settings.
         * @returns {string} e.g. "PKR", "USD", "OMR", "AED"
         */
        getCurrency() {
            const settings = this.get(storageKeys.SETTINGS, {});
            return (settings && settings.regional && settings.regional.currency) || "PKR";
        },

        /**
         * Formats a numeric amount with the user's preferred currency.
         * @param {number|string} amount
         * @returns {string}
         */
        formatCurrency(amount) {
            const num = Number(amount || 0);
            const currency = this.getCurrency();

            // Format number with commas
            const formattedNumber = num.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });

            return currency + " " + formattedNumber;
        },

        /**
         * Formats a date string (YYYY-MM-DD) according to regional preferences.
         * @param {string} dateString
         * @returns {string}
         */
        formatDate(dateString) {
            if (!dateString) return "N/A";
            const parts = dateString.split("-");
            if (parts.length !== 3) return dateString;

            const [year, month, day] = parts;
            const settings = this.get(storageKeys.SETTINGS, {});
            const format = (settings && settings.regional && settings.regional.dateFormat) || "DD/MM/YYYY";

            if (format === "MM/DD/YYYY") {
                return `${month}/${day}/${year}`;
            }
            if (format === "YYYY-MM-DD") {
                return `${year}-${month}-${day}`;
            }
            // Default DD/MM/YYYY
            return `${day}/${month}/${year}`;
        }
    };

    // Expose globally for all page scripts
    window.BuildTrackStorage = BuildTrackStorage;
    window.BUILDTRACK_STORAGE_KEYS = storageKeys;

    // Mobile Navigation & Backdrop Controller (shared across all pages)
    function initializeMobileNavigation() {
        if (typeof document === "undefined" || typeof document.querySelector !== "function") return;

        const menuToggle = document.querySelector("#menu-toggle");
        const sidebar = document.querySelector("#sidebar");
        const backdrop = document.querySelector("#sidebar-backdrop");

        if (!menuToggle || !sidebar) return;

        function openSidebar() {
            sidebar.classList.add("open");
            if (backdrop) backdrop.classList.add("active");
            menuToggle.setAttribute("aria-expanded", "true");
        }

        function closeSidebar() {
            sidebar.classList.remove("open");
            if (backdrop) backdrop.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        }

        menuToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.contains("open");
            if (isOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        if (backdrop) {
            backdrop.addEventListener("click", closeSidebar);
        }

        // Close sidebar on ESC key
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && sidebar.classList.contains("open")) {
                closeSidebar();
                menuToggle.focus();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeMobileNavigation);
    } else {
        initializeMobileNavigation();
    }

    console.log("BuildTrack storage & navigation initialized.");
})();
