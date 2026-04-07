import { defineStore } from 'pinia';
import { adminApi } from 'boot/axios_admin';

export const useExamScoreStore = defineStore('examScore', {
  state() {
    return {
      scores: [],
      noScoreApplicants: [],
      loading: false,
      pagination: {
        currentPage: 1,
        total: 0,
        perPage: 10,
        lastPage: 1,
      },
      noScorePagination: {
        currentPage: 1,
        total: 0,
        perPage: 10,
        lastPage: 1,
      },
    };
  },

  actions: {
    async fetchScores(params = {}) {
      this.loading = true;
      try {
        const response = await adminApi.get('/applicant/exam/list-scores', { params });
        this.scores = response.data.data || [];
        this.pagination = {
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 10,
          lastPage: response.data.last_page || 1,
        };
      } finally {
        this.loading = false;
      }
    },

    async fetchNoScoreApplicants(params = {}) {
      this.loading = true;
      try {
        const response = await adminApi.get('/applicant/list-no-exam', { params });
        this.noScoreApplicants = response.data.data || [];
        this.noScorePagination = {
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 10,
          lastPage: response.data.last_page || 1,
        };
      } finally {
        this.loading = false;
      }
    },

    // FIX: accept payload and send it to the API
    async saveScores(payload) {
      this.loading = true;
      try {
        const response = await adminApi.post('/applicant/exam/score', payload);
        return response.data;
      } finally {
        this.loading = false;
      }
    },
  },
});
