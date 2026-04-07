<template>
  <div class="positions-table-container q-pa-md">
    <h6 class="q-my-md text-weight-bold">Positions to Rate</h6>

    <!-- Search and filter -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input v-model="search" outlined dense placeholder="Search positions..." clearable>
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="officeFilter"
          :options="officeOptions"
          outlined
          dense
          label="Filter by Office"
          clearable
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined
          dense
          label="Status"
          clearable
          emit-value
          map-options
        />
      </div>
    </div>

    <q-table
      :rows="filteredPositions"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      binary-state-sort
      flat
      bordered
      wrap-cells
      class="full-width"
      row-key="id"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <div class="row justify-center q-gutter-xs">
            <q-btn
              v-if="!props.row.submitted"
              dense
              flat
              round
              color="primary"
              icon="rate_review"
              size="md"
              class="action-btn"
              @click="openRatingModal(props.row)"
            >
              <q-tooltip>Rate</q-tooltip>
            </q-btn>

            <q-btn
              v-else
              dense
              flat
              round
              color="info"
              icon="visibility"
              size="md"
              class="action-btn"
              @click="openViewRatedModal(props.row)"
            >
              <q-tooltip>View</q-tooltip>
            </q-btn>

            <q-btn
              v-if="props.row.submitted"
              dense
              flat
              round
              color="secondary"
              icon="print"
              size="md"
              class="action-btn"
              @click="openPrintModal(props.row)"
            >
              <q-tooltip>Print</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center q-pa-lg">
          <q-icon name="assignment" size="3em" color="grey-5" />
          <span class="q-ml-sm">No positions found</span>
        </div>
      </template>
    </q-table>

    <RatingForm
      v-model="showRatingModal"
      :position="selectedPosition"
      :criteria="positionCriteria"
      :raw-criteria="rawCriteria"
      :applicants="positionApplicants"
      :loading="loadingModalData"
      @submit-ratings="handleRatingsSubmit"
      @save-draft="saveDraft"
      @close="handleRatingModalClose"
    />

    <ViewRated
      v-model="showViewRatedModal"
      :position="selectedPosition"
      :criteria="positionCriteria"
      :raw-criteria="rawCriteria"
      :applicants="positionApplicants"
      :loading="loadingModalData"
      @close="handleViewRatedModalClose"
    />

    <PrintRatedModal
      v-model="showPrintModal"
      :job-batches-rsp-id="selectedPosition.job_batches_rsp_id || selectedPosition.id"
      @close="handlePrintModalClose"
    />
  </div>
</template>

