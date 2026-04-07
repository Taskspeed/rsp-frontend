<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="column items-start justify-center q-mb-md">
      <h5 class="text-h5 q-ma-none"><b>Applicants</b></h5>
    </div>

    <!-- Table Toolbar -->
    <div class="row justify-between items-center q-mb-md">
      <q-input
        v-model="globalSearch"
        outlined
        dense
        placeholder="Search applicants..."
        style="max-width: 500px"
        clearable
      >
        <template #prepend>
          <q-icon name="search" color="primary" />
        </template>
      </q-input>
    </div>

    <!-- Main Table -->
    <q-table
      :rows="applicantStore.applicants"
      :columns="columns"
      row-key="nPersonal_id"
      v-model:pagination="pagination"
      :rows-number="applicantStore.total"
      :loading="applicantStore.loading"
      @request="onRequest"
      :rows-per-page-options="[10, 20, 50, 100, 200]"
      flat
    >
      <template #body-cell-name="p">
        <q-td :props="p">
          {{ p.row.n_personal_info?.firstname || p.row.firstname || '' }}
          {{ p.row.n_personal_info?.lastname || p.row.lastname || '' }}
        </q-td>
      </template>

      <template #body-cell-jobpost="p">
        <q-td :props="p">{{ getJobPostCount(p.row) }}</q-td>
      </template>

      <template #body-cell-action="p">
        <q-td :props="p">
          <q-btn
            round
            flat
            color="blue"
            icon="visibility"
            @click="viewApplicant(p.row)"
            class="bg-blue-1"
          >
            <q-tooltip>View Applicant</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width row flex-center q-pa-md text-grey">No Applicants Found</div>
      </template>
    </q-table>

    <!-- ================================================================ -->
    <!-- Applicant Details Dialog                                         -->
    <!-- ================================================================ -->
    <q-dialog v-model="showDetailDialog" persistent maximized-mobile>
      <q-card class="detail-dialog-card">
        <!-- Header -->
        <q-card-section class="dialog-header header-view">
          <div class="row items-center no-wrap">
            <q-icon name="person" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-bold">Applicant Details</div>
              <div class="text-caption opacity-80">Viewing full applicant information</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="close-btn" v-close-popup color="white" />
        </q-card-section>

        <q-separator />

        <!-- Loading -->
        <q-card-section v-if="loadingApplicantDetails" class="text-center q-pa-xl">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-sm text-body2 text-grey-6">Loading applicant details...</div>
        </q-card-section>

        <!-- Content -->
        <q-card-section
          v-else-if="selectedApplicant"
          class="dialog-body q-pa-lg"
          style="overflow-y: auto; max-height: 65vh"
        >
          <!-- Personal Information -->
          <div class="section-label q-mb-md">
            <q-icon name="person" size="16px" class="q-mr-xs" />
            Personal Information
          </div>

          <div class="info-group q-mb-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">First Name</div>
                  <div class="info-value">
                    {{
                      selectedApplicant.n_personal_info?.firstname ||
                      selectedApplicant.firstname ||
                      'N/A'
                    }}
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Last Name</div>
                  <div class="info-value">
                    {{
                      selectedApplicant.n_personal_info?.lastname ||
                      selectedApplicant.lastname ||
                      'N/A'
                    }}
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Date of Birth</div>
                  <div class="info-value">
                    {{
                      selectedApplicant.n_personal_info?.date_of_birth ||
                      selectedApplicant.date_of_birth ||
                      'N/A'
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div
            v-if="selectedApplicant.email || selectedApplicant.phone || selectedApplicant.address"
          >
            <div class="section-label q-mb-md">
              <q-icon name="contact_mail" size="16px" class="q-mr-xs" />
              Contact Information
            </div>
            <div class="info-group q-mb-lg">
              <div class="row q-col-gutter-md">
                <div v-if="selectedApplicant.email" class="col-12 col-md-4">
                  <div class="info-field">
                    <div class="info-label">Email</div>
                    <div class="info-value">
                      <q-icon name="email" size="xs" class="q-mr-xs" />
                      {{ selectedApplicant.email }}
                    </div>
                  </div>
                </div>
                <div v-if="selectedApplicant.phone" class="col-12 col-md-4">
                  <div class="info-field">
                    <div class="info-label">Phone</div>
                    <div class="info-value">
                      <q-icon name="phone" size="xs" class="q-mr-xs" />
                      {{ selectedApplicant.phone }}
                    </div>
                  </div>
                </div>
                <div v-if="selectedApplicant.address" class="col-12 col-md-4">
                  <div class="info-field">
                    <div class="info-label">Address</div>
                    <div class="info-value">
                      <q-icon name="home" size="xs" class="q-mr-xs" />
                      {{ selectedApplicant.address }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Job Applications -->
          <div class="section-label q-mb-md">
            <q-icon name="work" size="16px" class="q-mr-xs" />
            Job Applications
            <q-badge
              color="orange"
              :label="`${applicantJobRows.length} Position(s)`"
              class="q-ml-sm"
            />
          </div>

          <q-table
            :rows="applicantJobRows"
            :columns="jobColumns"
            row-key="id"
            flat
            bordered
            hide-bottom
            no-data-label="No job applications found"
          >
            <template #body-cell-status="p">
              <q-td :props="p">
                <q-badge
                  :color="getJobStatusColor(p.row.status)"
                  :label="p.row.status ? p.row.status.toUpperCase() : 'N/A'"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-separator />
        <div class="dialog-footer row justify-end items-center q-pa-md">
          <q-btn rounded flat label="Close" color="grey-7" v-close-popup />
        </div>
      </q-card>
    </q-dialog>

    <!-- ================================================================ -->
    <!-- Qualified Report Modal                                           -->
    <!-- ================================================================ -->
    <q-dialog v-model="showQualifiedModal" persistent>
      <q-card class="report-select-card">
        <q-card-section class="dialog-header header-add">
          <div class="row items-center no-wrap">
            <q-icon name="article" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-bold">Qualified Applicants Report</div>
              <div class="text-caption opacity-80">Select a publication date to generate</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="close-btn" @click="closeQualifiedModal" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-lg">
          <div v-if="loadingPublicationDates" class="text-center q-pa-md">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm text-grey-6">Loading publication dates...</div>
          </div>
          <div v-else>
            <div class="section-label q-mb-md">
              <q-icon name="event" size="16px" class="q-mr-xs" />
              Publication Date
            </div>
            <q-select
              v-model="selectedQualifiedPublicationDate"
              :options="filteredQualifiedPublicationDateOptions"
              label="Select Publication Date"
              outlined
              dense
              use-input
              input-debounce="300"
              @filter="filterQualifiedPublicationDates"
            >
              <template v-slot:no-option>
                <q-item><q-item-section class="text-grey">No dates found</q-item-section></q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>
                      <q-icon name="event" size="xs" class="q-mr-sm" />
                      {{ scope.opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:selected>
                <span v-if="selectedQualifiedPublicationDate">
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ selectedQualifiedPublicationDate }}
                </span>
              </template>
            </q-select>
            <div v-if="publicationDateOptions.length === 0" class="q-mt-sm text-caption text-grey">
              No publication dates available
            </div>
          </div>
        </q-card-section>

        <q-separator />
        <div class="dialog-footer row justify-end items-center q-pa-md q-gutter-sm">
          <q-btn rounded flat label="Cancel" color="grey-7" @click="closeQualifiedModal" />
          <q-btn
            rounded
            unelevated
            color="primary"
            label="Generate Report"
            icon="print"
            :disable="!selectedQualifiedPublicationDate"
            @click="generateQualifiedReport"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- ================================================================ -->
    <!-- Unqualified Report Modal                                         -->
    <!-- ================================================================ -->
    <q-dialog v-model="showUnqualifiedModal" persistent>
      <q-card class="report-select-card">
        <q-card-section class="dialog-header header-edit">
          <div class="row items-center no-wrap">
            <q-icon name="article" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-bold">Unqualified Applicants Report</div>
              <div class="text-caption opacity-80">Select a publication date to generate</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="close-btn" @click="closeUnqualifiedModal" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-lg">
          <div v-if="loadingPublicationDates" class="text-center q-pa-md">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm text-grey-6">Loading publication dates...</div>
          </div>
          <div v-else>
            <div class="section-label q-mb-md">
              <q-icon name="event" size="16px" class="q-mr-xs" />
              Publication Date
            </div>
            <q-select
              v-model="selectedUnqualifiedPublicationDate"
              :options="filteredUnqualifiedPublicationDateOptions"
              label="Select Publication Date"
              outlined
              dense
              use-input
              input-debounce="300"
              @filter="filterUnqualifiedPublicationDates"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>
                      <q-icon name="event" size="xs" class="q-mr-sm" />
                      {{ scope.opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:selected>
                <span v-if="selectedUnqualifiedPublicationDate">
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ selectedUnqualifiedPublicationDate }}
                </span>
              </template>
            </q-select>
            <div v-if="publicationDateOptions.length === 0" class="q-mt-sm text-caption text-grey">
              No publication dates available
            </div>
          </div>
        </q-card-section>

        <q-separator />
        <div class="dialog-footer row justify-end items-center q-pa-md q-gutter-sm">
          <q-btn rounded flat label="Cancel" color="grey-7" @click="closeUnqualifiedModal" />
          <q-btn
            rounded
            unelevated
            color="primary"
            label="Generate Report"
            icon="print"
            :disable="!selectedUnqualifiedPublicationDate"
            @click="generateUnqualifiedReport"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Report sub-dialogs (unchanged) -->
    <q-dialog v-model="showQualifiedReportDialog" persistent>
      <QualifiedReport :publicationDate="selectedQualifiedPublicationDate" />
    </q-dialog>
    <q-dialog v-model="showUnqualifiedReportDialog" persistent>
      <UnqualifiedReport :publicationDate="selectedUnqualifiedPublicationDate" />
    </q-dialog>
    <q-dialog v-model="showPrintDialog" persistent>
      <ApplicantReport
        :filterType="dateFilterType"
        :singleDate="singleDate"
        :dateRange="dateRange"
        :positions="selectedPositions"
      />
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import ApplicantReport from 'src/components/Reports/ApplicantReport.vue';
  import QualifiedReport from 'src/components/Reports/QualifiedReport.vue';
  import UnqualifiedReport from 'src/components/Reports/UnqualifiedReport.vue';
  import { useApplicantStore } from 'stores/applicantStore';
  // import { useReportStore } from 'stores/reportStore';
  import { useQuasar } from 'quasar';

  let searchTimeout = null;
  const applicantStore = useApplicantStore();
  // const reportStore = useReportStore();
  const $q = useQuasar();

  const globalSearch = ref('');
  // const showReportModal = ref(false);
  const showDetailDialog = ref(false);
  const selectedApplicant = ref(null);
  const loadingApplicantDetails = ref(false);
  const dateFilterType = ref('single');
  const singleDate = ref('');
  const dateRange = ref({ from: '', to: '' });
  // const showDatePicker = ref(false);
  // const showFromPicker = ref(false);
  // const showToPicker = ref(false);
  const selectedPositions = ref([]);
  const showPrintDialog = ref(false);

  const showQualifiedModal = ref(false);
  const selectedQualifiedPublicationDate = ref(null);
  const filteredQualifiedPublicationDateOptions = ref([]);
  const showQualifiedReportDialog = ref(false);

  const showUnqualifiedModal = ref(false);
  const selectedUnqualifiedPublicationDate = ref(null);
  const filteredUnqualifiedPublicationDateOptions = ref([]);
  const showUnqualifiedReportDialog = ref(false);

  const loadingPublicationDates = ref(false);
  const publicationDateOptions = ref([]);

  const pagination = ref({
    sortBy: 'name',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });

  const getJobPostCount = (applicant) => {
    if (Array.isArray(applicant.job_post)) return applicant.job_post.length;
    if (applicant.job_post) return 1;
    if (applicant.jobpost !== undefined) return applicant.jobpost;
    return 0;
  };

  const getApplicantJobPosts = (applicant) => {
    if (!applicant) return [];
    if (Array.isArray(applicant.job_post)) return applicant.job_post;
    if (applicant.job_post) return [applicant.job_post];
    return [];
  };

  const getJobStatusColor = (status) => {
    if (!status) return 'grey';
    const s = status.toLowerCase();
    if (s === 'not started') return 'grey';
    if (s === 'ongoing') return 'blue';
    if (s === 'completed' || s === 'finished') return 'green';
    return 'orange';
  };

  const columns = computed(() => [
    { name: 'name', label: 'Name', align: 'left', field: 'name', sortable: true },
    {
      name: 'jobpost',
      label: 'No. of Applied Position',
      align: 'center',
      field: 'jobpost',
      sortable: true,
    },
    { name: 'action', label: 'Action', align: 'center', field: 'action', sortable: false },
  ]);

  const jobColumns = [
    { name: 'id', label: 'ID', field: 'id', align: 'left' },
    { name: 'office', label: 'Office', field: 'office', align: 'left' },
    { name: 'position', label: 'Position', field: 'position', align: 'left' },
    { name: 'status', label: 'Status', field: 'status', align: 'left' },
  ];

  const applicantJobRows = computed(() => {
    if (!selectedApplicant.value) return [];
    return getApplicantJobPosts(selectedApplicant.value).map((job, idx) => ({
      id: job.id ?? job.jobpost_id ?? idx + 1,
      office: job.Office || job.office || 'N/A',
      position: job.Position || job.position || 'N/A',
      status: job.status || selectedApplicant.value.status || 'N/A',
    }));
  });

  const onRequest = async (props) => {
    const { page, rowsPerPage } = props.pagination;
    await applicantStore.fetchApplicants({
      page,
      perPage: rowsPerPage,
      search: globalSearch.value,
    });
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.rowsNumber = applicantStore.total;
  };

  watch(globalSearch, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      pagination.value.page = 1;
      await applicantStore.fetchApplicants({
        page: 1,
        perPage: pagination.value.rowsPerPage,
        search: newValue,
      });
      pagination.value.rowsNumber = applicantStore.total;
    }, 500);
  });

  // const filteredPositions = computed(() => {
  //   let positions = reportStore.report || [];
  //   if (dateFilterType.value === 'single' && singleDate.value) {
  //     positions = positions.filter((pos) => {
  //       const p = pos.post_date?.slice(0, 10),
  //         e = pos.end_date?.slice(0, 10);
  //       return singleDate.value >= p && singleDate.value <= e;
  //     });
  //   } else if (dateFilterType.value === 'range' && dateRange.value.from && dateRange.value.to) {
  //     positions = positions.filter((pos) => {
  //       const p = pos.post_date?.slice(0, 10),
  //         e = pos.end_date?.slice(0, 10);
  //       return !(dateRange.value.to < p || dateRange.value.from > e);
  //     });
  //   }
  //   return positions.map((pos) => ({ value: pos.id, label: pos.Position }));
  // });

  // const positionOptions = computed(() =>
  //   filteredPositions.value.length
  //     ? [{ value: 'select_all', label: 'Select All' }, ...filteredPositions.value]
  //     : [],
  // );

  // const allSelected = computed(() => {
  //   const ids = filteredPositions.value.map((o) => o.value);
  //   return ids.length > 0 && ids.every((id) => selectedPositions.value.includes(id));
  // });

  const filterQualifiedPublicationDates = (val, update) => {
    update(() => {
      const needle = val.toLowerCase();
      filteredQualifiedPublicationDateOptions.value = publicationDateOptions.value.filter((v) =>
        v.toLowerCase().includes(needle),
      );
    });
  };

  const filterUnqualifiedPublicationDates = (val, update) => {
    update(() => {
      const needle = val.toLowerCase();
      filteredUnqualifiedPublicationDateOptions.value = publicationDateOptions.value.filter((v) =>
        v.toLowerCase().includes(needle),
      );
    });
  };

  const closeQualifiedModal = () => {
    showQualifiedModal.value = false;
    selectedQualifiedPublicationDate.value = null;
  };
  const closeUnqualifiedModal = () => {
    showUnqualifiedModal.value = false;
    selectedUnqualifiedPublicationDate.value = null;
  };

  const generateQualifiedReport = () => {
    showQualifiedModal.value = false;
    showQualifiedReportDialog.value = true;
  };
  const generateUnqualifiedReport = () => {
    showUnqualifiedModal.value = false;
    showUnqualifiedReportDialog.value = true;
  };

  const viewApplicant = async (applicant) => {
    selectedApplicant.value = applicant;
    showDetailDialog.value = true;
    loadingApplicantDetails.value = true;
    try {
      const firstname = applicant.n_personal_info?.firstname || applicant.firstname;
      const lastname = applicant.n_personal_info?.lastname || applicant.lastname;
      const dob = applicant.n_personal_info?.date_of_birth || applicant.date_of_birth;
      const details = await applicantStore.fetchApplicantDetail(firstname, lastname, dob);
      selectedApplicant.value = { ...applicant, ...details };
    } catch {
      $q.notify({ type: 'negative', message: 'Failed to load applicant details' });
    } finally {
      loadingApplicantDetails.value = false;
    }
  };

  // const toggleSelectAll = () => {
  //   const ids = filteredPositions.value.map((o) => o.value);
  //   selectedPositions.value = allSelected.value ? [] : ids.slice();
  // };

  // const togglePosition = (val) => {
  //   if (val === 'select_all') return;
  //   selectedPositions.value = selectedPositions.value.includes(val)
  //     ? selectedPositions.value.filter((x) => x !== val)
  //     : [...selectedPositions.value, val];
  // };

  // const generateReport = () => {
  //   showReportModal.value = false;
  //   showPrintDialog.value = true;
  // };

  onMounted(async () => {
    await applicantStore.fetchApplicants({
      page: 1,
      perPage: pagination.value.rowsPerPage,
      search: '',
    });
    pagination.value.rowsNumber = applicantStore.total;
  });
</script>

<style scoped>
  /* ── Dialog Card ── */
  .detail-dialog-card,
  .report-select-card {
    width: 90vw;
    max-width: 860px;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }
  .report-select-card {
    max-width: 480px;
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
  .header-view {
    background: #1565c0;
  }
  .close-btn {
    color: rgba(255, 255, 255, 0.8);
  }
  .close-btn:hover {
    color: white;
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

  /* ── Info Fields ── */
  .info-group {
    border: 1px solid #eeeeee;
    border-radius: 8px;
    padding: 16px;
    background: #fafafa;
  }
  .info-field {
    padding: 4px 0;
  }
  .info-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #9e9e9e;
    margin-bottom: 2px;
  }
  .info-value {
    font-size: 14px;
    font-weight: 500;
    color: #212121;
  }

  /* ── Footer ── */
  .dialog-footer {
    flex-shrink: 0;
    background: #fafafa;
  }
</style>
