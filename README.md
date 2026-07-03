# SalesPulse - Full-Stack Sales Dashboard

A modern, high-performance, dark-themed Sales Performance Dashboard built with vanilla HTML, CSS, JavaScript, and a Node.js/Express backend. It features interactive data visualizations, prior-period KPI analytics, dynamic filters, a searchable data ledger, and multi-format data exports.

## 🚀 Features

- **Dynamic KPIs**: Monitors Sales, Profit, Orders, and Average Order Value, complete with percentage change trends compared to the equivalent prior period.
- **Interactive Visualizations**: Powered by ApexCharts, displaying monthly trends, category sales distributions, and region breakdowns.
- **Product Analysis**: Includes timeline charts, category doughnut distributions, and horizontal bar charts highlighting top-performing products.
- **Reports Ledger**: A fully paginated and searchable table with column-sorting and active row deletion.
- **Statistics Summary**: Detailed statistical calculations (sums, averages, medians, minimums, and maximums) for sales, profits, and quantities.
- **Data Export Center**: Instant downloading in CSV, JSON, Microsoft Excel (SheetJS), and landscape-oriented executive PDF (jsPDF + AutoTable) formats.
- **CRUD Operations**: Live database management via an interactive modal to add new sales records.
- **Self-Healing Database**: Auto-populates `data/sales.json` with 250 realistic sales records on first run if database is missing.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Custom CSS (animations & toast notifications), Vanilla JS (ES6 modules).
- **External CDNs**: ApexCharts, Lucide Icons, SheetJS (XLSX), jsPDF, jsPDF-AutoTable.
- **Backend**: Node.js, Express.js.
- **Database**: Local JSON File Database (`data/sales.json`).

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)

### Run Locally

1. Clone or download this repository.
2. In the project directory, install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to **http://localhost:3000** to preview!
