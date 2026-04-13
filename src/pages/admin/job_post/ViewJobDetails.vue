<!-- View job details-->
<template>
  <!-- Single unified loading overlay -->
  <q-inner-loading :showing="isLoading">
    <q-spinner size="50px" color="primary" />
    <div class="q-mt-md text-primary">Loading...</div>
  </q-inner-loading>

  <div class="q-pa-md bg-grey-1">
    <!-- Job Details Card -->
    <q-card class="q-mb-lg shadow-3" flat bordered style="max-width: 1000px; margin: auto">
      <q-card-section v-if="!isLoading" class="q-pa-lg">
        <!-- Header Row: Back + History + View M.O. -->
        <div class="row items-center justify-between q-mb-lg">
          <q-btn icon="arrow_back" round flat color="primary" @click="goBack" size="md" dense />
          <div class="row items-center q-gutter-sm">
            <q-select
              v-if="historyOptions.length > 0"
              :model-value="displayHistoryId"
              :options="historyOptions"
              rounded
              dense
              outlined
              class="text-subtitle1"
              color="primary"
              label="History"
              option-label="label"
              option-value="value"
              style="width: 150px"
              @update:model-value="onHistoryChange"
              emit-value
              map-options
            />
            <div
              v-else
              class="text-subtitle1 q-pa-sm text-grey-5"
              style="
                width: 250px;
                border: 1px solid #ccc;
                border-radius: 20px;
                text-align: center;
                font-size: 0.85rem;
              "
            >
              No previous versions
            </div>

            <q-btn
              rounded
              color="primary"
              @click="viewFundedDocument"
              icon="description"
              label="View M.O."
              size="md"
              no-caps
              flat
              dense
            />
          </div>
        </div>

        <!-- Position Title + Status -->
        <div class="row items-center q-mb-xs q-gutter-sm">
          <div class="text-h6 text-primary text-bold">
            {{ selectedJob?.Position || 'Job Title' }}
          </div>
          <q-chip dense :color="statusColor" text-color="white" class="q-pa-sm">
            Status: {{ (selectedJob?.status || 'Unknown').toLowerCase() }}
          </q-chip>
        </div>

        <!-- Chips Row -->
        <div class="chips-row q-mb-md">
          <q-chip class="chip-padding level-chip" dense>
            <q-icon name="work" class="q-mr-xs" />
            <span class="chip-label">
              Level:
              <b>{{ selectedJob?.level }}</b>
            </span>
          </q-chip>
          <q-chip class="chip-padding page-chip" dense>
            <q-icon name="layers" class="q-mr-xs" />
            <span class="chip-label">
              Page No:
              <b>{{ selectedJob?.PageNo }}</b>
            </span>
          </q-chip>
          <q-chip class="chip-padding item-chip" dense>
            <q-icon name="apps" class="q-mr-xs" />
            <span class="chip-label">
              Item No:
              <b>{{ selectedJob?.ItemNo }}</b>
            </span>
          </q-chip>
          <q-chip class="chip-padding salary-chip" dense>
            <q-icon name="star" class="q-mr-xs" />
            <span class="chip-label">
              Salary Grade:
              <b>{{ selectedJob?.SalaryGrade }}</b>
            </span>
          </q-chip>
        </div>

        <!-- Office Info + Dates -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <div class="info-item">
              <q-icon name="business" size="1em" class="q-mr-xs text-primary" />
              <span class="text-grey-7">
                <b>Office:</b>
                {{ selectedJob?.Office || '-' }}
              </span>
            </div>
            <div class="info-item">
              <q-icon name="apartment" size="1em" class="q-mr-xs text-primary" />
              <span class="text-grey-7">
                <b>Division:</b>
                {{ selectedJob?.Division || '-' }}
              </span>
            </div>
            <div class="info-item">
              <q-icon name="call_split" size="1em" class="q-mr-xs text-primary" />
              <span class="text-grey-7">
                <b>Section:</b>
                {{ selectedJob?.Section || '-' }}
              </span>
            </div>
            <div class="info-item">
              <q-icon name="group_work" size="1em" class="q-mr-xs text-primary" />
              <span class="text-grey-7">
                <b>Unit:</b>
                {{ selectedJob?.Unit || '-' }}
              </span>
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="info-item">
              <q-icon name="event" size="1em" class="q-mr-xs text-primary" />
              <span class="text-grey-7">
                <b>Posting Date:</b>
                {{ formatDate(selectedJob?.post_date, 'MMM D, YYYY') || '-' }}
              </span>
            </div>
            <div class="info-item">
              <q-icon name="event_busy" size="1em" class="q-mr-xs text-primary" />
              <span class="text-grey-7">
                <b>End Date:</b>
                {{ formatDate(selectedJob?.end_date, 'MMM D, YYYY') || '-' }}
              </span>
            </div>
          </div>
        </div>

        <q-separator spaced />

        <!-- Qualification Standards -->
        <div class="text-h6 text-weight-bold text-primary q-mb-sm">
          Qualification Standards / Requirements
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm q-mb-xs criteria-card">
              <div class="text-caption text-grey-7 text-bold q-mb-xs">
                <q-icon name="school" class="q-mr-xs" />
                Education
              </div>
              <div class="text-body2">{{ selectedCriteria?.Education || 'None' }}</div>
            </q-card>
            <q-card flat bordered class="q-pa-sm criteria-card">
              <div class="text-caption text-grey-7 text-bold q-mb-xs">
                <q-icon name="model_training" class="q-mr-xs" />
                Training
              </div>
              <div class="text-body2">{{ selectedCriteria?.Training || 'None' }}</div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-sm q-mb-xs criteria-card">
              <div class="text-caption text-grey-7 text-bold q-mb-xs">
                <q-icon name="work_history" class="q-mr-xs" />
                Experience
              </div>
              <div class="text-body2">{{ selectedCriteria?.Experience || 'None' }}</div>
            </q-card>
            <q-card flat bordered class="q-pa-sm criteria-card">
              <div class="text-caption text-grey-7 text-bold q-mb-xs">
                <q-icon name="verified" class="q-mr-xs" />
                Eligibility
              </div>
              <div class="text-body2">{{ selectedCriteria?.Eligibility || 'None' }}</div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabs Card -->
    <q-card flat bordered class="shadow-2" style="max-width: 1000px; margin: auto">
      <q-card-section v-if="!isLoading" class="q-pa-md">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-primary"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="applicants" label="Applicants" />
          <q-tab name="ratings" label="Rating Results" />
        </q-tabs>

        <q-separator />
        <q-tab-panels v-model="activeTab" animated>
          <!-- ===== Applicants Tab ===== -->
          <q-tab-panel name="applicants">
            <!-- Toolbar -->
            <div class="row items-center justify-between q-mb-sm q-gutter-sm">
              <div>
                <div class="text-h6 text-primary text-bold">Applicants</div>
                <q-input
                  v-model="globalSearch"
                  outlined
                  dense
                  placeholder="Search Applicant..."
                  clearable
                  style="width: 220px"
                >
                  <template #prepend>
                    <q-icon name="search" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="row items-center q-gutter-sm">
                <q-btn
                  v-if="
                    canModifyJobPost &&
                    (selectedJob?.status == 'not started' || selectedJob?.status == 'pending')
                  "
                  label="Import"
                  color="orange-9"
                  rounded
                  dense
                  no-caps
                  style="font-size: 8pt"
                  @click="showImportModal = true"
                  icon="person_add"
                />

                <q-btn
                  v-if="canModifyJobPost && selectedJob?.status == 'assessed'"
                  label="Unqualified"
                  color="green-9"
                  icon="email"
                  rounded
                  dense
                  no-caps
                  style="font-size: 8pt"
                  @click="openNotifyUnqualifiedDialog"
                  :disable="isLoading"
                />
                <q-badge class="q-pa-sm" color="blue">Internal: {{ internalCount }}</q-badge>
                <q-badge class="q-pa-sm" color="orange">External: {{ externalCount }}</q-badge>

                <q-badge class="q-pa-sm" color="primary">
                  <q-icon name="assessment" class="q-mr-xs" />
                  Assessed: {{ assessedCount }}/{{ totalApplicants }}
                </q-badge>
              </div>
            </div>

            <!-- Applicants Table -->
            <q-table
              :rows="filteredApplicants"
              :columns="applicantColumns"
              row-key="id"
              flat
              bordered
              class="applicants-table"
              dense
              v-if="applicantColumns.length"
              separator="cell"
              color="primary"
              v-model:pagination="applicantPagination"
              :rows-number="totalApplicants"
              :loading="jobPostStore.loading"
              @request="onApplicantRequest"
              :rows-per-page-options="[2, 10, 20, 50, 100, 0]"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  {{ props.row.firstname }} {{ props.row.lastname }}
                  <span v-if="props.row.name_extension">&nbsp;{{ props.row.name_extension }}</span>
                </q-td>
              </template>
              <template #body-cell-appliedDate="props">
                <q-td :props="props">{{ props.row.appliedDate || '-' }}</q-td>
              </template>
              <template #body-cell-source="props">
                <q-td :props="props">
                  <q-badge
                    rounded
                    :color="props.row.source === 'Internal' ? 'blue' : 'orange'"
                    class="text-caption q-px-sm"
                  >
                    {{ props.row.source }}
                  </q-badge>
                </q-td>
              </template>
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    rounded
                    :color="
                      props.row.status === 'Hired' || props.row.status === 'hired'
                        ? 'green'
                        : props.row.status === 'Qualified' || props.row.status === 'qualified'
                          ? 'yellow-8'
                          : props.row.status === 'Unqualified' || props.row.status === 'unqualified'
                            ? 'red'
                            : 'grey'
                    "
                    class="text-caption q-px-sm"
                  >
                    {{ props.row.status || '-' }}
                  </q-badge>
                </q-td>
              </template>
              <template #body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    size="sm"
                    flat
                    icon="visibility"
                    color="primary"
                    @click="viewApplicantDetails(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
            <div v-else class="text-caption text-grey-6 q-mt-md q-ml-sm">
              No applicant data available.
            </div>
          </q-tab-panel>

          <!-- ===== Rating Results Tab ===== -->
          <q-tab-panel name="ratings">
            <div class="row items-center justify-between q-mb-sm q-gutter-sm">
              <div>
                <div class="text-h6 text-primary text-bold">Rating Results</div>
                <q-input
                  v-model="ratingApplicantSearch"
                  outlined
                  dense
                  placeholder="Search Applicant..."
                  style="width: 220px"
                  clearable
                >
                  <template v-slot:prepend>
                    <q-icon name="search" color="primary" />
                  </template>
                </q-input>
              </div>

              <div class="row items-center q-gutter-sm">
                <q-btn
                  v-if="showUnoccupiedButton && canModifyJobPost"
                  label="Unoccupied"
                  color="red-9"
                  rounded
                  class="q-pa-xs"
                  dense
                  no-caps
                  style="font-size: 9pt"
                  @click="unoccupiedConfirmDialog = true"
                />

                <q-badge class="q-pa-xs" color="primary" text-color="white">
                  <q-icon name="assessment" class="q-mr-sm" />
                  Rated: {{ ratingData.total_completed }}/{{ ratingData.total_assigned }}
                </q-badge>
              </div>
            </div>

            <q-table
              v-if="filteredApplicantsRate.length > 0"
              :rows="filteredApplicantsRate"
              :columns="dynamicRatingColumns"
              row-key="nPersonalInfo_id"
              flat
              bordered
              class="rating-table"
              dense
              separator="cell"
              color="primary"
              v-model:pagination="ratingPagination"
              :rows-per-page-options="[2, 10, 20, 50, 100, 0]"
              @request="onApplicantRatingRequest"
            >
              <!-- Dynamic cell template for criteria columns -->
              <template
                v-for="criteria in ratingCriteriaTypes"
                :key="`template-${criteria.type}`"
                v-slot:[`body-cell-${criteria.type}`]="props"
              >
                <q-td :props="props">
                  <div class="text-center">
                    <span class="text-weight-medium">{{ props.row[criteria.type] }}</span>
                    <!-- <div class="text-caption text-grey-6">
                      ({{ getCriteriaWeight(criteria.type) }}%)
                    </div> -->
                  </div>
                </q-td>
              </template>

              <!-- Name column template -->
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div class="text-weight-medium">
                    {{ props.row.firstname }} {{ props.row.lastname }}
                  </div>
                </q-td>
              </template>

              <!-- Total QS column template -->
              <template #body-cell-total_qs="props">
                <q-td :props="props">
                  <q-badge color="info" class="text-caption q-px-sm" rounded>
                    {{ props.row.total_qs }}
                  </q-badge>
                </q-td>
              </template>

              <!-- Exam column template (if exists) -->
              <template v-if="hasExamScore" #body-cell-exam_score="props">
                <q-td :props="props">
                  <div class="text-center">
                    {{ props.row.exam_score }}
                  </div>
                </q-td>
              </template>

              <!-- Grand Total column template -->
              <template #body-cell-grand_total="props">
                <q-td :props="props">
                  <q-badge color="positive" class="text-caption q-px-sm" rounded>
                    {{ props.row.grand_total }}
                  </q-badge>
                </q-td>
              </template>

              <!-- Rank column template -->
              <template #body-cell-rank="props">
                <q-td :props="props">
                  <q-badge
                    :color="props.row.rank <= 3 ? 'purple' : props.row.rank <= 5 ? 'info' : 'grey'"
                    class="text-caption q-px-sm"
                    rounded
                  >
                    {{ props.row.rank }}
                  </q-badge>
                </q-td>
              </template>

              <!-- Action column template -->
              <template #body-cell-action="props">
                <q-td :props="props">
                  <q-btn
                    size="sm"
                    flat
                    icon="visibility"
                    color="primary"
                    @click="viewApplicantScore(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
            <div v-else class="text-caption text-grey-6 q-mt-md q-ml-sm">
              No rating data available.
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>

    <!-- ===== Notify Unqualified Applicants Dialog ===== -->
    <q-dialog v-model="sendEvalConfirmDialog" persistent>
      <q-card style="min-width: 500px; max-width: 650px; width: 100%">
        <!-- Header -->
        <q-card-section class="bg-green-9 text-white row items-center q-py-sm">
          <q-icon name="email" size="1.4em" class="q-mr-sm" />
          <div class="text-h6 text-bold">Notify Unqualified Applicants</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="white" :disable="isLoading" />
        </q-card-section>

        <q-card-section class="q-pt-md q-pb-xs">
          <!-- Summary Banner -->
          <q-banner class="bg-grey-2 rounded-borders q-pa-sm q-mb-md" dense>
            <template v-slot:avatar>
              <q-icon name="work" color="primary" />
            </template>
            <div class="text-caption text-grey-8 text-bold q-mb-xs">
              {{ selectedJob?.Position || 'N/A' }}
            </div>
            <div class="text-caption text-grey-7 row q-gutter-md">
              <span>
                <b>Total:</b>
                {{ totalApplicants }}
              </span>
              <span>
                <b>Assessed:</b>
                {{ assessedCount }}/{{ totalApplicants }}
              </span>
              <span>
                <b>Unqualified:</b>
                <span class="text-red-8 text-bold">{{ unqualifiedApplicants.length }}</span>
              </span>
            </div>
          </q-banner>

          <!-- Warning if not all assessed -->
          <q-banner
            v-if="assessedCount < totalApplicants"
            class="bg-orange-1 text-orange-9 q-mb-md"
            rounded
            dense
          >
            <template v-slot:avatar>
              <q-icon name="warning" color="orange" />
            </template>
            Warning: Not all applicants have been assessed yet.
          </q-banner>

          <!-- Unqualified List Header -->
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-subtitle2 text-grey-8 text-bold">
              <q-icon name="person_off" class="q-mr-xs text-red-7" />
              Unqualified Applicants to be Notified
            </div>
            <q-badge color="red" rounded class="q-px-sm">
              {{ unqualifiedApplicants.length }}
            </q-badge>
          </div>

          <!-- Empty State -->
          <div
            v-if="unqualifiedApplicants.length === 0"
            class="text-center q-pa-lg bg-grey-1 rounded-borders"
          >
            <q-icon name="check_circle" color="green-6" size="2em" />
            <div class="text-caption text-grey-6 q-mt-xs">No unqualified applicants found.</div>
          </div>

          <!-- Scrollable List -->
          <q-scroll-area
            v-else
            style="height: 230px; border: 1px solid #e0e0e0; border-radius: 8px"
          >
            <q-list separator dense>
              <q-item
                v-for="(applicant, index) in unqualifiedApplicants"
                :key="applicant.id"
                class="q-py-sm"
              >
                <q-item-section avatar>
                  <q-avatar size="30px" color="red-1" text-color="red-8" font-size="0.8em">
                    {{ index + 1 }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2 text-bold">
                    {{ applicant.firstname }} {{ applicant.lastname }}
                    <span v-if="applicant.name_extension">{{ applicant.name_extension }}</span>
                  </q-item-label>
                  <q-item-label caption class="row items-center q-gutter-xs">
                    <q-badge
                      :color="applicant.source === 'Internal' ? 'blue' : 'orange'"
                      rounded
                      class="text-caption"
                    >
                      {{ applicant.source }}
                    </q-badge>
                    <span class="text-grey-6">Applied: {{ applicant.appliedDate || '-' }}</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="red" rounded class="text-caption q-px-sm">Unqualified</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>

          <div class="text-caption text-grey-5 q-mt-sm">
            <q-icon name="info" class="q-mr-xs" />
            An email notification will be sent to each unqualified applicant listed above.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancel" color="grey" v-close-popup :disable="isLoading" rounded />
          <q-btn
            unelevated
            :label="`Send Notifications (${unqualifiedApplicants.length})`"
            color="green-9"
            icon-right="send"
            @click="confirmSendFinalEvaluation"
            :loading="isLoading"
            :disable="isLoading || unqualifiedApplicants.length === 0"
            rounded
            no-caps
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- PDF Dialog -->
    <q-dialog v-model="pdfModalVisible" maximized>
      <q-card style="width: 85vw; max-width: 1000px; height: 90vh">
        <q-card-section class="row items-center bg-primary text-white">
          <div class="text-h6 text-bold">Funded Plantilla Document</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section style="height: calc(100% - 80px)">
          <q-inner-loading :showing="isLoadingPdf">
            <q-spinner size="32px" color="primary" />
          </q-inner-loading>
          <template v-if="!isLoadingPdf && pdfFileUrl">
            <iframe
              :src="pdfFileUrl"
              style="width: 100%; height: 100%; border: 2px solid #aaa; border-radius: 10px"
              title="Funded Plantilla PDF"
            ></iframe>
          </template>
          <template v-if="!isLoadingPdf && !pdfFileUrl">
            <div class="text-center q-pa-md">
              <q-icon name="error_outline" size="2em" color="negative" />
              <p>Could not load PDF document. The file might be missing or an error occurred.</p>
              <p v-if="pdfErrorMessage">{{ pdfErrorMessage }}</p>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Unoccupied Confirmation Dialog -->
    <q-dialog v-model="unoccupiedConfirmDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6 text-primary">
            <q-icon name="warning" class="q-mr-sm" color="red-9" />
            Confirm Status Update
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p class="text-body1">
            Are you sure you want to update this job status to
            <strong>"Unoccupied"</strong>
            ?
          </p>
          <div class="text-caption text-grey-6 q-mt-sm">
            <strong>ID:</strong>
            {{ selectedJob?.id || 'N/A' }}
          </div>
          <div class="text-caption text-grey-6 q-mt-sm">
            <strong>Job:</strong>
            {{ selectedJob?.Position || 'N/A' }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" color="grey" v-close-popup :disable="isLoading" />
          <q-btn
            unelevated
            label="Yes, Update to Unoccupied"
            color="negative"
            @click="updateJobStatusToUnoccupied"
            :loading="isLoading"
            :disable="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Import Applicants Modal -->
    <ImportApplicantsModal
      :show="showImportModal"
      :current-job-id="jobId"
      :current-position="selectedJob?.Position || ''"
      @update:show="showImportModal = $event"
      @imported="onApplicantsImported"
      @close="showImportModal = false"
    />

    <!-- Qualification Modal -->
    <QualificationModal
      v-if="qualificationModalVisible"
      :show="qualificationModalVisible"
      :applicant-data="selectedApplicantData"
      :education="selectedApplicantData.education"
      :position-requirements="selectedCriteria"
      :is-submitted="false"
      @update:show="handleQualificationModalUpdate"
      @view-pds="onViewPDS"
      @toggle-qualification="onToggleQualification"
      @submit="submitEvaluation"
      @close="onCloseQualificationModal"
    />

    <!-- Score Modal -->
    <ScoreModal
      v-if="scoreModal.visible"
      :show="scoreModal.visible"
      :applicant="scoreModal.applicant"
      :rating-data="ratingData"
      :job-details="scoreModal.jobDetails || selectedJob"
      @update:show="handleScoreModalUpdate"
      @on-hired="onApplicantHired"
      @close="closeScoreModal"
    />
  </div>
</template>

<script setup>
  import { useRouter, useRoute } from 'vue-router';
  import { useJobPostStore } from 'stores/jobPostStore';
  import { useAuthStore } from 'stores/authStore';
  import { onMounted, ref, computed, watch } from 'vue';
  import { date } from 'quasar';
  import axios from 'axios';
  import { toast } from 'src/boot/toast';
  import QualificationModal from 'src/components/QualityStandardModalApplicant.vue';
  import ScoreModal from 'src/components/Rater/ApplicantScore.vue';
  import ImportApplicantsModal from 'src/components/ImportApplicant.vue';

  const router = useRouter();
  const route = useRoute();
  const jobPostStore = useJobPostStore();
  const authStore = useAuthStore();

  const applicantSearch = ref('');
  const isLoading = ref(false);
  const sendEvalConfirmDialog = ref(false);

  const canModifyJobPost = computed(() => {
    return authStore.user?.permissions?.modifyJobpostAccess == '1';
  });

  const jobId = computed(() => route.params.id);
  const displayHistoryId = ref(null);
  const isNavigating = ref(false);
  const lastLoadedId = ref(null);

  const ratingPagination = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    sortBy: null,
    descending: false,
  });

  const selectedJob = ref({
    Position: '',
    status: '',
    level: '',
    PageNo: '',
    ItemNo: '',
    SalaryGrade: '',
    Office: '',
    Division: '',
    Section: '',
    Unit: '',
    post_date: null,
    end_date: null,
    PositionID: '',
    id: null,
    history: [],
  });

  const selectedCriteria = ref({
    Education: '',
    Experience: '',
    Training: '',
    Eligibility: '',
  });

  // Store criteria weights from API response
  const criteriaWeights = ref({
    education: 0,
    experience: 0,
    training: 0,
    performance: 0,
    exam: 0,
  });

  const hasExamScore = ref(false);

  const { formatDate } = date;
  const activeTab = ref('applicants');

  const qualificationModalVisible = ref(false);
  const scoreModal = ref({ visible: false, applicant: null });
  const selectedApplicantData = ref({});
  const showImportModal = ref(false);

  const pdfModalVisible = ref(false);
  const pdfFileUrl = ref('');
  const isLoadingPdf = ref(false);
  const pdfErrorMessage = ref('');
  const unoccupiedConfirmDialog = ref(false);

  const internalCount = computed(() => jobPostStore.applicantMeta.internal_applicants);
  const externalCount = computed(() => jobPostStore.applicantMeta.external_applicants);
  const totalApplicants = computed(() => jobPostStore.applicantMeta.total_applicants);

  const assessedCount = computed(() => {
    const raw = jobPostStore.applicantMeta.assessed ?? '0/0';
    return parseInt(raw.split('/')[0]) || 0;
  });

  const applicantPagination = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });

  const globalSearch = ref('');
  const ratingApplicantSearch = ref('');
  let searchTimeout = null;
  let ratingSearchTimeout = null;

  const onApplicantRequest = async (props) => {
    const { page, rowsPerPage } = props.pagination;
    const perPage = rowsPerPage === 0 ? 'all' : rowsPerPage;

    await jobPostStore.fetch_applicant(selectedJob.value.id, {
      page,
      perPage,
      search: globalSearch.value,
    });

    applicantPagination.value.page = page;
    applicantPagination.value.rowsPerPage = rowsPerPage;
    applicantPagination.value.rowsNumber = totalApplicants.value;
  };

  watch(globalSearch, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      applicantPagination.value.page = 1;
      await jobPostStore.fetch_applicant(selectedJob.value.id, {
        page: 1,
        perPage:
          applicantPagination.value.rowsPerPage === 0
            ? 'all'
            : applicantPagination.value.rowsPerPage,
        search: newValue,
      });
      applicantPagination.value.rowsNumber = totalApplicants.value;
    }, 500);
  });

  const onApplicantRatingRequest = async (props) => {
    const { page, rowsPerPage } = props.pagination;
    const perPage = rowsPerPage === 0 ? 'all' : rowsPerPage;

    await jobPostStore.fetch_applicant_rating(selectedJob.value.id, {
      page,
      perPage,
      search: ratingApplicantSearch.value,
    });

    ratingPagination.value.page = page;
    ratingPagination.value.rowsPerPage = rowsPerPage;
    ratingPagination.value.rowsNumber = jobPostStore.ratingMeta?.total || 0;
  };

  watch(ratingApplicantSearch, (newValue) => {
    if (ratingSearchTimeout) clearTimeout(ratingSearchTimeout);
    ratingSearchTimeout = setTimeout(async () => {
      ratingPagination.value.page = 1;
      await jobPostStore.fetch_applicant_rating(selectedJob.value.id, {
        page: 1,
        perPage:
          ratingPagination.value.rowsPerPage === 0 ? 'all' : ratingPagination.value.rowsPerPage,
        search: newValue,
      });
      ratingPagination.value.rowsNumber = jobPostStore.ratingMeta?.total || 0;
    }, 500);
  });

  const unqualifiedApplicants = computed(() =>
    formattedApplicants.value.filter(
      (a) => a.status === 'Unqualified' || a.status === 'unqualified',
    ),
  );

  const openNotifyUnqualifiedDialog = () => {
    sendEvalConfirmDialog.value = true;
  };

  const filteredApplicants = computed(() => {
    if (!applicantSearch.value) return formattedApplicants.value;
    const search = applicantSearch.value.toLowerCase();
    return formattedApplicants.value.filter((applicant) => {
      const fullName =
        `${applicant.firstname} ${applicant.lastname} ${applicant.name_extension}`.toLowerCase();
      const status = applicant.status?.toLowerCase() || '';
      const source = applicant.source?.toLowerCase() || '';
      return fullName.includes(search) || source.includes(search) || status.startsWith(search);
    });
  });

  // Get criteria types from the rating data
  const ratingCriteriaTypes = computed(() => {
    const types = [];
    if (criteriaWeights.value.education > 0)
      types.push({
        type: 'education',
        label: 'Education',
        weight: criteriaWeights.value.education,
      });
    if (criteriaWeights.value.experience > 0)
      types.push({
        type: 'experience',
        label: 'Experience',
        weight: criteriaWeights.value.experience,
      });
    if (criteriaWeights.value.training > 0)
      types.push({ type: 'training', label: 'Training', weight: criteriaWeights.value.training });
    if (criteriaWeights.value.performance > 0)
      types.push({
        type: 'performance',
        label: 'Performance',
        weight: criteriaWeights.value.performance,
      });
    return types;
  });

  // Get weight for a criteria type
  // const getCriteriaWeight = (type) => {
  //   return criteriaWeights.value[type] || 0;
  // };

  // Dynamic rating columns based on criteria
  const dynamicRatingColumns = computed(() => {
    const columns = [];

    // Name column (static)
    columns.push({
      name: 'name',
      label: 'Name',
      field: 'name',
      align: 'left',
      sortable: true,
      style: 'min-width: 180px',
    });

    // Dynamic criteria columns from the response
    if (criteriaWeights.value.education > 0) {
      columns.push({
        name: 'education',
        label: `Education (${criteriaWeights.value.education}%)`,
        field: 'education',
        align: 'center',
        sortable: true,
        style: 'min-width: 120px',
      });
    }

    if (criteriaWeights.value.experience > 0) {
      columns.push({
        name: 'experience',
        label: `Experience (${criteriaWeights.value.experience}%)`,
        field: 'experience',
        align: 'center',
        sortable: true,
        style: 'min-width: 120px',
      });
    }

    if (criteriaWeights.value.training > 0) {
      columns.push({
        name: 'training',
        label: `Training (${criteriaWeights.value.training}%)`,
        field: 'training',
        align: 'center',
        sortable: true,
        style: 'min-width: 120px',
      });
    }

    if (criteriaWeights.value.performance > 0) {
      columns.push({
        name: 'performance',
        label: `Performance (${criteriaWeights.value.performance}%)`,
        field: 'performance',
        align: 'center',
        sortable: true,
        style: 'min-width: 120px',
      });
    }

    // Total QS column (static)
    columns.push({
      name: 'total_qs',
      label: 'Total QS',
      field: 'total_qs',
      align: 'center',
      sortable: true,
      style: 'min-width: 100px',
    });

    // Exam column if exists
    if (hasExamScore.value && criteriaWeights.value.exam > 0) {
      columns.push({
        name: 'exam_score',
        label: `Exam (${criteriaWeights.value.exam}%)`,
        field: 'exam_score',
        align: 'center',
        sortable: true,
        style: 'min-width: 100px',
      });
    }

    // Grand Total column (static)
    columns.push({
      name: 'grand_total',
      label: 'Grand Total',
      field: 'grand_total',
      align: 'center',
      sortable: true,
      style: 'min-width: 100px',
    });

    // Rank column (static)
    columns.push({
      name: 'rank',
      label: 'Rank',
      field: 'rank',
      align: 'center',
      sortable: true,
      style: 'min-width: 80px',
    });

    // Action column (static)
    columns.push({
      name: 'action',
      label: 'Action',
      field: 'action',
      align: 'center',
      sortable: false,
      style: 'min-width: 80px',
    });

    return columns;
  });

  const historyOptions = computed(() => {
    if (!selectedJob.value?.history?.length) return [];
    return [...selectedJob.value.history]
      .sort((a, b) => new Date(b.post_date) - new Date(a.post_date))
      .map((h) => ({
        // label: `${formatDate(h.post_date, 'MMM D, YYYY')} - ${formatDate(h.end_date, 'MMM D, YYYY')}`,
        label: `${formatDate(h.post_date, 'MMM D, YYYY')}`,
        value: h.id,
        historyData: h,
      }));
  });

  const onHistoryChange = (historyId) => {
    if (!historyId) return;
    viewJobDetails(historyId);
  };

  // Extract criteria weights from the rating API response
  const extractCriteriaWeights = (ratingResponse) => {
    if (ratingResponse?.criteria && ratingResponse.criteria.length > 0) {
      const criteriaData = ratingResponse.criteria[0];

      // Get education weight
      if (criteriaData.educations && criteriaData.educations.length > 0) {
        criteriaWeights.value.education = parseInt(criteriaData.educations[0].weight) || 0;
      }

      // Get experience weight
      if (criteriaData.experiences && criteriaData.experiences.length > 0) {
        criteriaWeights.value.experience = parseInt(criteriaData.experiences[0].weight) || 0;
      }

      // Get training weight
      if (criteriaData.trainings && criteriaData.trainings.length > 0) {
        criteriaWeights.value.training = parseInt(criteriaData.trainings[0].weight) || 0;
      }

      // Get performance weight
      if (criteriaData.performances && criteriaData.performances.length > 0) {
        criteriaWeights.value.performance = parseInt(criteriaData.performances[0].weight) || 0;
      }

      // Get exam weight
      if (criteriaData.exams && criteriaData.exams.length > 0) {
        criteriaWeights.value.exam = parseInt(criteriaData.exams[0].weight) || 0;
        hasExamScore.value = criteriaWeights.value.exam > 0;
      }
    }
  };

  const loadAllData = async (id) => {
    isLoading.value = true;
    try {
      const [jobDetails, ratingResponse] = await Promise.allSettled([
        jobPostStore.fetchJobDetails(id),
        jobPostStore.fetch_applicant_rating(id, {
          page: 1,
          perPage: ratingPagination.value.rowsPerPage,
          search: '',
        }),
        jobPostStore.fetch_applicant(id, {
          page: 1,
          perPage: applicantPagination.value.rowsPerPage,
          search: '',
        }),
      ]);

      if (jobDetails.status === 'rejected') throw new Error('Failed to fetch job details');
      const details = jobDetails.value;
      selectedJob.value = {
        id: details.id || null,
        old_job_id: details.old_job_id || null,
        Position: details.Position || 'Unknown Position',
        status: details.status || 'Unknown',
        level: details.level || 'N/A',
        PageNo: details.PageNo || 'N/A',
        ItemNo: details.ItemNo || 'N/A',
        SalaryGrade: details.SalaryGrade || 'N/A',
        Office: details.Office || 'Unknown Office',
        Division: details.Division || 'N/A',
        Section: details.Section || 'N/A',
        Unit: details.Unit || 'N/A',
        post_date: details.post_date || null,
        end_date: details.end_date || null,
        PositionID: details.PositionID || '',
        tblStructureDetails_ID: details.tblStructureDetails_ID || null,
        history: details.history || [],
        ...details,
      };

      if (details.criteria && typeof details.criteria === 'object') {
        selectedCriteria.value = {
          id: details.criteria.id || null,
          Education: details.criteria.Education || 'Not specified',
          Experience: details.criteria.Experience || 'Not specified',
          Training: details.criteria.Training || 'Not specified',
          Eligibility: details.criteria.Eligibility || 'Not specified',
        };
      }

      // Extract criteria weights from rating response
      if (ratingResponse.status === 'fulfilled' && ratingResponse.value) {
        extractCriteriaWeights(ratingResponse.value);
      }

      displayHistoryId.value = details.id;
      lastLoadedId.value = details.id;
      applicantPagination.value.rowsNumber = totalApplicants.value;
      ratingPagination.value.rowsNumber = jobPostStore.ratingMeta?.total || 0;

      return details;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const viewJobDetails = async (historyId) => {
    if (!historyId || historyId === selectedJob.value.id) return;
    isNavigating.value = true;
    try {
      await loadAllData(historyId);
      await router.push({ name: 'JobPost View', params: { id: historyId } });
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details. Please try again.');
    } finally {
      isNavigating.value = false;
    }
  };

  const refreshJobDetails = async () => {
    await loadAllData(jobId.value);
  };

  const refreshApplicantData = async () => {
    if (!selectedJob.value.id) return;
    isLoading.value = true;
    try {
      await Promise.allSettled([
        jobPostStore.fetch_applicant(selectedJob.value.id),
        jobPostStore.fetch_applicant_rating(selectedJob.value.id),
      ]);
    } catch (error) {
      console.error('Error refreshing applicant data:', error);
      toast.error('Failed to refresh applicant data');
    } finally {
      isLoading.value = false;
    }
  };

  const updateJobStatusToUnoccupied = async () => {
    if (!selectedJob.value?.id) {
      toast.error('Job ID not found. Cannot update status.');
      unoccupiedConfirmDialog.value = false;
      return;
    }
    isLoading.value = true;
    try {
      await jobPostStore.updateJobStatus(selectedJob.value.id, {
        id: selectedJob.value.id,
        status: 'Unoccupied',
      });
      toast.success('Job status updated to Unoccupied successfully!');
      unoccupiedConfirmDialog.value = false;
      await refreshJobDetails();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status. Please try again.');
      unoccupiedConfirmDialog.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const onApplicantsImported = async (importedApplicants) => {
    toast.success(`Successfully imported ${importedApplicants.length} applicant(s)`);
    await refreshApplicantData();
  };

  const submitEvaluation = async (evaluationData) => {
    try {
      if (!evaluationData.id) {
        toast.error('Missing applicant ID for evaluation submission');
        return;
      }
      if (!evaluationData.status || evaluationData.status === 'Pending') {
        toast.warning('Please select a qualification status before submitting.');
        return;
      }
      await jobPostStore.evaluation(evaluationData);
      const applicantInStore = jobPostStore.applicant.find(
        (app) => app.id === evaluationData.id || app.submission_id === evaluationData.id,
      );
      if (applicantInStore) {
        applicantInStore.status = evaluationData.status;
        applicantInStore.education_remark = evaluationData.education_remark;
        applicantInStore.experience_remark = evaluationData.experience_remark;
        applicantInStore.training_remark = evaluationData.training_remark;
        applicantInStore.eligibility_remark = evaluationData.eligibility_remark;
      }
      selectedApplicantData.value.status = evaluationData.status;
      qualificationModalVisible.value = false;
      toast.success('Evaluation submitted successfully!');
    } catch (error) {
      console.error('Evaluation submission error:', error);
      toast.error('Failed to submit evaluation');
    }
  };

  const ratingData = computed(() => {
    if (!jobPostStore.applicant_rating) return { total_completed: 0, total_assigned: 0 };
    return {
      total_completed: jobPostStore.applicant_rating.total_completed || 0,
      total_assigned: jobPostStore.applicant_rating.total_assigned || 0,
    };
  });

  const goBack = () => router.push('/job-post');

  const onApplicantHired = async () => {
    try {
      await refreshJobDetails();
      await refreshApplicantData();
      closeScoreModal();
    } catch (error) {
      console.error('Error refreshing after hire:', error);
      toast.error('Failed to refresh data after hiring.');
    }
  };

  const confirmSendFinalEvaluation = async () => {
    if (!selectedJob.value?.id) {
      toast.error('Job ID not found. Cannot send final evaluation.');
      sendEvalConfirmDialog.value = false;
      return;
    }
    if (assessedCount.value === 0) {
      toast.warning('No applicants have been assessed yet.');
      sendEvalConfirmDialog.value = false;
      return;
    }
    isLoading.value = true;
    try {
      const payload = {
        job_batches_rsp_id: selectedJob.value.id,
        position: selectedJob.value.Position,
        total_applicants: totalApplicants.value,
        assessed_count: assessedCount.value,
      };
      const response = await jobPostStore.sendFinalEval(payload);
      if (response?.data?.success) {
        toast.success('Final evaluation emails sent successfully!');
        sendEvalConfirmDialog.value = false;
        await refreshApplicantData();
      } else {
        toast.error(response?.data?.message || 'Failed to send final evaluation emails');
      }
    } catch (error) {
      console.error('Error sending final evaluation:', error);
      toast.error(
        error.response?.data?.message || 'An error occurred while sending final evaluation emails.',
      );
    } finally {
      isLoading.value = false;
    }
  };

  const viewFundedDocument = async () => {
    if (!selectedJob.value?.PositionID || !selectedJob.value?.ItemNo) {
      toast.error('PositionID or ItemNo not found for the selected job. Cannot fetch document.');
      return;
    }
    isLoadingPdf.value = true;
    pdfModalVisible.value = true;
    pdfFileUrl.value = '';
    pdfErrorMessage.value = '';
    try {
      const apiUrl = process.env.VUE_APP_API_URL;
      const response = await axios.get(
        `${apiUrl}/on-funded-plantilla/by-funded/${selectedJob.value.id}`,
      );
      let apiPDF = apiUrl.replace(/\/api\/?$/, '');
      if (response.data.status === 'success' && response.data.data.fileUpload) {
        pdfFileUrl.value = `${apiPDF}/storage/${response.data.data.fileUpload}`;
      } else {
        pdfErrorMessage.value =
          response.data.message || 'Failed to fetch PDF path or file is missing.';
        toast.error(pdfErrorMessage.value);
      }
    } catch (error) {
      pdfErrorMessage.value =
        error.response?.data?.message || 'An unexpected error occurred while fetching the PDF.';
      toast.error(pdfErrorMessage.value);
    } finally {
      isLoadingPdf.value = false;
    }
  };

  const applicantColumns = ref([
    { name: 'submission_id', label: 'No', field: 'submission_id', align: 'center', sortable: true },
    { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
    { name: 'appliedDate', label: 'Applied Date', field: 'appliedDate', align: 'center' },
    { name: 'source', label: 'Source', field: 'source', align: 'center', sortable: true },
    { name: 'status', label: 'Status', field: 'status', align: 'center' },
    { name: 'action', label: 'Action', field: 'action', align: 'center', sortable: false },
  ]);

  const formattedApplicants = computed(() => {
    if (!jobPostStore.applicant) return [];
    return jobPostStore.applicant.map((a) => {
      const fullName = `${a.firstname || ''} ${a.lastname || ''} ${a.name_extension || ''}`.trim();
      return {
        id: a.nPersonalInfo_id || a.submission_id,
        submission_id: a.submission_id,
        name: fullName,
        firstname: a.firstname || '',
        lastname: a.lastname || '',
        name_extension: a.name_extension || '',
        image_url: a.image_url || 'https://placehold.co/100',
        appliedDate: a.application_date ? formatDate(a.application_date, 'MMM D, YYYY') : '-',
        source: a.applicant_type === 'internal' ? 'Internal' : 'External',
        status: a.status || '-',
        education: a.education || [],
        raw: a,
        education_remark: a.education_remark,
        experience_remark: a.experience_remark,
        training_remark: a.training_remark,
        eligibility_remark: a.eligibility_remark,
      };
    });
  });

  const statusColor = computed(() => {
    const status = (selectedJob.value?.status || '').toLowerCase();
    switch (status) {
      case 'not started':
        return 'grey';
      case 'pending':
        return 'orange';
      case 'assessed':
        return 'blue';
      case 'rated':
        return 'purple';
      case 'occupied':
      case 'qualified':
        return 'green';
      case 'unqualified':
        return 'red';
      case 'unoccupied':
        return 'red-9';
      case 'republished':
        return 'yellow-8';
      default:
        return 'grey';
    }
  });

  const showUnoccupiedButton = computed(() => {
    const status = selectedJob.value?.status?.toLowerCase().trim();
    return status === 'rated' || status === 'rating completed';
  });

  const formattedApplicantRatings = computed(() => {
    if (!jobPostStore.applicant_rating) return [];
    let ratingsArray = [];
    if (
      jobPostStore.applicant_rating.applicants &&
      typeof jobPostStore.applicant_rating.applicants === 'object'
    ) {
      ratingsArray = Object.values(jobPostStore.applicant_rating.applicants);
    } else if (Array.isArray(jobPostStore.applicant_rating)) {
      ratingsArray = jobPostStore.applicant_rating;
    } else if (typeof jobPostStore.applicant_rating === 'object') {
      ratingsArray = Object.values(jobPostStore.applicant_rating);
    }
    return ratingsArray
      .map((rating) => {
        const nPersonal = rating.nPersonalInfo_id ?? '';
        const controlNo = rating.ControlNo ?? rating.controlno ?? '';
        return {
          submission_id: rating.submission_id,
          nPersonalInfo_id: rating.nPersonalInfo_id,
          ControlNo: controlNo,
          personal_id: nPersonal ? nPersonal : controlNo ? controlNo : '-',
          firstname: rating.firstname || '',
          lastname: rating.lastname || '',
          education: rating.education || '0.00',
          experience: rating.experience || '0.00',
          training: rating.training || '0.00',
          performance: rating.performance || '0.00',
          bei: rating.bei || '0.00',
          exam_score: rating.exam_score || '0.00',
          total_qs: rating.total_qs || '0.00',
          grand_total: rating.grand_total || '0.00',
          rank: rating.rank || '-',
          image_url: rating.image_url || 'https://placehold.co/100',
          job_batches_rsp_id: rating.job_batches_rsp_id,
          history: rating.history || [],
          originalData: rating,
          raw: rating,
        };
      })
      .sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
  });

  const filteredApplicantsRate = computed(() => {
    if (!ratingApplicantSearch.value) return formattedApplicantRatings.value;
    const search = ratingApplicantSearch.value.toLowerCase();
    return formattedApplicantRatings.value.filter((applicant) => {
      const fullName = `${applicant.firstname} ${applicant.lastname}`.toLowerCase();
      return (
        fullName.includes(search) ||
        String(applicant.education).includes(search) ||
        String(applicant.experience).includes(search) ||
        String(applicant.training).includes(search) ||
        String(applicant.performance).includes(search) ||
        String(applicant.total_qs).includes(search) ||
        String(applicant.grand_total).includes(search) ||
        String(applicant.rank).includes(search)
      );
    });
  });

  function viewApplicantDetails(row) {
    selectedApplicantData.value = {
      ControlNo: row.raw?.ControlNo || row.ControlNo,
      id: row.raw?.id || row.id,
      submission_id: row.raw?.submission_id || row.submission_id || row.id,
      job_batches_rsp_id: row.raw?.job_batches_rsp_id,
      status: row.status || 'Pending',
      name: `${row.firstname} ${row.lastname}${row.name_extension ? ' ' + row.name_extension : ''}`,
      position: selectedJob.value?.Position || 'N/A',
      level: selectedJob.value?.level || 'N/A',
      appliedDate: row.appliedDate,
      PositionID: selectedJob.value?.PositionID,
      ItemNo: selectedJob.value?.ItemNo,
      Jobstatus: selectedJob.value?.status,
      image_url: row.image_url,
      education_remark: row.education_remark,
      experience_remark: row.experience_remark,
      training_remark: row.training_remark,
      eligibility_remark: row.eligibility_remark,
      education: row.education || row.raw?.education || [],
      education_images: row.education_images || row.raw?.education_images || null,
      experience_images: row.experience_images || row.raw?.experience_images || null,
      training_images: row.training_images || row.raw?.training_images || null,
      eligibility_images: row.eligibility_images || row.raw?.eligibility_images || null,
      n_personal_info: {
        education: row.education || row.raw?.education || [],
        work_experience: row.work_experience || row.raw?.work_experience || [],
        training: row.training || row.raw?.training || [],
        eligibity: row.eligibity || row.raw?.eligibity || [],
      },
      raw: row.raw,
    };
    qualificationModalVisible.value = true;
  }

  function viewApplicantScore(applicantRow) {
    const historyData =
      applicantRow.originalData?.history || applicantRow.history || applicantRow.raw?.history || [];
    scoreModal.value = {
      visible: true,
      applicant: {
        submission_id: applicantRow.submission_id,
        nPersonalInfo_id: applicantRow.nPersonalInfo_id,
        ControlNo:
          applicantRow.ControlNo || applicantRow.raw?.ControlNo || applicantRow.raw?.controlno,
        firstname: applicantRow.firstname,
        lastname: applicantRow.lastname,
        name_extension: applicantRow.name_extension || '',
        status: applicantRow.status || 'N/A',
        image_url: applicantRow.image_url,
        position: selectedJob.value?.Position || 'N/A',
        Jobstatus: selectedJob.value?.status,
        education: applicantRow.education,
        experience: applicantRow.experience,
        training: applicantRow.training,
        performance: applicantRow.performance,
        bei: applicantRow.bei,
        exam_score: applicantRow.exam_score,
        total_qs: applicantRow.total_qs,
        grand_total: applicantRow.grand_total,
        rank: applicantRow.rank,
        history: historyData,
      },
      jobDetails: selectedJob.value || {},
    };
  }

  const handleQualificationModalUpdate = (value) => {
    qualificationModalVisible.value = value;
  };
  const handleScoreModalUpdate = (value) => {
    scoreModal.value.visible = value;
  };
  function closeScoreModal() {
    scoreModal.value = { visible: false, applicant: null };
  }
  const onToggleQualification = (status) => {
    selectedApplicantData.value.status = status;
  };
  const onCloseQualificationModal = () => {
    qualificationModalVisible.value = false;
    selectedApplicantData.value = {};
  };
  const onViewPDS = () => {
    console.log('View PDS requested for:', selectedApplicantData.value.name);
  };

  onMounted(async () => {
    if (!jobId.value) {
      toast.error('No job ID provided');
      router.push('/job-post');
      return;
    }
    try {
      isNavigating.value = false;
      await loadAllData(jobId.value);
    } catch (error) {
      console.error('Error during initial data loading:', error);
      let errorMessage = 'Failed to load job details';
      if (error.response?.status === 404) errorMessage = 'Job not found';
      else if (error.response?.status === 403) errorMessage = 'Access denied';
      else errorMessage = error.response?.data?.message || error.message || errorMessage;
      toast.error(errorMessage);
      if (error.response?.status === 404) setTimeout(() => router.push('/job-post'), 2000);
    }
  });

  watch(totalApplicants, (val) => {
    applicantPagination.value.rowsNumber = val;
  });

  watch(
    () => route.params.id,
    async (newId, oldId) => {
      if (isNavigating.value || newId === lastLoadedId.value || !newId) return;
      console.log('Route changed:', oldId, '→', newId);
      try {
        await loadAllData(newId);
      } catch (error) {
        console.error('Error on route change:', error);
        toast.error('Failed to load job details');
      }
    },
  );
</script>

<style scoped>
  /* ===== Chips ===== */
  .chips-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .chip-padding {
    padding-left: 14px;
    padding-right: 14px;
  }
  .level-chip {
    background: #a8d5a4;
    color: #161616;
  }
  .page-chip {
    background: #e3f0fc;
    color: #2156a4;
  }
  .item-chip {
    background: #fff6df;
    color: #ff9800;
  }
  .salary-chip {
    background: #f3eafd;
    color: #6626a6;
  }
  .chip-label {
    font-size: 0.95rem;
    font-weight: 400;
    font-family: 'Montserrat', 'Roboto', Arial, sans-serif;
  }
  .chip-label b {
    font-weight: 700;
  }

  /* ===== Info Items ===== */
  .info-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    padding: 3px 0;
  }

  /* ===== Criteria Cards ===== */
  .criteria-card {
    border-left: 3px solid #4caf50;
    border-radius: 6px;
    background: #fafafa;
  }

  /* ===== Tabs ===== */
  .q-tabs {
    background-color: #fff;
    border-radius: 8px 8px 0 0;
  }
  .q-tab {
    font-weight: 500;
    padding: 12px;
  }
  .q-tab-panels {
    background-color: white;
  }
  .q-tab-panel {
    padding: 16px;
  }

  /* ===== Tables ===== */
  .q-table tr:hover {
    background-color: #f5f5f5;
  }

  /* ===== Badge ===== */
  .assessment-status .q-badge {
    font-size: 0.9rem;
    padding: 8px 12px;
    border-radius: 4px;
  }
</style>
