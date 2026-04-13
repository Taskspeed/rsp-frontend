<template>
  <q-page>
    <div class="q-pa-md">
      <div class="column items-start justify-center q-mb-md">
        <h5 class="text-h5 q-ma-none"><b>Applicants</b></h5>
      </div>

      <div class="table-scroll-wrapper">
        <q-table
          class="main-table"
          :rows="store.rows"
          :columns="columns"
          row-key="id"
          :filter="filter"
          :loading="loading"
          :pagination="pagination"
          :rows-per-page-options="[10, 20, 50]"
          flat
          bordered
          dense
        >
          <template #top-left>
            <q-input
              outlined
              dense
              debounce="300"
              v-model="filter"
              placeholder="Search"
              class="search-input"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template #body-cell-action="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="primary"
                class="bg-green-1"
                icon="visibility"
                @click="openView(props.row)"
              >
                <q-tooltip>View</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Modal -->
    <q-dialog v-model="dialog" persistent full-width full-height>
      <q-card class="user-dialog-card">
        <q-card-section class="dialog-header header-view">
          <div class="row items-center no-wrap">
            <q-icon name="assignment_ind" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-bold">Applicant Details</div>
              <div class="text-caption opacity-80">
                {{ selected.firstname }} {{ selected.lastname }}
              </div>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            class="close-btn"
            v-close-popup
            @click="store.clearDetails()"
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="dialog-body q-pa-none">
          <div class="q-pa-md">
            <div class="text-caption text-grey-7 q-mb-sm">Applied Positions</div>

            <div class="table-scroll-wrapper">
              <q-table
                class="modal-table"
                :rows="store.details"
                :columns="detailColumns"
                row-key="submission_id"
                :loading="detailsLoading"
                flat
                bordered
                dense
              >
                <template #body-cell-action="props">
                  <q-td :props="props">
                    <q-btn
                      flat
                      round
                      dense
                      color="primary"
                      class="bg-primary-1"
                      icon="visibility"
                      @click="openRatingForm(props.row)"
                    >
                      <q-tooltip>View</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
              </q-table>
            </div>
          </div>

          <q-separator />
          <div class="dialog-footer row justify-end items-center q-pa-md q-gutter-sm">
            <q-btn
              rounded
              flat
              label="Close"
              color="grey-7"
              v-close-popup
              @click="store.clearDetails()"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <RatingFormApplicant
      v-model="ratingOpen"
      :position="ratingPosition"
      :criteria="ratingCriteria"
      :raw-criteria="ratingRawCriteria"
      :applicants="ratingApplicants"
      :loading="ratingLoading"
      :filter-submission-id="selectedSubmissionId"
      @save-draft="onSaveDraft"
      @close="ratingOpen = false"
    />
  </q-page>
</template>

