<template>
  <q-dialog
    v-model="show"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card
      class="column"
      style="
        width: 100vw;
        max-width: 1500px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        border-radius: 0;
        overflow: hidden;
      "
    >
      <!-- Header -->
      <q-card-section
        class="row items-center q-pb-none q-pt-md q-px-lg bg-white"
        style="flex-shrink: 0"
      >
        <q-icon name="assignment" color="primary" size="28px" class="q-mr-sm" />
        <div>
          <div class="text-h6 text-bold text-grey-9">Request for Publication</div>
          <div class="text-caption text-grey-6">
            Select positions to include in the publication request
          </div>
        </div>
        <q-space />
        <q-btn flat round icon="close" color="grey-7" @click="$emit('close')" />
      </q-card-section>

      <q-separator class="q-mt-md" style="flex-shrink: 0" />

      <!-- Tabs — full width justified -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        style="flex-shrink: 0"
      >
        <q-tab name="select" icon="checklist" label="Select Positions" />
        <q-tab
          name="review"
          icon="rate_review"
          label="Review"
          :disable="selectedPositions.length === 0"
        >
          <q-badge
            v-if="selectedPositions.length > 0"
            color="primary"
            floating
            rounded
            style="top: 4px; right: 4px; font-size: 10px"
          >
            {{ selectedPositions.length }}
          </q-badge>
        </q-tab>
      </q-tabs>

      <q-separator style="flex-shrink: 0" />

      <!-- Tab Panels -->
      <q-tab-panels
        v-model="activeTab"
        animated
        style="flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden"
      >
        <!-- ── SELECT POSITIONS TAB ── -->
        <q-tab-panel
          name="select"
          class="q-pa-none"
          style="
            flex: 1 1 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          "
        >
          <!-- Toolbar -->
          <div
            class="row items-center q-pa-md bg-grey-1"
            style="flex-shrink: 0; flex-wrap: wrap; gap: 8px"
          >
            <q-input
              v-model="searchText"
              dense
              outlined
              placeholder="Search position..."
              style="width: 220px"
              clearable
              bg-color="white"
            >
              <template v-slot:prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>

            <q-select
              v-model="selectedOfficeFilter"
              :options="filteredOfficeOptions"
              dense
              outlined
              clearable
              label="Filter by Office"
              style="min-width: 260px; flex: 1; max-width: 500px"
              bg-color="white"
              use-input
              fill-input
              hide-selected
              input-debounce="200"
              @filter="filterOfficeOptions"
            >
              <template v-slot:prepend>
                <q-icon name="filter_list" size="18px" color="grey-6" />
              </template>
              <template v-slot:no-option>
                <q-item dense>
                  <q-item-section class="text-grey text-caption">No offices found</q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Vacancy Status Filter Dropdown -->
            <q-select
              v-model="vacancyFilter"
              :options="vacancyOptions"
              dense
              outlined
              label="Vacancy Status"
              style="width: 160px"
              bg-color="white"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="work_outline" size="18px" color="grey-6" />
              </template>
            </q-select>

            <!-- Funded Filter Dropdown -->
            <q-select
              v-model="fundedFilter"
              :options="fundedOptions"
              dense
              outlined
              label="Funded"
              style="width: 140px"
              bg-color="white"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="monetization_on" size="18px" color="grey-6" />
              </template>
            </q-select>

            <q-space />

            <!-- Selected count chip -->
            <q-chip
              v-if="selectedPositions.length > 0"
              dense
              color="primary"
              text-color="white"
              icon="check_circle"
            >
              {{ selectedPositions.length }} selected
            </q-chip>
          </div>

          <!-- Table -->
          <div style="flex: 1 1 0; min-height: 0; overflow-y: auto; overflow-x: hidden">
            <q-table
              flat
              dense
              :rows="filteredRows"
              :columns="columns"
              row-key="ID"
              :loading="loading"
              v-model:selected="selectedPositions"
              selection="multiple"
              :rows-per-page-options="[0]"
              hide-bottom
              class="positions-table"
            >
              <template v-slot:loading>
                <q-inner-loading showing color="primary" />
              </template>

              <template v-slot:body-cell-vacancyStatus="props">
                <q-td :props="props" class="text-center">
                  <q-badge
                    :color="!isFilled(props.row) ? 'positive' : 'grey-5'"
                    :label="!isFilled(props.row) ? 'Vacant' : 'Filled'"
                    class="text-weight-medium"
                    style="font-size: 11px; padding: 3px 8px"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-Funded="props">
                <q-td :props="props" class="text-center">
                  <q-icon
                    :name="props.row.Funded === '1' ? 'check_circle' : 'cancel'"
                    :color="props.row.Funded === '1' ? 'positive' : 'grey-4'"
                    size="18px"
                  />
                </q-td>
              </template>

              <template v-slot:no-data>
                <div class="full-width column flex-center q-pa-xl text-grey-6">
                  <q-icon name="search_off" size="3rem" class="q-mb-sm" />
                  <div class="text-subtitle2">No positions found</div>
                  <div class="text-caption">Try adjusting your filters</div>
                </div>
              </template>
            </q-table>
          </div>
        </q-tab-panel>

        <!-- ── REVIEW TAB ── -->
        <q-tab-panel
          name="review"
          class="q-pa-none"
          style="
            flex: 1 1 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          "
        >
          <!-- Review Toolbar -->
          <div class="row items-center q-px-md q-py-sm bg-grey-1" style="flex-shrink: 0; gap: 8px">
            <q-icon name="rate_review" color="primary" size="20px" />
            <div class="text-subtitle2 text-grey-8">
              Review
              <span class="text-primary text-bold">{{ selectedPositions.length }}</span>
              selected position(s) before generating
            </div>
            <q-space />
            <q-btn
              flat
              dense
              size="sm"
              color="grey-7"
              icon="arrow_back"
              label="Back to Selection"
              @click="activeTab = 'select'"
            />
          </div>

          <!-- Summary Cards -->
          <div
            class="row no-wrap q-px-md q-pb-md q-pt-sm q-gutter-sm bg-grey-1"
            style="flex-shrink: 0"
          >
            <q-card flat bordered class="summary-card col">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-h5 text-primary text-bold">{{ selectedPositions.length }}</div>
                <div class="text-caption text-grey-6">Total</div>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="summary-card col">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-h5 text-positive text-bold">{{ fundedCount }}</div>
                <div class="text-caption text-grey-6">Funded</div>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="summary-card col">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-h5 text-grey-6 text-bold">{{ unfundedCount }}</div>
                <div class="text-caption text-grey-6">Unfunded</div>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="summary-card col">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-h5 text-orange text-bold">{{ uniqueOffices }}</div>
                <div class="text-caption text-grey-6">Offices</div>
              </q-card-section>
            </q-card>
          </div>

          <q-separator style="flex-shrink: 0" />

          <!-- Review Table -->
          <div style="flex: 1 1 0; min-height: 0; overflow-y: auto; overflow-x: hidden">
            <q-table
              flat
              dense
              :rows="selectedPositions"
              :columns="reviewColumns"
              row-key="ID"
              :rows-per-page-options="[0]"
              hide-bottom
              class="positions-table"
            >
              <template v-slot:body-cell-vacancyStatus="props">
                <q-td :props="props" class="text-center">
                  <q-badge
                    :color="!isFilled(props.row) ? 'positive' : 'grey-5'"
                    :label="!isFilled(props.row) ? 'Vacant' : 'Filled'"
                    style="font-size: 11px; padding: 3px 8px"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-Funded="props">
                <q-td :props="props" class="text-center">
                  <q-icon
                    :name="props.row.Funded === '1' ? 'check_circle' : 'cancel'"
                    :color="props.row.Funded === '1' ? 'positive' : 'grey-4'"
                    size="18px"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-remove="props">
                <q-td :props="props" class="text-center">
                  <q-btn
                    flat
                    round
                    dense
                    icon="remove_circle_outline"
                    color="negative"
                    size="sm"
                    @click="removeFromSelection(props.row)"
                  >
                    <q-tooltip>Remove from selection</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template v-slot:no-data>
                <div class="full-width column flex-center q-pa-xl text-grey-6">
                  <q-icon name="inbox" size="3rem" class="q-mb-sm" />
                  <div class="text-subtitle2">No positions selected</div>
                  <q-btn
                    flat
                    color="primary"
                    label="Go select positions"
                    @click="activeTab = 'select'"
                  />
                </div>
              </template>
            </q-table>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <!-- Footer -->
      <q-separator style="flex-shrink: 0" />
      <q-card-actions align="right" class="q-pa-md bg-white" style="flex-shrink: 0">
        <q-btn flat label="Cancel" color="grey-7" @click="$emit('close')" class="q-mr-sm" />
        <q-btn
          v-if="activeTab === 'select'"
          unelevated
          label="Review Selection"
          color="primary"
          icon-right="arrow_forward"
          :disable="selectedPositions.length === 0"
          @click="activeTab = 'review'"
        />
        <q-btn
          v-if="activeTab === 'review'"
          unelevated
          label="Generate"
          color="positive"
          icon="description"
          :disable="selectedPositions.length === 0"
          @click="handleGenerate"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { usePlantillaStore } from 'stores/plantillaStore';
  import { usePlantillaPublicationStore } from 'stores/plantillaPublicationStore';
  import { useQuasar } from 'quasar';

  const $q = useQuasar();
  const emit = defineEmits(['close', 'generate']);

  const show = ref(true);
  const activeTab = ref('select');
  const searchText = ref('');
  const selectedOfficeFilter = ref(null);
  const selectedPositions = ref([]);
  const loading = ref(false);
  const allRows = ref([]);
  const filteredOfficeOptions = ref([]);
  const usePublication = usePlantillaPublicationStore();

  // Vacancy status filter — default to 'vacant'
  const vacancyFilter = ref('vacant');
  const vacancyOptions = [
    { label: 'All', value: 'all' },
    { label: 'Vacant', value: 'vacant' },
    { label: 'Filled', value: 'filled' },
  ];

  // Funded filter — default to 'all'
  const fundedFilter = ref('all');
  const fundedOptions = [
    { label: 'All', value: 'all' },
    { label: 'Funded', value: '1' },
    { label: 'Unfunded', value: '0' },
  ];

  const usePlantilla = usePlantillaStore();

  // ── Columns ──────────────────────────────────────────────────────
  const columns = [
    {
      name: 'ID',
      label: 'ID',
      field: 'ID',
      align: 'left',
      sortable: true,
      style: 'width: 4%',
      headerStyle: 'width: 4%',
    },
    {
      name: 'PageNo',
      label: 'Page No',
      field: 'PageNo',
      align: 'center',
      sortable: true,
      style: 'width: 5%',
      headerStyle: 'width: 5%',
    },
    {
      name: 'ItemNo',
      label: 'Item No',
      field: 'ItemNo',
      align: 'center',
      sortable: true,
      style: 'width: 5%',
      headerStyle: 'width: 5%',
    },
    {
      name: 'position',
      label: 'Position',
      field: 'position',
      align: 'left',
      sortable: true,
      classes: 'wrap-cell',
      style: 'width: 35%',
      headerStyle: 'width: 35%',
    },
    {
      name: 'office',
      label: 'Office',
      field: 'office',
      align: 'left',
      sortable: true,
      classes: 'wrap-cell',
      style: 'width: 35%',
      headerStyle: 'width: 35%',
    },
    {
      name: 'Funded',
      label: 'Funded',
      field: 'Funded',
      align: 'center',
      sortable: true,
      style: 'width: 5%',
      headerStyle: 'width: 5%',
    },
    {
      name: 'vacancyStatus',
      label: 'Vacancy Status',
      field: 'vacancyStatus',
      align: 'center',
      sortable: false,
      style: 'width: 10%',
      headerStyle: 'width: 10%',
    },
  ];

  // Review columns: same base columns + remove button (4+6+6+30+27+7+11+5 = 96% + 3% remove = 99%)
  const reviewColumns = [
    ...columns.map((col) => {
      // Slightly compress to make room for the remove column
      const adjustments = {
        position: '30%',
        office: '27%',
        Funded: '7%',
        vacancyStatus: '11%',
      };
      return adjustments[col.name]
        ? {
            ...col,
            style: `width: ${adjustments[col.name]}`,
            headerStyle: `width: ${adjustments[col.name]}`,
          }
        : col;
    }),
    {
      name: 'remove',
      label: '',
      field: 'remove',
      align: 'center',
      style: 'width: 3%',
      headerStyle: 'width: 3%',
    },
  ];

  // ── Helpers ───────────────────────────────────────────────────────
  // A position is "filled" when ControlNo has an actual value
  const isFilled = (row) => {
    return row.ControlNo && String(row.ControlNo).trim() !== '';
  };

  // ── Computed ──────────────────────────────────────────────────────
  const officeOptions = computed(() =>
    [...new Set(allRows.value.map((r) => r.office).filter(Boolean))].sort(),
  );

  const filteredRows = computed(() => {
    const search = searchText.value?.toLowerCase().trim() ?? '';

    return allRows.value.filter((row) => {
      // Search: match position title or ID
      const matchSearch =
        !search ||
        (row.position ?? '').toLowerCase().includes(search) ||
        String(row.ID ?? '')
          .toLowerCase()
          .includes(search);

      // Office dropdown filter
      const matchOffice = !selectedOfficeFilter.value || row.office === selectedOfficeFilter.value;

      // Vacancy: based on ControlNo presence
      const filled = isFilled(row);
      const matchVacancy =
        vacancyFilter.value === 'all' ||
        (vacancyFilter.value === 'vacant' && !filled) ||
        (vacancyFilter.value === 'filled' && filled);

      // Funded: based on Funded field
      const matchFunded = fundedFilter.value === 'all' || row.Funded === fundedFilter.value;

      return matchSearch && matchOffice && matchVacancy && matchFunded;
    });
  });

  const fundedCount = computed(
    () => selectedPositions.value.filter((r) => r.Funded === '1').length,
  );
  const unfundedCount = computed(
    () => selectedPositions.value.filter((r) => r.Funded !== '1').length,
  );
  const uniqueOffices = computed(() => new Set(selectedPositions.value.map((r) => r.office)).size);

  // ── Methods ───────────────────────────────────────────────────────
  const filterOfficeOptions = (val, update) => {
    update(() => {
      if (!val.trim()) {
        filteredOfficeOptions.value = officeOptions.value;
      } else {
        const needle = val.toLowerCase();
        filteredOfficeOptions.value = officeOptions.value.filter((o) =>
          o.toLowerCase().includes(needle),
        );
      }
    });
  };

  const removeFromSelection = (row) => {
    selectedPositions.value = selectedPositions.value.filter((r) => r.ID !== row.ID);
    if (selectedPositions.value.length === 0) activeTab.value = 'select';
  };

  const handleGenerate = async () => {
    try {
      await usePublication.generateJobPosition(selectedPositions.value);
      $q.notify({
        type: 'positive',
        message: `Publication request generated for ${selectedPositions.value.length} position(s).`,
        position: 'top',
        timeout: 3000,
      });
      emit('generate', selectedPositions.value);
      emit('close');
    } catch {
      $q.notify({
        type: 'negative',
        message: usePublication.error ?? 'Failed to generate publication request.',
        position: 'top',
        timeout: 4000,
      });
    }
  };

  // ── Lifecycle ─────────────────────────────────────────────────────
  onMounted(async () => {
    loading.value = true;
    if (!usePlantilla.plantilla?.length) {
      await usePlantilla.fetchPlantilla();
    }
    allRows.value = Array.isArray(usePlantilla.plantilla) ? usePlantilla.plantilla : [];
    // Initialize after allRows is set so officeOptions computed has data
    filteredOfficeOptions.value = [...officeOptions.value];
    loading.value = false;
  });
