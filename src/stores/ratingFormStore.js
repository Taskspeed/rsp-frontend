import { defineStore } from 'pinia';
import { raterApi } from 'src/boot/axios_rater';

export const use_rating_form_store = defineStore('rating_form_store', {
  state: () => ({
    data: null,
    loading: false,
    error: null,
  }),

  getters: {
    ratingScores: (state) => state.data?.rating_scores || [],
    hasApplicants: (state) =>
      Array.isArray(state.data?.rating_scores) && state.data.rating_scores.length > 0,
  },

  actions: {
    async fetchRatingForm(job_batches_rsp_id) {
      this.loading = true;
      this.error = null;
      this.data = null;

      try {
        const { data } = await raterApi.post('/report/rating-form', {
          job_batches_rsp_id,
        });

        this.data = data;
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
