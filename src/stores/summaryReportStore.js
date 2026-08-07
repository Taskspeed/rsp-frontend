import { defineStore } from 'pinia';
import { adminApi } from 'boot/axios_admin';

export const useSummaryReportStore = defineStore('summaryReport', {
  state: () => ({
    positions: [],
    publicationDates: [],
    positionDetails: null,
    newEmployeeReportData: null, // Add this state property
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

    async fetchPositionWithBEI() {
      try {
        this.loading = true;
        const response = await adminApi.get('/report/job-bei');
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

    async fetchApplicantDetail(jobpostId) {
      try {
        this.loading = true;
        const response = await adminApi.get(`/report/final-summary-rating/${jobpostId}`);

        if (response.data.message && !response.data.applicants) {
          console.warn(`No ratings for job post ${jobpostId}:`, response.data.message);
          this.error = response.data.message;
          return null;
        }

        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error fetching applicant details:', err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchApplicantPosition(jobpostId) {
      try {
        this.loading = true;
        const response = await adminApi.get(`/report/applicant/per-position/${jobpostId}`);

        if (response.data.message && !response.data.applicants) {
          console.warn(`No ratings for job post ${jobpostId}:`, response.data.message);
          this.error = response.data.message;
          return null;
        }

        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error fetching applicant details:', err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchPublicationDateList() {
      try {
        this.loading = true;
        const response = await adminApi.get('/report/list-date/publication');
        this.publicationDates = response.data;
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

    async fetchPostingPublicationDateList() {
      try {
        this.loading = true;
        const response = await adminApi.get('/job-batches-rsp/postdate');
        this.publicationDates = response.data;
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

    async fetchPublicationDateNewEmployee() {
      try {
        this.loading = true;
        const response = await adminApi.get('/report/job-publication');
        this.publicationDates = response.data;
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

    async fetchNewEmployeeReport(publicationDate, effectiveDate) {
      try {
        this.loading = true;
        const response = await adminApi.post('/report/list-of-appointed', {
          publication_date: publicationDate,
          effective_date: effectiveDate,
        });
        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error fetching new employee report:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ADD THIS METHOD - Set new employee report data
    setNewEmployeeReportData(data) {
      this.newEmployeeReportData = data;
    },

    // ADD THIS METHOD - Get new employee report data
    getNewEmployeeReportData() {
      return this.newEmployeeReportData;
    },

    // ADD THIS METHOD - Clear new employee report data
    clearNewEmployeeReportData() {
      this.newEmployeeReportData = null;
    },

    async fetchListPositionReport(publicationDate) {
      try {
        this.loading = true;
        const response = await adminApi.post('/report/publication-job', {
          post_date: publicationDate,
        });
        this.positionDetails = response.data;
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error fetching new employee report:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ============================================================================
    // QUALIFIED REPORT
    // applicantType: 'both' | 'internal' | 'external'
    // - 'both'     → no query param (existing behavior)
    // - 'internal' → ?applicantType=internal
    // - 'external' → ?applicantType=external
    // ============================================================================

    async fetchQualifiedReport(date, applicantType = 'both') {
      try {
        this.loading = true;
        const params = applicantType !== 'both' ? { applicantType } : {};
        const response = await adminApi.get(`/report/applicant/qualified/${date}`, { params });
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

    async fetchInternalQualifiedReport(date) {
      return this.fetchQualifiedReport(date, 'internal');
    },

    async fetchExternalQualifiedReport(date) {
      return this.fetchQualifiedReport(date, 'external');
    },

    // ============================================================================
    // UNQUALIFIED REPORT
    // Same applicantType logic as qualified
    // ============================================================================

    async fetchUnqualifiedReport(date, applicantType = 'both') {
      try {
        this.loading = true;
        const params = applicantType !== 'both' ? { applicantType } : {};
        const response = await adminApi.get(`/report/applicant/unqualified/${date}`, { params });
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

    async fetchInternalUnqualifiedReport(date) {
      return this.fetchUnqualifiedReport(date, 'internal');
    },

    async fetchExternalUnqualifiedReport(date) {
      return this.fetchUnqualifiedReport(date, 'external');
    },

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

    // ==================== EXCEL REPORT GENERATION METHODS ====================

    /**
     * Format date to YYYY-MM-DD
     */
    formatDateToYYYYMMDD(date) {
      if (!date) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          console.warn('Invalid date:', date);
          return date;
        }
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return date;
      }
    },

    async generateTopApplicant(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/top/ranking/applicant',
          { publication_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating Top Applicant Report Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateListOfPositionExcel(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/list/jobPost',
          { post_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating List of Position Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generatePrequalifiedApplicantExcel(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/applicant/qualified',
          { post_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating Prequalified Applicant Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateInternalReportExcel(date) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(date);
        const response = await adminApi.post(
          '/generate/internal/applicant/service',
          { publication_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating Internal Report Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateUnqualifiedApplicantExcel(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/applicant/unqualified',
          { post_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating Unqualified Applicant Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateAllApplicantExcel(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/applicant',
          { post_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating All Applicant Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateInternalPrequalifiedApplicantExcel(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/internal/applicant/designation',
          { post_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating All Applicant Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async generateQualifiedRecommendedApplicantExcel(publicationDate) {
      try {
        this.loading = true;
        const formattedDate = this.formatDateToYYYYMMDD(publicationDate);
        const response = await adminApi.post(
          '/generate/list/qualified/recommend/applicant',
          { publication_date: formattedDate },
          { responseType: 'blob' },
        );
        this.error = null;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error generating Qualified and Recommended Applicant Excel:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteApplication({ id }) {
      this.loading = true;
      try {
        await adminApi.delete(`/applicant/delete/submission/${id}`);
        this.error = null;
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || err.message;
        console.error('Error deleting application:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchImageBase64(imageUrl) {
      try {
        const response = await adminApi.get(imageUrl, { responseType: 'blob' });
        const blob = response.data;
        if (!blob || blob.size === 0) return null;

        if (!blob.type.startsWith('image/')) {
          console.warn('Not an image type:', blob.type);
          return null;
        }

        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error('Error fetching image:', imageUrl, err);
        return null;
      }
    },
  },
});
