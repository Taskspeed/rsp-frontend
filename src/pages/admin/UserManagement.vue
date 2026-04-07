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
      <div class="table-scroll-wrapper">
        <q-table
          :rows="authStore.users"
          :columns="columns"
          row-key="id"
          :filter="filter"
          v-bind="pagination"
          :loading="authStore.loadUser"
        >
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
              label="Add"
              icon="person_add"
              @click="openAddDialog()"
              class="add-user-btn"
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

          <!-- Actions -->
          <template #body-cell-actions="props">
            <q-td :props="props">
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
    </div>

    <!-- ================================================================ -->
    <!-- Add / Edit User Dialog                                           -->
    <!-- ================================================================ -->
    <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
      <q-card class="user-dialog-card">
        <!-- Header -->
        <q-card-section class="dialog-header" :class="isEditing ? 'header-edit' : 'header-add'">
          <div class="row items-center no-wrap">
            <q-icon
              :name="isEditing ? 'manage_accounts' : 'person_add'"
              size="28px"
              class="q-mr-sm"
            />
            <div>
              <div class="text-h6 text-bold">{{ isEditing ? 'Edit User' : 'Add New User' }}</div>
              <div class="text-caption opacity-80">
                {{
                  isEditing
                    ? 'Update user details and permissions'
                    : 'Fill in details to create a new user account'
                }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="close-btn" v-close-popup />
        </q-card-section>

        <q-separator />

        <!-- Body -->
        <q-card-section class="dialog-body q-pa-none">
          <q-form @submit="isEditing ? (confirmUpdateDialog = true) : submitForm()">
            <div class="dialog-panels">
              <!-- ── Left Panel: User Information ── -->
              <div class="left-panel q-pa-lg">
                <div class="section-label q-mb-md">
                  <q-icon name="person" size="16px" class="q-mr-xs" />
                  User Information
                </div>

                <q-input
                  v-model="form.name"
                  label="Full Name"
                  :error="!!authStore.errors?.name"
                  :error-message="authStore.errors?.name?.[0]"
                  outlined
                  dense
                  class="q-mb-md"
                >
                  <template #prepend><q-icon name="badge" size="18px" /></template>
                </q-input>

                <q-input
                  v-model="form.username"
                  label="Username"
                  :error="!!authStore.errors?.username"
                  :error-message="authStore.errors?.username?.[0]"
                  outlined
                  dense
                  class="q-mb-md"
                >
                  <template #prepend><q-icon name="alternate_email" size="18px" /></template>
                </q-input>

                <q-input
                  v-model="form.position"
                  label="Position"
                  :error="!!authStore.errors?.position"
                  :error-message="authStore.errors?.position?.[0]"
                  outlined
                  dense
                  class="q-mb-md"
                >
                  <template #prepend><q-icon name="work" size="18px" /></template>
                </q-input>

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
                  dense
                  class="q-mb-md"
                >
                  <template #prepend><q-icon name="lock" size="18px" /></template>
                </q-input>

                <div class="status-toggle-row">
                  <span class="text-body2 text-grey-7">Account Status</span>
                  <q-toggle
                    v-model="form.active"
                    :color="form.active ? 'positive' : 'negative'"
                    keep-color
                  >
                    <span
                      :class="form.active ? 'text-positive' : 'text-negative'"
                      class="text-weight-medium"
                    >
                      {{ form.active ? 'Active' : 'Inactive' }}
                    </span>
                  </q-toggle>
                </div>
              </div>

              <q-separator :vertical="!$q.screen.lt.md" />

              <!-- ── Right Panel: Permissions ── -->
              <div class="right-panel q-pa-lg">
                <div class="section-label q-mb-md">
                  <q-icon name="shield" size="16px" class="q-mr-xs" />
                  Module Permissions
                </div>

                <div class="permissions-scroll">
                  <!-- Dashboard -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="dashboard" size="14px" class="q-mr-xs" />
                      Dashboard
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewDashboardstat"
                        label="View Statistics"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Plantilla -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="domain" size="14px" class="q-mr-xs" />
                      Plantilla
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewPlantillaAccess"
                        label="View"
                        dense
                        color="primary"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyPlantillaAccess"
                        label="Modify"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Job Post -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="post_add" size="14px" class="q-mr-xs" />
                      Job Posts
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewJobpostAccess"
                        label="View"
                        dense
                        color="primary"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyJobpostAccess"
                        label="Modify"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Schedule -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="event" size="14px" class="q-mr-xs" />
                      Schedule
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewSchedule"
                        label="View"
                        dense
                        color="primary"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifySchedule"
                        label="Modify"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Exam Score -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="grading" size="14px" class="q-mr-xs" />
                      Exam Score
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewExam"
                        label="View"
                        dense
                        color="primary"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyExam"
                        label="Modify"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Rater Management -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="assignment_ind" size="14px" class="q-mr-xs" />
                      Rater Management
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewRater"
                        label="View Raters"
                        dense
                        color="primary"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyRater"
                        label="Modify Raters"
                        dense
                        color="primary"
                      />
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewCriteria"
                        label="View Criteria"
                        dense
                        color="primary"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyCriteria"
                        label="Modify Criteria"
                        dense
                        color="primary"
                      />
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewReport"
                        label="View Reports"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Administration -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="admin_panel_settings" size="14px" class="q-mr-xs" />
                      Administration
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.userManagement"
                        label="User Management"
                        dense
                        color="primary"
                      />
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewActivityLogs"
                        label="Activity Logs"
                        dense
                        color="primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <q-separator />
            <div class="dialog-footer row justify-end items-center q-pa-md q-gutter-sm">
              <q-btn rounded flat label="Cancel" color="grey-7" v-close-popup />
              <q-btn
                rounded
                unelevated
                :label="isEditing ? 'Save Changes' : 'Create User'"
                type="submit"
                :color="isEditing ? 'blue' : 'primary'"
                :loading="authStore.loading"
                :icon="isEditing ? 'save' : 'person_add'"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Update Confirmation Dialog -->
    <q-dialog v-model="confirmUpdateDialog" persistent>
      <q-card style="min-width: 300px; max-width: 95vw">
        <q-card-section class="row items-center">
          <q-avatar icon="info" color="blue" text-color="white" />
          <span class="q-ml-sm">Are you sure you want to update this user?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
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
    components: { ButtonResetPassword, ButtonDelete },

    setup() {
      const authStore = useAuthStore();
      const confirmUpdateDialog = ref(false);

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

      const defaultPermissions = () => ({
        viewDashboardstat: '0',
        viewPlantillaAccess: '0',
        modifyPlantillaAccess: '0',
        viewJobpostAccess: '0',
        modifyJobpostAccess: '0',
        viewSchedule: '0',
        modifySchedule: '0',
        viewExam: '0',
        modifyExam: '0',
        viewRater: '0',
        modifyRater: '0',
        viewCriteria: '0',
        modifyCriteria: '0',
        viewReport: '0',
        userManagement: '0',
        viewActivityLogs: '0',
      });

      const dialog = ref(false);
      const isEditing = ref(false);
      const form = ref({
        name: '',
        username: '',
        position: '',
        password: '',
        active: true,
        permissions: defaultPermissions(),
      });

      const resetForm = () => {
        form.value = {
          name: '',
          username: '',
          position: '',
          password: '',
          active: true,
          permissions: defaultPermissions(),
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

        const p = user.rsp_control ?? {};
        form.value = {
          id: user.id,
          name: user.name,
          username: user.username,
          position: user.position,
          password: '',
          active: user.active,
          permissions: {
            viewDashboardstat: p.viewDashboardstat || '0',
            viewPlantillaAccess: p.viewPlantillaAccess || '0',
            modifyPlantillaAccess: p.modifyPlantillaAccess || '0',
            viewJobpostAccess: p.viewJobpostAccess || '0',
            modifyJobpostAccess: p.modifyJobpostAccess || '0',
            viewSchedule: p.viewSchedule || '0',
            modifySchedule: p.modifySchedule || '0',
            viewExam: p.viewExam || '0',
            modifyExam: p.modifyExam || '0',
            viewRater: p.viewRater || '0',
            modifyRater: p.modifyRater || '0',
            viewCriteria: p.viewCriteria || '0',
            modifyCriteria: p.modifyCriteria || '0',
            viewReport: p.viewReport || '0',
            userManagement: p.userManagement || '0',
            viewActivityLogs: p.viewActivityLogs || '0',
          },
        };
      };

      const submitForm = async () => {
        const userData = { ...form.value, permissions: { ...form.value.permissions } };
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

<style scoped>
  /* ── Table wrapper: horizontal scroll on small screens ── */
  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* ── "Add New User" button: hide label on xs screens ── */
  @media (max-width: 479px) {
    .add-user-btn :deep(.q-btn__content span) {
      display: none;
    }
  }

  /* ── Dialog Card ── */
  .user-dialog-card {
    width: 95vw;
    max-width: 900px;
    display: flex;
    flex-direction: column;
    max-height: 95vh;
  }

  @media (min-width: 600px) {
    .user-dialog-card {
      width: 90vw;
      max-height: 90vh;
    }
  }

  /* ── Header ── */
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    color: white;
    flex-shrink: 0;
  }
  .header-add {
    background: #00b034;
  }
  .header-edit {
    background: #1976d2;
  }
  .close-btn {
    color: rgba(255, 255, 255, 0.8);
  }
  .close-btn:hover {
    color: white;
  }

  /* ── Body ── */
  .dialog-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .dialog-body .q-form {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  /* ── Panels container: row on desktop, column on mobile ── */
  .dialog-panels {
    display: flex;
    flex-direction: row;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  @media (max-width: 767px) {
    .dialog-panels {
      flex-direction: column;
      overflow-y: auto;
    }
  }

  /* ── Left Panel ── */
  .left-panel {
    width: 320px;
    min-width: 280px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  @media (max-width: 767px) {
    .left-panel {
      width: 100%;
      min-width: unset;
      overflow-y: visible;
      flex-shrink: unset;
    }
  }

  /* ── Right Panel ── */
  .right-panel {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  @media (max-width: 767px) {
    .right-panel {
      overflow: visible;
      flex: unset;
    }
  }

  .permissions-scroll {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  @media (max-width: 767px) {
    .permissions-scroll {
      overflow-y: visible;
      flex: unset;
    }
  }

  /* ── Section Labels ── */
  .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9e9e9e;
    display: flex;
    align-items: center;
  }

  /* ── Status Toggle Row ── */
  .status-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-top: 1px solid #f0f0f0;
    margin-top: 4px;
  }

  /* ── Permission Groups ── */
  .perm-group {
    border: 1px solid #eeeeee;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
    background: #fafafa;
  }

  .perm-group-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #616161;
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eeeeee;
  }

  .perm-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 2px 0;
  }

  .perm-row.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  /* Collapse two-col to single column on very small screens */
  @media (max-width: 479px) {
    .perm-row.two-col {
      grid-template-columns: 1fr;
    }
  }

  /* ── Footer ── */
  .dialog-footer {
    flex-shrink: 0;
    background: #fafafa;
  }
</style>
