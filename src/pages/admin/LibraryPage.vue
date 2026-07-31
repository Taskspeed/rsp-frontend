<template>
  <q-page class="q-pa-md">
    <!-- ── Page Header ─────────────────────────────────────────────── -->
    <div class="column items-start justify-center q-mb-md">
      <h5 class="text-h5 q-ma-none"><b>Library</b></h5>
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────────────── -->
    <q-tabs
      v-model="activeTab"
      class="q-mb-md"
      dense
      align="left"
      narrow-indicator
      indicator-color="primary"
    >
      <q-tab name="remarks" icon="comment" label="Remarks" />
      <q-tab name="office" icon="business" label="Office" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <!-- ── Tab Panels ───────────────────────────────────────────────── -->
    <q-tab-panels v-model="activeTab" animated>
      <!-- ================================================================
           REMARKS TAB
           ================================================================ -->
      <q-tab-panel name="remarks" class="q-pa-none">
        <!-- ── Filters / Toolbar ───────────────────────────────────────── -->
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="globalSearch"
              outlined
              dense
              placeholder="Search remarks..."
              clearable
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="categoryFilter"
              :options="categoryOptions"
              outlined
              dense
              label="Filter by category"
              clearable
              emit-value
              map-options
            >
              <template #prepend>
                <q-icon name="category" color="primary" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-6 flex justify-end">
            <q-btn
              v-if="hasModifyPermission"
              rounded
              unelevated
              color="primary"
              icon="add"
              @click="openAddDialog"
            >
              <span class="gt-xs q-ml-xs">Add Remark</span>
            </q-btn>
          </div>
        </div>

        <!-- ── Main Table ────────────────────────────────────────────────── -->
        <div class="table-scroll-wrapper">
          <q-table
            :rows="getRemarkRows()"
            :columns="remarkColumns"
            row-key="remarks_id"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100, 200]"
            :loading="remarkStore.loading"
            flat
            wrap-cells
          >
            <template #body-cell-category="props">
              <q-td :props="props">
                <q-badge :color="getCategoryColor(props.row.category)" class="category-badge">
                  {{ props.row.category || 'N/A' }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-action="p">
              <q-td :props="p">
                <q-btn
                  v-if="hasModifyPermission"
                  flat
                  round
                  dense
                  color="green"
                  class="bg-green-1"
                  icon="edit"
                  @click="editRemark(p.row)"
                >
                  <q-tooltip>Update</q-tooltip>
                </q-btn>

                <q-btn
                  v-if="hasModifyPermission"
                  flat
                  round
                  dense
                  color="red"
                  class="bg-red-1"
                  icon="delete"
                  @click="deleteRemark(p.row.remarks_id)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>

                <q-badge v-if="!hasModifyPermission" outline color="blue" class="read-only-badge">
                  <q-icon name="visibility" size="12px" class="q-mr-xs" />
                  Read Only
                </q-badge>
              </q-td>
            </template>

            <template #no-data>
              <div class="full-width row flex-center q-pa-md text-grey">No Remarks Found</div>
            </template>
          </q-table>
        </div>
      </q-tab-panel>

      <!-- ================================================================
           OFFICE TAB
           ================================================================ -->
      <q-tab-panel name="office" class="q-pa-none">
        <!-- ── Toolbar ──────────────────────────────────────────────────── -->
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="officeSearch"
              outlined
              dense
              placeholder="Search offices..."
              clearable
            >
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-8 flex justify-end">
            <q-btn
              v-if="hasModifyPermission"
              rounded
              unelevated
              color="primary"
              icon="add"
              @click="openAddOfficeDialog"
            >
              <span class="gt-xs q-ml-xs">Add Office</span>
            </q-btn>
          </div>
        </div>

        <!-- ── Office Table ──────────────────────────────────────────────── -->
        <div class="table-scroll-wrapper">
          <q-table
            :rows="getOfficeRows()"
            :columns="officeColumns"
            row-key="officeId"
            v-model:pagination="officePagination"
            :rows-per-page-options="[10, 20, 50, 100, 200]"
            :loading="officeStore.loading"
            flat
            wrap-cells
          >
            <template #body-cell-action="p">
              <q-td :props="p">
                <q-btn
                  flat
                  round
                  dense
                  color="teal"
                  class="bg-teal-1 q-mr-xs"
                  icon="account_tree"
                  @click="openStructureDialog(p.row)"
                >
                  <q-tooltip>
                    {{ hasModifyPermission ? 'Manage Structure' : 'View Structure' }}
                  </q-tooltip>
                </q-btn>

                <!-- Only show Edit/Delete buttons if structure exists AND user has permission -->
                <q-btn
                  v-if="hasModifyPermission && p.row.structure === true"
                  flat
                  round
                  dense
                  color="green"
                  class="bg-green-1"
                  icon="edit"
                  @click="editOffice(p.row)"
                >
                  <q-tooltip>Update</q-tooltip>
                </q-btn>

                <q-btn
                  v-if="hasModifyPermission && p.row.structure === true"
                  flat
                  round
                  dense
                  color="red"
                  class="bg-red-1"
                  icon="delete"
                  @click="deleteOffice(p.row.officeId)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>

            <template #no-data>
              <div class="full-width row flex-center q-pa-md text-grey">No Offices Found</div>
            </template>
          </q-table>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- ================================================================
         REMARK ADD DIALOG
         ================================================================ -->
    <q-dialog
      v-model="addDialog"
      persistent
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="width: 600px; max-width: 96vw; border-radius: 16px; overflow: hidden">
        <!-- ── Header ── -->
        <div class="add-dialog-header">
          <div class="row items-center q-gutter-sm">
            <div class="add-dialog-icon-wrap">
              <q-icon name="comment" color="white" size="20px" />
            </div>
            <div>
              <div class="text-subtitle1 text-bold text-white">Add New Remark</div>
              <div class="text-caption" style="color: rgba(255, 255, 255, 0.65)">
                Fill in the remark details below
              </div>
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="white" style="opacity: 0.75" v-close-popup />
        </div>

        <!-- ── Body ── -->
        <q-card-section
          class="q-pa-lg"
          style="max-height: 68vh; overflow-y: auto; background: #fff"
        >
          <!-- Step 1 — Remark Text -->
          <div class="add-section-block q-mb-lg">
            <div class="add-section-label">
              <q-icon name="edit_note" size="15px" class="q-mr-xs" />
              Remark Content
            </div>
            <q-input
              v-model="addForm.remarks"
              placeholder="Type your remark here..."
              outlined
              dense
              type="textarea"
              autogrow
              :input-style="{ minHeight: '90px', fontSize: '13.5px' }"
              :rules="[(v) => !!v || 'Remark is required']"
              class="add-remark-input"
            />
          </div>

          <!-- Step 2 — Category Selection -->
          <div class="add-section-block">
            <div class="add-section-label">
              <q-icon name="category" size="15px" class="q-mr-xs" />
              Select Category
              <span class="add-section-hint">— choose one or more</span>
            </div>

            <!-- Category Cards Grid -->
            <div class="category-card-grid">
              <div
                v-for="cat in categoryOptions"
                :key="cat.value"
                class="category-card"
                :class="{
                  'category-card--active': addForm.categories.includes(cat.value),
                  [`category-card--${cat.value.toLowerCase()}`]: true,
                }"
                @click="toggleCategory(cat.value)"
              >
                <div class="category-card-inner">
                  <div class="category-card-check">
                    <q-icon
                      :name="
                        addForm.categories.includes(cat.value)
                          ? 'check_circle'
                          : 'radio_button_unchecked'
                      "
                      :color="
                        addForm.categories.includes(cat.value)
                          ? getCategoryColor(cat.value)
                          : 'grey-4'
                      "
                      size="20px"
                    />
                  </div>
                  <div class="category-card-icon">
                    <q-icon
                      :name="getCategoryIcon(cat.value)"
                      size="22px"
                      :color="getCategoryColor(cat.value)"
                    />
                  </div>
                  <div class="category-card-label">{{ cat.label }}</div>
                </div>
              </div>
            </div>

            <!-- Validation -->
            <div v-if="addCategoryError" class="text-negative text-caption q-mt-sm q-ml-xs">
              <q-icon name="error_outline" size="13px" class="q-mr-xs" />
              Please select at least one category.
            </div>
          </div>
        </q-card-section>

        <!-- ── Summary Banner ── -->
        <div v-if="addForm.categories.length > 0 && addForm.remarks" class="add-summary-bar">
          <q-icon name="info_outline" size="15px" class="q-mr-xs" style="opacity: 0.8" />
          <span>
            Will create
            <strong>{{ addForm.categories.length }}</strong>
            remark{{ addForm.categories.length > 1 ? 's' : '' }} under:
          </span>
          <q-badge
            v-for="cat in addForm.categories"
            :key="cat"
            :color="getCategoryColor(cat)"
            class="q-ml-xs"
            style="font-size: 10px; padding: 3px 7px"
          >
            {{ cat }}
          </q-badge>
        </div>

        <q-separator />

        <!-- ── Footer ── -->
        <q-card-actions align="right" class="q-px-lg q-py-md bg-grey-1">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup class="q-mr-xs" />
          <q-btn
            unelevated
            :label="
              addForm.categories.length > 1
                ? `Save ${addForm.categories.length} Remarks`
                : 'Save Remark'
            "
            color="primary"
            icon="save"
            :loading="remarkStore.loading"
            style="border-radius: 8px; min-width: 130px"
            @click="submitAdd"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================================================
         REMARK EDIT DIALOG
         ================================================================ -->
    <q-dialog
      v-model="editDialog"
      persistent
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="width: 560px; max-width: 95vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none q-pt-md q-px-lg">
          <div class="row items-center q-gutter-sm">
            <q-icon name="comment" color="primary" size="22px" />
            <div>
              <div class="text-subtitle1 text-bold text-grey-9">Edit Remark</div>
              <div class="text-caption text-grey-5">
                Remarks ID: {{ selectedRemark?.remarks_id || 'N/A' }}
              </div>
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-5" v-close-popup />
        </q-card-section>

        <q-separator class="q-mt-sm" />

        <q-card-section class="q-pa-lg" style="max-height: 65vh; overflow-y: auto">
          <div
            class="text-caption text-uppercase text-grey-5 text-bold q-mb-md"
            style="letter-spacing: 0.06em"
          >
            <q-icon name="edit" size="13px" class="q-mr-xs" />
            Edit remark details
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                v-model="editForm.category"
                label="Category *"
                outlined
                dense
                :options="categoryOptions"
                emit-value
                map-options
                :rules="[(v) => !!v || 'Category is required']"
              >
                <template #prepend><q-icon name="category" size="18px" /></template>
              </q-select>
            </div>

            <div class="col-12">
              <q-input
                v-model="editForm.remarks"
                label="Remark *"
                outlined
                dense
                type="textarea"
                autogrow
                :input-style="{ minHeight: '80px' }"
                :rules="[(v) => !!v || 'Remark is required']"
              >
                <template #prepend><q-icon name="comment" size="18px" /></template>
              </q-input>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-lg q-py-sm bg-grey-1">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Save changes"
            color="primary"
            icon="save"
            :loading="remarkStore.loading"
            @click="submitEdit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================================================
         OFFICE ADD DIALOG
         ================================================================ -->
    <q-dialog
      v-model="addOfficeDialog"
      persistent
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="width: 450px; max-width: 95vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none q-pt-md q-px-lg">
          <div class="row items-center q-gutter-sm">
            <q-icon name="business" color="primary" size="22px" />
            <div>
              <div class="text-subtitle1 text-bold text-grey-9">Add New Office</div>
              <div class="text-caption text-grey-5">Enter office name</div>
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-5" v-close-popup />
        </q-card-section>

        <q-separator class="q-mt-sm" />

        <q-card-section class="q-pa-lg">
          <q-input
            v-model="officeForm.office_name"
            label="Office Name *"
            outlined
            dense
            autofocus
            :rules="[(v) => !!v || 'Office name is required']"
            @keyup.enter="submitAddOffice"
          >
            <template #prepend><q-icon name="apartment" size="18px" /></template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-lg q-py-sm bg-grey-1">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Save Office"
            color="primary"
            icon="save"
            :loading="officeStore.loading"
            @click="submitAddOffice"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================================================
         OFFICE EDIT DIALOG
         ================================================================ -->
    <q-dialog
      v-model="editOfficeDialog"
      persistent
      :maximized="$q.screen.lt.sm"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card style="width: 450px; max-width: 95vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none q-pt-md q-px-lg">
          <div class="row items-center q-gutter-sm">
            <q-icon name="business" color="primary" size="22px" />
            <div>
              <div class="text-subtitle1 text-bold text-grey-9">Edit Office</div>
              <div class="text-caption text-grey-5">
                Office ID: {{ selectedOffice?.officeId || 'N/A' }}
              </div>
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-5" v-close-popup />
        </q-card-section>

        <q-separator class="q-mt-sm" />

        <q-card-section class="q-pa-lg">
          <q-input
            v-model="officeEditForm.office_name"
            label="Office Name *"
            outlined
            dense
            autofocus
            :rules="[(v) => !!v || 'Office name is required']"
            @keyup.enter="submitEditOffice"
          >
            <template #prepend><q-icon name="apartment" size="18px" /></template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-lg q-py-sm bg-grey-1">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Save changes"
            color="primary"
            icon="save"
            :loading="officeStore.loading"
            @click="submitEditOffice"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================================================
         OFFICE STRUCTURE MANAGER DIALOG
         Office -> Sub-Office -> Group -> Division -> Section -> Unit
         ================================================================ -->
    <q-dialog
      v-model="structureDialog"
      persistent
      :maximized="$q.screen.lt.md"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card
        style="width: 720px; max-width: 96vw; border-radius: 14px; overflow: hidden"
        class="column no-wrap"
      >
        <!-- Header -->
        <div class="structure-dialog-header row items-center q-px-md q-py-sm">
          <q-icon name="account_tree" color="white" size="22px" class="q-mr-sm header-icon" />
          <div class="header-title-wrap">
            <div class="text-subtitle1 text-bold text-white header-title">
              {{ currentStructureOffice }}
            </div>
            <div class="text-caption" style="color: rgba(255, 255, 255, 0.7)">
              {{
                structureReadOnly ? 'View Only - No Structure Defined' : 'Organizational structure'
              }}
            </div>
          </div>
          <q-space />
          <q-badge v-if="structureDirty" color="orange-8" class="q-mr-sm header-badge">
            Unsaved changes
          </q-badge>
          <q-badge v-if="structureReadOnly" color="grey-6" class="q-mr-sm header-badge">
            <q-icon name="lock" size="12px" class="q-mr-xs" />
            Read Only
          </q-badge>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            class="header-icon"
            @click="closeStructureDialog"
          />
        </div>

        <!-- Legend / guide -->
        <q-banner dense class="bg-blue-1 text-blue-10 q-mx-md q-mt-sm" rounded>
          <template v-slot:avatar><q-icon name="info" color="primary" /></template>
          <span class="text-caption">
            <template v-if="structureReadOnly">
              This office has no structure defined yet. To add structure, use the Edit button in the
              main office table to create the initial structure, then you can modify it here.
            </template>
            <template v-else>
              Order: Office → Sub-Office → Group → Division → Section → Unit. Any level can be
              skipped — use the
              <q-icon name="add" size="14px" />
              menu on a row to add straight to a deeper level.
            </template>
          </span>
        </q-banner>

        <!-- Tree -->
        <q-card-section
          class="q-pa-md"
          style="flex: 1 1 auto; overflow-y: auto; min-height: 280px; max-height: 60vh"
        >
          <div v-if="structureLoading" class="flex flex-center q-pa-xl">
            <q-spinner color="primary" size="2.5em" />
            <span class="q-ml-sm">Loading structure...</span>
          </div>

          <template v-else-if="structureTreeRoot">
            <structure-tree-node
              :node="structureTreeRoot"
              :read-only="structureReadOnly || !hasModifyPermission"
              :structure-id-map="structureIdMap"
              @update-structure-item="handleUpdateStructureItem"
              @delete-structure-item="handleDeleteStructureItem"
              @structure-changed="markStructureDirty"
            />

            <div
              v-if="!structureTreeRoot.children().length"
              class="text-center text-grey-6 q-pa-lg"
            >
              <q-icon name="account_tree" size="2.5rem" color="grey-4" />
              <div class="q-mt-sm">No structure defined yet.</div>
              <div v-if="!structureReadOnly" class="text-caption">
                Click the
                <q-icon name="add" size="12px" />
                button next to "{{ currentStructureOffice }}" above to add a Sub-Office, Group,
                Division, Section, or Unit.
              </div>
            </div>
          </template>
        </q-card-section>

        <q-separator />

        <!-- Footer -->
        <q-card-actions align="right" class="q-px-lg q-py-sm bg-grey-1">
          <q-btn flat no-caps label="Close" color="grey-7" @click="closeStructureDialog" />
          <q-btn
            v-if="!structureReadOnly && hasModifyPermission"
            unelevated
            no-caps
            :label="getSaveButtonLabel()"
            :icon="getSaveButtonIcon()"
            :color="getSaveButtonColor()"
            :loading="officeStore.structureSaving"
            :disable="!structureDirty"
            @click="saveStructure"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
  import { useRemarkStore } from 'src/stores/remarkStore';
  import { useOfficeStore } from 'src/stores/officeLibraryStore';
  import { useAuthStore } from 'src/stores/authStore';
  import StructureTreeNode from 'components/StructureTreeNode.vue';
  import {
    buildOfficeStructureTree,
    emptyStructureFor,
  } from 'src/composables/useOfficeStructureTree';

  export default {
    name: 'LibraryPage',

    components: { StructureTreeNode },

    setup() {
      const remarkStore = useRemarkStore();
      const officeStore = useOfficeStore();
      const authStore = useAuthStore();
      return { remarkStore, officeStore, authStore };
    },

    data() {
      return {
        activeTab: 'remarks',

        // ===== REMARK DATA =====
        globalSearch: '',
        categoryFilter: null,
        categoryOptions: [
          { label: 'EDUCATION', value: 'EDUCATION' },
          { label: 'EXPERIENCE', value: 'EXPERIENCE' },
          { label: 'TRAINING', value: 'TRAINING' },
          { label: 'ELIGIBILITY', value: 'ELIGIBILITY' },
        ],
        pagination: {
          sortBy: 'remarks',
          descending: false,
          page: 1,
          rowsPerPage: 10,
        },

        addDialog: false,
        editDialog: false,
        selectedRemark: null,
        addCategoryError: false,

        addForm: {
          categories: [],
          remarks: '',
        },

        editForm: {
          category: '',
          remarks: '',
        },

        // ===== OFFICE DATA =====
        officeSearch: '',
        officePagination: {
          sortBy: 'office_name',
          descending: false,
          page: 1,
          rowsPerPage: 10,
        },

        addOfficeDialog: false,
        editOfficeDialog: false,
        selectedOffice: null,

        officeForm: {
          office_name: '',
        },

        officeEditForm: {
          office_name: '',
        },

        // ===== OFFICE STRUCTURE DATA =====
        structureDialog: false,
        structureLoading: false,
        structureDirty: false,
        structureReadOnly: false,
        currentStructureOffice: null,
        currentOfficeData: null,
        localStructure: null,
        structureIdMap: {}, // maps node paths to structureId for individual updates

        // Track what types of changes have been made
        changeTypes: {
          added: false,
          updated: false,
          deleted: false,
        },
        // Store pending operations for batch processing
        pendingOperations: {
          updates: [], // { structureId, fields }
          deletes: [], // [structureId]
          adds: [], // { type, name, parentPath }
        },
        originalStructure: null, // Store original for comparison
      };
    },

    computed: {
      hasModifyPermission() {
        return this.authStore.user?.permissions?.modifyLibraryAccess === '1';
      },

      // ===== REMARK COMPUTEDS =====
      filteredRemarks() {
        let search = (this.globalSearch || '').toLowerCase().trim();
        let filtered = this.remarkStore.remarks || [];

        if (this.categoryFilter) {
          filtered = filtered.filter((r) => r.category === this.categoryFilter);
        }

        if (search) {
          filtered = filtered.filter((r) => {
            return [r.remarks, r.category, r.created_at]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(search));
          });
        }

        return filtered;
      },

      remarkColumns() {
        return [
          {
            name: 'remarks',
            label: 'Remark',
            align: 'left',
            field: 'remarks',
            sortable: true,
          },
          {
            name: 'category',
            label: 'Category',
            align: 'left',
            field: 'category',
            sortable: true,
          },
          {
            name: 'action',
            label: this.hasModifyPermission ? 'Action' : 'Access',
            align: 'center',
            field: 'action',
            sortable: false,
          },
        ];
      },

      // ===== OFFICE COMPUTEDS =====
      filteredOffices() {
        let search = (this.officeSearch || '').toLowerCase().trim();
        let filtered = this.officeStore.offices || [];

        if (search) {
          filtered = filtered.filter((o) => {
            return String(o.office_name).toLowerCase().includes(search);
          });
        }

        return filtered;
      },

      officeColumns() {
        return [
          {
            name: 'office_name',
            label: 'Office Name',
            align: 'left',
            field: 'office_name',
            sortable: true,
          },
          {
            name: 'action',
            label: 'Structure / Action',
            align: 'center',
            field: 'action',
            sortable: false,
          },
        ];
      },

      // ===== STRUCTURE COMPUTED =====
      structureTreeRoot() {
        if (!this.localStructure) return null;
        return buildOfficeStructureTree(this.localStructure, this.markStructureDirty);
      },

      // ===== CHANGE TRACKING =====
      hasChanges() {
        return this.changeTypes.added || this.changeTypes.updated || this.changeTypes.deleted;
      },

      hasAdds() {
        return this.changeTypes.added;
      },

      hasUpdates() {
        return this.changeTypes.updated;
      },

      hasDeletes() {
        return this.changeTypes.deleted;
      },
    },

    watch: {
      'addForm.categories'(val) {
        if (val.length > 0) {
          this.addCategoryError = false;
        }
      },
    },

    methods: {
      // ===== HELPER METHODS FOR SAFE DATA ACCESS =====
      getRemarkRows() {
        return Array.isArray(this.remarkStore.remarks) ? this.filteredRemarks : [];
      },

      getOfficeRows() {
        return Array.isArray(this.officeStore.offices) ? this.filteredOffices : [];
      },

      // ===== REMARK METHODS =====
      getCategoryColor(category) {
        const colors = {
          EDUCATION: 'blue',
          EXPERIENCE: 'green',
          TRAINING: 'orange',
          ELIGIBILITY: 'purple',
        };
        return colors[category] || 'primary';
      },

      getCategoryIcon(category) {
        const icons = {
          EDUCATION: 'school',
          EXPERIENCE: 'work',
          TRAINING: 'fitness_center',
          ELIGIBILITY: 'verified',
        };
        return icons[category] || 'label';
      },

      toggleCategory(value) {
        const idx = this.addForm.categories.indexOf(value);
        if (idx === -1) {
          this.addForm.categories.push(value);
        } else {
          this.addForm.categories.splice(idx, 1);
        }
        if (this.addForm.categories.length > 0) {
          this.addCategoryError = false;
        }
      },

      openAddDialog() {
        this.addForm = { categories: [], remarks: '' };
        this.addCategoryError = false;
        this.addDialog = true;
      },

      async submitAdd() {
        if (this.addForm.categories.length === 0) {
          this.addCategoryError = true;
          this.$q.notify({
            type: 'negative',
            message: 'Please select at least one category.',
            position: 'top',
          });
          return;
        }

        if (!this.addForm.remarks || !this.addForm.remarks.trim()) {
          this.$q.notify({
            type: 'negative',
            message: 'Remark is required.',
            position: 'top',
          });
          return;
        }

        try {
          const requests = this.addForm.categories.map((category) =>
            this.remarkStore.storeRemark({
              category,
              remarks: this.addForm.remarks.trim(),
            }),
          );

          await Promise.all(requests);

          const count = this.addForm.categories.length;
          this.$q.notify({
            type: 'positive',
            message:
              count > 1 ? `${count} remarks added successfully.` : 'Remark added successfully.',
            position: 'top',
          });

          this.addDialog = false;
          this.addForm = { categories: [], remarks: '' };
          this.addCategoryError = false;
        } catch (e) {
          this.$q.notify({
            type: 'negative',
            message: e?.response?.data?.message || 'Failed to add remark(s).',
            position: 'top',
          });
        }
      },

      editRemark(row) {
        this.selectedRemark = row;
        this.editForm = {
          category: row.category || '',
          remarks: row.remarks || '',
        };
        this.editDialog = true;
      },

      async submitEdit() {
        if (!this.editForm.category) {
          this.$q.notify({
            type: 'negative',
            message: 'Category is required.',
            position: 'top',
          });
          return;
        }

        if (!this.editForm.remarks || !this.editForm.remarks.trim()) {
          this.$q.notify({
            type: 'negative',
            message: 'Remark is required.',
            position: 'top',
          });
          return;
        }

        try {
          await this.remarkStore.updateRemark(this.selectedRemark.remarks_id, this.editForm);
          this.$q.notify({
            type: 'positive',
            message: 'Remark updated successfully.',
            position: 'top',
          });
          this.editDialog = false;
        } catch (e) {
          this.$q.notify({
            type: 'negative',
            message: e?.response?.data?.message || 'Failed to update remark.',
            position: 'top',
          });
        }
      },

      deleteRemark(remarksId) {
        this.$q
          .dialog({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this remark?',
            cancel: true,
            persistent: true,
          })
          .onOk(async () => {
            try {
              await this.remarkStore.deleteRemark(remarksId);
              this.$q.notify({
                type: 'positive',
                message: 'Remark deleted successfully.',
                position: 'top',
              });
            } catch (error) {
              this.$q.notify({
                type: 'negative',
                message: error?.response?.data?.message || 'Failed to delete remark.',
                position: 'top',
              });
            }
          });
      },

      // ===== OFFICE METHODS =====
      openAddOfficeDialog() {
        this.officeForm = { office_name: '' };
        this.addOfficeDialog = true;
      },

      async submitAddOffice() {
        if (!this.officeForm.office_name) {
          this.$q.notify({
            type: 'negative',
            message: 'Office name is required.',
            position: 'top',
          });
          return;
        }

        try {
          await this.officeStore.storeOffice(this.officeForm);
          this.addOfficeDialog = false;
        } catch {
          // Error is already handled in the store
        }
      },

      editOffice(row) {
        this.selectedOffice = row;
        this.officeEditForm = {
          office_name: row.office_name || '',
        };
        this.editOfficeDialog = true;
      },

      async submitEditOffice() {
        if (!this.officeEditForm.office_name) {
          this.$q.notify({
            type: 'negative',
            message: 'Office name is required.',
            position: 'top',
          });
          return;
        }

        try {
          await this.officeStore.updateOffice(this.selectedOffice.officeId, this.officeEditForm);
          this.editOfficeDialog = false;
        } catch {
          // Error is already handled in the store
        }
      },

      deleteOffice(officeId) {
        this.$q
          .dialog({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this office?',
            cancel: true,
            persistent: true,
          })
          .onOk(async () => {
            try {
              await this.officeStore.deleteOffice(officeId);
            } catch {
              // Error is already handled in the store
            }
          });
      },

      // ===== OFFICE STRUCTURE METHODS =====
      markStructureDirty(type) {
        this.structureDirty = true;
        // Track specific change type
        if (type) {
          this.trackChange(type);
        } else {
          // If no type specified, just mark as dirty
          // The save button will handle it
        }
      },

      // Track specific change types
      trackChange(type) {
        if (type === 'added') {
          this.changeTypes.added = true;
        } else if (type === 'updated') {
          this.changeTypes.updated = true;
        } else if (type === 'deleted') {
          this.changeTypes.deleted = true;
        }
        this.structureDirty = true;

        // Log for debugging
        console.log('Change tracked:', type, this.changeTypes);
      },

      getSaveButtonLabel() {
        const hasAdd = this.hasAdds;
        const hasUpdate = this.hasUpdates;
        const hasDelete = this.hasDeletes;

        if (hasAdd && hasUpdate && hasDelete) return 'Modify All';
        if (hasAdd && hasUpdate) return 'Add & Update';
        if (hasAdd && hasDelete) return 'Add & Delete';
        if (hasUpdate && hasDelete) return 'Update & Delete';
        if (hasAdd) return 'Save New';
        if (hasUpdate) return 'Update Changes';
        if (hasDelete) return 'Delete Items';
        return 'Save Structure';
      },

      getSaveButtonIcon() {
        const hasAdd = this.hasAdds;
        const hasUpdate = this.hasUpdates;
        const hasDelete = this.hasDeletes;

        if (hasAdd && hasUpdate && hasDelete) return 'sync';
        if (hasAdd && hasUpdate) return 'save';
        if (hasAdd && hasDelete) return 'delete_sweep';
        if (hasUpdate && hasDelete) return 'edit';
        if (hasAdd) return 'add_circle';
        if (hasUpdate) return 'edit_note';
        if (hasDelete) return 'delete_forever';
        return 'save';
      },

      getSaveButtonColor() {
        const hasAdd = this.hasAdds;
        const hasUpdate = this.hasUpdates;
        const hasDelete = this.hasDeletes;

        if (hasDelete && !hasAdd && !hasUpdate) return 'negative';
        if (hasAdd && !hasUpdate && !hasDelete) return 'primary';
        if (hasUpdate && !hasAdd && !hasDelete) return 'primary';
        return 'primary';
      },

      async openStructureDialog(row) {
        this.currentStructureOffice = row.office_name;
        this.currentOfficeData = row;
        this.structureDialog = true;
        this.structureLoading = true;
        this.structureDirty = false;
        this.structureIdMap = {};

        // Reset change tracking
        this.changeTypes = {
          added: false,
          updated: false,
          deleted: false,
        };
        this.pendingOperations = {
          updates: [],
          deletes: [],
          adds: [],
        };

        try {
          // Check if structure exists
          const hasStructure = row.structure === true;

          if (hasStructure) {
            // Use office_structure_outside data (edit mode)
            this.structureReadOnly = false;
            const existingData = row.office_structure_outside || [];

            if (existingData.length > 0) {
              // Build structure from flat data
              const structureObj = this.buildStructureFromFlatData(row.office_name, existingData);
              this.localStructure = structureObj;
              // Store original for comparison
              this.originalStructure = JSON.parse(JSON.stringify(structureObj));
            } else {
              // No structure data found, create empty
              this.localStructure = emptyStructureFor(row.office_name);
              this.originalStructure = JSON.parse(JSON.stringify(this.localStructure));
            }
          } else {
            // Use fetchOfficeStructure (read-only mode)
            this.structureReadOnly = true;
            await this.officeStore.fetchOfficeStructure(row.office_name);

            // Get structure from store
            const structureData = this.officeStore.structure || [];
            if (structureData.length > 0) {
              // Use the first structure that matches this office
              const officeStructure = structureData.find((s) => s.office === row.office_name);
              if (officeStructure) {
                this.localStructure = JSON.parse(JSON.stringify(officeStructure));
                this.originalStructure = JSON.parse(JSON.stringify(officeStructure));
              } else {
                this.localStructure = emptyStructureFor(row.office_name);
                this.originalStructure = JSON.parse(JSON.stringify(this.localStructure));
              }
            } else {
              this.localStructure = emptyStructureFor(row.office_name);
              this.originalStructure = JSON.parse(JSON.stringify(this.localStructure));
            }
          }

          // Build structureIdMap for edit operations
          if (!this.structureReadOnly && this.localStructure) {
            this.buildStructureIdMap(row.officeId, this.localStructure);
          }
        } catch (e) {
          console.error('Error loading office structure:', e);
          this.localStructure = emptyStructureFor(row.office_name);
          this.originalStructure = JSON.parse(JSON.stringify(this.localStructure));
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load structure. Starting with a blank one.',
            position: 'top',
          });
        } finally {
          this.structureLoading = false;
          this.structureDirty = false;
        }
      },

      buildStructureFromFlatData(officeName, flatData) {
        const structure = {
          office: officeName,
          office2: [],
        };

        const grouped = {};

        flatData.forEach((item) => {
          const parts = [];
          if (item.office2) parts.push(item.office2);
          if (item.group) parts.push(item.group);
          if (item.division) parts.push(item.division);
          if (item.section) parts.push(item.section);
          if (item.unit) parts.push(item.unit);

          const key = parts.join('|||');

          if (!grouped[key]) {
            grouped[key] = {
              office2: item.office2 || null,
              group: item.group || null,
              division: item.division || null,
              section: item.section || null,
              unit: item.unit || null,
              structureId: item.structureId,
              items: [],
            };
          }
          grouped[key].items.push(item);
        });

        Object.values(grouped).forEach((entry) => {
          let current = structure;

          // Handle office2
          if (entry.office2) {
            if (!current.office2) current.office2 = [];
            let office2 = current.office2.find((o) => o.office2 === entry.office2);
            if (!office2) {
              office2 = {
                office2: entry.office2,
                group: [],
                structureId: entry.structureId,
              };
              current.office2.push(office2);
            }
            current = office2;
          }

          // Handle unnamed office2 wrapper
          if (!entry.office2 && (entry.group || entry.division || entry.section || entry.unit)) {
            if (!current.office2) current.office2 = [];
            let unnamed = current.office2.find((o) => !o.office2);
            if (!unnamed) {
              unnamed = {
                office2: null,
                group: [],
                structureId: entry.structureId,
              };
              current.office2.push(unnamed);
            }
            current = unnamed;
          }

          // Handle group
          if (entry.group) {
            if (!current.group) current.group = [];
            let group = current.group.find((g) => g.group === entry.group);
            if (!group) {
              group = {
                group: entry.group,
                divisions: [],
                sections_without_division: [],
                units_without_division: [],
                structureId: entry.structureId,
              };
              current.group.push(group);
            }
            current = group;
          }

          // Handle unnamed group wrapper
          if (!entry.group && (entry.division || entry.section || entry.unit)) {
            if (!current.group) current.group = [];
            let unnamedGroup = current.group.find((g) => !g.group);
            if (!unnamedGroup) {
              unnamedGroup = {
                group: null,
                divisions: [],
                sections_without_division: [],
                units_without_division: [],
                structureId: entry.structureId,
              };
              current.group.push(unnamedGroup);
            }
            current = unnamedGroup;
          }

          // Handle division
          if (entry.division) {
            if (!current.divisions) current.divisions = [];
            let division = current.divisions.find((d) => d.division === entry.division);
            if (!division) {
              division = {
                division: entry.division,
                sections: [],
                units_without_section: [],
                structureId: entry.structureId,
              };
              current.divisions.push(division);
            }
            current = division;
          }

          // Handle section
          if (entry.section) {
            if (!current.sections) current.sections = [];
            let section = current.sections.find((s) => s.section === entry.section);
            if (!section) {
              section = {
                section: entry.section,
                units: [],
                structureId: entry.structureId,
              };
              current.sections.push(section);
            }
            current = section;
          }

          // Handle unit - store as object with structureId
          if (entry.unit) {
            if (!current.units) current.units = [];
            // Check if unit already exists (as string or object)
            const exists = current.units.some((u) => {
              const unitName = typeof u === 'object' ? u.unit : u;
              return unitName === entry.unit;
            });
            if (!exists) {
              current.units.push({
                unit: entry.unit,
                structureId: entry.structureId,
              });
            }
          }
        });

        return structure;
      },

      buildStructureIdMap(officeId, structure) {
        // Recursively traverse structure and map paths to structureIds
        const traverse = (obj, path = []) => {
          if (!obj) return;

          // If this is a flat structure item from the API
          if (obj.structureId) {
            const key = path.filter(Boolean).join('/');
            this.structureIdMap[key] = obj.structureId;
          }

          // Recursively traverse children
          if (obj.office2 && Array.isArray(obj.office2)) {
            obj.office2.forEach((o2) => {
              const newPath = [...path, o2.office2];
              if (o2.structureId) {
                this.structureIdMap[newPath.filter(Boolean).join('/')] = o2.structureId;
              }
              traverse(o2, newPath);
            });
          }

          if (obj.group && Array.isArray(obj.group)) {
            obj.group.forEach((g) => {
              const newPath = [...path, g.group];
              if (g.structureId) {
                this.structureIdMap[newPath.filter(Boolean).join('/')] = g.structureId;
              }
              traverse(g, newPath);
            });
          }

          if (obj.divisions && Array.isArray(obj.divisions)) {
            obj.divisions.forEach((d) => {
              const newPath = [...path, d.division];
              if (d.structureId) {
                this.structureIdMap[newPath.filter(Boolean).join('/')] = d.structureId;
              }
              traverse(d, newPath);
            });
          }

          if (obj.sections && Array.isArray(obj.sections)) {
            obj.sections.forEach((s) => {
              const newPath = [...path, s.section];
              if (s.structureId) {
                this.structureIdMap[newPath.filter(Boolean).join('/')] = s.structureId;
              }
              traverse(s, newPath);
            });
          }
        };

        traverse(structure);
      },

      async handleUpdateStructureItem(structureId, fields) {
        console.log('handleUpdateStructureItem called:', { structureId, fields });
        this.trackChange('updated');
        // Store the pending update
        this.pendingOperations.updates.push({ structureId, fields });
        return true;
      },

      async handleDeleteStructureItem(structureId) {
        console.log('handleDeleteStructureItem called:', structureId);
        this.trackChange('deleted');
        // Store the pending delete
        this.pendingOperations.deletes.push(structureId);
        return true;
      },

      async saveStructure() {
        if (!this.localStructure || this.structureReadOnly) return;

        try {
          // Process updates
          if (this.pendingOperations.updates.length > 0) {
            for (const op of this.pendingOperations.updates) {
              await this.officeStore.updateStructureItem(op.structureId, op.fields);
            }
          }

          // Process deletes
          if (this.pendingOperations.deletes.length > 0) {
            for (const structureId of this.pendingOperations.deletes) {
              await this.officeStore.deleteStructureItem(structureId);
            }
          }

          // Process adds (new nodes without structureId)
          // We need to save the entire structure to create new rows
          // But only if there are adds
          if (this.hasAdds) {
            await this.officeStore.saveOfficeStructure(
              this.currentStructureOffice,
              this.localStructure,
            );
          }

          this.structureDirty = false;

          // Reset change tracking
          this.changeTypes = {
            added: false,
            updated: false,
            deleted: false,
          };
          this.pendingOperations = {
            updates: [],
            deletes: [],
            adds: [],
          };

          // Refresh offices to get updated structure data
          await this.officeStore.fetchOffices();
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: error?.message || 'Failed to save structure.',
            position: 'top',
          });
        }
      },

      closeStructureDialog() {
        const doClose = () => {
          this.structureDialog = false;
          this.localStructure = null;
          this.currentStructureOffice = null;
          this.currentOfficeData = null;
          this.structureDirty = false;
          this.structureReadOnly = false;
          this.structureIdMap = {};
          this.originalStructure = null;
          this.changeTypes = {
            added: false,
            updated: false,
            deleted: false,
          };
          this.pendingOperations = {
            updates: [],
            deletes: [],
            adds: [],
          };
        };

        if (this.structureDirty) {
          this.$q
            .dialog({
              title: 'Discard changes?',
              message: 'You have unsaved structure changes. Close without saving?',
              cancel: true,
              persistent: true,
              ok: { color: 'negative', label: 'Discard' },
            })
            .onOk(doClose);
        } else {
          doClose();
        }
      },

      // Method to track add operations from the tree
      trackAdd() {
        this.trackChange('added');
      },
    },

    mounted() {
      this.remarkStore.fetchRemarks();
      this.officeStore.fetchOffices();
    },
  };
