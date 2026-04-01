<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="modal-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Rating Form Report</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeModal" />
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
          v-else-if="!pdfUrl && !hasApplicants"
          class="column items-center justify-center text-grey q-gutter-sm"
          style="height: 100%"
        >
          <q-icon name="info" size="32px" />
          <div>No applicants to display.</div>
        </div>

        <div
          v-else-if="!pdfUrl && !isLoading"
          class="column items-center justify-center text-grey q-gutter-sm"
          style="height: 100%"
        >
          <q-spinner color="primary" size="32px" />
          <div>Generating PDF preview...</div>
        </div>

        <iframe
          v-if="pdfUrl && !isLoading"
          :src="pdfUrl"
          style="width: 100%; height: 100%; border: none"
          type="application/pdf"
        ></iframe>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch, onUnmounted, computed } from 'vue';
  import { use_rater_store } from 'stores/rater_store';

  const props = defineProps({
    modelValue: Boolean,
    positionId: { type: [String, Number], required: true },
  });

  const emit = defineEmits(['update:modelValue', 'close']);

  // ✅ two-way v-model proxy
  const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  });

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const raterStore = use_rater_store();
  const applicants = ref([]);

  const hasApplicants = computed(
    () => Array.isArray(applicants.value) && applicants.value.length > 0,
  );

  const isFetching = ref(false);

  watch(
    () => props.modelValue,
    async (val, prev) => {
      // only when opening
      if (val && !prev && props.positionId && !isFetching.value) {
        isFetching.value = true;
        try {
          await fetchApplicants();
          await generatePdfContent();
        } finally {
          isFetching.value = false;
        }
      }
    },
  );

  const closeModal = () => {
    isOpen.value = false;
    emit('close');
  };

  async function fetchApplicants() {
    applicants.value = [];
    isLoading.value = true;
    try {
      const result = await raterStore.fetch_criteria_applicant(props.positionId);
      if (result && Array.isArray(result.applicants)) {
        applicants.value = result.applicants;
      }
    } catch {
      // handled by store
    } finally {
      isLoading.value = false;
    }
  }

  const calculateQS = (applicant) => {
    if (!applicant) return '-';
    const rating = applicant.rating_score || {};
    const edu = parseFloat(rating.education_score) || 0;
    const exp = parseFloat(rating.experience_score) || 0;
    const train = parseFloat(rating.training_score) || 0;
    const perf = parseFloat(rating.performance_score) || 0;
    if (edu === 0 && exp === 0 && train === 0 && perf === 0) return '-';
    return (edu + exp + train + perf).toFixed(2);
  };

  const calculateTotal = (applicant) => {
    if (!applicant) return '-';
    const qs = calculateQS(applicant);
    if (qs === '-') return '-';
    const rating = applicant.rating_score || {};
    const bei = parseFloat(rating.behavioral_score) || 0;
    return (parseFloat(qs) + bei).toFixed(2);
  };

  // ✅ Helper to convert logo to base64
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
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }

    if (!Array.isArray(applicants.value) || !applicants.value.length) {
      return;
    }

    isLoading.value = true;
    try {
      const logoBase64 = await getImageBase64('/logo.png');

      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfMake = pdfMakeModule.default || pdfMakeModule;

      const vfsFontsModule = await import('pdfmake/build/vfs_fonts');
      pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

      const rows = [
        [
          { text: 'Applicant', style: 'tableHeader', alignment: 'center' },
          { text: 'Education', style: 'tableHeader', alignment: 'center' },
          { text: 'Experience', style: 'tableHeader', alignment: 'center' },
          { text: 'Training', style: 'tableHeader', alignment: 'center' },
          { text: 'Performance', style: 'tableHeader', alignment: 'center' },
          { text: 'BEI', style: 'tableHeader', alignment: 'center' },
          { text: 'QS Total', style: 'tableHeader', alignment: 'center' },
          { text: 'Grand Total', style: 'tableHeader', alignment: 'center' },
          { text: 'Rank', style: 'tableHeader', alignment: 'center' },
        ],
        ...applicants.value.map((a) => {
          const rating = a.rating_score || {};
          return [
            `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim(),
            rating.education_score ?? '',
            rating.experience_score ?? '',
            rating.training_score ?? '',
            rating.performance_score ?? '',
            rating.behavioral_score ?? '',
            calculateQS(a),
            calculateTotal(a),
            rating.ranking ?? '',
          ];
        }),
      ];

      const docDefinition = {
        pageSize: 'LEGAL',
        pageOrientation: 'landscape',
        pageMargins: [72, 120, 72, 40],
        header: function () {
          return {
            stack: [
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
            text: 'RATING FROM FOR QUALIFICATION STANDARDS',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 16],
            alignment: 'center',
          },
          {
            table: {
              headerRows: 1,
              widths: [120, 70, 70, 70, 70, 55, 60, 65, 45],
              body: rows,
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex === 0 ? '#e0e0e0' : null),
            },
          },
        ],
        styles: { tableHeader: { fontSize: 10, bold: true } },
        defaultStyle: { fontSize: 9 },
      };

      const blob = await new Promise((resolve) => {
        pdfMake.createPdf(docDefinition).getBlob(resolve);
      });

      pdfUrl.value = URL.createObjectURL(blob);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      isLoading.value = false;
    }
  }

  onUnmounted(() => {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  });
</script>

<style scoped>
  .modal-card {
    width: 100%;
    max-width: 900px;
    height: 80vh;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  }
</style>
