//Store

import { defineStore } from 'pinia';
import { adminApi } from 'boot/axios_admin';

export const useSummaryReportStore = defineStore('summaryReport', {
  // Changed from 'applicant' to 'summaryReport'
  state: () => ({
    positions: [],
    publicationDates: [], // Add dedicated state for publication dates
    positionDetails: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPositionWithRating() {
      try {
        this.loading = true;
        const response = await adminApi.get('/report/job/complete');
        this.positions = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching positions:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // async fetchApplicantDetail(jobpostId) {
    //   try {
    //     this.loading = true;
    //     const response = await adminApi.get(`/report/applicant-final-score/${jobpostId}`);
    //     this.positionDetails = response.data;
    //     this.error = null;
    //     return response.data;
    //   } catch (err) {
    //     this.error = err.message;
    //     console.error('Error fetching applicant details:', err);
    //     throw err;
    //   } finally {
    //     this.loading = false;
    //   }
    // },

    async fetchApplicantDetail(jobpostId) {
      try {
        this.loading = true;
        const response = await adminApi.get(`/report/final-summary-rating/${jobpostId}`);

        // ✅ Check if response contains an error message
        if (response.data.message && !response.data.applicants) {
          console.warn(`No ratings for job post ${jobpostId}:`, response.data.message);
          this.error = response.data.message;
          return null; // Return null instead of throwing
        }

        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error fetching applicant details:', err);
        return null; // Return null instead of throwing
      } finally {
        this.loading = false;
      }
    },

    async fetchPublicationDateList() {
      try {
        this.loading = true;
        console.log('Store:  Fetching publication dates from API.. .');
        const response = await adminApi.get('/job-batches-rsp/postdate');
        console.log('Store: API response:', response);
        console.log('Store: Response data:', response.data);

        this.publicationDates = response.data; // Store in dedicated state
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching publication dates:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    //Top 5
    async fetchTopApplicantReport(date) {
      try {
        this.loading = true;
        const response = await adminApi.get(`/report/ranking/applicant/${date}`);
        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching applicant details:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Add methods for qualified reports
    async fetchQualifiedReport(date) {
      try {
        this.loading = true;
        // Replace with your actual API endpoint
        const response = await adminApi.get(`/report/applicant/qualified/${date}`);
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching qualified report:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchUnqualifiedReport(date) {
      try {
        this.loading = true;
        // Replace with your actual API endpoint
        const response = await adminApi.get(`/report/applicant/unqualified/${date}`);
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching unqualified report:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    //Top 5
    async fetchTopQualifiedReport(date) {
      try {
        this.loading = true;
        const response = await adminApi.get(`/report/ranking/applicant/${date}`);
        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching applicant details:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
