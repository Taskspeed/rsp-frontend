<template>
  <q-page class="q-pa-md">
    <!-- Page Title -->
    <div class="text-h6 text-bold q-mb-md">Personnel Placement</div>

    <!-- Search Bar (outside the structure panel) + Panel Toggle -->
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col">
        <q-select
          outlined
          dense
          color="green-9"
          v-model="selectedValue"
          :options="getOptions()"
          label="Search and select office"
          use-input
          hide-selected
          fill-input
          clearable
          input-debounce="300"
          @filter="filterOptions"
          @update:model-value="handleSelection"
          :loading="useOffice.loading"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:no-option>
            <q-item dense>
              <q-item-section class="text-grey text-subtitle2">No results</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          no-caps
          :ripple="false"
          :color="showStructurePanel ? 'grey-3' : 'primary'"
          :text-color="showStructurePanel ? 'grey-8' : 'white'"
          class="panel-toggle-btn"
          @click="showStructurePanel = !showStructurePanel"
        >
          <q-icon
            :name="showStructurePanel ? 'chevron_left' : 'account_tree'"
            size="18px"
            class="q-mr-sm"
          />
          {{ showStructurePanel ? 'Hide Structure' : 'Show Structure' }}
        </q-btn>
      </div>
    </div>

    <!-- Panels -->
    <div class="row q-col-gutter-md">
      <!-- Structure Panel (collapsible) -->
      <div v-if="showStructurePanel" class="col-12 col-md-4">
        <q-card flat bordered class="panel-card" style="height: 78vh">
          <div class="panel-header q-px-sm q-pt-sm q-pb-sm">
            <div class="text-subtitle1 text-bold">Structure</div>
          </div>
          <q-separator />

          <q-scroll-area class="panel-scroll q-pa-sm">
            <!-- Structure Tree -->
            <div v-if="selectedValue && structureTree.length > 0" class="q-px-sm">
              <q-tree
                dense
                :nodes="structureTree"
                node-key="id"
                v-model:selected="selectedNode"
                @update:selected="handleNodeSelection"
                class="custom-tree"
              >
                <template v-slot:default-header="prop">
                  <div
                    class="row items-start no-wrap cursor-pointer q-pa-sm"
                    :class="{ 'selected-node': selectedNode === prop.node.id }"
                  >
                    <q-icon
                      :name="getNodeIcon(prop.node)"
                      color="primary"
                      size="sm"
                      class="q-mr-sm node-icon"
                    />
                    <div class="text-body1 node-label">{{ prop.node.label }}</div>
                  </div>
                </template>
              </q-tree>
            </div>

            <!-- No structure data -->
            <div
              v-else-if="selectedValue && !useOffice.structureLoading"
              class="text-center q-pa-lg"
            >
              <q-icon name="info" size="2rem" color="grey-7" />
              <div class="text-subtitle1 q-mt-sm">
                No organizational structure data available for this office
              </div>
            </div>

            <!-- Loading -->
            <div v-else-if="useOffice.structureLoading" class="q-pa-md flex flex-center">
              <q-spinner color="primary" size="2.5em" />
              <span class="q-ml-sm">Loading structure...</span>
            </div>

            <!-- Empty state -->
            <div v-else class="text-center q-pa-lg">
              <q-icon name="info" size="2rem" color="grey-7" />
              <div class="text-subtitle1 q-mt-sm text-grey-7">Select Office</div>
            </div>
          </q-scroll-area>
        </q-card>
      </div>

      <!-- Personnel Table Panel -->
      <div :class="showStructurePanel ? 'col-12 col-md-8' : 'col-12'">
        <q-card flat bordered class="panel-card" style="height: 78vh">
          <div class="panel-header row items-center justify-between q-px-sm q-pt-sm q-pb-sm">
            <div class="text-subtitle1 text-bold">Personnel Table</div>
            <div class="row q-gutter-sm">
              <!-- Toggle Buttons -->
              <q-btn-toggle
                v-model="employeeViewMode"
                unelevated
                no-caps
                toggle-color="primary"
                color="grey-3"
                text-color="grey-8"
                :options="viewModeOptions"
                class="q-mr-sm"
              />
              <!-- Add / Reassign Employee - only for users with placement modify permission -->
              <q-btn
                v-if="currentStructure && showStructurePanel && canModifyPlacement"
                unelevated
                no-caps
                :color="employeeViewMode === 'actual' ? 'primary' : 'orange'"
                :icon="employeeViewMode === 'actual' ? 'person_add' : 'swap_horiz'"
                :label="employeeViewMode === 'actual' ? 'Add Employee' : 'Reassign Employee'"
                @click="openAddEmployeeModal"
              />
            </div>
          </div>
          <q-separator />

          <!-- Personnel Search Bar -->
          <div class="q-px-sm q-pt-sm">
            <q-input
              outlined
              dense
              clearable
              v-model="personnelSearch"
              placeholder="Search by name, control no, position, or status"
              class="q-mb-sm"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <q-scroll-area class="panel-scroll q-pa-sm">
            <q-card-section>
              <q-table
                flat
                bordered
                class="wrap-table"
                :rows="filteredPersonnelRows"
                :columns="personnelColumns"
                row-key="ControlNo"
                :loading="useOffice.employeesLoading || useOffice.reassignedEmployeesLoading"
              >
                <!-- Single body slot: handles row styling AND the actions column -->
                <template v-slot:body="props">
                  <q-tr :props="props" :class="getRowClass(props.row)">
                    <q-td v-for="col in props.cols" :key="col.name" :props="props">
                      <template v-if="col.name === 'actions'">
                        <div class="row items-center justify-center no-wrap">
                          <!-- View History - always available for actual employees -->
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            color="grey-8"
                            icon="history"
                            @click="openHistoryModal(props.row)"
                            class="action-btn"
                          >
                            <q-tooltip>View Reassignment History</q-tooltip>
                          </q-btn>

                          <template v-if="canEditRow(props.row)">
                            <q-btn
                              flat
                              dense
                              round
                              size="sm"
                              color="primary"
                              icon="edit"
                              @click="openEditModal(props.row)"
                              class="action-btn"
                            >
                              <q-tooltip>Edit Assignment</q-tooltip>
                            </q-btn>
                            <q-btn
                              flat
                              dense
                              round
                              size="sm"
                              color="negative"
                              icon="delete"
                              @click="openDeleteModal(props.row)"
                              class="action-btn"
                            >
                              <q-tooltip>Remove Employee</q-tooltip>
                            </q-btn>
                          </template>

                          <!-- Reassigned employees (green-text rows): edit only -->
                          <template v-else-if="canEditReassignedRow(props.row)">
                            <q-btn
                              flat
                              dense
                              round
                              size="sm"
                              color="orange"
                              icon="edit"
                              @click="openReassignEditModal(props.row)"
                              class="action-btn"
                            >
                              <q-tooltip>Edit Reassignment</q-tooltip>
                            </q-btn>
                          </template>

                          <!-- Regular employees: no actions -->
                          <span
                            v-else-if="props.row.Status?.toUpperCase() === 'REGULAR'"
                            class="text-caption text-grey-6 q-ml-xs"
                          >
                            Regular
                          </span>

                          <!-- Fallback: show whatever status exists (also covers view-only users) -->
                          <span v-else class="text-caption text-grey-6 q-ml-xs">
                            {{ props.row.Status || '—' }}
                          </span>
                        </div>
                      </template>
                      <template v-else>
                        {{ col.value }}
                      </template>
                    </q-td>
                  </q-tr>
                </template>

                <template v-slot:no-data>
                  <div class="full-width row flex-center text-grey-7 q-pa-lg">
                    <q-icon name="info" size="2em" class="q-mr-sm" />
                    {{ noDataMessage }}
                  </div>
                </template>
              </q-table>
            </q-card-section>
          </q-scroll-area>
        </q-card>
      </div>
    </div>

    <!-- Add Employee / Reassign Employee Modal -->
    <q-dialog v-model="showAddEmployeeModal" persistent>
      <q-card style="width: 850px; max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6 text-bold">
              {{ employeeViewMode === 'actual' ? 'Add Employee' : 'Reassign Employee' }}
            </div>
            <div class="text-caption text-grey-7">
              {{
                employeeViewMode === 'actual'
                  ? 'Assign personnel to the selected structure'
                  : 'Reassign personnel to a new office'
              }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <!-- Office Selection for Reassign mode -->
        <q-card-section v-if="employeeViewMode === 'reassigned'" class="q-pt-md">
          <q-select
            outlined
            dense
            v-model="reassignOfficeFilter"
            :options="reassignOfficeOptions"
            label="Select Office to Reassign From *"
            class="q-mb-sm"
            @update:model-value="onReassignOfficeChange"
          />
        </q-card-section>

        <q-stepper v-model="modalStep" color="primary" flat animated class="q-mt-sm">
          <!-- Step 1: Select personnel -->
          <q-step :name="1" title="Select Personnel" icon="checklist" :done="modalStep > 1">
            <q-input
              outlined
              dense
              clearable
              v-model="modalSearch"
              placeholder="Search name or position"
              class="q-mb-sm"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-table
              flat
              bordered
              class="wrap-table"
              :rows="modalFilteredRows"
              :columns="modalColumns"
              row-key="ControlNo"
              selection="multiple"
              v-model:selected="modalSelected"
              :loading="usePlacement.loading"
              style="max-height: 42vh"
              virtual-scroll
            >
              <template v-slot:no-data>
                <div class="full-width row flex-center text-grey-7 q-pa-lg">
                  <q-icon name="info" size="2em" class="q-mr-sm" />
                  {{
                    employeeViewMode === 'actual'
                      ? 'No available personnel found for this office'
                      : 'No personnel available for reassignment'
                  }}
                </div>
              </template>
            </q-table>

            <div class="text-caption text-grey-7 q-mt-sm">
              {{ modalSelected.length }} personnel selected
            </div>

            <q-stepper-navigation class="row justify-end">
              <q-btn
                unelevated
                no-caps
                color="primary"
                label="Continue to Review"
                icon-right="arrow_forward"
                :disable="!modalSelected.length"
                @click="modalStep = 2"
              />
            </q-stepper-navigation>
          </q-step>

          <!-- Step 2: Review & confirm -->
          <q-step :name="2" title="Review & Confirm" icon="fact_check">
            <q-banner dense rounded class="bg-blue-1 text-blue-10 q-mb-md">
              <template v-slot:avatar>
                <q-icon name="account_tree" color="primary" />
              </template>
              <div class="text-caption text-blue-8 q-mb-xs">
                {{ employeeViewMode === 'actual' ? 'Assigning to:' : 'Reassigning to:' }}
              </div>
              <div class="row items-center breadcrumb-row">
                <template v-for="(level, idx) in structureBreadcrumb" :key="level.type">
                  <q-icon
                    v-if="idx > 0"
                    name="chevron_right"
                    size="16px"
                    color="blue-6"
                    class="q-mx-xs"
                  />
                  <q-chip
                    dense
                    :icon="getNodeIcon({ nodeType: level.type })"
                    :color="idx === structureBreadcrumb.length - 1 ? 'primary' : 'blue-2'"
                    :text-color="idx === structureBreadcrumb.length - 1 ? 'white' : 'blue-10'"
                  >
                    {{ level.label }}
                  </q-chip>
                </template>
              </div>
            </q-banner>

            <q-table
              flat
              bordered
              class="wrap-table"
              :rows="modalSelected"
              :columns="reviewColumns"
              row-key="ControlNo"
              style="max-height: 42vh"
              virtual-scroll
              hide-bottom
            >
              <template v-slot:body-cell-remove="props">
                <q-td :props="props" class="text-center">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="close"
                    color="negative"
                    @click="removeFromSelection(props.row)"
                  >
                    <q-tooltip>Remove from selection</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
              <template v-slot:no-data>
                <div class="full-width row flex-center text-grey-7 q-pa-lg">
                  <q-icon name="info" size="2em" class="q-mr-sm" />
                  No personnel selected. Go back and pick at least one.
                </div>
              </template>
            </q-table>

            <q-stepper-navigation class="row justify-between">
              <q-btn
                flat
                no-caps
                color="grey-8"
                label="Back"
                icon="arrow_back"
                @click="modalStep = 1"
              />
              <q-btn
                unelevated
                no-caps
                :color="employeeViewMode === 'actual' ? 'primary' : 'orange'"
                :label="
                  employeeViewMode === 'actual' ? 'Confirm Assignment' : 'Confirm Reassignment'
                "
                icon-right="check"
                :disable="!modalSelected.length"
                :loading="isAssigning"
                @click="assignSelectedPersonnel"
              />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card>
    </q-dialog>

    <!-- Edit Employee Modal (for actual employees) -->
    <q-dialog v-model="showEditModal" persistent>
      <q-card style="width: 800px; max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6 text-bold">Edit Employee Assignment</div>
            <div class="text-caption text-grey-7">Reassign employee to a new position</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="closeEditModal" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <!-- Employee Info -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <div class="text-caption text-grey-7">Employee Name</div>
              <div class="text-subtitle1 text-bold">{{ editForm.name || 'N/A' }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Control No.</div>
              <div class="text-subtitle1 text-bold">{{ editForm.control_no || 'N/A' }}</div>
            </div>
          </div>

          <!-- Current Assignment -->
          <div class="q-mb-md">
            <div class="text-subtitle2 text-bold q-mb-sm">Current Assignment</div>
            <q-banner dense rounded class="bg-grey-2">
              <div
                v-if="currentAssignmentBreadcrumb.length"
                class="row items-center breadcrumb-row"
              >
                <template v-for="(level, idx) in currentAssignmentBreadcrumb" :key="level.type">
                  <q-icon
                    v-if="idx > 0"
                    name="chevron_right"
                    size="16px"
                    color="grey-5"
                    class="q-mx-xs"
                  />
                  <q-chip
                    dense
                    size="sm"
                    :icon="getNodeIcon({ nodeType: level.type })"
                    :color="idx === currentAssignmentBreadcrumb.length - 1 ? 'primary' : 'grey-4'"
                    :text-color="
                      idx === currentAssignmentBreadcrumb.length - 1 ? 'white' : 'grey-9'
                    "
                  >
                    {{ level.label }}
                  </q-chip>
                </template>
              </div>
              <span v-else class="text-grey-7">No current assignment</span>
            </q-banner>
          </div>

          <!-- New Assignment -->
          <div>
            <div class="text-subtitle2 text-bold q-mb-sm">New Assignment</div>

            <!-- Office Selection -->
            <q-select
              outlined
              dense
              v-model="editForm.new_office"
              :options="officeOptions"
              label="Office *"
              class="q-mb-sm"
              @update:model-value="onOfficeChange"
            />

            <!-- Dynamic Structure Fields -->
            <div v-if="editForm.new_office">
              <!-- Sub-Office -->
              <q-select
                v-if="office2Options.length > 0"
                outlined
                dense
                v-model="editForm.new_office2"
                :options="office2Options"
                label="Sub-Office"
                class="q-mb-sm"
                @update:model-value="onOffice2Change"
              />

              <!-- Group -->
              <q-select
                v-if="groupOptions.length > 0"
                outlined
                dense
                v-model="editForm.new_group"
                :options="groupOptions"
                label="Group"
                class="q-mb-sm"
                @update:model-value="onGroupChange"
              />

              <!-- Division -->
              <q-select
                v-if="divisionOptions.length > 0"
                outlined
                dense
                v-model="editForm.new_division"
                :options="divisionOptions"
                label="Division"
                class="q-mb-sm"
                @update:model-value="onDivisionChange"
              />

              <!-- Section -->
              <q-select
                v-if="sectionOptions.length > 0"
                outlined
                dense
                v-model="editForm.new_section"
                :options="sectionOptions"
                label="Section"
                class="q-mb-sm"
                @update:model-value="onSectionChange"
              />

              <!-- Unit -->
              <q-select
                v-if="unitOptions.length > 0"
                outlined
                dense
                v-model="editForm.new_unit"
                :options="unitOptions"
                label="Unit"
                class="q-mb-sm"
              />

              <!-- No Structure Message -->
              <div v-if="!hasStructureData" class="text-caption text-warning q-mt-sm">
                <q-icon name="warning" size="sm" />
                No organizational structure available for this office
              </div>
            </div>
          </div>

          <!-- New Assignment Breadcrumb -->
          <div v-if="newAssignmentBreadcrumb.length" class="q-mt-md">
            <div class="text-caption text-grey-7 q-mb-xs">New Assignment Path:</div>
            <div class="row items-center breadcrumb-row">
              <template v-for="(level, idx) in newAssignmentBreadcrumb" :key="level.type">
                <q-icon
                  v-if="idx > 0"
                  name="chevron_right"
                  size="16px"
                  color="grey-5"
                  class="q-mx-xs"
                />
                <q-chip
                  dense
                  size="sm"
                  :icon="getNodeIcon({ nodeType: level.type })"
                  :color="idx === newAssignmentBreadcrumb.length - 1 ? 'green' : 'green-2'"
                  :text-color="idx === newAssignmentBreadcrumb.length - 1 ? 'white' : 'green-10'"
                >
                  {{ level.label }}
                </q-chip>
              </template>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="closeEditModal" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Update Assignment"
            icon-right="check"
            :loading="editLoading"
            :disable="!editForm.new_office"
            @click="updateEmployeeAssignment"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Reassignment Modal -->
    <q-dialog v-model="showReassignEditModal" persistent>
      <q-card style="width: 800px; max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6 text-bold">Edit Reassignment</div>
            <div class="text-caption text-grey-7">Update reassignment details</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="closeReassignEditModal" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <!-- Employee Info -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <div class="text-caption text-grey-7">Employee Name</div>
              <div class="text-subtitle1 text-bold">{{ reassignEditForm.name || 'N/A' }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Control No.</div>
              <div class="text-subtitle1 text-bold">{{ reassignEditForm.control_no || 'N/A' }}</div>
            </div>
          </div>

          <!-- Return Toggle -->
          <div class="q-mb-md">
            <div class="text-subtitle2 text-bold q-mb-sm">Assignment Status</div>
            <div class="row items-center q-gutter-sm">
              <q-toggle
                v-model="reassignEditForm.returned"
                label="Returned"
                color="orange"
                :true-value="true"
                :false-value="false"
                class="q-mr-md"
              />
              <q-badge
                :color="reassignEditForm.returned ? 'orange' : 'green'"
                :label="reassignEditForm.returned ? 'Inactive (Returned)' : 'Active'"
              />
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              <span v-if="reassignEditForm.returned">
                <q-icon name="info" size="sm" />
                Employee is marked as returned and inactive
              </span>
              <span v-else>
                <q-icon name="info" size="sm" />
                Employee is active in this reassignment
              </span>
            </div>
          </div>

          <!-- Current Reassignment Details -->
          <div class="q-mb-md">
            <div class="text-subtitle2 text-bold q-mb-sm">Current Reassignment</div>
            <q-banner dense rounded class="bg-grey-2">
              <div v-if="reassignCurrentBreadcrumb.length" class="row items-center breadcrumb-row">
                <template v-for="(level, idx) in reassignCurrentBreadcrumb" :key="level.type">
                  <q-icon
                    v-if="idx > 0"
                    name="chevron_right"
                    size="16px"
                    color="grey-5"
                    class="q-mx-xs"
                  />
                  <q-chip
                    dense
                    size="sm"
                    :icon="getNodeIcon({ nodeType: level.type })"
                    :color="idx === reassignCurrentBreadcrumb.length - 1 ? 'orange' : 'grey-4'"
                    :text-color="idx === reassignCurrentBreadcrumb.length - 1 ? 'white' : 'grey-9'"
                  >
                    {{ level.label }}
                  </q-chip>
                </template>
              </div>
              <span v-else class="text-grey-7">No reassignment details</span>
            </q-banner>
          </div>

          <!-- New Reassignment -->
          <div>
            <div class="text-subtitle2 text-bold q-mb-sm">Update Reassignment</div>

            <!-- Office Selection -->
            <q-select
              outlined
              dense
              v-model="reassignEditForm.new_office"
              :options="officeOptions"
              label="Office *"
              class="q-mb-sm"
              @update:model-value="onReassignEditOfficeChange"
            />

            <!-- Dynamic Structure Fields -->
            <div v-if="reassignEditForm.new_office">
              <!-- Sub-Office -->
              <q-select
                v-if="reassignEditOffice2Options.length > 0"
                outlined
                dense
                v-model="reassignEditForm.new_office2"
                :options="reassignEditOffice2Options"
                label="Sub-Office"
                class="q-mb-sm"
                @update:model-value="onReassignEditOffice2Change"
              />

              <!-- Group -->
              <q-select
                v-if="reassignEditGroupOptions.length > 0"
                outlined
                dense
                v-model="reassignEditForm.new_group"
                :options="reassignEditGroupOptions"
                label="Group"
                class="q-mb-sm"
                @update:model-value="onReassignEditGroupChange"
              />

              <!-- Division -->
              <q-select
                v-if="reassignEditDivisionOptions.length > 0"
                outlined
                dense
                v-model="reassignEditForm.new_division"
                :options="reassignEditDivisionOptions"
                label="Division"
                class="q-mb-sm"
                @update:model-value="onReassignEditDivisionChange"
              />

              <!-- Section -->
              <q-select
                v-if="reassignEditSectionOptions.length > 0"
                outlined
                dense
                v-model="reassignEditForm.new_section"
                :options="reassignEditSectionOptions"
                label="Section"
                class="q-mb-sm"
                @update:model-value="onReassignEditSectionChange"
              />

              <!-- Unit -->
              <q-select
                v-if="reassignEditUnitOptions.length > 0"
                outlined
                dense
                v-model="reassignEditForm.new_unit"
                :options="reassignEditUnitOptions"
                label="Unit"
                class="q-mb-sm"
              />

              <!-- No Structure Message -->
              <div v-if="!reassignEditHasStructureData" class="text-caption text-warning q-mt-sm">
                <q-icon name="warning" size="sm" />
                No organizational structure available for this office
              </div>
            </div>
          </div>

          <!-- New Reassignment Breadcrumb -->
          <div v-if="reassignEditNewBreadcrumb.length" class="q-mt-md">
            <div class="text-caption text-grey-7 q-mb-xs">New Reassignment Path:</div>
            <div class="row items-center breadcrumb-row">
              <template v-for="(level, idx) in reassignEditNewBreadcrumb" :key="level.type">
                <q-icon
                  v-if="idx > 0"
                  name="chevron_right"
                  size="16px"
                  color="grey-5"
                  class="q-mx-xs"
                />
                <q-chip
                  dense
                  size="sm"
                  :icon="getNodeIcon({ nodeType: level.type })"
                  :color="idx === reassignEditNewBreadcrumb.length - 1 ? 'green' : 'green-2'"
                  :text-color="idx === reassignEditNewBreadcrumb.length - 1 ? 'white' : 'green-10'"
                >
                  {{ level.label }}
                </q-chip>
              </template>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="closeReassignEditModal" />
          <q-btn
            unelevated
            no-caps
            color="orange"
            label="Update Reassignment"
            icon-right="check"
            :loading="reassignEditLoading"
            @click="updateReassignment"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Reassignment History Modal -->
    <q-dialog v-model="showHistoryModal">
      <q-card style="width: 1000px; max-width: 95vw">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-h6 text-bold">Reassignment History</div>
            <div class="text-caption text-grey-7">
              {{ historyEmployeeName }}
              <span v-if="historyData?.control_no">• Control No: {{ historyData.control_no }}</span>
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="closeHistoryModal" />
        </q-card-section>

        <q-card-section v-if="historyData" class="q-pt-sm q-pb-none">
          <div class="text-caption text-grey-7">Current Designation</div>
          <div class="text-subtitle2 text-bold">{{ historyData.designation || 'N/A' }}</div>
        </q-card-section>

        <q-separator class="q-mt-md" />

        <q-card-section>
          <q-table
            flat
            bordered
            class="wrap-table"
            :rows="historyRows"
            :columns="historyColumns"
            row-key="employee_reassign_id"
            :loading="usePlacement.historyLoading"
            wrap-cells
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="path" :props="props">
                  <div v-if="props.row.breadcrumb.length" class="row items-center breadcrumb-row">
                    <template v-for="(level, idx) in props.row.breadcrumb" :key="level.type">
                      <q-icon
                        v-if="idx > 0"
                        name="chevron_right"
                        size="14px"
                        color="grey-5"
                        class="q-mx-xs"
                      />
                      <q-chip
                        dense
                        size="sm"
                        :icon="getNodeIcon({ nodeType: level.type })"
                        :color="idx === props.row.breadcrumb.length - 1 ? 'primary' : 'grey-3'"
                        :text-color="idx === props.row.breadcrumb.length - 1 ? 'white' : 'grey-9'"
                      >
                        {{ level.label }}
                      </q-chip>
                    </template>
                  </div>
                  <span v-else class="text-grey-6 text-caption">No structure data</span>
                </q-td>
                <q-td key="status" :props="props" auto-width class="text-center">
                  <q-badge
                    :color="props.row.isActive ? 'green' : 'grey-6'"
                    :label="props.row.isActive ? 'Active' : 'Inactive'"
                  />
                </q-td>
                <q-td key="date" :props="props" auto-width style="white-space: nowrap">
                  {{ props.row.formattedDate }}
                </q-td>
              </q-tr>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey-7 q-pa-lg">
                <q-icon name="info" size="2em" class="q-mr-sm" />
                No Reassignment History
              </div>
            </template>
          </q-table>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Close"
            @click="closeHistoryModal"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Modal -->
    <q-dialog v-model="showDeleteModal" persistent>
      <q-card style="width: 400px; max-width: 90vw">
        <q-card-section>
          <div class="row items-center">
            <q-icon name="warning" color="negative" size="2.5rem" class="q-mr-md" />
            <div>
              <div class="text-h6 text-bold">Confirm Delete</div>
              <div class="text-subtitle2 text-grey-7">
                Are you sure you want to remove this employee?
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="deleteEmployeeData">
          <div class="text-caption text-grey-7 q-mb-xs">Employee Details:</div>
          <div class="text-subtitle1">{{ deleteEmployeeData.name }}</div>
          <div class="text-caption text-grey-7">
            Control No: {{ deleteEmployeeData.control_no }}
          </div>
          <div class="text-caption text-grey-7">Position: {{ deleteEmployeeData.position }}</div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="closeDeleteModal" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Delete"
            icon-right="delete"
            :loading="deleteLoading"
            @click="confirmDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useOfficeStore } from 'stores/officeLibraryStore';
  import { usePlacementStore } from 'stores/placementStore';
  import { useAuthStore } from 'stores/authStore';
  import { uid } from 'quasar';
  import { toast } from 'src/boot/toast';

  const useOffice = useOfficeStore();
  const usePlacement = usePlacementStore();
  const authStore = useAuthStore();

  // Statuses that are eligible for the Edit / Delete actions in the personnel table.
  const EDITABLE_STATUSES = ['CASUAL', 'CONTRACTUAL'];

  /* -------------------------------------------------------------------------- */
  /* Permissions - mirrors the Plantilla page's canModifyPlantilla pattern      */
  /* -------------------------------------------------------------------------- */

  const canModifyPlacement = computed(
    () => authStore.user?.permissions?.modifyPlacementAccess === '1',
  );

  /* -------------------------------------------------------------------------- */
  /* Panel / view state                                                        */
  /* -------------------------------------------------------------------------- */

  const showStructurePanel = ref(true);

  // 'actual'     -> only currently-placed employees
  // 'reassigned' -> currently-placed employees + anyone reassigned out, merged
  const employeeViewMode = ref('actual');
  const viewModeOptions = [
    { label: 'Actual Employees', value: 'actual' },
    { label: 'With Reassigned', value: 'reassigned' },
  ];

  /* -------------------------------------------------------------------------- */
  /* Office / structure selection state                                        */
  /* -------------------------------------------------------------------------- */

  const selectedValue = ref(null);
  const filteredOptions = ref([]);
  const selectedNode = ref(null);
  const selectedNodeData = ref(null);
  const currentStructure = ref(null);

  /* -------------------------------------------------------------------------- */
  /* Personnel table search                                                    */
  /* -------------------------------------------------------------------------- */

  const personnelSearch = ref('');

  const filteredPersonnelRows = computed(() => {
    const rows = personnelRows.value;
    const needle = personnelSearch.value?.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => {
      const name = (row.Name || '').toLowerCase();
      const controlNo = String(row.ControlNo || '').toLowerCase();
      const position = (row.Position || row.position || '').toLowerCase();
      const status = (row.Status || '').toLowerCase();
      return (
        name.includes(needle) ||
        controlNo.includes(needle) ||
        position.includes(needle) ||
        status.includes(needle)
      );
    });
  });

  const noDataMessage = computed(() => {
    if (personnelSearch.value && personnelRows.value.length) {
      return `No personnel matching "${personnelSearch.value}"`;
    }
    return showStructurePanel.value
      ? 'Click a structure node to view its personnel'
      : 'Select an office to view personnel';
  });

  /* -------------------------------------------------------------------------- */
  /* Edit modal state (for actual employees)                                  */
  /* -------------------------------------------------------------------------- */

  const showEditModal = ref(false);
  const editLoading = ref(false);

  function createEmptyEditForm() {
    return {
      control_no: '',
      name: '',
      position: '',
      current_office: '',
      current_office2: '',
      current_group: '',
      current_division: '',
      current_section: '',
      current_unit: '',
      new_office: null,
      new_office2: null,
      new_group: null,
      new_division: null,
      new_section: null,
      new_unit: null,
      rawStructure: null,
    };
  }

  const editForm = ref(createEmptyEditForm());

  const officeOptions = computed(() =>
    (useOffice.offices || []).map((office) => office.office_name).filter(Boolean),
  );

  /* -- Cascading structure lookups for the Edit modal's New Assignment fields -- */

  const findOffice2Node = (rawStructure, office2Value) => {
    if (!rawStructure) return null;
    return (
      (rawStructure.office2 || []).find((o) => (o.office2 || null) === (office2Value || null)) ||
      null
    );
  };

  const findGroupNode = (office2Node, groupValue) => {
    if (!office2Node) return null;
    return (
      (office2Node.group || []).find((g) => (g.group || null) === (groupValue || null)) || null
    );
  };

  const findDivisionNode = (groupNode, divisionValue) => {
    if (!groupNode || !divisionValue) return null;
    return (groupNode.divisions || []).find((d) => d.division === divisionValue) || null;
  };

  const selectedOffice2Node = computed(() =>
    findOffice2Node(editForm.value.rawStructure, editForm.value.new_office2),
  );
  const selectedGroupNode = computed(() =>
    findGroupNode(selectedOffice2Node.value, editForm.value.new_group),
  );
  const selectedDivisionNode = computed(() =>
    findDivisionNode(selectedGroupNode.value, editForm.value.new_division),
  );

  const office2Options = computed(() =>
    (editForm.value.rawStructure?.office2 || []).map((o) => o.office2).filter(Boolean),
  );

  const groupOptions = computed(() =>
    (selectedOffice2Node.value?.group || []).map((g) => g.group).filter(Boolean),
  );

  const divisionOptions = computed(() =>
    (selectedGroupNode.value?.divisions || []).map((d) => d.division),
  );

  const sectionOptions = computed(() => {
    if (editForm.value.new_division) {
      return (selectedDivisionNode.value?.sections || []).map((s) => s.section);
    }
    return (selectedGroupNode.value?.sections_without_division || []).map((s) => s.section);
  });

  const unitOptions = computed(() => {
    if (editForm.value.new_section) {
      const sectionPool = editForm.value.new_division
        ? selectedDivisionNode.value?.sections || []
        : selectedGroupNode.value?.sections_without_division || [];
      const sectionNode = sectionPool.find((s) => s.section === editForm.value.new_section);
      return sectionNode?.units || [];
    }
    if (editForm.value.new_division) {
      return selectedDivisionNode.value?.units_without_section || [];
    }
    if (editForm.value.new_group) {
      return selectedGroupNode.value?.units_without_division || [];
    }
    return [];
  });

  const hasStructureData = computed(
    () =>
      office2Options.value.length > 0 ||
      groupOptions.value.length > 0 ||
      divisionOptions.value.length > 0 ||
      sectionOptions.value.length > 0 ||
      unitOptions.value.length > 0,
  );

  /* -------------------------------------------------------------------------- */
  /* Breadcrumbs                                                               */
  /* -------------------------------------------------------------------------- */

  const buildBreadcrumbLevels = (source, keys) => {
    if (!source) return [];
    return keys
      .map(({ type, field }) => ({ type, label: source[field] }))
      .filter((level) => Boolean(level.label));
  };

  const STRUCTURE_LEVEL_KEYS = [
    { type: 'office', field: 'office' },
    { type: 'office2', field: 'office2' },
    { type: 'group', field: 'group' },
    { type: 'division', field: 'division' },
    { type: 'section', field: 'section' },
    { type: 'unit', field: 'unit' },
  ];

  const CURRENT_ASSIGNMENT_LEVEL_KEYS = [
    { type: 'office', field: 'current_office' },
    { type: 'office2', field: 'current_office2' },
    { type: 'group', field: 'current_group' },
    { type: 'division', field: 'current_division' },
    { type: 'section', field: 'current_section' },
    { type: 'unit', field: 'current_unit' },
  ];

  const NEW_ASSIGNMENT_LEVEL_KEYS = [
    { type: 'office', field: 'new_office' },
    { type: 'office2', field: 'new_office2' },
    { type: 'group', field: 'new_group' },
    { type: 'division', field: 'new_division' },
    { type: 'section', field: 'new_section' },
    { type: 'unit', field: 'new_unit' },
  ];

  const structureBreadcrumb = computed(() =>
    buildBreadcrumbLevels(currentStructure.value, STRUCTURE_LEVEL_KEYS),
  );

  const currentAssignmentBreadcrumb = computed(() =>
    buildBreadcrumbLevels(editForm.value, CURRENT_ASSIGNMENT_LEVEL_KEYS),
  );

  const newAssignmentBreadcrumb = computed(() =>
    buildBreadcrumbLevels(editForm.value, NEW_ASSIGNMENT_LEVEL_KEYS),
  );

  /* -------------------------------------------------------------------------- */
  /* Edit Reassignment modal state                                            */
  /* -------------------------------------------------------------------------- */

  const showReassignEditModal = ref(false);
  const reassignEditLoading = ref(false);
  const reassignEditId = ref(null);

  function createEmptyReassignEditForm() {
    return {
      control_no: '',
      name: '',
      position: '',
      returned: false,
      current_office: '',
      current_office2: '',
      current_group: '',
      current_division: '',
      current_section: '',
      current_unit: '',
      new_office: null,
      new_office2: null,
      new_group: null,
      new_division: null,
      new_section: null,
      new_unit: null,
      rawStructure: null,
    };
  }

  const reassignEditForm = ref(createEmptyReassignEditForm());

  // Computed for reassign edit cascading selects
  const reassignEditOffice2Options = computed(() =>
    (reassignEditForm.value.rawStructure?.office2 || []).map((o) => o.office2).filter(Boolean),
  );

  const reassignEditSelectedOffice2Node = computed(() =>
    findOffice2Node(reassignEditForm.value.rawStructure, reassignEditForm.value.new_office2),
  );

  const reassignEditGroupOptions = computed(() =>
    (reassignEditSelectedOffice2Node.value?.group || []).map((g) => g.group).filter(Boolean),
  );

  const reassignEditSelectedGroupNode = computed(() =>
    findGroupNode(reassignEditSelectedOffice2Node.value, reassignEditForm.value.new_group),
  );

  const reassignEditDivisionOptions = computed(() =>
    (reassignEditSelectedGroupNode.value?.divisions || []).map((d) => d.division),
  );

  const reassignEditSelectedDivisionNode = computed(() =>
    findDivisionNode(reassignEditSelectedGroupNode.value, reassignEditForm.value.new_division),
  );

  const reassignEditSectionOptions = computed(() => {
    if (reassignEditForm.value.new_division) {
      return (reassignEditSelectedDivisionNode.value?.sections || []).map((s) => s.section);
    }
    return (reassignEditSelectedGroupNode.value?.sections_without_division || []).map(
      (s) => s.section,
    );
  });

  const reassignEditUnitOptions = computed(() => {
    if (reassignEditForm.value.new_section) {
      const sectionPool = reassignEditForm.value.new_division
        ? reassignEditSelectedDivisionNode.value?.sections || []
        : reassignEditSelectedGroupNode.value?.sections_without_division || [];
      const sectionNode = sectionPool.find((s) => s.section === reassignEditForm.value.new_section);
      return sectionNode?.units || [];
    }
    if (reassignEditForm.value.new_division) {
      return reassignEditSelectedDivisionNode.value?.units_without_section || [];
    }
    if (reassignEditForm.value.new_group) {
      return reassignEditSelectedGroupNode.value?.units_without_division || [];
    }
    return [];
  });

  const reassignEditHasStructureData = computed(
    () =>
      reassignEditOffice2Options.value.length > 0 ||
      reassignEditGroupOptions.value.length > 0 ||
      reassignEditDivisionOptions.value.length > 0 ||
      reassignEditSectionOptions.value.length > 0 ||
      reassignEditUnitOptions.value.length > 0,
  );

  const reassignCurrentBreadcrumb = computed(() => {
    const keys = [
      { type: 'office', field: 'current_office' },
      { type: 'office2', field: 'current_office2' },
      { type: 'group', field: 'current_group' },
      { type: 'division', field: 'current_division' },
      { type: 'section', field: 'current_section' },
      { type: 'unit', field: 'current_unit' },
    ];
    return buildBreadcrumbLevels(reassignEditForm.value, keys);
  });

  const reassignEditNewBreadcrumb = computed(() => {
    const keys = [
      { type: 'office', field: 'new_office' },
      { type: 'office2', field: 'new_office2' },
      { type: 'group', field: 'new_group' },
      { type: 'division', field: 'new_division' },
      { type: 'section', field: 'new_section' },
      { type: 'unit', field: 'new_unit' },
    ];
    return buildBreadcrumbLevels(reassignEditForm.value, keys);
  });

  /* -------------------------------------------------------------------------- */
  /* Delete modal state                                                        */
  /* -------------------------------------------------------------------------- */

  const showDeleteModal = ref(false);
  const deleteLoading = ref(false);
  const deleteEmployeeData = ref(null);

  /* -------------------------------------------------------------------------- */
  /* Reassignment History modal state                                          */
  /* -------------------------------------------------------------------------- */

  const showHistoryModal = ref(false);

  // Raw response payload from GET /assign/history/{controlNo}
  const historyData = computed(() => usePlacement.employeeHistory);

  const historyEmployeeName = computed(() => {
    if (!historyData.value) return '';
    const { Firstname, Surname } = historyData.value;
    return [Firstname, Surname].filter(Boolean).join(' ') || 'N/A';
  });

  const historyColumns = [
    {
      name: 'path',
      label: 'Reassignment Path',
      field: 'path',
      align: 'left',
      style: 'width: auto;',
      headerStyle: 'width: auto;',
    },
    {
      name: 'status',
      label: 'Status',
      field: 'status',
      align: 'center',
      style: 'width: 100px;',
      headerStyle: 'width: 100px;',
    },
    {
      name: 'date',
      label: 'Date',
      field: 'date',
      align: 'left',
      style: 'width: 190px; white-space: nowrap;',
      headerStyle: 'width: 120px; white-space: nowrap;',
    },
  ];

  // Maps each raw history entry into a display-ready row:
  // - breadcrumb: chip trail built the same way as the other breadcrumbs on this page
  // - isActive: derived from the "active" flag ('1' / 1 / true = active)
  // - formattedDate: human-readable created_at
  const historyRows = computed(() => {
    const entries = historyData.value?.re_assignment_history || [];
    return (
      [...entries]
        // Latest to oldest - entries without a created_at date are pushed to the bottom
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : -Infinity;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : -Infinity;
          return dateB - dateA;
        })
        .map((entry) => ({
          ...entry,
          breadcrumb: buildBreadcrumbLevels(entry, STRUCTURE_LEVEL_KEYS),
          isActive: entry.active === '1' || entry.active === 1 || entry.active === true,
          formattedDate: entry.created_at
            ? new Date(entry.created_at).toLocaleString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—',
        }))
    );
  });

  const openHistoryModal = async (row) => {
    showHistoryModal.value = true;
    try {
      await usePlacement.fetchHistory(row.ControlNo);
    } catch (error) {
      console.error('Error loading reassignment history:', error);
    }
  };

  const closeHistoryModal = () => {
    showHistoryModal.value = false;
    usePlacement.resetHistory();
  };

  /* -------------------------------------------------------------------------- */
  /* Add / Reassign Employee Modal                                             */
  /* -------------------------------------------------------------------------- */

  const showAddEmployeeModal = ref(false);
  const modalStep = ref(1);
  const modalSelected = ref([]);
  const modalSearch = ref('');
  const isAssigning = ref(false);
  const reassignOfficeFilter = ref(null);
  const reassignOfficeOptions = ref([]);

  // Modal columns - handles both Designation (actual) and position (reassigned)
  const modalColumns = [
    {
      name: 'ControlNo',
      label: 'Control No',
      field: (row) => row.ControlNo || row.control_no || '',
      align: 'left',
      style: 'width: 110px; white-space: normal;',
      headerStyle: 'width: 110px;',
    },
    {
      name: 'Name',
      label: 'Name',
      field: (row) => row.Name4 || row.Name || row.name || '',
      align: 'left',
      style: 'width: 240px; white-space: normal;',
      headerStyle: 'width: 240px;',
    },
    {
      name: 'Position',
      label: 'Position',
      field: (row) => row.Designation || row.position || row.Position || '',
      align: 'left',
      style: 'white-space: normal;',
    },
    {
      name: 'Status',
      label: 'Status',
      field: (row) => row.Status || row.status || '',
      align: 'left',
      style: 'width: 110px; white-space: normal;',
      headerStyle: 'width: 110px;',
    },
  ];

  const reviewColumns = [
    ...modalColumns,
    { name: 'remove', label: '', field: 'remove', align: 'center', style: 'width: 60px;' },
  ];

  const modalFilteredRows = computed(() => {
    let source = [];
    if (employeeViewMode.value === 'actual') {
      source = usePlacement.placements || [];
    } else {
      source = usePlacement.reassignments || [];
    }
    if (!modalSearch.value) return source;
    const needle = modalSearch.value.toLowerCase();
    return source.filter(
      (row) =>
        (row.Name4 || row.Name || row.name || '').toLowerCase().includes(needle) ||
        (row.Designation || row.position || row.Position || '').toLowerCase().includes(needle),
    );
  });

  const removeFromSelection = (row) => {
    modalSelected.value = modalSelected.value.filter((r) => r.ControlNo !== row.ControlNo);
  };

  const openAddEmployeeModal = async () => {
    if (!currentStructure.value) return;
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }

    modalStep.value = 1;
    modalSelected.value = [];
    modalSearch.value = '';
    showAddEmployeeModal.value = true;

    if (employeeViewMode.value === 'actual') {
      await usePlacement.fetchPlacements(currentStructure.value.office);
    } else {
      await useOffice.fetchOffices();
      reassignOfficeOptions.value = (useOffice.offices || [])
        .map((o) => o.office_name)
        .filter(Boolean);
      reassignOfficeFilter.value = null;
      usePlacement.reassignments = [];
    }
  };

  const onReassignOfficeChange = async (office) => {
    if (office) {
      await usePlacement.fetchReassignments(office);
    } else {
      usePlacement.reassignments = [];
    }
  };

  const assignSelectedPersonnel = async () => {
    if (!modalSelected.value.length) return;

    isAssigning.value = true;
    try {
      if (employeeViewMode.value === 'actual') {
        for (const person of modalSelected.value) {
          const payload = {
            control_no: person.ControlNo,
            name: person.Name4 || person.Name,
            position: person.Designation || person.Position,
            status: person.Status || null,
            office: currentStructure.value.office || null,
            office2: currentStructure.value.office2 || null,
            group: currentStructure.value.group || null,
            division: currentStructure.value.division || null,
            section: currentStructure.value.section || null,
            unit: currentStructure.value.unit || null,
          };
          await usePlacement.storePlacement(payload);
        }
        toast.success('Employees assigned successfully');
      } else {
        if (!reassignOfficeFilter.value) {
          toast.warning('Please select an office');
          return;
        }
        for (const person of modalSelected.value) {
          const payload = {
            control_no: person.ControlNo || person.control_no,
            name: person.Name || person.name,
            position: person.position || person.Position || person.Designation,
            office: currentStructure.value.office || null,
            office2: currentStructure.value.office2 || null,
            group: currentStructure.value.group || null,
            division: currentStructure.value.division || null,
            section: currentStructure.value.section || null,
            unit: currentStructure.value.unit || null,
          };
          await usePlacement.storeReassignment(payload);
        }
        toast.success('Employees reassigned successfully');
      }
      showAddEmployeeModal.value = false;
      modalSelected.value = [];
      await refreshData();
    } catch (error) {
      console.error('Error assigning personnel:', error);
      toast.error('Failed to assign one or more employees. Please try again.');
    } finally {
      isAssigning.value = false;
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Structure matching helpers                                                */
  /* -------------------------------------------------------------------------- */

  const valuesMatch = (val1, val2) => {
    const normalize = (val) => (val === null || val === undefined || val === '' ? '' : val);
    return normalize(val1) === normalize(val2);
  };

  const matchesStructureNode = (row, s) => {
    if (!row.office || row.office !== s.office) return false;

    if (s.unit) {
      return (
        valuesMatch(row.office2, s.office2) &&
        valuesMatch(row.group, s.group) &&
        valuesMatch(row.division, s.division) &&
        valuesMatch(row.section, s.section) &&
        valuesMatch(row.unit, s.unit)
      );
    }
    if (s.section) {
      return (
        valuesMatch(row.office2, s.office2) &&
        valuesMatch(row.group, s.group) &&
        valuesMatch(row.division, s.division) &&
        valuesMatch(row.section, s.section) &&
        (!row.unit || row.unit === '')
      );
    }
    if (s.division) {
      return (
        valuesMatch(row.office2, s.office2) &&
        valuesMatch(row.group, s.group) &&
        valuesMatch(row.division, s.division) &&
        (!row.section || row.section === '') &&
        (!row.unit || row.unit === '')
      );
    }
    if (s.group) {
      return (
        valuesMatch(row.office2, s.office2) &&
        valuesMatch(row.group, s.group) &&
        (!row.division || row.division === '') &&
        (!row.section || row.section === '') &&
        (!row.unit || row.unit === '')
      );
    }
    if (s.office2) {
      return (
        valuesMatch(row.office2, s.office2) &&
        (!row.group || row.group === '') &&
        (!row.division || row.division === '') &&
        (!row.section || row.section === '') &&
        (!row.unit || row.unit === '')
      );
    }
    return (
      (!row.office2 || row.office2 === '') &&
      (!row.group || row.group === '') &&
      (!row.division || row.division === '') &&
      (!row.section || row.section === '') &&
      (!row.unit || row.unit === '')
    );
  };

  /* -------------------------------------------------------------------------- */
  /* Employee row mapping                                                      */
  /* -------------------------------------------------------------------------- */

  const mappedEmployees = computed(() => {
    // 1. Get actual employees (only those with re_assign: false)
    const actualEmployees = (useOffice.employees || [])
      .filter((row) => row.re_assign === false || row.re_assign === null)
      .map((row) => ({
        ControlNo: row.ControlNo ?? '',
        Name: row.Name ?? '',
        Position: row.Designation ?? '',
        Status: row.Status ?? '',
        office: row.Office ?? null,
        office2: row.Office2 ?? null,
        group: row.Group ?? null,
        division: row.Division ?? null,
        section: row.Section ?? null,
        unit: row.Unit ?? null,
        re_assign: row.re_assign ?? false,
        isActualEmployee: true,
        isReassigned: false,
        ReAssignId: null,
        returned: false,
      }));

    // If in actual mode, return ONLY actual employees
    if (employeeViewMode.value === 'actual') {
      return actualEmployees;
    }

    // 2. For "With Reassigned" mode, show:
    // - All actual employees (re_assign: false)
    // - PLUS reassigned employees (re_assign: true) with their reassignment data
    const employeeMap = new Map();

    // Add all actual employees first
    actualEmployees.forEach((emp) => {
      employeeMap.set(emp.ControlNo, { ...emp });
    });

    // Add reassigned employees (re_assign: true) - these OVERRIDE actual if they exist
    (useOffice.employees || [])
      .filter((row) => row.re_assign === true)
      .forEach((row) => {
        // Check if this employee also exists in reassignedEmployees with a position
        const reassignedData = useOffice.reassignedEmployees?.find(
          (r) => r.control_no === row.ControlNo,
        );

        const reassignedEmployee = {
          ControlNo: row.ControlNo ?? '',
          Name: row.Name ?? '',
          Position: reassignedData?.position || row.Designation || '',
          Status: row.Status ?? 'REGULAR',
          office: row.Office ?? null,
          office2: row.Office2 ?? null,
          group: row.Group ?? null,
          division: row.Division ?? null,
          section: row.Section ?? null,
          unit: row.Unit ?? null,
          re_assign: true,
          isActualEmployee: true, // They still exist in the system
          isReassigned: true, // But they've been reassigned
          ReAssignId: reassignedData?.id ?? null,
          returned: reassignedData?.active === '0' || reassignedData?.active === 0 || false,
        };

        employeeMap.set(row.ControlNo, reassignedEmployee);
      });

    return Array.from(employeeMap.values());
  });

  const personnelRows = computed(() => {
    if (!selectedValue.value) return [];

    if (!showStructurePanel.value) {
      return mappedEmployees.value.filter((row) => row.office === selectedValue.value);
    }

    if (!currentStructure.value) return [];
    return mappedEmployees.value.filter((row) => matchesStructureNode(row, currentStructure.value));
  });

  const canEditRow = (row) => {
    if (!canModifyPlacement.value) return false;
    if (employeeViewMode.value !== 'actual') return false;
    if (row.isReassigned) return false;
    return EDITABLE_STATUSES.includes(row.Status?.toUpperCase());
  };

  // Reassigned employees (green-text rows, sourced from fetchReassignedEmployees) -
  // shown only in the "With Reassigned" view, gated by the same modify permission.
  const canEditReassignedRow = (row) => {
    if (!canModifyPlacement.value) return false;
    if (employeeViewMode.value !== 'reassigned') return false;
    return Boolean(row.isReassigned && row.ReAssignId);
  };

  const getRowClass = (row) => {
    if (employeeViewMode.value === 'actual' && row.re_assign === true) {
      return 'reassign-true-row';
    }
    if (employeeViewMode.value === 'reassigned' && row.isReassigned) {
      return 'reassigned-row';
    }
    return '';
  };

  /* -------------------------------------------------------------------------- */
  /* Personnel table columns                                                   */
  /* -------------------------------------------------------------------------- */

  const personnelColumns = [
    {
      name: 'ControlNo',
      label: 'Control No',
      field: (row) => row.ControlNo || '',
      align: 'left',
      style: 'width: 110px; white-space: normal;',
      headerStyle: 'width: 110px;',
    },
    {
      name: 'Name',
      label: 'Name',
      field: (row) => row.Name || '',
      align: 'left',
      style: 'width: 200px; white-space: normal;',
      headerStyle: 'width: 200px;',
    },
    {
      name: 'Position',
      label: 'Position',
      field: (row) => row.Position || row.position || '',
      align: 'left',
      style: 'white-space: normal;',
    },
    {
      name: 'Status',
      label: 'Status',
      field: (row) => row.Status || '',
      align: 'left',
      style: 'width: 130px; white-space: normal;',
      headerStyle: 'width: 130px;',
    },
    {
      name: 'actions',
      label: 'Actions',
      field: 'actions',
      align: 'center',
      style: 'width: 190px;',
      headerStyle: 'width: 190px;',
    },
  ];

  /* -------------------------------------------------------------------------- */
  /* Edit Employee (Actual)                                                   */
  /* -------------------------------------------------------------------------- */

  const openEditModal = async (row) => {
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }

    editForm.value = {
      ...createEmptyEditForm(),
      control_no: row.ControlNo || '',
      name: row.Name || '',
      position: row.Position || '',
      current_office: row.office || '',
      current_office2: row.office2 || '',
      current_group: row.group || '',
      current_division: row.division || '',
      current_section: row.section || '',
      current_unit: row.unit || '',
      new_office: row.office || null,
      new_office2: row.office2 || null,
      new_group: row.group || null,
      new_division: row.division || null,
      new_section: row.section || null,
      new_unit: row.unit || null,
    };

    if (editForm.value.new_office) {
      await loadStructureForOffice(editForm.value.new_office);
    }

    showEditModal.value = true;
  };

  const closeEditModal = () => {
    showEditModal.value = false;
    editLoading.value = false;
  };

  const onOfficeChange = async (office) => {
    editForm.value.new_office2 = null;
    editForm.value.new_group = null;
    editForm.value.new_division = null;
    editForm.value.new_section = null;
    editForm.value.new_unit = null;
    editForm.value.rawStructure = null;

    if (office) {
      await loadStructureForOffice(office);
    }
  };

  const onOffice2Change = () => {
    editForm.value.new_group = null;
    editForm.value.new_division = null;
    editForm.value.new_section = null;
    editForm.value.new_unit = null;
  };

  const onGroupChange = () => {
    editForm.value.new_division = null;
    editForm.value.new_section = null;
    editForm.value.new_unit = null;
  };

  const onDivisionChange = () => {
    editForm.value.new_section = null;
    editForm.value.new_unit = null;
  };

  const onSectionChange = () => {
    editForm.value.new_unit = null;
  };

  const loadStructureForOffice = async (office) => {
    try {
      await useOffice.fetchOfficeStructure(office);
      editForm.value.rawStructure =
        (useOffice.structure || []).find((entry) => entry.office === office) || null;
    } catch (error) {
      console.error('Error loading structure:', error);
      toast.error('Failed to load office structure');
      editForm.value.rawStructure = null;
    }
  };

  const updateEmployeeAssignment = async () => {
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }

    if (!editForm.value.new_office) {
      toast.warning('Please select an office');
      return;
    }

    editLoading.value = true;
    try {
      const payload = {
        office: editForm.value.new_office,
        office2: editForm.value.new_office2 || null,
        group: editForm.value.new_group || null,
        division: editForm.value.new_division || null,
        section: editForm.value.new_section || null,
        unit: editForm.value.new_unit || null,
      };

      await usePlacement.updatePlacement(editForm.value.control_no, payload);
      await refreshData();
      closeEditModal();
      toast.success('Employee reassigned successfully');
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    } finally {
      editLoading.value = false;
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Edit Reassignment                                                         */
  /* -------------------------------------------------------------------------- */

  const openReassignEditModal = async (row) => {
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }

    reassignEditId.value = row.ReAssignId || row.id || null;
    if (!reassignEditId.value) {
      toast.error('No reassignment ID found');
      return;
    }

    // Determine if the employee is returned (active = '0' or 0 or false)
    const isReturned =
      row.active === '0' || row.active === 0 || row.active === false || row.returned === true;

    reassignEditForm.value = {
      ...createEmptyReassignEditForm(),
      control_no: row.ControlNo || '',
      name: row.Name || '',
      position: row.Position || '',
      returned: isReturned,
      current_office: row.office || '',
      current_office2: row.office2 || '',
      current_group: row.group || '',
      current_division: row.division || '',
      current_section: row.section || '',
      current_unit: row.unit || '',
      // Use the current path from the row data
      new_office: row.office || null,
      new_office2: row.office2 || null,
      new_group: row.group || null,
      new_division: row.division || null,
      new_section: row.section || null,
      new_unit: row.unit || null,
    };

    if (reassignEditForm.value.new_office) {
      await loadStructureForReassignEdit(reassignEditForm.value.new_office);
    }

    showReassignEditModal.value = true;
  };

  const closeReassignEditModal = () => {
    showReassignEditModal.value = false;
    reassignEditLoading.value = false;
    reassignEditId.value = null;
  };

  const onReassignEditOfficeChange = async (office) => {
    reassignEditForm.value.new_office2 = null;
    reassignEditForm.value.new_group = null;
    reassignEditForm.value.new_division = null;
    reassignEditForm.value.new_section = null;
    reassignEditForm.value.new_unit = null;
    reassignEditForm.value.rawStructure = null;

    if (office) {
      await loadStructureForReassignEdit(office);
    }
  };

  const onReassignEditOffice2Change = () => {
    reassignEditForm.value.new_group = null;
    reassignEditForm.value.new_division = null;
    reassignEditForm.value.new_section = null;
    reassignEditForm.value.new_unit = null;
  };

  const onReassignEditGroupChange = () => {
    reassignEditForm.value.new_division = null;
    reassignEditForm.value.new_section = null;
    reassignEditForm.value.new_unit = null;
  };

  const onReassignEditDivisionChange = () => {
    reassignEditForm.value.new_section = null;
    reassignEditForm.value.new_unit = null;
  };

  const onReassignEditSectionChange = () => {
    reassignEditForm.value.new_unit = null;
  };

  const loadStructureForReassignEdit = async (office) => {
    try {
      await useOffice.fetchOfficeStructure(office);
      reassignEditForm.value.rawStructure =
        (useOffice.structure || []).find((entry) => entry.office === office) || null;
    } catch (error) {
      console.error('Error loading structure:', error);
      toast.error('Failed to load office structure');
      reassignEditForm.value.rawStructure = null;
    }
  };

  // This function updates structure fields ONLY when there are changes
  const updateReassignment = async () => {
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }

    if (!reassignEditId.value) {
      toast.error('No reassignment ID found');
      return;
    }

    // Check if there are any actual structure changes
    const hasStructureChanges =
      reassignEditForm.value.new_office !== reassignEditForm.value.current_office ||
      reassignEditForm.value.new_office2 !== reassignEditForm.value.current_office2 ||
      reassignEditForm.value.new_group !== reassignEditForm.value.current_group ||
      reassignEditForm.value.new_division !== reassignEditForm.value.current_division ||
      reassignEditForm.value.new_section !== reassignEditForm.value.current_section ||
      reassignEditForm.value.new_unit !== reassignEditForm.value.current_unit;

    // If no structure changes, just close the modal
    if (!hasStructureChanges) {
      toast.info('No changes to update');
      closeReassignEditModal();
      return;
    }

    reassignEditLoading.value = true;
    try {
      // Only update structure fields
      const structurePayload = {
        office: reassignEditForm.value.new_office,
        office2: reassignEditForm.value.new_office2 || null,
        group: reassignEditForm.value.new_group || null,
        division: reassignEditForm.value.new_division || null,
        section: reassignEditForm.value.new_section || null,
        unit: reassignEditForm.value.new_unit || null,
      };

      await usePlacement.updateReassignment(reassignEditId.value, structurePayload);

      await refreshData();
      closeReassignEditModal();
    } catch (error) {
      console.error('Error updating reassignment:', error);
      toast.error('Failed to update reassignment');
    } finally {
      reassignEditLoading.value = false;
    }
  };

  // This function handles the returned toggle - updates active status
  const handleReturnToggle = async () => {
    if (!reassignEditId.value) return;

    try {
      await usePlacement.returnReassignment(reassignEditId.value);

      await refreshData();
    } catch (error) {
      console.error('Error toggling return status:', error);
      // Revert the toggle if there was an error
      reassignEditForm.value.returned = !reassignEditForm.value.returned;
      toast.error('Failed to update return status');
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Delete Employee                                                           */
  /* -------------------------------------------------------------------------- */

  const openDeleteModal = (row) => {
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }

    deleteEmployeeData.value = {
      control_no: row.ControlNo || '',
      name: row.Name || '',
      position: row.Position || '',
    };
    showDeleteModal.value = true;
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteEmployeeData.value = null;
  };

  const confirmDelete = async () => {
    if (!canModifyPlacement.value) {
      toast.warning('You do not have permission to modify placements.');
      return;
    }
    if (!deleteEmployeeData.value) return;

    deleteLoading.value = true;
    try {
      await usePlacement.deletePlacement(deleteEmployeeData.value.control_no, selectedValue.value);
      await refreshData();
      closeDeleteModal();
      toast.success('Employee removed successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to remove employee');
    } finally {
      deleteLoading.value = false;
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Shared data refresh                                                       */
  /* -------------------------------------------------------------------------- */

  const refreshData = async () => {
    if (!selectedValue.value) return;
    await Promise.all([
      useOffice.fetchOfficeEmployees(selectedValue.value),
      useOffice.fetchReassignedEmployees(selectedValue.value),
    ]);
  };

  /* -------------------------------------------------------------------------- */
  /* Office dropdown                                                           */
  /* -------------------------------------------------------------------------- */

  const getOptions = () => filteredOptions.value || [];

  const getUniqueValues = () => {
    const values = new Set();
    (useOffice.offices || []).forEach((office) => {
      if (office.office_name) values.add(office.office_name);
    });
    return Array.from(values).sort();
  };

  const filterOptions = (val, update) => {
    update(() => {
      if (useOffice.loading) return;
      const needle = val.toLowerCase();
      filteredOptions.value = needle
        ? getUniqueValues().filter((v) => v.toLowerCase().includes(needle))
        : getUniqueValues();
    });
  };

  const handleSelection = async () => {
    selectedNode.value = null;
    selectedNodeData.value = null;
    currentStructure.value = null;
    personnelSearch.value = '';

    if (!selectedValue.value) {
      useOffice.structure = [];
      useOffice.employees = [];
      useOffice.reassignedEmployees = [];
      return;
    }

    await Promise.all([
      useOffice.fetchOfficeStructure(selectedValue.value),
      useOffice.fetchOfficeEmployees(selectedValue.value),
      useOffice.fetchReassignedEmployees(selectedValue.value),
    ]);
  };

  /* -------------------------------------------------------------------------- */
  /* Structure tree generation                                                 */
  /* -------------------------------------------------------------------------- */

  const buildUnitNode = (unitName, parentData) => ({
    id: 'unit-' + uid(),
    label: unitName,
    nodeType: 'unit',
    data: { ...parentData, unit: unitName },
  });

  const buildSectionNode = (sectionEntry, parentData) => {
    const data = { ...parentData, section: sectionEntry.section };
    return {
      id: 'section-' + uid(),
      label: sectionEntry.section,
      nodeType: 'section',
      data,
      children: (sectionEntry.units || []).map((unitName) => buildUnitNode(unitName, data)),
    };
  };

  const buildDivisionNode = (divisionEntry, parentData) => {
    const data = { ...parentData, division: divisionEntry.division };
    const children = [
      ...(divisionEntry.sections || []).map((sectionEntry) => buildSectionNode(sectionEntry, data)),
      ...(divisionEntry.units_without_section || []).map((unitName) =>
        buildUnitNode(unitName, data),
      ),
    ];
    return {
      id: 'division-' + uid(),
      label: divisionEntry.division,
      nodeType: 'division',
      data,
      children,
    };
  };

  const buildGroupChildren = (groupEntry, parentData) => [
    ...(groupEntry.divisions || []).map((divisionEntry) =>
      buildDivisionNode(divisionEntry, parentData),
    ),
    ...(groupEntry.sections_without_division || []).map((sectionEntry) =>
      buildSectionNode(sectionEntry, parentData),
    ),
    ...(groupEntry.units_without_division || []).map((unitName) =>
      buildUnitNode(unitName, parentData),
    ),
  ];

  const buildGroupNode = (groupEntry, parentData) => {
    const data = { ...parentData, group: groupEntry.group };
    if (!groupEntry.group) {
      return buildGroupChildren(groupEntry, data);
    }
    return [
      {
        id: 'group-' + uid(),
        label: groupEntry.group,
        nodeType: 'group',
        data,
        children: buildGroupChildren(groupEntry, data),
      },
    ];
  };

  const buildOffice2Children = (office2Entry, parentData) =>
    (office2Entry.group || []).flatMap((groupEntry) => buildGroupNode(groupEntry, parentData));

  const buildOffice2Node = (office2Entry, parentData) => {
    const data = { ...parentData, office2: office2Entry.office2 };
    if (!office2Entry.office2) {
      return buildOffice2Children(office2Entry, data);
    }
    return [
      {
        id: 'office2-' + uid(),
        label: office2Entry.office2,
        nodeType: 'office2',
        data,
        children: buildOffice2Children(office2Entry, data),
      },
    ];
  };

  const buildOfficeTree = (officeEntry) => {
    const data = { office: officeEntry.office };
    return {
      id: 'office-' + uid(),
      label: officeEntry.office,
      nodeType: 'office',
      data,
      children: (officeEntry.office2 || []).flatMap((office2Entry) =>
        buildOffice2Node(office2Entry, data),
      ),
    };
  };

  const structureTree = computed(() => {
    const structureData = useOffice.structure || [];
    if (!selectedValue.value || !structureData.length) return [];
    return structureData
      .filter((entry) => entry.office === selectedValue.value)
      .map((entry) => buildOfficeTree(entry));
  });

  const handleNodeSelection = (key) => {
    const findNode = (nodes) => {
      for (const node of nodes) {
        if (node.id === key) return node;
        if (node.children?.length) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    selectedNodeData.value = findNode(structureTree.value);
    if (selectedNodeData.value?.data) {
      currentStructure.value = selectedNodeData.value.data;
    }
    personnelSearch.value = '';
  };

  const getNodeIcon = (node) => {
    const iconMap = {
      office: 'business',
      office2: 'business',
      group: 'account_tree',
      division: 'corporate_fare',
      section: 'folder',
      unit: 'group_work',
    };
    return iconMap[node.nodeType] || 'label';
  };

  /* -------------------------------------------------------------------------- */
  /* Watch for returned toggle changes                                         */
  /* -------------------------------------------------------------------------- */

  watch(
    () => reassignEditForm.value.returned,
    (newValue, oldValue) => {
      // Only trigger if the value actually changed and we have an ID
      if (newValue !== oldValue && reassignEditId.value) {
        handleReturnToggle();
      }
    },
  );

  /* -------------------------------------------------------------------------- */
  /* Lifecycle                                                                 */
  /* -------------------------------------------------------------------------- */

  watch(
    () => useOffice.loading,
    (isLoading) => {
      if (!isLoading) {
        filteredOptions.value = getUniqueValues();
      }
    },
  );

  onMounted(async () => {
    await useOffice.fetchOffices();
    filteredOptions.value = getUniqueValues();
  });
</script>

<style scoped>
  .custom-tree .selected-node {
    background-color: #00b03527;
    color: black;
    border-radius: 4px;
  }

  .panel-toggle-btn {
    border-radius: 8px;
    padding: 10px 16px;
    font-weight: 600;
    font-size: 13px;
    transition: background-color 0.15s ease;
  }

  .panel-toggle-btn:hover {
    filter: brightness(0.96);
  }

  .wrap-table {
    table-layout: fixed;
  }

  .wrap-table :deep(td),
  .wrap-table :deep(th) {
    white-space: normal;
    word-break: break-word;
    vertical-align: top;
  }

  .panel-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    flex: 0 0 auto;
    background: white;
  }

  .panel-scroll {
    flex: 1 1 auto;
    min-height: 0;
  }

  .node-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .node-label {
    flex: 1 1 auto;
    min-width: 0;
    white-space: normal;
    word-break: break-word;
  }

  .node-badge {
    flex-shrink: 0;
    align-self: flex-start;
  }

  .breadcrumb-row {
    flex-wrap: wrap;
    row-gap: 6px;
  }

  .reassigned-row td {
    color: #2e7d32 !important;
  }

  .reassigned-row:hover td {
    color: #1b5e20 !important;
  }

  .reassign-true-row td {
    color: #1565c0 !important;
  }

  .reassign-true-row:hover td {
    color: #0d47a1 !important;
  }

  .action-btn {
    margin: 0 2px;
  }
</style>
