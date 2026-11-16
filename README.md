# BuildTrack — Construction Management Web Application

BuildTrack is a modern, responsive, and lightweight construction management web application built with semantic HTML5, CSS3, and vanilla JavaScript.

It helps contractors, builders, and project managers organize construction projects, record site expenditures, manage trade workforces, generate client invoices, analyze budget reports, and maintain local data backups.

This project was developed and refined as part of the **DecodeLabs Full Stack Development Preparation (Batch 2026) — Project 1**.

---

## 1. Project Overview

Construction projects involve high capital, strict schedules, varied trade labor, and constant material purchases. BuildTrack provides a unified dashboard and dedicated management pages to track all operations in one place without needing external dependencies, complex frameworks, or backend servers.

---

## 2. Key Features

### Dashboard Overview
- **Real-Time KPIs**: Total registered projects, total allocated budget, total recorded expenses, and active project counts.
- **Budget Utilization Donut**: Visual percentage breakdown of budget spent vs. remaining.
- **Recent Projects Carousel**: Quick access to the newest active construction sites.
- **Workspace Activity Stream**: Live feed of the latest additions across projects, expenses, workers, and invoices.
- **Live Search**: Instant client-side filtering on the dashboard.

### Project Management
- Add, edit, review, and delete construction projects.
- Record site location, allocated budget, project status (`Active`, `Pending`, `Completed`), and scope descriptions.
- Instant search and status filtering.

### Expense Tracking
- Record site purchases with project assignment, description, amount, date, and payment method (`Cash`, `Bank Transfer`, `Card`, `Cheque`, `Other`).
- Categorized expenditures (`Materials`, `Labour`, `Equipment`, `Transportation`, `Utilities`, `Rent`, `Food`, `Other`).
- Live search by project name or description, plus category filter dropdowns.

### Workforce Management
- Register trade workers (e.g., Masons, Electricians, Plumbers, Foremen).
- Record contact numbers, daily wages, and availability status (`Active`, `Inactive`).
- Search and filter labor records in real time.

### Invoice Management
- Issue project-linked client invoices with unique invoice numbers.
- Record client name, billing amount, issue date, due date, and payment status (`Pending`, `Paid`).
- Prevents duplicate invoice numbers and validates that due dates occur on or after issue dates.
- Filter invoices by payment status.

### Reports & Analytics
- **Project Budget Analysis**: Side-by-side comparison of budget vs. actual expenses with utilization percentages and over-budget warning indicators.
- **Expense Category Breakdown**: Ranked expenditure distribution with progress bars showing spending share.
- **Receivables Overview**: Separate tracking for collected revenue vs. pending client receivables.
- One-click report refresh button.

