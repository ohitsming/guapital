import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const formData = await request.json();

    try {
        // 1. Insert/Update earner profile
        const { error: earnerError } = await supabase
            .from('earners')
            .upsert({
                user_id: user.id,
                age_range: formData.age_range,
                gender_identity: formData.gender_identity,
                gender_identity_other: formData.gender_identity_other,
                hispanic_origin: formData.hispanic_origin,
                racial_background: formData.racial_background,
                racial_background_other: formData.racial_background_other,
                education_level: formData.education_level,
                employment_status: formData.employment_status,
                employment_status_other: formData.employment_status_other,
                annual_household_income: formData.annual_household_income,
                marital_status: formData.marital_status,
                location_zip_code: formData.location_zip_code,
                location_country: formData.location_country,
                location_area_type: formData.location_area_type,
                location_area_type_other: formData.location_area_type_other,
                household_composition_total: formData.household_composition_total === '' ? null : formData.household_composition_total,
                household_composition_children: formData.household_composition_children === '' ? null : formData.household_composition_children,
                primary_language_home: formData.primary_language_home,
                fluent_languages: formData.fluent_languages,
                fluent_languages_other: formData.fluent_languages_other,
            }, { onConflict: 'user_id' });

        if (earnerError) throw earnerError;

        // 2. Update earner interests (delete existing and insert new)
        const { error: deleteError } = await supabase
            .from('earner_interests')
            .delete()
            .eq('earner_user_id', user.id);

        if (deleteError) throw deleteError;

        if (formData.selectedInterests.length > 0) {
            const earnerInterestsData = formData.selectedInterests.map((interestId: string) => ({
                earner_user_id: user.id,
                interest_id: interestId,
            }));
            const { error: insertInterestsError } = await supabase
                .from('earner_interests')
                .insert(earnerInterestsData);

            if (insertInterestsError) throw insertInterestsError;
        }

        // 3. Add 'earner' role to user's profile
        const { data: currentProfile, error: fetchProfileError } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', user.id)
            .single();

        if (fetchProfileError) throw fetchProfileError;

        const currentRoles = currentProfile?.roles || [];
        if (!currentRoles.includes('earner')) {
            const newRoles = [...currentRoles, 'earner'];
            const { error: updateRolesError } = await supabase
                .from('profiles')
                .update({ roles: newRoles, onboarding: true,  })
                .eq('id', user.id);

            if (updateRolesError) throw updateRolesError;
        }

        return NextResponse.json({ message: 'Earner Onboarding complete' }, { status: 200 });
    } catch (err: any) {
        console.error('API Onboarding error:', err);
        return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
    }
}