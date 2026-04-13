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
  import { use_rating_form_store } from 'stores/ratingFormStore';

  const props = defineProps({
    modelValue: Boolean,
    jobBatchesRspId: { type: [String, Number], required: true },
  });

  const emit = defineEmits(['update:modelValue', 'close']);

  const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  });

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const ratingFormStore = use_rating_form_store();

  const hasApplicants = computed(() => ratingFormStore.hasApplicants);
  const isFetching = ref(false);

  const reportData = computed(() => ratingFormStore.data || {});
  const office = computed(() => reportData.value.office || '');
  const position = computed(() => reportData.value.position || '');
  const salaryGrade = computed(() => reportData.value.salary_grade || '');
  const plantillaItemNo = computed(() => reportData.value.item_no || '');

  const signatoryName = computed(() => reportData.value?.rater_assigned?.name || '');
  const signatoryPosition = computed(() => reportData.value?.rater_assigned?.position || '');
  const signatoryRepresentative = computed(
    () => reportData.value?.rater_assigned?.representative || '',
  );
  const signatoryRole = computed(() => reportData.value?.rater_assigned?.role_type || '');

  watch(
    () => props.modelValue,
    async (val, prev) => {
      if (val && !prev && props.jobBatchesRspId && !isFetching.value) {
        isFetching.value = true;
        try {
          await fetchReport();
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

  async function fetchReport() {
    isLoading.value = true;
    try {
      await ratingFormStore.fetchRatingForm(props.jobBatchesRspId);
    } catch {
      // handled by store
    } finally {
      isLoading.value = false;
    }
  }

  const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value ?? '';
    return num % 1 === 0 ? String(Math.round(num)) : num.toFixed(2);
  };

  const toUpper = (value) => (value || '').toUpperCase();

  const calculateQS = (applicant) => {
    if (!applicant) return '-';
    const edu = parseFloat(applicant.education) || 0;
    const exp = parseFloat(applicant.experience) || 0;
    const train = parseFloat(applicant.training) || 0;
    const perf = parseFloat(applicant.performance) || 0;
    if (edu === 0 && exp === 0 && train === 0 && perf === 0) return '-';
    return formatNumber(edu + exp + train + perf);
  };

  const calculateTotal = (applicant) => {
    if (!applicant) return '-';
    const qs = calculateQS(applicant);
    if (qs === '-') return '-';
    const bei = parseFloat(applicant.behavioral) || 0;
    const exam = parseFloat(applicant.exam) || 0;
    return formatNumber(parseFloat(qs) + bei + exam);
  };

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

    const applicants = ratingFormStore.ratingScores;
    if (!Array.isArray(applicants) || !applicants.length) return;

    isLoading.value = true;

    try {
      const logoBase64 = await getImageBase64('/logo.png');

      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfMake = pdfMakeModule.default || pdfMakeModule;

      const vfsFontsModule = await import('pdfmake/build/vfs_fonts');
      pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

      const qs = reportData.value.qs || {};
      const criteria = reportData.value.criteria || {};
      const criteriaOrder = [
        'education',
        'experience',
        'training',
        'performance',
        'behavioral',
        'exams',
      ];

      const hasBehavioral = Array.isArray(criteria.behavioral) && criteria.behavioral.length > 0;
      const hasExam = Array.isArray(criteria.exams) && criteria.exams.length > 0;

      const criteriaColumns = criteriaOrder
        .filter((key) => Array.isArray(criteria[key]) && criteria[key].length > 0)
        .map((key) => {
          let weight = criteria[key]?.[0]?.weight || '';
          if (key === 'behavioral' && hasBehavioral && hasExam) weight = '10';
          if (key === 'exams' && hasBehavioral && hasExam) weight = '7';

          const label = key === 'exams' ? 'Exam' : key.charAt(0).toUpperCase() + key.slice(1);
          return {
            key: key === 'exams' ? 'exam' : key,
            label,
            weight,
            qsText: qs[key] || '',
            items: criteria[key],
          };
        });

      const headerRow1 = [
        {
          text: 'Applicant',
          style: 'tableHeader',
          alignment: 'center',
          colSpan: 2,
          rowSpan: 3,
          border: [true, true, true, true],
        },
        {},
        ...criteriaColumns.map((c) => ({
          text: `${c.label} (${c.weight}%)`,
          style: 'tableHeader',
          alignment: 'center',
          border: [true, true, true, true],
        })),
        {
          text: 'QS Total',
          style: 'tableHeader',
          alignment: 'center',
          rowSpan: 3,
          border: [true, true, true, true],
        },
        {
          text: 'Grand Total',
          style: 'tableHeader',
          alignment: 'center',
          rowSpan: 3,
          border: [true, true, true, true],
        },
        {
          text: 'Rank',
          style: 'tableHeader',
          alignment: 'center',
          rowSpan: 3,
          border: [true, true, true, true],
        },
      ];

      const headerRow2 = [
        {},
        {},
        ...criteriaColumns.map((c) => ({
          text: c.qsText || '-',
          fontSize: 8,
          alignment: 'left',
          border: [true, true, true, false],
        })),
        {},
        {},
        {},
      ];

      const headerRow3 = [
        {},
        {},
        ...criteriaColumns.map((c) => ({
          text: c.items.map((i) => `${i.percentage}% - ${i.description}`).join('\n'),
          fontSize: 7,
          alignment: 'left',
          border: [true, true, true, false],
        })),
        {},
        {},
        {},
      ];

      const rows = [
        headerRow1,
        headerRow2,
        headerRow3,
        ...applicants.map((a, index) => [
          { text: String(index + 1), alignment: 'center' },
          toUpper(`${a.firstname ?? ''} ${a.lastname ?? ''}`.trim()),
          ...criteriaColumns.map((c) => formatNumber(a[c.key] ?? '')),
          calculateQS(a),
          calculateTotal(a),
          formatNumber(a.ranking ?? ''),
        ]),
      ];

      const colWidths = ['3%', '15%', ...criteriaColumns.map(() => '*'), '5%', '5%', '5%'];

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
                        fontSize: 12,
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
            text: 'RATING FORM FOR QUALIFICATION STANDARDS',
            fontSize: 12,
            bold: true,
            margin: [0, -20, 0, 10],
            alignment: 'center',
          },
          {
            table: {
              widths: ['15%', '85%'],
              body: [
                [
                  { text: 'Office:   ', fontSize: 8, border: [false, false, false, false] },
                  {
                    text: office.value,
                    fontSize: 8,
                    bold: true,
                    border: [false, false, false, false],
                  },
                ],
                [
                  { text: 'Position:   ', fontSize: 9, border: [false, false, false, false] },
                  {
                    text: position.value,
                    fontSize: 8,
                    bold: true,
                    border: [false, false, false, false],
                  },
                ],
                [
                  { text: 'Salary Grade:  ', fontSize: 8, border: [false, false, false, false] },
                  {
                    text: salaryGrade.value,
                    fontSize: 8,
                    bold: true,
                    border: [false, false, false, false],
                  },
                ],
                [
                  {
                    text: 'Plantilla Item No.:    ',
                    fontSize: 8,
                    border: [false, false, false, false],
                  },
                  {
                    text: plantillaItemNo.value,
                    fontSize: 8,
                    bold: true,
                    border: [false, false, false, false],
                  },
                ],
              ],
            },
            margin: [0, 0, 0, 0],
          },
          {
            table: {
              headerRows: 0,
              widths: colWidths,
              body: rows,
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#000',
              vLineColor: () => '#000',
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 2,
              paddingBottom: () => 2,
              fillColor: () => null,
              hLineWhenSplit: false,
            },
          },
          {
            unbreakable: true,
            margin: [0, 20, 0, 0],
            stack: [
              {
                text: signatoryName.value || '',
                alignment: 'center',
                bold: true,
                fontSize: 9,
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 345,
                    y1: 0,
                    x2: 520,
                    y2: 0,
                    lineWidth: 1,
                  },
                ],
                margin: [0, 4, 0, 4],
              },
              {
                text: signatoryPosition.value || '',
                alignment: 'center',
                fontSize: 8,
              },
              {
                text: signatoryRepresentative.value || '',
                alignment: 'center',
                fontSize: 8,
                margin: [0, 2, 0, 0],
              },
              {
                text: signatoryRole.value || '',
                alignment: 'center',
                fontSize: 8,
                margin: [0, 2, 0, 0],
              },
            ],
          },
        ],
        styles: { tableHeader: { fontSize: 8, bold: true } },
        defaultStyle: { fontSize: 7 },
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
