<!-- src\components\Reports\SelectedApplicantPositionReport.vue -->
<template>
  <q-card class="modal-card">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Applicant Per Position</div>
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
        v-if="!pdfUrl && !isLoading && !hasNoData"
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
  import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
  import { useSummaryReportStore } from 'stores/summaryReportStore';

  const props = defineProps({
    jobpostId: {
      type: [String, Number],
      default: null,
    },
    selectedData: {
      type: Object,
      default: null,
    },
  });

  const pdfUrl = ref(null);
  const isLoading = ref(false);
  const summaryReportStore = useSummaryReportStore();
  const reportData = ref(null);

  let DISABLE_ALL_IMAGES = false;
  let rejectionHandler = null;

  // Computed property to safely get applicants array
  const applicantsArray = computed(() => {
    if (!reportData.value || !reportData.value.data) return [];
    if (Array.isArray(reportData.value.data)) {
      return [...reportData.value.data].sort((a, b) => Number(a.rank) - Number(b.rank));
    }
    return Object.values(reportData.value.data).sort((a, b) => Number(a.rank) - Number(b.rank));
  });

  const hasNoData = computed(() => {
    return !isLoading.value && reportData.value && applicantsArray.value.length === 0;
  });

  async function fetchReportData() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      // Check if we have selected data from the modal
      if (props.selectedData) {
        console.log('Using provided selected data:', props.selectedData);

        // If the data has positions, use it directly
        if (props.selectedData.positions) {
          const positions = props.selectedData.positions;
          const positionKeys = Object.keys(positions);

          console.log(`Found ${positionKeys.length} positions:`, positionKeys);

          // Build the report data structure with all positions
          const transformedData = {
            jobpost_id: positionKeys[0] || '',
            office: '',
            division: '',
            position: '',
            Salary_Grade: '',
            Plantilla_Item_No: '',
            publication_date: props.selectedData.summary?.publicationDate || '',
            _allPositions: {},
            data: {},
          };

          // Combine all applicants with position context
          let allApplicants = [];
          let firstPositionData = null;

          positionKeys.forEach((jobpostId) => {
            const positionInfo = positions[jobpostId];
            const applicantsData = positionInfo.data || {};
            const applicants = Object.values(applicantsData);

            console.log(`Position ${jobpostId} has ${applicants.length} applicants`);

            // Store position data
            transformedData._allPositions[jobpostId] = {
              positionLabel: positionInfo.position || '',
              positionData: {
                office: positionInfo.office || '',
                office2: positionInfo.office2 || null,
                group: positionInfo.group || null,
                division: positionInfo.division || '',
                section: positionInfo.section || null,
                unit: positionInfo.unit || null,
                position: positionInfo.position || '',
                Salary_Grade: positionInfo.Salary_Grade || '',
                Plantilla_Item_No: positionInfo.Plantilla_Item_No || '',
                publication_date: positionInfo.publication_date || '',
              },
              applicants: applicants,
            };

            // Store first position data for main info
            if (!firstPositionData) {
              firstPositionData = positionInfo;
              transformedData.office = positionInfo.office || '';
              transformedData.division = positionInfo.division || '';
              transformedData.position = positionInfo.position || '';
              transformedData.Salary_Grade = positionInfo.Salary_Grade || '';
              transformedData.Plantilla_Item_No = positionInfo.Plantilla_Item_No || '';
              if (positionInfo.publication_date) {
                transformedData.publication_date = positionInfo.publication_date;
              }
            }

            applicants.forEach((app) => {
              allApplicants.push({
                ...app,
                _positionId: jobpostId,
                _positionLabel: positionInfo.position || '',
                _positionData: {
                  office: positionInfo.office || '',
                  office2: positionInfo.office2 || null,
                  group: positionInfo.group || null,
                  division: positionInfo.division || '',
                  section: positionInfo.section || null,
                  unit: positionInfo.unit || null,
                  position: positionInfo.position || '',
                  Salary_Grade: positionInfo.Salary_Grade || '',
                  Plantilla_Item_No: positionInfo.Plantilla_Item_No || '',
                },
              });
            });
          });

          console.log(`Total applicants combined: ${allApplicants.length}`);

          // Sort by rank
          allApplicants.sort((a, b) => Number(a.rank) - Number(b.rank));

          // Build data object
          allApplicants.forEach((app, index) => {
            transformedData.data[String(index)] = app;
          });

          reportData.value = transformedData;
          console.log(
            'Transformed report data with positions, applicants:',
            Object.keys(transformedData.data).length,
          );
          console.log('Position groups:', Object.keys(transformedData._allPositions));
        } else {
          // Fallback: try to use as is
          reportData.value = props.selectedData;
        }
      } else if (props.jobpostId) {
        // Original: fetch single position data
        const data = await summaryReportStore.fetchApplicantPosition(props.jobpostId);
        reportData.value = data;
      } else {
        console.error('No data provided to report modal');
        isLoading.value = false;
        return;
      }

      // Debug log
      if (reportData.value && reportData.value.data) {
        const applicants = Object.values(reportData.value.data);
        console.log(`Total applicants in report: ${applicants.length}`);
        if (applicants.length > 0) {
          console.log('First applicant sample:', {
            name: `${applicants[0].firstname} ${applicants[0].lastname}`,
            positionId: applicants[0]._positionId,
            hasImage: !!applicants[0].image_url,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      isLoading.value = false;
    }
  }

  function isValidBase64(str) {
    if (!str || typeof str !== 'string') return false;

    const dataUrlMatch = str.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      console.log('Not a valid data URL format');
      return false;
    }

    const imageType = dataUrlMatch[1];
    const base64Data = dataUrlMatch[2];

    if (base64Data.length < 100) {
      console.log('Base64 data too short');
      return false;
    }

    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(base64Data)) {
      console.log('Invalid base64 characters');
      return false;
    }

    try {
      const binaryString = atob(base64Data);
      if (binaryString.length < 8) {
        console.log('Binary data too short');
        return false;
      }

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (imageType === 'png') {
        const isValidPng =
          bytes[0] === 137 &&
          bytes[1] === 80 &&
          bytes[2] === 78 &&
          bytes[3] === 71 &&
          bytes[4] === 13 &&
          bytes[5] === 10 &&
          bytes[6] === 26 &&
          bytes[7] === 10;
        if (!isValidPng) {
          console.log('Invalid PNG header');
          return false;
        }
        return true;
      }

      if (imageType === 'jpeg' || imageType === 'jpg') {
        const isValidJpegStart = bytes[0] === 0xff && bytes[1] === 0xd8;
        if (!isValidJpegStart) {
          console.log('Invalid JPEG start marker');
          return false;
        }

        const isValidJpegEnd = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
        if (!isValidJpegEnd) {
          console.log('Invalid JPEG end marker - image may be truncated');
          return false;
        }
        return true;
      }

      if (imageType === 'gif') {
        const isValidGif =
          bytes[0] === 0x47 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x38 &&
          (bytes[4] === 0x37 || bytes[4] === 0x39) &&
          bytes[5] === 0x61;
        if (!isValidGif) {
          console.log('Invalid GIF header');
          return false;
        }
        return true;
      }

      if (imageType === 'bmp') {
        const isValidBmp = bytes[0] === 0x42 && bytes[1] === 0x4d;
        if (!isValidBmp) {
          console.log('Invalid BMP header');
          return false;
        }
        return true;
      }

      if (imageType === 'webp') {
        const isValidWebp =
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46 &&
          bytes[8] === 0x57 &&
          bytes[9] === 0x45 &&
          bytes[10] === 0x46 &&
          bytes[11] === 0x50;
        if (!isValidWebp) {
          console.log('Invalid WEBP header');
          return false;
        }
        return true;
      }

      if (imageType === 'svg+xml' || imageType === 'svg') {
        const str = binaryString.substring(0, 100).toLowerCase();
        const isValidSvg = str.includes('<svg') || str.includes('<?xml');
        if (!isValidSvg) {
          console.log('Invalid SVG header');
          return false;
        }
        return true;
      }

      console.log(`Unknown image type: ${imageType}, accepting if decodable`);
      return true;
    } catch (error) {
      console.error('Error validating base64:', error);
      return false;
    }
  }

  function isSupportedImageDataUrl(str) {
    if (!str || typeof str !== 'string') return false;
    const isValid = str.startsWith('data:image/');
    if (!isValid) {
      console.log('Not a valid data URL');
      return false;
    }
    return isValidBase64(str);
  }

  function normalizeImageForPdfmake(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl) {
        console.log('No data URL to normalize');
        return resolve(null);
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          if (canvas.width === 0 || canvas.height === 0) {
            console.log('Invalid image dimensions');
            return resolve(null);
          }

          const ctx = canvas.getContext('2d');

          const isPng = dataUrl.startsWith('data:image/png');
          const isGif = dataUrl.startsWith('data:image/gif');
          const isWebp = dataUrl.startsWith('data:image/webp');

          if (isPng || isGif || isWebp) {
            ctx.drawImage(img, 0, 0);
            const normalized = canvas.toDataURL('image/png');
            console.log(
              `Image normalized with transparency preserved: ${canvas.width}x${canvas.height}`,
            );
            resolve(normalized);
          } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const normalized = canvas.toDataURL('image/jpeg', 0.92);
            console.log(`JPEG normalized: ${canvas.width}x${canvas.height}`);
            resolve(normalized);
          }
        } catch (error) {
          console.error('Error normalizing image:', error);
          resolve(null);
        }
      };

      img.onerror = (error) => {
        console.error('Image load error:', error);
        resolve(null);
      };

      img.src = dataUrl;
    });
  }

  function placeholderImage() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  function safeImageOrPlaceholder(dataUrl) {
    if (dataUrl && isSupportedImageDataUrl(dataUrl)) {
      return dataUrl;
    }
    return placeholderImage();
  }

  async function getPublicImageBase64(url) {
    try {
      console.log('Fetching public image from URL:', url);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        console.log('Failed to fetch image:', response.status);
        return null;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        console.log('Empty blob');
        return null;
      }

      console.log(`Image type: ${blob.type}, size: ${blob.size} bytes`);

      let imageDataUrl;
      if (blob.size > 500 * 1024) {
        console.log(`Image too large (${blob.size} bytes), resizing...`);

        const img = new Image();
        const loadPromise = new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
          };
          reader.readAsDataURL(blob);
        });
        await loadPromise;

        const maxSize = 800;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        if (blob.type === 'image/png') {
          imageDataUrl = canvas.toDataURL('image/png');
        } else {
          imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        console.log(`Image resized to ${width}x${height}`);
      } else {
        imageDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      if (isSupportedImageDataUrl(imageDataUrl)) {
        console.log('Successfully loaded image');
        return imageDataUrl;
      }

      return null;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  }

  const outerBorderLayout = {
    hLineWidth: function (i, node) {
      return i === 0 || i === node.table.body.length ? 2 : 0;
    },
    vLineWidth: function (i, node) {
      return i === 0 || i === node.table.widths.length ? 2 : 0;
    },
    hLineColor: function () {
      return '#d1d1e7';
    },
    vLineColor: function () {
      return '#d1d1e7';
    },
    paddingLeft: function () {
      return 4;
    },
    paddingRight: function () {
      return 4;
    },
    paddingTop: function () {
      return 4;
    },
    paddingBottom: function () {
      return 4;
    },
  };

  const headerLayout = {
    hLineWidth: function () {
      return 0;
    },
    vLineWidth: function () {
      return 0;
    },
    paddingLeft: function () {
      return 0;
    },
    paddingRight: function () {
      return 0;
    },
    paddingTop: function () {
      return 0;
    },
    paddingBottom: function () {
      return 0;
    },
  };

  function getFormattedPublicationDate() {
    if (!reportData.value || !reportData.value.publication_date) {
      console.log('No publication_date in reportData:', reportData.value);
      return '';
    }

    const pubDate = reportData.value.publication_date;
    console.log('Raw publication_date:', pubDate);

    let startDateStr = pubDate.split(' - ')[0] || pubDate;
    const dateParts = startDateStr.match(/(\w+)\s+(\d+),\s+(\d+)/);
    if (!dateParts) {
      console.log('Could not parse date:', startDateStr);
      return '';
    }

    const month = dateParts[1];
    const day = dateParts[2];
    const year = dateParts[3];
    const formatted = `${month.toUpperCase()} ${day}, ${year}`;
    console.log('Formatted publication date:', formatted);
    return formatted;
  }

  async function generatePdfContent() {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }

    if (!reportData.value) return;

    const rd = reportData.value;

    let applicants = [];
    if (Array.isArray(rd.data)) {
      applicants = rd.data;
    } else if (rd.data && typeof rd.data === 'object') {
      applicants = Object.values(rd.data);
    }

    console.log(`Total applicants before sort: ${applicants.length}`);
    applicants.sort((a, b) => Number(a.rank) - Number(b.rank));

    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const vfsFontsModule = await import('pdfmake/build/vfs_fonts');
    pdfMake.vfs = vfsFontsModule?.pdfMake?.vfs || vfsFontsModule?.vfs || vfsFontsModule;

    const publicationDateText = getFormattedPublicationDate();
    let headerTitleText = 'APPLICANTS PER POSITION';
    if (publicationDateText) {
      headerTitleText = `APPLICANTS PER POSITION - ${publicationDateText} PUBLICATION`;
    }
    console.log('Header title:', headerTitleText);

    if (applicants.length === 0) {
      const docDefinition = {
        pageSize: 'Legal',
        pageOrientation: 'portrait',
        pageMargins: [40, 110, 40, 50],
        header: function () {
          return {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    text: headerTitleText,
                    color: 'white',
                    fontSize: 11,
                    bold: true,
                    alignment: 'center',
                    fillColor: '#008000',
                    margin: [0, 25, 0, 25],
                  },
                ],
              ],
            },
            layout: headerLayout,
          };
        },
        footer: function (currentPage, pageCount) {
          return {
            text: 'Page ' + currentPage + ' of ' + pageCount,
            alignment: 'right',
            fontSize: 8,
            margin: [0, 10, 30, 0],
          };
        },
        content: [
          {
            text: 'No applicants found for this position.',
            alignment: 'center',
            fontSize: 14,
            margin: [0, 50, 0, 0],
          },
        ],
        defaultStyle: { fontSize: 8 },
      };

      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      return new Promise((resolve) => {
        pdfDocGenerator.getBlob(function (blob) {
          const url = URL.createObjectURL(blob);
          pdfUrl.value = url;
          console.log('PDF generated (no applicants)');
          resolve();
        });
      });
    }

    const imageMap = {};
    console.log(`Loading images for ${applicants.length} applicants...`);

    await Promise.all(
      applicants.map(async function (ap) {
        const uniqueKey = ap.ControlNo || ap.nPersonalInfo_id || ap.submission_id;
        if (!uniqueKey) {
          console.log('No unique key for applicant:', ap);
          return;
        }

        if (!ap.image_url) {
          console.log(`No image_url for applicant ${uniqueKey}`);
          return;
        }

        try {
          console.log(`Fetching image for applicant ${uniqueKey} from URL:`, ap.image_url);

          let imageUrl = ap.image_url;
          if (imageUrl.startsWith('/')) {
            imageUrl = window.location.origin + imageUrl;
            console.log(`Converted to absolute URL: ${imageUrl}`);
          }

          const b64 = await summaryReportStore.fetchImageBase64(imageUrl);

          if (b64) {
            console.log(`Raw base64 for ${uniqueKey}:`, b64.substring(0, 100) + '...');
            console.log(`Base64 length: ${b64.length}`);
          } else {
            console.log(`No base64 data returned for ${uniqueKey}`);
            return;
          }

          if (b64 && isSupportedImageDataUrl(b64)) {
            console.log(`Base64 validated for ${uniqueKey}, normalizing...`);
            const normalized = await normalizeImageForPdfmake(b64);
            if (normalized) {
              imageMap[uniqueKey] = normalized;
              console.log(`✅ Image successfully loaded for ${uniqueKey}`);
            } else {
              console.log(`❌ Failed to normalize image for ${uniqueKey}`);
            }
          } else {
            console.log(`❌ Base64 validation failed for ${uniqueKey}`);
          }
        } catch (error) {
          console.error(`❌ Error loading image for ${uniqueKey}:`, error);
        }
      }),
    );

    console.log(`Successfully loaded ${Object.keys(imageMap).length} images`);

    const logoUrl = new URL('/rsp/logo.png', window.location.origin).toString();
    let logoBase64 = null;
    try {
      const rawLogo = await getPublicImageBase64(logoUrl);
      const candidate = safeImageOrPlaceholder(rawLogo);
      const normalized = await normalizeImageForPdfmake(candidate);
      logoBase64 = normalized || placeholderImage();
      console.log('Logo loaded successfully');
    } catch (error) {
      console.error('Error loading logo:', error);
      logoBase64 = placeholderImage();
    }

    const allContent = [];
    const BG = '#f0f0f0';

    // Group applicants by position
    let positionGroups = {};
    const hasMultiplePositions = applicants.some((ap) => ap._positionId);

    if (hasMultiplePositions) {
      console.log('Grouping applicants by position...');
      applicants.forEach((ap) => {
        const posId = ap._positionId || 'default';
        if (!positionGroups[posId]) {
          const posData = ap._positionData || {};
          positionGroups[posId] = {
            positionData: {
              office: posData.office || rd.office || '',
              office2: posData.office2 || null,
              group: posData.group || null,
              division: posData.division || rd.division || '',
              section: posData.section || null,
              unit: posData.unit || null,
              position: posData.position || ap._positionLabel || rd.position || '',
              Salary_Grade: posData.Salary_Grade || rd.Salary_Grade || '',
              Plantilla_Item_No: posData.Plantilla_Item_No || rd.Plantilla_Item_No || '',
            },
            positionLabel: ap._positionLabel || posData.position || rd.position || '',
            applicants: [],
          };
        }
        positionGroups[posId].applicants.push(ap);
      });
    } else if (rd._allPositions && Object.keys(rd._allPositions).length > 1) {
      console.log('Using _allPositions from report data');
      Object.entries(rd._allPositions).forEach(([posId, posInfo]) => {
        const posApplicants = applicants.filter((ap) => ap._positionId === posId);
        if (posApplicants.length > 0) {
          positionGroups[posId] = {
            positionData: {
              office: posInfo.positionData?.office || rd.office || '',
              office2: posInfo.positionData?.office2 || null,
              group: posInfo.positionData?.group || null,
              division: posInfo.positionData?.division || rd.division || '',
              section: posInfo.positionData?.section || null,
              unit: posInfo.positionData?.unit || null,
              position:
                posInfo.positionData?.position || posInfo.positionLabel || rd.position || '',
              Salary_Grade: posInfo.positionData?.Salary_Grade || rd.Salary_Grade || '',
              Plantilla_Item_No:
                posInfo.positionData?.Plantilla_Item_No || rd.Plantilla_Item_No || '',
            },
            positionLabel:
              posInfo.positionLabel || posInfo.positionData?.position || rd.position || '',
            applicants: posApplicants,
          };
        }
      });
    } else {
      // Single position - use the report data
      positionGroups = {
        default: {
          positionData: {
            office: rd.office || '',
            office2: rd.office2 || null,
            group: rd.group || '',
            division: rd.division || '',
            section: rd.section || null,
            unit: rd.unit || null,
            position: rd.position || '',
            Salary_Grade: rd.Salary_Grade || '',
            Plantilla_Item_No: rd.Plantilla_Item_No || '',
          },
          positionLabel: rd.position || '',
          applicants: applicants,
        },
      };
    }

    console.log(`Generated ${Object.keys(positionGroups).length} position groups`);

    // Loop through each position group
    // let positionIndex = 0;

    for (const [posId, group] of Object.entries(positionGroups)) {
      const positionData = group.positionData || {};
      const posApplicants = group.applicants || [];
      const posLabel = group.positionLabel || positionData.position || rd.position || '';

      if (posApplicants.length === 0) continue;

      console.log(`Position ${posId}: ${posApplicants.length} applicants`);

      // Add page break between positions
      // if (positionIndex > 0) {
      //   allContent.push({ text: '', pageBreak: 'before' });
      // }

      // Info table with outer borders (using position-specific data)
      const divisionOrSection = positionData.section || positionData.division || '';

      const infoRows = [
        [
          {
            text: positionData.office || rd.office || 'N/A',
            fontSize: 12,
            bold: true,
            alignment: 'center',
            colSpan: 2,
            margin: [4, 8, 4, 8],
          },
          { text: '', fillColor: BG },
        ],
        [
          {
            text: 'Position:',
            fontSize: 8,
            margin: [2, 0, 0, 0],
          },
          {
            text: [
              { text: posLabel || positionData.position || rd.position || 'N/A', bold: true },
              { text: `, SG ${positionData.Salary_Grade || rd.Salary_Grade || 'N/A'}` },
            ],
            fontSize: 8,
            margin: [0, 0, 2, 0],
          },
        ],
        [
          {
            text: 'Plantilla Item No.:',
            fontSize: 8,
            margin: [2, 0, 0, 0],
          },
          {
            text: positionData.Plantilla_Item_No || rd.Plantilla_Item_No || 'N/A',
            fontSize: 8,
            margin: [0, 0, 2, 0],
          },
        ],
      ];

      if (divisionOrSection) {
        infoRows.push([
          {
            text: 'Division/Section:',
            fontSize: 8,
            margin: [2, 0, 0, 0],
          },
          {
            text: divisionOrSection,
            fontSize: 8,
            margin: [0, 0, 2, 0],
          },
        ]);
      }

      allContent.push({
        table: {
          widths: ['20%', '80%'],
          body: infoRows,
        },
        layout: outerBorderLayout,
        margin: [0, 0, 0, 16],
      });

      // Build each applicant for this position
      for (let idx = 0; idx < posApplicants.length; idx++) {
        const applicant = posApplicants[idx];
        const isInternal = (applicant.applicant_type || '').toLowerCase() === 'internal';

        const fullName =
          ((applicant.firstname || '') + ' ' + (applicant.lastname || '')).trim() || 'N/A';
        const uniqueKey =
          applicant.ControlNo || applicant.nPersonalInfo_id || applicant.submission_id;
        const ageText =
          applicant.age !== undefined && applicant.age !== null && applicant.age !== ''
            ? String(applicant.age)
            : 'N/A';

        const hasImage = uniqueKey && imageMap[uniqueKey] && !DISABLE_ALL_IMAGES;
        const photoData = hasImage ? imageMap[uniqueKey] : null;

        let infoStack;
        if (isInternal) {
          infoStack = [
            {
              text: [{ text: 'Name: ' }, { text: (fullName || '').toUpperCase(), bold: true }],
              fontSize: 8,
              margin: [0, 0, 0, 0],
            },
            { text: 'Age: ' + ageText, fontSize: 8, margin: [0, 3, 0, 0] },
            {
              text: 'Current Position: ' + (applicant.current_position || 'N/A'),
              fontSize: 8,
              margin: [0, 3, 0, 0],
            },
            { text: 'Office: ' + (applicant.office || 'N/A'), fontSize: 8, margin: [0, 3, 0, 0] },
            {
              text: 'Length of Service: ' + (applicant.length_of_service || 'N/A'),
              fontSize: 8,
              margin: [0, 3, 0, 0],
            },
          ];
        } else {
          infoStack = [
            {
              text: [{ text: 'Name: ' }, { text: (fullName || '').toUpperCase(), bold: true }],
              fontSize: 8,
              margin: [0, 0, 0, 0],
            },
            { text: 'Age: ' + ageText, fontSize: 8, margin: [0, 3, 0, 0] },
            { text: 'Applicant Type: Outsider', fontSize: 8, margin: [0, 3, 0, 0] },
          ];
        }

        // Add education and eligibility to info stack
        if (applicant.education && applicant.education.length > 0) {
          infoStack.push(
            { text: '', margin: [0, 4, 0, 0] },
            { text: 'Education:', fontSize: 7, bold: true, margin: [0, 4, 0, 2] },
          );
          applicant.education.forEach((edu) => {
            // const level = edu.level || edu.Education || 'Education';
            // const school = edu.school_name || edu.School || 'N/A';
            const degree = edu.degree || edu.Degree || 'N/A';
            const year = edu.year_graduated || edu.DateAttend || '';
            infoStack.push({
              text: ` ${degree}${year ? ' (' + year + ')' : ''}`,
              fontSize: 6,
              margin: [0, 0, 0, 2],
            });
          });
        }

        if (applicant.eligibility && applicant.eligibility.length > 0) {
          infoStack.push({ text: 'Eligibility:', fontSize: 7, bold: true, margin: [0, 4, 0, 2] });
          applicant.eligibility.forEach((elig) => {
            const name = elig.eligibility || elig.CivilServe || 'Eligibility';
            const rating = elig.rating || elig.Rates || 'N/A';
            const date = elig.date_of_examination || elig.Dates || '';
            infoStack.push({
              text: `${name} (${rating})${date ? ' - ' + date : ''}`,
              fontSize: 6,
              margin: [0, 0, 0, 2],
            });
          });
        }

        const imageStack = [];
        if (photoData && isSupportedImageDataUrl(photoData) && !DISABLE_ALL_IMAGES) {
          imageStack.push({
            image: photoData,
            fit: [100, 100],
            alignment: 'center',
            margin: [0, 8, 0, 8],
          });
          console.log(`✅ Adding photo for ${fullName}`);
        } else {
          console.log(`❌ No photo for ${fullName}`);
          imageStack.push({
            text: 'No Photo',
            alignment: 'center',
            margin: [0, 40, 0, 40],
            fontSize: 8,
            color: '#999',
          });
        }

        const applicantTable = {
          table: {
            widths: ['8%', '22%', '*'],
            body: [
              [
                {
                  stack: [
                    {
                      text: 'RANK',
                      fontSize: 8,
                      bold: true,
                      alignment: 'center',
                      color: '#666',
                      margin: [0, 10, 0, 5],
                    },
                    {
                      text: (applicant.rank || idx + 1).toString(),
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, 0, 0, 10],
                    },
                  ],
                  alignment: 'center',
                  margin: [0, 15, 0, 15],
                },
                {
                  stack: imageStack,
                  alignment: 'center',
                  border: [true, true, true, true],
                },
                {
                  stack: infoStack,
                  margin: [12, 14, 12, 14],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function () {
              return 0;
            },
            vLineWidth: function () {
              return 0;
            },
            paddingLeft: function () {
              return 4;
            },
            paddingRight: function () {
              return 4;
            },
            paddingTop: function () {
              return 4;
            },
            paddingBottom: function () {
              return 4;
            },
          },
          margin: [0, 0, 0, 6],
          unbreakable: true,
        };

        allContent.push(applicantTable);
      }

      // positionIndex++;
    }

    const docDefinition = {
      pageSize: 'Legal',
      pageOrientation: 'portrait',
      pageMargins: [40, 110, 40, 50],
      header: function () {
        const headerImageStack = [];
        if (!DISABLE_ALL_IMAGES && logoBase64 && isSupportedImageDataUrl(logoBase64)) {
          headerImageStack.push({
            image: logoBase64,
            fit: [50, 50],
            alignment: 'center',
            margin: [0, 11, 0, 0],
          });
        }

        return {
          table: {
            widths: ['*', 60, 5, 360, '*'],
            heights: [72],
            body: [
              [
                { text: '', fillColor: '#008000' },
                {
                  fillColor: '#008000',
                  stack: headerImageStack,
                },
                { text: '', fillColor: '#008000' },
                {
                  fillColor: '#008000',
                  stack: [
                    {
                      canvas: [
                        {
                          type: 'rect',
                          x: 0,
                          y: 0,
                          w: 360,
                          h: 28,
                          lineWidth: 1.5,
                          lineColor: '#FFFFFF',
                          color: null,
                        },
                      ],
                      margin: [0, 22, 0, 0],
                    },
                    {
                      text: headerTitleText,
                      color: 'white',
                      fontSize: 11,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -20, 0, 0],
                    },
                  ],
                },
                { text: '', fillColor: '#008000' },
              ],
            ],
          },
          layout: headerLayout,
        };
      },
      footer: function (currentPage, pageCount) {
        return {
          text: 'Page ' + currentPage + ' of ' + pageCount,
          alignment: 'right',
          fontSize: 8,
          margin: [0, 10, 30, 0],
        };
      },
      content: allContent,
      styles: { tableHeader: { fontSize: 8, bold: true } },
      defaultStyle: { fontSize: 8 },
    };

    try {
      console.log('Generating PDF...');
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);

      return new Promise((resolve, reject) => {
        pdfDocGenerator.getBlob(function (blob) {
          try {
            console.log('PDF blob generated, size:', blob.size);
            const url = URL.createObjectURL(blob);
            pdfUrl.value = url;
            console.log('PDF URL set:', url);

            nextTick(() => {
              console.log('PDF generated successfully');
              resolve();
            });
          } catch (error) {
            console.error('Error creating blob URL:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      DISABLE_ALL_IMAGES = true;
      console.log('Retrying without images...');
      await generatePdfContent();
    }
  }

  onUnmounted(function () {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }
    if (rejectionHandler) {
      window.removeEventListener('unhandledrejection', rejectionHandler);
    }
  });

  onMounted(async function () {
    rejectionHandler = (event) => {
      const reasonText =
        typeof event.reason === 'string' ? event.reason : event.reason?.message || '';
      if (reasonText.includes('Invalid image')) {
        event.preventDefault();
        console.error(
          'Caught pdfmake image error via unhandledrejection, retrying without images.',
        );
        DISABLE_ALL_IMAGES = true;
        generatePdfContent();
      }
    };
    window.addEventListener('unhandledrejection', rejectionHandler);

    await fetchReportData();
    await generatePdfContent();

    console.log('Final state:', {
      hasPdfUrl: !!pdfUrl.value,
      pdfUrlValue: pdfUrl.value,
      reportData: !!reportData.value,
      applicants: applicantsArray.value.length,
    });
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
