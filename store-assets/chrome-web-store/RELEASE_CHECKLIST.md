# Chrome Web Store Release Checklist

## Store Assets

- [x] Source marketing screenshots saved under `screenshots/source/`.
- [x] Store-ready screenshots generated at `1280x800`.
- [x] Required small promo image generated at `440x280`.
- [ ] Capture one real in-browser usage screenshot showing the turtle peeking with the stretch bubble.
- [ ] Record a 30 to 45 second demo video for README, landing page, and social launch material.
- [ ] Decide whether to create English screenshot variants before global launch.

## Listing Content

- [x] Korean short description drafted.
- [x] Korean detailed description drafted.
- [x] English listing draft prepared.
- [x] Feature list drafted.
- [x] Permission usage explanation drafted.
- [x] Privacy policy draft prepared.
- [ ] Publish privacy policy to a stable public URL.
- [ ] Prepare support contact or support page URL.

## Extension Package

- [ ] Run `pnpm install` if dependencies are missing.
- [ ] Run `pnpm run build`.
- [ ] Confirm `dist/manifest.json` exists at the root of the build output.
- [ ] Run `pnpm run package:chrome`.
- [ ] Confirm the ZIP contains `manifest.json` at its root.
- [ ] Confirm the ZIP does not contain `agents_docs/`, `AGENTS.md`, `artifacts/`, root `assets/`, source files, or local validation files.

## Manual QA

- [ ] Load `dist/` through Chrome Extensions developer mode.
- [ ] Confirm first-run onboarding appears.
- [ ] Confirm the turtle is hidden before the selected reminder interval is due.
- [ ] Confirm reminder-time peeking overlay appears on a normal `http` or `https` page.
- [ ] Confirm the stretch bubble keeps the existing style.
- [ ] Confirm Start launches the 30-second stretch routine.
- [ ] Confirm completion increments today's record.
- [ ] Confirm 5-minute snooze hides the turtle and schedules the next reminder.
- [ ] Confirm popup and overlay settings use the same storage values.
- [ ] Confirm Chrome internal pages do not show the overlay and do not break the extension.

## Submission

- [ ] Register or confirm Chrome Web Store developer account.
- [ ] Upload the release ZIP.
- [ ] Fill Store Listing tab.
- [ ] Fill Privacy Practices tab.
- [ ] Fill Distribution tab.
- [ ] Add reviewer notes explaining the first-run and reminder test flow.
- [ ] Submit for review only after the user explicitly approves.
