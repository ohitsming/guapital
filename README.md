# LocalMoco: AI-Powered Survey & Feedback Tool

**LocalMoco** is an AI-powered tool that helps businesses create high-quality surveys and feedback forms in seconds. Stop guessing at what questions to ask and let AI build an effective survey based on your goals.

---

## 🌎 Project Overview

For most businesses, finding the right market fit is a critical challenge. The biggest hurdle in validating ideas and understanding customer needs isn't just gathering feedback, but asking the *right* questions to get actionable data. LocalMoco solves this by using generative AI to transform your business goals into a well-structured, unbiased survey, helping you confidently validate market fit and drive product success.

**The core workflow is simple:**

1.  **Describe Your Goal:** Tell the AI what you want to learn. For example:
    *   *"Test a new logo for my coffee brand."*
    *   *"Get feedback on a new feature for my SaaS app."*
    *   *"Understand customer satisfaction with my e-commerce store."*
2.  **Generate Survey:** The AI engine drafts a survey with relevant, unbiased, and effective questions.
3.  **Distribute & Analyze:** Share your survey via a simple link and watch the results come in through a clean, easy-to-understand dashboard.

This approach saves time, reduces bias, and dramatically increases the quality of insights you receive.

---

## Execution Roadmap

### 📧 Phase 0: Email List Generation
*   **Goal: Build an initial audience and generate interest for the upcoming launch.**
*   [x] Pivot current application to focus on Business.
*   [x] Set up a landing page with an email signup form.
*   [ ] Implement email marketing automation for early bird sign-ups.
*   [ ] Drive traffic to the landing page through targeted campaigns.

### 🚀 Phase 1: The AI Survey Builder
*   **Goal: Onboard the first 100 users to the free tier and validate the AI survey generator.**
*   [ ] Refine the AI survey generation engine.
*   [ ] Build out the core survey creation, distribution, and analytics loop.
*   [ ] Develop a robust free tier to encourage adoption.

### 🛡️ Phase 2: Monetization & Pro Tools
*   **Goal: Convert 10% of free users to the Business Pro subscription.**
*   [ ] Launch the **Business Pro** subscription with Stripe.
*   [ ] Build advanced AI analytics and data export features.
*   [ ] Create pre-built survey templates for common use cases.

### 💸 Phase 3: The Earner Panel
*   **Goal: Successfully process the first paid campaigns to the earner panel.**
*   [ ] Build the infrastructure for the opt-in earner marketplace.
*   [ ] Implement a business wallet and payment system for panel responses.
*   [ ] Develop an onboarding flow for earners.

---

## 🧱 Tech Stack

| Layer       | Stack                    |
|-------------|--------------------------|
| Frontend    | Next.js + Tailwind CSS   |
| Backend     | Supabase (DB + Auth + RLS) |
| **AI**      | **Gemini for Survey Generation & Analysis** |
| Payments    | Stripe                   |

---

## USP

1. Core USP: Go from Goal to Questions, Instantly.
    * Pain Solved: The "Blank Page" problem.
    * Your Feature: A user types a simple goal ("I want to test a new pricing model for my SaaS product"), and your AI generates a statistically sound, 
        unbiased, and well-structured survey. This is your hook.

2. AI-Powered Analysis & Reporting.
    * Pain Solved: Analysis paralysis.
    * Your Feature: This is your knockout punch. After responses are collected, the AI doesn't just give the user a CSV file. It automatically:
        * Analyzes sentiment of open-ended responses.
        * Identifies key themes and clusters similar comments.
        * Generates a summary report in plain English, complete with charts and key takeaways (e.g., "73% of users found the pricing confusing, with many 
            mentioning the 'Pro' tier as the main point of friction.").
    * Why it Wins: Google Forms and SurveyMonkey make the user do all this work manually. You do it for them.

---

## 💰 Business Model & Pricing Strategy

LocalMoco operates on a Freemium model with two paid subscription tiers: Pro and Business. Our pricing is designed to scale with the needs of our users, from individuals exploring AI-powered survey generation to growing teams requiring advanced features and collaboration.

### 1. Free Tier
*   **Price:** $0/month
*   **Includes:** Unlimited Surveys, 50 Responses per Survey, Basic Analytics, 500 AI Credits/month.
*   **Justification:** Allows users to experience the core AI survey generation capabilities and validate the tool's value without commitment.

### 2. Pro Subscription
*   **Price:** $19/month (or $190 annually)
*   **Includes:** 2,500 Responses per Survey, AI-Powered Analysis (coming soon), Data Export (CSV) (coming soon), Custom Branding (coming soon), 10,000 AI Credits/month.
*   **Justification:** Designed for professionals needing higher response volumes and more AI capacity. The current pricing reflects a temporary adjustment to acknowledge that some advanced features (AI-Powered Analysis, Data Export, Custom Branding) are still under development. This makes the Pro tier more accessible while we build out its full capabilities.

### 3. Business Subscription
*   **Price:** $49/month (or $490 annually)
*   **Includes:** 10,000 Responses per Survey, Team Collaboration (coming soon), Slack & Sheets Integrations (coming soon), 50,000 AI Credits/month.
*   **Justification:** Tailored for teams requiring extensive response limits, significant AI credits, and future collaboration/integration features. Similar to the Pro tier, the current pricing is adjusted to reflect the "coming soon" status of team collaboration and integrations, ensuring value for the current feature set while anticipating future enhancements.

Our pricing strategy aims to provide immediate value through our powerful AI survey generator, with future feature releases progressively enhancing the value proposition of our paid tiers.

---