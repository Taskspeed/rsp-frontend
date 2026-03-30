import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi } from 'boot/axios_admin';

export const useUser_upload = defineStore('user_upload', () => {
  const uploadedFile = ref(null);
  const uploadedZipFile = ref(null);
  const isSubmitting = ref(false);
  const successDialog = ref(false);
  const errorMessage = ref('');
  const selectedJob = ref(null);

  /**
   * Set the selected job for application
   */
  function setSelectedJob(job) {
    selectedJob.value = job;
    console.log('Selected job set:', job);
  }

  /**
   * Process application submission with email (for public applicants)
   * @param {string} email - User's email address
   */
  async function processSubmission(email) {
    if (!uploadedFile.value || !uploadedZipFile.value) {
      errorMessage.value = 'Both Excel and ZIP files are required';
      throw new Error(errorMessage.value);
    }

    if (!selectedJob.value || !selectedJob.value.id) {
      errorMessage.value = 'No job selected';
      throw new Error(errorMessage.value);
    }

    if (!email) {
      errorMessage.value = 'Email address is required';
      throw new Error(errorMessage.value);
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
      const formData = new FormData();
      formData.append('job_batches_rsp_id', selectedJob.value.id);
      formData.append('excel_file', uploadedFile.value);
      formData.append('zip_file', uploadedZipFile.value);
      formData.append('email', email);

      const response = await adminApi.post('/applicant/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      isSubmitting.value = false;
      return response;
    } catch (error) {
      isSubmitting.value = false;
      errorMessage.value =
        error.response?.data?.message || error.message || 'Failed to submit application';
      throw error;
    }
  }

  /**
   * Process manual application submission by admin (no email required)
   * Uses /applicant/submissions/manual endpoint
   */
  async function processManualSubmission() {
    if (!uploadedFile.value || !uploadedZipFile.value) {
      errorMessage.value = 'Both Excel and ZIP files are required';
      throw new Error(errorMessage.value);
    }

    if (!selectedJob.value || !selectedJob.value.id) {
      errorMessage.value = 'No job selected';
      throw new Error(errorMessage.value);
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
      const formData = new FormData();
      formData.append('job_batches_rsp_id', selectedJob.value.id);
      formData.append('excel_file', uploadedFile.value);
      formData.append('zip_file', uploadedZipFile.value);

      const response = await adminApi.post('/applicant/submissions/manual', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      isSubmitting.value = false;
      return response;
    } catch (error) {
      isSubmitting.value = false;
      errorMessage.value =
        error.response?.data?.message || error.message || 'Failed to submit manual application';
      throw error;
    }
  }

  /**
   * Reset the upload store state (keeps selectedJob for navigation)
   */
  function reset() {
    uploadedFile.value = null;
    uploadedZipFile.value = null;
    isSubmitting.value = false;
    successDialog.value = false;
    errorMessage.value = '';
  }

  /**
   * Clear all data including selected job
   */
  function clearAll() {
    reset();
    selectedJob.value = null;
  }

  return {
    // State
    uploadedFile,
    uploadedZipFile,
    isSubmitting,
    successDialog,
    errorMessage,
    selectedJob,

    // Actions
    setSelectedJob,
    processSubmission,
    processManualSubmission,
    reset,
    clearAll,
  };
});
