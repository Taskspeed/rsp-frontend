<template>
  <q-drawer show-if-above v-model="drawer" side="left" :width="230" bordered>
    <!-- Logo Section -->
    <div class="logo-container">
      <q-img src="/logo.png" width="130px" />
    </div>

    <!-- Header Section -->
    <div class="header-container"></div>

    <q-list dense>
      <!-- ================================================================ -->
      <!-- TOP-LEVEL MENU ITEMS                                             -->
      <!-- ================================================================ -->
      <q-item
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        v-for="(item, index) in filteredMenuItems"
        :key="index"
        clickable
        v-ripple
        :to="item.route"
        :active-class="'active-menu'"
      >
        <q-item-section avatar>
          <q-icon :name="item.icon" size="sm" />
        </q-item-section>
        <q-item-section>{{ item.label }}</q-item-section>
      </q-item>

      <!-- ================================================================ -->
      <!-- EXAM SCORE — standalone, guarded by viewExam / modifyExam        -->
      <!-- ================================================================ -->
      <!-- <q-item
        v-if="hasExamAccess"
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        clickable
        v-ripple
        to="/exam-score"
        active-class="active-menu"
      >
        <q-item-section avatar>
          <q-icon name="grading" size="sm" />
        </q-item-section>
        <q-item-section>Exam Score</q-item-section>
      </q-item> -->

      <q-item
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        clickable
        v-ripple
        to="/exam-score"
        active-class="active-menu"
      >
        <q-item-section avatar>
          <q-icon name="grading" size="sm" />
        </q-item-section>
        <q-item-section>Exam Score</q-item-section>
      </q-item>

      <!-- ================================================================ -->
      <!-- SCHEDULE — standalone, guarded by viewSchedule / modifySchedule  -->
      <!-- ================================================================ -->
      <!-- <q-item
        v-if="hasScheduleAccess"
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        clickable
        v-ripple
        to="/schedule"
        active-class="active-menu"
      >
        <q-item-section avatar>
          <q-icon name="event" size="sm" />
        </q-item-section>
        <q-item-section>Schedule</q-item-section>
      </q-item> -->

      <q-item
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        clickable
        v-ripple
        to="/schedule"
        active-class="active-menu"
      >
        <q-item-section avatar>
          <q-icon name="event" size="sm" />
        </q-item-section>
        <q-item-section>Schedule</q-item-section>
      </q-item>

      <!-- ================================================================ -->
      <!-- RATER MANAGEMENT — expandable, if permitted                      -->
      <!-- Sub-items: Raters, Criteria, Reports                             -->
      <!-- ================================================================ -->
      <q-expansion-item
        v-if="hasRaterManagementAccess"
        v-model="raterExpanded"
        dense
        style="border-radius: 20px; padding: 0; margin: 0"
        class="q-mx-xs q-my-xs"
        icon="assignment_ind"
        label="Rater Management"
      >
        <q-card class="q-py-none content-container">
          <q-item
            dense
            class="q-mx-xs q-my-xs"
            style="border-radius: 17px; padding: 8px 10px"
            v-for="(item, index) in filteredRatersManage"
            :key="index"
            clickable
            v-ripple
            :to="item.route"
            :active-class="'active-menu'"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" size="sm" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-card>
      </q-expansion-item>

      <!-- ================================================================ -->
      <!-- USER MANAGEMENT — guarded by userManagement permission           -->
      <!-- ================================================================ -->
      <q-item
        v-if="hasUserManagementAccess"
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        clickable
        v-ripple
        to="/user-access"
        active-class="active-menu"
      >
        <q-item-section avatar>
          <q-icon name="manage_accounts" size="sm" />
        </q-item-section>
        <q-item-section>User Management</q-item-section>
      </q-item>

      <!-- ================================================================ -->
      <!-- ACTIVITY LOG — guarded by viewActivityLogs                       -->
      <!-- ================================================================ -->
      <q-item
        v-if="hasActivityLogsAccess"
        dense
        class="q-mx-xs q-my-xs"
        style="border-radius: 17px; padding: 8px 11px"
        clickable
        v-ripple
        to="/activity-log"
        active-class="active-menu"
      >
        <q-item-section avatar>
          <q-icon name="history" size="sm" />
        </q-item-section>
        <q-item-section>Activity Log</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup>
  import { onMounted, ref, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { useAuthStore } from 'stores/authStore';

  const authStore = useAuthStore();
  const route = useRoute();

  const drawer = ref(true);
  const raterExpanded = ref(false);

  // ============================================================================
  // PLANTILLA & JOB POST PERMISSIONS
  // ============================================================================

  const hasPlantillaAccess = computed(
    () =>
      authStore.user?.permissions?.viewPlantillaAccess == '1' ||
      authStore.user?.permissions?.modifyPlantillaAccess == '1',
  );

  const hasJobPostAccess = computed(
    () =>
      authStore.user?.permissions?.viewJobpostAccess == '1' ||
      authStore.user?.permissions?.modifyJobpostAccess == '1',
  );

  // ============================================================================
  // EXAM SCORE PERMISSIONS
  // ============================================================================

  // const hasExamAccess = computed(
  //   () =>
  //     authStore.user?.permissions?.viewExam === '1' ||
  //     authStore.user?.permissions?.modifyExam === '1',
  // );

  // ============================================================================
  // SCHEDULE PERMISSIONS
  // ============================================================================

  // const hasScheduleAccess = computed(
  //   () =>
  //     authStore.user?.permissions?.viewSchedule === '1' ||
  //     authStore.user?.permissions?.modifySchedule === '1',
  // );

  // ============================================================================
  // RATER MANAGEMENT PERMISSIONS
  // ============================================================================

  const hasRatersAccess = computed(
    () =>
      authStore.user?.permissions?.viewRater === '1' ||
      authStore.user?.permissions?.modifyRater === '1',
  );

  const hasCriteriaAccess = computed(
    () =>
      authStore.user?.permissions?.viewCriteria === '1' ||
      authStore.user?.permissions?.modifyCriteria === '1',
  );

  const hasReportsAccess = computed(() => authStore.user?.permissions?.viewReport === '1');

  /** Show Rater Management expansion if user has access to at least one sub-module */
  const hasRaterManagementAccess = computed(
    () => hasRatersAccess.value || hasCriteriaAccess.value || hasReportsAccess.value,
  );

  // ============================================================================
  // USER MANAGEMENT PERMISSION
  // ============================================================================

  const hasUserManagementAccess = computed(
    () => authStore.user?.permissions?.userManagement === '1',
  );

  // ============================================================================
  // ACTIVITY LOG PERMISSION
  // ============================================================================

  const hasActivityLogsAccess = computed(
    () => authStore.user?.permissions?.viewActivityLogs === '1',
  );

  // ============================================================================
  // TOP-LEVEL MENU ITEMS
  // Order: Dashboard → Plantilla → Job Posts → Applicant
  // Exam Score and Rater Management rendered separately
  // User Management always visible | Activity Log permission-guarded
  // ============================================================================

  const filteredMenuItems = computed(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    ...(hasPlantillaAccess.value
      ? [{ label: 'Plantilla', route: '/plantilla', icon: 'domain' }]
      : []),
    ...(hasJobPostAccess.value
      ? [{ label: 'Job Posts', route: '/job-post', icon: 'post_add' }]
      : []),
    { label: 'Applicant', route: '/applicant', icon: 'group' },
  ]);

  // ============================================================================
  // RATER MANAGEMENT SUB-ITEMS
  // ============================================================================

  const filteredRatersManage = computed(() =>
    [
      { label: 'Raters', route: '/raters', icon: 'groups', permission: hasRatersAccess },
      { label: 'Criteria', route: '/criteria', icon: 'rule', permission: hasCriteriaAccess },
      { label: 'Reports', route: '/reports', icon: 'assessment', permission: hasReportsAccess },
    ].filter((item) => item.permission.value),
  );

  // ============================================================================
  // AUTO-EXPAND ACTIVE SECTION ON MOUNT
  // ============================================================================

  const raterRoutes = ['/raters', '/criteria', '/reports'];

  onMounted(() => {
    const currentRoute = route.path;

    if (raterRoutes.includes(currentRoute)) {
      raterExpanded.value = true;
    }
  });
</script>

<style scoped>
  /* Sidebar expansion sub-list indentation line */
  .content-container {
    border-left: 2px solid rgb(133, 133, 133);
    padding-left: 5px;
    margin-left: 25px;
  }

  /* Logo Section */
  .logo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px 0;
    margin-bottom: 2px;
    margin-top: 40px;
  }

  .logo {
    width: 140px;
    height: auto;
  }

  /* Header Section */
  .header-container {
    text-align: center;
    margin-bottom: 2px !important;
    padding-bottom: 0 !important;
  }

  .company-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 0 !important;
  }

  /* Active menu item highlight */
  .active-menu {
    background-color: #00b034 !important;
    color: white !important;
    font-weight: bold;
  }
</style>
