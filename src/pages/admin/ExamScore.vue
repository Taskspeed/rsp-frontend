<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
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

    <!-- Table Toolbar -->
    <div class="row justify-between items-center q-mb-md">
      <q-input
        v-model="globalSearch"
        outlined
        dense
        placeholder="Search applicants..."
        style="max-width: 300px"
        clearable
      >
        <template #prepend>
          <q-icon name="search" color="primary" />
        </template>
      </q-input>

      <q-btn
        rounded
        unelevated
        color="primary"
        icon="add"
        label="Add Score"
        @click="openAddDialog()"
      />
    </div>

    <!-- Main Table -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      v-model:pagination="pagination"
      :rows-number="total"
      :loading="loading"
      @request="onRequest"
      :rows-per-page-options="[10, 20, 50, 100]"
      flat
    >
      <template #body-cell-score="p">
        <q-td :props="p" class="text-center">
          <q-badge
            :color="getScoreColor(p.row.raw_score, p.row.total_items)"
            :label="p.row.raw_score === null ? 'N/A' : `${p.row.raw_score}/${p.row.total_items}`"
          />
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

    <!-- ================================================================ -->
    <!-- STEP MODAL: Step 1 Encode -> Step 2 Review -> Save               -->
    <!-- ================================================================ -->
    <q-dialog v-model="dialog" persistent maximized-mobile>
      <q-card class="score-dialog-card">
        <!-- Header -->
        <q-card-section class="dialog-header header-add">
          <div class="row items-center no-wrap">
            <q-icon name="grading" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-bold">Add Exam Scores</div>
              <div class="text-caption opacity-80">
                Step {{ step }} of 2 — {{ step === 1 ? 'Encoding' : 'Review' }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="close-btn" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-sm">
          <q-stepper v-model="step" flat animated color="primary" header-nav class="q-pa-none">
            <!-- ===================== Step 1: Encoding ===================== -->
            <q-step :name="1" title="Encoding" icon="edit_note" :done="step > 1">
              <div class="row no-wrap">
                <!-- Left Panel -->
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

                  <q-separator class="q-my-md" />

                  <div class="section-label q-mb-sm">
                    <q-icon name="work" size="16px" class="q-mr-xs" />
                    Position + Applicants
                  </div>

                  <q-select
                    v-model="selectedPosition"
                    :options="positionOptions"
                    label="Position Available"
                    outlined
                    dense
                    use-input
                    fill-input
                    input-debounce="200"
                    clearable
                    @filter="filterPositions"
                  />

                  <q-input
                    v-model="applicantSearch"
                    outlined
                    dense
                    clearable
                    class="q-mt-sm"
                    placeholder="Search applicant..."
                  >
                    <template #prepend><q-icon name="search" color="primary" /></template>
                  </q-input>
                </div>

                <q-separator vertical />

                <!-- Right Panel -->
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

                  <!-- Modal table WITHOUT action column -->
                  <q-table
                    :rows="pagedApplicants"
                    :columns="encodeColumns"
                    row-key="id"
                    v-model:pagination="encodePagination"
                    :rows-number="filteredApplicants.length"
                    :rows-per-page-options="[10, 20, 50]"
                    flat
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
                            (v) => v === null || v === '' || Number(v) >= 0 || 'Must be >= 0',
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
                        No applicants found for the selected filter
                      </div>
                    </template>
                  </q-table>
                </div>
              </div>

              <!-- Navigation: left = Cancel, right = Next -->
              <q-stepper-navigation class="q-mt-md">
                <div class="row items-center justify-between">
                  <q-btn rounded flat color="grey-7" label="Cancel" v-close-popup />

                  <q-btn
                    rounded
                    unelevated
                    color="primary"
                    label="Next"
                    icon-right="arrow_forward"
                    @click="goToReview"
                  />
                </div>
              </q-stepper-navigation>
            </q-step>

            <!-- ===================== Step 2: Review ===================== -->
            <q-step :name="2" title="Review" icon="visibility">
              <div class="q-pa-lg">
                <div class="row q-col-gutter-md items-end">
                  <div class="col-12 col-md-4">
                    <q-select
                      v-model="reviewPosition"
                      :options="positionOptions"
                      label="Filter by Position"
                      outlined
                      dense
                      use-input
                      fill-input
                      input-debounce="200"
                      clearable
                      @filter="filterPositions"
                    />
                  </div>

                  <div class="col-12 col-md-8">
                    <q-input
                      v-model="reviewSearch"
                      outlined
                      dense
                      clearable
                      placeholder="Search in review..."
                    >
                      <template #prepend><q-icon name="search" color="primary" /></template>
                    </q-input>
                  </div>
                </div>

                <q-banner class="q-mt-md bg-blue-1 text-blue-10" rounded>
                  Please verify the scores below. If something is wrong, click
                  <b>Back</b>
                  to edit.
                </q-banner>

                <div class="q-mt-md">
                  <q-table :rows="reviewRows" :columns="reviewColumns" row-key="id" flat>
                    <template #body-cell-score="p">
                      <q-td :props="p" class="text-center">
                        <q-badge
                          :color="getScoreColor(p.row.raw_score, p.row.total_items)"
                          :label="
                            p.row.raw_score === null
                              ? 'N/A'
                              : `${p.row.raw_score}/${p.row.total_items}`
                          "
                        />
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

              <!-- Navigation: left = Back, right = Save -->
              <q-stepper-navigation class="q-mt-md">
                <div class="row items-center justify-between">
                  <q-btn
                    rounded
                    flat
                    color="grey-8"
                    label="Back"
                    icon="arrow_back"
                    @click="step = 1"
                  />

                  <q-btn
                    rounded
                    unelevated
                    color="primary"
                    label="Save"
                    icon="save"
                    :disable="reviewRows.length === 0"
                    :loading="loading"
                    @click="saveSession"
                  />
                </div>
              </q-stepper-navigation>
            </q-step>
          </q-stepper>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailDialog" persistent maximized-mobile>
      <q-card class="score-dialog-card">
        <q-card-section class="dialog-header header-view">
          <div class="row items-center no-wrap">
            <q-icon name="grading" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-bold">Exam Score Details</div>
              <div class="text-caption opacity-80">Viewing full exam score record</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="close-btn" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section
          v-if="selectedScore"
          class="q-pa-lg"
          style="overflow-y: auto; max-height: 65vh"
        >
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
            </div>
          </div>

          <div class="section-label q-mb-md">
            <q-icon name="grading" size="16px" class="q-mr-xs" />
            Score Details
          </div>

          <div class="info-group q-mb-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <div class="info-field">
                  <div class="info-label">Exam</div>
                  <div class="info-value">{{ selectedScore.exam_title || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-3">
                <div class="info-field">
                  <div class="info-label">Exam Type</div>
                  <div class="info-value">{{ selectedScore.exam_type || 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-3">
                <div class="info-field">
                  <div class="info-label">Exam Date</div>
                  <div class="info-value">{{ selectedScore.exam_date || 'N/A' }}</div>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Raw Score</div>
                  <div class="info-value">{{ selectedScore.raw_score ?? 'N/A' }}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="info-field">
                  <div class="info-label">Total Score</div>
                  <div class="info-value">{{ selectedScore.total_items ?? 'N/A' }}</div>
                </div>
              </div>

              <div v-if="selectedScore.remarks" class="col-12">
                <div class="info-field">
                  <div class="info-label">Remarks</div>
                  <div class="info-value">{{ selectedScore.remarks }}</div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />
        <div class="dialog-footer row justify-end items-center q-pa-md">
          <q-btn rounded flat label="Close" color="grey-7" v-close-popup />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';

  let searchTimeout = null;

  // ---------------------------
  // Static data (table rows)
  // ---------------------------
  const allScores = ref([
    {
      id: 1,
      firstname: 'Ana',
      lastname: 'Santos',
      position: 'Developer',
      exam_title: 'JavaScript Basics',
      exam_type: 'Written',
      exam_date: '2026-03-01',
      raw_score: 45,
      total_items: 50,
      remarks: 'Excellent',
    },
  ]);

  // Applicants list for modal dropdown (static)
  const applicants = ref([
    { id: 101, firstname: 'Ana', lastname: 'Santos', position: 'Developer' },
    { id: 102, firstname: 'Ben', lastname: 'Cruz', position: 'Developer' },
    { id: 103, firstname: 'Cara', lastname: 'Reyes', position: 'QA Engineer' },
    { id: 104, firstname: 'Dino', lastname: 'Lopez', position: 'QA Engineer' },
    { id: 105, firstname: 'Elle', lastname: 'Garcia', position: 'Support' },
  ]);

  // q-table data
  const rows = ref([]);
  const total = ref(0);
  const loading = ref(false);

  const globalSearch = ref('');

  const pagination = ref({
    sortBy: 'lastname',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });

  const columns = computed(() => [
    { name: 'lastname', label: 'Last Name', align: 'left', field: 'lastname', sortable: true },
    { name: 'firstname', label: 'First Name', align: 'left', field: 'firstname', sortable: true },
    {
      name: 'position',
      label: 'Position Applied',
      align: 'left',
      field: 'position',
      sortable: true,
    },
    { name: 'exam_title', label: 'Exam', align: 'left', field: 'exam_title', sortable: true },
    { name: 'exam_date', label: 'Exam Date', align: 'left', field: 'exam_date', sortable: true },
    { name: 'score', label: 'Score', align: 'center', field: 'score', sortable: false },
    { name: 'action', label: 'Action', align: 'center', field: 'action', sortable: false },
  ]);

  const getScoreColor = (raw, totalItems) => {
    if (raw === null || raw === undefined) return 'grey';
    const r = Number(raw);
    const t = Number(totalItems);
    if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return 'grey';

    const pct = (r / t) * 100;
    if (pct >= 85) return 'positive';
    if (pct >= 75) return 'orange';
    return 'negative';
  };

  // local filter/sort/paginate for main table
  const applyLocalQuery = () => {
    loading.value = true;

    const search = (globalSearch.value || '').trim().toLowerCase();
    let filtered = [...allScores.value];

    if (search) {
      filtered = filtered.filter((r) => {
        const haystack = [
          r.firstname,
          r.lastname,
          r.position,
          r.exam_title,
          r.exam_type,
          r.exam_date,
          r.raw_score,
          r.total_items,
          r.remarks,
        ]
          .map((x) => (x ?? '').toString().toLowerCase())
          .join(' ');
        return haystack.includes(search);
      });
    }

    const { sortBy, descending, page, rowsPerPage } = pagination.value;
    if (sortBy) {
      filtered.sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;

        if (typeof av === 'number' && typeof bv === 'number') return descending ? bv - av : av - bv;
        const as = av.toString().toLowerCase();
        const bs = bv.toString().toLowerCase();
        if (as < bs) return descending ? 1 : -1;
        if (as > bs) return descending ? -1 : 1;
        return 0;
      });
    }

    total.value = filtered.length;
    pagination.value.rowsNumber = total.value;

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    rows.value = filtered.slice(start, end);

    loading.value = false;
  };

  const onRequest = (props) => {
    pagination.value = { ...pagination.value, ...props.pagination };
    applyLocalQuery();
  };

  watch(globalSearch, () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      pagination.value.page = 1;
      applyLocalQuery();
    }, 400);
  });

  // ---------------------------
  // View details (table)
  const showDetailDialog = ref(false);
  const selectedScore = ref(null);

  const viewScore = (row) => {
    selectedScore.value = row;
    showDetailDialog.value = true;
  };

  // ---------------------------
  // Step modal state
  const dialog = ref(false);
  const step = ref(1);

  const examTypeOptions = [
    { label: 'Written', value: 'Written' },
    { label: 'Practical', value: 'Practical' },
    { label: 'Interview', value: 'Interview' },
  ];

  const emptySession = () => ({
    exam_title: '',
    exam_type: null,
    exam_date: '2026-03-29',
    total_items: 50,
    remarks: '',
  });
  const session = ref(emptySession());

  // scores typed in modal by applicantId
  const modalScores = ref(new Map()); // applicantId -> { raw_score }

  // filters in encoding
  const selectedPosition = ref(null);
  const applicantSearch = ref('');

  // position dropdown options
  const positionOptionsBase = computed(() => {
    const set = new Set(applicants.value.map((a) => a.position).filter(Boolean));
    return Array.from(set)
      .sort()
      .map((p) => ({ label: p, value: p }));
  });
  const positionOptions = ref(positionOptionsBase.value);
  watch(positionOptionsBase, (v) => (positionOptions.value = v));

  const filterPositions = (val, update) => {
    update(() => {
      const needle = (val || '').toLowerCase();
      positionOptions.value = positionOptionsBase.value.filter((o) =>
        o.label.toLowerCase().includes(needle),
      );
    });
  };

  // encoding table pagination
  const encodePagination = ref({
    sortBy: 'lastname',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });

  /**
   * NOTE: action column removed here
   */
  const encodeColumns = computed(() => [
    { name: 'lastname', label: 'Last Name', align: 'left', field: 'lastname', sortable: true },
    { name: 'firstname', label: 'First Name', align: 'left', field: 'firstname', sortable: true },
    { name: 'position', label: 'Position', align: 'left', field: 'position', sortable: true },
    { name: 'score', label: 'Raw Score', align: 'left', field: 'raw_score', sortable: false },
  ]);

  const filteredApplicants = computed(() => {
    const pos = selectedPosition.value?.value ?? selectedPosition.value ?? null;
    const needle = (applicantSearch.value || '').trim().toLowerCase();

    let list = applicants.value;
    if (pos) list = list.filter((a) => a.position === pos);

    if (needle) {
      list = list.filter((a) => {
        const h = `${a.firstname} ${a.lastname} ${a.position}`.toLowerCase();
        return h.includes(needle);
      });
    }

    return list.map((a) => {
      const saved = modalScores.value.get(a.id) || { raw_score: null };
      return {
        ...a,
        _saved: { ...saved },
        _draft: { raw_score: saved.raw_score },
      };
    });
  });

  watch(
    () => filteredApplicants.value.length,
    (len) => {
      encodePagination.value.rowsNumber = len;
    },
    { immediate: true },
  );

  const pagedApplicants = computed(() => {
    const { page, rowsPerPage } = encodePagination.value;
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredApplicants.value.slice(start, end);
  });

  const commitDraft = (row) => {
    const raw = row._draft.raw_score;

    if (raw === null || raw === '' || raw === undefined) {
      modalScores.value.set(row.id, { raw_score: null });
      return;
    }

    modalScores.value.set(row.id, { raw_score: Number(raw) });
  };

  const encodedCount = computed(() => {
    let c = 0;
    for (const v of modalScores.value.values()) {
      if (v && v.raw_score !== null && v.raw_score !== undefined) c += 1;
    }
    return c;
  });

  // Review step filters
  const reviewPosition = ref(null);
  const reviewSearch = ref('');

  const reviewRows = computed(() => {
    const pos = reviewPosition.value?.value ?? reviewPosition.value ?? null;
    const needle = (reviewSearch.value || '').trim().toLowerCase();

    const joined = applicants.value
      .map((a) => {
        const s = modalScores.value.get(a.id);
        if (!s) return null;
        return {
          id: a.id,
          firstname: a.firstname,
          lastname: a.lastname,
          position: a.position,
          raw_score: s.raw_score ?? null,
          total_items: Number(session.value.total_items) || 0,
        };
      })
      .filter(Boolean);

    let out = joined;
    if (pos) out = out.filter((r) => r.position === pos);

    if (needle) {
      out = out.filter((r) => {
        const h = `${r.firstname} ${r.lastname} ${r.position} ${r.raw_score}`.toLowerCase();
        return h.includes(needle);
      });
    }

    out.sort((a, b) => (a.lastname || '').localeCompare(b.lastname || ''));
    return out;
  });

  const reviewColumns = computed(() => [
    { name: 'lastname', label: 'Last Name', align: 'left', field: 'lastname', sortable: true },
    { name: 'firstname', label: 'First Name', align: 'left', field: 'firstname', sortable: true },
    { name: 'position', label: 'Position', align: 'left', field: 'position', sortable: true },
    { name: 'score', label: 'Score', align: 'center', field: 'score', sortable: false },
  ]);

  const goToReview = () => {
    // simple guard (optional)
    if (
      !session.value.exam_title ||
      !session.value.exam_type ||
      Number(session.value.total_items) <= 0
    )
      return;
    step.value = 2;
  };

  // Open modal
  const openAddDialog = () => {
    session.value = emptySession();
    modalScores.value = new Map();
    selectedPosition.value = null;
    applicantSearch.value = '';
    reviewPosition.value = null;
    reviewSearch.value = '';
    step.value = 1;
    dialog.value = true;
  };

  // Save modal session into main table
  const saveSession = () => {
    loading.value = true;

    const created = [];
    for (const [applicantId, s] of modalScores.value.entries()) {
      const a = applicants.value.find((x) => x.id === applicantId);
      if (!a) continue;
      if (s.raw_score === null || s.raw_score === undefined) continue;

      created.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        firstname: a.firstname,
        lastname: a.lastname,
        position: a.position,
        exam_title: session.value.exam_title,
        exam_type: session.value.exam_type,
        exam_date: session.value.exam_date,
        raw_score: s.raw_score,
        total_items: Number(session.value.total_items) || 0,
        remarks: session.value.remarks,
      });
    }

    allScores.value.unshift(...created);

    loading.value = false;
    dialog.value = false;
    applyLocalQuery();
  };

  onMounted(() => {
    applyLocalQuery();
  });
</script>

<style scoped>
  .score-dialog-card {
    width: 90vw;
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

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
  .header-view {
    background: #1565c0;
  }
  .close-btn {
    color: rgba(255, 255, 255, 0.8);
  }
  .close-btn:hover {
    color: white;
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

  .dialog-footer {
    flex-shrink: 0;
    background: #fafafa;
  }
</style>
