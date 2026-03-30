<template>
  <q-dialog v-model="show" persistent>
    <q-card style="max-width: 1600px; width: 95vw">
      <!-- Sticky Header -->
      <q-card-section class="row items-center q-pa-sm bg-primary text-white sticky-header">
        <div class="text-h6">
          {{ getModalTitle() }} Rating Criteria
          <span v-if="sgMin && sgMax" class="q-ml-sm">(SG {{ sgMin }} - {{ sgMax }})</span>
        </div>
        <q-space />
        <q-btn icon="close" flat dense @click="closeModal" />
      </q-card-section>

      <!-- Loading State -->
      <div v-if="loading" class="q-pa-xl text-center">
        <q-spinner size="2rem" color="primary" class="q-mb-sm" />
        <div class="text-subtitle2">Loading criteria information...</div>
      </div>

      <!-- Salary Grade Range Section -->
      <q-card-section v-else-if="showCriteriaForm" class="q-pa-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="salaryGradeData.sg_min"
              label="Salary Grade (Min)"
              type="number"
              min="1"
              max="33"
              dense
              outlined
              :readonly="mode === 'view' || mode === 'edit'"
              :rules="[(val) => !!val || 'Minimum SG is required']"
              class="q-mb-sm"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="salaryGradeData.sg_max"
              label="Salary Grade (Max)"
              type="number"
              min="1"
              max="33"
              dense
              outlined
              :readonly="mode === 'view' || mode === 'edit'"
              :rules="[
                (val) => !!val || 'Maximum SG is required',
                (val) => parseInt(val) >= parseInt(salaryGradeData.sg_min) || 'Max must be >= Min',
              ]"
              class="q-mb-sm"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Optional Sections Toggle Bar -->
      <q-card-section v-if="showCriteriaForm && !loading" class="q-pa-sm bg-grey-1">
        <div class="row items-center q-gutter-sm">
          <div class="text-caption text-weight-medium text-grey-7 q-mr-xs">
            <q-icon name="tune" size="xs" class="q-mr-xs" />
            Optional Sections:
          </div>

          <!-- BEI Toggle (edit/create mode) -->
          <q-chip
            v-if="mode !== 'view' && hasPermission"
            :color="optionalSections.bei ? 'primary' : 'grey-4'"
            :text-color="optionalSections.bei ? 'white' : 'grey-7'"
            clickable
            dense
            class="text-12 optional-chip"
            @click="toggleOptionalSection('bei')"
          >
            <q-icon
              :name="optionalSections.bei ? 'check_circle' : 'add_circle_outline'"
              size="xs"
              class="q-mr-xs"
            />
            BEI
            <q-tooltip>
              {{
                optionalSections.bei ? 'Click to remove BEI section' : 'Click to add BEI section'
              }}
            </q-tooltip>
          </q-chip>

          <!-- BEI view-only chip -->
          <q-chip
            v-else-if="optionalSections.bei"
            color="primary"
            text-color="white"
            dense
            class="text-12"
          >
            <q-icon name="check_circle" size="xs" class="q-mr-xs" />
            BEI
          </q-chip>

          <!-- Exam Toggle (edit/create mode) -->
          <q-chip
            v-if="mode !== 'view' && hasPermission"
            :color="optionalSections.exam ? 'deep-purple' : 'grey-4'"
            :text-color="optionalSections.exam ? 'white' : 'grey-7'"
            clickable
            dense
            class="text-12 optional-chip"
            @click="toggleOptionalSection('exam')"
          >
            <q-icon
              :name="optionalSections.exam ? 'check_circle' : 'add_circle_outline'"
              size="xs"
              class="q-mr-xs"
            />
            Exam
            <q-tooltip>
              {{
                optionalSections.exam ? 'Click to remove Exam section' : 'Click to add Exam section'
              }}
            </q-tooltip>
          </q-chip>

          <!-- Exam view-only chip -->
          <q-chip
            v-else-if="optionalSections.exam"
            color="deep-purple"
            text-color="white"
            dense
            class="text-12"
          >
            <q-icon name="check_circle" size="xs" class="q-mr-xs" />
            Exam
          </q-chip>

          <q-space />

          <div v-if="mode !== 'view' && hasPermission" class="text-caption text-grey-5">
            <q-icon name="info" size="xs" class="q-mr-xs" />
            Toggle to include or exclude optional scoring sections
          </div>
        </div>
      </q-card-section>

      <!-- Criteria -->
      <q-card-section v-if="showCriteriaForm && !loading" class="criteria-section">
        <div class="row q-mb-sm">
          <div class="col-12">
            <div class="float-right">
              <template v-if="mode === 'view'">
                <q-btn
                  v-if="hasPermission"
                  color="primary"
                  icon="edit"
                  label="Edit Criteria"
                  @click="switchToEditMode"
                  unelevated
                  dense
                  class="q-px-md q-py-xs text-12 q-mr-sm"
                />
              </template>

              <template v-if="(mode === 'edit' || mode === 'create') && hasPermission">
                <q-btn
                  color="primary"
                  icon="save"
                  label="Save Criteria"
                  :loading="criteriaStore.loading"
                  :disable="!isFormValid"
                  @click="confirmSave"
                  unelevated
                  dense
                  class="q-px-md q-py-xs text-12"
                />
              </template>
            </div>

            <q-chip
              :color="totalWeight !== 100 ? 'warning' : 'positive'"
              text-color="white"
              class="text-12"
            >
              <q-icon
                :name="totalWeight !== 100 ? 'warning' : 'check_circle'"
                size="xs"
                class="q-mr-xs"
              />
              Total Weight: {{ totalWeight }}%
              <span v-if="totalWeight !== 100" class="q-ml-xs text-12">Must equal 100%</span>
            </q-chip>
          </div>
        </div>

        <div class="row q-col-gutter-xs">
          <!-- STATIC REQUIRED SECTIONS -->
          <template v-for="section in staticSections" :key="section.key">
            <div class="col">
              <q-card flat bordered class="criteria-card">
                <q-card-section class="criteria-header bg-green-1 q-py-xs">
                  <div class="row items-center justify-between">
                    <div class="col">
                      <div class="text-subtitle2 text-weight-medium text-12">
                        <q-icon :name="section.icon" size="xs" class="q-mr-xs" />
                        {{ section.label }}
                        <q-badge
                          color="green-6"
                          text-color="white"
                          class="q-ml-xs"
                          style="font-size: 9px; padding: 1px 5px"
                        >
                          Required
                        </q-badge>
                      </div>
                    </div>
                    <div class="col-auto">
                      <div class="percentage-wrapper">
                        <q-input
                          v-model.number="editableCriteria[section.key].weight"
                          type="number"
                          min="0"
                          max="100"
                          dense
                          outlined
                          class="weight-input text-12"
                          @update:model-value="validatePercentage(section.key)"
                          :readonly="mode === 'view' || !hasPermission"
                        >
                          <template v-slot:append>
                            <span class="percentage-sign">%</span>
                          </template>
                        </q-input>
                      </div>
                    </div>
                  </div>
                </q-card-section>
                <q-card-section class="q-pa-xs">
                  <div class="q-mb-xs text-weight-medium text-12 text-bold">
                    <span class="text-grey-9">Breakdown Descriptions:</span>
                  </div>

                  <!-- View mode -->
                  <template v-if="mode === 'view' || !hasPermission">
                    <div
                      v-if="editableCriteria[section.key].breakdownFields.length === 0"
                      class="text-center q-pa-sm text-grey-6 text-11"
                    >
                      No breakdown descriptions added
                    </div>
                    <div v-else class="q-mt-xs">
                      <div
                        v-for="(field, idx) in editableCriteria[section.key].breakdownFields"
                        :key="`${section.key}-view-breakdown-${idx}`"
                        class="breakdown-row q-mb-xs"
                      >
                        <div class="row items-start q-gutter-xs">
                          <div class="col">
                            <q-input
                              :model-value="field.description"
                              :label="`Description ${idx + 1}`"
                              dense
                              outlined
                              autogrow
                              class="modern-input text-12"
                              readonly
                              bg-color="grey-1"
                            />
                          </div>
                          <div style="width: 80px">
                            <q-input
                              :model-value="field.weight"
                              type="number"
                              dense
                              outlined
                              class="weight-input text-12"
                              readonly
                              bg-color="grey-1"
                            >
                              <template v-slot:append>
                                <span class="percentage-sign">%</span>
                              </template>
                            </q-input>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- Edit/Create mode -->
                  <template v-else>
                    <div
                      v-if="editableCriteria[section.key].breakdownFields.length === 0"
                      class="text-center q-pa-sm text-grey-6 text-11"
                    >
                      No breakdown descriptions yet. Click "Add Breakdown" to start.
                    </div>
                    <div v-else class="q-mt-xs">
                      <div
                        v-for="(field, idx) in editableCriteria[section.key].breakdownFields"
                        :key="`${section.key}-edit-breakdown-${idx}`"
                        class="breakdown-row q-mb-xs"
                      >
                        <div class="row items-start q-gutter-xs">
                          <div class="col">
                            <q-input
                              v-model="
                                editableCriteria[section.key].breakdownFields[idx].description
                              "
                              :label="`Description ${idx + 1}`"
                              dense
                              outlined
                              autogrow
                              class="modern-input text-12"
                            />
                          </div>
                          <div style="width: 80px">
                            <q-input
                              v-model.number="
                                editableCriteria[section.key].breakdownFields[idx].weight
                              "
                              type="number"
                              min="0"
                              max="100"
                              dense
                              outlined
                              class="weight-input text-12"
                              @update:model-value="validateBreakdownWeight(section.key, idx)"
                            >
                              <template v-slot:append>
                                <span class="percentage-sign">%</span>
                              </template>
                            </q-input>
                          </div>
                          <div style="width: 36px">
                            <q-btn
                              icon="remove"
                              color="negative"
                              flat
                              round
                              size="xs"
                              class="remove-btn"
                              @click="removeBreakdownField(section.key, idx)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row justify-center q-mt-sm">
                      <q-btn
                        color="primary"
                        icon="add"
                        flat
                        size="sm"
                        class="q-mb-xs q-mt-xs text-12"
                        @click="addBreakdownField(section.key)"
                      >
                        Add Breakdown
                      </q-btn>
                    </div>
                  </template>
                </q-card-section>
              </q-card>
            </div>
          </template>

          <!-- OPTIONAL: BEI Section -->
          <template v-if="optionalSections.bei">
            <div class="col">
              <q-card flat bordered class="criteria-card optional-card optional-card--bei">
                <q-card-section class="criteria-header bg-blue-1 q-py-xs">
                  <div class="row items-center justify-between">
                    <div class="col">
                      <div class="text-subtitle2 text-weight-medium text-12">
                        <q-icon name="record_voice_over" size="xs" class="q-mr-xs" />
                        BEI
                        <q-badge
                          color="blue-6"
                          text-color="white"
                          class="q-ml-xs"
                          style="font-size: 9px; padding: 1px 5px"
                        >
                          Optional
                        </q-badge>
                      </div>
                    </div>
                    <div class="col-auto row items-center q-gutter-xs">
                      <div class="percentage-wrapper">
                        <q-input
                          v-model.number="editableCriteria.bei.weight"
                          type="number"
                          min="0"
                          max="100"
                          dense
                          outlined
                          class="weight-input text-12"
                          @update:model-value="validatePercentage('bei')"
                          :readonly="mode === 'view' || !hasPermission"
                        >
                          <template v-slot:append>
                            <span class="percentage-sign">%</span>
                          </template>
                        </q-input>
                      </div>
                      <q-btn
                        v-if="(mode === 'edit' || mode === 'create') && hasPermission"
                        icon="close"
                        color="negative"
                        flat
                        round
                        dense
                        size="xs"
                        @click="toggleOptionalSection('bei')"
                      >
                        <q-tooltip>Remove BEI section</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </q-card-section>
                <q-card-section class="q-pa-xs">
                  <div class="q-mb-xs text-weight-medium text-12 text-bold">
                    <span class="text-grey-9">Breakdown Descriptions:</span>
                  </div>

                  <!-- View mode -->
                  <template v-if="mode === 'view' || !hasPermission">
                    <div
                      v-if="editableCriteria.bei.breakdownFields.length === 0"
                      class="text-center q-pa-sm text-grey-6 text-11"
                    >
                      No breakdown descriptions added
                    </div>
                    <div v-else class="q-mt-xs">
                      <div
                        v-for="(field, idx) in editableCriteria.bei.breakdownFields"
                        :key="`bei-view-breakdown-${idx}`"
                        class="breakdown-row q-mb-xs"
                      >
                        <div class="row items-start q-gutter-xs">
                          <div class="col">
                            <q-input
                              :model-value="field.description"
                              :label="`Description ${idx + 1}`"
                              dense
                              outlined
                              autogrow
                              class="modern-input text-12"
                              readonly
                              bg-color="grey-1"
                            />
                          </div>
                          <div style="width: 80px">
                            <q-input
                              :model-value="field.weight"
                              type="number"
                              dense
                              outlined
                              class="weight-input text-12"
                              readonly
                              bg-color="grey-1"
                            >
                              <template v-slot:append>
                                <span class="percentage-sign">%</span>
                              </template>
                            </q-input>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- Edit/Create mode -->
                  <template v-else>
                    <div
                      v-if="editableCriteria.bei.breakdownFields.length === 0"
                      class="text-center q-pa-sm text-grey-6 text-11"
                    >
                      No breakdown descriptions yet. Click "Add Breakdown" to start.
                    </div>
                    <div v-else class="q-mt-xs">
                      <div
                        v-for="(field, idx) in editableCriteria.bei.breakdownFields"
                        :key="`bei-edit-breakdown-${idx}`"
                        class="breakdown-row q-mb-xs"
                      >
                        <div class="row items-start q-gutter-xs">
                          <div class="col">
                            <q-input
                              v-model="editableCriteria.bei.breakdownFields[idx].description"
                              :label="`Description ${idx + 1}`"
                              dense
                              outlined
                              autogrow
                              class="modern-input text-12"
                            />
                          </div>
                          <div style="width: 80px">
                            <q-input
                              v-model.number="editableCriteria.bei.breakdownFields[idx].weight"
                              type="number"
                              min="0"
                              max="100"
                              dense
                              outlined
                              class="weight-input text-12"
                              @update:model-value="validateBreakdownWeight('bei', idx)"
                            >
                              <template v-slot:append>
                                <span class="percentage-sign">%</span>
                              </template>
                            </q-input>
                          </div>
                          <div style="width: 36px">
                            <q-btn
                              icon="remove"
                              color="negative"
                              flat
                              round
                              size="xs"
                              class="remove-btn"
                              @click="removeBreakdownField('bei', idx)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row justify-center q-mt-sm">
                      <q-btn
                        color="primary"
                        icon="add"
                        flat
                        size="sm"
                        class="q-mb-xs q-mt-xs text-12"
                        @click="addBreakdownField('bei')"
                      >
                        Add Breakdown
                      </q-btn>
                    </div>
                  </template>
                </q-card-section>
              </q-card>
            </div>
          </template>

          <!-- OPTIONAL: Exam Section -->
          <template v-if="optionalSections.exam">
            <div class="col">
              <q-card flat bordered class="criteria-card optional-card optional-card--exam">
                <q-card-section class="criteria-header bg-deep-purple-1 q-py-xs">
                  <div class="row items-center justify-between">
                    <div class="col">
                      <div class="text-subtitle2 text-weight-medium text-12">
                        <q-icon name="assignment" size="xs" class="q-mr-xs" />
                        Exam
                        <q-badge
                          color="deep-purple-6"
                          text-color="white"
                          class="q-ml-xs"
                          style="font-size: 9px; padding: 1px 5px"
                        >
                          Optional
                        </q-badge>
                      </div>
                    </div>
                    <div class="col-auto row items-center q-gutter-xs">
                      <div class="percentage-wrapper">
                        <q-input
                          v-model.number="editableCriteria.exam.weight"
                          type="number"
                          min="0"
                          max="100"
                          dense
                          outlined
                          class="weight-input text-12"
                          @update:model-value="validatePercentage('exam')"
                          :readonly="mode === 'view' || !hasPermission"
                        >
                          <template v-slot:append>
                            <span class="percentage-sign">%</span>
                          </template>
                        </q-input>
                      </div>
                      <q-btn
                        v-if="(mode === 'edit' || mode === 'create') && hasPermission"
                        icon="close"
                        color="negative"
                        flat
                        round
                        dense
                        size="xs"
                        @click="toggleOptionalSection('exam')"
                      >
                        <q-tooltip>Remove Exam section</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </q-card-section>
                <q-card-section class="q-pa-xs">
                  <div class="q-mb-xs text-weight-medium text-12 text-bold">
                    <span class="text-grey-9">Breakdown Descriptions:</span>
                  </div>

                  <!-- View mode -->
                  <template v-if="mode === 'view' || !hasPermission">
                    <div
                      v-if="editableCriteria.exam.breakdownFields.length === 0"
                      class="text-center q-pa-sm text-grey-6 text-11"
                    >
                      No breakdown descriptions added
                    </div>
                    <div v-else class="q-mt-xs">
                      <div
                        v-for="(field, idx) in editableCriteria.exam.breakdownFields"
                        :key="`exam-view-breakdown-${idx}`"
                        class="breakdown-row q-mb-xs"
                      >
                        <div class="row items-start q-gutter-xs">
                          <div class="col">
                            <q-input
                              :model-value="field.description"
                              :label="`Description ${idx + 1}`"
                              dense
                              outlined
                              autogrow
                              class="modern-input text-12"
                              readonly
                              bg-color="grey-1"
                            />
                          </div>
                          <div style="width: 80px">
                            <q-input
                              :model-value="field.weight"
                              type="number"
                              dense
                              outlined
                              class="weight-input text-12"
                              readonly
                              bg-color="grey-1"
                            >
                              <template v-slot:append>
                                <span class="percentage-sign">%</span>
                              </template>
                            </q-input>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- Edit/Create mode -->
                  <template v-else>
                    <div
                      v-if="editableCriteria.exam.breakdownFields.length === 0"
                      class="text-center q-pa-sm text-grey-6 text-11"
                    >
                      No breakdown descriptions yet. Click "Add Breakdown" to start.
                    </div>
                    <div v-else class="q-mt-xs">
                      <div
                        v-for="(field, idx) in editableCriteria.exam.breakdownFields"
                        :key="`exam-edit-breakdown-${idx}`"
                        class="breakdown-row q-mb-xs"
                      >
                        <div class="row items-start q-gutter-xs">
                          <div class="col">
                            <q-input
                              v-model="editableCriteria.exam.breakdownFields[idx].description"
                              :label="`Description ${idx + 1}`"
                              dense
                              outlined
                              autogrow
                              class="modern-input text-12"
                            />
                          </div>
                          <div style="width: 80px">
                            <q-input
                              v-model.number="editableCriteria.exam.breakdownFields[idx].weight"
                              type="number"
                              min="0"
                              max="100"
                              dense
                              outlined
                              class="weight-input text-12"
                              @update:model-value="validateBreakdownWeight('exam', idx)"
                            >
                              <template v-slot:append>
                                <span class="percentage-sign">%</span>
                              </template>
                            </q-input>
                          </div>
                          <div style="width: 36px">
                            <q-btn
                              icon="remove"
                              color="negative"
                              flat
                              round
                              size="xs"
                              class="remove-btn"
                              @click="removeBreakdownField('exam', idx)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row justify-center q-mt-sm">
                      <q-btn
                        color="deep-purple"
                        icon="add"
                        flat
                        size="sm"
                        class="q-mb-xs q-mt-xs text-12"
                        @click="addBreakdownField('exam')"
                      >
                        Add Breakdown
                      </q-btn>
                    </div>
                  </template>
                </q-card-section>
              </q-card>
            </div>
          </template>
        </div>

        <!-- Restore bar for removed optional sections -->
        <div
          v-if="
            (mode === 'edit' || mode === 'create') && hasPermission && removedSections.length > 0
          "
          class="q-mt-sm q-pa-xs bg-grey-2 rounded-borders restore-bar"
        >
          <div class="row items-center q-gutter-xs">
            <q-icon name="undo" size="xs" color="grey-7" />
            <span class="text-caption text-grey-7">Removed sections:</span>
            <q-btn
              v-for="key in removedSections"
              :key="'restore-' + key"
              size="xs"
              dense
              unelevated
              :color="key === 'bei' ? 'blue-2' : 'deep-purple-2'"
              :text-color="key === 'bei' ? 'blue-9' : 'deep-purple-9'"
              :icon="key === 'bei' ? 'record_voice_over' : 'assignment'"
              :label="key === 'bei' ? 'Restore BEI' : 'Restore Exam'"
              @click="restoreSection(key)"
              class="text-12"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section
        v-if="!showCriteriaForm && !loading"
        class="text-center q-pa-md bg-blue-1 rounded-borders empty-state-card"
      >
        <q-icon name="tune" size="2rem" color="primary" class="q-mb-xs" />
        <div class="text-h6 q-mb-xs text-12">No available data</div>
        <div class="text-caption">Please ensure criteria data is loaded properly</div>
      </q-card-section>
    </q-card>

    <!-- Confirm Save Dialog -->
    <q-dialog v-model="confirmDialog" persistent class="modern-dialog">
      <q-card style="width: 450px" class="no-shadow">
        <q-card-section class="bg-primary text-white q-pb-sm">
          <div class="text-subtitle1 q-mb-xs">
            <q-icon name="save" size="sm" class="q-mr-xs" />
            Confirm Save
          </div>
          <div class="text-caption">Review your changes before saving</div>
        </q-card-section>
        <q-card-section class="q-pt-md q-pb-sm">
          <div class="text-body2 q-mb-sm text-12">
            Are you sure you want to save the rating criteria for:
          </div>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-icon name="star" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption class="text-12">Salary Grade Range</q-item-label>
                <q-item-label class="text-12">
                  SG {{ salaryGradeData.sg_min }} - {{ salaryGradeData.sg_max }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-sm" />
          <div class="text-caption text-weight-medium q-mb-xs">Criteria Breakdown:</div>
          <div class="summary-container">
            <!-- Static sections summary -->
            <div
              v-for="section in staticSections"
              :key="'summary-' + section.key"
              class="text-caption q-mb-sm"
            >
              <div class="text-weight-bold">
                {{ section.label }}: {{ editableCriteria[section.key].weight }}%
              </div>
              <div
                v-if="editableCriteria[section.key].breakdownFields.length > 0"
                class="q-ml-md text-grey-7"
                style="max-height: 120px; overflow-y: auto"
              >
                <div
                  v-for="(field, idx) in editableCriteria[section.key].breakdownFields"
                  :key="'summary-field-' + idx"
                  class="q-mb-xs"
                >
                  <div class="row items-start q-gutter-xs no-wrap">
                    <div class="col-auto" style="min-width: 35px">
                      <q-badge color="primary" :label="`${field.weight}%`" />
                    </div>
                    <div class="col text-grey-8" style="font-size: 11px; line-height: 1.3">
                      {{ field.description || `Description ${idx + 1}` }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="q-ml-md text-grey-5 text-italic">(No breakdown descriptions)</div>
            </div>

            <!-- BEI summary -->
            <div v-if="optionalSections.bei" class="text-caption q-mb-sm">
              <div class="text-weight-bold text-blue-8">
                BEI: {{ editableCriteria.bei.weight }}%
                <q-badge
                  color="blue-2"
                  text-color="blue-9"
                  label="Optional"
                  style="font-size: 9px"
                  class="q-ml-xs"
                />
              </div>
              <div
                v-if="editableCriteria.bei.breakdownFields.length > 0"
                class="q-ml-md text-grey-7"
                style="max-height: 120px; overflow-y: auto"
              >
                <div
                  v-for="(field, idx) in editableCriteria.bei.breakdownFields"
                  :key="'summary-bei-' + idx"
                  class="q-mb-xs"
                >
                  <div class="row items-start q-gutter-xs no-wrap">
                    <div class="col-auto" style="min-width: 35px">
                      <q-badge color="blue" :label="`${field.weight}%`" />
                    </div>
                    <div class="col text-grey-8" style="font-size: 11px; line-height: 1.3">
                      {{ field.description || `Description ${idx + 1}` }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="q-ml-md text-grey-5 text-italic">(No breakdown descriptions)</div>
            </div>

            <!-- Exam summary -->
            <div v-if="optionalSections.exam" class="text-caption q-mb-sm">
              <div class="text-weight-bold text-deep-purple-8">
                Exam: {{ editableCriteria.exam.weight }}%
                <q-badge
                  color="deep-purple-2"
                  text-color="deep-purple-9"
                  label="Optional"
                  style="font-size: 9px"
                  class="q-ml-xs"
                />
              </div>
              <div
                v-if="editableCriteria.exam.breakdownFields.length > 0"
                class="q-ml-md text-grey-7"
                style="max-height: 120px; overflow-y: auto"
              >
                <div
                  v-for="(field, idx) in editableCriteria.exam.breakdownFields"
                  :key="'summary-exam-' + idx"
                  class="q-mb-xs"
                >
                  <div class="row items-start q-gutter-xs no-wrap">
                    <div class="col-auto" style="min-width: 35px">
                      <q-badge color="deep-purple" :label="`${field.weight}%`" />
                    </div>
                    <div class="col text-grey-8" style="font-size: 11px; line-height: 1.3">
                      {{ field.description || `Description ${idx + 1}` }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="q-ml-md text-grey-5 text-italic">(No breakdown descriptions)</div>
            </div>

            <!-- Not included note -->
            <div
              v-if="!optionalSections.bei || !optionalSections.exam"
              class="text-caption text-grey-5 text-italic q-mt-xs"
            >
              <q-icon name="info" size="xs" class="q-mr-xs" />
              Not included:
              <span v-if="!optionalSections.bei">BEI</span>
              <span v-if="!optionalSections.bei && !optionalSections.exam">,</span>
              <span v-if="!optionalSections.exam">Exam</span>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-sm">
          <q-btn flat dense label="Cancel" color="dark" v-close-popup class="q-mr-sm text-12" />
          <q-btn
            unelevated
            dense
            label="Save"
            color="primary"
            @click="saveRatings"
            v-close-popup
            class="text-12"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, watch, nextTick } from 'vue';
  import { useQuasar } from 'quasar';
  import { useCriteriaStore } from 'stores/criteriaStore';

  function logAudit(action, description, status = 'SUCCESS', details = {}) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action,
      description,
      module: 'Criteria_SG_Management',
      status,
      details: JSON.stringify(details),
    };
    console.log('[AUDIT LOG]', auditLog);
  }

  const props = defineProps({
    modelValue: { type: Boolean, required: true },
    criteriaId: { type: [String, Number], default: null },
    sgMin: { type: [String, Number], default: null },
    sgMax: { type: [String, Number], default: null },
    mode: { type: String, default: 'create' },
    hasPermission: { type: Boolean, default: false },
  });

  const emit = defineEmits(['update:modelValue', 'saved', 'switch-to-edit']);

  const $q = useQuasar();
  const criteriaStore = useCriteriaStore();

  // ============================================================================
  // STATE
  // ============================================================================

  const show = ref(props.modelValue);
  const confirmDialog = ref(false);
  const showCriteriaForm = ref(false);
  const loading = ref(false);
  const salaryGradeData = ref({ sg_min: '', sg_max: '' });
  const existingCriteria = ref(null);
  const isDataFetched = ref(false);

  // Track which optional sections are active
  const optionalSections = ref({
    bei: true, // BEI ON by default
    exam: false, // Exam OFF by default
  });

  // Track removed sections so user can restore them
  const removedSections = ref([]);

  // Static required sections (always shown)
  const staticSections = [
    { key: 'education', label: 'Education', icon: 'school' },
    { key: 'experience', label: 'Experience', icon: 'work_history' },
    { key: 'training', label: 'Training', icon: 'card_membership' },
    { key: 'performance', label: 'Performance', icon: 'leaderboard' },
  ];

  const baseCriteria = {
    education: { weight: 20, title: '', breakdownFields: [] },
    experience: { weight: 20, title: '', breakdownFields: [] },
    training: { weight: 15, title: '', breakdownFields: [] },
    performance: { weight: 15, title: '', breakdownFields: [] },
    bei: { weight: 15, title: '', breakdownFields: [] },
    exam: { weight: 15, title: '', breakdownFields: [] },
  };

  const editableCriteria = ref(JSON.parse(JSON.stringify(baseCriteria)));

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const canModify = computed(() => props.hasPermission === true);

  const totalWeight = computed(() => {
    if (!editableCriteria.value) return 0;
    let total =
      (editableCriteria.value.education.weight || 0) +
      (editableCriteria.value.experience.weight || 0) +
      (editableCriteria.value.training.weight || 0) +
      (editableCriteria.value.performance.weight || 0);

    if (optionalSections.value.bei) total += editableCriteria.value.bei.weight || 0;
    if (optionalSections.value.exam) total += editableCriteria.value.exam.weight || 0;
    return total;
  });

  const isFormValid = computed(() => {
    return (
      totalWeight.value === 100 &&
      salaryGradeData.value.sg_min &&
      salaryGradeData.value.sg_max &&
      parseInt(salaryGradeData.value.sg_max) >= parseInt(salaryGradeData.value.sg_min)
    );
  });

  // ============================================================================
  // OPTIONAL SECTION MANAGEMENT
  // ============================================================================

  function toggleOptionalSection(key) {
    if (optionalSections.value[key]) {
      optionalSections.value[key] = false;
      if (!removedSections.value.includes(key)) {
        removedSections.value.push(key);
      }
      logAudit('SECTION_REMOVED', `Removed optional section: ${key}`, 'SUCCESS', { key });
      $q.notify({
        type: 'info',
        message: `${key.toUpperCase()} section removed. You can restore it below.`,
        position: 'top',
        timeout: 2500,
        actions: [{ label: 'Restore', color: 'white', handler: () => restoreSection(key) }],
      });
    } else {
      restoreSection(key);
    }
  }

  function restoreSection(key) {
    optionalSections.value[key] = true;
    removedSections.value = removedSections.value.filter((k) => k !== key);
    logAudit('SECTION_RESTORED', `Restored optional section: ${key}`, 'SUCCESS', { key });
    $q.notify({
      type: 'positive',
      message: `${key.toUpperCase()} section restored.`,
      position: 'top',
      timeout: 2000,
    });
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  function validateBreakdownWeight(sectionKey, fieldIndex) {
    const field = editableCriteria.value[sectionKey].breakdownFields[fieldIndex];
    if (field.weight < 0) field.weight = 0;
    else if (field.weight > 100) field.weight = 100;
  }

  function validatePercentage(field) {
    const value = editableCriteria.value[field].weight;
    if (value < 0) editableCriteria.value[field].weight = 0;
    else if (value > 100) editableCriteria.value[field].weight = 100;
  }

  // ============================================================================
  // WATCHERS
  // ============================================================================

  watch(
    () => props.modelValue,
    (val) => {
      show.value = val;
      if (val && !isDataFetched.value) {
        initializeModal();
      }
    },
  );

  watch(show, (val) => {
    emit('update:modelValue', val);
    if (!val) {
      isDataFetched.value = false;
      resetForm();
      logAudit('MODAL_CLOSED', `Closed ${props.mode} criteria SG modal`);
    }
  });

  watch(
    () => [props.criteriaId, props.sgMin, props.sgMax],
    () => {
      if (show.value && !isDataFetched.value) {
        initializeModal();
      }
    },
    { immediate: true },
  );

  // ============================================================================
  // METHODS
  // ============================================================================

  async function initializeModal() {
    isDataFetched.value = true;
    loading.value = true;
    showCriteriaForm.value = false;

    try {
      logAudit('MODAL_OPENED', `Opening ${props.mode} criteria SG modal`, 'SUCCESS', {
        criteriaId: props.criteriaId,
        mode: props.mode,
      });

      if (props.mode === 'create') {
        salaryGradeData.value = {
          sg_min: props.sgMin || '',
          sg_max: props.sgMax || '',
        };
        editableCriteria.value = JSON.parse(JSON.stringify(baseCriteria));
        // Default: BEI on, Exam off
        optionalSections.value = { bei: true, exam: false };
        removedSections.value = ['exam'];
        showCriteriaForm.value = true;
      } else if (props.mode === 'view' || props.mode === 'edit') {
        if (!props.criteriaId) {
          throw new Error('Criteria ID is required for view/edit mode');
        }

        const response = await criteriaStore.fetchCriteriaSGDetail(props.criteriaId);
        existingCriteria.value = response;

        salaryGradeData.value = {
          sg_min: response.sg_min,
          sg_max: response.sg_max,
        };

        editableCriteria.value = convertApiCriteriaToModalFormat(response);

        // Detect which optional sections are present in saved data
        const hasBei = response.behavioral?.length > 0 || response.bei?.length > 0;
        const hasExam = response.exam?.length > 0 || response.Exam?.length > 0;

        optionalSections.value = { bei: !!hasBei, exam: !!hasExam };
        removedSections.value = [];
        if (!hasBei) removedSections.value.push('bei');
        if (!hasExam) removedSections.value.push('exam');

        logAudit('EXISTING_CRITERIA_LOADED', 'Loaded existing SG criteria', 'SUCCESS', {
          criteriaId: props.criteriaId,
        });

        showCriteriaForm.value = true;
      }
    } catch (error) {
      console.error('Error initializing modal:', error);
      logAudit('INIT_ERROR', 'Failed to initialize modal', 'FAILED', {
        criteriaId: props.criteriaId,
        error: error.message,
      });
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to load criteria information',
      });
      showCriteriaForm.value = false;
      isDataFetched.value = false;
    } finally {
      loading.value = false;
    }
  }

  function resetForm() {
    salaryGradeData.value = { sg_min: '', sg_max: '' };
    editableCriteria.value = JSON.parse(JSON.stringify(baseCriteria));
    existingCriteria.value = null;
    optionalSections.value = { bei: true, exam: false };
    removedSections.value = ['exam'];
  }

  function getModalTitle() {
    switch (props.mode) {
      case 'view':
        return 'View';
      case 'edit':
        return 'Edit';
      case 'create':
      default:
        return 'Create';
    }
  }

  function convertApiCriteriaToModalFormat(apiCriteria) {
    const result = JSON.parse(JSON.stringify(baseCriteria));
    const criteriaKeys = ['education', 'experience', 'training', 'performance'];

    criteriaKeys.forEach((key) => {
      const criteriaSection = apiCriteria[key];
      if (criteriaSection && Array.isArray(criteriaSection) && criteriaSection.length > 0) {
        const firstItem = criteriaSection[0];
        result[key].weight = parseInt(firstItem.weight || 0);
        result[key].breakdownFields = criteriaSection.map((item) => ({
          id: item.id,
          criteria_library_id: item.criteria_library_id,
          description: item.description || '',
          weight: parseInt(item.percentage || item.weight || 0),
        }));
      }
    });

    // BEI
    const beiSection = apiCriteria.behavioral || apiCriteria.bei;
    if (beiSection && Array.isArray(beiSection) && beiSection.length > 0) {
      result.bei.weight = parseInt(beiSection[0].weight || 0);
      result.bei.breakdownFields = beiSection.map((item) => ({
        id: item.id,
        criteria_library_id: item.criteria_library_id,
        description: item.description || '',
        weight: parseInt(item.percentage || item.weight || 0),
      }));
    }

    // Exam
    const examSection = apiCriteria.exam || apiCriteria.Exam;
    if (examSection && Array.isArray(examSection) && examSection.length > 0) {
      result.exam.weight = parseInt(examSection[0].weight || 0);
      result.exam.breakdownFields = examSection.map((item) => ({
        id: item.id,
        criteria_library_id: item.criteria_library_id,
        description: item.description || '',
        weight: parseInt(item.percentage || item.weight || 0),
      }));
    }

    return result;
  }

  function convertModalFormatToApiPayload(modalCriteria) {
    const payload = {
      sg_min: String(salaryGradeData.value.sg_min),
      sg_max: String(salaryGradeData.value.sg_max),
      education: [],
      experience: [],
      training: [],
      performance: [],
      behavioral: [],
      exam: [],
    };

    const convertSection = (sectionKey, apiKey) => {
      const section = modalCriteria[sectionKey];
      if (section.breakdownFields && section.breakdownFields.length > 0) {
        payload[apiKey] = section.breakdownFields.map((field) => ({
          weight: String(section.weight),
          description: field.description,
          percentage: String(field.weight),
        }));
      } else {
        payload[apiKey] = [
          {
            weight: String(section.weight),
            description: section.title || '',
            percentage: String(section.weight),
          },
        ];
      }
    };

    convertSection('education', 'education');
    convertSection('experience', 'experience');
    convertSection('training', 'training');
    convertSection('performance', 'performance');

    if (optionalSections.value.bei) convertSection('bei', 'behavioral');
    if (optionalSections.value.exam) convertSection('exam', 'exam');

    return payload;
  }

  function addBreakdownField(section) {
    editableCriteria.value[section].breakdownFields.push({ description: '', weight: 0 });
    logAudit('BREAKDOWN_ADDED', `Added new breakdown field to ${section}`, 'SUCCESS', {
      criteriaId: props.criteriaId,
      section,
    });
  }

  function removeBreakdownField(section, idx) {
    const removedWeight = editableCriteria.value[section].breakdownFields[idx].weight;
    editableCriteria.value[section].breakdownFields.splice(idx, 1);
    logAudit('BREAKDOWN_REMOVED', `Removed breakdown field ${idx + 1} from ${section}`, 'SUCCESS', {
      criteriaId: props.criteriaId,
      section,
      removedWeight,
    });
  }

  function closeModal() {
    show.value = false;
  }

  function switchToEditMode() {
    if (!canModify.value) {
      $q.notify({ type: 'warning', message: 'You do not have permission to edit criteria' });
      return;
    }
    logAudit('SWITCH_TO_EDIT', 'Switching from view to edit mode', 'SUCCESS', {
      criteriaId: props.criteriaId,
    });
    closeModal();
    nextTick(() => {
      emit('switch-to-edit');
    });
  }

  function confirmSave() {
    if (!canModify.value) {
      $q.notify({ type: 'warning', message: 'You do not have permission to save criteria' });
      return;
    }
    if (!isFormValid.value) {
      $q.notify({
        type: 'warning',
        message: 'Please ensure all fields are valid and total weight equals 100%',
      });
      return;
    }
    confirmDialog.value = true;
  }

  async function saveRatings() {
    if (!canModify.value || !isFormValid.value) return;

    try {
      logAudit('SAVE_START', 'Starting to save SG criteria', 'INFO', {
        criteriaId: props.criteriaId,
        mode: props.mode,
        includedBei: optionalSections.value.bei,
        includedExam: optionalSections.value.exam,
      });

      const payload = convertModalFormatToApiPayload(editableCriteria.value);
      console.log('Modal: Payload before sending:', JSON.stringify(payload, null, 2));

      let response;
      if (props.mode === 'edit') {
        response = await criteriaStore.updateCriteriaSG(props.criteriaId, payload);
      } else {
        response = await criteriaStore.saveCriteriaSG(payload);
      }

      logAudit('SAVE_SUCCESS', 'Successfully saved SG criteria', 'SUCCESS', {
        criteriaId: props.criteriaId,
        responseId: response?.id,
      });

      $q.notify({
        type: 'positive',
        message: 'Salary Grade Criteria saved successfully!',
        position: 'top',
      });
      emit('saved', response);
      closeModal();
    } catch (error) {
      console.error('Modal: Error saving SG criteria:', error);
      logAudit('SAVE_ERROR', 'Failed to save SG criteria', 'FAILED', {
        criteriaId: props.criteriaId,
        error: error.message,
      });
      $q.notify({
        type: 'negative',
        message: error.message || 'Failed to save salary grade criteria',
        position: 'top',
      });
    }
  }
