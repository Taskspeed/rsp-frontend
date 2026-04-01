<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="column items-start justify-center q-mb-md">
      <h5 class="text-h5 q-ma-none"><b>Schedule</b></h5>
    </div>

    <div class="q-pa-sm">
      <!-- Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        align="left"
        class="q-mb-md"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="interview" label="Interview Schedule" icon="event" />
        <q-tab name="exam" label="Exam Schedule" icon="assignment" />
      </q-tabs>

      <q-separator class="q-mb-md" />

      <q-tab-panels v-model="activeTab" animated>
        <!-- ======================== INTERVIEW SCHEDULE TAB ======================== -->
        <q-tab-panel name="interview" class="q-pa-none">
          <div class="row justify-between items-center q-mb-md">
            <q-input
              v-model="globalSearch"
              outlined
              dense
              placeholder="Search interviews..."
              class="col-auto"
              style="max-width: 300px"
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
            <q-btn
              color="primary"
              label="Schedule Interview"
              icon="event"
              rounded
              @click="openScheduleDialog"
            />
          </div>

          <q-table
            :rows="interviewStore.interviews || []"
            :columns="columns"
            row-key="schedule_id"
            v-model:pagination="pagination"
            class="interviews-table q-mt-md"
            :loading="interviewStore.loading"
            table-style="min-width: 100%"
            @request="onRequest"
            :rows-per-page-options="[10, 20, 50, 100, 200]"
          >
            <template v-slot:body-cell-batch_name="props">
              <q-td :props="props" class="batch-column">
                <div class="text-body2 text-weight-medium text-black">
                  {{ props.row.batch_name || `Batch ${props.row.id}` }}
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-applicant_no="props">
              <q-td :props="props" class="count-column">
                <div class="text-center text-body2">
                  <q-badge color="primary" class="q-px-sm">
                    {{ props.row.applicant_no || 0 }}
                  </q-badge>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-venue_interview="props">
              <q-td :props="props" class="venue-column">
                <div class="text-body2">{{ props.row.venue_interview || 'Not Set' }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-date_interview="props">
              <q-td :props="props" class="date-column">
                <q-badge rounded color="blue" class="text-caption q-px-sm">
                  {{ formatDate(props.row.date_interview) }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-time_interview="props">
              <q-td :props="props" class="time-column">
                <div class="text-body2 text-center">{{ formatTime(props.row.time_interview) }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-action="props">
              <q-td :props="props" class="action-column">
                <div class="row q-gutter-xs justify-center">
                  <q-btn
                    round
                    flat
                    color="blue"
                    size="sm"
                    class="bg-blue-1"
                    icon="visibility"
                    @click="viewInterview(props.row)"
                  >
                    <q-tooltip>View Details</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-md text-grey">
                <div class="column items-center">
                  <q-icon name="event_busy" size="3em" class="q-mb-sm" />
                  <div class="text-h6">No Scheduled Interviews</div>
                  <div class="text-caption">Click "Schedule Interview" to get started</div>
                </div>
              </div>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- ======================== EXAM SCHEDULE TAB ======================== -->
        <q-tab-panel name="exam" class="q-pa-none">
          <div class="row justify-between items-center q-mb-md">
            <q-input
              v-model="examGlobalSearch"
              outlined
              dense
              placeholder="Search exams..."
              class="col-auto"
              style="max-width: 300px"
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
            <q-btn
              color="primary"
              label="Schedule Exam"
              icon="assignment"
              rounded
              @click="openExamScheduleDialog"
            />
          </div>

          <q-table
            :rows="examStore.exams || []"
            :columns="examColumns"
            row-key="schedule_id"
            v-model:pagination="examPagination"
            class="interviews-table q-mt-md"
            :loading="examStore.loading"
            table-style="min-width: 100%"
            @request="onExamRequest"
            :rows-per-page-options="[10, 20, 50, 100, 200]"
          >
            <template v-slot:body-cell-batch_name="props">
              <q-td :props="props" class="batch-column">
                <div class="text-body2 text-weight-medium text-black">
                  {{ props.row.batch_name || `Batch ${props.row.schedule_id}` }}
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-applicant_no="props">
              <q-td :props="props" class="count-column">
                <div class="text-center text-body2">
                  <q-badge color="green" class="q-px-sm">{{ props.row.applicant_no || 0 }}</q-badge>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-venue_exam="props">
              <q-td :props="props" class="venue-column">
                <div class="text-body2">{{ props.row.venue_exam || 'Not Set' }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-date_exam="props">
              <q-td :props="props" class="date-column">
                <q-badge rounded color="green" class="text-caption q-px-sm">
                  {{ formatDate(props.row.date_exam) }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-time_exam="props">
              <q-td :props="props" class="time-column">
                <div class="text-body2 text-center">{{ formatTime(props.row.time_exam) }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-action="props">
              <q-td :props="props" class="action-column">
                <div class="row q-gutter-xs justify-center">
                  <q-btn
                    round
                    flat
                    color="green"
                    size="sm"
                    class="bg-green-1"
                    icon="visibility"
                    @click="viewExam(props.row)"
                  >
                    <q-tooltip>View Details</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-md text-grey">
                <div class="column items-center">
                  <q-icon name="assignment_late" size="3em" class="q-mb-sm" />
                  <div class="text-h6">No Scheduled Exams</div>
                  <div class="text-caption">Click "Schedule Exam" to get started</div>
                </div>
              </div>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- ======================== INTERVIEW: Schedule Dialog ======================== -->
    <q-dialog v-model="showScheduleDialog" persistent>
      <q-card style="min-width: 700px; max-width: 90vw">
        <q-card-section class="q-pa-md">
          <div class="row justify-between items-center">
            <div class="text-h6 text-weight-bold">Schedule Interview</div>
            <q-btn icon="close" flat round dense @click="closeScheduleDialog" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-md">
          <q-input
            v-model="scheduleForm.batch_name"
            label="Batch Name (Optional)"
            outlined
            dense
            class="q-mb-sm"
            placeholder="e.g., Software Engineer Interview - Batch 1"
          />
          <q-input
            v-model="scheduleForm.venue_interview"
            label="Venue (Optional)"
            outlined
            dense
            class="q-mb-sm"
            placeholder="e.g., City Hall Of Tagum - HR Office"
          />
          <q-input
            v-model="scheduleForm.date_interview"
            label="Interview Date *"
            outlined
            dense
            mask="date"
            :rules="['date']"
            class="q-mb-sm"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="scheduleForm.date_interview"
                    :options="dateOptions"
                    mask="YYYY-MM-DD"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-model="scheduleForm.time_interview"
            label="Interview Time (Optional)"
            outlined
            dense
            class="q-mb-sm"
            placeholder="e.g., 10:00 AM"
            mask="time"
          >
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="scheduleForm.time_interview" format24h :mask="'HH:mm'">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="text-subtitle2 q-mb-sm">Select Applicants *</div>
          <q-input
            v-model="applicantSearch"
            outlined
            dense
            placeholder="Search applicants..."
            class="q-mb-md"
            clearable
          >
            <template v-slot:prepend><q-icon name="search" color="primary" /></template>
          </q-input>
          <q-table
            :rows="filteredInterviewApplicantRows"
            :columns="applicantColumns"
            row-key="submission_id"
            :pagination="applicantPagination"
            :loading="loadingInterviewApplicants"
            class="applicant-selection-table"
            selection="multiple"
            v-model:selected="scheduleForm.selected_applicants"
          >
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <div class="text-body2 text-weight-medium">
                  {{ `${props.row.firstname} ${props.row.lastname}` }}
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-position="props">
              <q-td :props="props">
                <div class="positions-list">
                  <div v-for="(p, i) in props.row.positions" :key="i" class="position-item">
                    {{ p }}
                  </div>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-office="props">
              <q-td :props="props">
                <div class="positions-list">
                  <div v-for="(o, i) in props.row.offices" :key="i" class="position-item">
                    {{ o }}
                  </div>
                </div>
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-md text-grey">
                <div class="column items-center">
                  <q-icon name="info" size="2em" class="q-mb-sm" />
                  <div>Click search to load applicants</div>
                </div>
              </div>
            </template>
          </q-table>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Cancel" color="grey" flat @click="closeScheduleDialog" />
          <q-btn
            label="Schedule"
            color="primary"
            @click="submitSchedule"
            :disable="!isFormValid"
            :loading="interviewStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ======================== EXAM: Schedule Dialog ======================== -->
    <q-dialog v-model="showExamScheduleDialog" persistent>
      <q-card style="min-width: 700px; max-width: 90vw">
        <q-card-section class="q-pa-md">
          <div class="row justify-between items-center">
            <div class="text-h6 text-weight-bold">Schedule Exam</div>
            <q-btn icon="close" flat round dense @click="closeExamScheduleDialog" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-md">
          <q-input
            v-model="examScheduleForm.batch_name"
            label="Batch Name (Optional)"
            outlined
            dense
            class="q-mb-sm"
            placeholder="e.g., Civil Service Exam - Batch 1"
          />
          <q-input
            v-model="examScheduleForm.venue_interview"
            label="Venue (Optional)"
            outlined
            dense
            class="q-mb-sm"
            placeholder="e.g., City Hall Of Tagum - Conference Room"
          />
          <q-input
            v-model="examScheduleForm.date_interview"
            label="Exam Date *"
            outlined
            dense
            mask="date"
            :rules="['date']"
            class="q-mb-sm"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="examScheduleForm.date_interview"
                    :options="dateOptions"
                    mask="YYYY-MM-DD"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-model="examScheduleForm.time_interview"
            label="Exam Time (Optional)"
            outlined
            dense
            class="q-mb-sm"
            placeholder="e.g., 09:00 AM"
            mask="time"
          >
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="examScheduleForm.time_interview" format24h :mask="'HH:mm'">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="text-subtitle2 q-mb-sm">Select Applicants *</div>
          <q-input
            v-model="examApplicantSearch"
            outlined
            dense
            placeholder="Search applicants..."
            class="q-mb-md"
            clearable
          >
            <template v-slot:prepend><q-icon name="search" color="primary" /></template>
          </q-input>
          <q-table
            :rows="filteredExamApplicantRows"
            :columns="applicantColumns"
            row-key="submission_id"
            :pagination="applicantPagination"
            :loading="examStore.loadingApplicants"
            class="applicant-selection-table"
            selection="multiple"
            v-model:selected="examScheduleForm.selected_applicants"
          >
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <div class="text-body2 text-weight-medium">
                  {{ `${props.row.firstname} ${props.row.lastname}` }}
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-position="props">
              <q-td :props="props">
                <div class="positions-list">
                  <div v-for="(p, i) in props.row.positions" :key="i" class="position-item">
                    {{ p }}
                  </div>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-office="props">
              <q-td :props="props">
                <div class="positions-list">
                  <div v-for="(o, i) in props.row.offices" :key="i" class="position-item">
                    {{ o }}
                  </div>
                </div>
              </q-td>
            </template>
            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-md text-grey">
                <div class="column items-center">
                  <q-icon name="info" size="2em" class="q-mb-sm" />
                  <div>Click search to load applicants</div>
                </div>
              </div>
            </template>
          </q-table>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Cancel" color="grey" flat @click="closeExamScheduleDialog" />
          <q-btn
            label="Schedule"
            color="primary"
            @click="submitExamSchedule"
            :disable="!isExamFormValid"
            :loading="examStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ======================== INTERVIEW: View Details Dialog ======================== -->
    <q-dialog v-model="showViewDialog" persistent>
      <q-card style="min-width: 1000px; max-width: 90vw">
        <q-card-section class="q-pa-md bg-primary text-white">
          <div class="row justify-between items-center">
            <div class="text-h6 text-weight-bold">Interview Details</div>
            <q-btn icon="close" flat round dense color="white" @click="closeViewDialog" />
          </div>
        </q-card-section>
        <q-separator />
        <div v-if="interviewStore.loadingApplicants" class="q-pa-xl text-center">
          <q-spinner size="2rem" color="primary" class="q-mb-sm" />
          <div class="text-subtitle2">Loading interview details...</div>
        </div>
        <q-card-section v-else class="q-pa-md">
          <div class="q-mb-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Batch Information</div>
            <q-input
              :model-value="viewData.batch_name || 'Not specified'"
              label="Batch Name"
              outlined
              dense
              readonly
              class="q-mb-sm"
            />
            <q-input
              :model-value="viewData.venue_interview || 'Not specified'"
              label="Venue"
              outlined
              dense
              readonly
              class="q-mb-sm"
            />
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="formatDate(viewData.date_interview)"
                  label="Interview Date"
                  outlined
                  dense
                  readonly
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="formatTime(viewData.time_interview)"
                  label="Interview Time"
                  outlined
                  dense
                  readonly
                />
              </div>
            </div>
          </div>
          <q-separator class="q-my-md" />
          <div>
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Scheduled Applicants
              <q-badge color="primary" class="q-ml-sm">{{ viewApplicants.length }}</q-badge>
            </div>
            <q-table
              :rows="viewApplicants"
              :columns="viewApplicantColumns"
              row-key="submission_id"
              :pagination="viewPagination"
              class="applicant-view-table"
              :rows-per-page-options="[5, 10, 20, 100, 200]"
            >
              <template v-slot:body-cell-name="props">
                <q-td :props="props">
                  <div class="text-body text-weight-medium">
                    {{ props.row.applicant_name || `${props.row.firstname} ${props.row.lastname}` }}
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-position="props">
                <q-td :props="props">
                  <div class="positions-list">
                    <div
                      v-for="(p, i) in props.row.positions || [props.row.position]"
                      :key="i"
                      class="position-item"
                    >
                      {{ p || 'N/A' }}
                    </div>
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-control_no="props">
                <q-td :props="props">
                  <q-badge color="grey-7" class="text-caption">
                    {{ props.row.ControlNo || props.row.control_no || 'N/A' }}
                  </q-badge>
                </q-td>
              </template>
              <template v-slot:no-data>
                <div class="full-width row flex-center q-pa-md text-grey">
                  <div class="column items-center">
                    <q-icon name="person_off" size="2em" class="q-mb-sm" />
                    <div>No applicants scheduled for this interview</div>
                  </div>
                </div>
              </template>
            </q-table>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Close" color="primary" flat @click="closeViewDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ======================== EXAM: View Details Dialog ======================== -->
    <q-dialog v-model="showExamViewDialog" persistent>
      <q-card style="min-width: 1000px; max-width: 90vw">
        <q-card-section class="q-pa-md bg-green text-white">
          <div class="row justify-between items-center">
            <div class="text-h6 text-weight-bold">Exam Details</div>
            <q-btn icon="close" flat round dense color="white" @click="closeExamViewDialog" />
          </div>
        </q-card-section>
        <q-separator />
        <div v-if="examStore.loadingApplicants" class="q-pa-xl text-center">
          <q-spinner size="2rem" color="green" class="q-mb-sm" />
          <div class="text-subtitle2">Loading exam details...</div>
        </div>
        <q-card-section v-else class="q-pa-md">
          <div class="q-mb-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Batch Information</div>
            <q-input
              :model-value="examViewData.batch_name || 'Not specified'"
              label="Batch Name"
              outlined
              dense
              readonly
              class="q-mb-sm"
            />
            <q-input
              :model-value="examViewData.venue || examViewData.venue_exam || 'Not specified'"
              label="Venue"
              outlined
              dense
              readonly
              class="q-mb-sm"
            />
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="formatDate(examViewData.date || examViewData.date_exam)"
                  label="Exam Date"
                  outlined
                  dense
                  readonly
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="formatTime(examViewData.time || examViewData.time_exam)"
                  label="Exam Time"
                  outlined
                  dense
                  readonly
                />
              </div>
            </div>
          </div>
          <q-separator class="q-my-md" />
          <div>
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Scheduled Applicants
              <q-badge color="green" class="q-ml-sm">{{ examViewApplicants.length }}</q-badge>
            </div>
            <q-table
              :rows="examViewApplicants"
              :columns="viewApplicantColumns"
              row-key="applicant_name"
              :pagination="viewPagination"
              class="applicant-view-table"
              :rows-per-page-options="[5, 10, 20, 100, 200]"
            >
              <template v-slot:body-cell-name="props">
                <q-td :props="props">
                  <div class="text-body text-weight-medium">{{ props.row.applicant_name }}</div>
                </q-td>
              </template>
              <template v-slot:body-cell-position="props">
                <q-td :props="props">
                  <div class="text-body2">{{ props.row.position || 'N/A' }}</div>
                </q-td>
              </template>
              <template v-slot:body-cell-contact_no="props">
                <q-td :props="props">
                  <div class="text-body2">{{ props.row.contact_no || 'N/A' }}</div>
                </q-td>
              </template>
              <template v-slot:no-data>
                <div class="full-width row flex-center q-pa-md text-grey">
                  <div class="column items-center">
                    <q-icon name="person_off" size="2em" class="q-mb-sm" />
                    <div>No applicants scheduled for this exam</div>
                  </div>
                </div>
              </template>
            </q-table>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="Close" color="green" flat @click="closeExamViewDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useQuasar, date } from 'quasar';
  import { useInterviewStore } from 'stores/interviewStore';
  import { useExamScheduleStore } from 'stores/examScheduleStore';

  let searchTimeout = null;
  let examSearchTimeout = null;

  const $q = useQuasar();
  const interviewStore = useInterviewStore();
  const examStore = useExamScheduleStore();
  const { formatDate: qFormatDate } = date;

  // ─── Tab ─────────────────────────────────────────────────────────────────────
  const activeTab = ref('interview');

  // ─── Interview state ──────────────────────────────────────────────────────────
  const globalSearch = ref('');
  const showScheduleDialog = ref(false);
  const showViewDialog = ref(false);
  const applicantSearch = ref('');
  const loadingInterviewApplicants = ref(false);
  const viewData = ref({});
  const viewApplicants = ref([]);

  const scheduleForm = ref({
    batch_name: '',
    venue_interview: '',
    date_interview: '',
    time_interview: '',
    selected_applicants: [],
  });

  const pagination = ref({
    sortBy: 'date_interview',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });

  // ─── Exam state ───────────────────────────────────────────────────────────────
  const examGlobalSearch = ref('');
  const showExamScheduleDialog = ref(false);
  const showExamViewDialog = ref(false);
  const examApplicantSearch = ref('');
  const examViewData = ref({});
  const examViewApplicants = ref([]);

  const examScheduleForm = ref({
    batch_name: '',
    venue_interview: '',
    date_interview: '',
    time_interview: '',
    selected_applicants: [],
  });

  const examPagination = ref({
    sortBy: 'date_interview',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });

  // ─── Shared ───────────────────────────────────────────────────────────────────
  const applicantPagination = ref({ page: 1, rowsPerPage: 10 });
  const viewPagination = ref({ page: 1, rowsPerPage: 10 });

  // ─── Columns ──────────────────────────────────────────────────────────────────
  const columns = [
    {
      name: 'batch_name',
      label: 'Batch Name',
      align: 'left',
      field: 'batch_name',
      sortable: true,
      style: 'width: 25%',
    },
    {
      name: 'applicant_no',
      label: 'No. of Applicants',
      align: 'center',
      field: 'applicant_no',
      sortable: true,
      style: 'width: 15%',
    },
    {
      name: 'venue_interview',
      label: 'Venue',
      align: 'left',
      field: 'venue_interview',
      sortable: true,
      style: 'width: 20%',
    },
    {
      name: 'date_interview',
      label: 'Interview Date',
      align: 'center',
      field: 'date_interview',
      sortable: true,
      style: 'width: 15%',
    },
    {
      name: 'time_interview',
      label: 'Time',
      align: 'center',
      field: 'time_interview',
      sortable: true,
      style: 'width: 15%',
    },
    {
      name: 'action',
      label: 'Action',
      align: 'center',
      field: 'action',
      sortable: false,
      style: 'width: 10%',
    },
  ];

  const examColumns = [
    {
      name: 'batch_name',
      label: 'Batch Name',
      align: 'left',
      field: 'batch_name',
      sortable: true,
      style: 'width: 25%',
    },
    {
      name: 'applicant_no',
      label: 'No. of Applicants',
      align: 'center',
      field: 'applicant_no',
      sortable: true,
      style: 'width: 15%',
    },
    {
      name: 'venue_exam',
      label: 'Venue',
      align: 'left',
      field: 'venue_exam',
      sortable: true,
      style: 'width: 20%',
    },
    {
      name: 'date_exam',
      label: 'Exam Date',
      align: 'center',
      field: 'date_exam',
      sortable: true,
      style: 'width: 15%',
    },
    {
      name: 'time_exam',
      label: 'Time',
      align: 'center',
      field: 'time_exam',
      sortable: true,
      style: 'width: 15%',
    },
    {
      name: 'action',
      label: 'Action',
      align: 'center',
      field: 'action',
      sortable: false,
      style: 'width: 10%',
    },
  ];

  const applicantColumns = [
    {
      name: 'name',
      label: 'Applicant Name',
      align: 'left',
      field: 'name',
      sortable: true,
      style: 'width: 40%',
    },
    {
      name: 'office',
      label: 'Office',
      align: 'left',
      field: 'office',
      sortable: false,
      style: 'width: 30%',
    },
    {
      name: 'position',
      label: 'Positions Applied',
      align: 'left',
      field: 'position',
      sortable: false,
      style: 'width: 30%',
    },
  ];

  const viewApplicantColumns = [
    {
      name: 'applicant_name',
      label: 'Applicant Name',
      align: 'left',
      field: 'applicant_name',
      sortable: true,
      style: 'width: 35%; white-space: normal;',
    },
    {
      name: 'position',
      label: 'Position',
      align: 'left',
      field: 'position',
      sortable: false,
      style: 'width: 45%; white-space: normal;',
    },
    {
      name: 'contact_no',
      label: 'Contact No',
      align: 'left',
      field: 'contact_no',
      sortable: false,
      style: 'width: 20%; white-space: normal;',
    },
  ];

  // ─── Request handlers ─────────────────────────────────────────────────────────
  const onRequest = async (props) => {
    const { page, rowsPerPage, sortBy, descending } = props.pagination;
    await interviewStore.fetchInterviews({
      page,
      perPage: rowsPerPage,
      search: globalSearch.value,
    });
    pagination.value = {
      ...pagination.value,
      page,
      rowsPerPage,
      sortBy,
      descending,
      rowsNumber: interviewStore.total,
    };
  };

  const onExamRequest = async (props) => {
    const { page, rowsPerPage, sortBy, descending } = props.pagination;
    await examStore.fetchExams({ page, perPage: rowsPerPage, search: examGlobalSearch.value });
    examPagination.value = {
      ...examPagination.value,
      page,
      rowsPerPage,
      sortBy,
      descending,
      rowsNumber: examStore.total,
    };
  };

  // ─── Search watchers ──────────────────────────────────────────────────────────
  watch(globalSearch, (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      pagination.value.page = 1;
      await interviewStore.fetchInterviews({
        page: 1,
        perPage: pagination.value.rowsPerPage,
        search: val,
      });
      pagination.value.rowsNumber = interviewStore.total;
    }, 500);
  });

  watch(examGlobalSearch, (val) => {
    if (examSearchTimeout) clearTimeout(examSearchTimeout);
    examSearchTimeout = setTimeout(async () => {
      examPagination.value.page = 1;
      await examStore.fetchExams({
        page: 1,
        perPage: examPagination.value.rowsPerPage,
        search: val,
      });
      examPagination.value.rowsNumber = examStore.total;
    }, 500);
  });

  // ─── Computed ─────────────────────────────────────────────────────────────────
  const transformApplicants = (raw) =>
    (raw || []).map((s) => ({
      submission_id: s.submission_id,
      nPersonalInfo_id: s.nPersonalInfo_id,
      ControlNo: s.ControlNo,
      firstname: s.firstname,
      lastname: s.lastname,
      offices: [s.job_batch_rsp?.Office || 'N/A'],
      positions: [s.job_batch_rsp?.Position || 'N/A'],
      job_batches_rsp_id: s.job_batches_rsp_id,
    }));

  const transformedInterviewApplicants = computed(() =>
    transformApplicants(interviewStore.availableApplicants),
  );

  const transformedExamApplicants = computed(() =>
    transformApplicants(examStore.availableApplicants),
  );

  const filteredInterviewApplicantRows = computed(() => {
    if (!applicantSearch.value) return transformedInterviewApplicants.value;
    const t = applicantSearch.value.toLowerCase();
    return transformedInterviewApplicants.value.filter(
      (a) =>
        `${a.firstname} ${a.lastname}`.toLowerCase().includes(t) ||
        a.positions.join(' ').toLowerCase().includes(t) ||
        a.offices.join(' ').toLowerCase().includes(t) ||
        (a.ControlNo?.toLowerCase() || '').includes(t),
    );
  });

  const filteredExamApplicantRows = computed(() => {
    if (!examApplicantSearch.value) return transformedExamApplicants.value;
    const t = examApplicantSearch.value.toLowerCase();
    return transformedExamApplicants.value.filter(
      (a) =>
        `${a.firstname} ${a.lastname}`.toLowerCase().includes(t) ||
        a.positions.join(' ').toLowerCase().includes(t) ||
        a.offices.join(' ').toLowerCase().includes(t) ||
        (a.ControlNo?.toLowerCase() || '').includes(t),
    );
  });

  const isFormValid = computed(
    () => scheduleForm.value.date_interview && scheduleForm.value.selected_applicants.length > 0,
  );

  const isExamFormValid = computed(
    () =>
      examScheduleForm.value.date_interview &&
      examScheduleForm.value.selected_applicants.length > 0,
  );

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Set';
    try {
      return qFormatDate(dateStr, 'MMM D, YYYY');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Not Set';
    if (timeStr === '1900-01-01' || timeStr.startsWith('1900-01-01')) return 'Not Set';
    try {
      let t = timeStr;
      if (t.includes('T')) t = t.split('T')[1].split('.')[0];
      else if (t.includes(' ') && t.split(' ')[0].includes('-')) t = t.split(' ')[1] || t;
      const parts = t.split(':');
      if (parts.length >= 2) {
        let h = parseInt(parts[0]);
        const m = parts[1];
        if (isNaN(h) || h < 0 || h > 23) return 'Not Set';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
      }
      return 'Not Set';
    } catch {
      return 'Not Set';
    }
  };

  const formatTimeForApi = (timeStr) => {
    if (!timeStr) return null;
    if (timeStr.match(/^\d{2}:\d{2}$/)) return `${timeStr}:00`;
    if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr;
    return null;
  };

  const dateOptions = (dateVal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateVal) >= today;
  };

  // ─── Interview dialog methods ──────────────────────────────────────────────────
  const resetScheduleForm = () => {
    scheduleForm.value = {
      batch_name: '',
      venue_interview: '',
      date_interview: '',
      time_interview: '',
      selected_applicants: [],
    };
    applicantSearch.value = '';
  };

  const openScheduleDialog = async () => {
    showScheduleDialog.value = true;
    loadingInterviewApplicants.value = true;
    try {
      await interviewStore.fetchAvailableApplicants();
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e?.message || 'Failed to load applicants',
        position: 'top',
      });
    } finally {
      loadingInterviewApplicants.value = false;
    }
  };

  const closeScheduleDialog = () => {
    showScheduleDialog.value = false;
    resetScheduleForm();
  };

  const closeViewDialog = () => {
    showViewDialog.value = false;
    viewData.value = {};
    viewApplicants.value = [];
    interviewStore.clearBatchDetails();
  };

  const submitSchedule = async () => {
    try {
      const payload = {
        batch_name: scheduleForm.value.batch_name || null,
        venue_interview: scheduleForm.value.venue_interview || null,
        date_interview: scheduleForm.value.date_interview,
        time_interview: formatTimeForApi(scheduleForm.value.time_interview),
        applicants: scheduleForm.value.selected_applicants.map((a) => ({
          submission_id: a.submission_id,
          job_batches_rsp: parseInt(a.job_batches_rsp_id),
        })),
      };
      const response = await interviewStore.scheduleInterview(payload);
      if (response?.success || response?.data?.success) {
        $q.notify({
          type: 'positive',
          message:
            response?.message || response?.data?.message || 'Interview scheduled successfully',
          position: 'top',
        });
        closeScheduleDialog();
        await interviewStore.fetchInterviews({
          page: 1,
          perPage: pagination.value.rowsPerPage,
          search: '',
        });
        pagination.value.rowsNumber = interviewStore.total;
      } else {
        $q.notify({
          type: 'negative',
          message: response?.message || response?.data?.message || 'Failed to schedule interview',
          position: 'top',
        });
      }
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e?.response?.data?.message || e?.message || 'Failed to schedule interview',
        position: 'top',
      });
    }
  };

  const viewInterview = async (interview) => {
    try {
      viewData.value = interview;
      showViewDialog.value = true;
      const detail = await interviewStore.fetchScheduleDetails(interview.schedule_id);
      const schedule = detail?.schedule || detail || {};
      viewData.value = {
        ...schedule,
        schedule_id: schedule.schedule_id ?? interview.schedule_id,
        batch_name: schedule.batch_name ?? interview.batch_name,
        venue_interview: schedule.venue_interview ?? interview.venue_interview,
        date_interview: schedule.date_interview ?? interview.date_interview,
        time_interview: schedule.time_interview ?? interview.time_interview,
      };
      let applicants = [];
      if (Array.isArray(detail)) applicants = detail;
      else if (Array.isArray(detail?.applicants)) applicants = detail.applicants;
      else if (Array.isArray(detail?.data)) applicants = detail.data;
      viewApplicants.value = applicants;
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e?.message || 'Failed to load interview details',
        position: 'top',
      });
      closeViewDialog();
    }
  };

  // ─── Exam dialog methods ───────────────────────────────────────────────────────
  const resetExamScheduleForm = () => {
    examScheduleForm.value = {
      batch_name: '',
      venue_interview: '',
      date_interview: '',
      time_interview: '',
      selected_applicants: [],
    };
    examApplicantSearch.value = '';
  };

  const openExamScheduleDialog = async () => {
    showExamScheduleDialog.value = true;
    try {
      await examStore.fetchAvailableApplicants();
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e?.message || 'Failed to load applicants',
        position: 'top',
      });
    }
  };

  const closeExamScheduleDialog = () => {
    showExamScheduleDialog.value = false;
    resetExamScheduleForm();
  };

  const closeExamViewDialog = () => {
    showExamViewDialog.value = false;
    examViewData.value = {};
    examViewApplicants.value = [];
    examStore.clearExamDetails();
  };

  const submitExamSchedule = async () => {
    try {
      const payload = {
        batch_name: examScheduleForm.value.batch_name || null,
        venue_exam: examScheduleForm.value.venue_interview || null,
        date_exam: examScheduleForm.value.date_interview,
        time_exam: formatTimeForApi(examScheduleForm.value.time_interview),
        applicants: examScheduleForm.value.selected_applicants.map((a) => ({
          submission_id: a.submission_id,
          job_batches_rsp: parseInt(a.job_batches_rsp_id),
        })),
      };
      const response = await examStore.scheduleExam(payload);
      if (response?.success || response?.data?.success) {
        $q.notify({
          type: 'positive',
          message: response?.message || response?.data?.message || 'Exam scheduled successfully',
          position: 'top',
        });
        closeExamScheduleDialog();
        await examStore.fetchExams({
          page: 1,
          perPage: examPagination.value.rowsPerPage,
          search: '',
        });
        examPagination.value.rowsNumber = examStore.total;
      } else {
        $q.notify({
          type: 'negative',
          message: response?.message || response?.data?.message || 'Failed to schedule exam',
          position: 'top',
        });
      }
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e?.response?.data?.message || e?.message || 'Failed to schedule exam',
        position: 'top',
      });
    }
  };

  const viewExam = async (exam) => {
    try {
      examViewData.value = exam;
      showExamViewDialog.value = true;
      const detail = await examStore.fetchExamDetails(exam.schedule_id);
      examViewData.value = detail;
      examViewApplicants.value = detail?.applicants || [];
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e?.message || 'Failed to load exam details',
        position: 'top',
      });
      closeExamViewDialog();
    }
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────────
  onMounted(async () => {
    // Load interview list
    await interviewStore.fetchInterviews({
      page: 1,
      perPage: pagination.value.rowsPerPage,
      search: '',
    });
    pagination.value.rowsNumber = interviewStore.total;

    // Load exam list
    await examStore.fetchExams({ page: 1, perPage: examPagination.value.rowsPerPage, search: '' });
    examPagination.value.rowsNumber = examStore.total;
  });
