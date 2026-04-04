import { defineStore } from 'pinia';
import { ref } from 'vue';
import { raterApi } from 'boot/axios_rater';
import { toast } from 'src/boot/toast';
import { LocalStorage } from 'quasar';
// import { useLogsStore } from 'stores/raterlogsStore';

export const useRaterAuthStore = defineStore('rater_auth', () => {
  // State - Authentication
  const token = ref(LocalStorage.getItem('rater_token') || null);
  const isAuthenticated = ref(!!LocalStorage.getItem('rater_token'));
  const user = ref(LocalStorage.getItem('rater_user') || null);
  const loading = ref(false);
  const loadUser = ref(false);
  const errors = ref([]);
  const users = ref([]);
  const selectedUser = ref(null);

  // State - Dashboard Data
  const assignedJobsCount = ref(0);
  const completedJobsCount = ref(0);
  const pendingJobsCount = ref(0);
  const completionRate = ref('0%');
  const assignedJobs = ref([]);

  // Helper functions
  function getToken() {
    return token.value || LocalStorage.getItem('rater_token');
  }
  // ✅ Save token and user to LocalStorage
  function saveAuthState(authToken, userData) {
    token.value = authToken;
    isAuthenticated.value = true;
    user.value = userData;
    LocalStorage.set('rater_token', authToken);
    LocalStorage.set('rater_user', userData);
    raterApi.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  }

  // ✅ Clear LocalStorage instead of cookies
  function clearAuthState() {
    token.value = null;
    isAuthenticated.value = false;
    user.value = null;
    errors.value = {};
    loading.value = false;
    assignedJobsCount.value = 0;
    completedJobsCount.value = 0;
    pendingJobsCount.value = 0;
    completionRate.value = '0%';
    assignedJobs.value = [];

    LocalStorage.remove('rater_token');
    LocalStorage.remove('rater_user');
    delete raterApi.defaults.headers.common['Authorization'];
  }

  function extractUserData(data) {
    // Extract user information
    const userData = {
      id: data.id,
      name: data.name,
      username: data.username,
      position: data.position,
      active: data.active,
      rspControl: data.rspControl,
      must_change_password: data.must_change_password,
    };

    user.value = userData;
    LocalStorage.set('rater_user', userData); // ✅ keep in sync
    // Extract dashboard statistics
    assignedJobsCount.value = data.assigned_jobs_count || 0;
    completedJobsCount.value = data.completed_jobs_count || 0;
    pendingJobsCount.value = data.pending_jobs_count || 0;
    completionRate.value = data.completion_rate || '0%';
    assignedJobs.value = data.assigned_jobs || [];
  }

  async function changePassword(passwordData) {
    loading.value = true;
    errors.value = {};

    try {
      const response = await raterApi.post('/rater/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });

      if (response.data.success) {
        // Update user state to reflect password has been changed
        if (user.value) {
          user.value.must_change_password = false;
          LocalStorage.set('rater_user', user.value); // ✅ keep in sync
        }

        toast.success(response.data.message || 'Password changed successfully!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Failed to change password');
        return { success: false, errors: response.data.errors };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to change password. Please try again.';
      toast.error(errorMessage);

      return {
        success: false,
        errors: error.response?.data?.errors || {},
      };
    } finally {
      loading.value = false;
    }
  }
  async function login(username, password) {
    errors.value = {};
    loading.value = true;

    try {
      const response = await raterApi.post('/rater/login', { username, password });

      if (response.data.status) {
        token.value = response.data.token;
        isAuthenticated.value = true;

        // Store user data including must_change_password
        const userData = {
          name: response.data.user.name,
          position: response.data.user.position,
          role_id: response.data.user.role_id,
          role_name: response.data.user.role_name,
          must_change_password: response.data.user.must_change_password,
        };

        // Set cookie
        saveAuthState(response.data.token, userData);

        toast.success('You are now logged in!');

        // Return the must_change_password flag
        return {
          success: true,
          must_change_password: response.data.user.must_change_password,
        };
      } else {
        loading.value = false;
        if (response.data.errors?.role_id) {
          toast.error(response.data.errors.role_id[0] || 'Login Failed!');
        } else {
          toast.error(response.data.message || 'Login Failed!');
        }
        return { success: false };
      }
    } catch (error) {
      if (error.response?.status === 403) {
        if (error.response.data.errors?.role_id) {
          toast.error(error.response.data.errors.role_id[0]);
        } else {
          toast.error(
            error.response.data.message ||
              'Your account is inactive. Please contact the administrator.',
          );
        }
      } else if (error.response?.status === 0 || !error.response) {
        toast.error('Please check your internet connection and try again later.');
      } else {
        toast.error('Login Failed!');
      }
      errors.value = error.response?.data?.errors || {};
      loading.value = false;
      return { success: false };
    } finally {
      // const logsStore = useLogsStore();
      // await logsStore.logAction('Logged In');
    }
  }

  function handleError(error, defaultMessage) {
    if (error.response?.status === 401) {
      toast.error('Your session has expired. Please log in again.');
      logout();
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 422) {
      errors.value = error.response.data.errors;
      toast.error('Validation error. Please check the form.');
    } else if (!error.response) {
      // silent network error
    } else {
      toast.error(defaultMessage);
    }
  }

  async function updatePassword({ old_password, new_password, new_password_confirmation }) {
    errors.value = {};
    loading.value = true;

    try {
      const response = await raterApi.post('/rater/update-password', {
        old_password,
        new_password,
        new_password_confirmation,
      });

      if (response.data.status) {
        if (response.data.token) {
          // ✅ Update token in LocalStorage if refreshed
          saveAuthState(response.data.token, user.value);
        }
        if (user.value) {
          user.value.password_updated_at = new Date().toISOString();
          LocalStorage.set('rater_user', user.value); // ✅ keep in sync
        }
        toast.success('Password changed successfully!');
        return true;
      } else {
        errors.value = response.data.errors || {};
        if (response.data.errors?.old_password) {
          toast.error(response.data.errors.old_password[0] || 'Current password is incorrect');
        } else {
          toast.error(response.data.message || 'Failed to change password');
        }
        return false;
      }
    } catch (error) {
      handleError(error, 'Failed to change password');
      return false;
    } finally {
      loading.value = false;
    }
  }
  // async function logout() {
  //   loading.value = true;
  //   const authToken = getToken();

  //   try {
  //     await raterApi.post('/rater/logout', null, {
  //       headers: {
  //         Authorization: `Bearer ${authToken}`,
  //       },
  //     });

  //     clearAuthState();
  //     clearCookies();

  //     toast.success('Logout Success!');
  //     this.router.push({ name: 'Rater Login' });
  //   } catch (error) {
  //     toast.error('An error occurred during logout or token error');
  //     console.log(error);
  //     clearAuthState();
  //     clearCookies();
  //     this.router.push({ name: 'Rater Login' });
  //   } finally {
  //     // const logsStore = useLogsStore();
  //     // await logsStore.logAction('Logged Out');
  //   }
  // }

  async function logout() {
    loading.value = true;
    const authToken = getToken();

    try {
      await raterApi.post('/rater/logout', null, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (error) {
      console.log(error);
    } finally {
      // ✅ Always clear regardless of API result
      clearAuthState();
      toast.success('Logout Success!');
      this.router.push({ name: 'Rater Login' });
      loading.value = false;
    }
  }

  async function get_rater_usernames() {
    loadUser.value = true;
    try {
      const response = await raterApi.get('/rater/name');

      if (response.data.status) {
        users.value = response.data.data.map((rater) => ({
          id: rater.id,
          name: rater.name,
          office: rater.office || 'No office assigned',
          username: rater.username || rater.name.toLowerCase().replace(/\s+/g, ''),
        }));

        return users.value;
      } else {
        toast.error('Failed to retrieve raters');
        return [];
      }
    } catch (error) {
      handleError(error, 'Failed to retrieve raters');
      return [];
    } finally {
      loadUser.value = false;
    }
  }

  /**
   * Check authentication and fetch all user data including dashboard statistics
   * This is the single source of truth for dashboard data
   */
  async function checkAuth_rater() {
    const authToken = getToken();

    if (!authToken) {
      clearAuthState();
      return;
    }

    try {
      const res = await raterApi.get('/rater', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.data.status && res.data.data) {
        token.value = authToken;
        isAuthenticated.value = true;
        extractUserData(res.data.data);
        errors.value = {};
        loading.value = false;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (error.response?.data?.message) {
        toast.error('Error: ' + error.response.data.message);
      }
      clearAuthState();
    }
  }

  /**
   * Fetch/refresh assigned jobs and dashboard statistics
   * This is an alias for checkAuth_rater to maintain compatibility
   */
  async function fetch_assigned_jobs() {
    loading.value = true;
    // console.log('Fetching assigned jobs...');

    try {
      await checkAuth_rater();
      console.log('Jobs fetched successfully:', assignedJobs.value.length);
    } catch (error) {
      console.error('Error fetching assigned jobs:', error);
      handleError(error, 'Failed to fetch assigned jobs');
    } finally {
      loading.value = false;
    }
  }

  async function deleteUser(id) {
    loading.value = true;
    errors.value = {};

    try {
      const authToken = getToken();

      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await raterApi.delete(`/rater/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.status) {
        // Remove the user from the users array
        users.value = users.value.filter((user) => user.id !== id);

        toast.success('Rater deleted successfully');
        loading.value = false;
        return true;
      } else {
        toast.error('Failed to delete rater');
        loading.value = false;
        return false;
      }
    } catch (error) {
      handleError(error, 'Failed to delete rater');
      loading.value = false;
      return false;
    } finally {
      // const logsStore = useLogsStore();
      // await logsStore.logAction(`Deleted User ID: ${id}`);
    }
  }

  // Return all refs and functions
  return {
    // Authentication State
    token,
    isAuthenticated,
    user,
    loading,
    loadUser,
    errors,
    users,
    selectedUser,

    // Dashboard State
    assignedJobsCount,
    completedJobsCount,
    pendingJobsCount,
    completionRate,
    assignedJobs,

    // Methods
    login,
    logout,
    deleteUser,
    getToken,
    checkAuth_rater,
    handleError,
    get_rater_usernames,
    updatePassword,
    fetch_assigned_jobs, // Alias for checkAuth_rater
    clearAuthState,
    changePassword,
  };
});
