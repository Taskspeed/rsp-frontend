<template>
  <q-page class="q-pa-md">
    <!-- ── Page Header ─────────────────────────────────────────────── -->
    <div class="column items-start justify-center q-mb-md">
      <h5 class="text-h5 q-ma-none"><b>Exam Score</b></h5>
      <div class="q-pa-md q-gutter-sm">
        <q-breadcrumbs class="q-ma-none">
          <template #separator>
            <q-icon size="1.2em" name="arrow_forward" />
          </template>
          <q-breadcrumbs-el icon="grading" label="Exam Score" />
        </q-breadcrumbs>
      </div>
    </div>

    <!-- ── Filters / Toolbar ───────────────────────────────────────── -->
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-input v-model="globalSearch" outlined dense placeholder="Search applicants..." clearable>
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>

      <div class="col-12 col-sm-6 col-md-4">
        <q-select
          v-model="mainPositionFilter"
          :options="mainPositionOptions"
          label="Filter by Position"
          outlined
          dense
          clearable
        >
          <template #prepend><q-icon name="work" /></template>
        </q-select>
      </div>

      <div class="col-12 col-md-4 flex justify-end">
        <q-btn rounded unelevated color="primary" icon="add" @click="openAddDialog">
          <span class="gt-xs q-ml-xs">Add Score</span>
        </q-btn>
      </div>
    </div>

    <!-- ── Main Table ────────────────────────────────────────────────── -->
    <div class="table-scroll-wrapper">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="submission_id"
        v-model:pagination="pagination"
        :loading="loading"
        @request="onRequest"
        flat
        wrap-cells
      >
        <template #body-cell-status="p">
          <q-td :props="p">
            <q-badge :color="getStatusColor(p.row.status)" :label="p.row.status || 'N/A'" />
          </q-td>
        </template>

        <template #body-cell-exam_score="p">
          <q-td :props="p" class="text-center">
            <span class="text-body2">
              {{
                p.row.exam_score === null || p.row.exam_score === undefined
                  ? 'N/A'
                  : `${formatScore(p.row.exam_score)} / ${formatScore(p.row.exam_total_score)}`
              }}
            </span>
          </q-td>
        </template>

        <template #body-cell-action="p">
          <q-td :props="p">
            <q-btn
              flat
              round
              dense
              color="blue"
              class="bg-blue-1"
              icon="visibility"
              @click="viewScore(p.row)"
            >
              <q-tooltip>View Details</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width row flex-center q-pa-md text-grey">No Exam Scores Found</div>
        </template>
      </q-table>
    </div>

    <!-- ================================================================
         ADD SCORE DIALOG
         ================================================================ -->
    <q-dialog
      v-model="dialog"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="score-dialog-card">
        <!-- Header -->
        <q-card-section class="dialog-header-light">
          <q-icon name="grading" color="primary" size="24px" class="q-mr-sm gt-xs" />
          <div>
            <div class="text-h6 text-bold text-grey-9">Add Exam Scores</div>
            <div class="text-caption text-grey-6">Step {{ step }} of 3 — {{ stepTitle }}</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-separator />

        <!-- Stepper header -->
        <div class="stepper-tabs row q-px-md q-pt-sm">
          <div
            v-for="(s, i) in stepDefs"
            :key="i"
            class="stepper-tab"
            :class="{ active: step === i + 1, done: step > i + 1 }"
          >
            <q-icon :name="step > i + 1 ? 'check_circle' : s.icon" size="18px" class="q-mr-xs" />
            <span class="gt-xs">{{ s.title }}</span>
          </div>
        </div>

        <q-separator />

        <!-- Dialog Body -->
        <div class="dialog-body">
          <!-- ── Step 1: Select Applicants ── -->
          <div v-if="step === 1" class="q-pa-md">
            <div class="row q-col-gutter-md q-mb-md items-end">
              <div class="col-12 col-sm-6">
                <!--
                  FIX: emit-value + map-options so v-model holds the raw string (not an object).
                       @filter does a fast client-side search over allPositionOptions.
                       @update:model-value fires the API fetch with the selected string.
                       @clear resets and re-fetches without a position filter.
                -->
                <q-select
                  v-model="selectedPosition"
                  :options="positionOptionsData"
                  label="Filter by Position"
                  outlined
                  dense
                  use-input
                  input-debounce="200"
                  clearable
                  emit-value
                  map-options
                  @filter="filterPositions"
                  @update:model-value="onPositionChange"
                  @clear="onPositionClear"
                >
                  <template #prepend><q-icon name="work" /></template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">No positions found</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="applicantSearch"
                  outlined
                  dense
                  clearable
                  placeholder="Search applicant..."
                  @update:model-value="fetchNoScoreWithFilters"
                  @clear="onApplicantSearchClear"
                >
                  <template #prepend><q-icon name="search" color="primary" /></template>
                </q-input>
              </div>
            </div>

            <div class="table-scroll-wrapper">
              <q-table
                :rows="store.noScoreApplicants"
                :columns="applicantColumns"
                row-key="submission_id"
                selection="multiple"
                v-model:selected="selectedApplicants"
                v-model:pagination="noScorePagination"
                :loading="store.loading"
                @request="onModalRequest"
                flat
                wrap-cells
              >
                <template #no-data>
                  <div class="full-width row flex-center q-pa-md text-grey">
                    No applicants without exam scores found
                  </div>
                </template>
              </q-table>
            </div>
          </div>

          <!-- ── Step 2: Encoding ── -->
          <div v-if="step === 2" class="step2-layout">
            <!-- Left: Exam Setup -->
            <div class="step2-left q-pa-md">
              <div class="section-label q-mb-md">
                <q-icon name="fact_check" size="16px" class="q-mr-xs" />
                Exam Setup
              </div>

              <q-input
                v-model="session.exam_title"
                label="Exam Details"
                outlined
                dense
                class="q-mb-md"
              >
                <template #prepend><q-icon name="description" size="18px" /></template>
              </q-input>

              <q-select
                v-model="session.exam_type"
                :options="examTypeOptions"
                label="Exam Type"
                outlined
                dense
                emit-value
                map-options
                clearable
                class="q-mb-md"
              >
                <template #prepend><q-icon name="category" size="18px" /></template>
              </q-select>

              <q-input
                v-model.number="session.total_items"
                label="Total Score"
                type="number"
                outlined
                dense
                class="q-mb-md"
                :rules="[(v) => Number(v) > 0 || 'Total score must be > 0']"
              >
                <template #prepend><q-icon name="numbers" size="18px" /></template>
              </q-input>

              <q-input v-model="session.exam_date" label="Exam Date" outlined dense class="q-mb-md">
                <template #prepend><q-icon name="event" size="18px" /></template>
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="session.exam_date" mask="YYYY-MM-DD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-input
                v-model="session.remarks"
                label="Remarks"
                type="textarea"
                outlined
                dense
                rows="3"
                class="q-mb-md"
              >
                <template #prepend><q-icon name="notes" size="18px" /></template>
              </q-input>
            </div>

            <q-separator :vertical="!isMobile" />

            <!-- Right: Score Encoding -->
            <div class="step2-right q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <div class="section-label">
                  <q-icon name="grading" size="16px" class="q-mr-xs" />
                  Encoding (Raw Score)
                </div>
                <q-badge color="grey-2" text-color="grey-9" class="q-pa-sm">
                  {{ encodedCount }} encoded
                </q-badge>
              </div>

              <div class="table-scroll-wrapper">
                <q-table
                  :rows="selectedApplicants"
                  :columns="encodeColumns"
                  row-key="submission_id"
                  flat
                  wrap-cells
                >
                  <template #body-cell-score="p">
                    <q-td :props="p">
                      <q-input
                        v-model.number="draftScores[p.row.submission_id]"
                        type="number"
                        dense
                        outlined
                        style="min-width: 120px; max-width: 160px"
                        :rules="[
                          (v) =>
                            v === null ||
                            v === '' ||
                            v === undefined ||
                            Number(v) >= 0 ||
                            'Must be ≥ 0',
                          (v) =>
                            v === null ||
                            v === '' ||
                            v === undefined ||
                            Number(session.total_items) <= 0 ||
                            Number(v) <= Number(session.total_items) ||
                            `Max is ${session.total_items}`,
                        ]"
                        @update:model-value="(val) => commitScore(p.row.submission_id, val)"
                        @blur="() => commitScoreFromBlur(p.row.submission_id)"
                      >
                        <template #append>
                          <div class="text-caption text-grey-7 q-pr-xs">
                            / {{ session.total_items || 0 }}
                          </div>
                        </template>
                      </q-input>
                    </q-td>
                  </template>

                  <template #no-data>
                    <div class="full-width row flex-center q-pa-md text-grey">
                      No applicants selected
                    </div>
                  </template>
                </q-table>
              </div>
            </div>
          </div>

          <!-- ── Step 3: Review ── -->
          <div v-if="step === 3" class="q-pa-md">
            <q-banner class="q-mb-md bg-blue-1 text-blue-10" rounded>
              Please verify the scores below. If something is wrong, click
              <b>Back</b>
              to edit.
            </q-banner>

            <div class="table-scroll-wrapper">
              <q-table
                :rows="reviewRows"
                :columns="reviewColumns"
                row-key="submission_id"
                flat
                wrap-cells
              >
                <template #body-cell-score="p">
                  <q-td :props="p" class="text-center">
                    <span class="text-body2">
                      {{
                        p.row.raw_score === null || p.row.raw_score === undefined
                          ? 'N/A'
                          : `${formatScore(p.row.raw_score)} / ${formatScore(p.row.total_items)}`
                      }}
                    </span>
                  </q-td>
                </template>

                <template #no-data>
                  <div class="full-width row flex-center q-pa-md text-grey">
                    No encoded applicants yet
                  </div>
                </template>
              </q-table>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <q-separator />
        <q-card-actions align="right" class="dialog-footer q-px-md q-py-sm">
          <q-btn v-if="step === 1" flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            v-if="step > 1"
            flat
            label="Back"
            color="grey-7"
            icon="arrow_back"
            @click="step--"
          />
          <q-btn
            v-if="step === 1"
            unelevated
            label="Next"
            color="primary"
            icon-right="arrow_forward"
            :disable="selectedApplicants.length === 0"
            @click="step = 2"
          />
          <q-btn
            v-if="step === 2"
            unelevated
            label="Next"
            color="primary"
            icon-right="arrow_forward"
            @click="goToReview"
          />
          <q-btn
            v-if="step === 3"
            unelevated
            label="Save"
            color="primary"
            icon="save"
            :disable="reviewRows.length === 0"
            :loading="store.loading"
            @click="saveSession"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================================================
         VIEW DIALOG
         ================================================================ -->
    <q-dialog
      v-model="showDetailDialog"
      persistent
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="view-dialog-card">
        <q-card-section class="dialog-header-light">
          <q-icon name="grading" color="primary" size="24px" class="q-mr-sm gt-xs" />
          <div>
            <div class="text-h6 text-bold text-grey-9">Exam Score Details</div>
            <div class="text-caption text-grey-6">Viewing full exam score record</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedScore" class="detail-scroll q-pa-lg">
          <!-- Applicant info -->
          <div class="section-label q-mb-md">
            <q-icon name="person" size="16px" class="q-mr-xs" />
            Applicant Information
          </div>

          <div class="info-group q-mb-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">First Name</div>
                  <div class="info-value">{{ selectedScore.firstname || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Last Name</div>
                  <div class="info-value">{{ selectedScore.lastname || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Position Applied</div>
                  <div class="info-value">{{ selectedScore.position || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Applicant Type</div>
                  <div class="info-value">{{ selectedScore.applicant_type || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Control No</div>
                  <div class="info-value">{{ selectedScore.ControlNo || 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Score details -->
          <div class="section-label q-mb-md">
            <q-icon name="grading" size="16px" class="q-mr-xs" />
            Score Details
          </div>

          <div class="info-group q-mb-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-3">
                <div class="info-field">
                  <div class="info-label">Status</div>
                  <div class="info-value">
                    <q-badge
                      :color="getStatusColor(selectedScore.status)"
                      :label="selectedScore.status || 'N/A'"
                    />
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Exam Type</div>
                  <div class="info-value">{{ selectedScore.exam_type || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Exam Date</div>
                  <div class="info-value">{{ selectedScore.exam_date || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Raw Score</div>
                  <div class="info-value">
                    {{
                      selectedScore.exam_score === null || selectedScore.exam_score === undefined
                        ? 'N/A'
                        : formatScore(selectedScore.exam_score)
                    }}
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <div class="info-field">
                  <div class="info-label">Total Score</div>
                  <div class="info-value">
                    {{
                      selectedScore.exam_total_score === null ||
                      selectedScore.exam_total_score === undefined
                        ? 'N/A'
                        : formatScore(selectedScore.exam_total_score)
                    }}
                  </div>
                </div>
              </div>
              <div v-if="selectedScore.exam_remarks" class="col-12">
                <div class="info-field">
                  <div class="info-label">Remarks</div>
                  <div class="info-value">{{ selectedScore.exam_remarks }}</div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="dialog-footer q-px-md q-py-sm">
          <q-btn flat label="Close" color="grey-7" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
  import { useExamScoreStore } from 'src/stores/examScoreStore';

  export default {
    name: 'ExamScorePage',

    setup() {
      const store = useExamScoreStore();
      return { store };
    },

    data() {
      return {
        globalSearch: '',
        pagination: {
          sortBy: 'lastname',
          descending: false,
          page: 1,
          rowsPerPage: 10,
          rowsNumber: 0,
        },
        searchTimeout: null,

        mainPositionFilter: null,
        mainPositionOptionsData: [],

        dialog: false,
        showDetailDialog: false,
        selectedScore: null,

        step: 1,

        stepDefs: [
          { title: 'Select Applicants', icon: 'person_add' },
          { title: 'Encoding', icon: 'edit_note' },
          { title: 'Review', icon: 'visibility' },
        ],

        session: {
          exam_title: '',
          exam_type: null,
          exam_date: new Date().toISOString().split('T')[0],
          total_items: 50,
          remarks: '',
        },
        examTypeOptions: [
          { label: 'Written', value: 'written' },
          { label: 'Practical', value: 'practical' },
          { label: 'Interview', value: 'interview' },
        ],

        // With emit-value + map-options, selectedPosition is always a plain string (or null).
        selectedPosition: null,
        applicantSearch: '',
        selectedApplicants: [],

        // Full de-duplicated position list loaded once when the dialog opens.
        // Client-side filtering slices this — no extra round-trips needed.
        allPositionOptions: [],
        // The subset shown in the dropdown after the user types.
        positionOptionsData: [],

        noScorePagination: {
          sortBy: null,
          descending: false,
          page: 1,
          rowsPerPage: 10,
          rowsNumber: 0,
        },
        noScoreSearchTimeout: null,

        // Committed scores — plain object so Vue tracks changes reactively.
        // key: String(submission_id), value: number | null
        modalScores: {},
        // Draft values bound directly to the q-input fields via v-model.
        // key: submission_id (number/string), value: number | null | ''
        draftScores: {},
      };
    },

    computed: {
      rows() {
        return this.store.scores || [];
      },
      loading() {
        return this.store.loading;
      },
      isMobile() {
        return this.$q.screen.lt.md;
      },

      columns() {
        return [
          {
            name: 'lastname',
            label: 'Last Name',
            align: 'left',
            field: 'lastname',
            sortable: true,
          },
          {
            name: 'firstname',
            label: 'First Name',
            align: 'left',
            field: 'firstname',
            sortable: true,
          },
          { name: 'position', label: 'Position', align: 'left', field: 'position', sortable: true },
          {
            name: 'exam_type',
            label: 'Exam Type',
            align: 'left',
            field: 'exam_type',
            sortable: true,
          },
          {
            name: 'exam_date',
            label: 'Exam Date',
            align: 'left',
            field: 'exam_date',
            sortable: true,
          },
          {
            name: 'exam_score',
            label: 'Score',
            align: 'center',
            field: 'exam_score',
            sortable: true,
          },
          { name: 'action', label: 'Action', align: 'center', field: 'action', sortable: false },
        ];
      },

      applicantColumns() {
        return [
          {
            name: 'lastname',
            label: 'Last Name',
            align: 'left',
            field: 'lastname',
            sortable: true,
          },
          {
            name: 'firstname',
            label: 'First Name',
            align: 'left',
            field: 'firstname',
            sortable: true,
          },
          { name: 'position', label: 'Position', align: 'left', field: 'position', sortable: true },
          {
            name: 'applicant_type',
            label: 'Type',
            align: 'left',
            field: 'applicant_type',
            sortable: true,
          },
          { name: 'status', label: 'Status', align: 'left', field: 'status', sortable: true },
        ];
      },

      encodeColumns() {
        return [
          {
            name: 'lastname',
            label: 'Last Name',
            align: 'left',
            field: 'lastname',
            sortable: true,
          },
          {
            name: 'firstname',
            label: 'First Name',
            align: 'left',
            field: 'firstname',
            sortable: true,
          },
          { name: 'position', label: 'Position', align: 'left', field: 'position', sortable: true },
          { name: 'score', label: 'Raw Score', align: 'left', field: 'raw_score', sortable: false },
        ];
      },

      reviewColumns() {
        return [
          {
            name: 'lastname',
            label: 'Last Name',
            align: 'left',
            field: 'lastname',
            sortable: true,
          },
          {
            name: 'firstname',
            label: 'First Name',
            align: 'left',
            field: 'firstname',
            sortable: true,
          },
          { name: 'position', label: 'Position', align: 'left', field: 'position', sortable: true },
          { name: 'score', label: 'Score', align: 'center', field: 'score', sortable: false },
        ];
      },

      mainPositionOptions() {
        return this.mainPositionOptionsData;
      },

      stepTitle() {
        return ['Select Applicants', 'Encoding', 'Review'][this.step - 1] || '';
      },

      encodedCount() {
        return this.selectedApplicants.filter((a) => {
          const score = this.modalScores[String(a.submission_id)];
          return score !== null && score !== undefined && score !== '';
        }).length;
      },

      reviewRows() {
        return this.selectedApplicants
          .map((a) => {
            const key = String(a.submission_id);
            const raw = this.modalScores[key];
            if (raw === null || raw === undefined || raw === '') return null;
            return {
              submission_id: a.submission_id,
              firstname: a.firstname,
              lastname: a.lastname,
              position: a.position,
              raw_score: Number(raw),
              total_items: Number(this.session.total_items) || 0,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (a.lastname || '').localeCompare(b.lastname || ''));
      },
    },

    watch: {
      globalSearch() {
        this.debouncedFetchScores();
      },
      mainPositionFilter() {
        this.fetchScoresWithFilters();
      },
      'store.scores': {
        handler(newVal) {
          if (!Array.isArray(newVal)) return;
          const positions = new Set(newVal.map((a) => a.position).filter(Boolean));
          this.mainPositionOptionsData = Array.from(positions)
            .sort()
            .map((p) => ({ label: p, value: p }));
        },
        deep: true,
      },
      'store.noScorePagination': {
        handler(val) {
          if (!val) return;
          this.noScorePagination.page = val.currentPage || 1;
          this.noScorePagination.rowsPerPage = val.perPage || 10;
          this.noScorePagination.rowsNumber = val.total || 0;
        },
        deep: true,
      },
    },

    methods: {
      // ── Utilities ────────────────────────────────────────────────────

      formatScore(value) {
        if (value === null || value === undefined) return 'N/A';
        const num = Number(value);
        if (!Number.isFinite(num)) return 'N/A';
        return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(2)));
      },

      getStatusColor(status) {
        if (!status) return 'grey';
        const s = status.toLowerCase();
        if (s === 'qualified') return 'positive';
        if (s === 'hired') return 'blue';
        if (s === 'unqualified') return 'negative';
        return 'grey-7';
      },

      // Returns a clean string suitable for sending as an API param.
      // Guards against both plain strings and accidental { label, value } objects.
      resolvePositionValue(pos) {
        if (!pos) return undefined;
        if (typeof pos === 'object' && pos !== null) return pos.value || undefined;
        if (typeof pos === 'string' && pos.trim() !== '') return pos.trim();
        return undefined;
      },

      // ── Main table ───────────────────────────────────────────────────

      debouncedFetchScores() {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.fetchScoresWithFilters(), 400);
      },

      buildMainFilters() {
        return {
          page: this.pagination.page,
          sortBy: this.pagination.sortBy,
          descending: this.pagination.descending,
          search: this.globalSearch || undefined,
          position: this.mainPositionFilter?.value ?? this.mainPositionFilter ?? undefined,
        };
      },

      fetchScoresWithFilters() {
        this.pagination.page = 1;
        this.store.fetchScores({ ...this.buildMainFilters(), page: 1 }).then(() => {
          this.pagination.rowsNumber = this.store.pagination.total;
        });
      },

      onRequest(props) {
        const { page, sortBy, descending } = props.pagination;
        this.pagination.page = page;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;
        this.store
          .fetchScores({ ...this.buildMainFilters(), page, sortBy, descending })
          .then(() => {
            this.pagination.rowsNumber = this.store.pagination.total;
          });
      },

      // ── Modal table ──────────────────────────────────────────────────

      buildModalFilters() {
        return {
          search: this.applicantSearch || undefined,
          position: this.resolvePositionValue(this.selectedPosition),
        };
      },

      onModalRequest(props) {
        const { page, rowsPerPage } = props.pagination;
        this.noScorePagination.page = page;
        this.noScorePagination.rowsPerPage = rowsPerPage;
        this.store
          .fetchNoScoreApplicants({ page, perPage: rowsPerPage, ...this.buildModalFilters() })
          .then(() => {
            this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
          });
      },

      fetchNoScoreWithFilters() {
        if (this.noScoreSearchTimeout) clearTimeout(this.noScoreSearchTimeout);
        this.noScoreSearchTimeout = setTimeout(() => {
          this.noScorePagination.page = 1;
          this.store
            .fetchNoScoreApplicants({
              page: 1,
              perPage: this.noScorePagination.rowsPerPage,
              ...this.buildModalFilters(),
            })
            .then(() => {
              this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
            });
        }, 400);
      },

      // ── Position filter (modal) ──────────────────────────────────────

      // Called by q-select's @filter event while the user is typing.
      // Searches allPositionOptions client-side — no API call needed here.
      filterPositions(val, update) {
        const needle = (val || '').toLowerCase().trim();
        update(() => {
          this.positionOptionsData = needle
            ? this.allPositionOptions.filter((o) => o.label.toLowerCase().includes(needle))
            : [...this.allPositionOptions];
        });
      },

      // Called by @update:model-value when the user selects an option.
      // Because of emit-value, `val` is the raw string (e.g. "Engineer").
      onPositionChange(val) {
        this.noScorePagination.page = 1;
        this.store
          .fetchNoScoreApplicants({
            page: 1,
            perPage: this.noScorePagination.rowsPerPage,
            search: this.applicantSearch || undefined,
            position: this.resolvePositionValue(val),
          })
          .then(() => {
            this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
          });
      },

      // Called by @clear when the user clicks the × on the position select.
      onPositionClear() {
        this.selectedPosition = null;
        this.positionOptionsData = [...this.allPositionOptions];
        this.noScorePagination.page = 1;
        this.store
          .fetchNoScoreApplicants({
            page: 1,
            perPage: this.noScorePagination.rowsPerPage,
            search: this.applicantSearch || undefined,
          })
          .then(() => {
            this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
          });
      },

      // Called by @clear on the applicant search input.
      onApplicantSearchClear() {
        this.applicantSearch = '';
        this.noScorePagination.page = 1;
        this.store
          .fetchNoScoreApplicants({
            page: 1,
            perPage: this.noScorePagination.rowsPerPage,
            position: this.resolvePositionValue(this.selectedPosition),
          })
          .then(() => {
            this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
          });
      },

      // ── View ─────────────────────────────────────────────────────────

      viewScore(row) {
        this.selectedScore = row;
        this.showDetailDialog = true;
      },

      // ── Open Add Dialog ──────────────────────────────────────────────

      async openAddDialog() {
        // Reset all dialog state
        this.session = {
          exam_title: '',
          exam_type: null,
          exam_date: new Date().toISOString().split('T')[0],
          total_items: 50,
          remarks: '',
        };
        this.modalScores = {};
        this.draftScores = {};
        this.selectedPosition = null;
        this.applicantSearch = '';
        this.selectedApplicants = [];
        this.allPositionOptions = [];
        this.positionOptionsData = [];
        this.noScorePagination.page = 1;
        this.step = 1;
        this.dialog = true;

        // Step 1 — build the full position list for the dropdown.
        // Fetch a large page once so the dropdown has every position available
        // without needing a separate endpoint.
        try {
          await this.store.fetchNoScoreApplicants({ page: 1, perPage: 9999 });
          const positions = new Set(
            (this.store.noScoreApplicants || []).map((a) => a.position).filter(Boolean),
          );
          const opts = Array.from(positions)
            .sort()
            .map((p) => ({ label: p, value: p }));
          this.allPositionOptions = opts;
          this.positionOptionsData = [...opts];
        } catch {
          // Non-fatal — table still works, dropdown will be empty
        }

        // Step 2 — fetch the normal paginated first page for the table display.
        await this.store
          .fetchNoScoreApplicants({ page: 1, perPage: this.noScorePagination.rowsPerPage })
          .then(() => {
            this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
          });
      },

      // ── Score commit ─────────────────────────────────────────────────

      // Fires on every keystroke so reviewRows stays in sync immediately.
      commitScore(submissionId, val) {
        const key = String(submissionId);
        if (val === null || val === '' || val === undefined) {
          this.modalScores[key] = null;
        } else {
          const num = Number(val);
          this.modalScores[key] = Number.isFinite(num) ? num : null;
        }
        // Spread to a new object so Vue's reactivity system detects the change.
        this.modalScores = { ...this.modalScores };
      },

      // Safety-net: fires on blur in case the input was filled by
      // autocomplete or another mechanism that bypassed the input event.
      commitScoreFromBlur(submissionId) {
        this.commitScore(submissionId, this.draftScores[submissionId]);
      },

      // ── Step navigation ──────────────────────────────────────────────

      goToReview() {
        if (
          !this.session.exam_title ||
          !this.session.exam_type ||
          Number(this.session.total_items) <= 0
        ) {
          this.$q.notify({ type: 'negative', message: 'Please fill all exam details' });
          return;
        }
        if (this.encodedCount === 0) {
          this.$q.notify({ type: 'negative', message: 'Please encode at least one score' });
          return;
        }
        this.step = 3;
      },

      // ── Save ─────────────────────────────────────────────────────────

      async saveSession() {
        const scoredApplicants = this.selectedApplicants.filter((a) => {
          const raw = this.modalScores[String(a.submission_id)];
          return raw !== null && raw !== undefined && raw !== '';
        });

        if (scoredApplicants.length === 0) {
          this.$q.notify({ type: 'negative', message: 'Please encode at least one score' });
          return;
        }

        try {
          const payload = {
            applicants: scoredApplicants.map((a) => ({
              submission_id: Number(a.submission_id),
              exam_score: Number(this.modalScores[String(a.submission_id)]),
              exam_details: this.session.exam_title,
              exam_type: this.session.exam_type,
              exam_total_score: Number(this.session.total_items),
              exam_date: this.session.exam_date,
              exam_remarks: this.session.remarks || '',
            })),
          };

          await this.store.saveScores(payload);
          this.$q.notify({ type: 'positive', message: 'All exam scores saved successfully' });
          this.dialog = false;
          await this.store.fetchScores({ page: 1 });
          this.pagination.rowsNumber = this.store.pagination.total;
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Error saving exam scores',
          });
        }
      },
    },

    mounted() {
      this.store.fetchScores({ page: 1 }).then(() => {
        this.pagination.rowsNumber = this.store.pagination.total;
      });
    },
  };
</script>

<style scoped>
  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .score-dialog-card {
    width: 90vw;
    height: 90vh;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    overflow: hidden;
  }

  .view-dialog-card {
    width: 95vw;
    max-width: 860px;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
  }

  .dialog-header-light {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    flex-shrink: 0;
  }

  .stepper-tabs {
    gap: 0;
    background: #fff;
    flex-shrink: 0;
  }
  .stepper-tab {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #9e9e9e;
    letter-spacing: 0.04em;
    border-bottom: 3px solid transparent;
    transition:
      color 0.2s,
      border-color 0.2s;
    white-space: nowrap;
  }
  .stepper-tab.active {
    color: #1976d2;
    border-bottom-color: #1976d2;
  }
  .stepper-tab.done {
    color: #2e7d32;
  }

  .dialog-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .dialog-footer {
    background: #fff;
    flex-shrink: 0;
  }

  .step2-layout {
    display: flex;
    flex-direction: row;
    height: 100%;
    min-height: 0;
  }

  .step2-left {
    width: 340px;
    min-width: 280px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .step2-right {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
  }

  @media (max-width: 767px) {
    .step2-layout {
      flex-direction: column;
    }
    .step2-left {
      width: 100%;
      min-width: unset;
      flex-shrink: unset;
      overflow-y: visible;
    }
    .step2-right {
      overflow-y: visible;
    }
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9e9e9e;
    display: flex;
    align-items: center;
  }

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

  .detail-scroll {
    flex: 1;
    overflow-y: auto;
  }
</style>
