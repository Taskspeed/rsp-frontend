import { defineStore } from 'pinia';
import { adminApi } from 'boot/axios_admin';
import { raterApi } from 'boot/axios_rater';
import { toast } from 'src/boot/toast';

export const useJobPostStore = defineStore('jobPost', {
  state: () => ({
    jobPosts: [],
    applicant: [],
    applicant_rating: [],
    jobPostsrater: [],
    applicantScores: null,
    previousApplicants: [],
    applicantPDS: null,
    loading: false,
    error: null,
    previousApplicantsLoading: false,
    previousApplicantsError: null,
    // ✅ ADD THESE: Confirmation token state
    confirmationToken: null,
    confirmationExpiresAt: null,
    // postDate: null,
    // endDate: null
      ratingMeta: {},
    applicantMeta: {
    total_applicants: 0,
    internal_applicants: 0,
    external_applicants: 0,
    assessed: '0/0',
    qualified_applicants: 0,
    unqualified_applicants: 0,
    current_page: 1,
    last_page: 1,

  },

  }),

  getters: {
    getJobPostsByPositionAndItemNo: (state) => (PositionID, ItemNo) => {
      let jobPostsArray = [];

      if (Array.isArray(state.jobPosts)) {
        jobPostsArray = state.jobPosts;
      } else if (state.jobPosts && typeof state.jobPosts === 'object') {
        if (Array.isArray(state.jobPosts.data)) {
          jobPostsArray = state.jobPosts.data;
        } else if (Array.isArray(state.jobPosts.jobPosts)) {
          jobPostsArray = state.jobPosts.jobPosts;
        } else {
          jobPostsArray = Object.values(state.jobPosts).filter(
            (item) => item && typeof item === 'object' && item.PositionID,
          );
        }
      }

      return jobPostsArray.filter(
        (jobPost) => jobPost.PositionID === PositionID && jobPost.ItemNo === ItemNo,
      );
    },

    // ✅ ADD THESE: Confirmation token getters
    getConfirmationExpiresAt: (state) => state.confirmationExpiresAt,

    isConfirmationValid: (state) => {
      if (!state.confirmationExpiresAt) return false;
      return state.confirmationExpiresAt.getTime() > new Date().getTime();
    },
  },

  actions: {
    // ✅ Fetch previous applicants with independent loading state
    async fetchPreviousApplicants(jobId) {
      this.previousApplicantsLoading = true;
      this.previousApplicantsError = null;

      try {
        console.log('Fetching previous applicants for job ID:', jobId);

        const { data } = await adminApi.get(`/export/applicant/${jobId}`);

        console.log('Raw API response:', data);

        if (Array.isArray(data)) {
          this.previousApplicants = data.map((applicant) => ({
            id: applicant.nPersonalInfo_id,
            nPersonalInfo_id: applicant.nPersonalInfo_id,
            firstname: applicant.firstname || '',
            lastname: applicant.lastname || '',
            name_extension: applicant.name_extension || '',
            email: applicant.email || '',
            image_url: applicant.image_url || null,
            previousPosition: applicant.Position || 'N/A',
            previousAppliedDate: applicant.post_date || null,
            previousStatus:
              applicant.status?.charAt(0).toUpperCase() +
                applicant.status?.slice(1).toLowerCase() || 'Pending',
            source: applicant.type === 'internal' ? 'Internal' : 'External',
            type: applicant.type || 'external',
            ControlNo: applicant.ControlNo || null,
            raw: applicant,
          }));
        } else {
          this.previousApplicants = [];
        }

        console.log('Processed previous applicants:', this.previousApplicants);
        this.previousApplicantsError = null;
        return this.previousApplicants;
      } catch (err) {
        console.error('Error fetching previous applicants:', err);
        this.previousApplicantsError = err;
        toast.error('Failed to fetch previous applicants.');
        throw err;
      } finally {
        this.previousApplicantsLoading = false;
      }
    },

    // ✅ Import applicants with independent loading state
    async importApplicants(currentJobId, selectedApplicants) {
      this.previousApplicantsLoading = true;
      this.previousApplicantsError = null;

      try {
        if (!currentJobId) {
          throw new Error('Current Job ID is required');
        }

        if (!Array.isArray(selectedApplicants) || selectedApplicants.length === 0) {
          throw new Error('No applicants selected for import');
        }

        console.log('Importing applicants:', selectedApplicants);

        const payload = {
          job_batches_rsp_id: currentJobId,
          applicants: selectedApplicants.map((applicant) => ({
            id: applicant.id || applicant.nPersonalInfo_id,
            ControlNo: applicant.ControlNo || null,
          })),
        };

        const response = await adminApi.post(`/submissions/multiple`, payload);

        console.log('Import response:', response.data);

        if (response.data.status === 'success' || response.status === 200) {
          await this.fetch_applicant(currentJobId);
        }

        this.previousApplicantsError = null;
        return response.data;
      } catch (err) {
        console.error('Error importing applicants:', err);
        this.previousApplicantsError = err;
        toast.error('Failed to import applicants: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.previousApplicantsLoading = false;
      }
    },

    // ✅ Clear previous applicants from store
    clearPreviousApplicants() {
      this.previousApplicants = [];
      this.previousApplicantsError = null;
    },

    // Evaluation
    async evaluation(evaluationData) {
      this.error = null;
      try {
        console.log('Calling evaluation API with:', evaluationData);

        const response = await adminApi.post(
          `/job-batches-rsp/applicant/evaluation/${evaluationData.id}`,
          {
            id: evaluationData.id,
            submission_id: evaluationData.id,
            status: evaluationData.status,
            education_remark: evaluationData.education_remark,
            experience_remark: evaluationData.experience_remark,
            training_remark: evaluationData.training_remark,
            eligibility_remark: evaluationData.eligibility_remark,
            education_qualification: evaluationData.education_qualification,
            training_qualification: evaluationData.training_qualification,
            experience_qualification: evaluationData.experience_qualification,
            eligibility_qualification: evaluationData.eligibility_qualification,
          },
        );

        console.log('Evaluation response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Evaluation API error:', error);
        this.error = error;
        toast.error('Error submitting evaluation.');
        throw error;
      }
    },

    // async fetch_applicant(id) {
    //   this.loading = true;
    //   try {
    //     const { data } = await adminApi.get(`/job-batches-rsp/applicant/view/${id}`);
    //     this.applicant = data.applicants;
    //     this.error = null;
    //   } catch (error) {
    //     this.error = error;
    //     toast.error('Failed to fetch applicants.');
    //   } finally {
    //     this.loading = false;
    //   }
    // },

  async fetch_applicant(id, { page = 1, perPage = 10, search = '' } = {}) {
    this.loading = true;
    try {
      const { data } = await adminApi.get(`/job-batches-rsp/applicant/view/${id}`, {
        params: {
          page: perPage === 'all' ? 1 : page,
          per_page: perPage,
          search,
        },
      });

    this.applicant = data.applicants?.data ?? [];
    this.applicantMeta = {
      total_applicants: data.total_applicants ?? 0,
      internal_applicants: data.internal_applicants ?? 0,
      external_applicants: data.external_applicants ?? 0,
      assessed: data.assessed ?? '0/0',
      qualified_applicants: data.qualified_applicants ?? 0,
      unqualified_applicants: data.unqualified_applicants ?? 0,
      current_page: data.applicants?.current_page ?? 1,
      last_page: data.applicants?.last_page ?? 1,
    };
    this.error = null;
  } catch (error) {
    this.error = error;
    toast.error('Failed to fetch applicants.');
  } finally {
    this.loading = false;
  }
},

    // async fetch_applicant_rating(id) {
    //   this.loading = true;
    //   try {
    //     const { data } = await adminApi.get(`/rater/show/${id}`);
    //     this.applicant_rating = data.applicants_rating || data;
    //     this.error = null;
    //     return this.applicant_rating;
    //   } catch (error) {
    //     this.error = error;
    //     toast.error('Failed to fetch applicant ratings.');
    //     throw error;
    //   } finally {
    //     this.loading = false;
    //   }
    // },

      async fetch_applicant_rating(id, { page = 1, perPage = 10, search = '' } = {}) {
        this.loading = true;
        try {
          const { data } = await adminApi.get(`/rater/show/${id}`, {
            params: { page, per_page: perPage, search },
          });

          this.applicant_rating = {
            applicants: data.data || [],          // rows array
            total_assigned: data.total_assigned,
            total_completed: data.total_completed,
          };
          this.ratingMeta = data.meta || {};      // { current_page, per_page, total, last_page }

          this.error = null;
          return data;
        } catch (error) {
          this.error = error;
          toast.error('Failed to fetch applicant ratings.');
          throw error;
        } finally {
          this.loading = false;
        }
      },

    async fetch_applicant_score(id) {
      this.loading = true;
      try {
        const { data } = await adminApi.get(`/rater/applicant/history/score/${id}`);
        this.applicant = data;
        this.error = null;
        console.log('Store - fetch_applicant_score response:', data);
        return data;
      } catch (error) {
        this.error = error;
        toast.error('Failed to fetch applicant scores.');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async checkJobHasApplicants(id) {
      try {
        await this.fetch_applicant(id);
        return this.applicant && this.applicant.length > 0;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return false;
        }
        console.error('Error checking applicants:', error);
        return true;
      }
    },

    async fetchJobPosts() {
      this.loading = true;
      try {
        const { data } = await adminApi.get('/job-batches-rsp');
        this.jobPosts = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async fetchJobDetails(id) {
      try {
        this.loading = true;
        const { data } = await adminApi.get(`/job-batches-rsp/${id}`);
        this.jobPosts = data;
        this.error = null;
        return data;
      } catch (err) {
        this.error = err;
        this.jobPosts = null;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchApplicantScoreDetails(id, jobpostId) {
      try {
        this.loading = true;
        const { data } = await adminApi.get(`/applicant/score/${id}/${jobpostId}`);
        this.jobPosts = data;
        this.error = null;
        return data;
      } catch (err) {
        this.error = err;
        this.jobPosts = null;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateJobStatus(id, payload) {
      this.loading = true;
      try {
        const { data } = await adminApi.put(`/job-batches-rsp/jobpost/${id}`, payload);
        this.jobPosts = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async job_post_list() {
      this.loading = true;
      try {
        const { data } = await adminApi.get('/rater/job/list');
        this.jobPosts = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async criteria_list() {
      this.loading = true;
      try {
        const { data } = await adminApi.get('/job-batches-rsp/list');
        this.jobPosts = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async assign_job_list(id) {
      this.loading = true;
      try {
        const { data } = await adminApi.get(`/rater/${id}`);
        this.jobPosts = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async fetchApplicantPDS(id) {
      this.loading = true;
      try {
        const { data } = await adminApi.get(`/applicant/${id}`);
        this.applicantPDS = data; // Store in separate property
        this.error = null;
        return data;
      } catch (err) {
        this.error = err;
        console.error('Error fetching applicant PDS:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchApplicantPDSRater(id) {
      this.loading = true;
      try {
        const { data } = await raterApi.get(`/applicant/${id}`);
        this.applicantPDS = data; // Store in separate property
        this.error = null;
        return data;
      } catch (err) {
        this.error = err;
        console.error('Error fetching applicant PDS:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async getPrevEmployee(id) {
      this.loading = true;
      try {
        const { data } = await adminApi.get(`/export/applicant/${id}`);
        this.jobPosts = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    // Main method - handles both filtered and all jobs
    async job_post(postDate = null, endDate = null) {
      this.loading = true;
      try {
        let url;

        // If no dates provided, fetch all jobs
        if (!postDate || !endDate) {
          url = '/job-post'; // Use the route that fetches all jobs
        } else {
          // Use dates in YYYY-MM-DD format for filtered results
          url = `/job-post/${postDate}/${endDate}`;
        }

        const { data } = await adminApi.get(url);

        // Handle different response formats
        if (Array.isArray(data)) {
          this.jobPosts = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          this.jobPosts = data.data;
        } else if (data && typeof data === 'object' && Array.isArray(data.jobPosts)) {
          this.jobPosts = data.jobPosts;
        } else if (data && typeof data === 'object') {
          this.jobPosts = Object.values(data).filter(
            (item) => item && typeof item === 'object' && (item.PositionID || item.id),
          );
        } else {
          this.jobPosts = [];
        }

        this.error = null;
      } catch (err) {
        this.error = err;
        this.jobPosts = [];
        console.error('Error fetching job posts:', err);
      } finally {
        this.loading = false;
      }
    },

    // Convenience method for fetching all jobs
    async job_post_all() {
      return this.job_post(null, null);
    },

    // async job_post() { // old code
    //   this.loading = true;
    //   try {
    //     const { data } = await adminApi.get('/job-post'); // format will be send must be yy/mm/dd
    //     if (Array.isArray(data)) {
    //       this.jobPosts = data;
    //     } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
    //       this.jobPosts = data.data;
    //     } else if (data && typeof data === 'object' && Array.isArray(data.jobPosts)) {
    //       this.jobPosts = data.jobPosts;
    //     } else if (data && typeof data === 'object') {
    //       this.jobPosts = Object.values(data).filter(
    //         (item) => item && typeof item === 'object' && (item.PositionID || item.id),
    //       );
    //     } else {
    //       this.jobPosts = [];
    //     }
    //     this.error = null;
    //   } catch (err) {
    //     this.error = err;
    //     this.jobPosts = [];
    //   } finally {
    //     this.loading = false;
    //   }
    // },

    async fetchJobPostByPositionAndItemNo(PositionID, ItemNo) {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`/job-batches-rsp/${PositionID}/${ItemNo}`);
        this.jobPosts = response.data;
        return response.data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch job post: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchCriteriaByPositionAndItemNo(PositionID, ItemNo) {
      this.loading = true;
      try {
        const { data } = await adminApi.get(`/on-criteria-job/${PositionID}/${ItemNo}`);
        this.error = null;
        return data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch Criteria: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async insertJobPost({ jobBatch, criteria }) {
      console.log('result:');
      console.log(jobBatch);
      console.log(criteria);
      this.loading = true;

      try {
        const formData = new FormData();

        Object.keys(jobBatch).forEach((key) => {
          if (jobBatch[key] !== null && jobBatch[key] !== undefined) {
            formData.append(key, jobBatch[key]);
          }
        });

        if (criteria) {
          formData.append('criteria', JSON.stringify(criteria));
        }

        const { data: batch } = await adminApi.post('/job-batches-rsp', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        this.error = null;
        return batch;
      } finally {
        this.loading = false;
      }
    },

    async republishJobPost({ jobBatch, criteria }) {
      console.log('result:');
      console.log(jobBatch);
      console.log(criteria);
      this.loading = true;

      try {
        const formData = new FormData();

        Object.keys(jobBatch).forEach((key) => {
          if (jobBatch[key] !== null && jobBatch[key] !== undefined) {
            formData.append(key, jobBatch[key]);
          }
        });

        if (criteria) {
          formData.append('criteria', JSON.stringify(criteria));
        }

        const { data: batch } = await adminApi.post('/job-batches-rsp/republished', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        this.error = null;
        return batch;
      } finally {
        this.loading = false;
      }
    },

    async updateJobPost({ id, jobBatch, criteria, criteriaId }) {
      this.loading = true;
      try {
        const formData = new FormData();

        Object.keys(jobBatch).forEach((key) => {
          if (jobBatch[key] !== null && jobBatch[key] !== undefined) {
            formData.append(key, jobBatch[key]);
          }
        });

        if (criteria) {
          formData.append('criteria', JSON.stringify(criteria));
        }

        const { data: batch } = await adminApi.post(`/job-batches-rsp/update/${id}`, jobBatch, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await adminApi.post(`/on-criteria-job/${criteriaId}`, criteria);

        this.error = null;
        return batch;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async hiredApplicant(id, payload) {
      try {
        this.loading = true;
        const response = await adminApi.post(`/hire/${id}`, payload, {
          validateStatus: (status) => status < 500,
        });
        return response;
      } catch (err) {
        console.error('Error hiring applicant:', err.message || err);
        return { data: { success: false, message: 'An error occurred' } };
      } finally {
        this.loading = false;
      }
    },

    async sendFinalEval(payload) {
      try {
        this.loading = true;
        const response = await adminApi.post(`/email/send/status`, payload, {
          validateStatus: (status) => status < 500,
        });
        return response;
      } catch (err) {
        console.error('Error hiring applicant:', err.message || err);
        return { data: { success: false, message: 'An error occurred' } };
      } finally {
        this.loading = false;
      }
    },

    /**
     * ✅ UPDATE CONFIRMATION - Send user's choice (yes/no) to update application
     */
    async updateConfirmation(payload) {
      try {
        this.loading = true;

        // Validate payload
        if (!payload || !payload.confirmation_token) {
          console.error('Invalid payload: missing confirmation_token');
          return {
            data: {
              success: false,
              message: 'Invalid confirmation token',
            },
          };
        }

        if (typeof payload.confirm_update === 'undefined') {
          console.error('Invalid payload: missing confirm_update');
          return {
            data: {
              success: false,
              message: 'Invalid confirmation choice',
            },
          };
        }

        console.log('Sending confirmation payload:', payload);

        const response = await adminApi.post(`/applicant/confirmation`, payload, {
          validateStatus: (status) => status < 500,
        });

        console.log('Confirmation response:', response.data);

        // If successful, clear the token
        if (response.data?.success === true) {
          this.clearConfirmationToken();
        }

        return response;
      } catch (err) {
        console.error('Error updating confirmation:', err.message || err);
        return {
          data: {
            success: false,
            message: 'An error occurred while processing confirmation',
          },
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * ✅ SET CONFIRMATION TOKEN - Store token and expiration time
     */
    setConfirmationToken(token, expiresInMinutes) {
      this.confirmationToken = token;
      this.confirmationExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      console.log('Confirmation token set, expires at:', this.confirmationExpiresAt.toISOString());
    },

    /**
     * ✅ CLEAR CONFIRMATION TOKEN - Remove token after use
     */
    clearConfirmationToken() {
      this.confirmationToken = null;
      this.confirmationExpiresAt = null;
      console.log('Confirmation token cleared');
    },

    /**
     * ✅ RESET - Clear all store state
     */
    reset() {
      this.jobPosts = null;
      this.applicant = [];
      this.applicant_rating = [];
      this.jobPostsrater = [];
      this.applicantScores = null;
      this.previousApplicants = [];
      this.loading = false;
      this.error = null;
      this.previousApplicantsLoading = false;
      this.previousApplicantsError = null;
      this.clearConfirmationToken();
    },

    async deleteJobPost({ id }) {
      this.loading = true;
      try {
        await adminApi.delete(`/job/delete/${id}`);
        this.error = null;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