<script>
  import { ref, computed, onMounted } from 'vue';
  import { use_rater_store } from 'stores/rater_store';
  import { storeToRefs } from 'pinia';
  import { useQuasar } from 'quasar';
  import RatingForm from 'components/RatingForm.vue';
  import ViewRated from 'components/ViewRatedModal.vue';
  import PrintRatedModal from 'components/Reports/RatingFormReport.vue';

  export default {
    name: 'PositionsTable',
    components: {
      RatingForm,
      ViewRated,
      PrintRatedModal,
    },
    setup() {
      const $q = useQuasar();
      const raterStore = use_rater_store();
      const { assignedJobs, loading } = storeToRefs(raterStore);

      const search = ref('');
      const officeFilter = ref(null);
      const statusFilter = ref(null);

      const pagination = ref({ rowsPerPage: 10 });

      const showRatingModal = ref(false);
      const showViewRatedModal = ref(false);
      const showPrintModal = ref(false);
      const selectedPosition = ref({});
      const positionCriteria = ref({});
      const rawCriteria = ref(null);
      const positionApplicants = ref([]);
      const loadingModalData = ref(false);

      const columns = [
        {
          name: 'office',
          label: 'Office',
          field: (row) => row.office || row.Office || 'N/A',
          align: 'left',
          style: 'width: 40%',
        },
        {
          name: 'position',
          label: 'Position',
          field: (row) => row.position || row.Position || 'N/A',
          align: 'left',
          style: 'width: 30%',
        },
        {
          name: 'actions',
          label: 'Actions',
          field: 'actions',
          align: 'center',
          style: 'width: 30%',
        },
      ];

      const officeOptions = computed(() => {
        if (!Array.isArray(assignedJobs.value)) return [];
        const offices = [
          ...new Set(assignedJobs.value.map((job) => job.office || job.Office).filter(Boolean)),
        ];
        return offices.map((office) => ({ label: office, value: office }));
      });

      const statusOptions = computed(() => {
        if (!Array.isArray(assignedJobs.value)) return [];
        const statuses = [...new Set(assignedJobs.value.map((job) => job.status).filter(Boolean))];
        if (assignedJobs.value.some((job) => !job.status)) statuses.push('not_started');
        return statuses.map((status) => ({
          label: formatStatus(status),
          value: status,
        }));
      });

      const filteredPositions = computed(() => {
        if (!Array.isArray(assignedJobs.value)) return [];
        return assignedJobs.value
          .filter((job) => {
            const searchTerm = search.value.toLowerCase();
            const matchesSearch =
              !searchTerm ||
              (job.position || job.Position || '').toLowerCase().includes(searchTerm) ||
              (job.office || job.Office || '').toLowerCase().includes(searchTerm);
            const matchesOffice =
              !officeFilter.value ||
              job.office === officeFilter.value ||
              job.Office === officeFilter.value;
            const matchesStatus = !statusFilter.value || job.status === statusFilter.value;
            return matchesSearch && matchesOffice && matchesStatus;
          })
          .sort((a, b) => Number(a.submitted) - Number(b.submitted));
      });

      const formatStatus = (status) => {
        if (!status) return 'Not Started';
        return status
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      const transformCriteriaData = (criteriaData) => {
        if (!criteriaData) return {};
        const educationWeight = criteriaData.educations?.[0]?.weight || '20';
        const experienceWeight = criteriaData.experiences?.[0]?.weight || '20';
        const trainingWeight = criteriaData.trainings?.[0]?.weight || '15';
        const performanceWeight = criteriaData.performances?.[0]?.weight || '15';
        const behavioralWeight = criteriaData.behaviorals?.[0]?.weight || '30';

        return {
          education: {
            Rate: educationWeight,
            items: (criteriaData.educations || []).map((item) => ({
              percentage: item.percentage,
              description: item.description,
            })),
          },
          experience: {
            Rate: experienceWeight,
            items: (criteriaData.experiences || []).map((item) => ({
              percentage: item.percentage,
              description: item.description,
            })),
          },
          training: {
            Rate: trainingWeight,
            items: (criteriaData.trainings || []).map((item) => ({
              percentage: item.percentage,
              description: item.description,
            })),
          },
          performance: {
            Rate: performanceWeight,
            items: (criteriaData.performances || []).map((item) => ({
              percentage: item.percentage,
              description: item.description,
            })),
          },
          behavioral: {
            Rate: behavioralWeight,
            items: (criteriaData.behaviorals || []).map((item) => ({
              percentage: item.percentage,
              description: item.description,
            })),
          },
        };
      };

      const loadPositionData = async (position) => {
        selectedPosition.value = position;
        loadingModalData.value = true;

        try {
          const result = await raterStore.fetch_criteria_applicant(position.id);
          if (result && result.criteria && result.criteria.length > 0) {
            const criteriaData = result.criteria[0];
            rawCriteria.value = criteriaData;
            positionCriteria.value = transformCriteriaData(criteriaData);
          } else {
            positionCriteria.value = {};
            rawCriteria.value = null;
          }

          positionApplicants.value = result && result.applicants ? result.applicants : [];
          return true;
        } catch {
          $q.notify({
            color: 'negative',
            message: 'Failed to load position data',
            icon: 'error',
            position: 'top',
          });
          return false;
        } finally {
          loadingModalData.value = false;
        }
      };

      const openRatingModal = async (position) => {
        const ok = await loadPositionData(position);
        if (ok) showRatingModal.value = true;
      };

      const openViewRatedModal = async (position) => {
        const ok = await loadPositionData(position);
        if (ok) showViewRatedModal.value = true;
      };

      const openPrintModal = (position) => {
        selectedPosition.value = position;
        showPrintModal.value = true;
      };

      const saveDraft = async (data) => {
        try {
          if (typeof raterStore.saveDraft !== 'function') {
            throw new Error('Draft ratings functionality is not available');
          }
          const result = await raterStore.saveDraft(data.applicants, data.positionId);
          if (result && result.success) {
            $q.notify({
              color: 'info',
              message: 'Draft ratings saved successfully!',
              icon: 'save',
              position: 'top',
              timeout: 2000,
            });
            await raterStore.fetch_assigned_jobs();
          } else {
            throw new Error((result && result.error) || 'Failed to save draft ratings');
          }
        } catch (error) {
          $q.notify({
            color: 'negative',
            message: error.message || 'An error occurred while saving draft ratings',
            icon: 'error',
            position: 'top',
          });
        }
      };

      const handleRatingsSubmit = async (data) => {
        try {
          const result = await raterStore.submitRatings(data.applicants, data.positionId);
          if (result.success) {
            $q.notify({
              color: 'positive',
              message: 'Ratings submitted successfully!',
              icon: 'check_circle',
              position: 'top',
              timeout: 2000,
            });
            showRatingModal.value = false;
            await raterStore.fetch_assigned_jobs();
          } else {
            throw new Error(result.error || 'Failed to submit ratings');
          }
        } catch (error) {
          $q.notify({
            color: 'negative',
            message: error.message || 'An error occurred while submitting ratings',
            icon: 'error',
            position: 'top',
          });
        }
      };

      const handleRatingModalClose = () => {
        showRatingModal.value = false;
      };

      const handleViewRatedModalClose = () => {
        showViewRatedModal.value = false;
      };

      const handlePrintModalClose = () => {
        showPrintModal.value = false;
      };

      onMounted(() => {
        raterStore.fetch_assigned_jobs();
      });

      return {
        search,
        officeFilter,
        statusFilter,
        columns,
        pagination,
        loading,
        officeOptions,
        statusOptions,
        filteredPositions,

        showRatingModal,
        showViewRatedModal,
        showPrintModal,
        selectedPosition,
        positionCriteria,
        rawCriteria,
        positionApplicants,
        loadingModalData,

        openRatingModal,
        openViewRatedModal,
        openPrintModal,
        handleRatingsSubmit,
        saveDraft,
        handleRatingModalClose,
        handleViewRatedModalClose,
        handlePrintModalClose,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .positions-table-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  :deep(.q-table) {
    th,
    td {
      padding: 10px 16px;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    th {
      font-weight: bold;
    }
  }
  .action-btn {
    margin: 0 2px;
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }
</style>