</script>

<style scoped>
  /* ── Page ── */
  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .category-badge {
    padding: 4px 8px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  .read-only-badge {
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
  }

  /* ── Add Dialog Header ── */
  .add-dialog-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #43a047 0%, #5db461 100%);
    flex-shrink: 0;
  }

  .add-dialog-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ── Section labels ── */
  .add-section-block {
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 14px 16px;
    background: #fafbfc;
  }

  .add-section-label {
    font-size: 11.5px;
    font-weight: 700;
    color: #607080;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }

  .add-section-hint {
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: #aab0b8;
    margin-left: 4px;
    font-size: 11px;
  }

  .add-remark-input :deep(.q-field__control) {
    background: #fff;
    border-radius: 8px;
  }

  /* ── Category Cards ── */
  .category-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .category-card {
    border: 2px solid #e8eaed;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    transition:
      border-color 0.18s,
      box-shadow 0.18s,
      background 0.18s;
    user-select: none;
  }

  .category-card:hover {
    border-color: #c0c8d0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  }

  .category-card--active {
    background: #f4f8ff;
    box-shadow: 0 2px 10px rgba(25, 118, 210, 0.12);
  }

  .category-card--education.category-card--active {
    border-color: #1976d2;
  }
  .category-card--experience.category-card--active {
    border-color: #43a047;
  }
  .category-card--training.category-card--active {
    border-color: #ef6c00;
  }
  .category-card--eligibility.category-card--active {
    border-color: #7b1fa2;
  }

  .category-card-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
  }

  .category-card-check {
    flex-shrink: 0;
  }

  .category-card-icon {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #f0f2f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .category-card-label {
    font-size: 12.5px;
    font-weight: 600;
    color: #3a4550;
    letter-spacing: 0.02em;
  }

  /* ── Summary bar ── */
  .add-summary-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    padding: 10px 20px;
    background: #e8f4fd;
    font-size: 12px;
    color: #1565c0;
    border-top: 1px solid #c9e2f7;
  }

  /* ── Structure Dialog ── */
  .structure-dialog-header {
    background: linear-gradient(135deg, #00695c 0%, #26a69a 100%);
    flex-shrink: 0;
  }

  .header-badge {
    font-size: 10px;
    padding: 4px 10px;
    font-weight: 500;
  }
</style>
