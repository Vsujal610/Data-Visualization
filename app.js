// ============================================================
// Core Application Controller Module
// Coordinates page routing, filters, modal actions, and DOM rendering
// ============================================================

// Global Product Database mapping
const CATEGORY_PRODUCTS = {
  Electronics: ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Headphones', 'Smart Watch'],
  Furniture: ['Desk', 'Chair', 'Bookshelf', 'Lamp', 'Sofa', 'Cabinet'],
  Clothing: ['Jacket', 'Shoes', 'T-Shirt', 'Jeans', 'Sweater', 'Boots'],
  Sports: ['Bicycle', 'Yoga Mat', 'Dumbbells', 'Running Shoes', 'Tennis Racket', 'Football'],
  'Home & Garden': ['Vacuum Cleaner', 'Coffee Maker', 'Blender', 'Garden Hose', 'Plant Pot', 'Curtains'],
};

const app = {
  // Application State
  state: {
    allData: [],
    filteredData: [],
    filters: {
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      region: 'All',
      category: 'All',
    },
    currentView: 'dashboard',
    table: {
      page: 1,
      pageSize: 10,
      sortBy: 'date',
      sortDesc: false,
      search: '',
    }
  },

  // Formatting helpers
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
  },

  formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  },

  // ------------------------------------------------------------
  // Initialization & Event Binds
  // ------------------------------------------------------------
  async init() {
    try {
      // 1. Fetch initial records
      this.state.allData = await window.api.fetchSalesData();
      
      // 2. Initialize elements
      this.initFormDropdowns();
      this.applyFilters();

      // 3. Render initial widgets and icons
      lucide.createIcons();
      window.charts.initAll(this.state.filteredData);
      
      // 4. Bind DOM events
      this.bindEvents();
      
      // 5. Initial View Render
      this.updateView();
      
      this.triggerToast('Application initialized successfully.', 'success');
    } catch (err) {
      console.error(err);
      this.triggerToast('Failed to initialize dashboard. Is the server running?', 'error');
    }
  },

  bindEvents() {
    // ---- Sidebar Navigation Links ----
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const viewName = btn.dataset.targetView;
        if (viewName) this.switchView(viewName);
        
        // Auto-close sidebar on mobile
        document.querySelector('#app-sidebar').classList.add('-translate-x-full');
      });
    });

    // Mobile Sidebar controls
    document.querySelector('#sidebar-toggle-btn').addEventListener('click', () => {
      document.querySelector('#app-sidebar').classList.remove('-translate-x-full');
    });
    document.querySelector('#sidebar-close-btn').addEventListener('click', () => {
      document.querySelector('#app-sidebar').classList.add('-translate-x-full');
    });

    // ---- Filter Bar Inputs ----
    document.querySelector('#filter-start-date').addEventListener('change', (e) => {
      this.state.filters.startDate = e.target.value;
      this.onFilterChange();
    });
    document.querySelector('#filter-end-date').addEventListener('change', (e) => {
      this.state.filters.endDate = e.target.value;
      this.onFilterChange();
    });
    document.querySelector('#filter-region').addEventListener('change', (e) => {
      this.state.filters.region = e.target.value;
      this.onFilterChange();
    });
    document.querySelector('#filter-category').addEventListener('change', (e) => {
      this.state.filters.category = e.target.value;
      this.onFilterChange();
    });
    document.querySelector('#filter-reset-btn').addEventListener('click', () => {
      this.resetFilters();
    });

    // ---- Reports View Search & Pagination & Sort ----
    document.querySelector('#reports-search').addEventListener('input', (e) => {
      this.state.table.search = e.target.value.toLowerCase().trim();
      this.state.table.page = 1;
      this.updateReportsView();
    });

    document.querySelectorAll('.reports-th').forEach((th) => {
      th.addEventListener('click', () => {
        const sortKey = th.dataset.sortKey;
        if (this.state.table.sortBy === sortKey) {
          this.state.table.sortDesc = !this.state.table.sortDesc;
        } else {
          this.state.table.sortBy = sortKey;
          this.state.table.sortDesc = false;
        }
        
        // Update header UI indicator (optional details)
        document.querySelectorAll('.reports-th').forEach(el => el.classList.remove('bg-slate-800'));
        th.classList.add('bg-slate-800');

        this.updateReportsView();
      });
    });

    document.querySelector('#reports-btn-prev').addEventListener('click', () => {
      if (this.state.table.page > 1) {
        this.state.table.page--;
        this.updateReportsView();
      }
    });

    document.querySelector('#reports-btn-next').addEventListener('click', () => {
      const totalPages = Math.ceil(this.getReportFilteredData().length / this.state.table.pageSize);
      if (this.state.table.page < totalPages) {
        this.state.table.page++;
        this.updateReportsView();
      }
    });

    // ---- Modal Form Actions ----
    const modalEl = document.querySelector('#add-record-modal');
    document.querySelector('#open-add-modal-btn').addEventListener('click', () => {
      modalEl.classList.add('active');
      // Set today as default date in modal
      const today = new Date().toISOString().split('T')[0];
      modalEl.querySelector('input[name="date"]').value = today;
    });

    const closeModal = () => {
      modalEl.classList.remove('active');
      document.querySelector('#add-record-form').reset();
      this.initFormDropdowns();
    };

    document.querySelector('#close-add-modal-btn').addEventListener('click', closeModal);
    document.querySelector('#cancel-add-record-btn').addEventListener('click', closeModal);
    
    // Dynamic Product selection inside Modal Form
    document.querySelector('#modal-form-category').addEventListener('change', (e) => {
      this.populateFormProducts(e.target.value);
    });

    // Form Submission
    document.querySelector('#add-record-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const record = {
        date: formData.get('date'),
        region: formData.get('region'),
        category: formData.get('category'),
        product: formData.get('product'),
        sales: parseFloat(formData.get('sales')),
        quantity: parseInt(formData.get('quantity'), 10),
        profit: parseFloat(formData.get('profit')),
      };

      try {
        const saved = await window.api.addSalesRecord(record);
        this.state.allData.push(saved);
        
        // Re-sort data array
        this.state.allData.sort((a, b) => a.date.localeCompare(b.date));

        closeModal();
        this.triggerToast('Sales record saved successfully.', 'success');
        this.applyFilters();
        this.updateView();
      } catch (error) {
        console.error(error);
        this.triggerToast(error.message || 'Failed to save sales record.', 'error');
      }
    });

    // ---- Export Buttons (Dedicated Export page & quick links) ----
    document.querySelectorAll('.btn-export-card, .btn-quick-export').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // Prevent event duplication if child button clicked in cards
        e.stopPropagation();
        const format = btn.dataset.format;
        if (format) this.handleExportAction(format);
      });
    });
  },

  // ------------------------------------------------------------
  // State Mutators & Calculations
  // ------------------------------------------------------------
  applyFilters() {
    this.state.filteredData = this.state.allData.filter((r) => {
      if (!window.stats.isInDateRange(r.date, this.state.filters)) return false;
      if (this.state.filters.region !== 'All' && r.region !== this.state.filters.region) return false;
      if (this.state.filters.category !== 'All' && r.category !== this.state.filters.category) return false;
      return true;
    });

    // Sidebar status counter updates
    document.querySelector('#sidebar-total-count').textContent = this.formatNumber(this.state.filteredData.length);
  },

  onFilterChange() {
    this.applyFilters();
    this.state.table.page = 1; // reset table page
    this.updateView();
    // Update active charts with transition effects
    window.charts.updateAll(this.state.filteredData);
  },

  resetFilters() {
    this.state.filters = {
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      region: 'All',
      category: 'All',
    };

    // Reflect inside DOM selectors
    document.querySelector('#filter-start-date').value = this.state.filters.startDate;
    document.querySelector('#filter-end-date').value = this.state.filters.endDate;
    document.querySelector('#filter-region').value = this.state.filters.region;
    document.querySelector('#filter-category').value = this.state.filters.category;

    this.onFilterChange();
  },

  // ------------------------------------------------------------
  // Modal Form Helpers
  // ------------------------------------------------------------
  initFormDropdowns() {
    const defaultCategory = 'Electronics';
    document.querySelector('#modal-form-category').value = defaultCategory;
    this.populateFormProducts(defaultCategory);
  },

  populateFormProducts(category) {
    const products = CATEGORY_PRODUCTS[category] || [];
    const productSelect = document.querySelector('#modal-form-product');
    productSelect.innerHTML = '';
    
    products.forEach((prod) => {
      const opt = document.createElement('option');
      opt.value = prod;
      opt.textContent = prod;
      productSelect.appendChild(opt);
    });
  },

  // ------------------------------------------------------------
  // Tab Routing Actions
  // ------------------------------------------------------------
  switchView(viewName) {
    this.state.currentView = viewName;
    
    // Hide all view panels
    document.querySelectorAll('.view-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    // Show targets
    const targetPanel = document.querySelector(`#view-${viewName}`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
      targetPanel.classList.add('page-enter');
    }

    // Set Sidebar item active
    document.querySelectorAll('.nav-item').forEach((btn) => {
      if (btn.dataset.targetView === viewName) {
        btn.classList.add('nav-item-active');
      } else {
        btn.classList.remove('nav-item-active');
      }
    });

    // Update Page titles
    const titleEl = document.querySelector('#page-view-title');
    const descEl = document.querySelector('#page-view-desc');
    
    const viewMeta = {
      dashboard: { title: 'Dashboard', desc: 'Overview performance indicators & trending analysis.' },
      graphs: { title: 'Graphs', desc: 'Multi-visualization sales trend analytics.' },
      reports: { title: 'Reports', desc: 'Interactive ledger tables, filters & deletion.' },
      statistics: { title: 'Statistics', desc: 'Detailed variance, standard deviation & region profiles.' },
      export: { title: 'Export Data', desc: 'Direct download center for executive reports.' }
    };

    const meta = viewMeta[viewName] || { title: 'Dashboard', desc: '' };
    titleEl.textContent = meta.title;
    descEl.textContent = meta.desc;

    // Refresh display
    this.updateView();
  },

  updateView() {
    if (this.state.currentView === 'dashboard') {
      this.updateDashboardView();
    } else if (this.state.currentView === 'graphs') {
      // Handled by ApexCharts update, but refresh container triggers if necessary
    } else if (this.state.currentView === 'reports') {
      this.updateReportsView();
    } else if (this.state.currentView === 'statistics') {
      this.updateStatisticsView();
    } else if (this.state.currentView === 'export') {
      this.updateExportView();
    }
  },

  // ------------------------------------------------------------
  // Dashboard Renderer
  // ------------------------------------------------------------
  updateDashboardView() {
    const results = window.stats.getStatistics(this.state.filteredData, this.state.allData, this.state.filters);
    const kpis = results.kpis;

    // KPI Values
    document.querySelector('#kpi-sales-value').textContent = this.formatCurrency(kpis.totalSales);
    document.querySelector('#kpi-profit-value').textContent = this.formatCurrency(kpis.totalProfit);
    document.querySelector('#kpi-orders-value').textContent = this.formatNumber(kpis.totalOrders);
    document.querySelector('#kpi-aov-value').textContent = this.formatCurrency(kpis.avgOrderValue);

    // KPI Trends
    this.renderKPIDiff('#kpi-sales-diff', kpis.salesChange);
    this.renderKPIDiff('#kpi-profit-diff', kpis.profitChange);
    this.renderKPIDiff('#kpi-orders-diff', kpis.ordersChange);
    this.renderKPIDiff('#kpi-aov-diff', kpis.avgValueChange);

    // Text descriptions
    document.querySelector('#dashboard-records-count').textContent = this.formatNumber(this.state.filteredData.length);
    document.querySelector('#dashboard-revenue-sum').textContent = this.formatCurrency(kpis.totalSales);
  },

  renderKPIDiff(selector, value) {
    const el = document.querySelector(selector);
    el.textContent = this.formatPercent(value);
    
    // Remove original styles
    el.className = 'text-[11px] font-bold px-1.5 py-0.5 rounded-full';

    if (value > 0) {
      el.classList.add('bg-emerald-500/10', 'text-emerald-400');
    } else if (value < 0) {
      el.classList.add('bg-rose-500/10', 'text-rose-450');
    } else {
      el.classList.add('bg-slate-800', 'text-slate-400');
    }
  },

  // ------------------------------------------------------------
  // Reports Table Renderer
  // ------------------------------------------------------------
  getReportFilteredData() {
    const { search, sortBy, sortDesc } = this.state.table;
    let data = [...this.state.filteredData];

    // 1. Text Search matching Product
    if (search) {
      data = data.filter(r => r.product.toLowerCase().includes(search));
    }

    // 2. Sorting
    data.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      } else {
        return sortDesc ? valB - valA : valA - valB;
      }
    });

    return data;
  },

  updateReportsView() {
    const tableBody = document.querySelector('#reports-table-body');
    const reportsData = this.getReportFilteredData();
    
    // Pagination slicing
    const { page, pageSize } = this.state.table;
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, reportsData.length);
    const paginatedData = reportsData.slice(startIndex, endIndex);

    // Table rows generation
    tableBody.innerHTML = '';
    
    if (paginatedData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-8 text-slate-500 font-medium">No sales records matched your criteria.</td>
        </tr>
      `;
    } else {
      paginatedData.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row-anim hover:bg-slate-800/30 transition text-slate-200';
        tr.style.animationDelay = `${i * 20}ms`;
        
        tr.innerHTML = `
          <td class="px-5 py-3 font-semibold text-slate-400">${row.id}</td>
          <td class="px-5 py-3 font-medium whitespace-nowrap">${row.date}</td>
          <td class="px-5 py-3 whitespace-nowrap">${row.region}</td>
          <td class="px-5 py-3 font-bold text-slate-100">${row.product}</td>
          <td class="px-5 py-3">
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-lg border bg-slate-800/40 border-slate-700 text-slate-350">${row.category}</span>
          </td>
          <td class="px-5 py-3 text-right font-semibold text-indigo-400">$${row.sales.toLocaleString()}</td>
          <td class="px-5 py-3 text-right">${row.quantity}</td>
          <td class="px-5 py-3 text-right font-semibold text-emerald-400">$${row.profit.toLocaleString()}</td>
          <td class="px-5 py-3 text-center">
            <button class="p-1 text-slate-500 hover:text-rose-400 rounded-md transition hover:bg-rose-500/10 cursor-pointer btn-delete-row" data-id="${row.id}">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        `;

        tableBody.appendChild(tr);
      });
      
      // Bind delete button listeners
      tableBody.querySelectorAll('.btn-delete-row').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(btn.dataset.id, 10);
          if (id) this.deleteRecord(id);
        });
      });

      // Render fresh lucide icons on generated cells
      lucide.createIcons();
    }

    // Reports layout labels
    document.querySelector('#reports-subtitle').textContent = `${this.formatNumber(reportsData.length)} records match your filters`;
    
    // Pagination buttons state
    document.querySelector('#reports-pagination-info').textContent = reportsData.length > 0 
      ? `Showing ${startIndex + 1}-${endIndex} of ${this.formatNumber(reportsData.length)} entries` 
      : 'Showing 0-0 of 0 entries';

    const totalPages = Math.ceil(reportsData.length / pageSize);
    document.querySelector('#reports-btn-prev').disabled = page <= 1;
    document.querySelector('#reports-btn-next').disabled = page >= totalPages || totalPages === 0;
  },

  async deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this sales record?')) return;

    try {
      await window.api.deleteSalesRecord(id);
      
      // Remove locally
      this.state.allData = this.state.allData.filter(r => r.id !== id);
      
      this.triggerToast('Sales record deleted successfully.', 'success');
      this.applyFilters();
      this.updateView();
      window.charts.updateAll(this.state.filteredData);
    } catch (err) {
      console.error(err);
      this.triggerToast('Failed to delete sales record.', 'error');
    }
  },

  // ------------------------------------------------------------
  // Statistics View Renderer
  // ------------------------------------------------------------
  updateStatisticsView() {
    const results = window.stats.getStatistics(this.state.filteredData, this.state.allData, this.state.filters);
    const statsSummary = results.stats;
    const regionStats = results.regionStats;

    document.querySelector('#stats-subtitle').textContent = `Statistical calculations on ${this.formatNumber(this.state.filteredData.length)} records`;

    // 1. Sales row
    document.querySelector('#stat-sales-sum').textContent = this.formatCurrency(statsSummary.sales.total);
    document.querySelector('#stat-sales-avg').textContent = this.formatCurrency(statsSummary.sales.avg);
    document.querySelector('#stat-sales-med').textContent = this.formatCurrency(statsSummary.sales.median);
    document.querySelector('#stat-sales-min').textContent = this.formatCurrency(statsSummary.sales.min);
    document.querySelector('#stat-sales-max').textContent = this.formatCurrency(statsSummary.sales.max);

    // 2. Profit row
    document.querySelector('#stat-profit-sum').textContent = this.formatCurrency(statsSummary.profit.total);
    document.querySelector('#stat-profit-avg').textContent = this.formatCurrency(statsSummary.profit.avg);
    document.querySelector('#stat-profit-med').textContent = this.formatCurrency(statsSummary.profit.median);
    document.querySelector('#stat-profit-min').textContent = this.formatCurrency(statsSummary.profit.min);
    document.querySelector('#stat-profit-max').textContent = this.formatCurrency(statsSummary.profit.max);

    // 3. Quantity row
    document.querySelector('#stat-quantity-sum').textContent = this.formatNumber(statsSummary.quantity.total);
    document.querySelector('#stat-quantity-avg').textContent = this.formatNumber(statsSummary.quantity.avg);
    document.querySelector('#stat-quantity-med').textContent = this.formatNumber(statsSummary.quantity.median);
    document.querySelector('#stat-quantity-min').textContent = this.formatNumber(statsSummary.quantity.min);
    document.querySelector('#stat-quantity-max').textContent = this.formatNumber(statsSummary.quantity.max);

    // 4. Region breakdowns
    const regionContainer = document.querySelector('#stats-region-cards-container');
    regionContainer.innerHTML = '';

    regionStats.forEach((reg, i) => {
      const card = document.createElement('div');
      card.className = 'p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 shadow-md hover:shadow-lg transition duration-200';
      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <span class="text-sm font-bold text-slate-100">${reg.region} Region</span>
          <span class="text-[10px] text-slate-500 font-bold font-mono">${reg.totalOrders} Orders</span>
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-400">Total Sales:</span>
            <span class="font-bold text-indigo-400">${this.formatCurrency(reg.totalSales)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Total Profit:</span>
            <span class="font-bold text-emerald-400">${this.formatCurrency(reg.totalProfit)}</span>
          </div>
          <div class="flex justify-between border-t border-slate-850 pt-2 mt-2">
            <span class="text-slate-500">Avg Sale Value:</span>
            <span class="font-semibold text-slate-300">${this.formatCurrency(reg.avgSales)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Avg Profit Value:</span>
            <span class="font-semibold text-slate-300">${this.formatCurrency(reg.avgProfit)}</span>
          </div>
        </div>
      `;
      regionContainer.appendChild(card);
    });
  },

  // ------------------------------------------------------------
  // Export Center Renderer
  // ------------------------------------------------------------
  updateExportView() {
    const count = this.state.filteredData.length;
    document.querySelector('#export-active-rows-label').textContent = this.formatNumber(count);
    document.querySelector('#export-active-rows-value').textContent = this.formatNumber(count);
  },

  async handleExportAction(format) {
    if (this.state.filteredData.length === 0) {
      this.triggerToast('No active records available to export.', 'error');
      return;
    }

    const filename = `sales-pulse-export-${new Date().toISOString().split('T')[0]}`;
    this.triggerToast(`Starting ${format.toUpperCase()} compilation...`, 'info');

    // Add tiny delay for spinner/toast to show up smoothly
    setTimeout(() => {
      try {
        if (format === 'csv') {
          window.exportsUtil.exportToCSV(this.state.filteredData, filename);
        } else if (format === 'json') {
          window.exportsUtil.exportToJSON(this.state.filteredData, filename);
        } else if (format === 'excel') {
          window.exportsUtil.exportToExcel(this.state.filteredData, filename);
        } else if (format === 'pdf') {
          const results = window.stats.getStatistics(this.state.filteredData, this.state.allData, this.state.filters);
          window.exportsUtil.exportToPDF(this.state.filteredData, results.kpis, filename);
        }
        this.triggerToast(`${format.toUpperCase()} file downloaded successfully.`, 'success');
      } catch (err) {
        console.error(err);
        this.triggerToast(`Failed to export ${format.toUpperCase()} report.`, 'error');
      }
    }, 400);
  },

  // ------------------------------------------------------------
  // Toast Notifications
  // ------------------------------------------------------------
  triggerToast(message, type = 'info') {
    const root = document.querySelector('#toast-portal-root');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Get icons for type
    const icons = {
      success: '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-450 mr-2 shrink-0"></i>',
      error: '<i data-lucide="alert-triangle" class="w-4 h-4 text-rose-450 mr-2 shrink-0"></i>',
      info: '<i data-lucide="info" class="w-4 h-4 text-indigo-400 mr-2 shrink-0"></i>'
    };

    toast.innerHTML = `
      <div class="flex items-center">
        ${icons[type] || ''}
        <span>${message}</span>
      </div>
      <button class="ml-4 text-slate-500 hover:text-slate-350 cursor-pointer" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    root.appendChild(toast);
    
    // Re-render fresh lucide icons on toast
    lucide.createIcons();

    // Auto-remove toast in 3 seconds
    setTimeout(() => {
      toast.classList.add('toast-exit');
      // wait for slide out keyframe
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3000);
  }
};

window.app = app;

// Bootstrap Application on content load
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
