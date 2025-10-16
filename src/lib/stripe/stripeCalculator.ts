// calculateFees(totalWorkerPay: number, numWorkers: number)
export interface FeeBreakdown {
    gigWorkerFee: number;
    platformFee: number;
    totalFee: number;
}

const STRIPE_PERCENT_FEE: number = 0.029;
const STRIPE_FLAT_FEE: number = 0.30;
const FIXED_PLATFORM_FEE_PERCENTAGE: number = 0.1478;

export function calculateFees(businessBudget: number, numWorkers: number): FeeBreakdown{
    // 1. The amount paid to gig workers
    const gigWorkerPay: number = businessBudget;

    // 2. The platform's fee is a simple markup
    const platformFee: number = gigWorkerPay * FIXED_PLATFORM_FEE_PERCENTAGE;

    // 3. The total charge to the business is simply the sum of the above two
    const totalBusinessCharge: number = gigWorkerPay + platformFee;

    // 4. Calculate the fees the platform absorbs
    const stripeFees: number = (totalBusinessCharge * STRIPE_PERCENT_FEE) + STRIPE_FLAT_FEE;

    return {
        gigWorkerFee: gigWorkerPay,
        platformFee: platformFee,
        totalFee: totalBusinessCharge,
    };
}