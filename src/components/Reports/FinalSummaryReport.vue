<template>
  <q-card class="modal-card">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Final Summary Report</div>
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
        v-else-if="errorMessage"
        class="column items-center justify-center text-grey q-gutter-sm"
        style="height: 100%"
      >
        <q-icon name="warning" color="warning" size="64px" />
        <div class="text-h6 text-center">{{ errorMessage }}</div>
        <div class="text-caption text-center text-grey-6">
          Please ensure applicants have been rated before generating the report.
        </div>
      </div>

      <div
        v-else-if="!pdfUrl && !isLoading && !errorMessage"
        class="column items-center justify-center text-grey q-gutter-sm"
        style="height: 100%"
      >
        <q-spinner color="primary" size="32px" />
        <div>Generating PDF preview...</div>
      </div>

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
    positions: {
      type: Array,
      default: () => [],
    },
  });

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const summaryReportStore = useSummaryReportStore();
  const allReportsData = ref([]);
  const errorMessage = ref(null);

  watch(
    () => props.positions,
    async (newVal, oldVal) => {
      if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return;

      if (newVal && newVal.length) {
        await fetchApplicantDetail();
        await generatePdfContent();
      }
    },
  );

  async function fetchApplicantDetail() {
    if (isLoading.value) return;

    allReportsData.value = [];
    errorMessage.value = null;
    isLoading.value = true;

    try {
      const promises = props.positions.map((positionId) =>
        summaryReportStore.fetchApplicantDetail(positionId),
      );

      const results = await Promise.all(promises);
      const validResults = results.filter((data) => data !== null);

      if (validResults.length === 0) {
        errorMessage.value = "Applicants don't have ratings yet";
        allReportsData.value = [];
        return;
      }

      if (validResults.length < results.length) {
        errorMessage.value = `Some positions don't have ratings yet (${validResults.length} of ${results.length} positions have ratings)`;
        allReportsData.value = [];
        return;
      }

      allReportsData.value = validResults;
    } catch (error) {
      console.error('Error fetching applicants:', error);
      errorMessage.value = error.message || 'An error occurred while loading the report';
    } finally {
      isLoading.value = false;
    }
  }

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

  function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    if (Number.isNaN(num)) return value;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  }

  function getLastNameUpper(fullName = '') {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : fullName;
    return last.toUpperCase();
  }

  function hasBehavioralCriteria(reportData) {
    const criteria = reportData?.criteria || reportData?.jobPost?.criteria || [];
    if (!Array.isArray(criteria)) return false;

    return criteria.some((c) => {
      if (Array.isArray(c.behaviorals) && c.behaviorals.length > 0) return true;
      if (Array.isArray(c.behavioral) && c.behavioral.length > 0) return true;

      const label = `${c.title || ''} ${c.description || ''}`.toLowerCase();
      return label.includes('behavioral') || label.includes('bei');
    });
  }

  function hasExamCriteria(reportData) {
    const criteria = reportData?.criteria || reportData?.jobPost?.criteria || [];
    if (!Array.isArray(criteria)) return false;

    return criteria.some((c) => Array.isArray(c.exams) && c.exams.length > 0);
  }

  // Normalize applicants from API response
  function getApplicants(reportData) {
    if (Array.isArray(reportData?.applicants)) return reportData.applicants;

    if (reportData?.data && typeof reportData.data === 'object') {
      return Object.values(reportData.data).map((item) => ({
        applicant: {
          firstname: item.firstname,
          lastname: item.lastname,
        },
        score: item.rater_scores,
        total_rating: item.total_rating,
        bei: item.bei,
        exam_score: item.exam_score,
        final_rating: item.final_rating,
        grand_total: item.grand_total,
        rank: item.rank,
      }));
    }

    return [];
  }

  function getMaxRatersCount(reportData) {
    const applicants = getApplicants(reportData);
    if (!applicants.length) return 0;

    let maxRaters = 0;
    applicants.forEach((item) => {
      const ratersCount = item.score?.length || 0;
      if (ratersCount > maxRaters) maxRaters = ratersCount;
    });
    return maxRaters;
  }

  function getAllRaters(reportData) {
    const applicants = getApplicants(reportData);
    if (!applicants.length) return [];

    const ratersMap = new Map();

    applicants.forEach((item) => {
      if (Array.isArray(item.score)) {
        item.score.forEach((scoreItem) => {
          if (!ratersMap.has(scoreItem.rater_id)) {
            ratersMap.set(scoreItem.rater_id, {
              id: scoreItem.rater_id,
              name: scoreItem.rater_name,
              position: scoreItem.rater_position,
            });
          }
        });
      }
    });

    return Array.from(ratersMap.values());
  }

  // ✅ Use raters array for signatories, with Chairperson last
  function getSignatories(reportData) {
    const raters = Array.isArray(reportData?.raters) ? reportData.raters : [];

    const members = raters.filter((r) => (r.role_type || '').toLowerCase() !== 'chairperson');
    const chairpersons = raters.filter((r) => (r.role_type || '').toLowerCase() === 'chairperson');

    return [...members, ...chairpersons];
  }

  function generateSignatoryFooter(reportData) {
    const signatories = getSignatories(reportData);
    if (!signatories.length) return [];

    const MAX_PER_ROW = 3;
    const footerContent = [];

    for (let i = 0; i < signatories.length; i += MAX_PER_ROW) {
      const rowItems = signatories.slice(i, i + MAX_PER_ROW);

      const columns = rowItems.map((r) => ({
        width: '*',
        stack: [
          {
            text: (r.rater_name || '').toUpperCase(),
            fontSize: 10,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 2],
          },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }],
            alignment: 'center',
            margin: [0, 0, 0, 4],
          },
          { text: r.position || 'Position', fontSize: 9, alignment: 'center', italics: true },
          { text: r.representative || '', fontSize: 9, alignment: 'center', italics: true },
          { text: r.role_type || '', fontSize: 9, alignment: 'center', italics: true },
        ],
      }));

      const missing = MAX_PER_ROW - columns.length;
      const leftPads = Math.floor(missing / 2);
      const rightPads = missing - leftPads;

      const paddedColumns = [
        ...Array.from({ length: leftPads }, () => ({ width: '*', text: '' })),
        ...columns,
        ...Array.from({ length: rightPads }, () => ({ width: '*', text: '' })),
      ];

      footerContent.push({
        unbreakable: true, // ✅ keep entire row together
        columns: paddedColumns,
        columnGap: 30,
        margin: i === 0 ? [0, 30, 0, 0] : [0, 20, 0, 0],
      });
    }

    return footerContent;
  }

  function generatePositionTable(reportData) {
    const applicants = getApplicants(reportData);
    const maxRaters = getMaxRatersCount(reportData);
    const allRaters = getAllRaters(reportData);
    const showBEI = hasBehavioralCriteria(reportData);
    const showExam = hasExamCriteria(reportData);

    const headerRow = [
      {
        text: 'NAME OF APPLICANT',
        style: 'tableHeader',
        alignment: 'center',
        colSpan: 2,
        rowSpan: 2,
      },
      {},
    ];

    if (maxRaters > 0) {
      headerRow.push({
        text: 'HRM PSB MEMBER RATINGS',
        style: 'tableHeader',
        alignment: 'center',
        colSpan: maxRaters,
      });
      for (let i = 1; i < maxRaters; i++) headerRow.push({});
    }

    headerRow.push({
      text: 'TOTAL RATING\n(70%)',
      style: 'tableHeader',
      alignment: 'center',
      rowSpan: 2,
    });

    if (showBEI) {
      headerRow.push({
        text: 'BEI\n(30%)',
        style: 'tableHeader',
        alignment: 'center',
        rowSpan: 2,
      });
    }

    if (showExam) {
      headerRow.push({
        text: 'EXAM',
        style: 'tableHeader',
        alignment: 'center',
        rowSpan: 2,
      });
    }

    headerRow.push({
      text: 'FINAL RATING',
      style: 'tableHeader',
      alignment: 'center',
      rowSpan: 2,
    });

    headerRow.push({
      text: 'RANKING',
      style: 'tableHeader',
      alignment: 'center',
      rowSpan: 2,
    });

    const subHeaderRow = [{}, {}];

    allRaters.forEach((rater) => {
      subHeaderRow.push({
        text: getLastNameUpper(rater.name),
        style: 'tableHeader',
        alignment: 'center',
        fontSize: 9,
      });
    });

    subHeaderRow.push({});
    if (showBEI) subHeaderRow.push({});
    if (showExam) subHeaderRow.push({});
    subHeaderRow.push({});
    subHeaderRow.push({});

    const dataRowsWithScores = applicants.map((item, idx) => {
      const row = [];

      row.push({ text: (idx + 1).toString(), alignment: 'center' });

      const fullName = `${item.applicant?.firstname || ''} ${
        item.applicant?.lastname || ''
      }`.trim();
      row.push({ text: fullName, alignment: 'left' });

      const scoresMap = new Map();
      let beiScore = 0;
      let examScore = 0;

      if (Array.isArray(item.score)) {
        item.score.forEach((scoreItem) => {
          scoresMap.set(scoreItem.rater_id, scoreItem.grand_total || scoreItem.total_qs || '');
          if (!beiScore && scoreItem.bei) beiScore = parseFloat(scoreItem.bei) || 0;
          if (!examScore && scoreItem.exam_score) examScore = parseFloat(scoreItem.exam_score) || 0;
        });
      }

      allRaters.forEach((rater) => {
        const score = scoresMap.get(rater.id);
        row.push({ text: formatNumber(score), alignment: 'center' });
      });

      const scores = Array.from(scoresMap.values()).filter((s) => s !== '' && s !== '-');
      const averageRating =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + parseFloat(score), 0) / scores.length
          : 0;

      const totalRating70 = averageRating * 0.7;
      row.push({ text: formatNumber(totalRating70), alignment: 'center', bold: true });

      let finalRating = totalRating70;

      if (showBEI) {
        row.push({ text: formatNumber(beiScore), alignment: 'center', bold: true });
        finalRating += beiScore;
      }

      if (showExam) {
        row.push({ text: formatNumber(examScore), alignment: 'center', bold: true });
        finalRating += examScore;
      }

      row.push({ text: formatNumber(finalRating), alignment: 'center', bold: true });

      row.push({ text: '', alignment: 'center', bold: true });

      return {
        row,
        finalRating: finalRating,
      };
    });

    dataRowsWithScores.sort((a, b) => b.finalRating - a.finalRating);
    dataRowsWithScores.forEach((item, index) => {
      item.row[item.row.length - 1].text = (index + 1).toString();
    });

    const dataRows = dataRowsWithScores.map((item) => item.row);
    const rows = [headerRow, subHeaderRow, ...dataRows];

    const raterColumnWidth = maxRaters > 0 ? 50 : 0;
    const widths = [30, '*'];
    for (let i = 0; i < maxRaters; i++) widths.push(raterColumnWidth);
    widths.push(65);
    if (showBEI) widths.push(55);
    if (showExam) widths.push(55);
    widths.push(65);
    widths.push(50);

    const jobPost = reportData.jobPost || reportData || {};
    const office = jobPost.Office || reportData.office || 'N/A';
    const position = jobPost.Position || reportData.position || 'N/A';
    const salaryGrade = jobPost.SalaryGrade || reportData.Salary_Grade || 'N/A';
    const plantillaItemNo = jobPost['Plantilla Item No'] || reportData.Plantilla_Item_No || 'N/A';

    return [
      {
        text: 'SUMMARY OF RATING',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 2],
        alignment: 'center',
      },
      {
        text: 'QUALIFICATION STANDARDS',
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 16],
        alignment: 'center',
      },
      {
        table: {
          widths: ['15%', '85%'],
          body: [
            [
              { text: 'Office:   ', fontSize: 10, border: [false, false, false, false] },
              { text: office, fontSize: 10, bold: true, border: [false, false, false, false] },
            ],
            [
              { text: 'Position:   ', fontSize: 10, border: [false, false, false, false] },
              { text: position, fontSize: 10, bold: true, border: [false, false, false, false] },
            ],
            [
              { text: 'Salary Grade:  ', fontSize: 10, border: [false, false, false, false] },
              {
                text: salaryGrade,
                fontSize: 10,
                bold: true,
                border: [false, false, false, false],
              },
            ],
            [
              {
                text: 'Plantilla Item No.:    ',
                fontSize: 10,
                border: [false, false, false, false],
              },
              {
                text: plantillaItemNo,
                fontSize: 10,
                bold: true,
                border: [false, false, false, false],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          headerRows: 2,
          widths: widths,
          body: rows,
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 || rowIndex === 1 ? 'white' : null;
          },
        },
      },
      ...generateSignatoryFooter(reportData),
    ];
  }

  async function generatePdfContent() {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }

    if (!allReportsData.value || allReportsData.value.length === 0) {
      return;
    }

    const logoBase64 = await getImageBase64('/logo.png');

    import('pdfmake/build/pdfmake').then((pdfMakeModule) => {
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      import('pdfmake/build/vfs_fonts').then((vfsFontsModule) => {
        pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

        const allContent = [];

        allReportsData.value.forEach((reportData, index) => {
          const positionContent = generatePositionTable(reportData);
          allContent.push(...positionContent);

          if (index < allReportsData.value.length - 1) {
            allContent.push({ text: '', pageBreak: 'after' });
          }
        });

        const docDefinition = {
          pageSize: 'LEGAL',
          pageOrientation: 'landscape',
          pageMargins: [72, 100, 72, 10],
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
          content: allContent,
          styles: {
            tableHeader: {
              fontSize: 10,
              bold: true,
            },
          },
          footer: function () {
            return { stack: [{}] };
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

  onMounted(async () => {
    if (props.positions && props.positions.length) {
      await fetchApplicantDetail();
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
