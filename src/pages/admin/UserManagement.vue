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

          <!-- User Role -->
          <template #body-cell-user_role="props">
            <q-td :props="props">
              <q-badge
                v-if="props.row.rsp_control?.user_role"
                rounded
                :color="getRoleBadgeColor(props.row.rsp_control.user_role)"
                class="role-badge"
              >
                <q-icon name="shield" size="10px" class="q-mr-xs" />
                {{ props.row.rsp_control.user_role }}
              </q-badge>
              <span v-else class="text-grey-5 text-caption">—</span>
            </q-td>
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

                <!-- ── User Role ── -->
                <div class="q-mb-md">
                  <q-input
                    v-model="form.user_role"
                    label="User Role"
                    outlined
                    dense
                    @update:model-value="onRoleInput"
                  >
                    <template #prepend>
                      <q-icon name="admin_panel_settings" size="18px" />
                    </template>
                    <template #append>
                      <q-btn
                        v-if="form.user_role"
                        flat
                        round
                        dense
                        icon="close"
                        size="xs"
                        color="grey"
                        @click="clearRole"
                      />
                    </template>
                  </q-input>
                </div>

                <q-input
                  v-model="form.name"
                  label="Full Name"
                  :error="!!authStore.errors?.name"
                  :error-message="authStore.errors?.name?.[0]"
                  outlined
                  dense
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
                <div class="section-label q-mb-sm">
                  <q-icon name="shield" size="16px" class="q-mr-xs" />
                  Module Permissions
                </div>

                <!-- Select All row -->
                <div class="select-all-row q-mb-md">
                  <div class="select-all-left">
                    <q-icon name="select_all" size="14px" class="q-mr-xs text-grey-6" />
                    <span class="text-caption text-grey-7">Select All Permissions</span>
                  </div>
                  <q-toggle
                    v-model="selectAll"
                    color="green"
                    dense
                    keep-color
                    @update:model-value="onSelectAllToggle"
                  >
                    <span
                      :class="selectAll ? 'text-green' : 'text-grey-6'"
                      class="text-caption text-weight-medium"
                    >
                      {{ selectAll ? 'All On' : 'All Off' }}
                    </span>
                  </q-toggle>
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
                        @update:model-value="syncSelectAll"
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
                        :disable="!canToggleView('viewPlantillaAccess')"
                        @update:model-value="() => onViewToggle('viewPlantillaAccess')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyPlantillaAccess"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyPlantillaAccess')"
                      />
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.requestPublication"
                        label="Publication"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('requestPublication')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.reportPlantillaAccess"
                        label="Report"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('reportPlantillaAccess')"
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
                        :disable="!canToggleView('viewJobpostAccess')"
                        @update:model-value="() => onViewToggle('viewJobpostAccess')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyJobpostAccess"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyJobpostAccess')"
                      />
                    </div>
                  </div>

                  <!-- Applicant -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="people" size="14px" class="q-mr-xs" />
                      Applicant
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewApplicantAccess"
                        label="View"
                        dense
                        color="primary"
                        :disable="!canToggleView('viewApplicantAccess')"
                        @update:model-value="() => onViewToggle('viewApplicantAccess')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyApplicantAccess"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyApplicantAccess')"
                      />
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.reportApplicantAccess"
                        label="Report"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('reportApplicantAccess')"
                      />
                    </div>
                  </div>

                  <!-- Advance Appointment -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="event_note" size="14px" class="q-mr-xs" />
                      Advance Appointment
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewAdvanceAppointmentAccess"
                        label="View"
                        dense
                        color="primary"
                        :disable="!canToggleView('viewAdvanceAppointmentAccess')"
                        @update:model-value="() => onViewToggle('viewAdvanceAppointmentAccess')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyAdvanceAppointmentAccess"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyAdvanceAppointmentAccess')"
                      />
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.reportAdvanceAppointmentAccess"
                        label="Report"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('reportAdvanceAppointmentAccess')"
                      />
                    </div>
                  </div>

                  <!-- Placement (NEW) -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="assignment" size="14px" class="q-mr-xs" />
                      Placement
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewPlacementAccess"
                        label="View"
                        dense
                        color="primary"
                        :disable="!canToggleView('viewPlacementAccess')"
                        @update:model-value="() => onViewToggle('viewPlacementAccess')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyPlacementAccess"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyPlacementAccess')"
                      />
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.reportPlacementAccess"
                        label="Report"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('reportPlacementAccess')"
                      />
                    </div>
                  </div>

                  <!-- Library -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="library_books" size="14px" class="q-mr-xs" />
                      Library
                    </div>
                    <div class="perm-row two-col">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewLibraryAccess"
                        label="View Library"
                        dense
                        color="primary"
                        :disable="!canToggleView('viewLibraryAccess')"
                        @update:model-value="() => onViewToggle('viewLibraryAccess')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyLibraryAccess"
                        label="Modify Library"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyLibraryAccess')"
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
                        :disable="!canToggleView('viewSchedule')"
                        @update:model-value="() => onViewToggle('viewSchedule')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifySchedule"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifySchedule')"
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
                        :disable="!canToggleView('viewExam')"
                        @update:model-value="() => onViewToggle('viewExam')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyExam"
                        label="Modify"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyExam')"
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
                        :disable="!canToggleView('viewRater')"
                        @update:model-value="() => onViewToggle('viewRater')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyRater"
                        label="Modify Raters"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyRater')"
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
                        @update:model-value="() => onChildToggle('viewCriteria')"
                      />
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.modifyCriteria"
                        label="Modify Criteria"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('modifyCriteria')"
                      />
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.reportRaterManagementAccess"
                        label="Rater Management Report"
                        dense
                        color="primary"
                        @update:model-value="() => onChildToggle('reportRaterManagementAccess')"
                      />
                    </div>
                  </div>

                  <!-- Reports — standalone, view only -->
                  <div class="perm-group">
                    <div class="perm-group-title">
                      <q-icon name="assessment" size="14px" class="q-mr-xs" />
                      Reports
                    </div>
                    <div class="perm-row">
                      <q-toggle
                        true-value="1"
                        false-value="0"
                        v-model="form.permissions.viewReport"
                        label="View Reports"
                        dense
                        color="primary"
                        @update:model-value="syncSelectAll"
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
                        @update:model-value="syncSelectAll"
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
                        @update:model-value="syncSelectAll"
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

  // ── All permission keys ─────────────────────────────────────────────────────
  const ALL_PERMISSION_KEYS = [
    'viewDashboardstat',
    'viewPlantillaAccess',
    'modifyPlantillaAccess',
    'requestPublication',
    'reportPlantillaAccess',
    'viewJobpostAccess',
    'modifyJobpostAccess',
    'viewApplicantAccess',
    'modifyApplicantAccess',
    'reportApplicantAccess',
    'viewAdvanceAppointmentAccess',
    'modifyAdvanceAppointmentAccess',
    'reportAdvanceAppointmentAccess',
    // Placement permissions
    'viewPlacementAccess',
    'modifyPlacementAccess',
    'reportPlacementAccess',
    'viewLibraryAccess',
    'modifyLibraryAccess',
    'viewSchedule',
    'modifySchedule',
    'viewExam',
    'modifyExam',
    'viewRater',
    'modifyRater',
    'viewCriteria',
    'modifyCriteria',
    'reportRaterManagementAccess',
    'viewReport',
    'userManagement',
    'viewActivityLogs',
  ];

  // ── Child permissions that require their parent "View" permission ───────────
  const CHILD_PERMISSIONS_MAP = {
    modifyPlantillaAccess: 'viewPlantillaAccess',
    requestPublication: 'viewPlantillaAccess',
    reportPlantillaAccess: 'viewPlantillaAccess',
    modifyJobpostAccess: 'viewJobpostAccess',
    modifyApplicantAccess: 'viewApplicantAccess',
    reportApplicantAccess: 'viewApplicantAccess',
    modifyAdvanceAppointmentAccess: 'viewAdvanceAppointmentAccess',
    reportAdvanceAppointmentAccess: 'viewAdvanceAppointmentAccess',
    // Placement child permissions
    modifyPlacementAccess: 'viewPlacementAccess',
    reportPlacementAccess: 'viewPlacementAccess',
    modifyLibraryAccess: 'viewLibraryAccess',
    modifySchedule: 'viewSchedule',
    modifyExam: 'viewExam',
    modifyRater: 'viewRater',
    viewCriteria: 'viewRater',
    modifyCriteria: 'viewRater',
    reportRaterManagementAccess: 'viewRater',
  };

  // ── Get all child permissions for a given view permission ───────────────────
  function getChildPermissionsForView(viewKey) {
    const children = [];
    for (const [child, parent] of Object.entries(CHILD_PERMISSIONS_MAP)) {
      if (parent === viewKey) children.push(child);
    }
    return children;
  }

  // ── Badge color based on role name ──────────────────────────────────────────
  const ROLE_COLORS = ['teal', 'blue', 'green', 'orange', 'pink', 'cyan', 'indigo', 'brown'];

  function hashRoleColor(roleName) {
    if (!roleName) return 'grey';
    if (roleName.toLowerCase() === 'administrator') return 'green';
    let hash = 0;
    for (let i = 0; i < roleName.length; i++) hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
    return ROLE_COLORS[Math.abs(hash) % ROLE_COLORS.length];
  }

  export default defineComponent({
    name: 'UserManagement',
    components: { ButtonResetPassword, ButtonDelete },

    setup() {
      const authStore = useAuthStore();
      const confirmUpdateDialog = ref(false);
      const selectAll = ref(false);

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
        {
          name: 'user_role',
          align: 'left',
          label: 'User Role',
          field: (row) => row.rsp_control?.user_role || '',
          sortable: true,
        },
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

      // ── Badge color helper ───────────────────────────────────────────────────
      function getRoleBadgeColor(roleName) {
        return hashRoleColor(roleName);
      }

      // ── Permission helpers ───────────────────────────────────────────────────
      const defaultPermissions = () => {
        const p = {};
        ALL_PERMISSION_KEYS.forEach((k) => (p[k] = '0'));
        return p;
      };

      function checkAllOn(permissions) {
        return ALL_PERMISSION_KEYS.every((k) => permissions[k] === '1');
      }

      // ── Check if a view permission can be toggled OFF ────────────────────────
      function canToggleView(viewKey) {
        if (form.value.permissions[viewKey] === '1') {
          const children = getChildPermissionsForView(viewKey);
          const hasChildOn = children.some((child) => form.value.permissions[child] === '1');
          if (hasChildOn) return false;
        }
        return true;
      }

      // ── Handle View toggle ───────────────────────────────────────────────────
      function onViewToggle(viewKey) {
        if (form.value.permissions[viewKey] === '0' && !canToggleView(viewKey)) {
          form.value.permissions[viewKey] = '1';
        }
        syncSelectAll();
      }

      // ── Form state ───────────────────────────────────────────────────────────
      const dialog = ref(false);
      const isEditing = ref(false);
      const form = ref({
        name: '',
        username: '',
        position: '',
        user_role: '',
        password: '',
        active: true,
        permissions: defaultPermissions(),
      });

      // ── Handle Child toggle — auto-enable parent View permission ─────────────
      function onChildToggle(childKey) {
        const parentKey = CHILD_PERMISSIONS_MAP[childKey];
        if (parentKey && form.value.permissions[childKey] === '1') {
          form.value.permissions[parentKey] = '1';
        }
        syncSelectAll();
      }

      // ── Select All toggle ────────────────────────────────────────────────────
      function onSelectAllToggle(val) {
        const newVal = val ? '1' : '0';
        ALL_PERMISSION_KEYS.forEach((k) => {
          form.value.permissions[k] = newVal;
        });
        form.value.user_role = val ? 'Administrator' : '';
      }

      // Keep selectAll in sync when individual toggles change
      function syncSelectAll() {
        selectAll.value = checkAllOn(form.value.permissions);
        if (selectAll.value) {
          form.value.user_role = 'Administrator';
        } else if (form.value.user_role === 'Administrator') {
          form.value.user_role = '';
        }
      }

      // ── Role input handler ───────────────────────────────────────────────────
      function onRoleInput() {
        selectAll.value = checkAllOn(form.value.permissions);
      }

      function clearRole() {
        form.value.user_role = '';
        selectAll.value = checkAllOn(form.value.permissions);
      }

      // ── Reset ────────────────────────────────────────────────────────────────
      const resetForm = () => {
        form.value = {
          name: '',
          username: '',
          position: '',
          user_role: '',
          password: '',
          active: true,
          permissions: defaultPermissions(),
        };
        selectAll.value = false;
        authStore.errors = {};
      };

      // ── Open dialogs ─────────────────────────────────────────────────────────
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
        const permissions = {
          viewDashboardstat: p.viewDashboardstat || '0',
          viewPlantillaAccess: p.viewPlantillaAccess || '0',
          modifyPlantillaAccess: p.modifyPlantillaAccess || '0',
          requestPublication: p.requestPublication || '0',
          reportPlantillaAccess: p.reportPlantillaAccess || '0',
          viewJobpostAccess: p.viewJobpostAccess || '0',
          modifyJobpostAccess: p.modifyJobpostAccess || '0',
          viewApplicantAccess: p.viewApplicantAccess || '0',
          modifyApplicantAccess: p.modifyApplicantAccess || '0',
          reportApplicantAccess: p.reportApplicantAccess || '0',
          viewAdvanceAppointmentAccess: p.viewAdvanceAppointmentAccess || '0',
          modifyAdvanceAppointmentAccess: p.modifyAdvanceAppointmentAccess || '0',
          reportAdvanceAppointmentAccess: p.reportAdvanceAppointmentAccess || '0',
          // Placement permissions
          viewPlacementAccess: p.viewPlacementAccess || '0',
          modifyPlacementAccess: p.modifyPlacementAccess || '0',
          reportPlacementAccess: p.reportPlacementAccess || '0',
          viewLibraryAccess: p.viewLibraryAccess || '0',
          modifyLibraryAccess: p.modifyLibraryAccess || '0',
          viewSchedule: p.viewSchedule || '0',
          modifySchedule: p.modifySchedule || '0',
          viewExam: p.viewExam || '0',
          modifyExam: p.modifyExam || '0',
          viewRater: p.viewRater || '0',
          modifyRater: p.modifyRater || '0',
          viewCriteria: p.viewCriteria || '0',
          modifyCriteria: p.modifyCriteria || '0',
          reportRaterManagementAccess: p.reportRaterManagementAccess || '0',
          viewReport: p.viewReport || '0',
          userManagement: p.userManagement || '0',
          viewActivityLogs: p.viewActivityLogs || '0',
        };

        const allOn = checkAllOn(permissions);

        form.value = {
          id: user.id,
          name: user.name,
          username: user.username,
          position: user.position,
          user_role: allOn ? 'Administrator' : p.user_role || '',
          password: '',
          active: user.active,
          permissions,
        };

        selectAll.value = allOn;
      };

      // ── Submit ───────────────────────────────────────────────────────────────
      const submitForm = async () => {
        const userData = {
          ...form.value,
          permissions: {
            ...form.value.permissions,
            user_role: form.value.user_role || '',
          },
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
        await authStore.getAllUsers();
      });

      return {
        authStore,
        confirmUpdateDialog,
        selectAll,
        filter,
        pagination,
        columns,
        dialog,
        isEditing,
        form,
        getRoleBadgeColor,
        onRoleInput,
        clearRole,
        onSelectAllToggle,
        syncSelectAll,
        onChildToggle,
        onViewToggle,
        canToggleView,
        openAddDialog,
        openEditDialog,
        submitForm,
      };
    },
  });
</script>

<style scoped>
  /* ── Table wrapper ── */
  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

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

  /* ── Panels ── */
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

  /* ── Select All Row ── */
  .select-all-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #e5f5e9;
    border: 1px solid #93d8ac;
    border-radius: 8px;
  }

  .select-all-left {
    display: flex;
    align-items: center;
  }

  /* ── Permissions scroll ── */
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

  /* ── Role badge in table ── */
  .role-badge {
    font-size: 11px;
    padding: 4px 8px;
  }
</style>
