<template>
  <q-page class="q-pa-md">
    <!-- Header Section -->
    <div class="q-mb-md">
      <h5 class="text-h5 q-ma-none"><b>Rater Management</b></h5>
      <q-breadcrumbs class="q-mt-sm">
        <template v-slot:separator>
          <q-icon size="1.2em" name="arrow_forward" />
        </template>
        <q-breadcrumbs-el icon="assignment_ind" label="Rater Management" />
        <q-breadcrumbs-el icon="assessment" label="Reports" />
      </q-breadcrumbs>
    </div>

    <!-- Search Bar -->
    <div class="q-mb-md">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search reports..."
        clearable
        class="search-input"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Main Reports Table with Category Grouping -->
    <q-table
      :rows="filteredReports"
      :columns="columns"
      row-key="id"
      :pagination="pagination"
      :rows-per-page-options="[10, 25, 50]"
      binary-state-sort
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn round dense color="primary" icon="edit" size="sm" @click="handleAction(props.row)">
            <q-tooltip>Generate Reports</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- ==================== PUBLICATION DATE MODAL (Reusable for Excel Reports) ==================== -->
    <q-dialog v-model="showPublicationDateModal" persistent>
      <q-card style="min-width: 450px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">{{ selectedReport?.name }} - Select Publication Date</div>
        </q-card-section>

        <q-card-section>
          <div v-if="loadingPublicationDatesForExcel" class="text-center">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm">Loading publication dates...</div>
          </div>

          <div v-else>
            <div class="text-subtitle2 q-mb-sm">Select Publication Date</div>
            <q-select
              v-model="selectedPublicationDate"
              :options="filteredPublicationDateOptions"
              label="Publication Date"
              outlined
              use-input
              input-debounce="300"
              @filter="filterPublicationDates"
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
                      {{ scope.opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <span v-if="selectedPublicationDate">
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ selectedPublicationDate }}
                </span>
              </template>
            </q-select>

            <div v-if="publicationDateOptions.length === 0" class="q-mt-sm text-caption text-grey">
              No publication dates available
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closePublicationDateModal" />
          <q-btn
            color="primary"
            label="Generate Report"
            :disable="!selectedPublicationDate"
            @click="generateExcelReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ==================== FINAL SUMMARY / APPLICANT PER POSITION / BEI SUMMARY MODAL ==================== -->
    <q-dialog v-model="showReportModal" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">
            {{
              selectedReport?.id === 3
                ? 'Applicant per Position Filters'
                : selectedReport?.id === 6
                  ? 'BEI Summary Report Filters'
                  : selectedReport?.id === 1
                    ? 'Final Summary Report Filters'
                    : selectedReport?.name
            }}
          </div>
        </q-card-section>

        <q-card-section>
          <div v-if="loadingPositions" class="text-center">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm">Loading positions...</div>
          </div>

          <div v-else>
            <!-- Publication Date Filter -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Publication Date</div>
              <q-select
                v-model="selectedReportPublicationDate"
                :options="reportPublicationDateOptions"
                label="Select Publication Date"
                outlined
                option-value="value"
                option-label="label"
                emit-value
                map-options
                clearable
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

              <div
                v-if="reportPublicationDateOptions.length === 0"
                class="q-mt-sm text-caption text-grey"
              >
                No publication dates available
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Position Filter (only for reports that need positions) -->
            <div
              v-if="
                selectedReport?.id === 1 || selectedReport?.id === 3 || selectedReport?.id === 6
              "
            >
              <div class="text-subtitle2 q-mb-sm">Select Positions</div>
              <q-select
                v-model="selectedPositions"
                :options="filteredPositionSearchOptions"
                label="Select Positions"
                outlined
                multiple
                use-chips
                use-input
                input-debounce="300"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :dropdown-icon="'arrow_drop_down'"
                :display-value="displayPositions"
                @filter="filterPositions"
              >
                <template v-slot:option="scope">
                  <q-item
                    v-if="scope.opt.value === 'select_all'"
                    clickable
                    @click.stop="toggleSelectAll"
                  >
                    <q-item-section>
                      <q-checkbox
                        :model-value="allSelected"
                        label="Select All"
                        @update:model-value="toggleSelectAll"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-else
                    :key="scope.opt.value"
                    clickable
                    @click.stop="togglePosition(scope.opt.value)"
                  >
                    <q-item-section>
                      <q-checkbox
                        :label="scope.opt.label"
                        :model-value="isPositionSelected(scope.opt.value)"
                        @update:model-value="togglePosition(scope.opt.value)"
                      />
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No positions found for the selected publication date
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <div
                v-if="filteredPositionOptions.length <= 1"
                class="q-mt-sm text-caption text-grey"
              >
                {{
                  !selectedReportPublicationDate
                    ? 'No positions available'
                    : 'No positions found for the selected publication date.'
                }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeReportModal" />
          <q-btn
            color="primary"
            label="Generate Report"
            :disable="
              (selectedReport?.id === 1 || selectedReport?.id === 3 || selectedReport?.id === 6) &&
              selectedPositions.length === 0
            "
            @click="openReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Top 5 Ranking Applicants Modal -->
    <q-dialog v-model="showTop5Modal" persistent>
      <q-card style="min-width: 450px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Top 5 Ranking Applicants Report Filter</div>
        </q-card-section>

        <q-card-section>
          <div v-if="loadingPublicationDates" class="text-center">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm">Loading publication dates...</div>
          </div>

          <div v-else>
            <div class="text-subtitle2 q-mb-sm">Select Publication Date</div>
            <q-select
              v-model="selectedTop5PublicationDate"
              :options="filteredTop5PublicationDateOptions"
              label="Publication Date"
              outlined
              use-input
              input-debounce="300"
              @filter="filterTop5PublicationDates"
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
                      {{ scope.opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <span v-if="selectedTop5PublicationDate">
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ selectedTop5PublicationDate }}
                </span>
              </template>
            </q-select>

            <div
              v-if="top5PublicationDateOptions.length === 0"
              class="q-mt-sm text-caption text-grey"
            >
              No publication dates available
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeTop5Modal" />
          <q-btn
            color="primary"
            label="Generate Report"
            :disable="!selectedTop5PublicationDate"
            @click="generateTop5Report"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- List of Position PDF Modal -->
    <q-dialog v-model="showListPositionModal" persistent>
      <q-card style="min-width: 450px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">List of Position Report Filter</div>
        </q-card-section>

        <q-card-section>
          <div v-if="loadingListPositionDates" class="text-center">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm">Loading publication dates...</div>
          </div>

          <div v-else>
            <div class="text-subtitle2 q-mb-sm">Select Publication Date</div>
            <q-select
              v-model="selectedListPositionPublicationDate"
              :options="filteredListPositionDateOptions"
              label="Publication Date"
              outlined
              use-input
              input-debounce="300"
              @filter="filterListPositionDates"
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
                      {{ scope.opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <span v-if="selectedListPositionPublicationDate">
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ selectedListPositionPublicationDate }}
                </span>
              </template>
            </q-select>

            <div
              v-if="listPositionPublicationDateOptions.length === 0"
              class="q-mt-sm text-caption text-grey"
            >
              No publication dates available
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeListPositionModal" />
          <q-btn
            color="primary"
            label="Generate Report"
            :disable="!selectedListPositionPublicationDate"
            @click="generateListPositionReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Newly Appointed and Promoted Permanent Employees Modal -->
    <q-dialog v-model="showNewEmployeeModal" persistent>
      <q-card style="min-width: 450px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Newly Appointed and Promoted Permanent Employees</div>
        </q-card-section>

        <q-card-section>
          <div v-if="loadingNewEmployeeDates" class="text-center">
            <q-spinner color="primary" size="32px" />
            <div class="q-mt-sm">Loading publication dates...</div>
          </div>

          <div v-else>
            <!-- Publication Date -->
            <div class="text-subtitle2 q-mb-sm">Select Publication Date</div>
            <q-select
              v-model="selectedNewEmployeePublicationDate"
              :options="filteredNewEmployeeDateOptions"
              label="Publication Date"
              outlined
              use-input
              input-debounce="300"
              option-value="date"
              option-label="date"
              emit-value
              map-options
              @filter="filterNewEmployeeDates"
              :dropdown-icon="'arrow_drop_down'"
              @update:model-value="onNewEmployeePublicationDateChange"
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
                      {{ scope.opt.date }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <span v-if="selectedNewEmployeePublicationDate">
                  <q-icon name="event" size="xs" class="q-mr-sm" />
                  {{ selectedNewEmployeePublicationDate }}
                </span>
              </template>
            </q-select>

            <!-- Effective Date — only shown when multiple effective dates are available -->
            <div
              v-if="selectedNewEmployeePublicationDate && availableEffectiveDates.length > 1"
              class="q-mt-md"
            >
              <div class="text-subtitle2 q-mb-sm">Select Effective Date</div>
              <q-select
                v-model="selectedNewEmployeeEffectiveDate"
                :options="availableEffectiveDates"
                label="Effective Date"
                outlined
                :dropdown-icon="'arrow_drop_down'"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">No effective dates found</q-item-section>
                  </q-item>
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
                  <span v-if="selectedNewEmployeeEffectiveDate">
                    <q-icon name="event" size="xs" class="q-mr-sm" />
                    {{ selectedNewEmployeeEffectiveDate }}
                  </span>
                </template>
              </q-select>
            </div>

            <!-- Info when only one (or null) effective date — no selector shown -->
            <div
              v-if="
                selectedNewEmployeePublicationDate &&
                availableEffectiveDates.length <= 1 &&
                selectedNewEmployeeEffectiveDate
              "
              class="q-mt-sm"
            >
              <q-chip icon="event" color="primary" text-color="white" size="sm">
                Effective Date: {{ selectedNewEmployeeEffectiveDate }}
              </q-chip>
            </div>

            <div v-if="newEmployeeDateOptions.length === 0" class="q-mt-sm text-caption text-grey">
              No publication dates available
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeNewEmployeeModal" />
          <q-btn
            color="primary"
            label="Generate Report"
            :disable="
              !selectedNewEmployeePublicationDate ||
              (availableEffectiveDates.length > 1 && !selectedNewEmployeeEffectiveDate)
            "
            @click="generateNewEmployeeReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ==================== REPORT VIEWER DIALOGS ==================== -->

    <!-- Final Summary Report Viewer -->
    <q-dialog v-model="showFinalSummaryReportViewer" maximized>
      <FinalSummaryReport :positions="selectedPositions" />
    </q-dialog>

    <!-- Top 5 Ranking Report Viewer -->
    <q-dialog v-model="showTop5ReportViewer" maximized>
      <TopApplicantReport :publicationDate="selectedTop5PublicationDate" />
    </q-dialog>

    <!-- Applicant per Position Report Viewer -->
    <q-dialog v-model="showApplicantReportViewer" maximized>
      <ApplicantPosition :jobpostId="selectedPositions[0]" />
    </q-dialog>

    <!-- BEI Summary Report Viewer -->
    <q-dialog v-model="showBEISummaryReportViewer" maximized>
      <BEISummaryReport :positions="selectedPositions" />
    </q-dialog>

    <!-- List of Position Report Viewer -->
    <q-dialog v-model="showListPositionReportViewer" maximized>
      <ListPositionReport :publicationDate="selectedListPositionPublicationDate" />
    </q-dialog>

    <!-- ==================== SELECTED APPLICANT PER POSITION MODAL ==================== -->
    <q-dialog v-model="showSelectedApplicantModal" persistent>
      <SelectApplicantPositionModal @close="closeSelectedApplicantModal" />
    </q-dialog>
  </q-page>
</template>

<script>
  import { useSummaryReportStore } from 'stores/summaryReportStore';
  import FinalSummaryReport from 'components/reports/FinalSummaryReport.vue';
  import BEISummaryReport from 'components/reports/BEISummaryReport.vue';
  import TopApplicantReport from 'components/reports/TopApplicantReport.vue';
  import ApplicantPosition from 'components/reports/ApplicantPositionReport.vue';
  import ListPositionReport from 'components/reports/ListPositionReport.vue';
  import SelectApplicantPositionModal from 'components/SelectApplicantPositionModal.vue';

  export default {
    name: 'ReportManagementPage',

    components: {
      BEISummaryReport,
      FinalSummaryReport,
      TopApplicantReport,
      ApplicantPosition,
      ListPositionReport,
      SelectApplicantPositionModal,
    },

    data() {
      return {
        // Search query
        searchQuery: '',

        // ==================== TABLE CONFIGURATION ====================
        columns: [
          { name: 'id', label: 'ID', align: 'left', field: 'id', sortable: true },
          { name: 'category', label: 'Category', align: 'left', field: 'category', sortable: true },
          { name: 'name', label: 'Report Name', align: 'left', field: 'name', sortable: true },
          {
            name: 'type',
            label: 'Type',
            align: 'left',
            field: 'type',
            sortable: true,
          },
          {
            name: 'description',
            label: 'Description',
            align: 'left',
            field: 'description',
            sortable: true,
          },
          { name: 'actions', label: 'Actions', align: 'center', field: 'actions', sortable: false },
        ],

        reports: [
          // ID 1: Rating Category
          {
            id: 1,
            name: 'Final Summary of Rating',
            category: 'Rating',
            type: 'PDF',
            description: 'By Publication Date and Position',
            apiEndpoint: null,
          },
          // ID 2: Rating Category
          {
            id: 2,
            name: 'Top 5 Ranking Applicants',
            category: 'Rating',
            type: 'PDF',
            description: 'By Publication Date',
            apiEndpoint: null,
          },
          // ID 3: Applicant Category
          {
            id: 3,
            name: 'Applicant per Position',
            category: 'Applicant',
            type: 'PDF',
            description: 'By Publication Date and Position',
            apiEndpoint: null,
          },
          // ID 4: Publication Category
          {
            id: 4,
            name: 'Newly Appointed and Promoted Permanent Employees',
            category: 'Publication',
            type: 'PDF',
            description: 'By Publication Date',
            apiEndpoint: null,
          },
          // ID 5: Publication Category (PDF)
          {
            id: 5,
            name: 'List of Position',
            category: 'Publication',
            type: 'PDF',
            description: 'By Publication Date',
            apiEndpoint: null,
          },
          // ID 6: Rating Category
          {
            id: 6,
            name: 'BEI Summary Report',
            category: 'Rating',
            type: 'PDF',
            description: 'By Publication Date and Position',
            apiEndpoint: null,
          },
          // ID 11: Publication Category (Excel)
          {
            id: 11,
            name: 'List of Position (Excel)',
            category: 'Publication',
            type: 'Excel',
            description: 'List of Position Report - Excel Format',
            apiEndpoint: '/api/generate/list/jobPost',
            needsDateOnly: true,
          },
          // ID 12: Applicant Category (Excel)
          {
            id: 12,
            name: 'List of Prequalified Applicantions',
            category: 'Applicant',
            type: 'Excel',
            description: 'List of Prequalified Applicants - Excel Format',
            apiEndpoint: '/api/generate/applicant/qualified',
            needsDateOnly: true,
          },
          // ID 13: Applicant Category (Excel)
          {
            id: 13,
            name: 'List of For QS Validation Applicantions',
            category: 'Applicant',
            type: 'Excel',
            description: 'List of Applicants for QS Validation - Excel Format',
            apiEndpoint: '/api/generate/applicant/unqualified',
            needsDateOnly: true,
          },
          // ID 14: Applicant Category (Excel)
          {
            id: 14,
            name: 'List of All Applicantions with Demographics',
            category: 'Applicant',
            type: 'Excel',
            description: 'List of All Applicants with Demographics - Excel Format',
            apiEndpoint: '/api/generate/applicant',
            needsDateOnly: true,
          },
          // ID 15: Applicant Category (Excel) - NEW REPORT
          {
            id: 15,
            name: 'List of Internal Applicants',
            category: 'Applicant',
            type: 'Excel',
            description: 'List of Internal Prequalified Applicants - Excel Format',
            apiEndpoint: '/api/generate/internal/applicant/designation',
            needsDateOnly: true,
          },
          {
            id: 16,
            name: 'Top 5 Ranking Applicants (Excel)',
            category: 'Rating',
            type: 'Excel',
            description: 'Top 5 Ranking Applicants Report - Excel Format',
            apiEndpoint: '/generate/top/applicant',
            needsDateOnly: true,
          },
          {
            id: 17,
            name: 'List of Qualified and Recommended Applicants',
            category: 'Applicant',
            type: 'Excel',
            description: 'List of Qualified and Recommended Applicants - Excel Format',
            apiEndpoint: '/api/generate/applicant/qualified-recommended',
            needsDateOnly: true,
          },
          {
            id: 18,
            name: 'Selected Applicant per Position',
            category: 'Applicant',
            type: 'PDF',
            description: 'By Publication Date and Position',
            apiEndpoint: null,
          },
        ],

        pagination: { rowsPerPage: 10 },

        // ==================== MODAL VISIBILITY STATES ====================
        selectedReport: null,
        showReportModal: false,
        showPublicationDateModal: false, // For Excel reports that only need date

        // Top 5 Ranking Modal
        showTop5Modal: false,

        // List of Position PDF Modal
        showListPositionModal: false,

        // Newly Appointed Modal
        showNewEmployeeModal: false,

        // ==================== REPORT VIEWER VISIBILITY STATES ====================
        showFinalSummaryReportViewer: false,
        showTop5ReportViewer: false,
        showApplicantReportViewer: false,
        showBEISummaryReportViewer: false,
        showListPositionReportViewer: false,

        // ==================== POSITIONS DATA ====================
        loadingPositions: false,
        finalSummaryPositionsData: [],
        beiPositionsData: [],
        positionOptions: [],
        selectedPositions: [],

        // NEW: search-narrowed list of position options rendered by the q-select
        filteredPositionSearchOptions: [],

        // Publication date filter (Final Summary / Applicant per Position / BEI Summary)
        selectedReportPublicationDate: null,

        // ==================== TOP 5 RANKING DATA ====================
        loadingPublicationDates: false,
        top5PublicationDateOptions: [],
        filteredTop5PublicationDateOptions: [],
        selectedTop5PublicationDate: null,

        // ==================== LIST OF POSITION PDF DATA ====================
        loadingListPositionDates: false,
        listPositionPublicationDateOptions: [],
        filteredListPositionDateOptions: [],
        selectedListPositionPublicationDate: null,

        // ==================== NEWLY APPOINTED DATA ====================
        loadingNewEmployeeDates: false,
        newEmployeeDateOptions: [],
        filteredNewEmployeeDateOptions: [],
        selectedNewEmployeePublicationDate: null,
        selectedNewEmployeeEffectiveDate: null,

        // ==================== PUBLICATION DATE MODAL DATA (For Excel Reports) ====================
        publicationDateOptions: [],
        filteredPublicationDateOptions: [],
        selectedPublicationDate: null,
        loadingPublicationDatesForExcel: false,

        // ==================== SELECTED APPLICANT PER POSITION ====================
        showSelectedApplicantModal: false,
      };
    },

    computed: {
      filteredReports() {
        if (!this.searchQuery) {
          return this.reports;
        }
        const query = this.searchQuery.toLowerCase();
        return this.reports.filter(
          (report) =>
            report.name.toLowerCase().includes(query) ||
            report.category.toLowerCase().includes(query) ||
            report.description.toLowerCase().includes(query),
        );
      },

      // ==================== POSITION FILTER COMPUTED PROPERTIES ====================
      currentPositionsData() {
        // Use the same data for both Final Summary and BEI
        return this.finalSummaryPositionsData;
      },

      allPositions() {
        return this.filteredPositionOptions
          .filter((p) => p.value !== 'select_all')
          .map((p) => p.value);
      },

      allSelected() {
        return (
          this.selectedPositions.length === this.allPositions.length && this.allPositions.length > 0
        );
      },

      displayPositions() {
        if (this.allSelected) return 'All positions selected';
        const selectedLabels = this.filteredPositionOptions
          .filter((opt) => this.selectedPositions.includes(opt.value) && opt.value !== 'select_all')
          .map((opt) => opt.label);
        return selectedLabels.join(', ');
      },

      // Unique publication date ranges built from the loaded positions,
      // displayed as "April 27, 2026 - May 14, 2026"
      reportPublicationDateOptions() {
        const map = new Map();

        this.currentPositionsData.forEach((pos) => {
          const postDate = this.normalizeDate(pos.post_date);
          const endDate = pos.end_date ? this.normalizeDate(pos.end_date) : '';
          const key = `${postDate}|${endDate}`;

          if (!map.has(key)) {
            map.set(key, {
              value: key,
              postDate,
              endDate,
              label: pos.end_date
                ? `${this.formatDate(pos.post_date)} - ${this.formatDate(pos.end_date)}`
                : this.formatDate(pos.post_date),
            });
          }
        });

        return Array.from(map.values());
      },

      // Base list, narrowed by the selected publication date only.
      // This stays the "source of truth" for Select All / allSelected / displayPositions.
      filteredPositionOptions() {
        if (!this.selectedReportPublicationDate) {
          return this.positionOptions;
        }

        const [postDate, endDate] = this.selectedReportPublicationDate.split('|');

        const filteredPositions = this.currentPositionsData.filter((pos) => {
          const p = this.normalizeDate(pos.post_date);
          const e = pos.end_date ? this.normalizeDate(pos.end_date) : '';
          return p === postDate && e === endDate;
        });

        const valueKey = 'jobpostId';
        const labelKey = 'Position';

        return [
          { value: 'select_all', label: 'Select All' },
          ...filteredPositions.map((pos) => ({
            value: pos[valueKey],
            label: `${pos[labelKey]} (${this.formatDate(pos.post_date)})`,
            postDate: pos.post_date,
          })),
        ];
      },

      // ==================== NEWLY APPOINTED COMPUTED PROPERTIES ====================
      availableEffectiveDates() {
        if (!this.selectedNewEmployeePublicationDate) return [];
        const entry = this.newEmployeeDateOptions.find(
          (item) => item.date === this.selectedNewEmployeePublicationDate,
        );
        if (!entry) return [];
        return entry.effective_date_available
          .map((e) => e.effectiveDate)
          .filter((d) => d !== null && d !== undefined);
      },
    },

    watch: {
      selectedReportPublicationDate() {
        this.selectedPositions = [];
      },

      // NEW: whenever the date-filtered base list changes (date picked/cleared,
      // positions loaded), reset the search list to match it so the q-select
      // shows the full set again until the user types something.
      filteredPositionOptions: {
        immediate: true,
        handler(newVal) {
          this.filteredPositionSearchOptions = [...newVal];
        },
      },

      showReportModal(newVal) {
        if (newVal && this.selectedReport) {
          // Load the same positions for Final Summary, Applicant per Position, and BEI
          if (
            this.selectedReport.id === 1 ||
            this.selectedReport.id === 3 ||
            this.selectedReport.id === 6
          ) {
            this.loadFinalSummaryPositions();
          }
        }
      },
    },

    async mounted() {
      // Removed automatic loading - will load based on modal open
    },

    methods: {
      // ==================== DATA LOADING METHODS ====================

      async loadFinalSummaryPositions() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingPositions = true;
        try {
          const positions = await summaryReportStore.fetchPositionWithRating();
          this.finalSummaryPositionsData = positions;
          this.updatePositionOptions();
        } catch (error) {
          console.error('Error loading final summary positions:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load positions for Final Summary Report',
            position: 'top',
          });
        } finally {
          this.loadingPositions = false;
        }
      },

      async loadBEIPositions() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingPositions = true;
        try {
          const positions = await summaryReportStore.fetchPositionWithBEI();
          this.beiPositionsData = positions;
          this.updatePositionOptions();
        } catch (error) {
          console.error('Error loading BEI positions:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load positions for BEI Summary Report',
            position: 'top',
          });
        } finally {
          this.loadingPositions = false;
        }
      },

      updatePositionOptions() {
        // Use jobpostId for all report types
        const valueKey = 'jobpostId';
        const labelKey = 'Position';

        this.positionOptions = [
          { value: 'select_all', label: 'Select All' },
          ...this.currentPositionsData.map((pos) => ({
            value: pos[valueKey],
            label: `${pos[labelKey]} (${this.formatDate(pos.post_date)})`,
            postDate: pos.post_date,
          })),
        ];
      },

      async loadTop5PublicationDates() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingPublicationDates = true;
        try {
          const response = await summaryReportStore.fetchPublicationDateList();
          this.top5PublicationDateOptions = response.map((item) => item.date);
          this.filteredTop5PublicationDateOptions = [...this.top5PublicationDateOptions];
        } catch (error) {
          console.error('Error loading Top 5 publication dates:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load publication dates',
            position: 'top',
          });
        } finally {
          this.loadingPublicationDates = false;
        }
      },

      async loadListPositionPublicationDates() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingListPositionDates = true;
        try {
          const response = await summaryReportStore.fetchPublicationDateList();
          this.listPositionPublicationDateOptions = response.map((item) => item.date);
          this.filteredListPositionDateOptions = [...this.listPositionPublicationDateOptions];
        } catch (error) {
          console.error('Error loading publication dates for List of Position:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load publication dates',
            position: 'top',
          });
        } finally {
          this.loadingListPositionDates = false;
        }
      },

      async loadNewEmployeeDates() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingNewEmployeeDates = true;
        try {
          const response = await summaryReportStore.fetchPublicationDateNewEmployee();
          const list = response?.data ?? response;
          this.newEmployeeDateOptions = list;
          this.filteredNewEmployeeDateOptions = [...list];
        } catch (error) {
          console.error('Error loading new employee publication dates:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load publication dates',
            position: 'top',
          });
        } finally {
          this.loadingNewEmployeeDates = false;
        }
      },

      async loadPublicationDatesForExcel() {
        const summaryReportStore = useSummaryReportStore();
        this.loadingPublicationDatesForExcel = true;
        try {
          const response = await summaryReportStore.fetchPublicationDateList();
          this.publicationDateOptions = response.map((item) => item.date);
          this.filteredPublicationDateOptions = [...this.publicationDateOptions];
        } catch (error) {
          console.error('Error loading publication dates for Excel report:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load publication dates',
            position: 'top',
          });
        } finally {
          this.loadingPublicationDatesForExcel = false;
        }
      },

      // ==================== ACTION HANDLERS ====================

      async handleAction(row) {
        this.selectedReport = row;

        // Check if report is Excel type and needs date only
        if (row.type === 'Excel' && row.needsDateOnly) {
          this.openPublicationDateModal();
          return;
        }

        switch (row.id) {
          case 1: // Final Summary of Rating
          case 3: // Applicant per Position
          case 6: // BEI Summary Report
            this.openReportModal();
            break;

          case 2: // Top 5 Ranking Applicants
            this.openTop5Modal();
            break;

          case 4: // Newly Appointed and Promoted Permanent Employees
            this.openNewEmployeeModal();
            break;

          case 5: // List of Position (PDF)
            this.openListPositionModal();
            break;

          case 18: // Selected Applicant per Position
            this.openSelectedApplicantModal();
            break;

          case 11: // List of Position (Excel) - should be handled above
          case 12: // List of Prequalified Applicant
          case 13: // List of For QS Validation Applicant
          case 14: // List of All Applicant with Demographics
          case 15: // List of Internal Applicants - handled above
          case 16: // Top 5 Ranking Applicants (Excel) - handled above
            break;

          default:
            console.warn('Unknown report type:', row.id);
        }
      },

      // ==================== PUBLICATION DATE MODAL METHODS (For Excel Reports) ====================

      async openPublicationDateModal() {
        this.showPublicationDateModal = true;
        this.selectedPublicationDate = null;
        await this.loadPublicationDatesForExcel();
      },

      closePublicationDateModal() {
        this.showPublicationDateModal = false;
        this.selectedPublicationDate = null;
        this.publicationDateOptions = [];
        this.filteredPublicationDateOptions = [];
      },

      filterPublicationDates(val, update) {
        update(() => {
          if (val === '') {
            this.filteredPublicationDateOptions = [...this.publicationDateOptions];
          } else {
            const needle = val.toLowerCase();
            this.filteredPublicationDateOptions = this.publicationDateOptions.filter((date) =>
              date.toLowerCase().includes(needle),
            );
          }
        });
      },

      async generateExcelReport() {
        if (!this.selectedReport?.apiEndpoint || !this.selectedPublicationDate) {
          return;
        }

        const summaryReportStore = useSummaryReportStore();
        this.$q.loading.show({
          message: 'Generating report...',
        });

        try {
          let response;
          switch (this.selectedReport.id) {
            case 11: // List of Position
              response = await summaryReportStore.generateListOfPositionExcel(
                this.selectedPublicationDate,
              );
              break;
            case 12: // List of Prequalified Applicant
              response = await summaryReportStore.generatePrequalifiedApplicantExcel(
                this.selectedPublicationDate,
              );
              break;
            case 13: // List of For QS Validation Applicant
              response = await summaryReportStore.generateUnqualifiedApplicantExcel(
                this.selectedPublicationDate,
              );
              break;
            case 14: // List of All Applicant with Demographics
              response = await summaryReportStore.generateAllApplicantExcel(
                this.selectedPublicationDate,
              );
              break;
            case 15: // List of Internal Applicants
              response = await summaryReportStore.generateInternalPrequalifiedApplicantExcel(
                this.selectedPublicationDate,
              );
              break;
            case 16: // Top 5 Ranking Applicants (Excel)
              response = await summaryReportStore.generateTopApplicant(
                this.selectedPublicationDate,
              );
              break;
            case 17: // NEW: List of Qualified and Recommended Applicants
              response = await summaryReportStore.generateQualifiedRecommendedApplicantExcel(
                this.selectedPublicationDate,
              );
              break;
            default:
              throw new Error('Unknown Excel report type');
          }

          // Create blob and download
          const blob = new Blob([response], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${this.selectedReport.name}_${this.selectedPublicationDate}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.$q.notify({
            type: 'positive',
            message: 'Report generated successfully!',
            position: 'top',
          });

          this.closePublicationDateModal();
        } catch (error) {
          console.error('Error generating Excel report:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to generate report',
            position: 'top',
          });
        } finally {
          this.$q.loading.hide();
        }
      },

      // ==================== REPORT MODAL METHODS ====================

      openReportModal() {
        this.showReportModal = true;
        this.resetFilters();
      },

      resetFilters() {
        this.selectedPositions = [];
        this.selectedReportPublicationDate = null;
      },

      closeReportModal() {
        this.showReportModal = false;
        this.resetFilters();
        this.finalSummaryPositionsData = [];
        this.beiPositionsData = [];
        this.positionOptions = [];
      },

      toggleSelectAll() {
        if (this.allSelected) {
          this.selectedPositions = [];
        } else {
          this.selectedPositions = [...this.allPositions];
        }
      },

      togglePosition(pos) {
        const index = this.selectedPositions.indexOf(pos);
        if (index > -1) {
          this.selectedPositions = this.selectedPositions.filter((p) => p !== pos);
        } else {
          this.selectedPositions = [...this.selectedPositions, pos];
        }
      },

      isPositionSelected(pos) {
        return this.selectedPositions.includes(pos);
      },

      // NEW: narrows filteredPositionOptions (the date-filtered base list)
      // by whatever the user types into the position q-select.
      filterPositions(val, update) {
        update(() => {
          if (val === '') {
            this.filteredPositionSearchOptions = [...this.filteredPositionOptions];
          } else {
            const needle = val.toLowerCase();
            this.filteredPositionSearchOptions = this.filteredPositionOptions.filter(
              (opt) => opt.value === 'select_all' || opt.label.toLowerCase().includes(needle),
            );
          }
        });
      },

      openReport() {
        this.showReportModal = false;

        if (this.selectedReport?.id === 3) {
          this.showApplicantReportViewer = true;
        } else if (this.selectedReport?.id === 6) {
          this.showBEISummaryReportViewer = true;
        } else {
          this.showFinalSummaryReportViewer = true;
        }
      },

      // ==================== TOP 5 RANKING METHODS ====================

      async openTop5Modal() {
        this.showTop5Modal = true;
        this.resetTop5Filters();
        await this.loadTop5PublicationDates();
      },

      resetTop5Filters() {
        this.selectedTop5PublicationDate = null;
      },

      closeTop5Modal() {
        this.showTop5Modal = false;
        this.resetTop5Filters();
        this.top5PublicationDateOptions = [];
        this.filteredTop5PublicationDateOptions = [];
      },

      filterTop5PublicationDates(val, update) {
        update(() => {
          if (val === '') {
            this.filteredTop5PublicationDateOptions = [...this.top5PublicationDateOptions];
          } else {
            const needle = val.toLowerCase();
            this.filteredTop5PublicationDateOptions = this.top5PublicationDateOptions.filter(
              (date) => date.toLowerCase().includes(needle),
            );
          }
        });
      },

      generateTop5Report() {
        this.showTop5Modal = false;
        this.showTop5ReportViewer = true;
      },

      // ==================== LIST OF POSITION PDF METHODS ====================

      async openListPositionModal() {
        this.showListPositionModal = true;
        this.resetListPositionFilters();
        await this.loadListPositionPublicationDates();
      },

      resetListPositionFilters() {
        this.selectedListPositionPublicationDate = null;
      },

      closeListPositionModal() {
        this.showListPositionModal = false;
        this.resetListPositionFilters();
        this.listPositionPublicationDateOptions = [];
        this.filteredListPositionDateOptions = [];
      },

      filterListPositionDates(val, update) {
        update(() => {
          if (val === '') {
            this.filteredListPositionDateOptions = [...this.listPositionPublicationDateOptions];
          } else {
            const needle = val.toLowerCase();
            this.filteredListPositionDateOptions = this.listPositionPublicationDateOptions.filter(
              (date) => date.toLowerCase().includes(needle),
            );
          }
        });
      },

      generateListPositionReport() {
        this.showListPositionModal = false;
        this.showListPositionReportViewer = true;
      },

      // ==================== NEWLY APPOINTED METHODS ====================

      async openNewEmployeeModal() {
        this.showNewEmployeeModal = true;
        this.resetNewEmployeeFilters();
        await this.loadNewEmployeeDates();
      },

      resetNewEmployeeFilters() {
        this.selectedNewEmployeePublicationDate = null;
        this.selectedNewEmployeeEffectiveDate = null;
      },

      closeNewEmployeeModal() {
        this.showNewEmployeeModal = false;
        this.resetNewEmployeeFilters();
        this.newEmployeeDateOptions = [];
        this.filteredNewEmployeeDateOptions = [];
      },

      filterNewEmployeeDates(val, update) {
        update(() => {
          if (val === '') {
            this.filteredNewEmployeeDateOptions = [...this.newEmployeeDateOptions];
          } else {
            const needle = val.toLowerCase();
            this.filteredNewEmployeeDateOptions = this.newEmployeeDateOptions.filter((item) =>
              item.date.toLowerCase().includes(needle),
            );
          }
        });
      },

      onNewEmployeePublicationDateChange() {
        this.selectedNewEmployeeEffectiveDate = null;

        const dates = this.availableEffectiveDates;

        if (dates.length === 0) {
          this.selectedNewEmployeeEffectiveDate = null;
        } else if (dates.length === 1) {
          this.selectedNewEmployeeEffectiveDate = dates[0];
        }
      },

      generateNewEmployeeReport() {
        this.showNewEmployeeModal = false;
        this.$q.notify({
          type: 'info',
          message: 'Opening PDF report...',
          position: 'top',
        });
      },

      // ==================== SELECTED APPLICANT PER POSITION METHODS ====================

      openSelectedApplicantModal() {
        this.showSelectedApplicantModal = true;
      },

      closeSelectedApplicantModal() {
        this.showSelectedApplicantModal = false;
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

      formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
  };
</script>

<style scoped>
  .search-input {
    max-width: 400px;
  }
</style>
