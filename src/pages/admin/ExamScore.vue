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
      <div class="col-12 col-md-4">
        <q-input v-model="globalSearch" outlined dense placeholder="Search applicants..." clearable>
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
      </div>

      <div class="col-12 col-md-4">
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

      <!-- Date filter group -->
      <!-- <div class="col-12 col-md-6">
        <div class="row items-center">
          <div class="col-12 col-md-4" style="padding-left: 17%">
            <q-btn-toggle
              v-model="dateFilterMode"
              unelevated
              dense
              toggle-color="primary"
              :options="[
                { label: 'Specific', value: 'specific' },
                { label: 'Range', value: 'range' },
              ]"
            />
          </div>

          <div class="col-12 col-md-8" v-if="dateFilterMode === 'specific'">
            <q-input v-model="specificDate" outlined dense label="Exam Date" clearable>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="specificDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-8" v-else>
            <q-input
              :model-value="dateRangeLabel"
              outlined
              dense
              label="Exam Date Range"
              readonly
              clearable
              @clear="clearDateRange"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="dateRange" range mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </div> -->

      <div class="col-12 col-md- text-right">
        <q-btn
          rounded
          unelevated
          color="primary"
          icon="add"
          label="Add Score"
          @click="openAddDialog"
        />
      </div>
    </div>

    <!-- ── Main Table ────────────────────────────────────────────────── -->
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
        <q-card-section class="dialog-header-light">
          <q-icon name="grading" color="primary" size="28px" class="q-mr-sm" />
          <div>
            <div class="text-h6 text-bold text-grey-9">Add Exam Scores</div>
            <div class="text-caption text-grey-6">Step {{ step }} of 3 — {{ stepTitle }}</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="dialog-body q-pa-none">
          <q-stepper
            v-model="step"
            flat
            animated
            color="primary"
            header-nav
            class="q-pa-none full-height-stepper"
          >
            <q-step :name="1" title="Select Applicants" icon="person_add" :done="step > 1">
              <div class="q-pa-lg">
                <div class="row q-col-gutter-md q-mb-md items-end">
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="selectedPosition"
                      :options="positionOptions"
                      label="Filter by Position"
                      outlined
                      dense
                      use-input
                      fill-input
                      input-debounce="200"
                      clearable
                      @filter="filterPositions"
                      @update:model-value="onPositionChange"
                      @clear="onPositionChange"
                    >
                      <template #prepend><q-icon name="work" /></template>
                    </q-select>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="applicantSearch"
                      outlined
                      dense
                      clearable
                      placeholder="Search applicant..."
                      @update:model-value="fetchNoScoreWithFilters"
                      @clear="fetchNoScoreWithFilters"
                    >
                      <template #prepend><q-icon name="search" color="primary" /></template>
                    </q-input>
                  </div>
                </div>

                <q-table
                  :rows="filteredNoScoreApplicants"
                  :columns="applicantColumns"
                  row-key="submission_id"
                  selection="multiple"
                  v-model:selected="selectedApplicants"
                  v-model:pagination="noScorePagination"
                  :loading="store.loading"
                  @request="onModalRequest"
                  flat
                  class="q-mt-md"
                  wrap-cells
                >
                  <template #no-data>
                    <div class="full-width row flex-center q-pa-md text-grey">
                      No applicants without exam scores found
                    </div>
                  </template>
                </q-table>
              </div>
            </q-step>

            <q-step :name="2" title="Encoding" icon="edit_note" :done="step > 2">
              <div class="row no-wrap">
                <div class="left-panel q-pa-lg">
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

                  <q-input
                    v-model="session.exam_date"
                    label="Exam Date"
                    outlined
                    dense
                    class="q-mb-md"
                  >
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

                <q-separator vertical />

                <div class="right-panel q-pa-lg">
                  <div class="row items-center justify-between q-mb-md">
                    <div class="section-label">
                      <q-icon name="grading" size="16px" class="q-mr-xs" />
                      Encoding (Raw Score)
                    </div>
                    <q-badge color="grey-2" text-color="grey-9" class="q-pa-sm">
                      {{ encodedCount }} encoded
                    </q-badge>
                  </div>

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
                          v-model.number="p.row._draft.raw_score"
                          type="number"
                          dense
                          outlined
                          style="max-width: 160px"
                          :rules="[
                            (v) => v === null || v === '' || Number(v) >= 0 || 'Must be ≥ 0',
                            (v) =>
                              v === null ||
                              v === '' ||
                              Number(session.total_items) <= 0 ||
                              Number(v) <= Number(session.total_items) ||
                              `Max is ${session.total_items}`,
                          ]"
                          @blur="commitDraft(p.row)"
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
            </q-step>

            <q-step :name="3" title="Review" icon="visibility">
              <div class="q-pa-lg">
                <q-banner class="q-mb-md bg-blue-1 text-blue-10" rounded>
                  Please verify the scores below. If something is wrong, click
                  <b>Back</b>
                  to edit.
                </q-banner>

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
            </q-step>
          </q-stepper>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="dialog-footer q-px-lg q-py-md">
          <q-btn v-if="step === 1" flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            v-if="step === 2"
            flat
            label="Back"
            color="grey-7"
            icon="arrow_back"
            @click="step = 1"
          />
          <q-btn
            v-if="step === 3"
            flat
            label="Back"
            color="grey-7"
            icon="arrow_back"
            @click="step = 2"
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

    <!-- View Dialog (same style) -->
    <q-dialog
      v-model="showDetailDialog"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="score-dialog-card">
        <q-card-section class="dialog-header-light">
          <q-icon name="grading" color="primary" size="28px" class="q-mr-sm" />
          <div>
            <div class="text-h6 text-bold text-grey-9">Exam Score Details</div>
            <div class="text-caption text-grey-6">Viewing full exam score record</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedScore" class="dialog-body q-pa-lg detail-scroll">
          <!-- Applicant info -->
          <div class="section-label q-mb-md">
            <q-icon name="person" size="16px" class="q-mr-xs" />
            Applicant Information
          </div>

          <div class="info-group q-mb-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">First Name</div>
                  <div class="info-value">{{ selectedScore.firstname || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Last Name</div>
                  <div class="info-value">{{ selectedScore.lastname || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Position Applied</div>
                  <div class="info-value">{{ selectedScore.position || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Applicant Type</div>
                  <div class="info-value">{{ selectedScore.applicant_type || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
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
              <div class="col-12 col-md-3">
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
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Exam Type</div>
                  <div class="info-value">{{ selectedScore.exam_type || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Exam Date</div>
                  <div class="info-value">{{ selectedScore.exam_date || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
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
              <div class="col-12 col-md-4">
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

        <q-card-actions align="right" class="dialog-footer q-px-lg q-py-md">
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
        // table
        globalSearch: '',
        pagination: {
          sortBy: 'lastname',
          descending: false,
          page: 1,
          rowsPerPage: 10,
          rowsNumber: 0,
        },
        searchTimeout: null,

        // filters (main table)
        mainPositionFilter: null,
        mainPositionOptionsData: [],
        dateFilterMode: 'specific',
        specificDate: null,
        dateRange: null,

        // dialogs
        dialog: false,
        showDetailDialog: false,
        selectedScore: null,

        // stepper
        step: 1,

        // session
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

        // step 1 state
        selectedPosition: null,
        applicantSearch: '',
        selectedApplicants: [],
        positionOptionsData: [],

        // modal step-1 pagination
        noScorePagination: {
          sortBy: null,
          descending: false,
          page: 1,
          rowsPerPage: 10,
          rowsNumber: 0,
        },
        noScoreSearchTimeout: null,

        // score map
        modalScores: new Map(),
      };
    },

    computed: {
      rows() {
        return this.store.scores || [];
      },
      loading() {
        return this.store.loading;
      },

      dateRangeLabel() {
        if (!this.dateRange || !this.dateRange.from || !this.dateRange.to) return '';
        return `${this.dateRange.from} → ${this.dateRange.to}`;
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
          // { name: 'action', label: 'Action', align: 'center', field: 'action', sortable: false },
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
            style: 'width: 13%',
            headerStyle: 'width: 13%',
          },
          {
            name: 'firstname',
            label: 'First Name',
            align: 'left',
            field: 'firstname',
            sortable: true,
            style: 'width: 13%',
            headerStyle: 'width: 13%',
          },
          {
            name: 'position',
            label: 'Position',
            align: 'left',
            field: 'position',
            sortable: true,
            style: 'width: 50%',
            headerStyle: 'width: 50%',
          },
          {
            name: 'applicant_type',
            label: 'Type',
            align: 'left',
            field: 'applicant_type',
            sortable: true,
            style: 'width: 10%',
            headerStyle: 'width: 10%',
          },
          {
            name: 'status',
            label: 'Status',
            align: 'left',
            field: 'status',
            sortable: true,
            style: 'width: 10%',
            headerStyle: 'width: 10%',
          },
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

      positionOptions() {
        return this.positionOptionsData || [];
      },

      mainPositionOptions() {
        return this.mainPositionOptionsData || [];
      },

      stepTitle() {
        return ['Select Applicants', 'Encoding', 'Review'][this.step - 1] || '';
      },

      filteredNoScoreApplicants() {
        return (this.store.noScoreApplicants || []).map((a) => {
          const saved = this.modalScores.get(a.submission_id) || { raw_score: null };
          return { ...a, _saved: { ...saved }, _draft: { raw_score: saved.raw_score } };
        });
      },

      encodedCount() {
        let count = 0;
        for (const applicant of this.selectedApplicants) {
          const score = this.modalScores.get(applicant.submission_id);
          if (score && score.raw_score !== null && score.raw_score !== undefined) count++;
        }
        return count;
      },

      reviewRows() {
        return this.selectedApplicants
          .map((a) => {
            const s = this.modalScores.get(a.submission_id);
            if (!s || (s.raw_score === null && s.raw_score === undefined)) return null;
            return {
              submission_id: a.submission_id,
              firstname: a.firstname,
              lastname: a.lastname,
              position: a.position,
              raw_score: s.raw_score ?? null,
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
      specificDate() {
        if (this.dateFilterMode === 'specific') this.fetchScoresWithFilters();
      },
      dateRange: {
        handler() {
          if (this.dateFilterMode === 'range') this.fetchScoresWithFilters();
        },
        deep: true,
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
      'store.noScoreApplicants': {
        handler(newVal) {
          if (!Array.isArray(newVal)) return;
          const positions = new Set(newVal.map((a) => a.position).filter(Boolean));
          this.positionOptionsData = Array.from(positions)
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
        },
        deep: true,
      },
    },

    methods: {
      debouncedFetchScores() {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.fetchScoresWithFilters();
        }, 400);
      },

      buildMainFilters() {
        return {
          page: this.pagination.page,
          sortBy: this.pagination.sortBy,
          descending: this.pagination.descending,
          search: this.globalSearch || undefined,
          position: this.mainPositionFilter?.value ?? this.mainPositionFilter ?? undefined,
          exam_date:
            this.dateFilterMode === 'specific' && this.specificDate ? this.specificDate : undefined,
          exam_date_from:
            this.dateFilterMode === 'range' && this.dateRange?.from
              ? this.dateRange.from
              : undefined,
          exam_date_to:
            this.dateFilterMode === 'range' && this.dateRange?.to ? this.dateRange.to : undefined,
        };
      },

      fetchScoresWithFilters() {
        this.pagination.page = 1;
        const params = this.buildMainFilters();
        this.store.fetchScores({ ...params, page: 1 }).then(() => {
          this.pagination.rowsNumber = this.store.pagination.total;
        });
      },

      clearDateRange() {
        this.dateRange = null;
        this.fetchScoresWithFilters();
      },

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

      onRequest(props) {
        const { page, sortBy, descending } = props.pagination;
        this.pagination.page = page;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;

        const params = this.buildMainFilters();
        this.store.fetchScores({ ...params, page, sortBy, descending }).then(() => {
          this.pagination.rowsNumber = this.store.pagination.total;
        });
      },

      onModalRequest(props) {
        const { page, rowsPerPage } = props.pagination;
        this.noScorePagination.page = page;
        this.noScorePagination.rowsPerPage = rowsPerPage;
        this.store
          .fetchNoScoreApplicants({
            page,
            perPage: rowsPerPage,
            search: this.applicantSearch,
            position: this.selectedPosition?.value ?? this.selectedPosition ?? undefined,
          })
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
              search: this.applicantSearch,
              position: this.selectedPosition?.value ?? this.selectedPosition ?? undefined,
            })
            .then(() => {
              this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
            });
        }, 400);
      },

      viewScore(row) {
        this.selectedScore = row;
        this.showDetailDialog = true;
      },

      openAddDialog() {
        this.session = {
          exam_title: '',
          exam_type: null,
          exam_date: new Date().toISOString().split('T')[0],
          total_items: 50,
          remarks: '',
        };
        this.modalScores = new Map();
        this.selectedPosition = null;
        this.applicantSearch = '';
        this.selectedApplicants = [];
        this.noScorePagination.page = 1;
        this.step = 1;
        this.dialog = true;
        this.store.fetchNoScoreApplicants({ page: 1, perPage: 10 }).then(() => {
          this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
        });
      },

      filterPositions(val, update) {
        update(() => {
          const needle = (val || '').toLowerCase();
          const applicants = this.store.noScoreApplicants || [];
          const positions = new Set(applicants.map((a) => a.position).filter(Boolean));
          this.positionOptionsData = Array.from(positions)
            .sort()
            .filter((p) => p.toLowerCase().includes(needle))
            .map((p) => ({ label: p, value: p }));
        });
      },

      onPositionChange() {
        this.noScorePagination.page = 1;
        this.store
          .fetchNoScoreApplicants({
            page: 1,
            perPage: this.noScorePagination.rowsPerPage,
            search: this.applicantSearch,
            position: this.selectedPosition?.value ?? this.selectedPosition ?? undefined,
          })
          .then(() => {
            this.noScorePagination.rowsNumber = this.store.noScorePagination.total;
          });
      },

      commitDraft(row) {
        const raw = row._draft.raw_score;
        if (raw === null || raw === '' || raw === undefined) {
          this.modalScores.set(row.submission_id, { raw_score: null });
          return;
        }
        this.modalScores.set(row.submission_id, { raw_score: Number(raw) });
      },

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

      async saveSession() {
        const scores = Array.from(this.modalScores.entries()).filter(
          ([, score]) => score.raw_score !== null && score.raw_score !== undefined,
        );

        if (scores.length === 0) {
          this.$q.notify({ type: 'negative', message: 'Please encode at least one score' });
          return;
        }

        try {
          const payload = {
            applicants: scores.map(([submissionId, score]) => ({
              submission_id: Number(submissionId),
              exam_score: Number(score.raw_score),
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
  .score-dialog-card {
    width: 100vw;
    max-width: 1500px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    overflow: hidden;
  }

  .dialog-header-light {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: #fff;
    flex-shrink: 0;
  }

  .dialog-footer {
    background: #fff;
    flex-shrink: 0;
  }

  .dialog-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .full-height-stepper {
    height: 100%;
  }

  .left-panel {
    width: 360px;
    flex-shrink: 0;
    overflow-y: auto;
  }
  .right-panel {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
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
    overflow-y: auto;
    max-height: 65vh;
  }

  :deep(.q-table__container) {
    overflow-x: hidden !important;
  }
  :deep(.q-table) {
    table-layout: fixed;
    width: 100%;
  }
  :deep(.q-table th),
  :deep(.q-table td) {
    word-break: break-word;
    white-space: normal !important;
    overflow-wrap: break-word;
  }
</style>
