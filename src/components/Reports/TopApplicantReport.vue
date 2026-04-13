<template>
  <q-card class="modal-card">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Top 5 Ranking Applicants Report</div>
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
  import { ref, watch, onMounted, onUnmounted } from 'vue';
  import { useSummaryReportStore } from 'stores/summaryReportStore';

  const props = defineProps({
    publicationDate: {
      type: String,
      required: true,
    },
  });

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const summaryReportStore = useSummaryReportStore();
  const reportData = ref(null);

  // Watch for changes in publication date and regenerate report
  watch(
    () => props.publicationDate,
    async (newVal, oldVal) => {
      if (newVal && newVal !== oldVal) {
        await fetchReportData();
        await generatePdfContent();
      }
    },
  );

  async function fetchReportData() {
    if (isLoading.value) return;

    isLoading.value = true;

    try {
      const data = await summaryReportStore.fetchTopApplicantReport(props.publicationDate);
      reportData.value = data;
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      isLoading.value = false;
    }
  }

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

  // Generate signatory footer
  function generateSignatoryFooter() {
    return [
      // Add space before signatories with page break handling
      { text: '', margin: [0, 30, 0, 0], pageBreak: 'before' },

      // Row 1: Top center signatory
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              {
                text: 'ELBERT JOHN S.  OAVILA',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 150,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'Records Officer III Representative, Person with Disability (PWD)',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
          { width: '*', text: '' },
        ],
        margin: [0, 0, 0, 15],
        unbreakable: true,
      },

      // Row 2: Two signatories (left and right)
      {
        columns: [
          // Left column
          {
            width: '*',
            stack: [
              {
                text: 'ALAN B. IPANAG',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 120,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'Laboratory Inspector III Representative, First Level Positions',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
          // Right column
          {
            width: '*',
            stack: [
              {
                text: 'FAITH D. CADULONG, MPA',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 120,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'Supervising Administrative Officer Representative, Second Level Positions',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
        ],
        columnGap: 40,
        margin: [0, 0, 0, 15],
        unbreakable: true,
      },

      // Row 3: Two signatories
      {
        columns: [
          // Left column
          {
            width: '*',
            stack: [
              {
                text: 'EVELYN B. CHUA',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 120,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'Executive Assistant IV of the City Mayor',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
          // Right column
          {
            width: '*',
            stack: [
              {
                text: 'JANYLENE A. PALERMO, MM',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 120,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'City Human Resource Management Officer',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
        ],
        columnGap: 40,
        margin: [0, 0, 0, 15],
        unbreakable: true,
      },

      // Row 4: Two signatories
      {
        columns: [
          // Left column
          {
            width: '*',
            stack: [
              {
                text: 'KAREN A. GENTILES, CPA',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 120,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'City Budget Officer',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
          // Right column
          {
            width: '*',
            stack: [
              {
                text: 'ENGR. AGRIPINO G. COQUILLA, JR.',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 120,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
                alignment: 'center',
              },
              {
                text: 'City Councilor Chairperson - Committee on Labor, Employment and Civil Service',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Member',
                fontSize: 7,
                alignment: 'center',
                italics: true,
              },
            ],
          },
        ],
        columnGap: 40,
        margin: [0, 0, 0, 15],
        unbreakable: true,
      },

      // Row 5: Bottom center signatory (Chairperson)
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              {
                text: 'EDGAR C. GUZMAN',
                fontSize: 8,
                bold: true,
                alignment: 'center',
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 150,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 2, 0, 2],
              },
              {
                text: 'City Administrator',
                fontSize: 7,
                alignment: 'center',
              },
              {
                text: 'Chairperson',
                fontSize: 7,
                alignment: 'center',
                italics: true,
                bold: true,
              },
            ],
          },
          { width: '*', text: '' },
        ],
        margin: [0, 0, 0, 0],
        unbreakable: true,
      },
    ];
  }

  // Generate content for a single job post
  function generateJobPostContent(office, jobPost) {
    const content = [];

    // Office header (centered with background)
    content.push({
      text: office.toUpperCase(),
      fontSize: 10,
      bold: true,
      alignment: 'center',
      margin: [0, 15, 0, 10],
      fillColor: '#e8e8e8',
      padding: [0, 5, 0, 5],
    });

    // Job details table (borderless)
    const detailsBody = [];

    if (jobPost.Division) {
      detailsBody.push([
        {
          text: 'Division/Section:  ',
          fontSize: 8,
          bold: false,
          border: [false, false, false, false],
        },
        { text: jobPost.Division, fontSize: 8, bold: true, border: [false, false, false, false] },
      ]);
    }

    detailsBody.push(
      [
        { text: 'Position:', fontSize: 8, bold: false, border: [false, false, false, false] },
        {
          text: jobPost.Position || 'N/A',
          fontSize: 8,
          bold: true,
          border: [false, false, false, false],
        },
      ],
      [
        { text: 'Salary Grade:', fontSize: 8, bold: false, border: [false, false, false, false] },
        {
          text: jobPost['Salary Grade'] || 'N/A',
          fontSize: 8,
          bold: true,
          border: [false, false, false, false],
        },
      ],
      [
        {
          text: 'Plantilla Item No.:  ',
          fontSize: 8,
          bold: false,
          border: [false, false, false, false],
        },
        {
          text: jobPost['Plantilla Item No'] || 'N/A',
          fontSize: 8,
          bold: true,
          border: [false, false, false, false],
        },
      ],
    );

    content.push({
      table: {
        widths: ['20%', '80%'],
        body: detailsBody,
      },
      margin: [0, 0, 0, 10],
    });

    // Top 5 Applicants Table
    const tableBody = [
      [
        { text: 'RANK', style: 'tableHeader', alignment: 'center' },
        { text: 'RECOMMENDED APPLICANTS', style: 'tableHeader', alignment: 'center' },
        { text: 'REMARKS', style: 'tableHeader', alignment: 'center' },
      ],
    ];

    const topApplicants = jobPost['Top 5 Applicant'] || [];

    if (topApplicants.length === 0) {
      // No applicants - show 5 empty rows
      for (let i = 1; i <= 5; i++) {
        tableBody.push([
          { text: i.toString(), alignment: 'center', fontSize: 8 },
          { text: '', alignment: 'left', fontSize: 8 },
          { text: '', alignment: 'center', fontSize: 8 },
        ]);
      }
    } else {
      // Add applicants (up to 5)
      const applicantsToShow = topApplicants.slice(0, 5);

      applicantsToShow.forEach((applicant) => {
        const fullName = `${applicant.firstname || ''} ${applicant.lastname || ''}`.trim();
        tableBody.push([
          { text: applicant.rank?.toString() || '-', alignment: 'center', fontSize: 8 },
          { text: fullName, alignment: 'left', fontSize: 8 },
          { text: '', alignment: 'center', fontSize: 8 }, // Empty remarks column
        ]);
      });

      // Fill remaining rows if less than 5 applicants
      const remainingRows = 5 - applicantsToShow.length;
      for (let i = 0; i < remainingRows; i++) {
        const nextRank = applicantsToShow.length + i + 1;
        tableBody.push([
          { text: nextRank.toString(), alignment: 'center', fontSize: 8 },
          { text: '', alignment: 'left', fontSize: 8 },
          { text: '', alignment: 'center', fontSize: 8 },
        ]);
      }
    }

    content.push({
      table: {
        headerRows: 1,
        widths: ['15%', '60%', '25%'],
        body: tableBody,
      },
      layout: {
        fillColor: function (rowIndex) {
          return rowIndex === 0 ? 'white' : null;
        },
      },
      margin: [0, 0, 0, 0],
    });

    return content;
  }

  async function generatePdfContent() {
    // Revoke previous PDF URL to free memory
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }

    if (!reportData.value) {
      return;
    }

    // Load logo image
    const logoBase64 = await getImageBase64('/logo.png');

    import('pdfmake/build/pdfmake').then((pdfMakeModule) => {
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      import('pdfmake/build/vfs_fonts').then((vfsFontsModule) => {
        pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

        const allContent = [];

        // Report Title with Border
        allContent.push({
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    {
                      text: reportData.value.Header?.toUpperCase() || 'TOP 5 RANKING APPLICANTS',
                      fontSize: 13,
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: reportData.value.Date?.toUpperCase() || '',
                      fontSize: 13,
                      bold: true,
                      alignment: 'center',
                      margin: [0, 3, 0, 0],
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function () {
              return 2;
            },
            vLineWidth: function () {
              return 2;
            },
          },
          margin: [0, 0, 0, 10],
        });

        // Process each office and job post
        const offices = reportData.value.Offices || [];
        offices.forEach((officeData, officeIndex) => {
          const jobPosts = officeData.job_posts || [];
          jobPosts.forEach((jobPost, jobIndex) => {
            const jobContent = generateJobPostContent(officeData.office, jobPost);
            allContent.push(...jobContent);

            // Add spacing between job posts within same office
            if (jobIndex < jobPosts.length - 1) {
              allContent.push({ text: '', margin: [0, 0, 0, 20] });
            }
          });

          // Add spacing between different offices (but not after the last one)
          if (officeIndex < offices.length - 1) {
            allContent.push({ text: '', margin: [0, 0, 0, 15] });
          }
        });

        // Add signatory footer
        allContent.push(...generateSignatoryFooter());

        const docDefinition = {
          pageSize: 'A4',
          pageOrientation: 'portrait',
          pageMargins: [60, 120, 60, 50],
          header: function () {
            return {
              stack: [
                // Green banner
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: (595.28 - 523.28) / 2,
                      y: 60,
                      w: 523.28,
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
                          text: 'HUMAN RESOURCE MERIT PROMOTION AND SELECTION BOARD',
                          fontSize: 11,
                          bold: true,
                          color: 'white',
                          margin: [0, 7, 0, 0],
                        },
                      ],
                    },
                  ],
                },
              ],
            };
          },
          footer: function (currentPage, pageCount) {
            return {
              text: `Page ${currentPage} of ${pageCount}`,
              alignment: 'right',
              fontSize: 8,
              margin: [0, 10, 30, 0],
            };
          },
          content: allContent,
          styles: {
            tableHeader: {
              fontSize: 8,
              bold: true,
            },
          },
          defaultStyle: {
            fontSize: 8,
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

  // Initial fetch and render
  onMounted(async () => {
    if (props.publicationDate) {
      await fetchReportData();
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
