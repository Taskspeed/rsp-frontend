// src/stores/officeLibraryStore.js

import { defineStore } from 'pinia';
import { adminApi } from 'src/boot/axios_admin';
import { toast } from 'src/boot/toast';

export const useOfficeStore = defineStore('office', {
  state: () => ({
    offices: [],
    structure: [],
    employees: [],
    reassignedEmployees: [],
    loading: false,
    structureLoading: false,
    structureSaving: false,
    employeesLoading: false,
    reassignedEmployeesLoading: false,
  }),

  actions: {
    async fetchOffices() {
      this.loading = true;
      try {
        const res = await adminApi.get('/office/index');
        this.offices = res.data?.data || [];
      } catch {
        toast.error('Failed to load offices');
        this.offices = [];
      } finally {
        this.loading = false;
      }
    },

    async fetchOfficeStructure(office) {
      this.structureLoading = true;
      try {
        const res = await adminApi.get(`/office/structure/${office}`);
        this.structure = res.data?.data || [];
        return this.structure;
      } catch {
        toast.error('Failed to load office structure');
        this.structure = [];
        return [];
      } finally {
        this.structureLoading = false;
      }
    },

    async fetchOfficeEmployees(office) {
      this.employeesLoading = true;
      try {
        const res = await adminApi.get(`/office/employee/${office}`);
        this.employees = res.data?.data || [];
      } catch {
        toast.error('Failed to load office employees');
        this.employees = [];
      } finally {
        this.employeesLoading = false;
      }
    },

    async fetchReassignedEmployees(office) {
      this.reassignedEmployeesLoading = true;
      try {
        const res = await adminApi.get(`/re-assign/with/${office}`);
        let data = res.data?.data || res.data || [];
        if (!Array.isArray(data) && data.data) {
          data = data.data;
        }
        this.reassignedEmployees = Array.isArray(data) ? data : [];
        return this.reassignedEmployees;
      } catch (error) {
        console.error('Error fetching reassigned employees:', error);
        toast.error('Failed to load reassigned employees');
        this.reassignedEmployees = [];
        return [];
      } finally {
        this.reassignedEmployeesLoading = false;
      }
    },

    async storeOffice(data) {
      this.loading = true;
      try {
        const payload = {
          office_name: data.office_name,
        };
        await adminApi.post('/office/store', payload);
        await this.fetchOffices();
        toast.success('Office created successfully');
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to create office';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Flatten hierarchical structure to individual objects for API
     * Each row should be a separate object with lib_office_id and the specific field
     * Example:
     *   Group: "shduia" with Division: "jadkasgda"
     *   -> [{ lib_office_id: 33, group: "shduia" }, { lib_office_id: 33, group: "shduia", division: "jadkasgda" }]
     */
    flattenStructure(officeId, structure) {
      const rows = [];

      const addRow = (row) => {
        const cleanRow = {
          lib_office_id: officeId,
        };

        // Only add non-null values
        if (row.office2) cleanRow.office2 = row.office2;
        if (row.group) cleanRow.group = row.group;
        if (row.division) cleanRow.division = row.division;
        if (row.section) cleanRow.section = row.section;
        if (row.unit) cleanRow.unit = row.unit;

        rows.push(cleanRow);
      };

      /**
       * Recursively traverse the structure and add rows for each level
       */
      const traverse = (node, parentPath = {}) => {
        // Process each office2
        if (node.office2 && Array.isArray(node.office2)) {
          node.office2.forEach((office2Item) => {
            const currentPath = { ...parentPath };
            if (office2Item.office2) {
              currentPath.office2 = office2Item.office2;
              addRow(currentPath);
            }
            traverse(office2Item, currentPath);
          });
        }

        // Process each group
        if (node.group && Array.isArray(node.group)) {
          node.group.forEach((groupItem) => {
            const currentPath = { ...parentPath };
            if (groupItem.group) {
              currentPath.group = groupItem.group;
              addRow(currentPath);
            }
            traverse(groupItem, currentPath);
          });
        }

        // Process each division
        if (node.divisions && Array.isArray(node.divisions)) {
          node.divisions.forEach((divisionItem) => {
            const currentPath = { ...parentPath };
            if (divisionItem.division) {
              currentPath.division = divisionItem.division;
              addRow(currentPath);
            }
            traverse(divisionItem, currentPath);
          });
        }

        // Process sections_without_division (sections directly under group)
        if (node.sections_without_division && Array.isArray(node.sections_without_division)) {
          node.sections_without_division.forEach((sectionItem) => {
            const currentPath = { ...parentPath };
            if (sectionItem.section) {
              currentPath.section = sectionItem.section;
              addRow(currentPath);
            }
            traverse(sectionItem, currentPath);
          });
        }

        // Process sections under division
        if (node.sections && Array.isArray(node.sections)) {
          node.sections.forEach((sectionItem) => {
            const currentPath = { ...parentPath };
            if (sectionItem.section) {
              currentPath.section = sectionItem.section;
              addRow(currentPath);
            }
            traverse(sectionItem, currentPath);
          });
        }

        // Process units_without_division (units directly under group)
        if (node.units_without_division && Array.isArray(node.units_without_division)) {
          node.units_without_division.forEach((unit) => {
            const currentPath = { ...parentPath };
            if (unit) {
              currentPath.unit = unit;
              addRow(currentPath);
            }
          });
        }

        // Process units_without_section (units directly under division)
        if (node.units_without_section && Array.isArray(node.units_without_section)) {
          node.units_without_section.forEach((unit) => {
            const currentPath = { ...parentPath };
            if (unit) {
              currentPath.unit = unit;
              addRow(currentPath);
            }
          });
        }

        // Process units under section
        if (node.units && Array.isArray(node.units)) {
          node.units.forEach((unit) => {
            const currentPath = { ...parentPath };
            if (unit) {
              currentPath.unit = unit;
              addRow(currentPath);
            }
          });
        }
      };

      // Start traversal from the root structure
      traverse(structure);

      return rows;
    },

    /**
     * Saves multiple structure rows by calling the API for each row.
     * Each call sends a single object: { lib_office_id: 33, group: "shduia" }
     */
    async saveOfficeStructure(officeName, structureData) {
      this.structureSaving = true;
      try {
        let office = this.offices.find((o) => o.office_name === officeName);

        if (!office) {
          await this.fetchOffices();
          office = this.offices.find((o) => o.office_name === officeName);
        }

        if (!office) {
          throw new Error(`Office "${officeName}" not found`);
        }

        const flattenedStructure = this.flattenStructure(office.officeId, structureData);

        console.log('Flattened Structure:', JSON.stringify(flattenedStructure, null, 2));

        // Send each item as a separate API call
        for (const item of flattenedStructure) {
          console.log('Sending payload:', JSON.stringify(item, null, 2));
          await adminApi.post('/office/structure/store', item);
        }

        // Refresh to get updated structure data
        await this.fetchOffices();

        toast.success(`Structure saved successfully (${flattenedStructure.length} items)`);
        return true;
      } catch (error) {
        console.error('Error saving office structure:', error);
        const errorMessage =
          error.response?.data?.message || error.message || 'Failed to save structure';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.structureSaving = false;
      }
    },

    /**
     * Updates a SINGLE, already-persisted structure row in place.
     * `fields` is a partial object, e.g. { group: 'NEW NAME' }.
     */
    async updateStructureItem(structureId, fields) {
      try {
        await adminApi.put(`/office/update/structure/${structureId}`, fields);
        toast.success('Structure item updated successfully');
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to update structure item';
        toast.error(errorMessage);
        throw error;
      }
    },

    /**
     * Deletes a SINGLE, already-persisted structure row.
     */
    async deleteStructureItem(structureId) {
      try {
        await adminApi.delete(`/office/structure/delete/${structureId}`);
        toast.success('Structure item deleted successfully');
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete structure item';
        toast.error(errorMessage);
        throw error;
      }
    },

    async updateOffice(id, data) {
      this.loading = true;
      try {
        const payload = {
          office_name: data.office_name,
        };
        await adminApi.put(`/office/update/${id}`, payload);
        await this.fetchOffices();
        toast.success('Office updated successfully');
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to update office';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteOffice(id) {
      this.loading = true;
      try {
        await adminApi.delete(`/office/delete/${id}`);
        await this.fetchOffices();
        toast.success('Office deleted successfully');
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete office';
        toast.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
