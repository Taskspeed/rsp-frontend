import { defineStore } from 'pinia';
import { raterApi } from 'boot/axios_rater';

export const useApplicantsStore = defineStore('applicantRater', {
  state: () => ({
    rows: [],
    details: [],
  }),

  actions: {
    async fetchApplicants(page = 1) {
      const { data } = await raterApi.get('/rater/applicants', { params: { page } });
      const list = Array.isArray(data?.data?.data) ? data.data.data : [];

      this.rows = list.map((item) => ({
        id: item.nPersonal_id,
        firstname: item.firstname,
        lastname: item.lastname,
        date_of_birth: item.date_of_birth,
        appliedCount: item.applied_job, // ✅ use API value
      }));
    },

    async fetchApplicantDetails(payload) {
      const { data } = await raterApi.post('/rater/applicant-details', payload);
      const list = Array.isArray(data?.data) ? data.data : [];

      this.details = list.map((item) => ({
        submission_id: item.submission_id,
        position: item.job_post?.position || '-',
        office: item.job_post?.office || '-',
        job_post_id: item.job_post?.id || item.job_post_id,
      }));

      return this.details;
    },

    clearDetails() {
      this.details = [];
    },
  },
});
