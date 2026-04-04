import { defineStore } from 'pinia';
import { adminApi } from 'src/boot/axios_admin';
import { toast } from 'src/boot/toast'; // Import toast instance
import { LocalStorage } from 'quasar';

export const usexPDS = defineStore('xPDS', {
  state: () => ({
    xPDS: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchxPDS(controlno) {
      try {
        const token = LocalStorage.getItem('admin_token');
        if (!token) throw new Error('No authentication token found');
        this.loading = true;
        const response = await adminApi.post(
          '/xPDS',
          {
            controlno,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        this.xPDS = response.data;
        // console.log(response.data);
        this.error = null;
      } catch (err) {
        this.error = err.message;
        toast.error('Error Fetching PDS');
      } finally {
        this.loading = false;
      }
    },
  },
});
