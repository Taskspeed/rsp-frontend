import { defineStore } from 'pinia';
import { adminApi } from 'boot/axios_admin';
import { toast } from 'src/boot/toast';
import { usePlantillaStore } from 'stores/plantillaStore';
import { Notify } from 'quasar';
import { LocalStorage } from 'quasar';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: LocalStorage.getItem('admin_token') || null,
    isAuthenticated: !!LocalStorage.getItem('admin_token'),
    user: LocalStorage.getItem('admin_user') || null,
    loading: false,
    loadUser: false,

    // FIX: should be object, because you access errors.name, errors.username, etc.
    errors: {},

    users: [],
    selectedUser: null,
  }),

  actions: {
    // ✅ Save token and user to LocalStorage
    saveAuthState(token, user) {
      this.token = token;
      this.isAuthenticated = true;
      this.user = user;
      LocalStorage.set('admin_token', token);
      LocalStorage.set('admin_user', user);
      adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    clearAuthState() {
      this.token = null;
      this.isAuthenticated = false;
      this.user = null;
      this.errors = {};
      this.loading = false;
      LocalStorage.remove('admin_token');
      LocalStorage.remove('admin_user');
      delete adminApi.defaults.headers.common['Authorization'];
    },

    //  save the token in to local storage
    getToken() {
      return this.token || LocalStorage.getItem('admin_token');
    },

    async resetPassword(userId) {
      try {
        await adminApi.post(`/users/reset-password/${userId}`);
        Notify.create({ type: 'positive', message: 'Password reset successfully' });
      } catch (error) {
        console.log(error);
        Notify.create({ type: 'negative', message: 'Failed to reset password' });
      }
    },

    async rater_edit(id, userData) {
      this.loading = true;
      this.errors = {};
      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const plantillaStore = usePlantillaStore();
        await plantillaStore.fetch_office_rater();

        const formattedData = {
          office: userData.Office,
          active: userData.active,
          role_type: userData.role,
          representative: userData.representative,
        };

        if (Array.isArray(userData.job_batches_rsp_id) && userData.job_batches_rsp_id.length > 0) {
          formattedData.job_batches_rsp_id = userData.job_batches_rsp_id;

        }

        const response = await adminApi.post(`rater/edit/${id}`, formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          await this.get_all_raters();
          toast.success('Rater updated successfully');
          return { success: true, data: response.data.data, message: response.data.message };
        }

        toast.error(response.data.message || 'Failed to update rater');
        return { success: false, message: response.data.message || 'Failed to update rater' };
      } catch (error) {
        this.handleError(error, error.message || 'Failed to update rater');
        return { success: false, message: error.message || 'Failed to update rater' };
      } finally {
        this.loading = false;
      }
    },

    async login(username, password) {
      this.errors = {};
      this.loading = true;

      try {
        const response = await adminApi.post('/login', { username, password });

        if (response.data.status) {
          this.token = response.data.token;
          this.isAuthenticated = true;
          this.user = response.data.user;

          // document.cookie = `admin_token=${response.data.token}; path=/`;
          this.saveAuthState(response.data.token, response.data.user);
          await this.checkAuth();

          toast.success('You are now logged in!');
          this.router?.push?.({ name: 'Admin Dashboard' });
          return true;
        }

        if (response.data.errors?.role_id) {
          toast.error(response.data.errors.role_id[0] || 'Login Failed!');
        } else {
          toast.error(response.data.message || 'Login Failed!');
        }

        return false;
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

        this.errors = error.response?.data?.errors || {};
        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      const token = this.getToken();

      try {
        await adminApi.post('/users/logout', null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.log(error);
      } finally {
        // ✅ Always clear regardless of API result
        this.clearAuthState();
        toast.success('Logout Successfully');
        this.router?.push?.({ name: 'Admin Login' });
        this.loading = false;
      }
    },

    async checkAuth() {
      const token = this.getToken();
      if (!token) {
        this.token = null;
        this.isAuthenticated = false;
        this.user = null;
        this.errors = {};
        return false;
      }

      try {
        const res = await adminApi.get('/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.token = token;
        this.isAuthenticated = true;
        this.user = res.data.data;
        LocalStorage.set('admin_user', res.data.data);
        this.errors = {};
        return true;
      } catch (error) {
        toast.error('Error: ' + (error.response?.data?.message || 'Unauthorized'));
        await this.logout();
        return false;
      }
    },

    async getAllUsers() {
      this.loadUser = true;
      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await adminApi.get('/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          this.users = response.data.data || [];
          return this.users;
        }

        toast.error('Failed to retrieve users');
        this.users = [];
        return [];
      } catch (error) {
        this.handleError(error, 'Failed to retrieve users');
        this.users = [];
        return [];
      } finally {
        this.loadUser = false;
      }
    },

    async getUserById(id) {
      this.loading = true;
      this.errors = {};
      this.selectedUser = null;

      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await adminApi.get(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          this.selectedUser = response.data.data;
          return this.selectedUser;
        }

        toast.error('User not found');
        return null;
      } catch (error) {
        this.handleError(error, 'Failed to retrieve user details');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateUser(id, userData) {
      this.loading = true;
      this.errors = {};

      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await adminApi.put(`/users/${id}`, userData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        toast.success('User updated successfully');

        if (response.data.status) {
          if (this.user && this.user.id === id) {
            this.user = { ...this.user, ...response.data.data };
            LocalStorage.set('admin_user', this.user); //
          }
          return response.data.data;
        }

        return null;
      } catch (error) {
        toast.error('Error Update User');
        this.handleError(error, 'Error Update User');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(id) {
      this.loading = true;
      this.errors = {};

      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await adminApi.delete(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          this.users = this.users.filter((user) => user.id !== id);
          toast.success('User deleted successfully');
          return true;
        }

        toast.error('Failed to delete user');
        return false;
      } catch (error) {
        this.handleError(error, 'Failed to delete user');
        return false;
      } finally {
        this.loading = false;
      }
    },

    async registerUser(userData) {
      this.loading = true;
      this.errors = {};

      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const formattedData = {
          ...userData,
          ...(userData.permissions && {
            permissions: {
              viewDashboardstat: userData.permissions?.viewDashboardstat || '0',
              viewPlantillaAccess: userData.permissions?.viewPlantillaAccess || '0',
              modifyPlantillaAccess: userData.permissions?.modifyPlantillaAccess || '0',
              viewJobpostAccess: userData.permissions?.viewJobpostAccess || '0',
              modifyJobpostAccess: userData.permissions?.modifyJobpostAccess || '0',
              viewActivityLogs: userData.permissions?.viewActivityLogs || '0',
              userManagement: userData.permissions?.userManagement || '0',
              viewRater: userData.permissions?.viewRater || '0',
              modifyRater: userData.permissions?.modifyRater || '0',
              viewCriteria: userData.permissions?.viewCriteria || '0',
              modifyCriteria: userData.permissions?.modifyCriteria || '0',
              viewReport: userData.permissions?.viewReport || '0',
            },
          }),
        };

        const response = await adminApi.post('/registration', formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          await this.getAllUsers();
          toast.success('User registered successfully');
          return true;
        }

        toast.error('Failed to register user');
        return false;
      } catch (error) {
        this.handleError(error, 'Failed to register user');
        return false;
      } finally {
        this.loading = false;
      }
    },


    async get_all_raters() {
      this.loadUser = true;

      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await adminApi.get('/rater/list', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          this.users = response.data.data || [];
          return this.users;
        }

        toast.error(response.data.message || 'Failed to retrieve raters');
        return [];
      } catch (error) {
        this.handleError(error, 'Failed to retrieve raters');
        return [];
      } finally {
        this.loadUser = false;
      }
    },

    async Rater_register(userData) {
      
      this.loading = true;
      this.errors = {};
      try {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const username = userData.name;
        const formattedData = {
          name: username,
          username: username,
          job_batches_rsp_id: userData.job_batches_rsp_id || [],
          position: userData.position || userData.Designation,
          office: userData.Office,
          password: 'admin',
          controlNo: userData.controlNo,
          // FIX: added missing required fields
          representative: userData.representative || '',
          role: userData.role || '',
        };

        const response = await adminApi.post('rater/register', formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.status) {
          await this.get_all_raters();
          return { success: true, data: response.data.data, message: response.data.message };
        }

        toast.error(response.data.message || 'Failed to register rater');
        return { success: false, message: response.data.message || 'Failed to register rater' };
      } catch (error) {
        this.handleError(error, error.message || 'Failed to register rater');
        return { success: false, message: error.message || 'Failed to register rater' };
      } finally {
        this.loading = false;
      }
    },

    handleError(error, defaultMessage) {
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        this.logout();
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (error.response?.status === 422) {
        this.errors = error.response?.data?.errors || {};
        toast.error('Validation error. Please check the form.');
      } else if (error.response?.status === 0 || !error.response) {
        toast.error('Unable to connect to the server. Please check your internet connection.');
      } else {
        console.error(error);
        toast.error(defaultMessage);
      }
    },
  },
});