<script>
  import { defineComponent, ref, onMounted } from 'vue';
  import { useApplicantsStore } from 'src/stores/applicantRater';
  import { use_rater_store } from 'stores/rater_store';
  import RatingFormApplicant from 'src/components/RatingFormApplicant.vue';

  export default defineComponent({
    name: 'ApplicantsPage',
    components: { RatingFormApplicant },
    setup() {
      const store = useApplicantsStore();
      const raterStore = use_rater_store();

      const filter = ref('');
      const loading = ref(false);
      const dialog = ref(false);
      const detailsLoading = ref(false);
      const selected = ref({});

      const pagination = ref({ page: 1, rowsPerPage: 10 });

      const columns = [
        {
          name: 'lastname',
          label: 'Lastname',
          field: 'lastname',
          align: 'left',
          sortable: true,
          classes: 'col-wrap',
        },
        {
          name: 'firstname',
          label: 'Firstname',
          field: 'firstname',
          align: 'left',
          sortable: true,
          classes: 'col-wrap',
        },
        {
          name: 'action',
          label: 'Action',
          field: 'action',
          align: 'center',
          sortable: false,
          classes: 'text-center',
        },
      ];

      const detailColumns = [
        {
          name: 'position',
          label: 'Position',
          field: 'position',
          align: 'left',
          sortable: true,
          classes: 'col-wrap',
        },
        {
          name: 'office',
          label: 'Office',
          field: 'office',
          align: 'left',
          sortable: true,
          classes: 'col-wrap',
        },
        {
          name: 'action',
          label: 'Action',
          field: 'action',
          align: 'center',
          sortable: false,
          classes: 'col-wrap',
        },
      ];

      const ratingOpen = ref(false);
      const ratingLoading = ref(false);
      const ratingPosition = ref({});
      const ratingCriteria = ref({});
      const ratingRawCriteria = ref(null);
      const ratingApplicants = ref([]);
      const selectedSubmissionId = ref(null);

      const openView = async (row) => {
        selected.value = row;
        dialog.value = true;
        detailsLoading.value = true;
        await store.fetchApplicantDetails({
          firstname: row.firstname,
          lastname: row.lastname,
          date_of_birth: row.date_of_birth,
        });
        detailsLoading.value = false;
      };

      const openRatingForm = async (row) => {
        selectedSubmissionId.value = row.submission_id || null;

        ratingLoading.value = true;
        ratingOpen.value = true;

        const result = await raterStore.fetch_criteria_applicant(row.job_post_id);

        if (result && result.criteria && result.criteria.length > 0) {
          const criteriaData = result.criteria[0];
          ratingRawCriteria.value = criteriaData;
          ratingCriteria.value = transformCriteriaData(criteriaData);
        } else {
          ratingRawCriteria.value = null;
          ratingCriteria.value = {};
        }

        ratingApplicants.value = result?.applicants || [];

        ratingPosition.value = {
          id: row.job_post_id,
          position: row.position,
          office: row.office,
        };

        ratingLoading.value = false;
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
            items: (criteriaData.educations || []).map((i) => ({
              percentage: i.percentage,
              description: i.description,
            })),
          },
          experience: {
            Rate: experienceWeight,
            items: (criteriaData.experiences || []).map((i) => ({
              percentage: i.percentage,
              description: i.description,
            })),
          },
          training: {
            Rate: trainingWeight,
            items: (criteriaData.trainings || []).map((i) => ({
              percentage: i.percentage,
              description: i.description,
            })),
          },
          performance: {
            Rate: performanceWeight,
            items: (criteriaData.performances || []).map((i) => ({
              percentage: i.percentage,
              description: i.description,
            })),
          },
          behavioral: {
            Rate: behavioralWeight,
            items: (criteriaData.behaviorals || []).map((i) => ({
              percentage: i.percentage,
              description: i.description,
            })),
          },
        };
      };

      const onSaveDraft = async (payload) => {
        await raterStore.saveDraft(payload.applicants, payload.positionId);
        ratingOpen.value = false;
      };

      onMounted(async () => {
        loading.value = true;
        await store.fetchApplicants();
        loading.value = false;
      });

      return {
        store,
        columns,
        detailColumns,
        filter,
        loading,
        pagination,
        dialog,
        selected,
        detailsLoading,
        openView,
        openRatingForm,
        ratingOpen,
        ratingLoading,
        ratingPosition,
        ratingCriteria,
        ratingRawCriteria,
        ratingApplicants,
        selectedSubmissionId,
        onSaveDraft,
      };
    },
  });
</script>

<style scoped>
  .table-scroll-wrapper {
    width: 100%;
  }

  :deep(.q-table th),
  :deep(.q-table td) {
    white-space: normal !important;
    word-break: normal !important; /* stop mid‑word breaks */
    overflow-wrap: break-word; /* only break if needed at spaces */
  }

  .col-wrap {
    white-space: normal !important;
    word-break: break-word;
    min-width: 80px;
  }

  .user-dialog-card {
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

  .dialog-body {
    flex: 1; /* takes remaining space */
    overflow: auto; /* scroll body content */
  }

  .dialog-footer {
    margin-top: auto; /* pushes footer to bottom */
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .user-dialog-card {
      width: 90vw;
      height: 90vh;
      max-width: 90vw;
      max-height: 90vh;
      border-radius: 0;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    color: white;
    flex-shrink: 0;
  }
  .header-view {
    background: #00631d;
  }
  .close-btn {
    color: rgba(255, 255, 255, 0.8);
  }
  .close-btn:hover {
    color: white;
  }

  .dialog-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .dialog-footer {
    flex-shrink: 0;
    background: #fafafa;
  }

  @media (max-width: 600px) {
    :deep(.q-table th),
    :deep(.q-table td) {
      padding: 6px 8px;
      font-size: 11px;
    }
    .search-input {
      width: 100%;
    }
  }
</style>
