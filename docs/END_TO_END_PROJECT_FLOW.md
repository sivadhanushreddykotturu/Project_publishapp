# LaunchOps end-to-end project flow

This document describes the implemented client, admin, and tester workflow. Backend state is authoritative; the UI reads these records and does not maintain a separate project lifecycle.

## 1. Account registration

### Client

1. The client authenticates through Clerk.
2. `POST /api/v1/users/sync` creates or loads the LaunchOps user and client profile.
3. Before the first redirect, the client must provide company name, contact name, and phone. Billing address and GSTIN are optional.
4. The account receives `profileCompletedAt` only after the details are saved.

### Tester

1. The tester authenticates through Clerk.
2. The tester completes phone, country, specialty, experience, device model, Android version, and UPI ID.
3. A stable browser device fingerprint is registered with the device.
4. An incomplete tester profile cannot join or be allocated to a project.

## 2. Client creates a project

1. A client without projects lands on `/client/new-app`; a client with projects lands on `/client/dashboard`.
2. The client selects the service and package, enters app details, required tester count, and device requirements.
3. `POST /api/v1/projects` creates the project and its six workflow steps.
4. The current temporary payment bypass activates the project immediately.
5. Admins receive a `project_request` notification.
6. Eligible testers receive `project_opportunity` notifications. UX-testing projects notify only testers whose specialty is UX Testing/User Experience Testing.

## 3. Tester enrollment and verification

1. A tester joins through `POST /api/v1/projects/:id/join`, or an admin allocates them.
2. The first required tester slots become active; overflow testers enter the three-person waitlist.
3. A tester may have at most three active projects.
4. The tester submits their Google Play email and Step 1 proof.
5. The admin sees **Approve Step 1** and either approves or rejects the proof.
6. Approval moves the tester to the Play Store invitation step. Rejection leaves a visible reason and allows resubmission.

## 4. Client adds tester emails to Google Play

1. The project exposes only Step-1-approved tester emails.
2. Copy remains disabled until 14 approved emails are available (or the project requires fewer than 14 on the backend).
3. The client copies the comma-separated list into the Google Play closed-testing tester list.
4. The client clicks **I Added These Emails to Play Console**.
5. `POST /api/v1/projects/:id/submit-email-review` records the confirmation and unlocks testing-link entry.

## 5. Client shares the Google Play testing link

1. After email confirmation, the client pastes a URL matching `https://play.google.com/apps/testing/...`.
2. **Save & Notify Testers** calls `POST /api/v1/projects/:id/testers-invited`.
3. The backend stores the real Google Play opt-in URL and marks the email-review gate verified when it was still submitted.
4. Every active, Step-1-approved tester receives a `testing_link` notification containing:
   - Project ID and app name
   - The real Google Play opt-in URL
   - A unique LaunchOps redirect URL (`/t/:assignmentId`)
5. Clicking the unique redirect records `testing_link_clicked` and redirects the tester to Google Play.
6. Updating the link and clicking **Update & Resend** creates a new notification batch.

## 6. Installation and 14-day testing

1. The tester opens the link, joins the Google Play test, installs the app, and submits the invitation/install proof.
2. Admin approval starts or advances the testing-period gate.
3. During testing, the tester uploads a real screenshot once every 48 hours. The backend rejects placeholder check-ins and uploads made before 48 hours have elapsed.
4. Testers submit bug reports with severity, reproduction steps, device/app information, and attachments.
5. Admins can curate, merge, and publish reports. Clients see project-scoped reports.

## 7. Project files

The project artifact endpoint combines three storage sources:

- Files uploaded by the client
- Tester workflow proof screenshots
- Bug-report attachments

Admins see all three categories in the project file panel. Clients and admins receive authenticated download links for stored objects.

## 8. Production and completion

1. The 14-day testing gate cannot complete early.
2. Admin applies for production after the testing period.
3. Admin confirms production approval after Google approves it.
4. The project becomes completed when the production milestone and tester completion requirements are satisfied.
5. Earnings enter the tester wallet ledger, and withdrawal requests are processed from the admin payout screen.

## Notification summary

| Event | Recipient | Notification type |
| --- | --- | --- |
| Project created | Admin | `project_request` |
| Active opportunity published | Eligible testers | `project_opportunity` |
| Tester allocated | Tester | `testing_link` allocation notice |
| Tester promoted from waitlist | Tester | `queue_promoted` |
| Email list submitted | Admin | `email_review_reminder` |
| Testing link saved | Eligible enrolled testers | `testing_link` |
| Support reply | Ticket owner | Support notification |

## Important gates

- Incomplete tester profiles cannot join projects.
- A tester cannot exceed three active projects.
- Tester email copying requires the approved-email threshold.
- The testing link cannot be submitted before the client confirms emails were added to Google Play.
- Testing screenshots are limited to one every 48 hours.
- Production cannot be requested before the mandatory testing duration ends.
