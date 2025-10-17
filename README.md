# Project Guapital: Personal Net Worth Tracker

## 1. Core Concept

Project Guapital is a modern, privacy-first financial application designed to help users, particularly from Gen Z, understand and track their net worth. The core mission is to provide a clear, simple, and motivating picture of one's financial health, moving beyond simple budgeting to focus on wealth generation.

The app will be built on the principle of manual entry first, promoting mindfulness about financial assets and liabilities. Future iterations will introduce gamification and social features in a secure, opt-in, and anonymous manner.

- **Target Audience:** Gen Z and young millennials seeking financial clarity and independence.
- **Core Value:** Simplicity, Privacy, and Motivation.

---

## 2. Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Deployment:** AWS Amplify

---

## 3. Project Plan & Milestones

### Milestone 1: The Core Net Worth MVP

**Goal:** Create a functional, single-user application to calculate and track net worth.

| Feature ID | Description | Status |
| :--- | :--- | :--- |
| MVP-01 | **User Authentication:** Allow users to sign up and log in securely using Supabase Auth. | To Do |
| MVP-02 | **Database Schema:** Create `assets` and `liabilities` tables in Supabase linked to user IDs. | To Do |
| MVP-03 | **Asset Management:** Full CRUD (Create, Read, Update, Delete) functionality for user assets (e.g., Cash, Stocks, Crypto, Real Estate). | To Do |
| MVP-04 | **Liability Management:** Full CRUD functionality for user liabilities (e.g., Student Loans, Credit Card Debt, Mortgages). | To Do |
| MVP-05 | **Net Worth Dashboard:** A clean, protected UI page that displays: Total Assets, Total Liabilities, and the calculated Net Worth. | To Do |

### Milestone 2: Insights and Historical Tracking

**Goal:** Provide users with deeper insights into their financial journey.

| Feature ID | Description | Status |
| :--- | :--- | :--- |
| H-01 | **Net Worth History:** Automatically snapshot net worth data periodically (e.g., monthly). | To Do |
| H-02 | **Historical Chart:** Display a chart showing the user's net worth progression over time. | To Do |
| H-03 | **Categorization:** Allow users to categorize their assets and liabilities for more granular analysis. | To Do |
| H-04 | **Summary View:** A dashboard view showing the breakdown of assets and liabilities by category (e.g., a pie chart). | To Do |

### Milestone 3: Gamification & Motivation

**Goal:** Introduce opt-in, privacy-preserving features to motivate users.

| Feature ID | Description | Status |
| :--- | :--- | :--- |
| G-01 | **Investment Rate Metric:** Track the percentage of income a user invests each month. | To Do |
| G-02 | **Anonymous Percentile Ranking:** Implement the opt-in system for users to see their anonymous percentile ranking for metrics like `Investment Rate` and `Net Worth`. | To Do |
| G-03 | **Contextual Filters:** Allow users to filter percentile rankings by relevant cohorts like age and income bracket. | To Do |
| G-04 | **Achievements System:** Award badges for hitting financial milestones (e.g., "Net Worth Positive," "Debt-Free," "Investor"). | To Do |

---

## 4. Future Ideas & Backlog

- Plaid integration for automatic account syncing.
- Multi-currency support.
- Financial goal setting and tracking (e.g., "Save for a down payment").
- More advanced data visualizations.
