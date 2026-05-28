# Traffic Analytics Tracking System

This repository includes a complete tracking system: Frontend (React + Vite) → Backend (Express) → Google Sheets (Sheets API v4).

## Overview
- Frontend utilities: `src/utils/trackingService.js`, `src/hooks/usePageTracking.js`, `src/utils/trackingHelpers.js`
- Backend: `server/routes/trackingRoutes.js`, `server/controllers/trackingController.js`, `server/services/googleSheetsService.js`
- Environment variables (server):
  - `GOOGLE_SHEET_ID` - Spreadsheet ID (the long id in the sheet url)
  - `GOOGLE_CLIENT_EMAIL` - Service account client email
  - `GOOGLE_PRIVATE_KEY` - Service account private key (use escaped newlines or replace with real newlines)

## Google Cloud & Sheets Setup
1. Create a Google Cloud project and enable the Google Sheets API.
2. Create a Service Account in IAM & Admin.
3. Create and download a JSON key for the service account.
4. From the JSON, copy `client_email` → set `GOOGLE_CLIENT_EMAIL`.
5. From the JSON, copy `private_key` → set `GOOGLE_PRIVATE_KEY`. If adding to a `.env`, replace newlines with `\\n`.
6. Create a Google Sheet and note the Sheet ID from the URL (between `/d/` and `/edit`). Set `GOOGLE_SHEET_ID`.
7. Share the sheet with the service account email (Viewer or Editor as needed).
8. Create a tab named `Analytics` with these columns in row 1:
   - Timestamp | Event Type | Page | Referrer | Browser | Device | Screen Size | User Agent | Session ID | UTM Source | UTM Medium | UTM Campaign

## Env example (`server/.env`)

GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----\\n"

Other server envs: keep existing ones for the project.

## Frontend Integration
- Mount the `usePageTracking` hook at top-level (e.g., in `App.tsx`) to track pageviews and route changes:

```jsx
import usePageTracking from './hooks/usePageTracking';

function App() {
  usePageTracking();
  return <YourApp />;
}
```

- To track events manually (e.g., button clicks, enrollments):

```js
import trackingService from './utils/trackingService';

<button onClick={() => trackingService.trackEvent('cta_click', { cta: 'enroll_now', course_id: 'abc123' })}>Enroll</button>
```

## API Endpoints
- `POST /api/track/event` — send one event (JSON body)
- `POST /api/track/batch` — send many events in one call

Example payload:
```json
{
  "event_type": "page_view",
  "page": "/courses/intro",
  "timestamp": "2026-05-28T12:00:00.000Z",
  "session_id": "s_abcd1234",
  "user_agent": "...",
  "browser": "Chrome",
  "device": "desktop",
  "referrer": "https://google.com",
  "utm_source": "newsletter",
  "metadata": { "course_id": "abc123" }
}
```

## Curl Examples
- Single event:

```bash
curl -X POST https://your-api.example.com/api/track/event \
  -H "Content-Type: application/json" \
  -d '{"event_type":"form_submit","page":"/contact","session_id":"s_test","timestamp":"2026-05-28T12:00:00Z","user_agent":"curl"}'
```

- Batch events:

```bash
curl -X POST https://your-api.example.com/api/track/batch \
  -H "Content-Type: application/json" \
  -d '{"events":[{"event_type":"page_view","page":"/"},{"event_type":"cta_click","page":"/pricing"}]}'
```

## n8n Integration (Optional)
- Instead of sending events directly to Google Sheets from the backend, you can post to an n8n webhook and build a workflow to insert rows into Sheets using the Google Sheets node.
- Workflow idea:
  1. Webhook trigger (collect event payload).
  2. Optional filter: drop bots or duplicates.
  3. Google Sheets node: append row to `Analytics` sheet.
  4. Optional Slack/Email node for alerting on specific events.

## Spam Prevention & Scalability Notes
- Server uses express-rate-limit on tracking endpoints to mitigate abuse.
- Duplicate events are prevented with a short in-memory cache (per-server). For multi-instance deployments, consider Redis or other central cache.
- Bot filtering: add checks for user agent, missing referrer, suspicious rapid-fire per-session events, and CAPTCHA on high-risk actions.

## Dashboard Readiness
- The sheet layout is ready for Looker Studio; ensure `Timestamp` is parsed as a datetime column.
- Use `Event Type` and `Page` as primary dimensions; use `Session ID` to deduplicate.

## Next steps
- Add server environment variables to your deployment (Vercel, Heroku, DigitalOcean, etc.).
- Consider adding a small admin endpoint to export CSVs.

*** End of document ***