</script>

<style scoped>
  /* Align the checkbox column header to the left */
  .positions-table :deep(thead tr th:first-child) {
    text-align: left !important;
    padding-left: 12px !important;
  }

  /* Fix checkbox cell alignment and width */
  .positions-table :deep(thead tr th:first-child),
  .positions-table :deep(tbody tr td:first-child) {
    width: 48px !important;
    min-width: 48px !important;
    max-width: 48px !important;
  }

  /* Sticky header */
  .positions-table :deep(thead tr th) {
    font-size: 12px;
    font-weight: 700;
    color: #616161;
    background: #fafafa;
    border-bottom: 2px solid #e0e0e0;
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .positions-table :deep(tbody tr:hover td) {
    background: #f1f8ff;
  }

  .positions-table :deep(tbody tr td) {
    font-size: 13px;
    color: #37474f;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
  }

  /* Wrap long text in position/office cells */
  .positions-table :deep(.wrap-cell) {
    white-space: normal;
    word-break: break-word;
  }

  /* Kill horizontal scroll entirely */
  .positions-table :deep(.q-table__container) {
    overflow-x: hidden !important;
  }

  .positions-table :deep(.q-table__middle) {
    overflow-x: hidden !important;
  }

  .positions-table :deep(table) {
    table-layout: fixed;
    width: 100%;
  }

  /* Remove default bottom padding from q-table */
  .positions-table :deep(.q-table__bottom) {
    display: none;
  }

  .summary-card {
    border-radius: 8px !important;
    min-width: 80px;
  }
</style>
