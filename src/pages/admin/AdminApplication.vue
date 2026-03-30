<template>
  <q-page class="admin-application-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <q-btn
            icon="arrow_back"
            round
            class="back-btn bg-black text-white"
            :to="{ name: 'Admin JobPost' }"
            :size="buttonSize"
          />
          <div class="header-text q-ml-sm">
            <div class="page-title text-bold">Manual Application</div>
            <div class="breadcrumb text-grey gt-xs">Job Posts / Manual Application</div>
          </div>
        </div>
        <div class="header-right">
          <q-chip v-if="!jobPostStore.loading" class="posted-chip text-white bg-teal" size="md">
            <q-icon name="admin_panel_settings" size="xs" class="q-mr-xs gt-xs" />
            <span class="chip-text">Admin Submission</span>
          </q-chip>
          <q-chip v-else class="posted-chip text-white bg-teal" size="md">
            <q-linear-progress rounded color="white" query style="width: 80px" />
          </q-chip>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Job Info Card -->
      <q-card v-if="!jobPostStore.loading" class="job-details-card q-mb-lg" flat bordered>
        <q-card-section>
          <div class="job-header">
            <q-avatar color="teal" text-color="white" size="75px">
              {{ selectedJob?.Position ? selectedJob.Position.charAt(0) : 'N' }}
            </q-avatar>
            <div class="job-info q-ml-md">
              <div class="job-position text-teal text-weight-bold">
                {{ selectedJob?.Position || 'No Position' }}
              </div>
              <div class="job-details-list">
                <div class="job-detail-item" v-if="selectedJob?.Office">
                  <q-icon name="business" size="xs" class="q-mr-xs" />
                  <span>{{ selectedJob.Office }}</span>
                </div>
                <div
                  class="job-detail-item"
                  v-if="selectedJob?.Division && selectedJob.Division !== 'N/A'"
                >
                  <q-icon name="corporate_fare" size="xs" class="q-mr-xs" />
                  <span>{{ selectedJob.Division }}</span>
                </div>
                <div
                  class="job-detail-item"
                  v-if="selectedJob?.Section && selectedJob.Section !== 'N/A'"
                >
                  <q-icon name="account_tree" size="xs" class="q-mr-xs" />
                  <span>{{ selectedJob.Section }}</span>
                </div>
                <div class="job-detail-item" v-if="selectedJob?.Unit && selectedJob.Unit !== 'N/A'">
                  <q-icon name="groups" size="xs" class="q-mr-xs" />
                  <span>{{ selectedJob.Unit }}</span>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Qualification Standards -->
        <q-card-section class="qualifications-section">
          <div class="section-main-title text-teal text-bold">
            Qualification Standards/Requirements
          </div>
          <div class="qualifications-grid q-mt-md">
            <q-card flat bordered class="qualification-card">
              <q-card-section>
                <q-badge color="primary" class="q-mb-sm">Education</q-badge>
                <div class="qualification-text">{{ selectedCriteria?.Education || 'None' }}</div>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="qualification-card">
              <q-card-section>
                <q-badge color="secondary" class="q-mb-sm">Training</q-badge>
                <div class="qualification-text">{{ selectedCriteria?.Training || 'None' }}</div>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="qualification-card">
              <q-card-section>
                <q-badge color="accent" class="q-mb-sm">Experience</q-badge>
                <div class="qualification-text">{{ selectedCriteria?.Experience || 'None' }}</div>
              </q-card-section>
            </q-card>
            <q-card flat bordered class="qualification-card">
              <q-card-section>
                <q-badge color="positive" class="q-mb-sm">Eligibility</q-badge>
                <div class="qualification-text">{{ selectedCriteria?.Eligibility || 'None' }}</div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading skeleton -->
      <q-card v-else flat bordered class="job-details-card q-mb-lg">
        <q-card-section>
          <q-skeleton type="text" />
          <q-skeleton type="rect" height="200px" />
        </q-card-section>
      </q-card>

      <!-- Admin Notice Banner -->
      <q-banner class="admin-notice q-mb-lg" rounded inline-actions>
        <template v-slot:avatar>
          <q-icon name="admin_panel_settings" color="teal" size="sm" />
        </template>
        <div class="text-weight-medium text-teal">Admin Manual Submission</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          You are submitting this application on behalf of an applicant. No email verification is
          required. The application will be recorded as a manual admin submission.
        </div>
      </q-banner>

      <!-- Upload Steps Card -->
      <q-card class="upload-card" flat bordered>
        <q-card-section class="application-process-section bg-grey-1">
          <div class="process-main-title text-center text-weight-bold q-mb-lg">
            Upload Application Files
          </div>

          <div class="process-steps">
            <!-- Step 1: Download Form -->
            <div class="process-step-wrapper">
              <div class="process-card bg-white">
                <div class="card-content">
                  <div class="step-number bg-green-1 text-green">1</div>
                  <div class="step-icon bg-green-1">
                    <q-icon name="file_download" size="36px" color="green" />
                  </div>
                  <div class="step-title text-green">Download Application Form</div>
                  <div class="step-description">
                    Get the application template to fill with applicant details
                  </div>
                  <q-btn
                    label="DOWNLOAD TEMPLATE"
                    color="green"
                    class="action-btn full-width q-mt-md"
                    outline
                    @click="downloadExcelForm"
                  />
                </div>
              </div>
            </div>

            <!-- Step 2: Upload Completed Form -->
            <div class="process-step-wrapper">
              <div class="process-card bg-white">
                <div class="card-content">
                  <div class="step-number bg-blue-1 text-blue">2</div>
                  <div class="step-icon bg-blue-1">
                    <q-icon name="upload_file" size="36px" color="blue" />
                  </div>
                  <div class="step-title text-blue">Upload Completed Form</div>
                  <div class="step-description">
                    Upload the filled application form (XLSX format only)
                  </div>
                  <div class="file-input full-width q-mt-md">
                    <q-file
                      v-model="uploadedFile"
                      accept=".xlsx,.xls"
                      outlined
                      dense
                      class="full-width"
                      standout
                      bottom-slots
                      hide-bottom-space
                      :rules="[
                        (val) => !!val || 'Please select a file',
                        (val) =>
                          val?.name?.endsWith('.xlsx') ||
                          val?.name?.endsWith('.xls') ||
                          'Only Excel files allowed',
                      ]"
                    >
                      <template v-slot:prepend>
                        <q-icon name="attach_file" color="blue" />
                      </template>
                      <template v-slot:hint>
                        <div class="text-grey-7 text-center text-caption q-mt-xs">
                          Select the completed application form
                        </div>
                      </template>
                    </q-file>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Upload Supporting Documents -->
            <div class="process-step-wrapper">
              <div class="process-card bg-white">
                <div class="card-content">
                  <div class="card-header">
                    <div class="step-number bg-orange-1 text-orange">3</div>
                    <q-btn
                      icon="info_outline"
                      flat
                      round
                      dense
                      size="sm"
                      color="orange"
                      class="info-btn"
                      @click="showZipInstructions = true"
                    >
                      <q-tooltip class="bg-orange">Click for detailed instructions</q-tooltip>
                    </q-btn>
                  </div>
                  <div class="step-icon bg-orange-1">
                    <q-icon name="folder_zip" size="36px" color="orange" />
                  </div>
                  <div class="step-title text-orange">Upload Supporting Documents</div>
                  <div class="step-description">Upload supporting documents (ZIP format only)</div>
                  <div class="file-input full-width q-mt-md">
                    <q-file
                      ref="zipFileInputRef"
                      v-model="uploadedZipFile"
                      accept=".zip"
                      outlined
                      dense
                      class="full-width"
                      standout
                      bottom-slots
                      hide-bottom-space
                      :rules="[
                        (val) => !!val || 'Please select a ZIP file',
                        (val) => val?.name?.endsWith('.zip') || 'Only ZIP files allowed',
                      ]"
                    >
                      <template v-slot:prepend>
                        <q-icon name="attach_file" color="orange" />
                      </template>
                      <template v-slot:hint>
                        <div class="text-grey-7 text-center text-caption q-mt-xs">
                          Select the supporting documents ZIP file
                        </div>
                      </template>
                    </q-file>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: Submit -->
            <div class="process-step-wrapper">
              <div class="process-card bg-white">
                <div class="card-content">
                  <div class="step-number bg-teal-1 text-teal">4</div>
                  <div class="step-icon bg-teal-1">
                    <q-icon name="send" size="36px" color="teal" />
                  </div>
                  <div class="step-title text-teal">Submit Application</div>
                  <div class="step-description">
                    Review the uploaded files and submit the manual application
                  </div>
                  <q-btn
                    label="SUBMIT APPLICATION"
                    color="teal"
                    class="action-btn full-width q-mt-md"
                    :disable="!uploadedFile || !uploadedZipFile"
                    @click="submitApplication"
                  >
                    <q-icon name="check_circle" class="q-ml-sm" />
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card class="confirmation-dialog">
        <div class="header-teal">
          <div class="icon-container">
            <q-icon name="admin_panel_settings" size="28px" color="teal" />
          </div>
        </div>

        <div class="dialog-title">
          <div class="dialog-main-title text-teal text-center text-weight-bold">
            Confirm Manual Submission
          </div>
          <div class="dialog-subtitle text-center text-grey q-mt-sm">
            Please verify the submission details before proceeding
          </div>
        </div>

        <q-separator />

        <div class="dialog-content">
          <!-- Admin Notice in dialog -->
          <div class="row items-center q-mb-md q-pa-sm bg-teal-1 rounded-borders">
            <q-icon name="info" size="16px" class="text-teal" />
            <div class="q-ml-sm text-caption text-teal-9">
              This is an admin manual submission — no email verification required
            </div>
          </div>

          <div class="row items-center q-mb-md flex-wrap">
            <q-icon name="work" size="16px" class="text-teal" />
            <div class="q-ml-sm">Position:</div>
            <div class="text-teal text-weight-bold q-ml-sm position-text">
              {{ selectedJob?.Position || 'N/A' }}
            </div>
          </div>

          <div class="row items-start q-mb-md">
            <q-icon name="description" size="16px" class="text-teal q-mt-xs" />
            <div class="q-ml-sm q-mt-xs">Application Form:</div>
          </div>

          <div class="file-card q-mb-md">
            <div class="row no-wrap">
              <q-icon name="description" size="18px" class="text-blue q-mt-xs" />
              <div class="file-details">
                <div class="file-name">{{ uploadedFile?.name }}</div>
                <div class="file-size">{{ formatFileSize(uploadedFile?.size || 0) }}</div>
              </div>
            </div>
          </div>

          <div class="row items-start">
            <q-icon name="folder_zip" size="16px" class="text-teal q-mt-xs" />
            <div class="q-ml-sm q-mt-xs">Supporting Documents:</div>
          </div>

          <div class="file-card">
            <div class="row no-wrap">
              <q-icon name="folder_zip" size="18px" class="text-orange q-mt-xs" />
              <div class="file-details">
                <div class="file-name">{{ uploadedZipFile?.name }}</div>
                <div class="file-size">{{ formatFileSize(uploadedZipFile?.size || 0) }}</div>
              </div>
            </div>
          </div>

          <div class="text-center text-grey-7 q-mt-lg confirmation-note">
            By clicking Submit, you confirm that all documents are accurate and complete.
          </div>
        </div>

        <div class="dialog-actions">
          <q-btn flat label="CANCEL" color="grey-7" v-close-popup class="q-px-md" />
          <q-btn
            unelevated
            label="SUBMIT APPLICATION"
            color="teal"
            @click="processSubmission"
            class="q-px-md"
            :loading="uploadStore.isSubmitting"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Loading Overlay -->
    <q-dialog v-model="uploadStore.isSubmitting" persistent>
      <q-card class="loading-overlay flex flex-center">
        <q-spinner size="50px" color="teal" />
        <div class="text-center q-mt-md loading-text">Uploading application...</div>
      </q-card>
    </q-dialog>

    <!-- Success Dialog -->
    <q-dialog v-model="successDialog" persistent>
      <q-card class="confirmation-dialog">
        <div class="header-teal">
          <div class="icon-container">
            <q-icon name="check_circle" size="28px" color="teal" />
          </div>
        </div>

        <div class="dialog-title">
          <div class="dialog-main-title text-teal text-center text-weight-bold">
            Application Submitted!
          </div>
          <div class="dialog-subtitle text-center text-grey q-mt-sm">
            Manual application has been successfully recorded
          </div>
        </div>

        <q-separator />

        <div class="dialog-content text-center">
          <q-icon name="admin_panel_settings" size="48px" color="teal" class="q-mb-md" />
          <div class="q-mb-md success-message">
            The manual application for
            <span class="text-teal text-weight-bold">
              {{ selectedJob?.Position || 'N/A' }}
            </span>
            has been successfully submitted.
          </div>
          <div class="q-my-md success-message text-grey-7">
            The applicant's documents have been recorded in the system.
          </div>
          <div class="text-grey-7 q-mt-lg reference-number">
            Reference #: MAN-{{ generateReferenceNumber() }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Submitted at: {{ getCurrentDateTime() }}
          </div>
        </div>

        <div class="dialog-actions">
          <q-btn
            flat
            label="SUBMIT ANOTHER"
            color="teal"
            @click="resetAndContinue"
            class="q-px-md"
          />
          <q-btn unelevated label="BACK TO JOB LIST" color="teal" @click="goBack" class="q-px-md" />
        </div>
      </q-card>
    </q-dialog>

    <!-- ZIP Instructions Dialog -->
    <q-dialog v-model="showZipInstructions">
      <q-card style="min-width: 360px; max-width: 95vw; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-orange text-weight-bold">ZIP File Instructions</div>
          <q-space />
          <q-btn icon="close" round flat dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <p class="text-body2 text-grey-8 q-mb-md">
            Please compress all supporting documents into a single ZIP file before uploading.
          </p>
          <div class="text-caption text-grey-7">
            <div class="q-mb-xs"><b>Recommended documents to include:</b></div>
            <ul class="q-pl-md q-mt-xs">
              <li>Birth Certificate (PSA)</li>
              <li>Transcript of Records / Diploma</li>
              <li>Training Certificates</li>
              <li>Civil Service Eligibility / PRC License</li>
              <li>Work Experience Records</li>
              <li>Valid Government-issued ID</li>
            </ul>
          </div>
          <div class="q-mt-md q-pa-sm bg-orange-1 rounded-borders text-caption text-orange-9">
            <q-icon name="warning" size="xs" class="q-mr-xs" />
            All files inside the ZIP must be in PDF format. Maximum ZIP size is 50MB.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn unelevated label="Got it" color="orange" v-close-popup class="q-px-md" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { useJobPostStore } from 'stores/jobPostStore';
  import { useUser_upload } from 'stores/user_upload';
  import { toast } from 'src/boot/toast';

  const $q = useQuasar();
  const route = useRoute();
  const router = useRouter();

  const uploadStore = useUser_upload();
  const jobPostStore = useJobPostStore();

  const id = route.params.id;

  // ==================== UI STATE ====================
  const confirmDialog = ref(false);
  const successDialog = ref(false);
  const showZipInstructions = ref(false);

  // ==================== JOB DATA STATE ====================
  const selectedJob = ref(null);
  const selectedCriteria = ref(null);

  // ==================== COMPUTED: bind to store ====================
  const uploadedFile = computed({
    get: () => uploadStore.uploadedFile,
    set: (val) => (uploadStore.uploadedFile = val),
  });

  const uploadedZipFile = computed({
    get: () => uploadStore.uploadedZipFile,
    set: (val) => (uploadStore.uploadedZipFile = val),
  });

  // ==================== HELPER FUNCTIONS ====================

  function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getCurrentDateTime() {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function generateReferenceNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${timestamp}-${random}`;
  }

  function downloadExcelForm() {
    const a = document.createElement('a');
    a.href = '/pds.xlsx';
    const position = selectedJob.value?.Position || 'Job';
    a.download = `${position.replace(/\s+/g, '_')}_Application_Form.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ==================== JOB DATA LOADING ====================

  const loadJobDetails = async () => {
    jobPostStore.loading = true;
    try {
      const jobDetails = await jobPostStore.fetchJobDetails(id);
      const data = jobDetails || jobPostStore.jobPosts;

      if (!data) throw new Error('No job details returned');

      selectedJob.value = {
        id: data.id || null,
        Position: data.Position || 'Unknown Position',
        status: data.status || 'Unknown',
        Office: data.Office || 'Unknown Office',
        Division: data.Division || 'N/A',
        Section: data.Section || 'N/A',
        Unit: data.Unit || 'N/A',
        post_date: data.post_date || null,
        PositionID: data.PositionID || '',
        ...data,
      };

      if (data.criteria && typeof data.criteria === 'object') {
        selectedCriteria.value = {
          Education: data.criteria.Education || 'Not specified',
          Experience: data.criteria.Experience || 'Not specified',
          Training: data.criteria.Training || 'Not specified',
          Eligibility: data.criteria.Eligibility || 'Not specified',
        };
      } else {
        selectedCriteria.value = {
          Education: 'No criteria available',
          Experience: 'No criteria available',
          Training: 'No criteria available',
          Eligibility: 'No criteria available',
        };
      }

      uploadStore.setSelectedJob(selectedJob.value);
    } catch (error) {
      console.error('Error loading job details:', error);
      let msg = 'Failed to load job details';
      if (error.response?.status === 404) msg = 'Job not found';
      else if (error.response?.status === 403) msg = 'Access denied';
      toast.error(msg);
      router.back();
    } finally {
      jobPostStore.loading = false;
    }
  };

  // ==================== SUBMISSION FUNCTIONS ====================

  function submitApplication() {
    if (!uploadStore.uploadedFile || !uploadStore.uploadedZipFile) {
      $q.notify({
        type: 'negative',
        message: 'Please attach both Excel and ZIP files before submitting.',
        position: 'top',
      });
      return;
    }
    confirmDialog.value = true;
  }

  async function processSubmission() {
    confirmDialog.value = false;

    try {
      const response = await uploadStore.processManualSubmission();
      const data = response?.data ?? response;

      if (data?.success === true || response?.status === 200 || response?.status === 201) {
        successDialog.value = true;
      } else {
        $q.notify({
          type: 'negative',
          message: data?.message || 'Failed to submit application',
          position: 'top',
        });
      }
    } catch (err) {
      console.error('Manual submission error:', err);
      let errorMessage = 'Network error. Please try again.';
      if (err.response?.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      $q.notify({
        type: 'negative',
        message: errorMessage,
        position: 'top',
      });
    }
  }

  function resetAndContinue() {
    uploadStore.reset();
    successDialog.value = false;
  }

  function goBack() {
    uploadStore.reset();
    successDialog.value = false;
    router.back();
  }

  // ==================== LIFECYCLE ====================

  onMounted(async () => {
    if (!id) {
      toast.error('No job ID provided');
      router.back();
      return;
    }
    await loadJobDetails();
  });
</script>

<style scoped>
  /* ==================== BASE LAYOUT ==================== */
  .admin-application-page {
    padding: 0;
    background: #f5f5f5;
  }

  .page-header {
    background: white;
    padding: 16px 24px;
    border-bottom: 1px solid #eee;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .back-btn {
    flex-shrink: 0;
  }

  .header-text {
    min-width: 0;
    flex: 1;
  }

  .page-title {
    font-size: 1.5rem;
    margin: 0;
    line-height: 1.2;
  }

  .breadcrumb {
    font-size: 0.875rem;
    margin-top: 4px;
    color: #888;
  }

  .header-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .posted-chip {
    white-space: nowrap;
  }

  .chip-text {
    font-size: 0.875rem;
  }

  .content-wrapper {
    max-width: 1200px;
    margin: 24px auto;
    padding: 0 24px;
  }

  /* ==================== JOB HEADER ==================== */
  .job-details-card {
    border-radius: 12px;
    overflow: hidden;
  }

  .job-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .job-info {
    flex: 1;
    min-width: 0;
  }

  .job-position {
    font-size: 1.5rem;
    margin-bottom: 12px;
    word-wrap: break-word;
  }

  .job-details-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .job-detail-item {
    display: flex;
    align-items: center;
    color: #666;
    font-size: 0.95rem;
  }

  /* ==================== QUALIFICATIONS ==================== */
  .qualifications-section {
    padding: 24px;
  }

  .section-main-title {
    font-size: 1.5rem;
    margin-bottom: 24px;
  }

  .qualifications-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .qualification-card {
    border-radius: 8px;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .qualification-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .qualification-text {
    margin-top: 8px;
    font-size: 0.95rem;
    color: #444;
  }

  /* ==================== ADMIN NOTICE ==================== */
  .admin-notice {
    background: #e0f2f1;
    border: 1px solid #80cbc4;
  }

  /* ==================== UPLOAD CARD ==================== */
  .upload-card {
    border-radius: 12px;
    overflow: hidden;
  }

  .application-process-section {
    padding: 32px 24px;
  }

  .process-main-title {
    font-size: 1.75rem;
  }

  .process-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
  }

  .process-step-wrapper {
    min-width: 0;
  }

  .process-card {
    position: relative;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition:
      transform 0.3s,
      box-shadow 0.3s;
    overflow: hidden;
    height: 100%;
  }

  .process-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 12px;
  }

  .info-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
  }

  .card-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    height: 100%;
  }

  .step-number {
    font-size: 18px;
    font-weight: 600;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  .step-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .step-title {
    font-size: 1.1rem;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .step-description {
    color: #666;
    margin-bottom: 20px;
    font-size: 0.9rem;
  }

  .file-input {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 12px;
    transition: border-color 0.3s;
    cursor: pointer;
  }

  .file-input:hover {
    border-color: #009688;
  }

  .action-btn {
    border-radius: 8px;
    font-weight: 600;
    padding: 12px 24px;
    transition: all 0.3s;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* ==================== DIALOGS ==================== */
  .confirmation-dialog {
    border-radius: 12px;
    overflow: hidden;
    width: 460px;
    max-width: 95vw;
  }

  .header-teal {
    background-color: #009688;
    height: 100px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon-container {
    width: 56px;
    height: 56px;
    background-color: white;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: -28px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .dialog-title {
    margin-top: 36px;
    padding: 0 24px 16px 24px;
  }

  .dialog-main-title {
    font-size: 1.5rem;
  }

  .dialog-subtitle {
    font-size: 0.95rem;
  }

  .dialog-content {
    padding: 24px;
  }

  .file-card {
    margin-top: 8px;
    margin-left: 8px;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 12px;
    width: 100%;
    max-width: 390px;
    border: 1px solid #e0e0e0;
  }

  .file-details {
    margin-left: 12px;
    width: calc(100% - 36px);
    overflow: hidden;
  }

  .file-name {
    font-weight: 500;
    word-break: break-all;
    white-space: normal;
    color: #1976d2;
    font-size: 0.9rem;
  }

  .file-size {
    color: #757575;
    font-size: 0.85rem;
    margin-top: 4px;
  }

  .dialog-actions {
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  .position-text {
    font-size: 0.95rem;
    word-break: break-word;
  }

  .confirmation-note,
  .success-message {
    font-size: 0.95rem;
  }

  .reference-number {
    font-size: 0.85rem;
  }

  .loading-overlay {
    min-width: 200px;
    padding: 48px;
    flex-direction: column;
  }

  .loading-text {
    font-size: 1.1rem;
  }

  .rounded-borders {
    border-radius: 8px;
  }

  .bg-teal-1 {
    background-color: #e0f2f1;
  }

  .bg-orange-1 {
    background-color: #fff3e0;
  }

  /* ==================== MOBILE ==================== */
  @media (max-width: 599px) {
    .page-header {
      padding: 12px 16px;
    }

    .header-content {
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-title {
      font-size: 1.1rem;
    }

    .content-wrapper {
      padding: 0 16px;
      margin: 16px auto;
    }

    .job-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .job-info {
      width: 100%;
    }

    .job-position {
      font-size: 1.15rem;
    }

    .job-details-list {
      align-items: center;
    }

    .qualifications-section {
      padding: 16px;
    }

    .qualifications-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .application-process-section {
      padding: 20px 16px;
    }

    .process-steps {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .card-content {
      padding: 20px;
    }

    .dialog-actions {
      padding: 12px 16px;
      flex-direction: column;
    }

    .dialog-actions .q-btn {
      width: 100%;
    }

    .file-card {
      max-width: 100%;
      margin-left: 0;
    }
  }

  /* ==================== LARGE DESKTOP ==================== */
  @media (min-width: 1440px) {
    .page-header {
      padding: 20px 48px;
    }

    .content-wrapper {
      max-width: 1400px;
      padding: 0 48px;
    }

    .page-title {
      font-size: 1.75rem;
    }

    .job-position {
      font-size: 1.75rem;
    }

    .process-main-title {
      font-size: 2rem;
    }
  }
</style>
