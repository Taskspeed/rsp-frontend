import { defineStore } from 'pinia';
import { adminApi } from 'src/boot/axios_admin';
import { toast } from 'src/boot/toast';

export const usePlacementStore = defineStore('placement', {
  state: () => ({
    placements: [],
    officeStructure: null,
    officeEmployees: [],
    reassignments: [],
    loading: false,

    // ============= REASSIGNMENT HISTORY =============
    employeeHistory: null, // holds the full response payload: { control_no, Surname, Firstname, designation, re_assignment_history }
    historyLoading: false,
  }),

  actions: {
    // List employees by office (JO, CASUAL, HONORARIUM)
    async fetchPlacements(office) {
      this.loading = true;
      try {
        const res = await adminApi.get(`/assign/${office}`);
        this.placements = res.data?.data || [];
      } catch {
        toast.error('Failed to load placements');
        this.placements = [];
      } finally {
        this.loading = false;
      }
    },

    // Store/assign employees (JO, CASUAL, HONORARIUM)
    async storePlacement(data) {
      this.loading = true;
      try {
        const res = await adminApi.post('/assign/store', data);
        await this.fetchPlacements(data.office);
        toast.success('Employee assigned successfully');
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to assign employee';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update employee assignment (for reassign)
    async updatePlacement(controlNo, data) {
      this.loading = true;
      try {
        const res = await adminApi.put(`/assign/update/${controlNo}`, data);
        if (data.office) {
          await this.fetchPlacements(data.office);
        }
        toast.success('Employee reassigned successfully');
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to update assignment';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deletePlacement(controlNo, office) {
      this.loading = true;
      try {
        await adminApi.delete(`/assign/delete/${controlNo}`);
        if (office) {
          await this.fetchPlacements(office);
        }
        toast.success('Employee unassigned successfully');
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete assignment';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ============= REASSIGNMENT ACTIONS =============

    // Fetch reassignments by office
    async fetchReassignments(office) {
      this.loading = true;
      try {
        const res = await adminApi.get(`/re-assign/${office}`);
        this.reassignments = res.data?.data || [];
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to load reassignments';
        toast.error(errorMessage);
        this.reassignments = [];
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Store new reassignment
    async storeReassignment(data) {
      this.loading = true;
      try {
        const res = await adminApi.post('/re-assign/store', data);
        if (data.office) {
          await this.fetchReassignments(data.office);
        }
        toast.success('Reassignment created successfully');
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to create reassignment';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update reassignment - updates structure fields only
    async updateReassignment(employeeReAssignId, data) {
      this.loading = true;
      try {
        const res = await adminApi.put(`/re-assign/update/${employeeReAssignId}`, data);
        if (data.office) {
          await this.fetchReassignments(data.office);
        }
        toast.success('Reassignment updated successfully');
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to update reassignment';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Return reassignment - updates active status only
    async returnReassignment(employeeReAssignId) {
      this.loading = true;
      try {
        const res = await adminApi.put(`/re-assign/return/${employeeReAssignId}`, {
          active: '0',
        });
        toast.success('Return status updated successfully');
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to update return status';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ============= REASSIGNMENT HISTORY =============

    // Fetch full reassignment history for a single employee (by control no)
    // GET /assign/history/{controlNo}
    async fetchHistory(controlNo) {
      this.historyLoading = true;
      try {
        const res = await adminApi.get(`/assign/history/${controlNo}`);
        this.employeeHistory = res.data?.data || null;
        return res.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to load reassignment history';
        toast.error(errorMessage);
        this.employeeHistory = null;
        throw error;
      } finally {
        this.historyLoading = false;
      }
    },

    // Clear history state (call when closing the history modal)
    resetHistory() {
      this.employeeHistory = null;
      this.historyLoading = false;
    },

    // Reset office-specific data
    resetOfficeData() {
      this.officeStructure = null;
      this.officeEmployees = [];
      this.reassignments = [];
    },

    // Reset all state
    resetAll() {
      this.placements = [];
      this.officeStructure = null;
      this.officeEmployees = [];
      this.reassignments = [];
      this.employeeHistory = null;
      this.historyLoading = false;
      this.loading = false;
    },
  },
});
