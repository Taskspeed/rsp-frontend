<template>
  <q-dialog v-model="localShow" persistent>
    <q-card
      class="applicant-score-modal"
      style="width: 1200px; max-width: 98vw; max-height: 98vh; overflow: auto"
    >
      <!-- Sticky Applicant Header -->
      <q-card-section class="row items-center header q-px-md q-py-sm">
        <q-img
          :src="applicantImageUrl || 'https://placehold.co/100'"
          class="bg-grey-4"
          style="width: 90px; height: 90px; border-radius: 10px; margin-right: 24px"
          alt="Applicant Photo"
        />
        <div class="col">
          <div class="applicant-name">
            {{ applicantName }}
          </div>
          <div class="applicant-info">Position: {{ applicant?.position || 'N/A' }}</div>
          <div class="applicant-info">Final Rank: #{{ finalScores?.rank || 'N/A' }}</div>
        </div>
        <div class="col-auto">
          <q-btn icon="close" flat round dense class="close-btn q-ml-md" @click="closeModal" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="main-content-section q-pa-none">
        <!-- Loading State -->
        <div v-if="dataLoading" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="50px" />
          <div class="q-mt-md text-grey-7">Loading applicant scores...</div>
        </div>

        <!-- Individual Rater Scores -->
        <div v-else-if="raterScores.length > 0" class="q-mb-lg q-pa-md">
          <div class="section-title">Individual Rater Scores</div>
          <q-card flat class="modern-table-card">
            <q-table
              :rows="raterScores"
              :columns="dynamicColumns"
              row-key="id"
              flat
              dense
              hide-pagination
              separator="cell"
              wrap-cells
              :hide-header="false"
            >
              <template v-slot:header="props">
                <q-tr :props="props">
                  <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="modern-table-header"
                  >
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>

              <template v-slot:body="props">
                <q-tr :props="props" class="modern-table-row">
                  <q-td
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="modern-table-cell"
                  >
                    <template v-if="col.name === 'rater'">
                      <span class="text-weight-medium">
                        {{ props.row.rater_name || 'Anonymous Rater' }}
                      </span>
                      <div v-if="props.row.rater_id" class="text-caption text-grey-6">
                        ID: {{ props.row.rater_id }}
                      </div>
                    </template>

                    <template v-else-if="col.name === 'rank'">
                      <q-badge
                        :color="getRankColor(props.row.ranking)"
                        class="text-caption q-px-sm"
                        rounded
                      >
                        {{ props.row.ranking }}
                      </q-badge>
                    </template>

                    <template v-else-if="col.name === 'grandTotal'">
                      <span class="text-bold">{{ formatScore(props.row.grand_total) }}</span>
                    </template>

                    <template v-else>
                      {{ formatScore(props.row[col.field]) }}
                    </template>
                  </q-td>
                </q-tr>
              </template>

              <template v-slot:no-data>
                <div class="full-width row flex-center q-pa-md text-grey-7">
                  <q-icon name="info" size="18px" class="q-mr-sm" />
                  No individual rater scores available
                </div>
              </template>
            </q-table>
          </q-card>
        </div>

        <!-- Final/Average Scores -->
        <div v-if="!dataLoading && finalScores" class="q-pa-md">
          <div class="section-title">Final Averaged Scores</div>
          <q-card flat class="modern-table-card">
            <q-table
              :rows="[finalScores]"
              :columns="dynamicFinalScoreColumns"
              row-key="nPersonalInfo_id"
              flat
              dense
              hide-pagination
              separator="cell"
              wrap-cells
              :hide-header="false"
            >
              <template v-slot:header="props">
                <q-tr :props="props">
                  <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="modern-table-header"
                  >
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>

              <template v-slot:body="props">
                <q-tr :props="props" class="modern-table-row">
                  <q-td
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="modern-table-cell"
                  >
                    <template v-if="col.name === 'rank'">
                      <q-badge
                        :color="getRankColor(props.row.rank)"
                        class="text-caption q-px-sm"
                        rounded
                      >
                        {{ props.row.rank }}
                      </q-badge>
                    </template>

                    <template v-else-if="col.name === 'grandTotal'">
                      <span class="text-bold text-positive">
                        {{ formatScore(props.row.grand_total) }}
                      </span>
                    </template>

                    <template v-else>
                      {{ formatScore(props.row[col.field]) }}
                    </template>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card>
        </div>

        <!-- No data message -->
        <div
          v-if="!dataLoading && raterScores.length === 0 && !finalScores"
          class="text-center q-pa-md text-grey-6"
        >
          <q-icon name="info" size="2em" />
          <div class="q-mt-sm">No scoring data available for this applicant</div>
        </div>
      </q-card-section>

      <!-- Footer Actions -->
      <q-separator />
      <q-card-section class="footer-actions bg-grey-2 q-py-sm">
        <div class="row justify-between items-center q-gutter-sm" style="width: 100%">
          <div class="text-body2 text-grey-8" v-if="showHireButton && !isJobOccupied">
            <q-icon name="info" color="primary" class="q-mr-xs" />
            Note: This applicant is considered qualified for the position and may be hired.
          </div>

          <div class="text-body2 text-orange-8" v-if="isJobOccupied">
            <q-icon name="lock" color="orange" class="q-mr-xs" />
            Position is occupied - Hiring is disabled.
          </div>

          <div class="text-body2 text-grey-8" v-if="!canModifyJobPost && !isJobOccupied">
            <q-icon name="visibility" color="grey" class="q-mr-xs" />
            View only - You do not have permission to hire applicants.
          </div>

          <div>
            <q-btn
              v-if="
                showHireButton &&
                !isJobOccupied &&
                !isRepublish &&
                !isUnoccupied &&
                applicant?.status != 'Unoccupied' &&
                canModifyJobPost
              "
              color="positive"
              icon="work"
              label="Hire"
              class="q-mr-sm"
              @click="showHireConfirmation"
              :loading="hiringLoading"
              unelevated
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Hire Confirmation Dialog -->
    <q-dialog v-model="hireConfirmationDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section class="row items-center bg-positive text-white">
          <q-icon name="work" size="24px" class="q-mr-sm" />
          <div class="text-h6">Confirm Hiring</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="hireConfirmationDialog = false" />
        </q-card-section>

        <q-card-section class="q-pt-lg">
          <div class="text-body1 text-weight-medium q-mb-md">
            Are you sure you want to hire this applicant?
          </div>

          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-grey-1">
              <div class="row items-center q-gutter-md">
                <q-avatar size="60px" color="primary" text-color="white" icon="person" />
                <div class="col">
                  <div class="text-h6 text-primary">{{ applicantName }}</div>
                  <div class="text-subtitle2 text-grey-7">{{ jobDetails.Position || 'N/A' }}</div>
                  <q-badge color="positive" class="q-mt-xs">
                    Rank #{{ finalScores?.rank || 'N/A' }}
                  </q-badge>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <div class="col-8">
              <div class="detail-item">
                <q-icon name="business" class="q-mr-xs text-primary" />
                <span class="label">Office:</span>
                <span class="value">{{ jobDetails.Office || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="apartment" class="q-mr-xs text-primary" />
                <span class="label">Division:</span>
                <span class="value">{{ jobDetails.Division || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="call_split" class="q-mr-xs text-primary" />
                <span class="label">Section:</span>
                <span class="value">{{ jobDetails.Section || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="group_work" class="q-mr-xs text-primary" />
                <span class="label">Unit:</span>
                <span class="value">{{ jobDetails.Unit || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="layers" class="q-mr-xs text-primary" />
                <span class="label">Level:</span>
                <span class="value">{{ jobDetails.level || '-' }}</span>
              </div>
            </div>

            <div class="col-4">
              <div class="detail-item">
                <q-icon name="description" class="q-mr-xs text-primary" />
                <span class="label">Page No:</span>
                <span class="value">{{ jobDetails.PageNo || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="apps" class="q-mr-xs text-primary" />
                <span class="label">Item No:</span>
                <span class="value">{{ jobDetails.ItemNo || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="star" class="q-mr-xs text-primary" />
                <span class="label">Salary Grade:</span>
                <span class="value">{{ jobDetails.SalaryGrade || '-' }}</span>
              </div>

              <div class="detail-item">
                <q-icon name="emoji_events" class="q-mr-xs text-positive" />
                <span class="label">Final Rank:</span>
                <span class="value">#{{ finalScores?.rank || '-' }}</span>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-lg">
          <q-btn
            flat
            label="Cancel"
            color="grey-7"
            @click="hireConfirmationDialog = false"
            class="q-mr-sm"
          />
          <q-btn
            color="positive"
            label="Confirm Hire"
            icon="check"
            @click="confirmHireApplicant"
            :loading="hiringLoading"
            unelevated
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script>
  import { ref, computed, watch } from 'vue';
  import { useJobPostStore } from 'stores/jobPostStore';
  import { useAuthStore } from 'stores/authStore';
  import { toast } from 'src/boot/toast';

  export default {
    name: 'ApplicantScoreModal',
    props: {
      show: {
        type: Boolean,
        default: false,
      },
      applicant: {
        type: Object,
        default: () => ({}),
      },
      ratingData: {
        type: Object,
        default: () => ({ total_completed: 0, total_assigned: 0 }),
      },
      jobDetails: {
        type: Object,
        default: () => ({}),
      },
    },
    emits: ['update:show', 'close', 'on-hired'],
    setup(props, { emit }) {
      const localShow = ref(props.show);
      const raterScores = ref([]);
      const finalScores = ref(null);
      const applicantImageUrl = ref('');
      const showControlNo = ref(false);
      const hiringLoading = ref(false);
      const hireConfirmationDialog = ref(false);
      const dataLoading = ref(false);
      const criteriaWeights = ref({
        education: 0,
        experience: 0,
        training: 0,
        performance: 0,
        exam: 0,
      });
      const hasExamScore = ref(false);
      const hasBei = ref(false);

      const jobPostStore = useJobPostStore();
      const authStore = useAuthStore();

      const applicantLookupKey = computed(() => {
        const nPersonal = props.applicant?.nPersonalInfo_id;
        const controlNo = props.applicant?.ControlNo || props.applicant?.controlno;
        return nPersonal || controlNo || null;
      });

      const canModifyJobPost = computed(() => {
        return authStore.user?.permissions?.modifyJobpostAccess == '1';
      });

      const applicantName = computed(() => {
        if (!props.applicant) return 'Unknown Applicant';

        const firstName = props.applicant.firstname || '';
        const lastName = props.applicant.lastname || props.applicant.last_name || '';
        const extension = props.applicant.name_extension
          ? ` ${props.applicant.name_extension}`
          : '';

        return `${firstName} ${lastName}${extension}`.trim() || 'Unknown Applicant';
      });

      const isJobOccupied = computed(() => {
        return (
          props.jobDetails?.status === 'Occupied' ||
          props.jobDetails?.status === 'occupied' ||
          props.applicant?.Jobstatus === 'Occupied' ||
          props.applicant?.Jobstatus === 'occupied'
        );
      });

      const isUnoccupied = computed(() => {
        return (
          props.jobDetails?.status === 'Unoccupied' ||
          props.jobDetails?.status === 'unoccupied' ||
          props.applicant?.Jobstatus === 'Unoccupied' ||
          props.applicant?.Jobstatus === 'unoccupied'
        );
      });

      const isRepublish = computed(() => {
        return (
          props.jobDetails?.status === 'Republished' ||
          props.jobDetails?.status === 'republished' ||
          props.applicant?.Jobstatus === 'Republished' ||
          props.applicant?.Jobstatus === 'republished'
        );
      });

      const showHireButton = computed(() => {
        if (!canModifyJobPost.value) return false;

        const allRatingsCompleted =
          props.ratingData.total_completed === props.ratingData.total_assigned;
        const applicantRank = parseInt(finalScores.value?.rank) || 999;
        const isTopFive = applicantRank <= 5;

        return allRatingsCompleted && isTopFive && !isJobOccupied.value;
      });

      // Extract criteria weights from the criteria array
      const extractCriteriaWeights = (criteriaArray) => {
        if (criteriaArray && criteriaArray.length > 0) {
          const criteriaData = criteriaArray[0];

          if (criteriaData.educations && criteriaData.educations.length > 0) {
            criteriaWeights.value.education = parseInt(criteriaData.educations[0].weight) || 0;
          }

          if (criteriaData.experiences && criteriaData.experiences.length > 0) {
            criteriaWeights.value.experience = parseInt(criteriaData.experiences[0].weight) || 0;
          }

          if (criteriaData.trainings && criteriaData.trainings.length > 0) {
            criteriaWeights.value.training = parseInt(criteriaData.trainings[0].weight) || 0;
          }

          if (criteriaData.performances && criteriaData.performances.length > 0) {
            criteriaWeights.value.performance = parseInt(criteriaData.performances[0].weight) || 0;
          }

          if (criteriaData.exams && criteriaData.exams.length > 0) {
            criteriaWeights.value.exam = parseInt(criteriaData.exams[0].weight) || 0;
            hasExamScore.value = criteriaWeights.value.exam > 0;
          }

          // Check if BEI exists in the criteria
          // BEI is typically part of the criteria structure - check if there's a bei property
          if (criteriaData.bei !== undefined || criteriaData.bei_questions !== undefined) {
            hasBei.value = true;
          } else {
            // Check if any rater has BEI score that's not null/undefined
            hasBei.value = false;
          }
        }
      };

      // Check if BEI exists in the score data
      const checkBeiInScores = (scores) => {
        if (scores && scores.length > 0) {
          hasBei.value = scores.some(
            (score) => score.bei !== null && score.bei !== undefined && score.bei !== '',
          );
        }
      };

      // Dynamic columns for individual rater scores
      const dynamicColumns = computed(() => {
        const columns = [];

        // Rater column (static)
        columns.push({
          name: 'rater',
          label: 'Rater',
          field: 'rater_name',
          align: 'left',
        });

        // Dynamic criteria columns
        if (criteriaWeights.value.education > 0) {
          columns.push({
            name: 'education',
            label: `Education (${criteriaWeights.value.education}%)`,
            field: 'education',
            align: 'center',
          });
        }

        if (criteriaWeights.value.experience > 0) {
          columns.push({
            name: 'experience',
            label: `Experience (${criteriaWeights.value.experience}%)`,
            field: 'experience',
            align: 'center',
          });
        }

        if (criteriaWeights.value.training > 0) {
          columns.push({
            name: 'training',
            label: `Training (${criteriaWeights.value.training}%)`,
            field: 'training',
            align: 'center',
          });
        }

        if (criteriaWeights.value.performance > 0) {
          columns.push({
            name: 'performance',
            label: `Performance (${criteriaWeights.value.performance}%)`,
            field: 'performance',
            align: 'center',
          });
        }

        // BEI column - only show if BEI exists in criteria or scores
        if (hasBei.value) {
          columns.push({
            name: 'bei',
            label: 'BEI',
            field: 'bei',
            align: 'center',
          });
        }

        // Total QS column
        columns.push({
          name: 'totalQs',
          label: 'Total QS',
          field: 'total_qs',
          align: 'center',
        });

        // Exam column if exists
        if (hasExamScore.value && criteriaWeights.value.exam > 0) {
          columns.push({
            name: 'exam',
            label: `Exam (${criteriaWeights.value.exam}%)`,
            field: 'exam',
            align: 'center',
          });
        }

        // Rank column
        columns.push({
          name: 'rank',
          label: 'Rank',
          field: 'ranking',
          align: 'center',
        });

        // Grand Total column
        columns.push({
          name: 'grandTotal',
          label: 'Grand Total',
          field: 'grand_total',
          align: 'center',
        });

        return columns;
      });

      // Dynamic columns for final scores
      const dynamicFinalScoreColumns = computed(() => {
        const columns = [];

        if (criteriaWeights.value.education > 0) {
          columns.push({
            name: 'education',
            label: `Education (${criteriaWeights.value.education}%)`,
            field: 'education',
            align: 'center',
          });
        }

        if (criteriaWeights.value.experience > 0) {
          columns.push({
            name: 'experience',
            label: `Experience (${criteriaWeights.value.experience}%)`,
            field: 'experience',
            align: 'center',
          });
        }

        if (criteriaWeights.value.training > 0) {
          columns.push({
            name: 'training',
            label: `Training (${criteriaWeights.value.training}%)`,
            field: 'training',
            align: 'center',
          });
        }

        if (criteriaWeights.value.performance > 0) {
          columns.push({
            name: 'performance',
            label: `Performance (${criteriaWeights.value.performance}%)`,
            field: 'performance',
            align: 'center',
          });
        }

        // BEI column - only show if BEI exists in criteria or scores
        if (hasBei.value) {
          columns.push({
            name: 'bei',
            label: 'BEI',
            field: 'bei',
            align: 'center',
          });
        }

        columns.push({
          name: 'totalQs',
          label: 'Total QS',
          field: 'total_qs',
          align: 'center',
        });

        if (hasExamScore.value && criteriaWeights.value.exam > 0) {
          columns.push({
            name: 'exam',
            label: `Exam (${criteriaWeights.value.exam}%)`,
            field: 'exam_score',
            align: 'center',
          });
        }

        columns.push({
          name: 'rank',
          label: 'Final Rank',
          field: 'rank',
          align: 'center',
        });

        columns.push({
          name: 'grandTotal',
          label: 'Final Total',
          field: 'grand_total',
          align: 'center',
        });

        return columns;
      });

      const closeModal = () => {
        localShow.value = false;
      };

      const cleanupModal = () => {
        raterScores.value = [];
        finalScores.value = null;
        applicantImageUrl.value = '';
        showControlNo.value = false;
        hiringLoading.value = false;
        hireConfirmationDialog.value = false;
        dataLoading.value = false;
        emit('close');
      };

      const getRankColor = (rank) => {
        const rankNum = parseInt(rank);
        if (rankNum <= 5) return 'purple';
        return 'grey';
      };

      const formatScore = (score) => {
        if (score === null || score === undefined || score === '') return '-';
        const num = parseFloat(score);
        return isNaN(num) ? '-' : num.toFixed(2);
      };

      const showHireConfirmation = () => {
        if (!isJobOccupied.value && canModifyJobPost.value) {
          hireConfirmationDialog.value = true;
        }
      };

      const confirmHireApplicant = async () => {
        if (!canModifyJobPost.value) {
          toast.error('You do not have permission to hire applicants');
          return;
        }

        const submissionId = finalScores.value?.submission_id || props.applicant?.submission_id;

        if (!submissionId) {
          toast.error('submission_id is missing for this applicant. Cannot hire.');
          return;
        }

        try {
          hiringLoading.value = true;

          const payload = { submission_id: submissionId };

          console.log('Hiring applicant with payload:', payload);

          const response = await jobPostStore.hiredApplicant(submissionId, payload);
          console.log('API Response:', response);

          if (response && response.data) {
            if (response.data.success === true) {
              toast.success(response.data.message || 'Applicant hired successfully');

              emit('on-hired');

              setTimeout(() => {
                hireConfirmationDialog.value = false;
                closeModal();
              }, 500);
            } else {
              toast.error(response.data.message || 'Failed to hire applicant');
              hireConfirmationDialog.value = false;
            }
          } else {
            toast.error('Unexpected response format.');
            hireConfirmationDialog.value = false;
          }
        } catch (error) {
          console.error('Network or other error:', error);
          toast.error('Network error. Please try again.');
          hireConfirmationDialog.value = false;
        } finally {
          hiringLoading.value = false;
        }
      };

      const loadScoreData = async () => {
        console.log('Loading score data for applicant:', props.applicant);

        const lookupKey = applicantLookupKey.value;
        const jobpostId = props.jobDetails?.id;

        if (!props.applicant || !lookupKey || !jobpostId) {
          console.warn('Missing applicant lookup key or jobpostId');
          raterScores.value = [];
          finalScores.value = null;
          applicantImageUrl.value = '';
          return;
        }

        applicantImageUrl.value = props.applicant.image_url || 'https://placehold.co/100';

        try {
          dataLoading.value = true;

          const scoreData = await jobPostStore.fetchApplicantScoreDetails(lookupKey, jobpostId);
          console.log('Fetched score details:', scoreData);

          const apiApplicant = scoreData?.applicant || {};

          // Extract criteria weights from the response
          if (scoreData?.criteria) {
            extractCriteriaWeights(scoreData.criteria);
          }

          // Check if BEI exists in the history scores
          if (Array.isArray(scoreData?.history)) {
            checkBeiInScores(scoreData.history);
          }

          finalScores.value = {
            education: props.applicant.education,
            experience: props.applicant.experience,
            training: props.applicant.training,
            performance: props.applicant.performance,
            bei: props.applicant.bei,
            exam_score: props.applicant.exam_score || props.applicant.exam,
            total_qs: props.applicant.total_qs,
            grand_total: props.applicant.grand_total,
            rank: props.applicant.rank,
            submission_id: apiApplicant.submission_id ?? props.applicant.submission_id ?? null,
            nPersonalInfo_id:
              apiApplicant.nPersonalInfo_id ?? props.applicant.nPersonalInfo_id ?? null,
            ControlNo:
              apiApplicant.ControlNo ??
              props.applicant.ControlNo ??
              props.applicant.controlno ??
              null,
          };

          showControlNo.value =
            !finalScores.value.nPersonalInfo_id && !!finalScores.value.ControlNo;

          if (Array.isArray(scoreData?.history)) {
            raterScores.value = scoreData.history.map((score, index) => ({
              ...score,
              id: score.id || `rater-${index}`,
            }));
          } else {
            raterScores.value = [];
          }
        } catch (error) {
          console.error('Error fetching individual rater scores:', error);
          toast.error('Failed to load individual rater scores');
          raterScores.value = [];
          finalScores.value = null;
        } finally {
          dataLoading.value = false;
        }
      };

      watch(
        () => props.show,
        (newVal) => {
          localShow.value = newVal;
          if (newVal) {
            loadScoreData();
          }
        },
        { immediate: true },
      );

      watch(
        () => props.applicant,
        () => {
          if (props.show) {
            loadScoreData();
          }
        },
        { deep: true },
      );

      watch(localShow, (newVal) => {
        emit('update:show', newVal);
        if (!newVal) cleanupModal();
      });

      return {
        localShow,
        raterScores,
        finalScores,
        applicantImageUrl,
        showControlNo,
        applicantName,
        dynamicColumns,
        dynamicFinalScoreColumns,
        closeModal,
        getRankColor,
        formatScore,
        showHireButton,
        isJobOccupied,
        isRepublish,
        isUnoccupied,
        hiringLoading,
        hireConfirmationDialog,
        showHireConfirmation,
        confirmHireApplicant,
        canModifyJobPost,
        dataLoading,
      };
    },
  };
</script>

<style scoped lang="scss">
  .applicant-score-modal {
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
  }

  .header {
    background-color: #f5f5f5;
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .applicant-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  .applicant-info {
    font-size: 10px;
    color: #666;
    margin-bottom: 2px;
  }

  .modern-table-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
    border-radius: 8px;
    border: 2px solid #eee !important;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .modern-table-header {
    background-color: #fff !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #333 !important;
    padding: 12px 16px !important;
    border-bottom: 1px solid #eee;
  }

  .modern-table-row {
    transition: background-color 0.2s;

    &:hover {
      background-color: #f9f9f9;
    }

    &:nth-child(even) {
      background-color: #fafafa;
    }
  }

  .modern-table-cell {
    padding: 12px 16px !important;
    font-size: 11px !important;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
  }

  .section-title {
    font-size: 14px;
    font-weight: 400;
    color: #333;
    margin: 0 0 12px 0;
  }

  .footer-actions {
    flex: 0 0 auto;
    border-top: 1px solid #eee;
  }

  .control-badge {
    font-size: 9px;
  }

  .hire-note {
    display: flex;
    align-items: center;
    font-size: 12px;
  }

  .hire-btn {
    font-weight: 500;
    padding: 8px 16px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .label {
    font-weight: 500;
    margin-left: 4px;
    margin-right: 8px;
    min-width: 80px;
    color: #666;
  }

  .value {
    color: #333;
    font-weight: 400;
  }
</style>
