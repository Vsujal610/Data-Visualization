// ============================================================
// Statistics and KPI Mathematical Module
// Performs data analysis and math modeling in vanilla JS
// ============================================================

const stats = {
  /** Checks if a date string falls inside the range [startDate, endDate] inclusive */
  isInDateRange(date, range) {
    return date >= range.startDate && date <= range.endDate;
  },

  /** Computes the median of an array of numbers */
  computeMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  },

  /** Computes standard statistical properties for an array of numbers */
  computeStatField(values) {
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0, total: 0 };
    }
    const total = values.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round((total / values.length) * 100) / 100,
      median: this.computeMedian(values),
      total: Math.round(total * 100) / 100,
    };
  },

  /** Generates descriptive statistics for sales, profit, and quantity fields */
  computeStatsSummary(records) {
    return {
      sales: this.computeStatField(records.map((r) => r.sales)),
      profit: this.computeStatField(records.map((r) => r.profit)),
      quantity: this.computeStatField(records.map((r) => r.quantity)),
    };
  },

  /** Groups sales records by region for the statistics table */
  groupByRegion(records) {
    const regions = ['North', 'South', 'East', 'West'];
    return regions.map((region) => {
      const subset = records.filter((r) => r.region === region);
      const totalSales = subset.reduce((a, b) => a + b.sales, 0);
      const totalProfit = subset.reduce((a, b) => a + b.profit, 0);
      return {
        region,
        totalSales: Math.round(totalSales * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalOrders: subset.length,
        avgSales: subset.length ? Math.round((totalSales / subset.length) * 100) / 100 : 0,
        avgProfit: subset.length ? Math.round((totalProfit / subset.length) * 100) / 100 : 0,
      };
    });
  },

  /** Groups sales records by product category for charts */
  groupByCategory(records) {
    const categories = ['Electronics', 'Furniture', 'Clothing', 'Sports', 'Home & Garden'];
    return categories
      .map((cat) => {
        const subset = records.filter((r) => r.category === cat);
        return {
          name: cat,
          value: Math.round(subset.reduce((a, b) => a + b.sales, 0) * 100) / 100,
          profit: Math.round(subset.reduce((a, b) => a + b.profit, 0) * 100) / 100,
        };
      })
      .filter((d) => d.value > 0);
  },

  /** Groups sales records by region specifically structured for charts */
  groupByRegionForChart(records) {
    const regions = ['North', 'South', 'East', 'West'];
    return regions.map((region) => {
      const subset = records.filter((r) => r.region === region);
      return {
        region,
        sales: Math.round(subset.reduce((a, b) => a + b.sales, 0) * 100) / 100,
        profit: Math.round(subset.reduce((a, b) => a + b.profit, 0) * 100) / 100,
        orders: subset.length,
      };
    });
  },

  /** Calculates basic KPIs (Sales, Profit, Orders, AOV) and compares against a previous period */
  computeKPI(current, previous) {
    const totalSales = current.reduce((a, b) => a + b.sales, 0);
    const totalProfit = current.reduce((a, b) => a + b.profit, 0);
    const totalOrders = current.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const prevSales = previous.reduce((a, b) => a + b.sales, 0);
    const prevProfit = previous.reduce((a, b) => a + b.profit, 0);
    const prevOrders = previous.length;
    const prevAvg = prevOrders > 0 ? prevSales / prevOrders : 0;

    const pctChange = (curr, prev) =>
      prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 1000) / 10;

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      salesChange: pctChange(totalSales, prevSales),
      profitChange: pctChange(totalProfit, prevProfit),
      ordersChange: pctChange(totalOrders, prevOrders),
      avgValueChange: pctChange(avgOrderValue, prevAvg),
    };
  },

  /**
   * Main entry point to compile statistics for a filtered dataset.
   * Derives current KPIs, summary statistics, regional tables, and calculates percentage changes.
   */
  getStatistics(filteredData, allData, filters) {
        // 1. Calculate previous period of equal length
    const startDate = new Date(filters.startDate + 'T00:00:00');
    const endDate = new Date(filters.endDate + 'T00:00:00');
    const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - rangeDays);

    const prevRange = {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
    };

    // 2. Filter full dataset for the previous period to compare
    const previousData = allData.filter((r) => {
      if (!this.isInDateRange(r.date, prevRange)) return false;
      if (filters.region !== 'All' && r.region !== filters.region) return false;
      if (filters.category !== 'All' && r.category !== filters.category) return false;
      return true;
    });

    return {
      kpis: this.computeKPI(filteredData, previousData),
      stats: this.computeStatsSummary(filteredData),
      regionStats: this.groupByRegion(filteredData),
    };
  }
};

window.stats = stats;