### Company Settings & Data Management
- **Company Profile**: Customize company name, email, phone, and office address.
- **Regional Preferences**: Switch currency display (`PKR`, `USD`, `OMR`, `AED`) and date format (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`). All dashboard numbers and dates update dynamically.
- **Data Backup & Restore**: Export the complete workspace dataset as a downloadable `.json` file, and restore backups with automatic validation and rollback protection.

---

## 3. Technology Stack

- **HTML5**: Semantic tags (`<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- **CSS3**: Custom design tokens, CSS Grid for macro layouts, Flexbox for micro components, and mobile-first media queries.
- **Vanilla JavaScript (ES6+)**: Pure JavaScript with zero external frameworks or libraries.
- **Browser Web Storage**: Safe `localStorage` API wrapper with error handling and fallback support.

> **Design Direction (DecodeLabs Palette):**
> - **Mocha Mousse (`#A78B72`)**: Primary brand identity and key action buttons.
> - **Ethereal Blue (`#A0D4E0`)**: Focus rings and accessible highlights.
> - **Moonlit Grey (`#F2F0EA`)**: Grounded, warm page background.
> - **Pure White (`#FFFFFF`)**: Crisp panel cards and elevated surfaces.
> - **Dark Text (`#252525`)**: High-contrast, readable body typography.
> - **Muted Text (`#777777`)**: Secondary labels and supporting metadata.

---

## 4. Project Folder Structure

```text
Build Track Full Stack Project/
│
├── assets/
│   ├── icons/            # Asset storage
│   └── images/           # Asset storage
│
├── css/
│   ├── style.css         # Design tokens, reset, typography, and base layout
│   ├── components.css    # Reusable components (buttons, forms, cards, badges)
│   └── responsive.css    # Mobile-first breakpoints and media queries
│
├── js/
│   ├── storage.js        # LocalStorage wrapper, currency/date formatters, mobile nav
│   ├── app.js            # Dashboard overview calculations, charts, and activity
│   ├── projects.js       # Projects CRUD operations and search
│   ├── expenses.js       # Expenses CRUD operations, category filters, and project linkage
│   ├── workforce.js      # Workforce CRUD operations and trade wage tracking
│   ├── invoices.js       # Invoices CRUD operations and client receivable tracking
│   ├── reports.js        # Financial reports and budget analytics engine
│   └── settings.js       # Profile, regional preferences, and JSON backup export/import
│
├── pages/
│   ├── projects.html     # Construction project management page
│   ├── expenses.html     # Site expenses logging page
│   ├── workforce.html    # Labor and workforce page
│   ├── invoices.html     # Client invoice management page
│   ├── reports.html      # Business intelligence and financial reports page
│   └── settings.html     # Company profile and backup preferences page
│
├── index.html            # Primary application dashboard
└── README.md             # Project documentation
```

---

## 5. How to Run the Project

No build step, node modules, bundler, or web server installation is required.

1. **Option A: Direct Browser Opening**
   - Double-click `index.html` or right-click `index.html` and choose **Open with Google Chrome** (or Edge / Firefox / Safari).
2. **Option B: Using a Local Server (e.g., VS Code Live Server)**
   - Open the project folder in VS Code.
   - Right-click `index.html` and click **Open with Live Server**.
   - Navigate to `http://localhost:5500`.

---

## 6. How Local Storage Works

All data is stored directly in your browser's `localStorage` under distinct namespaced keys:

| Key Name | Data Stored | Default Structure |
| :--- | :--- | :--- |
| `buildtrack-projects` | Array of project objects | `[{ id, name, location, budget, status, description, createdAt }]` |
| `buildtrack-expenses` | Array of expense objects | `[{ id, projectId, description, amount, category, date, paymentMethod }]` |
| `buildtrack-workers` | Array of worker objects | `[{ id, name, role, phone, dailyRate, status, createdAt }]` |
| `buildtrack-invoices` | Array of invoice objects | `[{ id, number, client, projectId, amount, issueDate, dueDate, status }]` |
| `buildtrack-settings` | Application settings object | `{ company: { name, email, phone, address }, regional: { currency, dateFormat } }` |

### Data Safety Measures
- Safe retrieval through `JSON.parse` wrapped in `try/catch` prevents crashes from corrupted data.
- Deleting or importing data includes browser confirmation alerts.
- Data export packages all 5 keys into a timestamped JSON file.
- Data import validates JSON schema before overwriting existing records and rolls back automatically if an error occurs.

---

## 7. Responsive Design Breakpoints

BuildTrack is built with a **mobile-first** approach:

- **Mobile Phones (< 480px)**: Compact padding, full-width button actions, vertical form stacks, and a slide-out mobile drawer navigation accessible via the topbar menu button (`☰`).
- **Tablets (768px – 1023px)**: 2-column metric cards, 2-column form grids, and balanced panel layouts.
- **Desktops (1024px+)**: Two-column layout with a sticky left sidebar, 4-column metric cards, and expanded analytical charts.
- **Large Displays (1440px+)**: Content width capped at 1500px with generous margins.

---

## 8. Known Limitations

- **Single-Browser Storage**: Data stored in browser `localStorage` is local to that specific browser and device.
- **Browser Clearing**: Clearing browser cache and website cookies will wipe localStorage unless a JSON backup was exported beforehand.
- **No Multi-User Authentication**: Intended as a single-user frontend management application for Project 1.

---

## 9. License

Developed for educational and portfolio preparation purposes at **DecodeLabs (Batch 2026)**. Feel free to use, inspect, modify, and learn from this codebase.
