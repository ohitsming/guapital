import { TargetingCriteria } from '@/lib/interfaces/criteria';

interface CriteriaDisplayProps {
    criteria: TargetingCriteria;
}

const CriteriaDisplay: React.FC<CriteriaDisplayProps> = ({ criteria }) => {
    if (!criteria) {
        return <p>No targeting criteria specified.</p>;
    }

    const renderField = (label: string, value: any) => {
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === '') {
            return null;
        }
        return (
            <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{Array.isArray(value) ? value.join(', ') : value.toString()}</dd>
            </div>
        );
    };

    return (
        <dl className="divide-y divide-gray-200">
            {renderField('Age Range', criteria.age_range)}
            {renderField('Gender Identity', criteria.gender_identity)}
            {renderField('Other Gender Identity', criteria.gender_identity_other)}
            {renderField('Hispanic or Latino Origin', criteria.hispanic_origin !== null ? (criteria.hispanic_origin ? 'Yes' : 'No') : null)}
            {renderField('Racial Background', criteria.racial_background)}
            {renderField('Other Racial Background', criteria.racial_background_other)}
            {renderField('Education Level', criteria.education_level)}
            {renderField('Employment Status', criteria.employment_status)}
            {renderField('Other Employment Status', criteria.employment_status_other)}
            {renderField('Annual Household Income', criteria.annual_household_income)}
            {renderField('Marital Status', criteria.marital_status)}
            {renderField('Location Zip Code', criteria.location_zip_code)}
            {renderField('Location Country', criteria.location_country)}
            {renderField('Location Area Type', criteria.location_area_type)}
            {renderField('Other Location Area Type', criteria.location_area_type_other)}
            {renderField('Household Members', criteria.household_composition_total)}
            {renderField('Household Children', criteria.household_composition_children)}
            {renderField('Primary Language', criteria.primary_language_home)}
            {renderField('Fluent Languages', criteria.fluent_languages)}
            {renderField('Other Fluent Languages', criteria.fluent_languages_other)}
        </dl>
    );
};

export default CriteriaDisplay;
