import { defineStore } from 'pinia';
import { adminApi } from 'src/boot/axios_admin';
import { raterApi } from 'boot/axios_rater';
import { toast } from 'src/boot/toast'; // Import toast instance

export const usePlantillaStore = defineStore('plantilla', {
  state: () => ({
    plantilla: [],
    office: [],
    plantillaData: [],
    employee: [],
    vice: [],
    qsData: [],
    qsLoad: false,
    loading: false,
    error: null,
    selectedDetails: null,
    offices: [],

    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  }),

  actions: {
    // async fetchPlantilla() {
    //   this.loading = true;
    //   this.error = null;
    //   try {
    //     const response = await adminApi.get('/plantilla');

    //     // console.log(response.data); // Debugging

    //     if (Array.isArray(response.data)) {
    //       this.plantilla = response.data;
    //     } else {
    //       console.error('Unexpected response format', response.data);
    //       this.plantilla = [];
    //     }
    //   } catch (error) {
    //     this.loading = false;
    //     console.error('Fetch error:', error); // Debugging
    //     toast.error('Failed to Load Plantilla');
    //     this.error = error;
    //   } finally {
    //     this.loading = false;
    //   }
    // },
    async plantillaPublication(office) {
      // ✅ accept office as parameter
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get('/plantilla/publication', {
          params: { office }, // sends as ?office=...
        });
        this.plantilla = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to Load Plantilla');
        this.error = error;
      } finally {
        this.loading = false;
      }
    },
    async fetchPlantilla(office) {
      // ✅ accept office as parameter
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get('/plantilla', {
          params: { office }, // sends as ?office=...
        });
        this.plantilla = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to Load Plantilla');
        this.error = error;
      } finally {
        this.loading = false;
      }
    },
    async plantillaOffice() {
      this.loading = true;
      try {
        const response = await adminApi.get('/plantilla/offices');

        this.offices = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        this.error = error;
      } finally {
        this.loading = false;
      }
    },
    // async plantillaOffice() {
    // this.loading = true;
    // this.error = null;
    // try {
    //   const response = await adminApi.get('/plantilla/offices');

    //   // Log the full response
    //   console.log('Full Response:', response);

    //   // Extract data safely
    //   this.plantilla = Array.isArray(response.data) ? response.data : [];

    //   // Log the data only
    //   console.log('Plantilla Data:', this.plantilla);

    // } catch (error) {
    //   console.error('Fetch error:', error);
    //   toast.error('Failed to Load Plantilla');
    //   this.error = error;
    // } finally {
    //   this.loading = false;
    // }
    // },
    //  // NEW: fetch plantilla filtered by office
    //     async fetchPlantillaByOffice(office) {
    //       this.loading = true;
    //       this.error = null;
    //       try {
    //         const response = await adminApi.get('/plantilla', {
    //           params: { office },
    //         });
    //         this.plantilla = Array.isArray(response.data) ? response.data : [];
    //       } catch (error) {
    //         console.error('Fetch error:', error);
    //         toast.error('Failed to Load Plantilla for selected office');
    //         this.plantilla = [];
    //         this.error = error;
    //       } finally {
    //         this.loading = false;
    //       }
    //     },

    async fetch_office_rater() {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get('/office/rater-list');

        // console.log(response.data); // Debugging

        if (Array.isArray(response.data)) {
          this.office = response.data;
        } else {
          console.error('Unexpected response format', response.data);
          this.office = [];
        }
      } catch (error) {
        this.loading = false;
        console.error('Fetch error:', error); // Debugging
        toast.error('Failed to Load office');
        this.error = error;
      } finally {
        this.loading = false;
      }
    },

    // async fetchEmployeeList() {
    //   this.loading = true;
    //   this.error = null;
    //   try {
    //     const response = await adminApi.get('/employee/list');

    //     // console.log(response.data) // Debugging

    //     if (Array.isArray(response.data)) {
    //       this.plantillaData = response.data;
    //     } else {
    //       console.error('Unexpected response format', response.data);
    //       this.plantillaData = [];
    //     }
    //   } catch (error) {
    //     console.error('Fetch error:', error); // Debugging
    //     toast.error('Failed to Load Plantilla Data');
    //     this.error = error;
    //     this.loading = false;
    //   } finally {
    //     this.loading = false;
    //   }
    // },

    async fetchPlantillaData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get('/plantillaData');

        // console.log(response.data) // Debugging

        if (Array.isArray(response.data)) {
          this.plantillaData = response.data;
        } else {
          console.error('Unexpected response format', response.data);
          this.plantillaData = [];
        }
      } catch (error) {
        console.error('Fetch error:', error); // Debugging
        toast.error('Failed to Load Plantilla Data');
        this.error = error;
        this.loading = false;
      } finally {
        this.loading = false;
      }
    },

    //
    async fetchQsData(PoitionID) {
      this.qsLoad = true;
      this.error = null;
      try {
        const response = await adminApi.post('/plantillaData/qs', {
          PositionID: PoitionID,
        });
        // console.log(response.data) // Debugging

        if (Array.isArray(response.data)) {
          this.qsData = response.data;
        } else {
          console.error('Unexpected response format', response.data);
          this.qsData = [];
        }
      } catch (error) {
        console.error('Fetch error:', error); // Debugging
        toast.error('Failed to Load Qs Data');
        this.error = error;
        this.qsLoad = false;
      } finally {
        this.qsLoad = false;
      }
    },

    async fetchQsDataRater(PoitionID) {
      this.qsLoad = true;
      this.error = null;
      try {
        const response = await raterApi.post('/plantillaData/qs', {
          PositionID: PoitionID,
        });
        // console.log(response.data) // Debugging

        if (Array.isArray(response.data)) {
          this.qsData = response.data;
        } else {
          console.error('Unexpected response format', response.data);
          this.qsData = [];
        }
      } catch (error) {
        console.error('Fetch error:', error); // Debugging
        toast.error('Failed to Load Qs Data');
        this.error = error;
        this.qsLoad = false;
      } finally {
        this.qsLoad = false;
      }
    },

    async fetchEmployeeWES(ControlNo) {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`/applicant/wes/${ControlNo}`);
        this.vice = response.data;
        return response.data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch job post: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchEmployeeWESRater(ControlNo) {
      this.loading = true;
      this.error = null;
      try {
        const response = await raterApi.get(`/applicant/wes/${ControlNo}`);
        this.vice = response.data;
        return response.data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch job post: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllEmployee({ page = 1, perPage = 10, search = '' } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`/employee/list`, {
          params: {
            page,
            per_page: perPage,
            search,
          },
        });
        this.employee = response.data.data;
        this.currentPage = response.data.current_page;
        this.lastPage = response.data.last_page;
        this.total = response.data.total;
        this.perPage = response.data.per_page;

        return response.data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch job post: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchVice(Designation, status) {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`appointment/vice/name/${Designation}/${status}`);
        this.vice = response.data;
        return response.data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch job post: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchEffectivityDate() {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`appointment/effective/date/list`);
        this.vice = response.data;
        return response.data;
      } catch (err) {
        this.error = err;
        toast.error('Failed to fetch job post: ' + (err.response?.data?.message || err.message));
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchDeliberationDate() {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`/appointment/deliberation/date/list`);
        this.vice = response.data;
        return response.data;
      } catch (err) {
        this.error = err;
        toast.error(
          'Failed to fetch deliberation date: ' + (err.response?.data?.message || err.message),
        );
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async addEmployee(payload) {
      try {
        this.loading = true;
        const response = await adminApi.post(`/appointment`, payload, {
          validateStatus: (status) => status < 500,
        });
        return response;
      } catch (err) {
        console.error('Error hiring applicant:', err.message || err);
        return { data: { success: false, message: 'An error occurred' } };
      } finally {
        this.loading = false;
      }
    },

    async editEmployee(ControlNo, payload) {
      try {
        this.loading = true;
        const response = await adminApi.post(`/employee/update/${ControlNo}`, payload, {
          validateStatus: (status) => status < 500,
        });
        return response;
      } catch (err) {
        console.error('Error hiring applicant:', err.message || err);
        return { data: { success: false, message: 'An error occurred' } };
      } finally {
        this.loading = false;
      }
    },

    async fetchAppointmentData(ControlNo) {
      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.get(`plantilla/appointment/${ControlNo}`);

        console.log('Appointment data:', response.data); // Debugging

        if (response.data && response.data.length > 0) {
          // Find the main appointment data (first object with ControlNo)
          const mainAppointment = response.data.find((item) => item.ControlNo === ControlNo);
          // Find the office head (the object with "CITY GOVERNMENT DEPARTMENT HEAD I" position)
          const officeHead = response.data.find(
            (item) =>
              item.position === 'CITY GOVERNMENT DEPARTMENT HEAD I' &&
              item.office === mainAppointment?.Office,
          );

          // Access the first element of each array
          const plantillaInfo = mainAppointment?.active?.[0];
          const tempRegInfo = mainAppointment?.temp_reg_appointments?.[0];
          const reorgExtInfo = mainAppointment?.temp_reg_appointment_reorg_ext?.[0];
          const x_personal = mainAppointment?.x_personal?.[0];
          const jobpost = mainAppointment?.posting_date?.[0];
          const plantilla = mainAppointment?.plantilla?.[0];

          const transformedData = {
            // Basic Info
            SalaryAnnual: mainAppointment?.RateYear || '',
            TINNo: x_personal?.TINNo || '',
            Address: x_personal?.Address || '',
            Sex: plantillaInfo?.Sex,
            Name4: plantillaInfo?.Name4 || '',
            Firstname: x_personal?.Firstname || '',
            MIddlename: x_personal?.MIddlename || '',
            Surname: x_personal?.Surname || '',
            BirthDate: x_personal?.BirthDate || '',

            post_date: jobpost?.post_date || '',
            end_date: jobpost?.end_date || '',

            // Position Info
            NewDesignation: tempRegInfo?.NewDesignation || tempRegInfo?.Designation || '',
            SG: tempRegInfo?.SG || '',
            Step: tempRegInfo?.Step || '',
            Status: tempRegInfo?.Status || '',
            NewOffice: tempRegInfo?.NewOffice || tempRegInfo?.Office || '',
            MRate: tempRegInfo?.MRate || '',
            ItemNo: tempRegInfo?.ItemNo || '',
            Pages: tempRegInfo?.Pages || '',
            Office2: plantilla?.office2 || '',
            Group: plantilla?.group || '',
            Division: plantilla?.division || '',
            Section: plantilla?.section || '',
            Unit: plantilla?.unit || '',

            // Appointment Details
            Renew: tempRegInfo?.Renew || '',
            vicename: tempRegInfo?.vicename || '',
            vicecause: tempRegInfo?.vicecause || '',
            sepcause: tempRegInfo?.sepcause || '',
            sepdate: tempRegInfo?.sepdate || '',
            deliberation_date: tempRegInfo?.deliberation_date || '',
            employmenttype: tempRegInfo?.employment_type || '',

            // Date Range
            EffectiveDate: mainAppointment?.effectiveDate || '',
            FromDate: mainAppointment?.FromDate || '',
            ToDate: mainAppointment?.ToDate || '',

            // Extended Info from temp_reg_appointment_reorg_ext
            tempId: reorgExtInfo?.tempId || '',
            PresAppro: reorgExtInfo?.PresAppro || '',
            PrevAppro: reorgExtInfo?.PrevAppro || '',
            SalAuthorized: reorgExtInfo?.SalAuthorized || '',
            OtherComp: reorgExtInfo?.OtherComp || '',
            SupPosition: reorgExtInfo?.SupPosition || '',
            HSupPosition: reorgExtInfo?.HSupPosition || '',
            Tool: reorgExtInfo?.Tool || '',

            // Contact Requirements
            Contact1: reorgExtInfo?.Contact1 || '',
            Contact2: reorgExtInfo?.Contact2 || '',
            Contact3: reorgExtInfo?.Contact3 || '',
            Contact4: reorgExtInfo?.Contact4 || '',
            Contact5: reorgExtInfo?.Contact5 || '',
            Contact6: reorgExtInfo?.Contact6 || '',
            ContactOthers: reorgExtInfo?.ContactOthers || '',

            // Working Conditions
            Working1: reorgExtInfo?.Working1 || '',
            Working2: reorgExtInfo?.Working2 || '',
            WorkingOthers: reorgExtInfo?.WorkingOthers || '',

            // Descriptions
            DescriptionSection: reorgExtInfo?.DescriptionSection || '',
            DescriptionFunction: reorgExtInfo?.DescriptionFunction || '',

            // Standards/Qualifications
            StandardEduc: reorgExtInfo?.StandardEduc || '',
            StandardExp: reorgExtInfo?.StandardExp || '',
            StandardTrain: reorgExtInfo?.StandardTrain || '',
            StandardElig: reorgExtInfo?.StandardElig || '',

            // Supervisor
            Supervisor: reorgExtInfo?.Supervisor || '',

            // Competency Levels
            Core1: reorgExtInfo?.Core1 || '0',
            Core2: reorgExtInfo?.Core2 || '0',
            Core3: reorgExtInfo?.Core3 || '0',
            Corelevel1: reorgExtInfo?.Corelevel1 || '0',
            Corelevel2: reorgExtInfo?.Corelevel2 || '0',
            Corelevel3: reorgExtInfo?.Corelevel3 || '0',
            Corelevel4: reorgExtInfo?.Corelevel4 || '0',

            // Leadership Levels
            Leader1: reorgExtInfo?.Leader1 || '0',
            Leader2: reorgExtInfo?.Leader2 || '0',
            Leader3: reorgExtInfo?.Leader3 || '0',
            Leader4: reorgExtInfo?.Leader4 || '0',
            leaderlevel1: reorgExtInfo?.leaderlevel1 || '0',
            leaderlevel2: reorgExtInfo?.leaderlevel2 || '0',
            leaderlevel3: reorgExtInfo?.leaderlevel3 || '0',
            leaderlevel4: reorgExtInfo?.leaderlevel4 || '0',

            // Structure ID
            StructureID: tempRegInfo?.StructureID || reorgExtInfo?.structureid || '',

            // Additional Fields
            DivCode: tempRegInfo?.DivCode || '',
            SecCode: tempRegInfo?.SecCode || '',
            OffCode: tempRegInfo?.OffCode || '',
            DesigCode: tempRegInfo?.DesigCode || '',
            Official: tempRegInfo?.Official || '0',
            Groupcode: tempRegInfo?.Groupcode || '',
            group: tempRegInfo?.group || '',
            unitcode: tempRegInfo?.unitcode || '',

            // Office Head Information
            officeHeadName: officeHead?.Name4 || '',
            officeHeadPosition: officeHead?.position || '',
            officeHeadOffice: officeHead?.office || '',

            // Default/Configurable Values
            vicemayor: 'ATTY. EVA LORRAINE E. ESTABILLO',
            cityaccountant: 'RAMIL Y. TIU, CPA',
            HR: 'JANYLENE A. PALERMO, MM',
            admin: 'EDGAR C. DE GUZMAN',
            mayor: 'REY T. UY',
            resolution: '',
            resolutionYear: '',
          };

          console.log('Transformed data:', transformedData); // Debug the transformed data

          return transformedData;
        }

        return null;
      } catch (error) {
        console.error('Fetch appointment error:', error);
        toast.error('Failed to load appointment data');
        this.error = error;
        return null;
      } finally {
        this.loading = false;
      }
    },
  },
});
