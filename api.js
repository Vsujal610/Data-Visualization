// ============================================================
// API Client Module
// Handles communicating with the backend REST API
// ============================================================

const API_BASE = '/api';

const api = {
  /**
   * Fetches all sales records from the backend database.
   * @returns {Promise<Array>} Promise resolving to sales records array
   */
  async fetchSalesData() {
    try {
      const response = await fetch(`${API_BASE}/sales`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      throw error;
    }
  },

  /**
   * Adds a new sales record to the database.
   * @param {Object} record Sales record details to be added
   * @returns {Promise<Object>} The newly created record from server
   */
  async addSalesRecord(record) {
    try {
      const response = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to add sales record:', error);
      throw error;
    }
  },

  /**
   * Deletes a sales record from the database by ID.
   * @param {number} id ID of the record to delete
   * @returns {Promise<Object>} Success response object
   */
  async deleteSalesRecord(id) {
    try {
      const response = await fetch(`${API_BASE}/sales/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to delete sales record with ID ${id}:`, error);
      throw error;
    }
  }
};

window.api = api;
