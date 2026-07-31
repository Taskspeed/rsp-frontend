const routes = [
  // Admin Login Route
  {
    path: '/admin/login',
    name: 'Admin Login',
    meta: { guest: true, role: 'admin' },
    component: () => import('pages/admin/LogIn.vue'),
  },

  // Admin Routes with Permission Guards
  {
    path: '/admin',
    component: () => import('layouts/MainLayout.vue'),
    name: 'Admin',
    meta: { auth: true, role: 'admin' },
    children: [
      {
        path: '/dashboard',
        name: 'Admin Dashboard',
        component: () => import('pages/admin/DashboardPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
        },
      },
      {
        path: '/job-post',
        name: 'Admin JobPost',
        component: () => import('pages/admin/JobPostPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewJobpostAccess'],
        },
      },
      {
        path: '/admin/application/:id',
        name: 'Manual Application',
        component: () => import('pages/admin/AdminApplication.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['modifyJobpostAccess'],
        },
      },
      {
        path: '/applicant',
        name: 'Applicant List',
        component: () => import('pages/admin/ApplicantPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewApplicantAccess'],
        },
      },
      {
        path: '/schedule',
        name: 'Schedule List',
        component: () => import('pages/admin/SchedulePage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewSchedule'],
        },
      },
      {
        path: '/exam-score',
        name: 'Exam Score List',
        component: () => import('pages/admin/ExamScore.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewExam'],
        },
      },
      {
        path: '/library',
        name: 'Library Page',
        component: () => import('pages/admin/LibraryPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewLibraryAccess'],
        },
      },
      {
        path: '/placement',
        name: 'Placement Page',
        component: () => import('pages/admin/PersonnelPlacement.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewPlacementAccess'],
        },
      },
      {
        path: '/plantilla',
        name: 'Admin Plantilla',
        component: () => import('pages/admin/PlantillaPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewPlantillaAccess'],
        },
      },
      {
        path: '/advance-appointment',
        name: 'Advance Appointment',
        component: () => import('pages/admin/AdvanceAppointment.vue'),
        meta: {
          auth: true,
          role: 'admin',
        },
      },
      {
        path: '/raters',
        name: 'Admin Raters',
        component: () => import('pages/admin/RatersPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewRater'],
        },
      },
      {
        path: '/reports',
        name: 'Admin Report Raters',
        component: () => import('src/pages/admin/ReportsPage.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewReport'],
        },
      },
      {
        path: '/activity-log',
        name: 'Admin Activity Log',
        component: () => import('pages/admin/ActivityLog.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewActivityLogs'],
        },
      },
      {
        path: '/user-access',
        name: 'Admin User Management',
        component: () => import('pages/admin/UserManagement.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['userManagement'],
        },
      },
      {
        path: '/criteria',
        name: 'Admin Raters Criteria',
        component: () => import('pages/admin/CriteriaRater.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewCriteria'],
        },
      },
      {
        path: '/criteria/sg',
        name: 'SG Criteria',
        component: () => import('pages/admin/CriteriaSG.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewCriteria'],
        },
      },
      {
        path: '/settings',
        name: 'Admin Settings',
        component: () => import('pages/admin/SettingPage.vue'),
        meta: { auth: true, role: 'admin' },
      },
      {
        path: '/job-post/view/:id',
        name: 'JobPost View',
        component: () => import('pages/admin/job_post/ViewJobDetails.vue'),
        meta: {
          auth: true,
          role: 'admin',
          permissions: ['viewJobpostAccess'],
        },
      },
    ],
  },

  // PDF report route (Admin only)
  {
    path: '/rater-management/reports/appointment-pdf',
    name: 'Appointment PDF',
    component: () => import('pages/admin/job_post/AppointmentPDF.vue'),
    meta: {
      auth: true,
      role: 'admin',
      permissions: ['viewReport'],
    },
  },

  // Rater Routes
  {
    path: '/rater/login',
    name: 'Rater Login',
    meta: { guest: true, role: 'rater' },
    component: () => import('pages/rater/LoginRaterPage.vue'),
  },
  {
    path: '/uRater',
    component: () => import('layouts/RatersLayout.vue'),
    meta: { auth: true, role: 'rater' },
    children: [
      {
        path: '',
        name: 'Raters Homepage',
        meta: { auth: true, role: 'rater' },
        component: () => import('pages/rater/RatersHomepage.vue'),
      },
      {
        path: '/uCriteria',
        name: 'Raters Criteria',
        meta: { auth: true, role: 'rater' },
        component: () => import('pages/rater/RatersCriteria.vue'),
      },
      {
        path: '/uApplicant',
        name: 'Raters Applicant',
        meta: { auth: true, role: 'rater' },
        component: () => import('pages/rater/ApplicantRaterPage.vue'),
      },
      {
        path: '/rater/settings',
        name: 'rater Settings',
        component: () => import('../components/Rater/Settings.vue'),
        meta: { auth: true, role: 'rater' },
      },
    ],
  },

  // User Routes with PDS protection
  {
    path: '/',
    name: 'Email',
    component: () => import('pages/user/UserLogin.vue'),
    meta: { guest: true, role: 'user' },
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('pages/user/TermsPage.vue'),
    meta: { guest: true, role: 'user' },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('pages/user/PrivacyPolicyPage.vue'),
    meta: { guest: true, role: 'user' },
  },
  {
    path: '/home',
    component: () => import('layouts/UserMainLayout.vue'),
    meta: { auth: true, role: 'user' },
    children: [
      {
        path: '/form',
        name: 'PDSForm',
        component: () => import('pages/user/UserPDSForm.vue'),
        meta: {
          auth: true,
          role: 'user',
          requiresPDS: false, // PDSForm doesn't require PDS (it's where you create it)
        },
      },
      {
        path: '/page',
        name: 'Homepage',
        component: () => import('pages/user/UserHomePage.vue'),
        meta: {
          auth: true,
          role: 'user',
          requiresPDS: true, // Requires PDS
        },
      },
      {
        path: 'jobList',
        name: 'Joblist',
        component: () => import('pages/user/UserJobList.vue'),
        meta: {
          auth: true,
          role: 'user',
          requiresPDS: true, // Requires PDS
        },
      },
      {
        path: 'account',
        name: 'Account',
        component: () => import('pages/user/UserAccountPage.vue'),
        meta: {
          auth: true,
          role: 'user',
          requiresPDS: true, // Requires PDS
        },
      },
      {
        path: '/pds',
        name: 'UserPDS',
        component: () => import('pages/user/UserPDSPage.vue'),
        meta: {
          auth: true,
          role: 'user',
          requiresPDS: true,
        },
      },
      {
        path: '/jobList/details/:id',
        name: 'Joblist Details',
        component: () => import('pages/user/ViewJobDetails.vue'),
        meta: {
          auth: true,
          role: 'user',
          requiresPDS: true, // Requires PDS
        },
      },
    ],
  },

  // Catch all route - redirect to dashboard
  {
    path: '/:catchAll(.*)*',
    redirect: '/dashboard',
  },
];

export default routes;
