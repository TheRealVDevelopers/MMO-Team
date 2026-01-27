# Implementation Plan - Drawing Team Workflow Revamp

The goal is to implement a strict 3-stage sequential workflow for the Drawing & Site Engineering team:
**Site Visit (Measurement) -> Drawing (2D) -> BOQ (Bill of Quantities)**

## User Review Required
> [!IMPORTANT]
> This change introduces new `ProjectStatus` enum values. Any existing projects might need migration or manual status update if they don't fit these new categories.

## Proposed Changes

### Core Types
#### [MODIFY] [types.ts](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/types.ts)
- Update `ProjectStatus` enum to include:
    - `SITE_VISIT_PENDING`
    - `DRAWING_PENDING`
    - `BOQ_PENDING`

### Dashboard UI
#### [MODIFY] [ProjectsBoardPage.tsx](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/components/dashboard/drawing-team/ProjectsBoardPage.tsx)
- Redesign the Kanban board to strictly show 4 columns/sections:
    1.  **Site Inspection** (Status: `SITE_VISIT_PENDING`)
        - Action: "Mark Visited" button.
    2.  **Ready for Drawing** (Status: `DRAWING_PENDING`)
        - Action: "Upload Drawing" button (opens file picker).
    3.  **BOQ Submission** (Status: `BOQ_PENDING`)
        - Action: "Submit BOQ" button (opens BOQ modal).
    4.  **Completed** (Status: `COMPLETED`)

#### [NEW] [BOQSubmissionModal.tsx](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/components/dashboard/drawing-team/BOQSubmissionModal.tsx)
- Simple modal form with:
    - Item Name
    - Quantity
    - Description (Optional)
- Submits data to Firestore and updates project status to `COMPLETED`.

## Verification Plan

### Manual Verification
1.  **Site Visit Flow:**
    - Login as Site Engineer.
    - Go to Projects Board.
    - Click "Mark Visited" on a project in "Site Inspection".
    - Verify it moves to "Ready for Drawing".
2.  **Drawing Flow:**
    - Click "Upload Drawing" on the same project.
    - Upload a dummy file.
    - Verify it moves to "BOQ Submission".
3.  **BOQ Flow:**
    - Click "Submit BOQ".
    - Fill in "Flooring", "100 sqft".
    - Submit.
    - Verify project moves to "Completed".
