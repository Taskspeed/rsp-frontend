<template>
  <q-page
    class="pds-page"
    :style="{
      '--bar-offset': `${stickyBarHeight}px`,
      '--mobile-nav-offset': `${mobileNavHeight}px`,
    }"
  >
    <!-- ═══════════════════════ Sticky Top Bar ═══════════════════════ -->
    <q-card ref="stickyBarRef" flat bordered class="sticky-header-card">
      <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
        <div class="row items-center">
          <!-- Back Button -->
          <q-btn flat round dense icon="arrow_back" color="white" @click="goBack" class="q-mr-sm">
            <q-tooltip>Go Back</q-tooltip>
          </q-btn>
          <div>
            <div class="text-subtitle1 text-bold">Personal Information</div>
            <div class="text-caption text-blue-1">CS Form No. 212 &middot; Revised 2017</div>
          </div>
        </div>
        <q-btn
          unelevated
          rounded
          label="Submit"
          icon="check_circle"
          color="white"
          text-color="primary"
          :loading="isSubmitting"
          @click="submitForm"
        />
      </q-card-section>
    </q-card>

    <!-- ═══════════════════════ Mobile Section Nav (horizontal) ═══════════════════════ -->
    <div class="mobile-nav" ref="mobileNavRef">
      <div class="mobile-nav-scroll" ref="mobileNavScrollRef">
        <q-chip
          v-for="section in sections"
          :key="`mchip-${section.id}`"
          :ref="(el) => setChipRef(section.id, el)"
          clickable
          :outline="activeSection !== section.id"
          :color="activeSection === section.id ? 'primary' : 'grey-4'"
          :text-color="activeSection === section.id ? 'white' : 'grey-8'"
          :icon="section.icon"
          @click="scrollToSection(section.id)"
        >
          {{ section.label }}
        </q-chip>
      </div>
    </div>

    <!-- ═══════════════════════ Layout: Side Nav + Content ═══════════════════════ -->
    <div class="pds-layout">
      <!-- Desktop Side Navigation -->
      <aside class="side-nav">
        <q-card flat bordered class="side-nav-card">
          <q-card-section class="q-py-sm q-px-md bg-grey-2">
            <div class="text-caption text-grey-8 text-bold">JUMP TO SECTION</div>
          </q-card-section>
          <q-list separator>
            <q-item
              v-for="section in sections"
              :key="section.id"
              clickable
              v-ripple
              :active="activeSection === section.id"
              active-class="side-nav-active"
              @click="scrollToSection(section.id)"
            >
              <q-item-section avatar>
                <q-icon
                  :name="section.icon"
                  :color="activeSection === section.id ? 'primary' : 'grey-6'"
                  size="20px"
                />
              </q-item-section>
              <q-item-section>{{ section.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </aside>

      <!-- ═══════════════════════ Main Content ═══════════════════════ -->
      <div class="pds-content">
        <!-- Photo + Name Header -->
        <div id="section-photo" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <div class="photo-upload-wrap" @click="triggerFileSelect">
                    <q-img
                      :src="photoPreview || 'https://placehold.co/100'"
                      class="bg-grey-4 photo-thumb"
                      ratio="1"
                    />
                    <div class="photo-overlay">
                      <q-icon name="photo_camera" size="20px" color="white" />
                    </div>
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/*"
                      class="hidden-input"
                      @change="onPhotoSelected"
                    />
                  </div>
                  <div
                    class="text-caption text-grey-7 text-center q-mt-xs"
                    style="max-width: 150px"
                  >
                    2x2 ID Picture
                  </div>
                </div>
                <div class="col">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="form.personal.firstname"
                        label="First Name *"
                        outlined
                        dense
                        :disable="hasExistingPDS"
                        :rules="[
                          (val) => (!!val && val.trim().length > 0) || 'First Name is required',
                          (val) =>
                            onlyLettersAndSpaces(val) || 'First Name must contain letters only',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="form.personal.middlename"
                        label="Middle Name"
                        outlined
                        dense
                        :disable="hasExistingPDS"
                        :rules="[
                          (val) =>
                            !val ||
                            onlyLettersAndSpaces(val) ||
                            'Middle Name must contain letters only',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="form.personal.lastname"
                        label="Last Name *"
                        outlined
                        dense
                        :disable="hasExistingPDS"
                        :rules="[
                          (val) => (!!val && val.trim().length > 0) || 'Last Name is required',
                          (val) =>
                            onlyLettersAndSpaces(val) || 'Last Name must contain letters only',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="form.personal.name_extension"
                        label="Name Extension (Jr., Sr., etc.)"
                        outlined
                        dense
                        :disable="hasExistingPDS"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- I. Personal Information -->
        <div id="section-personal" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white q-py-sm">
              <div class="text-subtitle1 text-bold">I. Personal Information</div>
            </q-card-section>

            <q-card-section>
              <div class="section-label">Basic Information</div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.date_of_birth"
                    label="Date of Birth *"
                    outlined
                    dense
                    mask="##/##/####"
                    hint="DD/MM/YYYY"
                    :disable="hasExistingPDS"
                    :rules="[
                      (val) => !!val || 'Date of Birth is required',
                      (val) => isValidDate(val) || 'Please enter a valid date (DD/MM/YYYY)',
                      (val) => isNotFutureDate(val) || 'Date of Birth cannot be in the future',
                    ]"
                    lazy-rules
                  >
                    <template v-slot:append>
                      <q-icon name="event" :class="hasExistingPDS ? '' : 'cursor-pointer'">
                        <q-popup-proxy
                          v-if="!hasExistingPDS"
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date v-model="form.personal.date_of_birth" mask="DD/MM/YYYY" today-btn>
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.place_of_birth"
                    label="Place of Birth *"
                    outlined
                    dense
                    :rules="[
                      (val) => (!!val && val.trim().length > 0) || 'Place of Birth is required',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-2">
                  <q-select
                    v-model="form.personal.sex"
                    label="Sex *"
                    :options="sexOptions"
                    outlined
                    dense
                    :rules="[(val) => !!val || 'Sex is required']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-2">
                  <q-select
                    v-model="form.personal.civil_status"
                    label="Civil Status *"
                    :options="civilStatusOptions"
                    outlined
                    dense
                    :rules="[(val) => !!val || 'Civil Status is required']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-2">
                  <q-select
                    v-model="form.personal.blood_type"
                    label="Blood Type"
                    :options="bloodTypeOptions"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-2">
                  <q-input
                    v-model.number="form.personal.height"
                    label="Height (m)"
                    outlined
                    dense
                    type="number"
                    step="0.01"
                    min="0"
                    max="2.99"
                    :rules="[
                      (val) =>
                        !val ||
                        (isFiniteNumber(val) && parseFloat(val) > 0 && parseFloat(val) < 3) ||
                        'Please enter valid height (0-3m)',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-2">
                  <q-input
                    v-model.number="form.personal.weight"
                    label="Weight (kg)"
                    outlined
                    dense
                    type="number"
                    step="0.1"
                    min="0"
                    max="499"
                    :rules="[
                      (val) =>
                        !val ||
                        (isFiniteNumber(val) && parseFloat(val) > 0 && parseFloat(val) < 500) ||
                        'Please enter valid weight',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.personal.cellphone_number"
                    label="Cellphone Number *"
                    outlined
                    dense
                    mask="###############"
                    hint="09XXXXXXXXX (11 digits)"
                    :rules="[
                      (val) => !!val || 'Cellphone Number is required',
                      (val) => {
                        const cleaned = (val || '').replace(/\D/g, '');
                        const isValid =
                          /^(09|\+639)\d{9}$/.test(cleaned) || /^09\d{9}$/.test(cleaned);
                        return isValid || 'Invalid Philippine mobile number (09XXXXXXXXX)';
                      },
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.personal.telephone_number"
                    label="Telephone Number"
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val ||
                        /^[0-9+\-() ]{6,20}$/.test(val) ||
                        'Please enter a valid telephone number',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.personal.email_address"
                    label="Email Address *"
                    outlined
                    dense
                    type="email"
                    disable
                    :rules="[
                      (val) => !!val || 'Email Address is required',
                      (val) =>
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
                        'Invalid email format (example@domain.com)',
                    ]"
                    lazy-rules
                  >
                    <template v-slot:append>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="section-label">Additional Information</div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.citizenship"
                    label="Citizenship *"
                    outlined
                    dense
                    :rules="[
                      (val) => (!!val && val.trim().length > 0) || 'Citizenship is required',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.religion"
                    label="Religious Affiliation"
                    outlined
                    dense
                  />
                </div>
              </div>

              <!-- Gender Reference Row -->
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-select
                    v-model="form.personal.gender_reference"
                    label="Gender Reference"
                    outlined
                    dense
                    :options="genderReferenceOptions"
                    emit-value
                    map-options
                    option-value="value"
                    option-label="label"
                    clearable
                  ></q-select>
                </div>
                <div
                  v-if="form.personal.gender_reference === 'Other'"
                  class="col-12 col-sm-6 col-md-8"
                >
                  <q-input
                    v-model="form.personal.gender_other"
                    label="Please specify your gender reference"
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        (!!val && val.trim().length > 0) || 'Please specify your gender reference',
                    ]"
                    lazy-rules
                  />
                </div>
              </div>

              <!-- Ethnic Group Row -->
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-select
                    v-model="form.personal.ethnic_group"
                    label="Ethnic Group"
                    outlined
                    dense
                    :options="ethnicGroupOptions"
                    emit-value
                    map-options
                    option-value="value"
                    option-label="label"
                    clearable
                  ></q-select>
                </div>
                <div v-if="form.personal.ethnic_group === 'Other'" class="col-12 col-sm-6 col-md-8">
                  <q-input
                    v-model="form.personal.ethnic_other"
                    label="Please specify your ethnic group"
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        (!!val && val.trim().length > 0) || 'Please specify your ethnic group',
                    ]"
                    lazy-rules
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="section-label">Government IDs</div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.gsis_no"
                    label="GSIS ID No."
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val || /^[0-9-]{4,20}$/.test(val) || 'Please enter valid GSIS number',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.pagibig_no"
                    label="PAGIBIG ID No."
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val || /^[0-9-]{4,20}$/.test(val) || 'Please enter valid PAGIBIG number',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.philhealth_no"
                    label="PHILHEALTH ID No."
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val ||
                        /^[0-9-]{4,20}$/.test(val) ||
                        'Please enter valid PHILHEALTH number',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.sss_no"
                    label="SSS No."
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val || /^[0-9-]{4,20}$/.test(val) || 'Please enter valid SSS number',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.tin_no"
                    label="TIN No."
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val || /^[0-9-]{4,20}$/.test(val) || 'Please enter valid TIN number',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.personal.agency_employee_no"
                    label="Agency Employee No."
                    outlined
                    dense
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="section-label">Residential Address</div>
              <div class="row q-col-gutter-md q-mb-sm">
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.house"
                    label="House/Block/Lot No."
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.street"
                    label="Street/Purok *"
                    outlined
                    dense
                    :rules="[(val) => (!!val && val.trim().length > 0) || 'Street is required']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.subdivision"
                    label="Subdivision/Village"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.barangay"
                    label="Barangay *"
                    outlined
                    dense
                    :rules="[(val) => (!!val && val.trim().length > 0) || 'Barangay is required']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.city"
                    label="City/Municipality *"
                    outlined
                    dense
                    :rules="[
                      (val) => (!!val && val.trim().length > 0) || 'City/Municipality is required',
                    ]"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.province"
                    label="Province *"
                    outlined
                    dense
                    :rules="[(val) => (!!val && val.trim().length > 0) || 'Province is required']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.region"
                    label="Region *"
                    outlined
                    dense
                    :rules="[(val) => (!!val && val.trim().length > 0) || 'Region is required']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.residential.zip"
                    label="Zip Code *"
                    outlined
                    dense
                    mask="####"
                    :rules="[
                      (val) => !!val || 'Zip Code is required',
                      (val) => /^[0-9]{4}$/.test(val) || 'Please enter valid 4-digit zip code',
                    ]"
                    lazy-rules
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="row items-center justify-between q-mb-sm">
                <div class="section-label q-mb-none">Permanent Address</div>
                <q-checkbox
                  v-model="sameAsResidential"
                  label="Same as Residential Address"
                  dense
                  @update:model-value="onSameAddressToggle"
                />
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.house"
                    label="House/Block/Lot No."
                    outlined
                    dense
                    :disable="sameAsResidential"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.street"
                    label="Street/Purok *"
                    outlined
                    dense
                    :disable="sameAsResidential"
                    :rules="
                      sameAsResidential
                        ? []
                        : [(val) => (!!val && val.trim().length > 0) || 'Street is required']
                    "
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.subdivision"
                    label="Subdivision/Village"
                    outlined
                    dense
                    :disable="sameAsResidential"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.barangay"
                    label="Barangay *"
                    outlined
                    dense
                    :disable="sameAsResidential"
                    :rules="
                      sameAsResidential
                        ? []
                        : [(val) => (!!val && val.trim().length > 0) || 'Barangay is required']
                    "
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.city"
                    label="City/Municipality *"
                    outlined
                    dense
                    :disable="sameAsResidential"
                    :rules="
                      sameAsResidential
                        ? []
                        : [
                            (val) =>
                              (!!val && val.trim().length > 0) || 'City/Municipality is required',
                          ]
                    "
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.province"
                    label="Province *"
                    outlined
                    dense
                    :disable="sameAsResidential"
                    :rules="
                      sameAsResidential
                        ? []
                        : [(val) => (!!val && val.trim().length > 0) || 'Province is required']
                    "
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.region"
                    label="Region *"
                    outlined
                    dense
                    :disable="sameAsResidential"
                    :rules="
                      sameAsResidential
                        ? []
                        : [(val) => (!!val && val.trim().length > 0) || 'Region is required']
                    "
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <q-input
                    v-model="form.permanent.zip"
                    label="Zip Code *"
                    outlined
                    dense
                    mask="####"
                    :disable="sameAsResidential"
                    :rules="
                      sameAsResidential
                        ? []
                        : [
                            (val) => !!val || 'Zip Code is required',
                            (val) =>
                              /^[0-9]{4}$/.test(val) || 'Please enter valid 4-digit zip code',
                          ]
                    "
                    lazy-rules
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- XI. Upload PDS -->
        <div id="section-upload-pds" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white q-py-sm">
              <div class="text-subtitle1 text-bold">XI. Upload PDS</div>
            </q-card-section>

            <q-card-section>
              <q-banner class="upload-instruction-banner bg-amber-1 text-amber q-mb-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" />
                </template>
                <div class="banner-text">
                  <strong>Upload your Personal Data Sheet (PDS):</strong>
                  <ul class="q-mt-sm q-mb-none" style="padding-left: 20px">
                    <li>
                      Upload a fully accomplished Personal Data Sheet (PDS) using the latest
                      CSC-prescribed CS Form No. 212 (Revised 2026) with a recent passport-sized
                      photograph.
                    </li>
                    <li>File must be in PDF or image format (JPG, JPEG, PNG).</li>
                    <li>Maximum file size: 5 MB.</li>
                  </ul>
                </div>
              </q-banner>

              <div class="upload-section q-pa-md">
                <div class="upload-label text-grey-7 q-mb-sm">
                  <q-icon name="attach_file" size="20px" class="q-mr-xs" />
                  <span class="text-subtitle2">PDS File</span>
                  <span class="text-caption text-grey-6 q-ml-sm">(CS Form No. 212)</span>
                </div>

                <!-- Existing PDS file(s) already on record -->
                <div v-if="existingPdsFiles.length && !replacePds" class="q-mb-sm">
                  <q-list bordered separator class="rounded-borders">
                    <q-item v-for="(pf, i) in existingPdsFiles" :key="`pds-existing-${i}`">
                      <q-item-section avatar>
                        <q-icon name="picture_as_pdf" color="red" size="28px" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-caption ellipsis" style="max-width: 320px">
                          {{ pf.name }}
                        </q-item-label>
                        <q-item-label caption>Already uploaded</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          flat
                          dense
                          round
                          icon="visibility"
                          color="primary"
                          @click="viewAttachment(pf.url, pf.name)"
                        >
                          <q-tooltip>View File</q-tooltip>
                        </q-btn>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="primary"
                    icon="autorenew"
                    label="Replace PDS File"
                    class="q-mt-xs"
                    @click="replacePds = true"
                  />
                </div>

                <!-- Upload input: shown only when there's nothing on record, or user chose to replace -->
                <template v-if="!existingPdsFiles.length || replacePds">
                  <q-file
                    v-model="form.pdsFile"
                    label="Upload PDS (PDF, JPG, JPEG, PNG)"
                    outlined
                    dense
                    accept=".pdf,.jpg,.jpeg,.png"
                    stack-label
                    max-file-size="10485760"
                    @rejected="onFileRejected"
                    :rules="[
                      (val) => {
                        if (replacePds || !existingPdsFiles.length) {
                          return !!val || 'PDS file is required';
                        }
                        return true;
                      },
                      (val) => {
                        if (!val) return true;
                        const size = val.size || 0;
                        return size <= 10485760 || 'File size must be less than 10MB';
                      },
                    ]"
                    lazy-rules
                  >
                    <template v-slot:prepend>
                      <q-icon name="description" color="primary" />
                    </template>
                    <template v-slot:append>
                      <q-icon name="cloud_upload" color="primary" />
                    </template>
                  </q-file>
                  <q-btn
                    v-if="replacePds && existingPdsFiles.length"
                    flat
                    dense
                    size="sm"
                    color="grey-7"
                    label="Cancel Replace"
                    class="q-mt-xs"
                    @click="cancelReplacePds"
                  />
                </template>

                <div class="text-caption text-grey-6 q-mt-xs">
                  <q-icon name="info" size="14px" class="q-mr-xs" />
                  Please upload a completed and signed PDS file.
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- II. Family Background -->
        <div id="section-family" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white q-py-sm">
              <div class="text-subtitle1 text-bold">II. Family Background</div>
            </q-card-section>

            <q-card-section>
              <div class="section-label">Spouse's Information</div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.spouse_firstname"
                    label="Spouse's Firstname"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.spouse_name"
                    label="Spouse's Surname"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.spouse_middlename"
                    label="Spouse's Middlename"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.spouse_occupation"
                    label="Occupation"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.spouse_employer"
                    label="Employer/Business Name"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.spouse_employer_address"
                    label="Business Address"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.family.spouse_employer_telephone"
                    label="Business Telephone"
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        !val ||
                        /^[0-9+\-() ]{6,20}$/.test(val) ||
                        'Please enter a valid telephone number',
                    ]"
                    lazy-rules
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="section-label">Parent's Information</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.father_firstname"
                    label="Father's Firstname"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.father_lastname"
                    label="Father's Surname"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.father_middlename"
                    label="Father's Middlename"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.mother_firstname"
                    label="Mother's Firstname"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.mother_lastname"
                    label="Mother's Surname"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <q-input
                    v-model="form.family.mother_middlename"
                    label="Mother's Middlename"
                    outlined
                    dense
                    :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                    lazy-rules
                  />
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="row items-center justify-between q-mb-sm">
                <div class="section-label q-mb-none">Children's Information</div>
                <q-btn
                  unelevated
                  rounded
                  label="Add Child"
                  icon="add"
                  color="primary"
                  size="sm"
                  @click="addChild"
                />
              </div>

              <q-card
                v-for="(child, idx) in form.children"
                :key="`child-${idx}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section class="row items-center q-gutter-x-md q-py-sm">
                  <div class="text-grey-7 text-caption col-auto">#{{ idx + 1 }}</div>
                  <div class="col">
                    <q-input
                      v-model="child.child_name"
                      label="Full Name"
                      outlined
                      dense
                      :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                      lazy-rules
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="child.birth_date"
                      label="Birth Date (DD/MM/YYYY)"
                      outlined
                      dense
                      mask="##/##/####"
                      :rules="[
                        (val) => !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        (val) =>
                          !val || isNotFutureDate(val) || 'Birth date cannot be in the future',
                      ]"
                      lazy-rules
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="child.birth_date" mask="DD/MM/YYYY" today-btn>
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeChild(idx)"
                  />
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.children.length" class="text-grey-7 bg-grey-2" rounded>
                No children added. Click "Add Child" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- III. Educational Background -->
        <div id="section-education" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
              <div class="text-subtitle1 text-bold">III. Educational Background</div>
              <q-btn
                unelevated
                rounded
                label="Add Row"
                icon="add"
                color="white"
                text-color="primary"
                size="sm"
                @click="addEducation"
              />
            </q-card-section>

            <q-card-section>
              <q-banner class="upload-instruction-banner bg-blue-1 text-blue q-mb-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" />
                </template>
                <div class="banner-text">
                  <strong>Upload supporting documents:</strong>
                  For each educational record, you can upload relevant documents such as diplomas,
                  transcript of records, or certificates of graduation. Make it one PDF file for
                  multiple documents.
                  <strong>Maximum file size: 5MB.</strong>
                </div>
              </q-banner>

              <q-card
                v-for="(row, idx) in form.education"
                :key="`educ-${idx}`"
                flat
                bordered
                class="q-mb-md"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-bold text-grey-7">Row #{{ idx + 1 }}</div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeRow('education', idx)"
                    />
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-4">
                      <q-select
                        v-model="row.level"
                        label="Level"
                        :options="levelOptions"
                        outlined
                        dense
                        :rules="[(val) => !!val || 'Level is required']"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-8">
                      <q-input
                        v-model="row.school_name"
                        label="School Name"
                        outlined
                        dense
                        :rules="[
                          (val) => (!!val && val.trim().length > 0) || 'School Name is required',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input v-model="row.degree" label="Degree / Course" outlined dense />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.attendance_from"
                        label="From (Year)"
                        outlined
                        dense
                        mask="####"
                        hint="YYYY"
                        :rules="[
                          (val) =>
                            !val || /^[0-9]{4}$/.test(val) || 'Please enter a valid year (YYYY)',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.attendance_to"
                        label="To (Year)"
                        outlined
                        dense
                        mask="####"
                        hint="YYYY"
                        :rules="[
                          (val) =>
                            !val || /^[0-9]{4}$/.test(val) || 'Please enter a valid year (YYYY)',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model.number="row.highest_units"
                        label="Highest Units Earned"
                        outlined
                        dense
                        type="number"
                        min="0"
                        step="1"
                        :rules="[
                          (val) =>
                            !val ||
                            (isFiniteNumber(val) && parseFloat(val) >= 0) ||
                            'Please enter a valid number of units',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.year_graduated"
                        label="Year Graduated"
                        outlined
                        dense
                        mask="####"
                        :rules="[
                          (val) =>
                            !val || /^[0-9]{4}$/.test(val) || 'Please enter valid year (YYYY)',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="row.scholarship"
                        label="Scholarship / Honors"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select
                        v-model="row.graduated"
                        label="Graduated?"
                        :options="yesNoOptions"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12">
                      <div class="upload-section">
                        <div class="upload-label text-grey-7 q-mb-xs">
                          <q-icon name="attach_file" size="16px" class="q-mr-xs" />
                          <span class="text-caption">Upload Supporting Documents</span>
                        </div>

                        <div
                          v-if="row.existingAttachment && !row.replaceFile"
                          class="existing-attachment-box q-mb-xs"
                        >
                          <q-icon
                            name="insert_drive_file"
                            color="primary"
                            size="18px"
                            class="q-mr-xs"
                          />
                          <span class="text-caption text-grey-8 ellipsis">
                            {{ getFileNameFromPath(row.existingAttachment) }}
                          </span>
                          <q-space />
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="visibility"
                            color="primary"
                            @click="
                              viewAttachment(
                                row.existingAttachmentUrl,
                                getFileNameFromPath(row.existingAttachment),
                              )
                            "
                          >
                            <q-tooltip>View</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="autorenew"
                            color="grey-7"
                            @click="row.replaceFile = true"
                          >
                            <q-tooltip>Replace File</q-tooltip>
                          </q-btn>
                        </div>

                        <q-file
                          v-if="!row.existingAttachment || row.replaceFile"
                          v-model="row.file"
                          label="Upload document(s) (PDF, JPG, PNG)"
                          outlined
                          dense
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          use-chips
                          stack-label
                          max-file-size="10485760"
                          @rejected="onFileRejected"
                        >
                          <template v-slot:append>
                            <q-icon name="cloud_upload" />
                          </template>
                        </q-file>
                        <q-btn
                          v-if="row.replaceFile && row.existingAttachment"
                          flat
                          dense
                          size="sm"
                          color="grey-7"
                          label="Cancel Replace"
                          class="q-mt-xs"
                          @click="
                            row.replaceFile = false;
                            row.file = null;
                          "
                        />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.education.length" class="text-grey-7 bg-grey-2" rounded>
                No education records. Click "Add Row" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- IV. Civil Service Eligibility -->
        <div id="section-eligibility" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
              <div class="text-subtitle1 text-bold">IV. Civil Service Eligibility</div>
              <q-btn
                unelevated
                rounded
                label="Add Row"
                icon="add"
                color="white"
                text-color="primary"
                size="sm"
                @click="addEligibility"
              />
            </q-card-section>

            <q-card-section>
              <q-banner class="upload-instruction-banner bg-orange-1 text-orange q-mb-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" />
                </template>
                <div class="banner-text">
                  <strong>Upload supporting documents:</strong>
                  For each eligibility record, you can upload certificates, ratings, or license
                  documents. Make it one PDF file for multiple documents.
                  <strong>Maximum file size: 5MB.</strong>
                </div>
              </q-banner>

              <q-card
                v-for="(row, idx) in form.eligibility"
                :key="`elig-${idx}`"
                flat
                bordered
                class="q-mb-md"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-bold text-grey-7">Row #{{ idx + 1 }}</div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeRow('eligibility', idx)"
                    />
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="row.eligibility"
                        label="Eligibility / Career Service"
                        outlined
                        dense
                        :rules="[
                          (val) => (!!val && val.trim().length > 0) || 'Eligibility is required',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.rating"
                        label="Rating (if applicable)"
                        outlined
                        dense
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        :rules="[
                          (val) =>
                            !val ||
                            (isFiniteNumber(val) &&
                              parseFloat(val) >= 0 &&
                              parseFloat(val) <= 100) ||
                            'Please enter a valid rating (0-100)',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.date_of_examination"
                        label="Date of Exam"
                        outlined
                        dense
                        mask="##/##/####"
                        hint="DD/MM/YYYY"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                          (val) => !val || isNotFutureDate(val) || 'Date cannot be in the future',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.date_of_examination" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="row.place_of_examination"
                        label="Place of Examination"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-4">
                      <q-input
                        v-model="row.license_number"
                        label="License Number"
                        outlined
                        dense
                        :rules="[
                          (val) =>
                            !val || /^[0-9-]+$/.test(val) || 'Please enter valid license number',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-4">
                      <q-input
                        v-model="row.date_of_validity"
                        label="Date of Validity"
                        outlined
                        dense
                        mask="##/##/####"
                        hint="DD/MM/YYYY"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.date_of_validity" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4">
                      <div class="upload-section">
                        <div class="upload-label text-grey-7 q-mb-xs">
                          <q-icon name="attach_file" size="16px" class="q-mr-xs" />
                          <span class="text-caption">Upload Supporting Documents</span>
                        </div>

                        <div
                          v-if="row.existingAttachment && !row.replaceFile"
                          class="existing-attachment-box q-mb-xs"
                        >
                          <q-icon
                            name="insert_drive_file"
                            color="primary"
                            size="18px"
                            class="q-mr-xs"
                          />
                          <span class="text-caption text-grey-8 ellipsis">
                            {{ getFileNameFromPath(row.existingAttachment) }}
                          </span>
                          <q-space />
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="visibility"
                            color="primary"
                            @click="
                              viewAttachment(
                                row.existingAttachmentUrl,
                                getFileNameFromPath(row.existingAttachment),
                              )
                            "
                          >
                            <q-tooltip>View</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="autorenew"
                            color="grey-7"
                            @click="row.replaceFile = true"
                          >
                            <q-tooltip>Replace File</q-tooltip>
                          </q-btn>
                        </div>

                        <q-file
                          v-if="!row.existingAttachment || row.replaceFile"
                          v-model="row.file"
                          label="Upload document(s) (PDF, JPG, PNG)"
                          outlined
                          dense
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          use-chips
                          stack-label
                          max-file-size="10485760"
                          @rejected="onFileRejected"
                        >
                          <template v-slot:append>
                            <q-icon name="cloud_upload" />
                          </template>
                        </q-file>
                        <q-btn
                          v-if="row.replaceFile && row.existingAttachment"
                          flat
                          dense
                          size="sm"
                          color="grey-7"
                          label="Cancel Replace"
                          class="q-mt-xs"
                          @click="
                            row.replaceFile = false;
                            row.file = null;
                          "
                        />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.eligibility.length" class="text-grey-7 bg-grey-2" rounded>
                No eligibility records. Click "Add Row" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- V. Work Experience -->
        <div id="section-work" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
              <div class="text-subtitle1 text-bold">V. Work Experience</div>
              <q-btn
                unelevated
                rounded
                label="Add Row"
                icon="add"
                color="white"
                text-color="primary"
                size="sm"
                @click="addWork"
              />
            </q-card-section>

            <q-card-section>
              <q-banner class="upload-instruction-banner bg-green-1 text-green q-mb-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" />
                </template>
                <div class="banner-text">
                  <strong>Upload supporting documents:</strong>
                  For each work experience, upload relevant documents such as:
                  <ul class="q-mt-sm q-mb-none" style="padding-left: 20px">
                    <li><strong>Certificate of Employment (COE)</strong></li>
                    <li><strong>Performance Rating</strong></li>
                    <li>
                      <strong>Work Experience Sheet (WES)</strong>
                      - Download the template below
                    </li>
                  </ul>
                  Make it one PDF file for multiple documents.
                  <strong>Maximum file size: 5MB.</strong>
                </div>
              </q-banner>

              <q-card
                v-for="(row, idx) in form.workExperience"
                :key="`work-${idx}`"
                flat
                bordered
                class="q-mb-md"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-bold text-grey-7">Row #{{ idx + 1 }}</div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeRow('workExperience', idx)"
                    />
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.work_date_from"
                        label="From (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.work_date_from" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.work_date_to"
                        label="To (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        hint="Or check 'Present' below"
                        :disable="row.currently_working"
                        :rules="[
                          (val) =>
                            row.currently_working ||
                            !!val ||
                            'Provide an end date or mark as Present',
                          (val) =>
                            row.currently_working ||
                            isValidDate(val) ||
                            'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer" v-if="!row.currently_working">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.work_date_to" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                      <q-checkbox
                        :model-value="row.currently_working"
                        label="Present (currently working here)"
                        dense
                        class="q-mt-xs"
                        @update:model-value="(val) => onTogglePresent(row, val)"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="row.position_title"
                        label="Position Title"
                        outlined
                        dense
                        :rules="[
                          (val) => (!!val && val.trim().length > 0) || 'Position Title is required',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="row.department"
                        label="Department / Office"
                        outlined
                        dense
                        :rules="[
                          (val) =>
                            (!!val && val.trim().length > 0) || 'Department / Office is required',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model.number="row.monthly_salary"
                        label="Monthly Salary"
                        outlined
                        dense
                        type="number"
                        min="0"
                        step="0.01"
                        :rules="[
                          (val) =>
                            !val ||
                            (isFiniteNumber(val) && parseFloat(val) >= 0) ||
                            'Please enter valid salary',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input v-model="row.salary_grade" label="Salary Grade" outlined dense />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select
                        v-model="row.status_of_appointment"
                        label="Status of Appointment"
                        :options="appointmentOptions"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select
                        v-model="row.government_service"
                        label="Gov't Service?"
                        :options="yesNoOptions"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12">
                      <div class="upload-section">
                        <div class="upload-label text-grey-7 q-mb-xs">
                          <q-icon name="attach_file" size="16px" class="q-mr-xs" />
                          <span class="text-caption">Upload Supporting Documents</span>
                          <span class="text-caption text-grey-6">
                            (COE, Performance Rating, WES)
                          </span>
                        </div>

                        <div
                          v-if="row.existingAttachment && !row.replaceFile"
                          class="existing-attachment-box q-mb-xs"
                        >
                          <q-icon
                            name="insert_drive_file"
                            color="primary"
                            size="18px"
                            class="q-mr-xs"
                          />
                          <span class="text-caption text-grey-8 ellipsis">
                            {{ getFileNameFromPath(row.existingAttachment) }}
                          </span>
                          <q-space />
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="visibility"
                            color="primary"
                            @click="
                              viewAttachment(
                                row.existingAttachmentUrl,
                                getFileNameFromPath(row.existingAttachment),
                              )
                            "
                          >
                            <q-tooltip>View</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="autorenew"
                            color="grey-7"
                            @click="row.replaceFile = true"
                          >
                            <q-tooltip>Replace File</q-tooltip>
                          </q-btn>
                        </div>

                        <q-file
                          v-if="!row.existingAttachment || row.replaceFile"
                          v-model="row.file"
                          label="Upload document(s) (PDF, JPG, PNG)"
                          outlined
                          dense
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          use-chips
                          stack-label
                          max-file-size="10485760"
                          @rejected="onFileRejected"
                        >
                          <template v-slot:append>
                            <q-icon name="cloud_upload" />
                          </template>
                        </q-file>
                        <q-btn
                          v-if="row.replaceFile && row.existingAttachment"
                          flat
                          dense
                          size="sm"
                          color="grey-7"
                          label="Cancel Replace"
                          class="q-mt-xs"
                          @click="
                            row.replaceFile = false;
                            row.file = null;
                          "
                        />
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="wes-download-section q-mt-sm">
                        <div class="row items-center">
                          <div class="col-auto">
                            <q-icon name="download" size="20px" color="green" class="q-mr-sm" />
                          </div>
                          <div class="col">
                            <div class="text-caption text-grey-7">
                              <strong>Work Experience Sheet (WES) Template</strong>
                              <span class="text-grey-6 q-ml-sm">
                                - Download, fill up, then upload as PDF or image
                              </span>
                            </div>
                            <q-btn
                              color="green"
                              size="sm"
                              unelevated
                              icon="download"
                              label="Download WES Template"
                              @click="downloadWES"
                              class="q-mt-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.workExperience.length" class="text-grey-7 bg-grey-2" rounded>
                No work experience records. Click "Add Row" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- VI. Voluntary Work -->
        <div id="section-voluntary" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
              <div class="text-subtitle1 text-bold">VI. Voluntary Work</div>
              <q-btn
                unelevated
                rounded
                label="Add Row"
                icon="add"
                color="white"
                text-color="primary"
                size="sm"
                @click="addVoluntary"
              />
            </q-card-section>

            <q-card-section>
              <q-card
                v-for="(row, idx) in form.voluntaryWork"
                :key="`vol-${idx}`"
                flat
                bordered
                class="q-mb-md"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-bold text-grey-7">Row #{{ idx + 1 }}</div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeRow('voluntaryWork', idx)"
                    />
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <q-input
                        v-model="row.organization_name"
                        label="Organization Name &amp; Address"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.inclusive_date_from"
                        label="From (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.inclusive_date_from" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.inclusive_date_to"
                        label="To (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.inclusive_date_to" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model.number="row.number_of_hours"
                        label="Number of Hours"
                        outlined
                        dense
                        type="number"
                        min="0"
                        step="0.5"
                        :rules="[
                          (val) =>
                            !val ||
                            (isFiniteNumber(val) && parseFloat(val) > 0) ||
                            'Please enter valid hours',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.position"
                        label="Position / Nature of Work"
                        outlined
                        dense
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.voluntaryWork.length" class="text-grey-7 bg-grey-2" rounded>
                No voluntary work records. Click "Add Row" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- VII. L&D Interventions -->
        <div id="section-training" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
              <div class="text-subtitle1 text-bold">VII. L&amp;D Interventions</div>
              <q-btn
                unelevated
                rounded
                label="Add Row"
                icon="add"
                color="white"
                text-color="primary"
                size="sm"
                @click="addTraining"
              />
            </q-card-section>

            <q-card-section>
              <q-banner class="upload-instruction-banner bg-purple-1 text-purple q-mb-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" />
                </template>
                <div class="banner-text">
                  <strong>Upload supporting documents:</strong>
                  For each training/L&D intervention, upload certificates of completion, attendance
                  certificates, or training records. Make it one PDF file for multiple documents.
                  <strong>Maximum file size: 5MB.</strong>
                </div>
              </q-banner>

              <q-card
                v-for="(row, idx) in form.training"
                :key="`train-${idx}`"
                flat
                bordered
                class="q-mb-md"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-bold text-grey-7">Row #{{ idx + 1 }}</div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeRow('training', idx)"
                    />
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <q-input
                        v-model="row.training_title"
                        label="Title of Learning &amp; Development Intervention"
                        outlined
                        dense
                        :rules="[(val) => (!!val && val.trim().length > 0) || 'Title is required']"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.inclusive_date_from"
                        label="From (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.inclusive_date_from" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-input
                        v-model="row.inclusive_date_to"
                        label="To (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.inclusive_date_to" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-6 col-md-2">
                      <q-input
                        v-model.number="row.number_of_hours"
                        label="No. of Hours"
                        outlined
                        dense
                        type="number"
                        min="0"
                        step="0.5"
                        :rules="[
                          (val) =>
                            !val ||
                            (isFiniteNumber(val) && parseFloat(val) > 0) ||
                            'Please enter valid hours',
                        ]"
                        lazy-rules
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-4">
                      <q-select
                        v-model="row.type"
                        label="Type"
                        :options="trainingTypeOptions"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="row.conducted_by"
                        label="Conducted / Sponsored By"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6 col-md-6">
                      <div class="upload-section">
                        <div class="upload-label text-grey-7 q-mb-xs">
                          <q-icon name="attach_file" size="16px" class="q-mr-xs" />
                          <span class="text-caption">Upload Supporting Documents</span>
                        </div>

                        <div
                          v-if="row.existingAttachment && !row.replaceFile"
                          class="existing-attachment-box q-mb-xs"
                        >
                          <q-icon
                            name="insert_drive_file"
                            color="primary"
                            size="18px"
                            class="q-mr-xs"
                          />
                          <span class="text-caption text-grey-8 ellipsis">
                            {{ getFileNameFromPath(row.existingAttachment) }}
                          </span>
                          <q-space />
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="visibility"
                            color="primary"
                            @click="
                              viewAttachment(
                                row.existingAttachmentUrl,
                                getFileNameFromPath(row.existingAttachment),
                              )
                            "
                          >
                            <q-tooltip>View</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="autorenew"
                            color="grey-7"
                            @click="row.replaceFile = true"
                          >
                            <q-tooltip>Replace File</q-tooltip>
                          </q-btn>
                        </div>

                        <q-file
                          v-if="!row.existingAttachment || row.replaceFile"
                          v-model="row.file"
                          label="Upload document(s) (PDF, JPG, PNG)"
                          outlined
                          dense
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          use-chips
                          stack-label
                          max-file-size="10485760"
                          @rejected="onFileRejected"
                        >
                          <template v-slot:append>
                            <q-icon name="cloud_upload" />
                          </template>
                        </q-file>
                        <q-btn
                          v-if="row.replaceFile && row.existingAttachment"
                          flat
                          dense
                          size="sm"
                          color="grey-7"
                          label="Cancel Replace"
                          class="q-mt-xs"
                          @click="
                            row.replaceFile = false;
                            row.file = null;
                          "
                        />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.training.length" class="text-grey-7 bg-grey-2" rounded>
                No training records. Click "Add Row" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- VIII. Other Information -->
        <div id="section-other" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white q-py-sm">
              <div class="text-subtitle1 text-bold">VIII. Other Information</div>
            </q-card-section>

            <q-card-section>
              <!-- Skills & Hobbies -->
              <div class="row items-center justify-between q-mb-sm">
                <div class="section-label q-mb-none">Special Skills &amp; Hobbies</div>
                <q-btn
                  unelevated
                  rounded
                  label="Add Skill"
                  icon="add"
                  color="primary"
                  size="sm"
                  @click="addSkill"
                />
              </div>
              <q-card
                v-for="(row, idx) in form.skills"
                :key="`skill-${idx}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section class="row items-center q-gutter-x-md q-py-sm">
                  <div class="text-grey-7 text-caption col-auto">#{{ idx + 1 }}</div>
                  <div class="col">
                    <q-input v-model="row.skill" label="Skill / Hobby" outlined dense />
                  </div>
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeRow('skills', idx)"
                  />
                </q-card-section>
              </q-card>
              <q-banner v-if="!form.skills.length" class="text-grey-7 bg-grey-2 q-mb-md" rounded>
                No skills or hobbies added yet.
              </q-banner>

              <q-separator class="q-my-md" />

              <!-- Non-Academic Distinctions -->
              <div class="row items-center justify-between q-mb-sm">
                <div class="section-label q-mb-none">Non-Academic Distinctions / Recognition</div>
                <q-btn
                  unelevated
                  rounded
                  label="Add Distinction"
                  icon="add"
                  color="primary"
                  size="sm"
                  @click="addDistinction"
                />
              </div>
              <q-card
                v-for="(row, idx) in form.distinctions"
                :key="`dist-${idx}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section class="row items-center q-gutter-x-md q-py-sm">
                  <div class="text-grey-7 text-caption col-auto">#{{ idx + 1 }}</div>
                  <div class="col">
                    <q-input
                      v-model="row.non_academic"
                      label="Distinction / Recognition"
                      outlined
                      dense
                      type="textarea"
                      rows="1"
                    />
                  </div>
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeRow('distinctions', idx)"
                  />
                </q-card-section>
              </q-card>
              <q-banner
                v-if="!form.distinctions.length"
                class="text-grey-7 bg-grey-2 q-mb-md"
                rounded
              >
                No non-academic distinctions added yet.
              </q-banner>

              <q-separator class="q-my-md" />

              <!-- Membership -->
              <div class="row items-center justify-between q-mb-sm">
                <div class="section-label q-mb-none">Membership in Association / Organization</div>
                <q-btn
                  unelevated
                  rounded
                  label="Add Membership"
                  icon="add"
                  color="primary"
                  size="sm"
                  @click="addMembership"
                />
              </div>
              <q-card
                v-for="(row, idx) in form.memberships"
                :key="`mem-${idx}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2 text-bold text-grey-7">
                      Membership #{{ idx + 1 }}
                    </div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeRow('memberships', idx)"
                    />
                  </div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <q-input
                        v-model="row.organization"
                        label="Organization / Association Name"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input v-model="row.position" label="Position / Role" outlined dense />
                    </div>
                    <div class="col-12 col-sm-3">
                      <q-input
                        v-model="row.inclusive_date_from"
                        label="From (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.inclusive_date_from" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                    <div class="col-12 col-sm-3">
                      <q-input
                        v-model="row.inclusive_date_to"
                        label="To (DD/MM/YYYY)"
                        outlined
                        dense
                        mask="##/##/####"
                        :rules="[
                          (val) =>
                            !val || isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                        ]"
                        lazy-rules
                      >
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="row.inclusive_date_to" mask="DD/MM/YYYY" today-btn>
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
              <q-banner v-if="!form.memberships.length" class="text-grey-7 bg-grey-2" rounded>
                No memberships added yet.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- IX. References -->
        <div id="section-references" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
              <div class="text-subtitle1 text-bold">IX. Character References</div>
              <q-btn
                unelevated
                rounded
                label="Add Row"
                icon="add"
                color="white"
                text-color="primary"
                size="sm"
                @click="addReference"
              />
            </q-card-section>

            <q-card-section>
              <q-card
                v-for="(row, idx) in form.references"
                :key="`ref-${idx}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section class="row items-center q-gutter-x-md q-py-sm">
                  <div class="text-grey-7 text-caption col-auto">#{{ idx + 1 }}</div>
                  <div class="col">
                    <q-input
                      v-model="row.full_name"
                      label="Full Name"
                      outlined
                      dense
                      :rules="[(val) => !val || onlyLettersAndSpaces(val) || 'Letters only']"
                      lazy-rules
                    />
                  </div>
                  <div class="col">
                    <q-input v-model="row.address" label="Address" outlined dense />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input
                      v-model="row.contact_number"
                      label="Contact Number"
                      outlined
                      dense
                      mask="###############"
                      :rules="[
                        (val) =>
                          !val ||
                          /^09\d{9}$/.test((val || '').replace(/\D/g, '')) ||
                          'Invalid Philippine mobile number (09XXXXXXXXX)',
                      ]"
                      lazy-rules
                    />
                  </div>
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeRow('references', idx)"
                  />
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.references.length" class="text-grey-7 bg-grey-2" rounded>
                No references added yet.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- X. Personal Background Questionnaire -->
        <div id="section-declarations" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white q-py-sm">
              <div class="text-subtitle1 text-bold">X. Personal Background Questionnaire</div>
            </q-card-section>

            <div class="q-gutter-md q-pa-md">
              <q-separator class="q-mb-md" />

              <div class="q-mb-md">
                <div class="text-bold">34.</div>
                Are you related by consanguinity or affinity to the appointing or recommending
                authority, to the chief of bureau or office or to the person who has immediate
                supervision over you in the Office, Bureau or Department where you will be
                appointed,
              </div>

              <div class="q-pl-md q-mb-md">
                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">a.</div>
                      within the third degree?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.relationThirdDegree" val="Yes" label="Yes" />
                    <q-radio v-model="formData.relationThirdDegree" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">b.</div>
                      within the fourth degree (for Local Government Unit - Career Employees)?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.relationFourthDegree" val="Yes" label="Yes" />
                    <q-radio v-model="formData.relationFourthDegree" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <div
                  v-if="
                    formData.relationThirdDegree === 'Yes' ||
                    formData.relationFourthDegree === 'Yes'
                  "
                  class="q-pl-md q-mt-sm"
                >
                  <q-input
                    v-model="formData.relationDetails"
                    label="Please provide details"
                    outlined
                    dense
                    type="textarea"
                    rows="2"
                    :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                    lazy-rules
                  />
                </div>
              </div>

              <q-separator class="q-mb-md" />
              <div class="q-mb-md text-bold">35.</div>
              <div class="q-pl-md q-mb-md">
                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">a.</div>
                      Have you ever been found guilty of any administrative offense?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.administrativeOffense" val="Yes" label="Yes" />
                    <q-radio v-model="formData.administrativeOffense" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <div v-if="formData.administrativeOffense === 'Yes'" class="q-pl-md q-mb-sm">
                  <q-input
                    v-model="formData.administrativeOffenseDetails"
                    label="Please provide details (offense, date, penalty)"
                    outlined
                    dense
                    type="textarea"
                    rows="2"
                    :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                    lazy-rules
                  />
                </div>

                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">b.</div>
                      Have you been criminally charged before any court?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.criminallyCharged" val="Yes" label="Yes" />
                    <q-radio v-model="formData.criminallyCharged" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <div
                  v-if="formData.criminallyCharged === 'Yes'"
                  class="q-pl-md row q-col-gutter-sm"
                >
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formData.criminalCaseDateFiled"
                      label="Date of filing"
                      outlined
                      dense
                      mask="##/##/####"
                      hint="DD/MM/YYYY"
                      :rules="[
                        (val) => !!val || 'Date of filing is required',
                        (val) => isValidDate(val) || 'Please enter valid date (DD/MM/YYYY)',
                      ]"
                      lazy-rules
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date
                              v-model="formData.criminalCaseDateFiled"
                              mask="DD/MM/YYYY"
                              today-btn
                            >
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formData.criminalCaseStatus"
                      label="Status of case"
                      outlined
                      dense
                      :rules="[(val) => !!val || 'Status is required']"
                      lazy-rules
                    />
                  </div>
                </div>
              </div>

              <q-separator class="q-mb-md" />

              <q-item tag="label">
                <q-item-section>
                  <q-item-label>
                    <div class="text-bold">36.</div>
                    Have you ever been convicted of any crime or violation of any law, decree,
                    ordinance or regulation by any court or tribunal?
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-radio v-model="formData.convicted" val="Yes" label="Yes" />
                  <q-radio v-model="formData.convicted" val="No" label="No" />
                </q-item-section>
              </q-item>

              <div v-if="formData.convicted === 'Yes'" class="q-pl-md q-mt-sm">
                <q-input
                  v-model="formData.convictedDetails"
                  label="Please provide details (crime, date, court, penalty)"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                  lazy-rules
                />
              </div>

              <q-separator class="q-mb-md" />

              <q-item tag="label">
                <q-item-section>
                  <q-item-label>
                    <div class="text-bold">37.</div>
                    Have you ever been separated from the service in any of the following modes:
                    resignation, retirement, dropped from the rolls, dismissal, termination, end of
                    term, finished contract or phased out (abolition) in the public or private
                    sector?
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-radio v-model="formData.separatedFromService" val="Yes" label="Yes" />
                  <q-radio v-model="formData.separatedFromService" val="No" label="No" />
                </q-item-section>
              </q-item>

              <div v-if="formData.separatedFromService === 'Yes'" class="q-pl-md q-mt-sm">
                <q-input
                  v-model="formData.separatedFromServiceDetails"
                  label="Please provide details"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                  lazy-rules
                />
              </div>

              <q-separator class="q-mb-md" />

              <div class="text-bold q-mb-md">38.</div>
              <q-item tag="label">
                <q-item-section>
                  <q-item-label>
                    <div class="text-bold">a.</div>
                    Have you ever been a candidate in a national or local election held within the
                    last year (except Barangay election)?
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-radio v-model="formData.electionCandidate" val="Yes" label="Yes" />
                  <q-radio v-model="formData.electionCandidate" val="No" label="No" />
                </q-item-section>
              </q-item>

              <div v-if="formData.electionCandidate === 'Yes'" class="q-pl-md q-mb-sm">
                <q-input
                  v-model="formData.electionCandidateDetails"
                  label="Please provide details (election, position, date)"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                  lazy-rules
                />
              </div>

              <q-item tag="label" class="q-pl-md">
                <q-item-section>
                  <q-item-label>
                    <div class="text-bold">b.</div>
                    Have you resigned from the government service during the three (3)-month period
                    before the last election to promote/actively campaign for a national or local
                    candidate?
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-radio v-model="formData.resignedForCampaign" val="Yes" label="Yes" />
                  <q-radio v-model="formData.resignedForCampaign" val="No" label="No" />
                </q-item-section>
              </q-item>

              <div v-if="formData.resignedForCampaign === 'Yes'" class="q-pl-md q-mt-sm">
                <q-input
                  v-model="formData.resignedForCampaignDetails"
                  label="Please provide details"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                  lazy-rules
                />
              </div>

              <q-separator class="q-mb-md" />

              <q-item tag="label">
                <q-item-section>
                  <q-item-label>
                    <div class="text-bold">39.</div>
                    Have you acquired the status of an immigrant or permanent resident of another
                    country?
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-radio v-model="formData.immigrant" val="Yes" label="Yes" />
                  <q-radio v-model="formData.immigrant" val="No" label="No" />
                </q-item-section>
              </q-item>

              <div v-if="formData.immigrant === 'Yes'" class="q-pl-md q-mt-sm">
                <q-input
                  v-model="formData.immigrantDetails"
                  label="Please provide details (country, date acquired)"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :rules="[(val) => (!!val && val.trim().length > 0) || 'Details are required']"
                  lazy-rules
                />
              </div>

              <q-separator class="q-mb-md" />

              <div class="q-mb-md">
                <div class="text-bold">40.</div>
                Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled
                Persons (RA 7277); and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer
                the following items:
              </div>

              <div class="q-pl-md q-mb-md">
                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">a.</div>
                      Are you a member of any indigenous group?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.indigenous" val="Yes" label="Yes" />
                    <q-radio v-model="formData.indigenous" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <div v-if="formData.indigenous === 'Yes'" class="q-pl-md q-mt-sm">
                  <q-input
                    v-model="formData.indigenousDetails"
                    label="Please specify your indigenous group"
                    outlined
                    dense
                    :rules="[
                      (val) =>
                        (!!val && val.trim().length > 0) || 'Please specify your indigenous group',
                    ]"
                    lazy-rules
                  />
                </div>

                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">b.</div>
                      Are you a person with disability?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.pwd" val="Yes" label="Yes" />
                    <q-radio v-model="formData.pwd" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <div v-if="formData.pwd === 'Yes'" class="q-pl-md q-mt-sm">
                  <div class="text-subtitle2 text-grey-7">Please select disability type(s):</div>
                  <q-select
                    v-model="formData.pwdTypes"
                    label="Disability Types"
                    multiple
                    outlined
                    dense
                    :options="pwdOptions"
                    use-chips
                    stack-label
                    :rules="[
                      (val) =>
                        (val && val.length > 0) || 'Please select at least one disability type',
                    ]"
                    lazy-rules
                  />
                </div>

                <q-item tag="label">
                  <q-item-section>
                    <q-item-label>
                      <div class="text-bold">c.</div>
                      Are you a solo parent?
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-radio v-model="formData.soloParent" val="Yes" label="Yes" />
                    <q-radio v-model="formData.soloParent" val="No" label="No" />
                  </q-item-section>
                </q-item>

                <div v-if="formData.soloParent === 'Yes'" class="q-pl-md q-mt-sm">
                  <q-input
                    v-model="formData.soloParentDetails"
                    label="Please provide details (if applicable)"
                    outlined
                    dense
                    type="textarea"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- XI. Other Documents (Renumbered to XII) -->
        <div id="section-other-documents" class="scroll-target">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="bg-primary text-white q-py-sm">
              <div class="text-subtitle1 text-bold">XII. Other Documents</div>
            </q-card-section>

            <q-card-section>
              <q-banner class="upload-instruction-banner bg-teal-1 text-teal q-mb-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" />
                </template>
                <div class="banner-text">
                  <strong>Upload other supporting documents:</strong>
                  <ul class="q-mt-sm q-mb-none" style="padding-left: 20px">
                    <li>
                      <strong>Application Letter</strong>
                      - Include your application letter
                    </li>
                    <li>
                      <strong>Other Documents</strong>
                      - Any additional supporting documents
                    </li>
                  </ul>
                  Make it one PDF file for multiple documents.
                  <strong>Maximum file size: 5MB.</strong>
                </div>
              </q-banner>

              <!-- Previously uploaded "Other Documents" — always shown, never disables adding more -->
              <div v-if="existingOtherDocuments.length" class="q-mb-md">
                <div class="section-label q-mb-sm">Previously Uploaded Documents</div>
                <q-list bordered separator class="rounded-borders">
                  <q-item v-for="(doc, i) in existingOtherDocuments" :key="`other-existing-${i}`">
                    <q-item-section avatar>
                      <q-icon name="insert_drive_file" color="primary" size="26px" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-caption ellipsis" style="max-width: 320px">
                        {{ doc.name }}
                      </q-item-label>
                      <q-item-label caption>Already uploaded</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        flat
                        dense
                        round
                        icon="visibility"
                        color="primary"
                        @click="viewAttachment(doc.url, doc.name)"
                      >
                        <q-tooltip>View File</q-tooltip>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="row items-center justify-between q-mb-sm">
                <div class="section-label q-mb-none">Additional Documents</div>
                <q-btn
                  unelevated
                  rounded
                  label="Add Document"
                  icon="add"
                  color="primary"
                  size="sm"
                  @click="addOtherDocument"
                />
              </div>

              <q-card
                v-for="(row, idx) in form.otherDocuments"
                :key="`other-${idx}`"
                flat
                bordered
                class="q-mb-sm"
              >
                <q-card-section class="row items-center q-gutter-x-md q-py-sm">
                  <div class="text-grey-7 text-caption col-auto">#{{ idx + 1 }}</div>

                  <div class="col-12 col-sm-10">
                    <q-file
                      v-model="row.file"
                      label="Upload Document (PDF, JPG, PNG)"
                      outlined
                      dense
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      stack-label
                      max-file-size="10485760"
                      @rejected="onFileRejected"
                    >
                      <template v-slot:prepend>
                        <q-icon name="attach_file" />
                      </template>
                    </q-file>
                  </div>
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeRow('otherDocuments', idx)"
                  />
                </q-card-section>
              </q-card>

              <q-banner v-if="!form.otherDocuments.length" class="text-grey-7 bg-grey-2" rounded>
                No additional documents added. Click "Add Document" to add one.
              </q-banner>
            </q-card-section>
          </q-card>
        </div>

        <!-- ═══════════════════════ Bottom Submit ═══════════════════════ -->
        <div class="row justify-end q-mb-xl q-mr-md">
          <q-btn
            unelevated
            rounded
            label="Submit"
            icon="check_circle"
            color="primary"
            :loading="isSubmitting"
            @click="submitForm"
          />
        </div>
      </div>
    </div>

    <!-- ═══════════════════════ Attachment Viewer Dialog ═══════════════════════ -->
    <q-dialog v-model="viewerDialog.show" maximized-mobile>
      <q-card style="min-width: 350px; max-width: 900px; width: 90vw">
        <q-card-section class="row items-center justify-between bg-primary text-white q-py-sm">
          <div class="text-subtitle1 ellipsis" style="max-width: 80%">
            {{ viewerDialog.name }}
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-none" style="height: 70vh">
          <template v-if="viewerDialog.type === 'pdf'">
            <iframe
              v-if="viewerDialog.url"
              :src="viewerDialog.url"
              style="width: 100%; height: 100%; border: none"
              title="PDF Preview"
            ></iframe>
          </template>
          <template v-else-if="viewerDialog.type === 'image'">
            <div class="flex flex-center full-height bg-grey-2">
              <img
                :src="viewerDialog.url"
                style="max-width: 100%; max-height: 100%; object-fit: contain"
                alt="Attachment preview"
              />
            </div>
          </template>
          <template v-else>
            <div class="flex flex-center column full-height q-pa-lg">
              <q-icon name="insert_drive_file" size="64px" color="grey-6" />
              <div class="text-grey-7 q-mt-md text-center">
                Preview isn't available for this file type. Use "Open in New Tab" or "Download"
                below.
              </div>
            </div>
          </template>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn
            flat
            icon="open_in_new"
            label="Open in New Tab"
            @click="openInNewTab(viewerDialog.url)"
          />
          <q-btn
            flat
            icon="download"
            label="Download"
            :href="viewerDialog.url"
            target="_blank"
            type="a"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
    import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue';
    import { useQuasar } from 'quasar';
    import { usePDSStore } from 'src/stores/pdsFormStore';
    import { useRouter } from 'vue-router';

    const $q = useQuasar();
    const pdsStore = usePDSStore();
    const router = useRouter();
    const emit = defineEmits(['submit']);

    // ── State ──────────────────────────────────────────────────
    const hasExistingPDS = ref(false);
    const isLoading = ref(true);
    const isSubmitting = ref(false);
    const photoChanged = ref(false);

    // ── Shared validation helpers ─────────────────────────────────
    function isValidDate(val) {
      if (!val) return true;
      const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
      if (!match) return false;
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month < 1 || month > 12) return false;
      if (year < 1900 || year > 2100) return false;
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) return false;
      return true;
    }

    function isNotFutureDate(val) {
      if (!val || !isValidDate(val)) return true;
      const [day, month, year] = val.split('/').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return inputDate <= today;
    }

    function onlyLettersAndSpaces(val) {
      if (!val) return true;
      return /^[a-zA-ZÀ-ÿ.'\- ]+$/.test(val.trim());
    }

    function isFiniteNumber(val) {
      if (val === null || val === undefined || val === '') return false;
      return Number.isFinite(parseFloat(val));
    }

    function onFileRejected(rejectedEntries) {
      $q.notify({
        type: 'negative',
        message: `${rejectedEntries.length} file(s) did not pass validation (max 10MB, allowed types only).`,
        position: 'top',
      });
    }

    function onTogglePresent(row, val) {
      row.currently_working = val;
      row.work_date_to = val ? 'PRESENT' : '';
    }


    function buildCorsProxyUrl(storageUrl) {
    if (!storageUrl) return '';

    // Kunin lang yung relative path pagkatapos ng '/storage/'
    const relativePath = stripStorageUrl(storageUrl);

    // Kunin yung origin (protocol + host + port) mula sa storage URL mismo
    // para hindi mo na kailangang i-hardcode yung backend host
    try {
      const urlObj = new URL(storageUrl);
      return `${urlObj.origin}/api/storage-cors/${relativePath}`;
    } catch {
      // Fallback kung hindi valid URL (baka relative path na siya)
      return `/api/storage-cors/${relativePath}`;
    }
  }
    function stripStorageUrl(url) {
      if (!url) return '';

      // Handle full URLs
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Extract the path after '/storage/'
        const match = url.match(/\/storage\/(.+)$/);
        if (match) {
          return match[1];
        }
        return url;
      }

      // If it's already a relative path, return as is
      return url;
    }

    function getFileNameFromPath(path) {
      if (!path) return '';
      const clean = path.split('?')[0];
      return clean.substring(clean.lastIndexOf('/') + 1);
    }

    async function urlToFile(url, filename) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file (${response.status}): ${url}`);
      }
      const blob = await response.blob();
      return new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
      });
    } catch (error) {
      console.error(`urlToFile failed for ${url}:`, error);
      return null; // babalik null kung nag-fail (e.g. CORS, network error)
    }
  }
    function buildViewUrl(relativePath) {
      if (!relativePath) return '';
      if (/^https?:\/\//i.test(relativePath)) return relativePath;
      return `${relativePath}`;
    }

    // Existing "on record" attachments loaded from the API
    const existingPdsFiles = ref([]); // [{ url, path, name }]
    const replacePds = ref(false);
    const existingOtherDocuments = ref([]); // [{ url, path, name }]

    function cancelReplacePds() {
      replacePds.value = false;
      form.pdsFile = null;
    }

    // ── Attachment Viewer Dialog ──────────────────────────────────
    const viewerDialog = reactive({
      show: false,
      url: '',
      name: '',
      type: 'other', // 'pdf' | 'image' | 'other'
    });

    function getFileExt(url) {
      try {
        const clean = url.split('?')[0];
        return clean.substring(clean.lastIndexOf('.') + 1).toLowerCase();
      } catch {
        return '';
      }
    }

    function viewAttachment(url, name) {
      if (!url) {
        $q.notify({ type: 'warning', message: 'This attachment is not available to preview.' });
        return;
      }
      const ext = getFileExt(url);
      let type = 'other';
      if (ext === 'pdf') type = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) type = 'image';

      viewerDialog.url = url;
      viewerDialog.name = name || getFileNameFromPath(url);
      viewerDialog.type = type;
      viewerDialog.show = true;
    }

    function openInNewTab(url) {
      if (!url) return;
      window.open(url, '_blank', 'noopener');
    }

    // ── Options ──────────────────────────────────────────────────
    const sexOptions = ['Male', 'Female'];
    const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];
    const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const levelOptions = [
      'Elementary',
      'Secondary',
      'Vocational / Trade Course',
      'College',
      'Graduate Studies',
    ];
    const appointmentOptions = ['Permanent', 'Temporary', 'Casual', 'Contractual', 'Co-terminus'];
    const trainingTypeOptions = [
      'Managerial',
      'Supervisory',
      'Technical',
      'Foundation',
      'Orientation',
    ];
    const yesNoOptions = ['Yes', 'No'];

    const genderReferenceOptions = [
      { label: 'Female', value: 'Female' },
      { label: 'Male', value: 'Male' },
      { label: 'Lesbian', value: 'Lesbian' },
      { label: 'Gay', value: 'Gay' },
      { label: 'Bisexual', value: 'Bisexual' },
      { label: 'Transgender', value: 'Transgender' },
      { label: 'Transgender Woman', value: 'Transgender Woman' },
      { label: 'Transgender Man', value: 'Transgender Man' },
      { label: 'Non-binary', value: 'Non-binary' },
      { label: 'Gender Fluid', value: 'Gender Fluid' },
      { label: 'Queer', value: 'Queer' },
      { label: 'Intersex', value: 'Intersex' },
      { label: 'Prefer not to say', value: 'Prefer not to say' },
      { label: 'Other', value: 'Other' },
    ];

    const ethnicGroupOptions = [
      { label: 'Maguindanao', value: 'Maguindanao' },
      { label: 'Maranao', value: 'Maranao' },
      { label: 'Tausug', value: 'Tausug' },
      { label: 'Yakan', value: 'Yakan' },
      { label: 'Sama', value: 'Sama' },
      { label: 'Badjao', value: 'Badjao' },
      { label: 'Subanen', value: 'Subanen' },
      { label: 'Manobo', value: 'Manobo' },
      { label: 'Bagobo', value: 'Bagobo' },
      { label: 'Bukidnon', value: 'Bukidnon' },
      { label: 'Higaonon', value: 'Higaonon' },
      { label: 'Bilaan', value: 'Bilaan' },
      { label: 'Tboli', value: 'Tboli' },
      { label: 'Tiruray', value: 'Tiruray' },
      { label: 'Kalagan', value: 'Kalagan' },
      { label: 'Mansaka', value: 'Mansaka' },
      { label: 'Mandaya', value: 'Mandaya' },
      { label: 'Lumad', value: 'Lumad' },
      { label: 'Moro', value: 'Moro' },
      { label: 'Bisaya', value: 'Bisaya' },
      { label: 'Cebuano', value: 'Cebuano' },
      { label: 'Hiligaynon', value: 'Hiligaynon' },
      { label: 'Waray', value: 'Waray' },
      { label: 'Ilonggo', value: 'Ilonggo' },
      { label: 'Aklanon', value: 'Aklanon' },
      { label: 'Capiznon', value: 'Capiznon' },
      { label: 'Surigaonon', value: 'Surigaonon' },
      { label: 'Kinaray-a', value: 'Kinaray-a' },
      { label: 'Romblomanon', value: 'Romblomanon' },
      { label: 'Masbateño', value: 'Masbateño' },
      { label: 'Boholano', value: 'Boholano' },
      { label: 'Porohanon', value: 'Porohanon' },
      { label: 'Cuyonon', value: 'Cuyonon' },
      { label: 'Tagalog', value: 'Tagalog' },
      { label: 'Ilocano', value: 'Ilocano' },
      { label: 'Bicolano', value: 'Bicolano' },
      { label: 'Kapampangan', value: 'Kapampangan' },
      { label: 'Pangasinense', value: 'Pangasinense' },
      { label: 'Ivatan', value: 'Ivatan' },
      { label: 'Ibanag', value: 'Ibanag' },
      { label: 'Gaddang', value: 'Gaddang' },
      { label: 'Sambal', value: 'Sambal' },
      { label: 'Chinese Filipino', value: 'Chinese Filipino' },
      { label: 'Spanish Filipino', value: 'Spanish Filipino' },
      { label: 'Mixed Race', value: 'Mixed Race' },
      { label: 'Prefer not to say', value: 'Prefer not to say' },
      { label: 'Other', value: 'Other' },
    ];

    const pwdOptions = [
      'Psychosocial Disability',
      'Disability caused by chronic illness',
      'Learning Disability',
      'Mental Disability',
      'Visual Disability',
      'Orthopedic Disability',
      'Communication Disability',
    ];

    // ── Side navigation ──────────────────────────────────────────
    const sections = [
      { id: 'section-photo', label: 'Photo & Name', icon: 'photo_camera' },
      { id: 'section-personal', label: 'Personal Information', icon: 'person' },
      { id: 'section-upload-pds', label: 'Upload PDS', icon: 'description' },
      { id: 'section-family', label: 'Family Background', icon: 'family_restroom' },
      { id: 'section-education', label: 'Educational Background', icon: 'school' },
      { id: 'section-eligibility', label: 'Civil Service Eligibility', icon: 'verified' },
      { id: 'section-work', label: 'Work Experience', icon: 'work' },
      { id: 'section-voluntary', label: 'Voluntary Work', icon: 'volunteer_activism' },
      { id: 'section-training', label: 'L&D Interventions', icon: 'menu_book' },
      { id: 'section-other', label: 'Other Information', icon: 'info' },
      { id: 'section-references', label: 'References', icon: 'contacts' },
      { id: 'section-declarations', label: 'Declarations', icon: 'fact_check' },
      { id: 'section-other-documents', label: 'Other Documents', icon: 'folder' },
    ];

    const activeSection = ref('section-photo');
    let sectionObserver = null;
    let isScrolling = false;
    let scrollTimeout = null;
    let isManualScroll = false;

    // ── Navigation Functions ──────────────────────────────────────
    function goBack() {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/jobList');
      }
    }

    function scrollToSection(id) {
      const el = document.getElementById(id);
      if (!el) return;

      isManualScroll = true;
      isScrolling = true;
      activeSection.value = id;

      const appHeaderHeight = getAppHeaderHeight();
      const offset = appHeaderHeight + stickyBarHeight.value + mobileNavHeight.value + 20;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        isManualScroll = false;
      }, 800);
    }

    // ── Sticky bar offset ────────────────────────────────────────────
    const stickyBarRef = ref(null);
    const stickyBarHeight = ref(56);
    const mobileNavRef = ref(null);
    const mobileNavHeight = ref(0);
    let barResizeObserver = null;
    let mobileNavResizeObserver = null;
    let setupObserverTimeout = null;

    function getAppHeaderHeight() {
      try {
        const value = getComputedStyle(document.documentElement).getPropertyValue(
          '--app-header-height',
        );
        return parseFloat(value) || 0;
      } catch {
        return 0;
      }
    }

    // ── Improved Intersection Observer ──────────────────────────────────
    function setupSectionObserver() {
      const targets = sections.map((s) => document.getElementById(s.id)).filter(Boolean);

      const appHeaderHeight = getAppHeaderHeight() || 0;
      const barHeight = stickyBarHeight.value || 56;
      const navHeight = mobileNavHeight.value || 0;
      const stickyOffset = appHeaderHeight + barHeight + navHeight + 20;

      if (sectionObserver) {
        sectionObserver.disconnect();
      }

      sectionObserver = new IntersectionObserver(
        (entries) => {
          if (isScrolling || isManualScroll) return;

          const visibleSections = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => ({
              id: entry.target.id,
              ratio: entry.intersectionRatio,
              boundingRect: entry.boundingRect,
              isAtTop: entry.boundingRect.top <= stickyOffset + 50 && entry.boundingRect.top >= -50,
            }))
            .sort((a, b) => {
              if (a.isAtTop && !b.isAtTop) return -1;
              if (!a.isAtTop && b.isAtTop) return 1;
              return b.ratio - a.ratio;
            });

          if (visibleSections.length === 0) return;

          const bestSection = visibleSections[0];

          if (bestSection.ratio > 0.15 || bestSection.isAtTop) {
            if (sections.some((s) => s.id === bestSection.id)) {
              activeSection.value = bestSection.id;
            }
          }
        },
        {
          rootMargin: `-${Math.max(stickyOffset, 10)}px 0px -30% 0px`,
          threshold: [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
        },
      );

      targets.forEach((t) => sectionObserver.observe(t));
    }

    onMounted(() => {
      const barEl = stickyBarRef.value?.$el ?? stickyBarRef.value;
      if (barEl) {
        try {
          stickyBarHeight.value = Math.round(barEl.getBoundingClientRect().height) || 56;
          barResizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
              stickyBarHeight.value = Math.round(entries[0].contentRect.height) || 56;
              clearTimeout(setupObserverTimeout);
              setupObserverTimeout = setTimeout(setupSectionObserver, 100);
            }
          });
          barResizeObserver.observe(barEl);
        } catch (e) {
          console.warn('Error setting up bar resize observer:', e);
          stickyBarHeight.value = 56;
        }
      }

      if (mobileNavRef.value) {
        try {
          mobileNavHeight.value = Math.round(mobileNavRef.value.getBoundingClientRect().height) || 0;
          mobileNavResizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
              mobileNavHeight.value = Math.round(entries[0].contentRect.height) || 0;
              clearTimeout(setupObserverTimeout);
              setupObserverTimeout = setTimeout(setupSectionObserver, 100);
            }
          });
          mobileNavResizeObserver.observe(mobileNavRef.value);
        } catch (e) {
          console.warn('Error setting up mobile nav resize observer:', e);
          mobileNavHeight.value = 0;
        }
      }

      nextTick(() => {
        setupSectionObserver();
        window.addEventListener('scroll', handleScrollEnd);
      });

      loadPDSData();
    });

    function handleScrollEnd() {
      if (isScrolling || isManualScroll) return;

      try {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollY + windowHeight >= documentHeight - 100) {
          const lastSection = sections[sections.length - 1];
          if (lastSection) {
            activeSection.value = lastSection.id;
          }
        }
      } catch {
        // Ignore scroll errors
      }
    }

    onUnmounted(() => {
      try {
        barResizeObserver?.disconnect();
        mobileNavResizeObserver?.disconnect();
        sectionObserver?.disconnect();
        window.removeEventListener('scroll', handleScrollEnd);
        clearTimeout(scrollTimeout);
        clearTimeout(setupObserverTimeout);
      } catch {
        // Ignore cleanup errors
      }
    });

    // ── Keep the active chip centered ──────────────────────────────────
    const mobileNavScrollRef = ref(null);
    const chipRefs = {};

    function setChipRef(id, el) {
      if (el) chipRefs[id] = el;
      else delete chipRefs[id];
    }

    function centerActiveChip(id) {
      try {
        const container = mobileNavScrollRef.value;
        const chipEl = chipRefs[id]?.$el ?? chipRefs[id];
        if (!container || !chipEl) return;

        const containerRect = container.getBoundingClientRect();
        const chipRect = chipEl.getBoundingClientRect();
        const delta =
          chipRect.left + chipRect.width / 2 - (containerRect.left + containerRect.width / 2);
        container.scrollBy({ left: delta, behavior: 'smooth' });
      } catch {
        // Ignore centering errors
      }
    }

    watch(activeSection, (id) => {
      nextTick(() => centerActiveChip(id));
    });

    // ── Form State ──────────────────────────────────────────────
    const form = reactive({
      personal: {
        firstname: '',
        lastname: '',
        middlename: '',
        name_extension: '',
        date_of_birth: '',
        place_of_birth: '',
        sex: '',
        civil_status: '',
        blood_type: '',
        height: '',
        weight: '',
        cellphone_number: '',
        telephone_number: '',
        email_address: '',
        citizenship: '',
        religion: '',
        gender_reference: '',
        gender_other: '',
        ethnic_group: '',
        ethnic_other: '',
        gsis_no: '',
        pagibig_no: '',
        philhealth_no: '',
        sss_no: '',
        tin_no: '',
        agency_employee_no: '',
      },
      residential: {
        house: '',
        street: '',
        subdivision: '',
        barangay: '',
        city: '',
        province: '',
        region: '',
        zip: '',
      },
      permanent: {
        house: '',
        street: '',
        subdivision: '',
        barangay: '',
        city: '',
        province: '',
        region: '',
        zip: '',
      },
      family: {
        spouse_firstname: '',
        spouse_name: '',
        spouse_middlename: '',
        spouse_occupation: '',
        spouse_employer: '',
        spouse_employer_address: '',
        spouse_employer_telephone: '',
        father_firstname: '',
        father_lastname: '',
        father_middlename: '',
        mother_firstname: '',
        mother_lastname: '',
        mother_middlename: '',
      },
      children: [],
      education: [],
      eligibility: [],
      workExperience: [],
      voluntaryWork: [],
      training: [],
      skills: [],
      distinctions: [],
      memberships: [],
      references: [],
      otherDocuments: [],
      pdsFile: null,
    });

    // ── Personal Background Questionnaire ──────────────────────────
    const formData = reactive({
      relationThirdDegree: 'No',
      relationFourthDegree: 'No',
      relationDetails: '',
      administrativeOffense: 'No',
      administrativeOffenseDetails: '',
      criminallyCharged: 'No',
      criminalCaseDateFiled: '',
      criminalCaseStatus: '',
      convicted: 'No',
      convictedDetails: '',
      separatedFromService: 'No',
      separatedFromServiceDetails: '',
      electionCandidate: 'No',
      electionCandidateDetails: '',
      resignedForCampaign: 'No',
      resignedForCampaignDetails: '',
      immigrant: 'No',
      immigrantDetails: '',
      indigenous: 'No',
      indigenousDetails: '',
      pwd: 'No',
      pwdTypes: [],
      soloParent: 'No',
      soloParentDetails: '',
    });

    // ── Same as residential toggle ──────────────────────────────────
    const sameAsResidential = ref(false);
    function onSameAddressToggle(val) {
      if (val) {
        try {
          Object.assign(form.permanent, { ...form.residential });
        } catch {
          // Ignore
        }
      }
    }

    watch(
      () => {
        try {
          return { ...form.residential };
        } catch {
          return {};
        }
      },
      (val) => {
        if (sameAsResidential.value) {
          try {
            Object.assign(form.permanent, val);
          } catch {
            // Ignore
          }
        }
      },
    );

    // ── Photo upload ──────────────────────────────────────────────
    const fileInputRef = ref(null);
    const photoFile = ref(null);
    const photoPreview = ref('');

    function triggerFileSelect() {
      fileInputRef.value?.click();
    }

    function onPhotoSelected(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        $q.notify({ type: 'negative', message: 'Please select an image file.' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        $q.notify({ type: 'negative', message: 'Image must be smaller than 5MB.' });
        return;
      }

      if (photoPreview.value?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(photoPreview.value);
        } catch {
          // Ignore
        }
      }
      photoFile.value = file;
      photoPreview.value = URL.createObjectURL(file);
      photoChanged.value = true;
    }

    onUnmounted(() => {
      if (photoPreview.value?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(photoPreview.value);
        } catch {
          // Ignore
        }
      }
    });

    // ── WES Download ──────────────────────────────────────────────────
    const workExperienceDocxUrl = '/CS Form No. 212 Attachment - Work Experience Sheet.docx';

    function downloadWES() {
      try {
        const a = document.createElement('a');
        a.href = workExperienceDocxUrl;
        a.download = 'CS Form No. 212 Attachment - Work Experience Sheet.docx';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        $q.notify({
          type: 'positive',
          message: 'Downloading Work Experience Sheet template...',
        });
      } catch {
        $q.notify({
          type: 'negative',
          message: 'Failed to download WES template.',
        });
      }
    }

    // ── Dynamic row helpers ──────────────────────────────────────────
    function addChild() {
      form.children.push({ child_name: '', birth_date: '' });
    }
    function removeChild(idx) {
      form.children.splice(idx, 1);
    }

    function addEducation() {
      form.education.push({
        level: '',
        school_name: '',
        degree: '',
        attendance_from: '',
        attendance_to: '',
        highest_units: '',
        year_graduated: '',
        scholarship: '',
        graduated: '',
        file: null,
        existingAttachment: null,
        existingAttachmentUrl: null,
        replaceFile: false,
      });
    }

    function addEligibility() {
      form.eligibility.push({
        eligibility: '',
        rating: '',
        date_of_examination: '',
        place_of_examination: '',
        license_number: '',
        date_of_validity: '',
        file: null,
        existingAttachment: null,
        existingAttachmentUrl: null,
        replaceFile: false,
      });
    }

    function addWork() {
      form.workExperience.push({
        work_date_from: '',
        work_date_to: '',
        position_title: '',
        department: '',
        monthly_salary: '',
        salary_grade: '',
        status_of_appointment: '',
        government_service: '',
        currently_working: false,
        file: null,
        existingAttachment: null,
        existingAttachmentUrl: null,
        replaceFile: false,
      });
    }

    function addVoluntary() {
      form.voluntaryWork.push({
        organization_name: '',
        inclusive_date_from: '',
        inclusive_date_to: '',
        number_of_hours: '',
        position: '',
      });
    }

    function addTraining() {
      form.training.push({
        training_title: '',
        inclusive_date_from: '',
        inclusive_date_to: '',
        number_of_hours: '',
        type: '',
        conducted_by: '',
        file: null,
        existingAttachment: null,
        existingAttachmentUrl: null,
        replaceFile: false,
      });
    }

    function addSkill() {
      form.skills.push({ skill: '' });
    }

    function addDistinction() {
      form.distinctions.push({ non_academic: '' });
    }

    function addMembership() {
      form.memberships.push({
        organization: '',
        position: '',
        inclusive_date_from: '',
        inclusive_date_to: '',
      });
    }

    function addReference() {
      form.references.push({ full_name: '', address: '', contact_number: '' });
    }

    function addOtherDocument() {
      form.otherDocuments.push({
        document_name: '',
        file: null,
      });
    }

    function removeRow(section, idx) {
      try {
        form[section].splice(idx, 1);
      } catch {
        // Ignore
      }
    }

    // ── Load PDS Data ──────────────────────────────────────────────────
    async function loadPDSData() {
      isLoading.value = true;
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          $q.notify({
            type: 'warning',
            message: 'No email found. Please login again.',
            position: 'top',
          });
          return;
        }

        form.personal.email_address = email;

        const result = await pdsStore.fetchPDS(email);

        if (result.success && result.data) {
          hasExistingPDS.value = true;
          populateFormWithData(result.data);
          $q.notify({
            type: 'positive',
            message: 'PDS data loaded successfully. You can update your information.',
            position: 'top',
            timeout: 3000,
          });
        } else {
          hasExistingPDS.value = false;
          $q.notify({
            type: 'info',
            message: 'No existing PDS found. Please fill out the form.',
            position: 'top',
            timeout: 3000,
          });
        }
      } catch (error) {
        console.error('Error loading PDS:', error);
        hasExistingPDS.value = false;
        $q.notify({
          type: 'negative',
          message: 'Error loading PDS data. Please refresh and try again.',
          position: 'top',
        });
      } finally {
        isLoading.value = false;
      }
    }

    // ── Populate Form with Data ──────────────────────────────────────
    function populateFormWithData(data) {
      try {
        form.personal.firstname = data.firstname || '';
        form.personal.lastname = data.lastname || '';
        form.personal.middlename = data.middlename || '';
        form.personal.name_extension = data.name_extension || '';
        form.personal.date_of_birth = data.date_of_birth || '';
        form.personal.place_of_birth = data.place_of_birth || '';
        form.personal.sex = data.sex || '';
        form.personal.civil_status = data.civil_status || '';
        form.personal.blood_type = data.blood_type || '';
        form.personal.height = data.height || '';
        form.personal.weight = data.weight || '';
        form.personal.cellphone_number = data.cellphone_number || '';
        form.personal.telephone_number = data.telephone_number || '';
        form.personal.email_address = data.email_address || '';
        form.personal.citizenship = data.citizenship || '';
        form.personal.religion = data.religion || '';
        form.personal.gender_reference = data.gender_prefer || '';
        form.personal.gender_other = data.other_specify || '';
        form.personal.ethnic_group = data.ethnic_group || '';
        form.personal.ethnic_other = data.ethnic_specify || '';
        form.personal.gsis_no = data.gsis_no || '';
        form.personal.pagibig_no = data.pagibig_no || '';
        form.personal.philhealth_no = data.philhealth_no || '';
        form.personal.sss_no = data.sss_no || '';
        form.personal.tin_no = data.tin_no || '';
        form.personal.agency_employee_no = data.agency_employee_no || '';

        form.residential.house = data.residential_house || '';
        form.residential.street = data.Rpurok || data.residential_street || '';
        form.residential.subdivision = data.residential_subdivision || '';
        form.residential.barangay = data.residential_barangay || '';
        form.residential.city = data.residential_city || '';
        form.residential.province = data.residential_province || '';
        form.residential.region = data.residential_region || '';
        form.residential.zip = data.residential_zip || '';

        form.permanent.house = data.permanent_house || '';
        form.permanent.street = data.Ppurok || data.permanent_street || '';
        form.permanent.subdivision = data.permanent_subdivision || '';
        form.permanent.barangay = data.permanent_barangay || '';
        form.permanent.city = data.permanent_city || '';
        form.permanent.province = data.permanent_province || '';
        form.permanent.region = data.permanent_region || '';
        form.permanent.zip = data.permanent_zip || '';

        if (data.family) {
          form.family.spouse_firstname = data.family.spouse_firstname || '';
          form.family.spouse_name = data.family.spouse_name || '';
          form.family.spouse_middlename = data.family.spouse_middlename || '';
          form.family.spouse_occupation = data.family.spouse_occupation || '';
          form.family.spouse_employer = data.family.spouse_employer || '';
          form.family.spouse_employer_address = data.family.spouse_employer_address || '';
          form.family.spouse_employer_telephone = data.family.spouse_employer_telephone || '';
          form.family.father_firstname = data.family.father_firstname || '';
          form.family.father_lastname = data.family.father_lastname || '';
          form.family.father_middlename = data.family.father_middlename || '';
          form.family.mother_firstname = data.family.mother_firstname || '';
          form.family.mother_lastname = data.family.mother_lastname || '';
          form.family.mother_middlename = data.family.mother_middlename || '';
        }

        if (data.children && data.children.length > 0) {
          form.children = data.children.map((child) => ({
            child_name: child.child_name || '',
            birth_date: child.birth_date || '',
          }));
        }

        if (data.education && data.education.length > 0) {
          form.education = data.education.map((edu) => ({
            level: edu.level || '',
            school_name: edu.school_name || '',
            degree: edu.degree || '',
            attendance_from: edu.attendance_from || '',
            attendance_to: edu.attendance_to || '',
            highest_units: edu.highest_units || '',
            year_graduated: edu.year_graduated || '',
            scholarship: edu.scholarship || '',
            graduated: edu.graduated || '',
            file: null,
            existingAttachment: edu.attachment_path || null,
            existingAttachmentUrl: edu.attachment_path ? buildViewUrl(edu.attachment_path) : null,
            replaceFile: false,
          }));
        }

        if (data.work_experience && data.work_experience.length > 0) {
          form.workExperience = data.work_experience.map((work) => ({
            work_date_from: work.work_date_from || '',
            work_date_to: work.work_date_to || '',
            position_title: work.position_title || '',
            department: work.department || '',
            monthly_salary: work.monthly_salary || '',
            salary_grade: work.salary_grade || '',
            status_of_appointment: work.status_of_appointment || '',
            government_service: work.government_service || '',
            currently_working: (work.work_date_to || '').toUpperCase() === 'PRESENT',
            file: null,
            existingAttachment: work.attachment_path || null,
            existingAttachmentUrl: work.attachment_path ? buildViewUrl(work.attachment_path) : null,
            replaceFile: false,
          }));
        }

        if (data.training && data.training.length > 0) {
          form.training = data.training.map((train) => ({
            training_title: train.training_title || '',
            inclusive_date_from: train.inclusive_date_from || '',
            inclusive_date_to: train.inclusive_date_to || '',
            number_of_hours: train.number_of_hours || '',
            type: train.type || '',
            conducted_by: train.conducted_by || '',
            file: null,
            existingAttachment: train.attachment_path || null,
            existingAttachmentUrl: train.attachment_path ? buildViewUrl(train.attachment_path) : null,
            replaceFile: false,
          }));
        }

        if (data.eligibity && data.eligibity.length > 0) {
          form.eligibility = data.eligibity.map((elig) => ({
            eligibility: elig.eligibility || '',
            rating: elig.rating || '',
            date_of_examination: elig.date_of_examination || '',
            place_of_examination: elig.place_of_examination || '',
            license_number: elig.license_number || '',
            date_of_validity: elig.date_of_validity || '',
            file: null,
            existingAttachment: elig.attachment_path || null,
            existingAttachmentUrl: elig.attachment_path ? buildViewUrl(elig.attachment_path) : null,
            replaceFile: false,
          }));
        }

        // ── Fetch/populate previously uploaded files (PDS & Other Documents) ──
        existingPdsFiles.value = (data.file?.pds_file || []).map((url) => ({
          url,
          path: stripStorageUrl(url),
          name: getFileNameFromPath(url),
        }));
        replacePds.value = false;

        existingOtherDocuments.value = (data.file?.other_document || []).map((url) => ({
          url,
          path: stripStorageUrl(url),
          name: getFileNameFromPath(url),
        }));

        // Set photo from existing data
        if (data.image_url) {
          photoPreview.value = data.image_url;
          photoFile.value = null;
          photoChanged.value = false;
        }

        const residentialStr = `${form.residential.house}${form.residential.street}${form.residential.subdivision}${form.residential.barangay}${form.residential.city}${form.residential.province}${form.residential.zip}`;
        const permanentStr = `${form.permanent.house}${form.permanent.street}${form.permanent.subdivision}${form.permanent.barangay}${form.permanent.city}${form.permanent.province}${form.permanent.zip}`;
        sameAsResidential.value = residentialStr === permanentStr && residentialStr !== '';

        if (data.personal_declarations && data.personal_declarations.length > 0) {
          const dec = data.personal_declarations[0];
          formData.relationThirdDegree = dec.question_34a || 'No';
          formData.relationFourthDegree = dec.question_34b || 'No';
          formData.relationDetails = dec.response_34 || '';
          formData.administrativeOffense = dec.question_35a || 'No';
          formData.administrativeOffenseDetails = dec.response_35a || '';
          formData.criminallyCharged = dec.question_35b || 'No';
          formData.criminalCaseDateFiled = dec.response_35b_date || '';
          formData.criminalCaseStatus = dec.response_35b_status || '';
          formData.convicted = dec.question_36 || 'No';
          formData.convictedDetails = dec.response_36 || '';
          formData.separatedFromService = dec.question_37 || 'No';
          formData.separatedFromServiceDetails = dec.response_37 || '';
          formData.electionCandidate = dec.question_38a || 'No';
          formData.electionCandidateDetails = dec.response_38a || '';
          formData.resignedForCampaign = dec.question_38b || 'No';
          formData.resignedForCampaignDetails = dec.response_38b || '';
          formData.immigrant = dec.question_39 || 'No';
          formData.immigrantDetails = dec.response_39 || '';
          formData.indigenous = dec.question_40a || 'No';
          formData.indigenousDetails = dec.response_40a || '';
          formData.pwd = dec.question_40b || 'No';

          const pwdTypes = [];
          if (dec.chronic === '1') pwdTypes.push('Disability caused by chronic illness');
          if (dec.Psychosocial === '1') pwdTypes.push('Psychosocial Disability');
          if (dec.Orthopedic === '1') pwdTypes.push('Orthopedic Disability');
          if (dec.Communication === '1') pwdTypes.push('Communication Disability');
          if (dec.Learning === '1') pwdTypes.push('Learning Disability');
          if (dec.Mental === '1') pwdTypes.push('Mental Disability');
          if (dec.Visual === '1') pwdTypes.push('Visual Disability');
          formData.pwdTypes = pwdTypes;

          formData.soloParent = dec.question_40c || 'No';
          formData.soloParentDetails = dec.response_40c || '';
        }
      } catch (error) {
        console.error('Error populating form with data:', error);
      }
    }

    // ── Build Payload ──────────────────────────────────────────────────
     async  function buildPayload() {
      const payload = {
        email_checker: form.personal.email_address,
        job_batches_rsp_id: localStorage.getItem('selectedJobId') || '',
        lastname: form.personal.lastname,
        firstname: form.personal.firstname,
        middlename: form.personal.middlename || '',
        name_extension: form.personal.name_extension || '',
        date_of_birth: form.personal.date_of_birth,
        sex: form.personal.sex,
        place_of_birth: form.personal.place_of_birth,
        weight: form.personal.weight,
        height: form.personal.height,
        blood_type: form.personal.blood_type || '',
        gsis_no: form.personal.gsis_no || '',
        pagibig_no: form.personal.pagibig_no || '',
        philhealth_no: form.personal.philhealth_no || '',
        sss_no: form.personal.sss_no || '',
        tin_no: form.personal.tin_no || '',
        civil_status: form.personal.civil_status,
        citizenship: form.personal.citizenship || 'Filipino',
        citizenship_status: '',
        residential_house: form.residential.house || '',
        residential_street: form.residential.street || '',
        residential_subdivision: form.residential.subdivision || '',
        residential_barangay: form.residential.barangay || '',
        residential_city: form.residential.city || '',
        residential_province: form.residential.province || '',
        residential_zip: form.residential.zip || '',
        permanent_house: form.permanent.house || '',
        permanent_street: form.permanent.street || '',
        permanent_subdivision: form.permanent.subdivision || '',
        permanent_barangay: form.permanent.barangay || '',
        permanent_city: form.permanent.city || '',
        permanent_province: form.permanent.province || '',
        permanent_zip: form.permanent.zip || '',
        telephone_number: form.personal.telephone_number || '',
        cellphone_number: form.personal.cellphone_number || '',
        email_address: form.personal.email_address,
        agency_employee_no: form.personal.agency_employee_no || '',
        umId: '',
        philSys: '',
        pwd: formData.pwd === 'Yes' ? 'Yes' : 'No',
        gender_prefer: form.personal.gender_reference || '',
        other_specify: form.personal.gender_other || '',
        Ppurok: form.permanent.street || '',
        Rpurok: form.residential.street || '',
        ethnic_group: form.personal.ethnic_group || '',
        ethnic_specify: form.personal.ethnic_other || '',
        spouse_name: form.family.spouse_name || '',
        spouse_firstname: form.family.spouse_firstname || '',
        spouse_middlename: form.family.spouse_middlename || '',
        spouse_extension: '',
        spouse_occupation: form.family.spouse_occupation || '',
        spouse_employer: form.family.spouse_employer || '',
        spouse_employer_address: form.family.spouse_employer_address || '',
        spouse_employer_telephone: form.family.spouse_employer_telephone || '',
        father_lastname: form.family.father_lastname || '',
        father_firstname: form.family.father_firstname || '',
        father_middlename: form.family.father_middlename || '',
        father_extension: '',
        mother_lastname: form.family.mother_lastname || '',
        mother_firstname: form.family.mother_firstname || '',
        mother_middlename: form.family.mother_middlename || '',
        mother_maidenname: '',
      };

       const pendingFileConversions = [];

      // ── Children ──────────────────────────────────────────────
      form.children.forEach((child, index) => {
        payload[`children[${index}][child_name]`] = child.child_name || '';
        payload[`children[${index}][birth_date]`] = child.birth_date || '';
      });

  // ── Education (School) ────────────────────────────────────
  form.education.forEach((edu, index) => {
    payload[`school[${index}][degree]`] = edu.degree || '';
    payload[`school[${index}][attendance_from]`] = edu.attendance_from || '';
    payload[`school[${index}][attendance_to]`] = edu.attendance_to || '';
    payload[`school[${index}][highest_units]`] = edu.highest_units || '';
    payload[`school[${index}][year_graduated]`] = edu.year_graduated || '';
    payload[`school[${index}][scholarship]`] = edu.scholarship || '';
    payload[`school[${index}][level]`] = edu.level || '';
    payload[`school[${index}][school_name]`] = edu.school_name || '';

    if (edu.file && edu.file.length > 0) {
      const file = edu.file[0] || edu.file;
      if (file instanceof File) {
        payload[`school[${index}][attachment_path]`] = file;
      }
    } else if (edu.existingAttachment && !edu.replaceFile) {
      pendingFileConversions.push({
        key: `school[${index}][attachment_path]`,
        url: buildCorsProxyUrl(edu.existingAttachmentUrl || edu.existingAttachment),
        filename: getFileNameFromPath(edu.existingAttachment),
      });
    }
  }); // ← closing brace ng else-if, ng forEach callback, at ng .forEach() call

  // ── Training ──────────────────────────────────────────────
  form.training.forEach((train, index) => {
    payload[`training[${index}][training_title]`] = train.training_title || '';
    payload[`training[${index}][inclusive_date_from]`] = train.inclusive_date_from || '';
    payload[`training[${index}][inclusive_date_to]`] = train.inclusive_date_to || '';
    payload[`training[${index}][number_of_hours]`] = train.number_of_hours || '';
    payload[`training[${index}][type]`] = train.type || '';
    payload[`training[${index}][conducted_by]`] = train.conducted_by || '';

    if (train.file && train.file.length > 0) {
      const file = train.file[0] || train.file;
      if (file instanceof File) {
        payload[`training[${index}][attachment_path]`] = file;
      }
    } else if (train.existingAttachment && !train.replaceFile) {
      pendingFileConversions.push({
        key: `training[${index}][attachment_path]`,
        url: buildCorsProxyUrl(train.existingAttachmentUrl || train.existingAttachment),
        filename: getFileNameFromPath(train.existingAttachment),
      });
    }
  });

    // ── Work Experience ────────────────────────────────────────
    form.workExperience.forEach((work, index) => {
      payload[`experience[${index}][work_date_from]`] = work.work_date_from || '';
      payload[`experience[${index}][work_date_to]`] = work.currently_working
        ? 'PRESENT'
        : work.work_date_to || '';
      payload[`experience[${index}][position_title]`] = work.position_title || '';
      payload[`experience[${index}][department]`] = work.department || '';
      payload[`experience[${index}][monthly_salary]`] = work.monthly_salary || '';
      payload[`experience[${index}][salary_grade]`] = work.salary_grade || '';
      payload[`experience[${index}][status_of_appointment]`] = work.status_of_appointment || '';
      payload[`experience[${index}][government_service]`] = work.government_service || '';

      if (work.file && work.file.length > 0) {
        const file = work.file[0] || work.file;
        if (file instanceof File) {
          payload[`experience[${index}][attachment_path]`] = file;
        }
      } else if (work.existingAttachment && !work.replaceFile) {
      pendingFileConversions.push({
    key: `experience[${index}][attachment_path]`,
    url: buildCorsProxyUrl(work.existingAttachmentUrl || work.existingAttachment),
    filename: getFileNameFromPath(work.existingAttachment),
  });
      }
    });
      // ── Voluntary Work ────────────────────────────────────────
      form.voluntaryWork.forEach((vol, index) => {
        payload[`voluntary[${index}][organization_name]`] = vol.organization_name || '';
        payload[`voluntary[${index}][inclusive_date_from]`] = vol.inclusive_date_from || '';
        payload[`voluntary[${index}][inclusive_date_to]`] = vol.inclusive_date_to || '';
        payload[`voluntary[${index}][number_of_hours]`] = vol.number_of_hours || '';
        payload[`voluntary[${index}][position]`] = vol.position || '';
      });

    // ── Eligibility ────────────────────────────────────────────
    form.eligibility.forEach((elig, index) => {
      payload[`eligibility[${index}][eligibility]`] = elig.eligibility || '';
      payload[`eligibility[${index}][rating]`] = elig.rating || '';
      payload[`eligibility[${index}][date_of_examination]`] = elig.date_of_examination || '';
      payload[`eligibility[${index}][place_of_examination]`] = elig.place_of_examination || '';
      payload[`eligibility[${index}][license_number]`] = elig.license_number || '';
      payload[`eligibility[${index}][date_of_validity]`] = elig.date_of_validity || '';

      if (elig.file && elig.file.length > 0) {
        const file = elig.file[0] || elig.file;
        if (file instanceof File) {
          payload[`eligibility[${index}][attachment_path]`] = file;
        }
      } else if (elig.existingAttachment && !elig.replaceFile) {
    pendingFileConversions.push({
    key: `eligibility[${index}][attachment_path]`,
    url: buildCorsProxyUrl(elig.existingAttachmentUrl || elig.existingAttachment),
    filename: getFileNameFromPath(elig.existingAttachment),
  });
      }
    });
      // ── Skills, Distinctions, Memberships ────────────────────
      form.skills.forEach((skill, index) => {
        payload[`skill[${index}][skill]`] = skill.skill || '';
      });

      form.distinctions.forEach((dist, index) => {
        payload[`skill[${index}][non_academic]`] = dist.non_academic || '';
      });

      form.memberships.forEach((mem, index) => {
        payload[`skill[${index}][organization]`] = mem.organization || '';
      });

      // ── References ─────────────────────────────────────────────
      form.references.forEach((ref, index) => {
        payload[`reference[${index}][full_name]`] = ref.full_name || '';
        payload[`reference[${index}][address]`] = ref.address || '';
        payload[`reference[${index}][contact_number]`] = ref.contact_number || '';
      });

      // ── Personal Declarations ──────────────────────────────────
      payload[`personal_declaration[0][question_34a]`] = formData.relationThirdDegree;
      payload[`personal_declaration[0][question_34b]`] = formData.relationFourthDegree;
      payload[`personal_declaration[0][response_34]`] = formData.relationDetails || '';
      payload[`personal_declaration[0][question_35a]`] = formData.administrativeOffense;
      payload[`personal_declaration[0][response_35a]`] = formData.administrativeOffenseDetails || '';
      payload[`personal_declaration[0][question_35b]`] = formData.criminallyCharged;
      payload[`personal_declaration[0][response_35b_date]`] = formData.criminalCaseDateFiled || '';
      payload[`personal_declaration[0][response_35b_status]`] = formData.criminalCaseStatus || '';
      payload[`personal_declaration[0][question_36]`] = formData.convicted;
      payload[`personal_declaration[0][response_36]`] = formData.convictedDetails || '';
      payload[`personal_declaration[0][question_37]`] = formData.separatedFromService;
      payload[`personal_declaration[0][response_37]`] = formData.separatedFromServiceDetails || '';
      payload[`personal_declaration[0][question_38a]`] = formData.electionCandidate;
      payload[`personal_declaration[0][response_38a]`] = formData.electionCandidateDetails || '';
      payload[`personal_declaration[0][question_38b]`] = formData.resignedForCampaign;
      payload[`personal_declaration[0][response_38b]`] = formData.resignedForCampaignDetails || '';
      payload[`personal_declaration[0][question_39]`] = formData.immigrant;
      payload[`personal_declaration[0][response_39]`] = formData.immigrantDetails || '';
      payload[`personal_declaration[0][question_40a]`] = formData.indigenous;
      payload[`personal_declaration[0][response_40a]`] = formData.indigenousDetails || '';
      payload[`personal_declaration[0][question_40b]`] = formData.pwd;
      payload[`personal_declaration[0][response_40b]`] =
        formData.pwdTypes.length > 0 ? formData.pwdTypes.join(', ') : '';
      payload[`personal_declaration[0][question_40c]`] = formData.soloParent;
      payload[`personal_declaration[0][response_40c]`] = formData.soloParentDetails || '';

      // PWD flags
      payload[`personal_declaration[0][chronic]`] = formData.pwdTypes.includes(
        'Disability caused by chronic illness',
      )
        ? '1'
        : '0';
      payload[`personal_declaration[0][Psychosocial]`] = formData.pwdTypes.includes(
        'Psychosocial Disability',
      )
        ? '1'
        : '0';
      payload[`personal_declaration[0][Orthopedic]`] = formData.pwdTypes.includes(
        'Orthopedic Disability',
      )
        ? '1'
        : '0';
      payload[`personal_declaration[0][Communication]`] = formData.pwdTypes.includes(
        'Communication Disability',
      )
        ? '1'
        : '0';
      payload[`personal_declaration[0][Learning]`] = formData.pwdTypes.includes('Learning Disability')
        ? '1'
        : '0';
      payload[`personal_declaration[0][Mental]`] = formData.pwdTypes.includes('Mental Disability')
        ? '1'
        : '0';
      payload[`personal_declaration[0][Visual]`] = formData.pwdTypes.includes('Visual Disability')
        ? '1'
        : '0';
   // ── Photo ──────────────────────────────────────────────────
    if (photoFile.value && photoFile.value instanceof File) {
      payload['image_path'] = photoFile.value;
    } else if (photoPreview.value) {
      if (photoPreview.value.startsWith('http')) {
         pendingFileConversions.push({
      key: 'image_path',
      url: buildCorsProxyUrl(photoPreview.value),
      filename: getFileNameFromPath(photoPreview.value) || 'photo.jpg',
    });
      } else {
        payload['image_path'] = photoPreview.value;
      }
    }
      // ── PDS File(s) ──────────────────────────────────────────────
    if (form.pdsFile && form.pdsFile instanceof File) {
      payload['pds[0][pds_file]'] = form.pdsFile;
    } else if (existingPdsFiles.value.length > 0 && !replacePds.value) {
     existingPdsFiles.value.forEach((item, idx) => {
    pendingFileConversions.push({
      key: `pds[${idx}][pds_file]`,
      url: buildCorsProxyUrl(item.url),
      filename: item.name,
    });
  });
    }
    // ── Other Documents ────────────────────────────────────────
  existingOtherDocuments.value.forEach((item, idx) => {
    pendingFileConversions.push({
      key: `other_document[${idx}][document]`,
      url: buildCorsProxyUrl(item.url),
      filename: item.name,
    });
  });

    const existingOtherDocsCount = existingOtherDocuments.value.length;
    form.otherDocuments.forEach((doc, index) => {
      if (doc.file && doc.file instanceof File) {
        payload[`other_document[${existingOtherDocsCount + index}][document]`] = doc.file;
      }
    });

    // ── Resolve lahat ng pending URL → File conversions nang sabay ──
    const conversions = await Promise.all(
      pendingFileConversions.map(async (item) => {
        const file = await urlToFile(item.url, item.filename);
        return { key: item.key, file, url: item.url };
      }),
    );

    conversions.forEach(({ key, file, url }) => {
      if (file) {
        payload[key] = file;
      } else {
        // Fallback: hindi na-fetch (CORS / network) — ipasa na lang yung URL string
        console.warn(`Fallback to URL string for ${key} (fetch failed):`, url);
        payload[key] = url;
      }
    });

    console.log('📦 Final payload before submission:', payload);

    return payload;
  }

    // ── Form-wide validation before submit ─────────────────────────────
    function validateFormBeforeSubmit() {
      const errors = [];

      if (!form.personal.firstname || !form.personal.firstname.trim()) {
        errors.push('First Name is required.');
      } else if (!onlyLettersAndSpaces(form.personal.firstname)) {
        errors.push('First Name must contain letters only.');
      }

      if (!form.personal.lastname || !form.personal.lastname.trim()) {
        errors.push('Last Name is required.');
      } else if (!onlyLettersAndSpaces(form.personal.lastname)) {
        errors.push('Last Name must contain letters only.');
      }

      if (!form.personal.date_of_birth) {
        errors.push('Date of Birth is required.');
      } else if (!isValidDate(form.personal.date_of_birth)) {
        errors.push('Date of Birth is not a valid date (DD/MM/YYYY).');
      } else if (!isNotFutureDate(form.personal.date_of_birth)) {
        errors.push('Date of Birth cannot be in the future.');
      }

      if (!form.personal.cellphone_number) {
        errors.push('Cellphone Number is required.');
      }

      if (!form.personal.email_address) {
        errors.push('Email Address is required.');
      }

      // PDS File validation — required only if there's no existing PDS on record
      // (or the user chose to replace it but hasn't picked a new file yet).
      if (existingPdsFiles.value.length === 0 && !form.pdsFile) {
        errors.push('PDS file is required. Please upload your Personal Data Sheet.');
      } else if (replacePds.value && !form.pdsFile) {
        errors.push('Please upload the replacement PDS file, or click "Cancel Replace".');
      }

      // Check if photo is present
      if (!photoPreview.value) {
        errors.push('2x2 ID picture is required. Please upload a photo.');
      }

      form.education.forEach((edu, idx) => {
        if (edu.highest_units && !isFiniteNumber(edu.highest_units)) {
          errors.push(`Education Row #${idx + 1}: Highest Units Earned must be a number.`);
        }
        if (edu.replaceFile && !edu.file) {
          errors.push(
            `Education Row #${idx + 1}: Please upload the replacement file, or cancel the replace action.`,
          );
        }
      });

      form.eligibility.forEach((elig, idx) => {
        if (elig.replaceFile && !elig.file) {
          errors.push(
            `Eligibility Row #${idx + 1}: Please upload the replacement file, or cancel the replace action.`,
          );
        }
      });

      form.workExperience.forEach((work, idx) => {
        if (work.work_date_from && !isValidDate(work.work_date_from)) {
          errors.push(`Work Experience Row #${idx + 1}: "From" date is invalid.`);
        }
        if (!work.currently_working && work.work_date_to && !isValidDate(work.work_date_to)) {
          errors.push(`Work Experience Row #${idx + 1}: "To" date is invalid.`);
        }
        if (work.replaceFile && !work.file) {
          errors.push(
            `Work Experience Row #${idx + 1}: Please upload the replacement file, or cancel the replace action.`,
          );
        }
      });

      form.training.forEach((train, idx) => {
        if (train.replaceFile && !train.file) {
          errors.push(
            `L&D Intervention Row #${idx + 1}: Please upload the replacement file, or cancel the replace action.`,
          );
        }
      });

      return errors;
    }

    // ── Submit Form ──────────────────────────────────────────────────
    async function submitForm() {
      const errors = validateFormBeforeSubmit();
      if (errors.length > 0) {
        $q.notify({
          type: 'negative',
          message: errors[0],
          caption: errors.length > 1 ? `+${errors.length - 1} more issue(s) to fix` : undefined,
          position: 'top',
          timeout: 4000,
        });
        return;
      }

      isSubmitting.value = true;

      try {
        // Build the payload (includes all files including photo)
          const payload = await buildPayload();   // ✅ i-await


        // Use the store's submitApplication method
        // Pass null for photo since it's already in the payload
        const result = await pdsStore.submitApplication(payload, null);

        if (result.success) {
          const successMessage = result.message || 'Application submitted successfully!';
          $q.notify({
            type: 'positive',
            message: successMessage,
            position: 'top',
            timeout: 3000,
          });

          console.log('Response data:', result.data);
          emit('submit', payload);

          setTimeout(() => {
            router.push('/page');
          }, 1500);
        } else {
          const errorMessage = result.error || 'Failed to submit application. Please try again.';
          $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            timeout: 4000,
          });
        }
      } catch (error) {
        console.error('Submit error:', error);
        $q.notify({
          type: 'negative',
          message: error.message || 'An unexpected error occurred. Please try again.',
          position: 'top',
          timeout: 4000,
        });
      } finally {
        isSubmitting.value = false;
      }
    }
</script>

<style scoped>
  .pds-page {
    padding-left: 16px;
    padding-right: 16px;
    padding: var(--page-padding);
    max-width: 1300px;
    margin: 0 auto;
  }

  .sticky-header-card {
    position: sticky;
    top: var(--app-header-height, 0px);
    z-index: 100;
    margin: 0 calc(-1 * var(--page-padding)) 16px;
    width: calc(100% + 2 * var(--page-padding));
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .sticky-header-card .q-card-section {
    background: var(--q-primary) !important;
  }

  .pds-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .side-nav {
    flex: 0 0 250px;
    position: sticky;
    top: calc(var(--app-header-height, 0px) + var(--bar-offset) + 16px);
  }

  .side-nav-card {
    border-radius: 8px;
    overflow: hidden;
  }

  .side-nav-active {
    background: rgba(25, 118, 210, 0.08);
    color: var(--q-primary, #1976d2);
    font-weight: 600;
  }

  .pds-content {
    flex: 1;
    min-width: 0;
  }

  .scroll-target {
    scroll-margin-top: calc(
      var(--app-header-height, 0px) + var(--bar-offset) + var(--mobile-nav-offset) + 16px
    );
  }

  .mobile-nav {
    display: none;
  }

  .mobile-nav-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px 4px;
    scrollbar-width: thin;
  }

  .mobile-nav-scroll::-webkit-scrollbar {
    height: 4px;
  }

  .mobile-nav-scroll::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .mobile-nav-scroll::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }

  .photo-upload-wrap {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 2px dashed #cfd8dc;
    flex-shrink: 0;
  }

  .photo-thumb {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    object-fit: cover;
  }

  .photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
  }

  .hidden-input {
    display: none;
  }

  .section-label {
    font-weight: 600;
    color: #424242;
    margin-bottom: 12px;
    font-size: 0.95rem;
  }

  .upload-instruction-banner {
    border-left: 4px solid currentColor;
    border-radius: 8px;
  }

  .upload-section {
    border: 1px dashed #cfd8dc;
    border-radius: 4px;
    padding: 8px;
    background: #fafafa;
  }

  .upload-label {
    display: flex;
    align-items: center;
    font-weight: 500;
  }

  .wes-download-section {
    padding: 12px 16px;
    background: #f1f8f5;
    border-radius: 4px;
    border: 1px solid #c8e6c9;
  }

  .banner-text ul {
    margin: 0;
    padding-left: 20px;
  }

  .banner-text ul li {
    font-size: 0.875rem;
    line-height: 1.6;
  }

  /* ── Existing attachment display ───────────────────────────── */
  .existing-attachment-box {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    background: #eef5ff;
    border: 1px solid #cfe0fa;
    border-radius: 6px;
    gap: 2px;
  }

  .existing-attachment-box .ellipsis {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rounded-borders {
    border-radius: 8px;
  }

  @media (max-width: 1023px) {
    .side-nav {
      display: none;
    }

    .sticky-header-card {
      margin-bottom: 0;
    }

    .mobile-nav {
      display: block;
      position: sticky;
      top: calc(var(--app-header-height, 0px) + var(--bar-offset));
      z-index: 90;
      background: white;
      border-radius: 0;
      border-bottom: 1px solid #e0e0e0;
      margin: 0 calc(-1 * var(--page-padding)) 16px;
      width: calc(100% + 2 * var(--page-padding));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .pds-layout {
      display: block;
    }
  }

  @media (max-width: 599px) {
    .pds-page {
      --page-padding: 8px;
    }

    .photo-upload-wrap {
      width: 110px;
      height: 110px;
      margin: 0 auto;
    }

    .wes-download-section {
      flex-direction: column;
      align-items: flex-start;
    }

    .wes-download-btn {
      width: 100%;
      margin-bottom: 8px;
    }

    .banner-text ul {
      padding-left: 16px;
    }

    .banner-text ul li {
      font-size: 0.8rem;
    }

    .existing-attachment-box .ellipsis {
      max-width: 140px;
    }
  }

  @media (min-width: 1440px) {
    .upload-section {
      padding: 12px;
    }
  }
</style>
