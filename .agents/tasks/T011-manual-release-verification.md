# T011 — Pre-release manual verification pass (V2 gate)

**Priority:** P0 (first V2 task; operational release gate)
**Depends on:** MVP complete (T001–T010 + MVP audit fixes, 2026-08-22)

## Goal

Complete the items of `.agents/docs/RELEASE_CHECKLIST.md` that cannot be
verified by automated checks, on real devices/browsers.

## Scope

1. Photo flow on a real phone: upload, camera capture (permission grant +
   denial fallback), crop with touch, download.
2. Signature flow on a real phone: draw with finger/stylus, upload scan,
   download.
3. Desktop cross-browser smoke pass: Chrome, Firefox, Safari (WebP encode
   failure path where unsupported), including a large photo (≥ 12 MP).
4. Offline behavior: second load with network disabled, service-worker
   install/update, theme persistence.
5. Confirm no network requests carry image bytes (DevTools) in all flows.
6. Record results in this file; file follow-up tasks for any defect found
   instead of fixing ad hoc.

## Non-goals

- New features. Preset-fidelity work is tracked separately as T012.
- Automated test additions beyond what a defect requires.

## Acceptance criteria

- [ ] All RELEASE_CHECKLIST boxes checked or explicitly waived with reasons.
- [ ] Results recorded below with device/browser/OS details.
- [ ] STATE.md updated with the outcome.
