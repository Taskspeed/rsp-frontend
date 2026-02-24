<template>
  <q-card class="modal-card">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Qualified Applicants Report</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>
    <q-separator />
    <div class="q-pa-md" style="flex: 1; min-height: 0; display: flex; flex-direction: column">
      <div
        v-if="isLoading"
        class="column items-center justify-center text-grey q-gutter-sm"
        style="height: 100%"
      >
        <q-spinner color="primary" size="32px" />
        <div>Loading report...</div>
      </div>
      <div
        v-if="!pdfUrl && !isLoading"
        class="column items-center justify-center text-grey q-gutter-sm"
        style="height: 100%"
      >
        <q-spinner color="primary" size="32px" />
        <div>Generating PDF preview...</div>
      </div>
      <!-- PDF Viewer -->
      <iframe
        v-if="pdfUrl"
        :src="pdfUrl"
        style="width: 100%; height: 100%; border: none"
        type="application/pdf"
      ></iframe>
    </div>
  </q-card>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useSummaryReportStore } from 'stores/summaryReportStore';
  import { useQuasar } from 'quasar';

  const props = defineProps({
    publicationDate: {
      type: String,
      required: true,
    },
  });

  const summaryReportStore = useSummaryReportStore();
  const $q = useQuasar();

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const reportData = ref(null);

  // Helper function to convert image to base64
  async function getImageBase64(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  }

  // Fetch report data
  async function fetchReportData() {
    try {
      isLoading.value = true;
      const response = await summaryReportStore.fetchQualifiedReport(props.publicationDate);
      reportData.value = response;
      console.log('Report data:', response);
    } catch (error) {
      console.error('Error fetching qualified report:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to load qualified applicants report',
      });
    } finally {
      isLoading.value = false;
    }
  }

  // Helper function to format date range
  function formatDateRange(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const fromStr = from.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const toStr = to.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return `${fromStr} - ${toStr}`;
  }

  // Helper function to calculate experience percentage - LIST ALL EXPERIENCE
  function calculateExperiencePercentage(applicant, requiredExperience) {
    // Build experience list
    let experienceList = '';
    if (applicant.experience && applicant.experience.length > 0) {
      experienceList = applicant.experience
        .map((exp) => {
          const dateRange = formatDateRange(exp.work_date_from, exp.work_date_to);
          const position = exp.position_title || 'N/A';
          const department = exp.department || '';
          return `• ${position}${department ? ' at ' + department : ''} (${dateRange})`;
        })
        .join('\n');
    }

    // If no experience required or empty, just return total experience
    if (
      !requiredExperience ||
      requiredExperience === 'None required' ||
      requiredExperience === '' ||
      requiredExperience.toLowerCase().includes('none')
    ) {
      if (!applicant.experience || applicant.experience.length === 0) {
        return { display: 'No experience', totalYears: 0, totalMonths: 0 };
      }

      let totalYears = 0;
      let totalMonths = 0;

      applicant.experience.forEach((exp) => {
        const from = new Date(exp.work_date_from);
        const to = new Date(exp.work_date_to);
        const diffTime = Math.abs(to - from);
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

        totalYears += Math.floor(diffMonths / 12);
        totalMonths += Math.floor(diffMonths % 12);
      });

      // Adjust months overflow
      totalYears += Math.floor(totalMonths / 12);
      totalMonths = totalMonths % 12;

      return {
        display: `*${totalYears} year(s) and ${totalMonths} month(s)\n${experienceList}`,
        totalYears,
        totalMonths,
      };
    }

    // Calculate total experience
    let totalYears = 0;
    let totalMonths = 0;

    if (applicant.experience && applicant.experience.length > 0) {
      applicant.experience.forEach((exp) => {
        const from = new Date(exp.work_date_from);
        const to = new Date(exp.work_date_to);
        const diffTime = Math.abs(to - from);
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

        totalYears += Math.floor(diffMonths / 12);
        totalMonths += Math.floor(diffMonths % 12);
      });

      // Adjust months overflow
      totalYears += Math.floor(totalMonths / 12);
      totalMonths = totalMonths % 12;
    }

    // Extract required years from string (e.g., "3 years" -> 3)
    const requiredYearsMatch = requiredExperience.match(/(\d+)\s*year/i);
    if (!requiredYearsMatch) {
      // Can't parse required experience, just return total
      if (totalYears === 0 && totalMonths === 0) {
        return { display: 'No experience', totalYears: 0, totalMonths: 0 };
      }
      return {
        display: `*${totalYears} year(s) and ${totalMonths} month(s)\n${experienceList}`,
        totalYears,
        totalMonths,
      };
    }

    const requiredYears = parseInt(requiredYearsMatch[1]);

    // If no experience at all
    if (totalYears === 0 && totalMonths === 0) {
      return { display: 'Not enough experience', totalYears: 0, totalMonths: 0 };
    }

    const percentage = totalYears / requiredYears;

    let percentageRange = '';

    if (percentage >= 5) {
      percentageRange = '500% and above';
    } else if (percentage >= 4) {
      percentageRange = '400%-499%';
    } else if (percentage >= 3) {
      percentageRange = '300%-399%';
    } else if (percentage >= 2) {
      percentageRange = '200%-299%';
    } else if (percentage >= 1) {
      percentageRange = '100%-199%';
    } else {
      return {
        display: `Not enough experience\n${experienceList}`,
        totalYears,
        totalMonths,
        percentage,
        isInsufficient: true,
      };
    }

    return {
      display: `${percentageRange}\n${totalYears} year(s) and ${totalMonths} month(s)\n${experienceList}`,
      totalYears,
      totalMonths,
      percentage,
      percentageRange,
      isInsufficient: false,
    };
  }

  // Helper function to format education with units - DISPLAY ALL EDUCATION
  function formatEducation(applicant) {
    let educationText = 'N/A';

    if (applicant.education && applicant.education.length > 0) {
      // Display ALL education entries
      educationText = applicant.education
        .map((edu) => {
          const degree = edu.degree || edu.course || edu.level;
          const units = edu.highest_units || '';
          return degree ? `${degree}${units ? ' (' + units + ')' : ''}` : '';
        })
        .filter((e) => e)
        .join('\n'); // Use newline to separate each education entry
    } else if (
      applicant.education_text &&
      applicant.education_text !==
        'No relevant education based on the specific requirement of the position.'
    ) {
      educationText = applicant.education_text;
    }

    return educationText;
  }

  // Helper function to format training with new logic - LIST ALL TRAININGS
  function formatTraining(applicant, requiredTraining) {
    // Calculate total training hours
    let totalHours = 0;
    if (applicant.training && applicant.training.length > 0) {
      totalHours = applicant.training.reduce(
        (sum, t) => sum + (parseInt(t.number_of_hours) || 0),
        0,
      );
    }

    // Check if no training is required
    const noTrainingRequired =
      !requiredTraining ||
      requiredTraining.toUpperCase() === 'NONE REQUIRED' ||
      requiredTraining === '';

    if (noTrainingRequired) {
      if (totalHours === 0) {
        return 'No training';
      }

      // List all trainings with hours
      const trainingList = applicant.training
        .map((t) => `• ${t.training_title} (${t.number_of_hours} hours)`)
        .join('\n');

      return `${totalHours} hours total trainings\n${trainingList}`;
    }

    // Extract required hours from the training requirement
    const requiredHoursMatch = requiredTraining.match(/(\d+)\s*hour/i);

    if (!requiredHoursMatch) {
      // Can't parse required hours, just show total
      if (totalHours === 0) {
        return 'No training';
      }

      // List all trainings with hours
      const trainingList = applicant.training
        .map((t) => `• ${t.training_title} (${t.number_of_hours} hours)`)
        .join('\n');

      return `${totalHours} hour(s)\n${trainingList}`;
    }

    const requiredHours = parseInt(requiredHoursMatch[1]);

    if (totalHours === 0) {
      return 'No training';
    }

    // Build the training list
    const trainingList = applicant.training
      .map((t) => `• ${t.training_title} (${t.number_of_hours} hours)`)
      .join('\n');

    if (requiredHours < totalHours) {
      return `More than the minimum number of hours (${totalHours})\n${trainingList}`;
    } else {
      return `Within the minimum number of hours\n${trainingList}`;
    }
  }

  // Generate table rows from report data
  function generateTableRows() {
    if (!reportData.value || !reportData.value.jobPosts) {
      return [];
    }

    const rows = [];

    reportData.value.jobPosts.forEach((jobPost) => {
      // Position header row (gray background)
      rows.push([
        {
          text: jobPost.ItemNo || '',
          style: 'positionRow',
          fillColor: '#d9d9d9',
        },
        {
          text: jobPost.Position || '',
          style: 'positionRow',
          fillColor: '#d9d9d9',
        },
        {
          text: jobPost.criteria?.Education || '',
          style: 'positionRow',
          fillColor: '#d9d9d9',
        },
        {
          text: jobPost.criteria?.Experience || '',
          style: 'positionRow',
          fillColor: '#d9d9d9',
        },
        {
          text: jobPost.criteria?.Training || '',
          style: 'positionRow',
          fillColor: '#d9d9d9',
        },
        {
          text: jobPost.criteria?.Eligibility || '',
          style: 'positionRow',
          fillColor: '#d9d9d9',
        },
      ]);

      // Applicant rows
      if (jobPost.applicants && jobPost.applicants.length > 0) {
        // Remove duplicates based on firstname + lastname
        const uniqueApplicants = jobPost.applicants.filter(
          (applicant, index, self) =>
            index ===
            self.findIndex(
              (a) => a.firstname === applicant.firstname && a.lastname === applicant.lastname,
            ),
        );

        uniqueApplicants.forEach((applicant) => {
          // Applicant name
          const applicantName = `${applicant.firstname || ''} ${applicant.lastname || ''}`.trim();
          const statusLabel =
            applicant.applicant_status === 'OUTSIDER' ? '(Outsider)' : '(Employee)';

          // Education - using new format function (ALL EDUCATION)
          const educationText = formatEducation(applicant);

          // Experience with percentage calculation (WITH LIST)
          const experienceResult = calculateExperiencePercentage(
            applicant,
            jobPost.criteria?.Experience,
          );
          const experienceText = experienceResult.display;

          // Training - using new format function (WITH LIST)
          const trainingText = formatTraining(applicant, jobPost.criteria?.Training);

          // Eligibility
          let eligibilityText = 'None';
          if (applicant.eligibility && applicant.eligibility.length > 0) {
            eligibilityText = applicant.eligibility
              .map((e) => e.eligibility || e.title)
              .filter((e) => e)
              .join(', ');
          } else if (
            applicant.eligibility_text &&
            applicant.eligibility_text !==
              'No relevant eligibility based on the specific requirement of the position.'
          ) {
            eligibilityText = applicant.eligibility_text;
          }

          rows.push([
            {
              text: '',
              style: 'applicantRow',
            },
            {
              text: `${applicantName} ${statusLabel}`,
              style: 'applicantRow',
            },
            {
              text: educationText,
              style: 'applicantRow',
              fontSize: 8,
            },
            {
              text: experienceText,
              style: 'applicantRow',
              fontSize: 8,
              color: experienceResult.isInsufficient ? 'red' : 'black',
            },
            {
              text: trainingText,
              style: 'applicantRow',
              fontSize: 8,
            },
            {
              text: eligibilityText,
              style: 'applicantRow',
              fontSize: 8,
            },
          ]);
        });
      } else {
        // No applicants
        rows.push([
          {},
          { text: 'No qualified applicants', colSpan: 5, alignment: 'left', italics: true },
          {},
          {},
          {},
          {},
        ]);
      }
    });

    return rows;
  }

  async function generatePdfContent() {
    if (!reportData.value) {
      console.error('No report data available');
      return;
    }

    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }

    // Load logo image
    const logoBase64 = await getImageBase64('/logo.png');

    import('pdfmake/build/pdfmake').then((pdfMakeModule) => {
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      import('pdfmake/build/vfs_fonts').then((vfsFontsModule) => {
        pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

        const tableRows = generateTableRows();

        const docDefinition = {
          pageSize: 'LEGAL',
          pageOrientation: 'landscape',
          pageMargins: [72, 120, 72, 40],
          header: function () {
            return {
              stack: [
                // Green banner
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: (1008 - 936) / 2,
                      y: 60,
                      w: 936,
                      h: 25,
                      color: '#008000',
                    },
                  ],
                },

                {
                  margin: [72, -65, 72, 0],
                  columns: [
                    {
                      width: 65,
                      stack: [
                        {
                          canvas: [
                            {
                              type: 'rect',
                              x: 0,
                              y: 0,
                              w: 75,
                              h: 80,
                              color: '#ffffff',
                            },
                          ],
                        },

                        ...(logoBase64
                          ? [
                              {
                                image: logoBase64,
                                width: 65,
                                height: 65,
                                absolutePosition: { x: 77, y: 22 },
                              },
                            ]
                          : []),
                      ],
                    },
                    {
                      width: '*',
                      margin: [15, -15, 0, 0],
                      stack: [
                        {
                          text: 'REPUBLIC OF THE PHILIPPINES',
                          fontSize: 8,
                          color: '#00703c',
                          alignment: 'left',
                          margin: [0, 20, 0, 2],
                        },
                        {
                          text: 'PROVINCE OF DAVAO DEL NORTE',
                          fontSize: 8,
                          color: '#00703c',
                          alignment: 'left',
                          margin: [0, 0, 0, 2],
                        },
                        {
                          text: 'CITY OF TAGUM',
                          fontSize: 10,
                          bold: true,
                          color: '#00703c',
                          alignment: 'left',
                        },
                        {
                          text: 'CITY HUMAN RESOURCE MANAGEMENT OFFICE',
                          fontSize: 13,
                          bold: true,
                          color: 'white',
                          margin: [0, 5, 0, 0],
                        },
                      ],
                    },
                  ],
                },
              ],
            };
          },
          content: [
            // Title
            {
              text: reportData.value.Header || "APPLICANT'S QUALIFICATION STANDARDS",
              fontSize: 14,
              bold: true,
              alignment: 'center',
              margin: [0, -20, 0, 0],
            },
            {
              text: reportData.value.Date || `${props.publicationDate} PUBLICATION`,
              fontSize: 14,
              bold: true,
              alignment: 'center',
              margin: [0, 0, 0, 30],
            },

            // Table
            {
              table: {
                headerRows: 2,
                widths: [60, '*', 120, 100, 100, 120],
                body: [
                  // Header row 1
                  [
                    { text: 'Plantilla Code', style: 'tableHeader', rowSpan: 2 },
                    {
                      text: "Position Title with Applicant's Name",
                      style: 'tableHeader',
                      rowSpan: 2,
                    },
                    { text: 'Qualification Standards', style: 'tableHeader', colSpan: 4 },
                    {},
                    {},
                    {},
                  ],
                  // Header row 2
                  [
                    {},
                    {},
                    { text: 'Education', style: 'tableHeader' },
                    { text: 'Experience', style: 'tableHeader' },
                    { text: 'Training', style: 'tableHeader' },
                    { text: 'Eligibility', style: 'tableHeader' },
                  ],

                  // Data rows
                  ...tableRows,
                ],
              },
              layout: {
                hLineWidth: function () {
                  return 1;
                },
                vLineWidth: function () {
                  return 1;
                },
                hLineColor: function () {
                  return '#000000';
                },
                vLineColor: function () {
                  return '#000000';
                },
                paddingLeft: function () {
                  return 4;
                },
                paddingRight: function () {
                  return 4;
                },
                paddingTop: function () {
                  return 2;
                },
                paddingBottom: function () {
                  return 2;
                },
                fillColor: function (rowIndex) {
                  if (rowIndex === 0 || rowIndex === 1) {
                    return '#ffc000';
                  }
                  return null;
                },
              },
            },
          ],
          styles: {
            tableHeader: {
              fontSize: 10,
              bold: true,
              alignment: 'center',
            },
            positionRow: {
              fontSize: 9,
              bold: true,
              alignment: 'left',
            },
            applicantRow: {
              fontSize: 9,
              alignment: 'left',
            },
          },
          defaultStyle: {
            fontSize: 10,
          },
        };

        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBlob((blob) => {
          pdfUrl.value = URL.createObjectURL(blob);
        });
      });
    });
  }

  onUnmounted(() => {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  });

  onMounted(async () => {
    await fetchReportData();
    if (reportData.value) {
      await generatePdfContent();
    }
  });
</script>

<style scoped>
  .modal-card {
    width: 100%;
    max-width: 90vw;
    height: 90vh;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  }
</style>
