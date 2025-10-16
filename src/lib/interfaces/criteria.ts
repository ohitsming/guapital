export interface TargetingCriteria {
    age_range?: string;
    gender_identity?: string;
    gender_identity_other?: string;
    hispanic_origin?: boolean;
    racial_background?: string[];
    racial_background_other?: string;
    education_level?: string;
    employment_status?: string;
    employment_status_other?: string;
    annual_household_income?: string;
    marital_status?: string;
    location_zip_code?: string;
    location_country?: string;
    location_area_type?: string;
    location_area_type_other?: string;
    household_composition_total?: number | string;
    household_composition_children?: number | string;
    primary_language_home?: string;
    fluent_languages?: string[];
    fluent_languages_other?: string;
  }
  