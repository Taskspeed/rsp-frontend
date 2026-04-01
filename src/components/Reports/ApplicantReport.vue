<template>
  <q-card class="modal-card">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Applicant Report</div>
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
  import { useReportStore } from 'stores/reportStore';

  const props = defineProps({
    positions: {
      type: Array,
      default: () => [],
    },
  });

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const reportStore = useReportStore();
  const applicants = ref([]);

  // Watch for changes in positions and regenerate/report
  watch(
    () => props.positions,
    async (newVal) => {
      if (newVal && newVal.length) {
        await fetchApplicants();
        await generatePdfContent();
      }
    },
    { immediate: true },
  );

  async function fetchApplicants() {
    applicants.value = [];
    isLoading.value = true;
    try {
      for (const positionId of props.positions) {
        await reportStore.fetchApplicantList(positionId);
        // response is in reportStore.report, which is an array
        // merge all fetched applicants
        if (Array.isArray(reportStore.report)) {
          applicants.value = applicants.value.concat(reportStore.report);
        }
      }
    } catch {
      // error handled by store
    }
    isLoading.value = false;
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

  async function generatePdfContent() {
    pdfUrl.value && URL.revokeObjectURL(pdfUrl.value);
    if (!Array.isArray(applicants.value) || !applicants.value.length) {
      pdfUrl.value = null;
      return;
    }

    // Load logo image
    const logoBase64 = await getImageBase64('/logo.png');

    import('pdfmake/build/pdfmake').then((pdfMakeModule) => {
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      import('pdfmake/build/vfs_fonts').then((vfsFontsModule) => {
        pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

        const rows = [
          [
            { text: 'First Name', style: 'tableHeader', alignment: 'center' },
            { text: 'Last Name', style: 'tableHeader', alignment: 'center' },
            { text: 'Applied Date', style: 'tableHeader', alignment: 'center' },
            { text: 'Position', style: 'tableHeader', alignment: 'center' },
          ],
          ...applicants.value.map((a) => [
            a.n_personal_info?.firstname ?? '',
            a.n_personal_info?.lastname ?? '',
            a.apply_date ?? '',
            a.position ?? '',
          ]),
        ];

        const docDefinition = {
          pageSize: 'A4',
          pageOrientation: 'portrait',
          pageMargins: [72, 120, 72, 40], // left, top, right, bottom
          header: function () {
            return {
              stack: [
                // Green banner (drawn first, so it's behind)
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: (595.28 - 523.28) / 2, // (A4 width - rect width) / 2 = centered
                      y: 60,
                      w: 523.28, // A4 width in points
                      h: 25,
                      color: '#008000',
                      alignment: 'center',
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
            {
              text: 'Applicant Report',
              fontSize: 14,
              bold: true,
              margin: [0, 0, 0, 16],
              alignment: 'center',
            },
            {
              table: {
                headerRows: 1,
                widths: ['*', '*', '*', 'auto'],
                body: rows,
              },
              layout: {
                fillColor: function (rowIndex) {
                  return rowIndex === 0 ? '#e0e0e0' : null;
                },
              },
            },
          ],
          styles: {
            tableHeader: {
              fontSize: 10,
              bold: true,
            },
          },
          defaultStyle: { fontSize: 9 },
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
    if (props.positions && props.positions.length) {
      await fetchApplicants();
      await generatePdfContent();
    }
  });
</script>

<style scoped>
  .modal-card {
    width: 100%;
    max-width: 800px;
    height: 80vh;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  }
</style>
