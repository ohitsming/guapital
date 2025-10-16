// src/lib/featureFlags.ts

// This flag controls whether the application is in a pre-launch, disabled state.
// When true, core functionalities might be turned off or restricted.
// Controlled by the NEXT_PUBLIC_PRE_LAUNCH_MODE environment variable.
export const PRE_LAUNCH_MODE: boolean = process.env.NEXT_PUBLIC_PRE_LAUNCH_MODE === 'true';

// You can add other feature flags here as needed, e.g.:
// export const ENABLE_BETA_FEATURES: boolean = process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true';
