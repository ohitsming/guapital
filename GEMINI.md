# Project Gemini Configuration: Guapital

This document outlines the strategic direction and conventions for the Guapital project for the Gemini assistant.

---

## Core Project Strategy

*   **Project:** Guapital
*   **Core Strategy:** The project's objective is to build a modern, privacy-first financial application designed to help users (particularly Gen Z) understand and track their net worth.
*   **Primary Value Proposition:** To provide a clear, simple, and motivating picture of one's financial health, moving beyond simple budgeting to focus on wealth generation.
*   **Target Audience:** Gen Z and young millennials seeking financial clarity and independence.

## Development Plan & Phases

### Phase 1 (Current Focus): The Core Net Worth MVP
*   **Goal:** Create a functional, single-user application to calculate and track net worth.
*   **My Role:** Implement user authentication, define the database schema, build the API layer for asset/liability management, and create the main dashboard UI.

### Phase 2 (Future): Insights and Historical Tracking
*   **Goal:** Provide users with deeper insights into their financial journey.
*   **Tasks:** Implement net worth snapshotting, display historical data on charts, and allow for categorization of assets and liabilities.

### Phase 3 (Future): Gamification & Motivation
*   **Goal:** Introduce opt-in, privacy-preserving features to motivate users.
*   **Tasks:** Implement tracking for an "Investment Rate" metric, build an anonymous percentile ranking system, and create an achievements/badges system for financial milestones.

## Technical Conventions

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Database & Auth:** Supabase
*   **Deployment:** AWS Amplify

---

## Execution Roadmap

### Milestone 1: The Core Net Worth MVP
*   **Goal:** Complete all tasks required for a functional Minimum Viable Product.
*   **Tasks:**
    *   [ ] **Rebranding** Rebrand the current project into a fincial networth tracking app.
    *   [ ] **Database Schema:** Create `assets` and `liabilities` tables in Supabase linked to user IDs.
    *   [ ] **User Authentication:** Ensure signup and login are fully functional.
    *   [ ] **API Layer:** Build API routes for full CRUD (Create, Read, Update, Delete) functionality for both assets and liabilities.
    *   [ ] **Frontend - Asset/Liability Management:** Create UI components to list, add, edit, and delete assets and liabilities.
    *   [ ] **Frontend - Dashboard:** Develop the main dashboard page that displays the calculated Net Worth and houses the management components.
