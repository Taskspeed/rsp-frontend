import { defineStore } from 'pinia';
import { adminApi } from 'src/boot/axios_admin';

export const usePlantillaReportStore = defineStore('plantillaReport', {
  state: () => ({
    loading: false,
    error: null,
    data: null,
    jobId: null,
    progress: 0,
    pollInterval: null,
    abortController: null,
    message: '',
  }),

  actions: {
    // async fetchReport() {
    //   this.loading = true;
    //   this.error = null;
    //   this.data = null;

    //   // ✅ Create new abort controller
    //   this.abortController = new AbortController();

    //   try {
    //     // Start generation
    //     const response = await adminApi.get('/generate', {
    //       signal: this.abortController.signal
    //     });
    //     this.jobId = response.data.job_id;

    //     // Poll for status
    //     await this.pollStatus();

    //   } catch (err) {
    //     if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
    //       console.log('Request was cancelled');
    //       this.error = 'Request cancelled by user';
    //     } else {
    //       this.error = err;
    //     }
    //     this.loading = false;
    //   }
    // },

        async fetchReport() {
            this.loading = true;
            this.error = null;
            this.data = null;

            this.abortController = new AbortController();

            try {
              const response = await adminApi.get('/generate', {
                signal: this.abortController.signal
              });

              // ✅ Check if response indicates queue worker not running
              if (response.data.status === 'error') {
                this.error = response.data.message;
                this.loading = false;
                return;
              }

              this.jobId = response.data.job_id;
              await this.pollStatus();

            } catch (err) {
              if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                console.log('Request was cancelled');
                this.error = 'Request cancelled by user';
              } else if (err.response?.status === 503) {
                // ✅ Handle 503 Service Unavailable
                this.error = err.response.data.message || 'Queue worker is not running. Please contact Deniel Tomenio for this issue.';
              } else {
                this.error = err.response?.data?.message || err.message || 'An error occurred';
              }
              this.loading = false;
            }
          },
    async pollStatus() {
      this.pollInterval = setInterval(async () => {
        try {
          const response = await adminApi.get(`/generate/status/${this.jobId}`, {
            signal: this.abortController.signal
          });
          const status = response.data;

          this.progress = status.progress || 0;
          this.message = status.message || '';

          if (status.status === 'completed') {
            this.data = status.data;
            this.loading = false;
            this.cleanup();
          } else if (status.status === 'failed') {
            this.error = status.error;
            this.loading = false;
            this.cleanup();
          } else if (status.status === 'cancelled') {
            this.error = 'Job was cancelled';
            this.loading = false;
            this.cleanup();
          }
        } catch (err) {
          if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
            console.log('Polling cancelled');
          } else {
            this.error = err;
            this.loading = false;
            this.cleanup();
          }
        }
      }, 2000);
    },

    cancelRequest() {
      // ✅ Abort ongoing requests
      if (this.abortController) {
        this.abortController.abort();
      }

      // ✅ Stop polling
      this.cleanup();

      // ✅ Optionally notify backend to cancel the job
      if (this.jobId) {
        adminApi.post(`/generate/cancel/${this.jobId}`).catch(err => {
          console.error('Failed to cancel job on backend:', err);
        });
      }

      this.loading = false;
      this.error = 'Request cancelled by user';
    },

    cleanup() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    },

    // ✅ Reset store state
    reset() {
      this.cancelRequest();
      this.data = null;
      this.jobId = null;
      this.progress = 0;
      this.error = null;
      this.message = '';
    }
  }
});
