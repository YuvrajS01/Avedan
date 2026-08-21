# Test Strategy

## Unit tests

Test pure functions for:

- aspect ratio calculations
- crop rectangle calculations
- dimension calculations from mm/DPI
- file-size formatting
- constraint evaluation
- optimizer search behavior
- requirement preset parsing
- validation results

## Integration tests

Cover:

- upload → crop → optimize → validate → download
- draw signature → trim → optimize → validate
- custom requirements
- preset selection
- invalid/corrupt file handling

## Browser tests

Cover supported mobile/desktop flows with a real browser automation tool once the UI is available.

## Property-style tests

Useful properties:

- exact requested dimensions remain exact
- optimizer never returns a file over an explicit maximum when a valid candidate exists
- aspect ratio remains within documented tolerance
- reset clears job state

## Manual test matrix

At minimum test Chromium, Firefox, and Safari-class browsers where available, plus mobile Safari/Chrome.
