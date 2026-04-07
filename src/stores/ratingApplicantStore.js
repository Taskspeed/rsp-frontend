// src/stores/ratingApplicantStore.js
import { defineStore } from 'pinia';
import { raterApi } from 'src/boot/axios_rater';

export const useRatingApplicantStore = defineStore('ratingApplicantStore', {
  state: () => ({
    applicants: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchApplicants() {
      this.loading = true;
      this.error = null;
      this.applicants = null;

      try {
        const { data } = await raterApi.get('/rater/applicants');
        this.applicants = data;
      } catch (err) {
        this.error = err?.response?.data?.message ?? err.message ?? 'An unexpected error occurred.';
      } finally {
        this.loading = false;
      }
    },
  },
});
