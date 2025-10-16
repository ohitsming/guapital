
export type AgeRange =
  | "Under 18"
  | "18-24 years old"
  | "25-34 years old"
  | "35-44 years old"
  | "45-54 years old"
  | "55-64 years old"
  | "65 years or older"
  | "Prefer not to disclose"
  | undefined;

export type GenderIdentity =
  | "Woman"
  | "Man"
  | "Transgender woman"
  | "Transgender man"
  | "Non-binary"
  | "Genderqueer or gender nonconforming"
  | "Agender"
  | "Two-spirited"
  | "An identity not listed"
  | "Prefer not to disclose";

export type HispanicOrigin = "Yes" | "No" | "Prefer not to say" | undefined;

export type RacialBackground =
  | "American Indian or Alaska Native"
  | "Asian (e.g., East Asian, South Asian, Southeast Asian)"
  | "Black or African American"
  | "Native Hawaiian or Other Pacific Islander"
  | "White"
  | "Middle Eastern or North African"
  | "Some other race, ethnicity, or origin"
  | "Prefer not to say";

export type EducationLevel =
  | "Less than high school degree"
  | "High school degree or equivalent (e.g., GED)"
  | "Some college but no degree"
  | "Associate degree"
  | "Bachelor's degree"
  | "Master's degree"
  | "Doctorate degree"
  | "Professional degree (e.g., MD, JD)"
  | "Prefer not to say"
  | undefined;

export type EmploymentStatus =
  | "Employed full-time"
  | "Employed part-time"
  | "Self-employed"
  | "Contract or temporary"
  | "Unemployed and looking for work"
  | "Unemployed and not currently looking for work"
  | "Student"
  | "Retired"
  | "Homemaker"
  | "Unable to work"
  | "Other (please specify)"
  | "Prefer not to say"
  | undefined;

export type AnnualHouseholdIncome =
  | "Less than $25,000"
  | "$25,000 - $49,999"
  | "$50,000 - $74,999"
  | "$75,000 - $99,999"
  | "$100,000 - $149,999"
  | "$150,000 - $199,999"
  | "$200,000 or more"
  | "Prefer not to say"
  | undefined;

export type MaritalStatus =
  | "Single, never married"
  | "Married or in a domestic partnership"
  | "Widowed"
  | "Divorced"
  | "Separated"
  | "Prefer not to say"
  | undefined;

export type LocationAreaType =
  | "Urban"
  | "Suburban"
  | "Rural"
  | "Other (please specify)"
  | undefined;

export type FluentLanguage =
  | "English"
  | "Spanish"
  | "Chinese"
  | "Hindi"
  | "Arabic"
  | "Bengali"
  | "Portuguese"
  | "Russian"
  | "Japanese"
  | "German"
  | "French"
  | "Korean"
  | "Italian"
  | "Urdu"
  | "Vietnamese"
  | "Other";

export interface EarnerFormData {
    age_range: AgeRange;
    gender_identity: GenderIdentity[];
    gender_identity_other: string;
    hispanic_origin: HispanicOrigin;
    racial_background: RacialBackground[];
    racial_background_other: string;
    education_level: EducationLevel;
    employment_status: EmploymentStatus;
    employment_status_other: string;
    annual_household_income: AnnualHouseholdIncome;
    marital_status: MaritalStatus;
    location_zip_code: string;
    location_country: string;
    location_area_type: LocationAreaType;
    location_area_type_other: string;
    household_composition_total: number | string;
    household_composition_children: number | string;
    primary_language_home: string | undefined;
    fluent_languages: FluentLanguage[];
    fluent_languages_other: string;
    selectedInterests: string[];
}
