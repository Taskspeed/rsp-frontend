<template>
  <q-card class="column no-wrap select-applicant-card">
    <!-- ==================== HEADER ==================== -->
    <q-card-section class="row items-center justify-between q-pb-sm">
      <div class="text-h6">
        {{ step === 1 ? 'Select Applicants per Position' : 'Review Selected Applicants' }}
      </div>
      <q-btn icon="close" flat round dense @click="onClose" />
    </q-card-section>

    <!-- ==================== TOP RIGHT: PUBLICATION DATE SELECTOR (step 1 only) ==================== -->
    <q-card-section v-if="step === 1" class="row items-center justify-end q-pt-none q-pb-sm">
      <div class="publication-select">
        <q-select
          v-model="selectedPublicationDate"
          :options="publicationDateOptions"
          label="Select Publication Date"
          outlined
          dense
          option-value="value"
          option-label="label"
          emit-value
          map-options
          clearable
          :loading="loadingPositions"
          :dropdown-icon="'arrow_drop_down'"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">No publication dates found</q-item-section>
            </q-item>
          </template>

          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ scope.opt.label }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </q-card-section>

    <!-- ==================== STEP 2 TOP BAR: POSITION FILTER ==================== -->
    <q-card-section v-else class="row items-center justify-end q-pt-none q-pb-sm">
      <div class="publication-select">
        <q-select
          v-model="reviewPositionFilter"
          :options="reviewPositionOptions"
          label="Filter by Position"
          outlined
          dense
          option-value="value"
          option-label="label"
          emit-value
          map-options
          clearable
          :dropdown-icon="'arrow_drop_down'"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">No selected positions</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </q-card-section>

    <q-separator />

    <!-- ==================== STEP 1: TWO PANEL LAYOUT ==================== -->
    <q-card-section v-if="step === 1" class="col q-pa-none panels-wrapper">
      <div class="row no-wrap full-height panels-row">
        <!-- ---------- LEFT PANEL: POSITIONS ---------- -->
        <div class="col-12 col-md-4 panel-left column no-wrap">
          <div class="q-pa-sm">
            <q-input
              v-model="positionSearch"
              dense
              outlined
              clearable
              placeholder="Search position..."
              :disable="!selectedPublicationDate"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <q-separator />

          <q-scroll-area class="col">
            <q-list separator>
              <q-item v-if="!selectedPublicationDate">
                <q-item-section class="text-grey text-center">
                  Select a publication date to view positions
                </q-item-section>
              </q-item>

              <q-item v-else-if="loadingPositions">
                <q-item-section class="text-center">
                  <q-spinner color="primary" size="28px" />
                  <div class="q-mt-sm text-caption">Loading positions...</div>
                </q-item-section>
              </q-item>

              <q-item v-else-if="filteredPositions.length === 0">
                <q-item-section class="text-grey text-center">No positions found</q-item-section>
              </q-item>

              <q-item
                v-for="pos in filteredPositions"
                :key="pos.value"
                clickable
                v-ripple
                :active="selectedPositionId === pos.value"
                active-class="bg-primary text-white"
                @click="selectPosition(pos)"
              >
                <q-item-section>
                  <q-item-label>{{ pos.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-xs">
                    <q-badge v-if="positionBadgeCount(pos.value) > 0" color="positive" rounded>
                      {{ positionBadgeCount(pos.value) }}
                    </q-badge>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </div>

        <q-separator vertical class="gt-sm" />
        <q-separator class="lt-md" />

        <!-- ---------- RIGHT PANEL: APPLICANTS TABLE ---------- -->
        <div class="col-12 col-md-8 panel-right column no-wrap">
          <div class="q-pa-sm row items-center justify-between applicants-header">
            <div class="text-subtitle2 ellipsis">
              Applicants
              <span v-if="selectedPositionLabel" class="text-grey-8">
                — {{ selectedPositionLabel }}
              </span>
            </div>
          </div>

          <q-separator />

          <div class="col applicants-table-wrap">
            <div v-if="!selectedPositionId" class="text-center text-grey q-pa-lg">
              <q-icon name="arrow_back" size="24px" class="gt-sm" />
              Select a position on the left to view applicants
            </div>

            <div v-else-if="loadingApplicants" class="text-center q-pa-lg">
              <q-spinner color="primary" size="32px" />
              <div class="q-mt-sm">Loading applicants...</div>
            </div>

            <div v-else-if="applicants.length === 0" class="text-center text-grey q-pa-lg">
              No applicants found for this position
            </div>

            <q-table
              v-else
              flat
              dense
              class="full-height applicants-table"
              :rows="applicants"
              :columns="applicantColumns"
              row-key="id"
              selection="multiple"
              v-model:selected="selected"
              :pagination="{ rowsPerPage: 0 }"
              hide-bottom
              virtual-scroll
            >
              <template v-slot:body-cell-applicantType="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    size="sm"
                    :color="props.row.applicantType === 'internal' ? 'primary' : 'orange'"
                    text-color="white"
                  >
                    {{ props.row.applicantType === 'internal' ? 'Internal' : 'External' }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- ==================== STEP 2: REVIEW ALL SELECTED APPLICANTS ==================== -->
    <q-card-section v-else class="col q-pa-none panels-wrapper">
      <div class="col review-table-wrap">
        <div v-if="allSelectedApplicantsFlat.length === 0" class="text-center text-grey q-pa-lg">
          No applicants selected yet
        </div>

        <div
          v-else-if="reviewFilteredApplicants.length === 0"
          class="text-center text-grey q-pa-lg"
        >
          No applicants selected for this position
        </div>

        <q-table
          v-else
          flat
          dense
          class="full-height review-table"
          :rows="reviewFilteredApplicants"
          :columns="reviewColumns"
          row-key="rowKey"
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          virtual-scroll
        >
          <template v-slot:body-cell-applicantType="props">
            <q-td :props="props">
              <q-chip
                dense
                size="sm"
                :color="props.row.applicantType === 'internal' ? 'primary' : 'orange'"
                text-color="white"
              >
                {{ props.row.applicantType === 'internal' ? 'Internal' : 'External' }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                icon="close"
                flat
                round
                dense
                size="sm"
                color="negative"
                @click="removeApplicant(props.row)"
              >
                <q-tooltip>Remove</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </q-card-section>

    <q-separator />

    <!-- ==================== FOOTER ==================== -->
    <q-card-actions class="row items-center justify-between q-px-md q-py-sm footer-actions">
      <div class="row items-center q-gutter-sm">
        <div class="text-caption text-grey-7">
          {{ totalSelectedCount }} applicant{{ totalSelectedCount === 1 ? '' : 's' }} selected
        </div>
        <q-btn
          v-if="totalSelectedCount > 0"
          flat
          dense
          no-caps
          size="sm"
          color="negative"
          icon="restart_alt"
          label="Reset all"
          @click="confirmResetAll"
        />
      </div>

      <div class="row items-center q-gutter-sm">
        <template v-if="step === 1">
          <!-- <q-btn flat no-caps label="Close" @click="onClose" /> -->
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="`Review (${totalSelectedCount})`"
            :disable="totalSelectedCount === 0"
            @click="goToReview"
          />
        </template>

        <template v-else>
          <q-btn flat no-caps label="Back" @click="step = 1" />
          <!-- <q-btn flat no-caps label="Close" @click="onClose" /> -->
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Generate Report"
            :disable="totalSelectedCount === 0"
            @click="generateReport"
          />
        </template>
      </div>
    </q-card-actions>

    <!-- ==================== RESET ALL CONFIRMATION ==================== -->
    <q-dialog v-model="showResetConfirm" persistent>
      <q-card class="reset-confirm-card">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="restart_alt" color="negative" size="24px" />
          <div class="text-subtitle1">Reset all selections?</div>
        </q-card-section>
        <q-card-section class="text-body2 text-grey-8 q-pt-none">
          This removes all {{ totalSelectedCount }} selected applicant(s) across every position.
          This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn flat no-caps label="Reset All" color="negative" @click="resetAllSelections" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ==================== REPORT MODAL (embedded) ==================== -->
    <q-dialog v-model="showReportModal" full-width>
      <SelectedApplicantPositionReport :selectedData="reportData" @close="closeReportModal" />
    </q-dialog>
  </q-card>
</template>

<script>
  import { useSummaryReportStore } from 'stores/summaryReportStore';
  import SelectedApplicantPositionReport from 'src/components/Reports/SelectedApplicantPositionReport.vue';

  // LocalStorage key used to persist in-progress applicant selections across
  // position switches and page reloads.
  const STORAGE_KEY = 'rsp_selected_applicant_position_selections';

  export default {
    name: 'SelectApplicantPositionModal',

    components: {
      SelectedApplicantPositionReport,
    },

    emits: ['close', 'generate-report'],

    data() {
      return {
        // ==================== STEP CONTROL ====================
        step: 1,

        // ==================== PUBLICATION DATE ====================
        loadingPositions: false,
        positionsData: [],
        selectedPublicationDate: null,

        // ==================== LEFT PANEL: POSITIONS ====================
        positionSearch: '',
        selectedPositionId: null,
        selectedPositionLabel: '',

        // ==================== RIGHT PANEL: APPLICANTS TABLE ====================
        loadingApplicants: false,
        applicants: [],
        selected: [],

        applicantColumns: [
          { name: 'name', label: 'Full Name', align: 'left', field: 'name', sortable: true },
          {
            name: 'applicantType',
            label: 'Type',
            align: 'left',
            field: 'applicantType',
            sortable: true,
          },
        ],

        // ==================== CROSS-POSITION SELECTION STORAGE ====================
        selectionsByPosition: {},

        // ==================== ACCURATE POSITION METADATA ====================
        // Populated from summaryReportStore.fetchApplicantPosition(jobpostId) each
        // time a position is opened. Unlike positionsData (the summary list used
        // for the left panel), this response includes accurate Salary_Grade,
        // Plantilla_Item_No, division, etc. for the CURRENTLY selected position.
        currentPositionMeta: null,

        // ==================== STEP 2: REVIEW ====================
        reviewPositionFilter: null,
        reviewColumns: [
          {
            name: 'positionLabel',
            label: 'Position',
            align: 'left',
            field: 'positionLabel',
            sortable: true,
          },
          { name: 'name', label: 'Full Name', align: 'left', field: 'name', sortable: true },
          {
            name: 'applicantType',
            label: 'Type',
            align: 'left',
            field: 'applicantType',
            sortable: true,
          },
          { name: 'actions', label: '', align: 'center', field: 'actions' },
        ],

        // ==================== RESET ALL ====================
        showResetConfirm: false,

        // ==================== REPORT MODAL ====================
        showReportModal: false,
        reportData: null,
      };
    },

    computed: {
      publicationDateOptions() {
        const map = new Map();

        this.positionsData.forEach((pos) => {
          const postDate = this.normalizeDate(pos.post_date);
          const endDate = pos.end_date ? this.normalizeDate(pos.end_date) : '';
          const key = `${postDate}|${endDate}`;

          if (!map.has(key)) {
            map.set(key, {
              value: key,
              postDate,
              endDate,
              label: pos.end_date
                ? `${this.formatDateForDisplay(pos.post_date)} - ${this.formatDateForDisplay(pos.end_date)}`
                : this.formatDateForDisplay(pos.post_date),
            });
          }
        });

        return Array.from(map.values());
      },

      positionsForSelectedDate() {
        if (!this.selectedPublicationDate) return [];

        const [postDate, endDate] = this.selectedPublicationDate.split('|');

        return this.positionsData
          .filter((pos) => {
            const p = this.normalizeDate(pos.post_date);
            const e = pos.end_date ? this.normalizeDate(pos.end_date) : '';
            return p === postDate && e === endDate;
          })
          .map((pos) => ({
            value: pos.jobpostId,
            label: pos.Position,
            positionData: pos,
          }));
      },

      filteredPositions() {
        if (!this.positionSearch) {
          return this.positionsForSelectedDate;
        }
        const needle = this.positionSearch.toLowerCase();
        return this.positionsForSelectedDate.filter((pos) =>
          pos.label.toLowerCase().includes(needle),
        );
      },

      totalSelectedCount() {
        return Object.values(this.selectionsByPosition).reduce(
          (sum, entry) => sum + entry.applicants.length,
          0,
        );
      },

      allSelectedApplicantsFlat() {
        const flat = [];
        Object.entries(this.selectionsByPosition).forEach(([jobpostId, entry]) => {
          entry.applicants.forEach((app) => {
            flat.push({
              ...app,
              jobpostId,
              positionLabel: entry.positionLabel,
              positionData: entry.positionData,
              rowKey: `${jobpostId}-${app.id}`,
            });
          });
        });
        return flat;
      },

      reviewFilteredApplicants() {
        if (!this.reviewPositionFilter) return this.allSelectedApplicantsFlat;
        return this.allSelectedApplicantsFlat.filter(
          (a) => a.jobpostId === this.reviewPositionFilter,
        );
      },

      reviewPositionOptions() {
        return Object.entries(this.selectionsByPosition).map(([jobpostId, entry]) => ({
          value: jobpostId,
          label: `${entry.positionLabel} (${entry.applicants.length})`,
        }));
      },
    },

    watch: {
      selectedPublicationDate() {
        this.positionSearch = '';
        this.selectedPositionId = null;
        this.selectedPositionLabel = '';
        this.applicants = [];
        this.selected = [];
        this.currentPositionMeta = null;
      },

      selected: {
        deep: true,
        handler(newVal) {
          if (!this.selectedPositionId) return;

          const positionEntry = this.positionsForSelectedDate.find(
            (p) => p.value === this.selectedPositionId,
          );
          // Summary-list data (left panel). Often missing Salary_Grade / Plantilla_Item_No.
          const listPositionData = positionEntry ? positionEntry.positionData : {};

          // Accurate metadata fetched via fetchApplicantPosition() for THIS position.
          // Only trust it if it actually corresponds to the currently selected position.
          const meta =
            this.currentPositionMeta &&
            String(this.currentPositionMeta.jobpostId) === String(this.selectedPositionId)
              ? this.currentPositionMeta
              : {};

          if (!newVal || newVal.length === 0) {
            if (this.selectionsByPosition[this.selectedPositionId]) {
              const updated = { ...this.selectionsByPosition };
              delete updated[this.selectedPositionId];
              this.selectionsByPosition = updated;
            }
            return;
          }

          // Build complete position data with all fields.
          // `meta` (from fetchApplicantPosition) takes priority since it carries the
          // correct Salary_Grade / Plantilla_Item_No / division; listPositionData is
          // only used as a fallback for fields the summary endpoint does provide
          // (e.g. post_date / end_date / status).
          const completePositionData = {
            jobpostId: listPositionData.jobpostId || this.selectedPositionId,
            Office: meta.office || listPositionData.Office || listPositionData.office || '',
            Position:
              meta.position ||
              listPositionData.Position ||
              listPositionData.position ||
              this.selectedPositionLabel,
            office: meta.office || listPositionData.office || listPositionData.Office || '',
            office2: meta.office2 ?? listPositionData.office2 ?? null,
            group: meta.group ?? listPositionData.group ?? null,
            division: meta.division || listPositionData.division || '',
            section: meta.section ?? listPositionData.section ?? null,
            unit: meta.unit ?? listPositionData.unit ?? null,
            Salary_Grade: meta.Salary_Grade || listPositionData.Salary_Grade || '',
            Plantilla_Item_No: meta.Plantilla_Item_No || listPositionData.Plantilla_Item_No || '',
            post_date: listPositionData.post_date || '',
            end_date: listPositionData.end_date || '',
            publication_date:
              meta.publication_date ||
              listPositionData.publication_date ||
              this.selectedPublicationDate ||
              '',
            status: listPositionData.status || '',
          };

          this.selectionsByPosition = {
            ...this.selectionsByPosition,
            [this.selectedPositionId]: {
              positionLabel: this.selectedPositionLabel,
              positionData: completePositionData,
              applicants: newVal.map((a) => ({
                ...a,
              })),
            },
          };
        },
      },

      selectionsByPosition: {
        deep: true,
        handler() {
          this.saveSelectionsToStorage();
        },
      },
    },

    async mounted() {
      this.loadSelectionsFromStorage();
      await this.loadPositions();
    },

    methods: {
      // ==================== LOCAL STORAGE PERSISTENCE ====================

      loadSelectionsFromStorage() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.selectionsByPosition = parsed;
          }
        } catch (error) {
          console.error('Error reading saved applicant selections:', error);
        }
      },

      saveSelectionsToStorage() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selectionsByPosition));
        } catch (error) {
          console.error('Error saving applicant selections:', error);
        }
      },

      clearSelectionsStorage() {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error('Error clearing applicant selections:', error);
        }
      },

      // ==================== DATA LOADING ====================

      async loadPositions() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingPositions = true;
        try {
          const positions = await summaryReportStore.fetchPositionWithRating();
          this.positionsData = positions || [];
        } catch (error) {
          console.error('Error loading positions:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load positions',
            position: 'top',
          });
        } finally {
          this.loadingPositions = false;
        }
      },

      async loadApplicants(jobpostId) {
        const summaryReportStore = useSummaryReportStore();
        this.loadingApplicants = true;
        this.applicants = [];
        this.currentPositionMeta = null;

        try {
          const response = await summaryReportStore.fetchApplicantPosition(jobpostId);

          if (!response) {
            this.$q.notify({
              type: 'warning',
              message: 'No data received for this position',
              position: 'top',
            });
            this.selected = [];
            return;
          }

          // ✅ Capture the accurate position-level metadata from THIS response.
          // The left-panel summary list (positionsData / fetchPositionWithRating)
          // does not reliably carry Salary_Grade / Plantilla_Item_No / division,
          // but this per-position endpoint does.
          this.currentPositionMeta = {
            jobpostId: String(jobpostId),
            office: response.office || '',
            office2: response.office2 || null,
            group: response.group || null,
            division: response.division || '',
            section: response.section || null,
            unit: response.unit || null,
            position: response.position || '',
            Salary_Grade: response.Salary_Grade || '',
            Plantilla_Item_No: response.Plantilla_Item_No || '',
            publication_date: response.publication_date || '',
          };

          let list = [];

          if (response.data && Array.isArray(response.data)) {
            list = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.message) {
              this.$q.notify({
                type: 'info',
                message: response.data.message || 'No applicants found',
                position: 'top',
              });
              this.selected = [];
              return;
            }
            list = Object.values(response.data);
          } else if (Array.isArray(response)) {
            list = response;
          } else if (response.message) {
            this.$q.notify({
              type: 'info',
              message: response.message,
              position: 'top',
            });
            this.selected = [];
            return;
          } else if (typeof response === 'object') {
            list = Object.values(response);
          }

          if (!Array.isArray(list)) list = [];

          this.applicants = list
            .filter((app) => app && typeof app === 'object' && (app.firstname || app.lastname))
            .map((app) => ({
              id: app.ControlNo || app.submission_id || app.nPersonalInfo_id || app.id,
              name: [app.firstname, app.lastname].filter(Boolean).join(' '),
              applicantType: app.applicant_type || 'external',
              ...app,
            }));

          const savedEntry = this.selectionsByPosition[jobpostId];
          this.selected = savedEntry
            ? this.applicants.filter((a) => savedEntry.applicants.some((s) => s.id === a.id))
            : [];

          if (this.applicants.length === 0) {
            this.$q.notify({
              type: 'info',
              message: 'No applicants found for this position',
              position: 'top',
            });
          }
        } catch (error) {
          console.error('Error loading applicants:', error);
          this.$q.notify({
            type: 'negative',
            message: error.message || 'Failed to load applicants for this position',
            position: 'top',
          });
        } finally {
          this.loadingApplicants = false;
        }
      },

      // ==================== ACTIONS ====================

      selectPosition(pos) {
        if (this.selectedPositionId === pos.value) return;
        this.selectedPositionId = pos.value;
        this.selectedPositionLabel = pos.label;
        this.loadApplicants(pos.value);
      },

      positionBadgeCount(jobpostId) {
        return this.selectionsByPosition[jobpostId]?.applicants.length || 0;
      },

      goToReview() {
        this.reviewPositionFilter = null;
        this.step = 2;
      },

      removeApplicant(row) {
        const entry = this.selectionsByPosition[row.jobpostId];
        if (!entry) return;

        const remaining = entry.applicants.filter((a) => a.id !== row.id);
        const updated = { ...this.selectionsByPosition };

        if (remaining.length === 0) {
          delete updated[row.jobpostId];
        } else {
          updated[row.jobpostId] = { ...entry, applicants: remaining };
        }
        this.selectionsByPosition = updated;

        if (this.selectedPositionId === row.jobpostId) {
          this.selected = this.selected.filter((a) => a.id !== row.id);
        }
      },

      // ==================== RESET ALL ====================

      confirmResetAll() {
        if (this.totalSelectedCount === 0) return;
        this.showResetConfirm = true;
      },

      resetAllSelections() {
        this.selectionsByPosition = {};
        this.selected = [];
        this.clearSelectionsStorage();
        this.showResetConfirm = false;

        // Bring the user back to the selection step if they were reviewing,
        // since the review list will now be empty.
        if (this.step === 2) {
          this.step = 1;
        }

        this.$q.notify({
          type: 'positive',
          message: 'All selected applicants have been cleared',
          position: 'top',
        });
      },

      generateReport() {
        console.log('=== Generating Report ===');
        console.log('Selections by position:', Object.keys(this.selectionsByPosition));

        // Build report data in the same structure as the API response
        const positions = {};

        Object.entries(this.selectionsByPosition).forEach(([jobpostId, entry]) => {
          const positionData = entry.positionData || {};

          // Build applicants data object
          const applicantsData = {};
          entry.applicants.forEach((app, index) => {
            const rank = app.rank || index + 1;
            const key = String(index);

            applicantsData[key] = {
              nPersonalInfo_id: app.nPersonalInfo_id || '',
              ControlNo: app.ControlNo || null,
              submission_id: app.submission_id || null,
              firstname: app.firstname || '',
              lastname: app.lastname || '',
              age: app.age || null,
              image_url: app.image_url || null,
              office: app.office || positionData.office || '',
              current_position: app.current_position || '',
              length_of_service: app.length_of_service || null,
              applicant_type: app.applicant_type || 'external',
              total_rating: app.total_rating || null,
              bei: app.bei || null,
              exam_score: app.exam_score || null,
              final_rating: app.final_rating || null,
              grand_total: app.grand_total || null,
              education: app.education || [],
              eligibility: app.eligibility || [],
              rank: rank,
            };
          });

          // Build position data matching API response format
          positions[jobpostId] = {
            jobpost_id: jobpostId,
            total_assigned: entry.applicants.length,
            total_completed: entry.applicants.length,
            office: positionData.office || positionData.Office || '',
            office2: positionData.office2 || null,
            group: positionData.group || null,
            division: positionData.division || '',
            section: positionData.section || null,
            unit: positionData.unit || null,
            position: entry.positionLabel || positionData.Position || positionData.position || '',
            Salary_Grade: positionData.Salary_Grade || '',
            Plantilla_Item_No: positionData.Plantilla_Item_No || '',
            publication_date:
              this.formatDateForDisplay(positionData.post_date) ||
              this.selectedPublicationDate ||
              '',
            data: applicantsData,
          };
        });

        console.log('Built positions:', Object.keys(positions));
        console.log('Total positions:', Object.keys(positions).length);

        // Store the report data
        this.reportData = {
          positions: positions,
          summary: {
            totalApplicants: this.totalSelectedCount,
            totalPositions: Object.keys(positions).length,
            publicationDate: this.selectedPublicationDate,
          },
          // Keep flat list for backward compatibility
          applicants: this.allSelectedApplicantsFlat,
        };

        console.log('Report data prepared:', this.reportData);
        console.log('Positions in report data:', Object.keys(this.reportData.positions));

        // Emit the generate-report event
        this.$emit('generate-report', this.reportData);

        // Show the report modal
        this.showReportModal = true;
      },

      closeReportModal() {
        this.showReportModal = false;
        this.reportData = null;

        // Clear the working state and persisted copy
        this.selectionsByPosition = {};
        this.clearSelectionsStorage();
        this.onClose();
      },

      onClose() {
        this.$emit('close');
      },

      // ==================== UTILITY METHODS ====================

      normalizeDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },

      formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
      },

      // Keep old formatDate for backward compatibility
      formatDate(dateString) {
        return this.formatDateForDisplay(dateString);
      },
    },
  };
</script>

<style scoped>
  .select-applicant-card {
    width: 95vw;
    max-width: 1300px;
    height: 88vh;
    max-height: 850px;
  }

  .publication-select {
    width: 100%;
    max-width: 320px;
  }

  .panels-wrapper {
    overflow: hidden;
  }

  .panels-row {
    height: 100%;
  }

  .panel-left,
  .panel-right {
    height: 100%;
    min-height: 0;
  }

  .panel-left {
    border-right: none;
  }

  .applicants-header {
    min-height: 48px;
  }

  .applicants-table-wrap,
  .review-table-wrap {
    height: 100%;
    overflow: hidden;
  }

  .applicants-table,
  .review-table {
    height: 100%;
  }

  .footer-actions {
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .reset-confirm-card {
    width: 100%;
    max-width: 360px;
    border-radius: 8px;
  }

  @media (max-width: 1023px) {
    .select-applicant-card {
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }

    .panels-row {
      flex-direction: column;
    }

    .panel-left {
      height: 40%;
      flex: none;
    }

    .panel-right {
      height: 60%;
      flex: none;
    }

    .publication-select {
      max-width: 100%;
    }
  }
</style>
