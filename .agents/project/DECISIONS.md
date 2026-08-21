# Architecture & Product Decisions

## D001 — Client-side image processing

**Decision:** All core image processing runs in the browser.

**Reason:** Government application photos/signatures are sensitive personal data. The app's primary trust proposition is that images do not need to leave the user's device.

## D002 — Requirements are configuration data

**Decision:** Form requirements are represented as typed data objects.

**Reason:** Exam/application requirements change independently from processing algorithms and UI.

## D003 — Presets need source metadata

**Decision:** Every public form preset carries authority, source URL/reference, and last-verified date.

**Reason:** Stale application requirements can cause real-world submission problems.

## D004 — No acceptance guarantee

**Decision:** Validation is described as technical compatibility guidance, not official acceptance.

**Reason:** The downstream portal may enforce undocumented or changing rules.

## D005 — Processing engine separate from UI

**Decision:** Pure processing functions should not depend on React components.

**Reason:** Makes unit testing, worker execution, and future reuse much easier.

## D006 — Optimize to constraints

**Decision:** The compressor prioritizes satisfying required format/dimensions/file-size constraints while maximizing quality.

**Reason:** Users care about the portal's constraints, not JPEG quality numbers.

## D007 — Advanced features are progressive enhancement

**Decision:** Face guidance, background removal, and ML-based checks should not block basic photo preparation.

**Reason:** Core utility should remain fast and broadly compatible.
