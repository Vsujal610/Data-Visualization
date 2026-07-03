// ============================================================
// ApexCharts Wrapper Module
// Initializes, styles, and updates all visual chart components
// ============================================================

const charts = {
  instances: {},

  /** Common theme config for charts */
  commonOptions: {
    chart: {
      foreColor: '#94a3b8',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      background: 'transparent'
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.08)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    theme: {
      mode: 'dark'
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: {
        formatter: (val) => `$${val.toLocaleString()}`
      }
    }
  },

  /** Formatter for currency labels */
  formatCurrencyShort(v) {
    if (v >= 1000) {
      return `$${(v / 1000).toFixed(0)}k`;
    }
    return `$${v}`;
  },

  /** Groups data chronologically by month for line/bar trend charts */
  getMonthlyData(records) {
    const map = new Map();
    records.forEach((r) => {
      const key = r.date.substring(0, 7); // '2025-01'
      // Get month label like "Jan 2025"
      const dateObj = new Date(r.date + 'T00:00:00');
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const existing = map.get(key);
      if (existing) {
        existing.sales += r.sales;
        existing.profit += r.profit;
        existing.orders += 1;
      } else {
        map.set(key, { month: label, sales: r.sales, profit: r.profit, orders: 1 });
      }
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  },

  /** Initializer for all charts */
  initAll(filteredData) {
    this.destroyAll();

    const monthlyData = this.getMonthlyData(filteredData);
    const categoryData = window.stats.groupByCategory(filteredData);
    const regionData = window.stats.groupByRegionForChart(filteredData);

    // Compute Product Performance (Top 8 Products by Sales)
    const productData = this.getTopProducts(filteredData, 8);

    // --- 1. Dashboard: Monthly Sales (Bar Chart) ---
    const salesBarEl = document.querySelector('#dashboard-sales-chart');
    if (salesBarEl) {
      this.instances.salesBar = new ApexCharts(salesBarEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'bar', height: 260 },
        series: [{ name: 'Sales', data: monthlyData.map(d => Math.round(d.sales)) }],
        colors: ['#6366f1'], // Indigo
        plotOptions: {
          bar: { borderRadius: 4, columnWidth: '60%' }
        },
        xaxis: {
          categories: monthlyData.map(d => d.month),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { formatter: this.formatCurrencyShort }
        }
      });
      this.instances.salesBar.render();
    }

    // --- 2. Dashboard: Monthly Profit (Line/Area Chart) ---
    const profitLineEl = document.querySelector('#dashboard-profit-chart');
    if (profitLineEl) {
      this.instances.profitLine = new ApexCharts(profitLineEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'area', height: 260 },
        series: [{ name: 'Profit', data: monthlyData.map(d => Math.round(d.profit)) }],
        colors: ['#10b981'], // Emerald
        stroke: { curve: 'smooth', width: 2.5 },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.35,
            opacityTo: 0.02,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          categories: monthlyData.map(d => d.month),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { formatter: this.formatCurrencyShort }
        }
      });
      this.instances.profitLine.render();
    }

    // --- 3. Dashboard: Category breakdown (Donut Chart) ---
    const categoryPieEl = document.querySelector('#dashboard-category-chart');
    if (categoryPieEl) {
      this.instances.categoryPie = new ApexCharts(categoryPieEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'donut', height: 265 },
        series: categoryData.map(d => Math.round(d.value)),
        labels: categoryData.map(d => d.name),
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
        stroke: { show: false },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total Sales',
                  formatter: (w) => {
                    const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    return '$' + sum.toLocaleString();
                  }
                }
              }
            }
          }
        },
        legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '11px' }
      });
      this.instances.categoryPie.render();
    }

    // --- 4. Dashboard: Region breakdown (Bar Chart) ---
    const regionBarEl = document.querySelector('#dashboard-region-chart');
    if (regionBarEl) {
      this.instances.regionBar = new ApexCharts(regionBarEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'bar', height: 260 },
        series: [
          { name: 'Sales', data: regionData.map(d => Math.round(d.sales)) },
          { name: 'Profit', data: regionData.map(d => Math.round(d.profit)) }
        ],
        colors: ['#6366f1', '#10b981'], // Indigo, Emerald
        plotOptions: {
          bar: { borderRadius: 4, columnWidth: '55%' }
        },
        xaxis: {
          categories: regionData.map(d => d.region),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { formatter: this.formatCurrencyShort }
        }
      });
      this.instances.regionBar.render();
    }

    // --- 5. Graphs View: Monthly Revenue Trend (Full Area Chart) ---
    const graphsRevenueEl = document.querySelector('#graphs-revenue-chart');
    if (graphsRevenueEl) {
      this.instances.graphsRevenue = new ApexCharts(graphsRevenueEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'area', height: 320 },
        series: [{ name: 'Revenue', data: monthlyData.map(d => Math.round(d.sales)) }],
        colors: ['#6366f1'],
        stroke: { curve: 'monotoneCubic', width: 3 },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.3,
            opacityTo: 0.0,
            stops: [0, 95, 100]
          }
        },
        markers: {
          size: 4,
          colors: ['#6366f1'],
          strokeColors: '#0f172a',
          strokeWidth: 2
        },
        xaxis: {
          categories: monthlyData.map(d => d.month),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { formatter: this.formatCurrencyShort }
        }
      });
      this.instances.graphsRevenue.render();
    }

    // --- 6. Graphs View: Product Performance (Horizontal Bar Chart) ---
    const graphsProductEl = document.querySelector('#graphs-product-chart');
    if (graphsProductEl) {
      this.instances.graphsProduct = new ApexCharts(graphsProductEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'bar', height: 280 },
        series: [{ name: 'Sales', data: productData.map(d => Math.round(d.sales)) }],
        colors: ['#3b82f6'], // Light Blue
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 4,
            barHeight: '60%'
          }
        },
        xaxis: {
          categories: productData.map(d => d.name),
          labels: { formatter: this.formatCurrencyShort },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { style: { colors: '#e2e8f0' } }
        },
        tooltip: {
          ...this.commonOptions.tooltip,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const dataObj = productData[dataPointIndex];
            if (!dataObj) return '';
            return `
              <div class="chart-tooltip p-3 bg-slate-900 border border-slate-700/60 rounded-xl shadow-xl">
                <p class="text-xs font-bold text-slate-100 mb-1">${dataObj.name}</p>
                <p class="text-[11px] text-slate-400">Sales: <span class="text-indigo-400 font-semibold">$${dataObj.sales.toLocaleString()}</span></p>
                <p class="text-[11px] text-slate-400">Profit: <span class="text-emerald-400 font-semibold">$${dataObj.profit.toLocaleString()}</span></p>
              </div>
            `;
          }
        }
      });
      this.instances.graphsProduct.render();
    }

    // --- 7. Graphs View: Revenue Distribution (Doughnut Chart) ---
    const graphsDistEl = document.querySelector('#graphs-dist-chart');
    if (graphsDistEl) {
      this.instances.graphsDist = new ApexCharts(graphsDistEl, {
        ...this.commonOptions,
        chart: { ...this.commonOptions.chart, type: 'donut', height: 280 },
        series: categoryData.map(d => Math.round(d.value)),
        labels: categoryData.map(d => d.name),
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
        stroke: { show: false },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Active Revenue',
                  formatter: (w) => {
                    const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    return '$' + sum.toLocaleString();
                  }
                }
              }
            }
          }
        },
        legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '11px' },
        tooltip: {
          ...this.commonOptions.tooltip,
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const cat = categoryData[dataPointIndex];
            if (!cat) return '';
            return `
              <div class="chart-tooltip p-3 bg-slate-900 border border-slate-700/60 rounded-xl shadow-xl">
                <p class="text-xs font-bold text-slate-100 mb-1">${cat.name}</p>
                <p class="text-[11px] text-slate-400">Revenue: <span class="text-indigo-400 font-semibold">$${cat.value.toLocaleString()}</span></p>
                <p class="text-[11px] text-slate-400">Profit: <span class="text-emerald-400 font-semibold">$${cat.profit.toLocaleString()}</span></p>
              </div>
            `;
          }
        }
      });
      this.instances.graphsDist.render();
    }
  },

  /** Helper to fetch and group top items */
  getTopProducts(records, count = 8) {
    const productMap = {};
    records.forEach((r) => {
      if (!productMap[r.product]) {
        productMap[r.product] = { name: r.product, sales: 0, profit: 0 };
      }
      productMap[r.product].sales += r.sales;
      productMap[r.product].profit += r.profit;
    });

    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, count);
  },

  /** Updates the charts dynamically when filters or datasets change */
  updateAll(filteredData) {
    const monthlyData = this.getMonthlyData(filteredData);
    const categoryData = window.stats.groupByCategory(filteredData);
    const regionData = window.stats.groupByRegionForChart(filteredData);
    const productData = this.getTopProducts(filteredData, 8);

    // Dashboard Monthly Sales
    if (this.instances.salesBar) {
      this.instances.salesBar.updateOptions({
        xaxis: { categories: monthlyData.map(d => d.month) }
      }, false, false);
      this.instances.salesBar.updateSeries([{
        name: 'Sales', data: monthlyData.map(d => Math.round(d.sales))
      }]);
    }

    // Dashboard Monthly Profit
    if (this.instances.profitLine) {
      this.instances.profitLine.updateOptions({
        xaxis: { categories: monthlyData.map(d => d.month) }
      }, false, false);
      this.instances.profitLine.updateSeries([{
        name: 'Profit', data: monthlyData.map(d => Math.round(d.profit))
      }]);
    }

    // Dashboard Category Donut
    if (this.instances.categoryPie) {
      this.instances.categoryPie.updateOptions({
        labels: categoryData.map(d => d.name)
      }, false, false);
      this.instances.categoryPie.updateSeries(categoryData.map(d => Math.round(d.value)));
    }

    // Dashboard Region Grouped
    if (this.instances.regionBar) {
      this.instances.regionBar.updateOptions({
        xaxis: { categories: regionData.map(d => d.region) }
      }, false, false);
      this.instances.regionBar.updateSeries([
        { name: 'Sales', data: regionData.map(d => Math.round(d.sales)) },
        { name: 'Profit', data: regionData.map(d => Math.round(d.profit)) }
      ]);
    }

    // Graphs: Revenue Trend Area
    if (this.instances.graphsRevenue) {
      this.instances.graphsRevenue.updateOptions({
        xaxis: { categories: monthlyData.map(d => d.month) }
      }, false, false);
      this.instances.graphsRevenue.updateSeries([{
        name: 'Revenue', data: monthlyData.map(d => Math.round(d.sales))
      }]);
    }

    // Graphs: Product Horizontal Bar
    if (this.instances.graphsProduct) {
      // Re-initialize custom tooltips or options to avoid stale closures
      this.instances.graphsProduct.updateOptions({
        xaxis: { categories: productData.map(d => d.name) },
        tooltip: {
          custom: ({ series, seriesIndex, dataPointIndex }) => {
            const dataObj = productData[dataPointIndex];
            if (!dataObj) return '';
            return `
              <div class="chart-tooltip p-3 bg-slate-900 border border-slate-700/60 rounded-xl shadow-xl">
                <p class="text-xs font-bold text-slate-100 mb-1">${dataObj.name}</p>
                <p class="text-[11px] text-slate-400">Sales: <span class="text-indigo-400 font-semibold">$${dataObj.sales.toLocaleString()}</span></p>
                <p class="text-[11px] text-slate-400">Profit: <span class="text-emerald-400 font-semibold">$${dataObj.profit.toLocaleString()}</span></p>
              </div>
            `;
          }
        }
      }, false, false);
      this.instances.graphsProduct.updateSeries([{
        name: 'Sales', data: productData.map(d => Math.round(d.sales))
      }]);
    }

    // Graphs: Category Distribution Donut
    if (this.instances.graphsDist) {
      this.instances.graphsDist.updateOptions({
        labels: categoryData.map(d => d.name),
        tooltip: {
          custom: ({ series, seriesIndex, dataPointIndex }) => {
            const cat = categoryData[dataPointIndex];
            if (!cat) return '';
            return `
              <div class="chart-tooltip p-3 bg-slate-900 border border-slate-700/60 rounded-xl shadow-xl">
                <p class="text-xs font-bold text-slate-100 mb-1">${cat.name}</p>
                <p class="text-[11px] text-slate-400">Revenue: <span class="text-indigo-400 font-semibold">$${cat.value.toLocaleString()}</span></p>
                <p class="text-[11px] text-slate-400">Profit: <span class="text-emerald-400 font-semibold">$${cat.profit.toLocaleString()}</span></p>
              </div>
            `;
          }
        }
      }, false, false);
      this.instances.graphsDist.updateSeries(categoryData.map(d => Math.round(d.value)));
    }
  },

  /** Destroys all active chart instances to prevent DOM memory leaks */
  destroyAll() {
    Object.keys(this.instances).forEach((key) => {
      if (this.instances[key] && typeof this.instances[key].destroy === 'function') {
        this.instances[key].destroy();
      }
    });
    this.instances = {};
  }
};

window.charts = charts;
