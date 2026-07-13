# Chrome Web Store Privacy Disclosure Draft

## Data Handling Summary

Turtle Neck Buddy is designed to run locally in the browser. It does not require an account and does not send stretch settings or records to an external server.

## Data Stored Locally

The extension stores the following values in Chrome extension storage:

- Stretch reminder interval
- Next reminder timing
- On/off setting
- Snooze state
- Language preference
- Turtle size preference
- Quiet mode preference
- Daily stretch completion count
- Weekly stretch record
- First-run onboarding completion state

## Data Not Collected

The extension does not intentionally collect:

- Names
- Email addresses
- Payment information
- Authentication credentials
- Personal communications
- Web browsing history for analytics or profiling
- Page content for external processing
- Location
- Health records

## External Transmission

No user settings, records, page content, or browsing activity are transmitted to a remote server by the current implementation.

## Permission Use

### `storage`

Used to save reminder settings, onboarding completion, preferences, and local stretch records.

### `alarms`

Used to schedule the next stretch reminder without requiring a constantly running page script.

### `notifications`

Reserved for browser-level stretch notifications when an overlay cannot be shown.

### `activeTab`

Used when the user clicks the extension icon and starts an immediate stretch routine on the current page.

### `scripting`

Used to inject or activate the turtle overlay on the current page when the user enables the extension for that site.

### Optional host permissions: `http://*/*`, `https://*/*`

Used only so the turtle overlay can appear on normal web pages where the user wants stretch reminders. The extension does not use this access to collect or transmit page content.

## Privacy Policy Draft

Turtle Neck Buddy stores reminder settings, preferences, and stretch records locally in your browser using Chrome extension storage. This information is used only to provide stretch reminders, guided routines, snooze behavior, and local progress records.

Turtle Neck Buddy does not require an account, does not sell personal data, and does not transmit your settings, stretch records, page content, or browsing activity to an external server.

The extension may request access to normal web pages so it can display the turtle stretch reminder overlay. This access is used only to show and control the overlay on pages where the extension is allowed to run.

If future versions add cloud sync, accounts, analytics, payments, or remote AI features, this policy must be updated before release.

## Pre-Submission Notes

- Confirm the final Developer Dashboard privacy answers match this document.
- Publish this privacy policy at a stable public URL before submitting the store listing.
- Re-check this document whenever permissions or data flow change.
