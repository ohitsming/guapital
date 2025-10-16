import { createContext, useReducer, useContext, ReactNode } from 'react';
import { SurveyQuestion } from '../interfaces/survey';

// 1. Define the State Interface
interface CampaignFormState {
    campaignTitle: string;
    campaignDescription: string;
    totalBudget: string;
    participantQuota: string;
    surveyQuestions: SurveyQuestion[];
    age_range: string | null;
    gender_identity: string | null;
    gender_identity_other: string | null;
    hispanic_origin: boolean | null;
    racial_background: string | null;
    racial_background_other: string | null;
    education_level: string | null;
    employment_status: string | null;
    employment_status_other: string | null;
    annual_household_income: string | null;
    marital_status: string | null;
    location_zip_code: string | null;
    location_country: string | null;
    location_area_type: string | null;
    location_area_type_other: string | null;
    household_composition_total: number | null;
    household_composition_children: number | null;
    primary_language_home: string | null;
    fluent_languages: string[] | string | null;
    fluent_languages_other: string | null;
}

// 2. Define Action Types
type CampaignFormAction =
    | { type: 'UPDATE_FIELD'; payload: { name: keyof CampaignFormState; value: string | any[] | boolean | number | null } }
    | { type: 'SET_SURVEY_QUESTIONS'; payload: SurveyQuestion[] }
    | { type: 'RESET_FORM' };

// 3. Create the Reducer Function
function campaignFormReducer(state: CampaignFormState, action: CampaignFormAction): CampaignFormState {
    switch (action.type) {
        case 'UPDATE_FIELD':
            return {
                ...state,
                [action.payload.name]: action.payload.value,
            };
        case 'SET_SURVEY_QUESTIONS':
            return {
                ...state,
                surveyQuestions: action.payload,
            };
        case 'RESET_FORM':
            return {
                campaignTitle: '',
                campaignDescription: '',
                totalBudget: '',
                participantQuota: '',
                surveyQuestions: [],
                age_range: null,
                gender_identity: null,
                gender_identity_other: null,
                hispanic_origin: null,
                racial_background: null,
                racial_background_other: null,
                education_level: null,
                employment_status: null,
                employment_status_other: null,
                annual_household_income: null,
                marital_status: null,
                location_zip_code: null,
                location_country: null,
                location_area_type: null,
                location_area_type_other: null,
                household_composition_total: null,
                household_composition_children: null,
                primary_language_home: null,
                fluent_languages: null,
                fluent_languages_other: null,
            };
        default:
            return state;
    }
}

// 4. Create the Context
interface CampaignFormContextType {
    state: CampaignFormState;
    dispatch: React.Dispatch<CampaignFormAction>;
}

const CampaignFormContext = createContext<CampaignFormContextType | undefined>(undefined);

// 5. Create the Context Provider Component
export function CampaignFormProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(campaignFormReducer, {
        campaignTitle: '',
        campaignDescription: '',
        totalBudget: '',
        participantQuota: '',
        surveyQuestions: [],
        age_range: null,
        gender_identity: null,
        gender_identity_other: null,
        hispanic_origin: null,
        racial_background: null,
        racial_background_other: null,
        education_level: null,
        employment_status: null,
        employment_status_other: null,
        annual_household_income: null,
        marital_status: null,
        location_zip_code: null,
        location_country: null,
        location_area_type: null,
        location_area_type_other: null,
        household_composition_total: null,
        household_composition_children: null,
        primary_language_home: null,
        fluent_languages: null,
        fluent_languages_other: null,
    });

    return (
        <CampaignFormContext.Provider value={{ state, dispatch }}>
            {children}
        </CampaignFormContext.Provider>
    );
}

// 6. Create a Custom Hook to Consume the Context
export function useCampaignForm() {
    const context = useContext(CampaignFormContext);
    if (context === undefined) {
        throw new Error('useCampaignForm must be used within a CampaignFormProvider');
    }
    return context;
}
