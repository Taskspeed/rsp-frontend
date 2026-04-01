import { defineStore } from 'pinia';
import { adminApi } from 'boot/axios_admin';

export const useExamScheduleStore = defineStore('examSchedule', {
  state: () => ({
    exams: [],
    availableApplicants: [],
    details: null,
    loading: false,
    loadingApplicants: false,
    error: null,

    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  }),

  actions: {
    async fetchExams({ page = 1, perPage = 10, search = '' } = {}) {
      try {
        this.loading = true;

        const response = await adminApi.get('/applicant/schedule-exam-list', {
          params: { page, per_page: perPage, search },
        });

        this.exams = response.data.data ?? [];
        this.currentPage = response.data.current_page;
        this.lastPage = response.data.last_page;
        this.total = response.data.total;
        this.perPage = response.data.per_page;

        this.error = null;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching exam schedules:', err);
      } finally {
        this.loading = false;
      }
    },

    async fetchAvailableApplicants() {
      try {
        this.loadingApplicants = true;
        const response = await adminApi.get('/applicant/schedule-exam');
        this.availableApplicants = response.data;
        this.error = null;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching available exam applicants:', err);
      } finally {
        this.loadingApplicants = false;
      }
    },

    async fetchExamDetails(scheduleId) {
      try {
        this.loadingApplicants = true;
        const response = await adminApi.get(`/applicant/schedule-exam-detials/${scheduleId}`);
        const details = response?.data?.data ?? response?.data ?? null;
        this.details = details;
        this.error = null;
        return details;
      } catch (err) {
        this.error = err.message;
        console.error('Error fetching exam details:', err);
        throw err;
      } finally {
        this.loadingApplicants = false;
      }
    },

    async scheduleExam(scheduleData) {
      try {
        this.loading = true;
        const response = await adminApi.post('/email/send/examination', scheduleData, {
          validateStatus: (status) => status < 500,
        });
        this.error = null;
        return response;
      } catch (err) {
        console.error('Error scheduling exam:', err.message || err);
        return { data: { success: false, message: 'An error occurred' } };
      } finally {
        this.loading = false;
      }
    },

    clearExamDetails() {
      this.details = null;
    },
  },
});
