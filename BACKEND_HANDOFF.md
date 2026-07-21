# LaunchOps — Backend Handoff & API Specification Document

> **Target Audience**: Backend Developers / API Engineers  
> **Frontend Stack**: Next.js 15, React 19, TypeScript, TailwindCSS  
> **API Module Location**: [`frontend/src/lib/api.ts`](file:///c:/Users/deven/Downloads/launchtest/frontend/src/lib/api.ts)  
> **Data Types Definition**: [`frontend/src/types.ts`](file:///c:/Users/deven/Downloads/launchtest/frontend/src/types.ts)  

---

## 1. Overview & Architecture

LaunchOps is an enterprise Android app testing platform that pairs app developers (Clients) with real human testers (Testers) supervised by Platform Admins. 

The frontend relies on RESTful JSON APIs. An abstracted API client module is provided in `src/lib/api.ts` which connects to `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:5000/api`).

---

## 2. Recommended Database Schema & Models

### A. `users` (Clients, Testers, Admins)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key |
| `email` | String (Unique) | User email address |
| `name` | String | Full user name |
| `role` | Enum (`client`, `tester`, `admin`) | User platform role |
| `upi_id` | String (Optional) | Tester UPI Cashout ID |
| `wallet_balance` | Decimal | Current withdrawable balance |
| `rating` | Float | Tester rating score (e.g. 4.9) |
| `created_at` | Timestamp | Account creation time |

---

### B. `apps` (Projects / Submissions)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key |
| `client_id` | UUID / Foreign Key | Reference to user (Client) |
| `project_name` | String | Display project name |
| `name` | String | Application display name |
| `package_name` | String | Play Store Package ID (e.g. `com.demo.app`) |
| `version` | String | Release version (e.g. `1.0.4`) |
| `status` | Enum (`Draft`, `Testing`, `Completed`) | Campaign lifecycle state |
| `package_tier` | Enum (`testers_only`, `managed_testing`, `launch_ready`, `custom`) | Pricing tier |
| `testers_required` | Integer | Required tester count (default: 14) |
| `progress` | Float | Progress percentage (0.0 to 100.0) |
| `apk_url` | String | Download link or direct APK storage URL |
| `release_notes` | Text | Version release notes |
| `demo_credentials` | Text | Test account login details |
| `instructions` | Text | Flow testing instructions for testers |
| `verification_status` | Enum (`none`, `pending`, `approved`, `rejected`) | Vetting verification state |
| `invoice_status` | Enum (`none`, `awaiting_payment`, `paid`) | Payment status |

---

### C. `tester_assignments` (Testing Pipeline & Pacing)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key |
| `tester_id` | Foreign Key | Reference to user (Tester) |
| `project_id` | Foreign Key | Reference to app (App) |
| `status` | Enum (`active`, `queued`, `completed`) | Pipeline state |
| `current_step` | SmallInt (1 to 6) | Milestone step (1: Email, 2: Vetting, 3: Install, 4: 14-day check-in, 5: Complete) |
| `tester_email` | String | Play Store Google Email |
| `step1_screenshot` | String | Play Store profile proof image URL |
| `step3_screenshot` | String | App installed screenshot proof image URL |
| `step4_checkins_completed` | Integer | Count of continuous check-ins (0 to 14) |
| `step4_last_checkin` | Timestamp | Date of last check-in |

---

### D. `bugs` (Flaws & Bug Reports)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key |
| `app_id` | Foreign Key | Reference to `apps.id` |
| `tester_id` | Foreign Key | Reference to `users.id` |
| `title` | String | Short issue title |
| `category` | Enum (`UI/UX`, `Crash`, `Functionality`, `Performance`, `Other`) | Flaw category |
| `severity` | Enum (`Critical`, `High`, `Medium`, `Low`) | Severity level |
| `status` | Enum (`Open`, `Investigating`, `Resolved`) | Flaw status |
| `device` | String | Test device (e.g. `Pixel 7 - Android 14`) |
| `reproduction_steps` | Text / JSON Array | Steps to reproduce |
| `screenshot` | String (Optional) | Proof screenshot URL |
| `screen_recording_url` | String (Optional) | Proof video URL |
| `is_published` | Boolean | Admin visibility filter |
| `admin_notes` | Text (Optional) | Notes added by Admin |

---

### E. `withdrawals` (UPI Cashout Requests)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID / String | Primary Key |
| `tester_id` | Foreign Key | Reference to user |
| `amount` | Decimal | Withdrawal amount in ₹ |
| `upi_id` | String | UPI ID (e.g. `tester@upi`) |
| `status` | Enum (`pending`, `completed`, `rejected`) | SLA state |
| `transaction_id` | String (Optional) | Bank UTR / Transaction Reference |
| `created_at` | Timestamp | Request timestamp |

---

## 3. Key Business Rules & Logic Workflows

### 1. **The 14-Tester Rule**
- Each project campaign requires exactly **14 verified testers** in Step 1.
- When tester 15 attempts to join, their status should be set to `queued` with `queuePosition`.
- If an active tester becomes inactive (>48h without check-in), the system flags `inactivityFlag: true` and promotes the next queued tester.

### 2. **5-Step Milestone Pacing Pipeline**
- **Step 1**: Tester submits Play Store Google Email & screenshot proof.
- **Step 2**: Admin verifies submission.
- **Step 3**: Tester receives Play Store link, downloads app, and uploads installation screenshot.
- **Step 4**: Tester performs 14-day continuous daily check-ins (`step4CheckInsCompleted`).
- **Step 5**: Campaign completed. Payout is credited to the tester's wallet balance.

### 3. **UPI Cashouts & Wallet SLA**
- Minimum withdrawal threshold: **₹100**.
- Default SLA timeline: **48 Hours**.

---

## 4. API Endpoints Specification

### Auth Routes
- `POST /api/auth/login` — Parameters: `{ email, role }` -> Returns `{ token, user }`
- `POST /api/auth/register` — Parameters: `{ email, name, role, ... }` -> Returns `{ message }`
- `GET /api/auth/me` — Headers: `Authorization: Bearer <token>` -> Returns `{ user }`

### App & Project Routes
- `GET /api/apps` — Returns array of `TestApp`
- `POST /api/apps` — Body: `{ name, packageName, packageTier, apkUrl, releaseNotes, demoCredentials, instructions }` -> Returns created `TestApp`
- `POST /api/apps/:id/vetting` — Body: `{ proofUrl }` -> Updates `verificationStatus` to `pending`

### Tester Assignment Routes
- `GET /api/assignments?testerId=:id` — Returns array of `TesterAssignment`
- `POST /api/assignments/join` — Body: `{ projectId, testerEmail, screenshotProof }`
- `POST /api/assignments/:id/step3-proof` — Body: `{ screenshotProof }`
- `POST /api/assignments/:id/check-in` — Increases `step4CheckInsCompleted` by 1

### Bug Reporting Routes
- `GET /api/bugs` — Returns array of `BugReport`
- `POST /api/bugs` — Body: `{ appId, title, category, severity, device, reproductionSteps, screenshot }`
- `PATCH /api/bugs/:id` — Body: `{ status, isPublished, adminNotes }`

### Wallet & Payout Routes
- `POST /api/wallet/withdraw` — Body: `{ testerId, amount, upiId }` -> Creates `WithdrawalRequest`
- `GET /api/wallet/transactions?testerId=:id` — Returns array of `Transaction`

---

## 5. Connecting Frontend to Real Backend

1. Create a `.env.local` file inside the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://your-backend-host:5000/api
   ```
2. Run `npm run dev` in `frontend/`.
3. The frontend will automatically make HTTP requests to your backend via [`src/lib/api.ts`](file:///c:/Users/deven/Downloads/launchtest/frontend/src/lib/api.ts).
