# HelpBot – Screenshots & Voice Notes (Firebase Storage)

## You do **not** need to create any folder or “collection” in Storage

- **Firebase Storage** is like a file system: paths (e.g. `attachments/helpbot-reports/...`) are **created automatically** when the **first file is uploaded** to that path.
- There are no “collections” in Storage; only paths. The folder `attachments/helpbot-reports/` will **appear in the Firebase Console** after the first successful upload from the app.

## Where files are stored

| What        | Storage path |
|------------|------------------------------------------|
| Screenshot | `attachments/helpbot-reports/{reportId}/{uploadId}/screenshot.png` (or .jpg) |
| Voice note | `attachments/helpbot-reports/{reportId}/{uploadId}/voice.webm` |

## How to see them in Firebase

1. Open [Firebase Console](https://console.firebase.google.com) → your project (**kurchi-app**).
2. Go to **Build** → **Storage** → **Files**.
3. You should see an **attachments** folder (it appears after the first successful HelpBot upload).
4. Open **attachments** → **helpbot-reports** → then one folder per report ID → inside that, the screenshot and/or voice file.

If you don’t see **attachments** at all, no HelpBot file has been uploaded successfully yet. In that case:

- Ensure **Storage rules** are deployed: `firebase deploy --only storage`
- Ensure **Firestore rules** allow the report creator to update the report (so `screenshotUrl` and `voiceNoteUrl` can be saved after upload)
- Submit a new report **with** a screenshot or voice note and check the browser Network tab for any failed requests

## Rules that must be in place

- **Storage** (`storage.rules`): `match /attachments/{allPaths=**}` with `allow read, write: if request.auth != null;`
- **Firestore** (`firestore.rules`): `errorReports` – creator can **update** their own report (so the app can write the download URLs after upload).

No manual folder creation in the Console is required.