</script>

<style scoped lang="scss">
  .text-h5 {
    font-size: 1.3rem;
    line-height: 1.7rem;
    margin-bottom: 0.5rem;
  }

  .interviews-table,
  .applicant-selection-table,
  .applicant-view-table {
    font-size: 0.9rem;
    table-layout: fixed;
    width: 100%;

    th {
      font-size: 0.95rem;
      font-weight: 600;
      padding: 8px 12px;
      background-color: #f5f5f5;
    }

    td {
      font-size: 0.9rem;
      padding: 8px 12px;
      vertical-align: middle;
    }

    .batch-column,
    .count-column,
    .venue-column {
      white-space: normal;
      word-break: break-word;
    }
  }

  .interviews-table {
    .batch-column {
      width: 25%;
    }
    .count-column {
      width: 15%;
      text-align: center;
    }
    .venue-column {
      width: 20%;
    }
    .date-column,
    .time-column {
      text-align: center;
      width: 15%;
    }
    .action-column {
      width: 10%;
      text-align: center;
    }
  }

  .applicant-selection-table,
  .applicant-view-table {
    :deep(thead tr th:first-child),
    :deep(tbody tr td:first-child) {
      text-align: center !important;
      vertical-align: middle !important;
      padding: 8px !important;
    }

    :deep(th:first-child),
    :deep(td:first-child) {
      width: 48px !important;
      min-width: 48px !important;
      max-width: 48px !important;
    }

    :deep(.q-checkbox) {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .applicant-selection-table td {
    vertical-align: top;
    padding: 20px;
  }

  .positions-list {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .position-item {
      font-size: 0.9rem;
      line-height: 1.4;
      font-weight: 500;
    }
  }

  .bg-blue-1 {
    background-color: rgba(33, 150, 243, 0.1);
  }
  .bg-green-1 {
    background-color: rgba(76, 175, 80, 0.1);
  }

  @media (max-width: 1024px) {
    .interviews-table th,
    .interviews-table td {
      padding: 6px 8px;
    }
  }
</style>
