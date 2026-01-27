# Drawing & Site Engineering Workflow Revamp - Walkthrough

I have successfully revamped the workflow for the Drawing & Site Engineering team to follow the strict 3-stage pipeline: **Site Visit -> Drawing -> BOQ**.

## Changes Implemented

### 1. New Core Statuses
Added new **ProjectStatus** enum values to `types.ts` to support the sequential workflow:
- `SITE_VISIT_PENDING`: Projects awaiting site measurement.
- `DRAWING_PENDING`: Projects where site visit is done, waiting for 2D drawings.
- `BOQ_PENDING`: Projects with uploaded drawings, waiting for BOQ submission.

### 2. Redesigned Projects Board
The **Projects Board** has been completely overhauled to a 4-column layout:
- **Site Inspection**: Lists projects in `SITE_VISIT_PENDING`.
    - **Action**: "Mark Visited" button. Moves project to `DRAWING_PENDING`.
- **Ready for Drawing**: Lists projects in `DRAWING_PENDING`.
    - **Action**: "Upload 2D Drawing" button. Moves project to `BOQ_PENDING`.
- **BOQ Submission**: Lists projects in `BOQ_PENDING`.
    - **Action**: "Submit BOQ" button. Opes the new BOQ Modal.
- **Completed**: Lists completed projects.

> [!NOTE]
> The **Drawing Overview Page** has also been updated to include projects in these new stages within the "Design Queue" list.

### 3. BOQ Submission Modal
Created a new `BOQSubmissionModal` component that allows engineers to submit:
- Item Name
- Quantity
- Description
*Submitting this form marks the project as `COMPLETED`.*

## Verification Steps

To verify the new workflow:
1.  **Navigate to Drawing Team Dashboard** -> **Projects Boards**.
2.  **Step 1: Site Visit**
    - Find a project in "Site Inspection".
    - Click **"Mark Visited"**.
    - Confirm the prompt.
    - **Result**: Project moves to "Ready for Drawing".
3.  **Step 2: Drawing Upload**
    - Find the project in "Ready for Drawing".
    - Click **"Upload 2D Drawing"**.
    - Enter a dummy filename (e.g., "plan.pdf").
    - **Result**: Project moves to "BOQ Submission".
4.  **Step 3: BOQ**
    - Find the project in "BOQ Submission".
    - Click **"Submit BOQ"**.
    - Fill out the form (Item: "Tiles", Qty: "100").
    - Click Submit.
    - **Result**: Project moves to "Completed".
