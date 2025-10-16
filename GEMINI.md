# Project Gemini Configuration: LocalMoco

This document outlines the strategic direction and conventions for the LocalMoco project for the Gemini assistant.

---

## Core Project Strategy

*   **Project:** LocalMoco
*   **Core Strategy (Pivot as of Oct 2025):** The project has pivoted from a two-sided marketplace to a "business-first," single-player tool. This is to solve the classic chicken-and-egg problem inherent in marketplace models.
*   **Primary Value Proposition:** An **AI-powered survey builder**. The key differentiator against competitors like SurveyMonkey or Google Forms is the use of generative AI to create effective surveys from simple, goal-oriented prompts.
*   **Target Audience:** Businesses, entrepreneurs, product managers, and marketers who need to gather user feedback quickly and efficiently.

## Development Plan & Phases

1.  **Phase 1 (Current Focus): AI Survey Builder.**
    *   **Goal:** Build and market the best AI-driven survey creation tool.
    *   **My Role:** Assist in developing AI-centric features, refining the business-focused UI/UX, and implementing a simplified, business-first roadmap.

2.  **Phase 2 (Future): The Earner Panel.**
    *   **Goal:** Introduce an "opt-in" marketplace as a powerful upsell/add-on feature.
    *   **Mechanism:** Businesses with existing surveys can choose to pay a fee to have them filled out by a pre-vetted panel of "earners."

## Technical Conventions

*   **Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase (DB/Auth), Stripe (Payments), Gemini (AI).
*   **Focus:** When developing, prioritize features that enhance the survey creation and analysis experience for the business user.
*   **Language:** Use clear, business-centric language in UI/UX copy. Avoid marketplace-specific terms like "earner" or "task" in the primary business-facing UI, unless it's in the context of the Phase 2 panel.

---

## Pivot Execution Roadmap

### Phase 1: Streamline the UI to be "Business-First"
*   **Goal:** Remove all user-facing elements related to the "earner" marketplace.
*   **Tasks:**
    *   [ ] Deprecate earner-specific pages (`/earner`, `/dashboard/onboarding-earner`, `/dashboard/(protected)/earner`).
    *   [ ] Remove "For Earners" links from navigation and footer.
    *   [ ] Remove `SwitchToEarnerButton` and `SwitchToBusinessButton` components.
    *   [ ] Rewrite landing page (`/`) content to focus on the AI Survey Builder.

### Phase 2: Simplify Onboarding and Core Workflow
*   **Goal:** Create a frictionless path for a business user to sign up and generate a survey.
*   **Tasks:**
    *   [ ] Make the business onboarding flow the single, default experience.
    *   [ ] Ensure onboarding flows directly into the survey creation process.

### Phase 3: Build Out the AI Survey Experience
*   **Goal:** Deliver a robust and user-friendly survey creation, distribution, and analysis loop.
*   **Tasks:**
    *   [ ] Enhance the AI survey generator (`/api/gemini/generate-survey`).
    *   [ ] Build the UI for survey creation.
    *   [ ] Implement survey sharing/distribution via a public link.
    *   [ ] Create the dashboard for viewing and analyzing survey results.