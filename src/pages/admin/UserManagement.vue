<template>
  <q-page>
    <div class="q-pa-md">
      <div class="column items-start justify-center q-mb-md">
        <h5 class="text-h5 q-ma-none"><b>User Management</b></h5>

        <div class="q-pa-md q-gutter-sm">
          <q-breadcrumbs class="q-ma-none">
            <template #separator>
              <q-icon size="1.2em" name="arrow_forward" />
            </template>
            <q-breadcrumbs-el icon="manage_accounts" label="User Management" />
          </q-breadcrumbs>
        </div>
      </div>

      <!-- User List -->
      <q-table
        :rows="authStore.users"
        :columns="columns"
        row-key="id"
        :filter="filter"
        v-bind="pagination"
        :loading="authStore.loadUser"
      >
        <!-- Top section with search -->
        <template #top-left>
          <q-input outlined dense debounce="300" v-model="filter" placeholder="Search">
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template #top-right>
          <q-btn
            rounded
            color="primary"
            label="Add New User"
            icon="person_add"
            @click="openAddDialog()"
          />
        </template>

        <!-- Active status -->
        <template #body-cell-active="props">
          <q-td :props="props">
            <q-badge rounded :color="props.row.active ? 'positive' : 'negative'">
              {{ props.row.active ? 'Active' : 'Inactive' }}
            </q-badge>
          </q-td>
        </template>

        <!-- created_at -->
        <template #body-cell-created_at="props">
          <q-td :props="props" style="width: 230px; white-space: normal">
            <q-badge rounded class="bg-blue" outline>
              {{
                new Date(props.value).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              }}
            </q-badge>
          </q-td>
        </template>

        <!-- updated_at -->
        <template #body-cell-updated_at="props">
          <q-td :props="props" style="width: 230px; white-space: normal">
            <q-badge rounded class="bg-teal" outline>
              {{
                new Date(props.value).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              }}
            </q-badge>
          </q-td>
        </template>

        <!-- Actions column -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <!-- Null-safe check: authStore.user can be null briefly -->
            <q-btn
              v-if="authStore.user && props.row.id !== authStore.user.id"
              flat
              round
              dense
              color="orange"
              class="bg-orange-2"
              icon="edit"
              @click="openEditDialog(props.row.id)"
            >
              <q-tooltip>Edit User</q-tooltip>
            </q-btn>

            <ButtonResetPassword
              v-if="authStore.user && props.row.id !== authStore.user.id"
              :user-id="props.row.id"
            />

            <ButtonDelete
              v-if="authStore.user && props.row.id !== authStore.user.id"
              :user-id="props.row.id"
            />

            <q-badge
              v-if="authStore.user && props.row.id === authStore.user.id"
              rounded
              color="blue"
            >
              You
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Add/Edit User Dialog -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 900px">
        <q-card-section :class="isEditing ? 'bg-blue text-white' : 'bg-green text-white'">
          <div class="text-h4 text-bold">
            {{ isEditing ? 'Edit User' : 'Add New User' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="isEditing ? (confirmUpdateDialog = true) : submitForm()">
            <div class="row q-col-gutter-sm">
              <!-- Left Column - User Information -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle1 q-mb-sm">User Information</div>

                <q-input
                  v-model="form.name"
                  label="Name *"
                  :error="!!authStore.errors?.name"
                  :error-message="authStore.errors?.name?.[0]"
                  outlined
                  class="q-mb-sm"
                />

                <q-input
                  v-model="form.username"
                  label="Username *"
                  :error="!!authStore.errors?.username"
                  :error-message="authStore.errors?.username?.[0]"
                  outlined
                  class="q-mb-sm"
                />

                <q-input
                  v-model="form.position"
                  label="Position *"
                  :error="!!authStore.errors?.position"
                  :error-message="authStore.errors?.position?.[0]"
                  outlined
                  class="q-mb-sm"
                />

                <q-input
                  v-model="form.password"
                  type="password"
                  label="Password"
                  :hint="
                    isEditing ? 'Leave empty to keep current password' : 'Required for new users'
                  "
                  :error="!!authStore.errors?.password"
                  :error-message="authStore.errors?.password?.[0]"
                  outlined
                  class="q-mb-sm"
                />

                <q-toggle v-model="form.active" label="Active" class="q-mb-sm" />
              </div>

              <!-- Right Column - Permissions -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle1 q-mb-sm">User Permissions</div>
                <q-card flat bordered class="q-pa-md">
                  <div class="q-gutter-y-md">
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewDashboardstat"
                      label="View Dashboard Statistics"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewPlantillaAccess"
                      label="View Plantilla Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.modifyPlantillaAccess"
                      label="Modify Plantilla Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewJobpostAccess"
                      label="View Job Post Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.modifyJobpostAccess"
                      label="Modify Job Post Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewActivityLogs"
                      label="View Activity Logs"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.userManagement"
                      label="Allow Access to User Management"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewRater"
                      label="View Rater Module Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.modifyRater"
                      label="Modify Rater Module Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewCriteria"
                      label="View Criteria Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.modifyCriteria"
                      label="Modify Criteria Access"
                    />
                    <q-toggle
                      true-value="1"
                      false-value="0"
                      v-model="form.permissions.viewReport"
                      label="View Report Module Access"
                    />
                  </div>
                </q-card>
              </div>
            </div>

            <div class="row justify-end">
              <q-btn rounded label="Cancel" color="negative" flat v-close-popup />
              <q-btn
                rounded
                :label="isEditing ? 'Update' : 'Create'"
                type="submit"
                :color="isEditing ? 'blue' : 'primary'"
                :loading="authStore.loading"
                class="q-ml-sm"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Update Confirmation Dialog -->
    <q-dialog v-model="confirmUpdateDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="info" color="primary" text-color="white" />
          <span class="q-ml-sm">Are you sure you want to update this user?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Yes, Update"
            color="blue"
            @click="submitForm"
            :loading="authStore.loading"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
  import { defineComponent, ref, onMounted } from 'vue';
  import { useAuthStore } from 'stores/authStore';
  import ButtonResetPassword from 'components/ButtonResetPassword.vue';
  import ButtonDelete from 'components/ButtonDelete.vue';

  export default defineComponent({
    name: 'UserManagement',
    components: {
      ButtonResetPassword,
      ButtonDelete,
    },

    setup() {
      const authStore = useAuthStore();

      const confirmUpdateDialog = ref(false);

      // Table related
      const filter = ref('');
      const pagination = ref({
        sortBy: 'id',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      });

      const columns = [
        { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
        { name: 'username', align: 'left', label: 'Username', field: 'username', sortable: true },
        { name: 'position', align: 'left', label: 'Position', field: 'position', sortable: true },
        { name: 'active', align: 'left', label: 'Status', field: 'active', sortable: true },
        {
          name: 'created_at',
          align: 'left',
          label: 'Created At',
          field: 'created_at',
          sortable: true,
        },
        {
          name: 'updated_at',
          align: 'left',
          label: 'Updated At',
          field: 'updated_at',
          sortable: true,
        },
        { name: 'actions', align: 'center', label: 'Actions', field: 'actions', sortable: false },
      ];

      // Form related
      const dialog = ref(false);
      const isEditing = ref(false);
      const form = ref({
        name: '',
        username: '',
        position: '',
        password: '',
        active: true,
        permissions: {
          viewDashboardstat: '0',
          viewPlantillaAccess: '0',
          modifyPlantillaAccess: '0',
          viewJobpostAccess: '0',
          modifyJobpostAccess: '0',
          viewActivityLogs: '0',
          userManagement: '0',
          viewRater: '0',
          modifyRater: '0',
          viewCriteria: '0',
          modifyCriteria: '0',
          viewReport: '0',
        },
      });

      const resetForm = () => {
        form.value = {
          name: '',
          username: '',
          position: '',
          password: '',
          active: true,
          permissions: {
            viewDashboardstat: '0',
            viewPlantillaAccess: '0',
            modifyPlantillaAccess: '0',
            viewJobpostAccess: '0',
            modifyJobpostAccess: '0',
            viewActivityLogs: '0',
            userManagement: '0',
            viewRater: '0',
            modifyRater: '0',
            viewCriteria: '0',
            modifyCriteria: '0',
            viewReport: '0',
          },
        };
        authStore.errors = {};
      };

      const openAddDialog = () => {
        resetForm();
        isEditing.value = false;
        dialog.value = true;
      };

      const openEditDialog = async (userId) => {
        resetForm();
        isEditing.value = true;
        dialog.value = true;

        const user = await authStore.getUserById(userId);
        if (!user) return;

        form.value = {
          id: user.id,
          name: user.name,
          username: user.username,
          position: user.position,
          password: '',
          active: user.active,
          permissions: {
            viewDashboardstat: user.rsp_control?.viewDashboardstat || '0',
            viewPlantillaAccess: user.rsp_control?.viewPlantillaAccess || '0',
            modifyPlantillaAccess: user.rsp_control?.modifyPlantillaAccess || '0',
            viewJobpostAccess: user.rsp_control?.viewJobpostAccess || '0',
            modifyJobpostAccess: user.rsp_control?.modifyJobpostAccess || '0',
            viewActivityLogs: user.rsp_control?.viewActivityLogs || '0',
            userManagement: user.rsp_control?.userManagement || '0',
            viewRater: user.rsp_control?.viewRater || '0',
            modifyRater: user.rsp_control?.modifyRater || '0',
            viewCriteria: user.rsp_control?.viewCriteria || '0',
            modifyCriteria: user.rsp_control?.modifyCriteria || '0',
            viewReport: user.rsp_control?.viewReport || '0',
          },
        };
      };

      const submitForm = async () => {
        const userData = {
          ...form.value,
          permissions: { ...form.value.permissions },
        };

        if (isEditing.value) {
          const result = await authStore.updateUser(form.value.id, userData);
          if (result) dialog.value = false;
        } else {
          const result = await authStore.registerUser(userData);
          if (result) dialog.value = false;
        }

        await authStore.getAllUsers();
      };

      onMounted(async () => {
        // debug to confirm method exists at runtime
        // console.log('authStore.getAllUsers:', authStore.getAllUsers);

        await authStore.getAllUsers();
      });

      return {
        authStore,
        confirmUpdateDialog,
        filter,
        pagination,
        columns,
        dialog,
        isEditing,
        form,
        openAddDialog,
        openEditDialog,
        submitForm,
      };
    },
  });
</script>