</script>

<style scoped>
  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .text-12 {
    font-size: 12px !important;
    line-height: 1.4;
  }
  .text-10 {
    font-size: 10px !important;
    line-height: 1.2;
  }
  .text-11 {
    font-size: 11px !important;
    line-height: 1.3;
  }

  .empty-state-card {
    border: 1px dashed rgba(0, 0, 0, 0.08);
    background-color: #f8fbff !important;
    border-radius: 4px;
  }

  .criteria-header {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .criteria-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
  }

  .optional-card--bei {
    border-top: 2px solid #1976d2 !important;
  }
  .optional-card--exam {
    border-top: 2px solid #673ab7 !important;
  }

  .modern-select,
  .modern-input {
    border-radius: 3px;
  }

  .modern-select .q-field__control,
  .modern-input .q-field__control {
    height: 28px;
    min-height: 28px;
  }

  .percentage-wrapper {
    width: 80px;
  }

  .weight-input {
    width: 100%;
    border-radius: 3px;
  }
  .weight-input .q-field__control {
    height: 22px;
    min-height: 22px;
    padding: 0 2px 0 8px;
  }
  .weight-input .q-field__native {
    padding-right: 0;
    text-align: right;
  }

  .percentage-sign {
    font-size: 10px;
    padding: 0 5px 0 2px;
    color: rgba(0, 0, 0, 0.7);
  }

  .float-right {
    float: right;
  }

  .criteria-section {
    animation: fadeIn 0.3s ease;
  }

  .remove-btn {
    min-width: 32px;
    height: 32px;
  }

  .breakdown-row {
    position: relative;
  }

  .summary-container {
    max-height: 300px;
    overflow-y: auto;
  }

  .optional-chip {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .optional-chip:hover {
    opacity: 0.85;
  }

  .restore-bar {
    border: 1px dashed rgba(0, 0, 0, 0.12);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1200px) {
    .col {
      min-width: 100%;
      margin-bottom: 8px;
    }
  }

  @media (min-width: 1200px) {
    .col {
      padding: 0 2px;
    }
  }

  .q-gutter-xs > .col {
    padding: 2px;
  }
  .q-mb-xs {
    margin-bottom: 4px;
  }
  .q-mt-xs {
    margin-top: 4px;
  }
  .q-mt-sm {
    margin-top: 8px;
  }

  .modern-input :deep(.q-field__control) {
    min-height: 28px;
  }
  .modern-input :deep(.q-field__native) {
    min-height: 20px;
  }
</style>
