# UI/UX Specification

## Design goal

Avedan should feel like a simple utility, not a professional graphics editor.

## UX principles

1. Requirement-first: show what the output needs to be before users edit.
2. One primary action per screen.
3. Progressive disclosure: simple defaults, advanced controls on demand.
4. Preserve user control: show previews and allow reset.
5. Mobile-first, desktop-capable.
6. Trust through transparency: explain that processing happens locally.

## Core information architecture

- Home
- Photo
- Signature
- Forms
- Custom
- Optional later: Application Kit

## Home

Headline:

**Make your photo and signature form-ready.**

Supporting line:

**Crop, resize, compress and validate in your browser.**

Primary actions:

- Prepare Photo
- Prepare Signature
- Select a Form
- Custom Requirements

Privacy message:

**Your image stays on this device while you process it.**

## Photo flow

### Step A — Intake

Options:

- Upload photo
- Take photo
- Paste from clipboard where supported

Show the target constraints immediately if a preset is selected.

### Step B — Crop

- Fixed aspect-ratio frame
- Pan
- Zoom
- Reset
- Auto-align when available

### Step C — Adjust

Basic controls:

- Background
- Brightness (optional)
- Rotation

Advanced:

- Physical size/DPI
- Manual pixel size
- Compression preferences

### Step D — Optimize

Primary action: **Make it fit**

Show:

- Current estimated size
- Target range
- Processing progress

Do not force users to manipulate JPEG quality manually for normal use.

### Step E — Validate

A compact checklist:

- Dimensions
- Aspect ratio
- Format
- File size
- Optional face/background heuristics

### Step F — Download

Show final summary and a large download action.

## Signature flow

Options:

- Upload signature
- Draw signature
- Capture signature

Drawing canvas:

- pen size
- clear
- undo
- redo
- finish

After capture/upload:

- auto-trim whitespace
- threshold/ink cleanup
- resize
- compression

## Forms flow

Search or browse presets.

Each preset card should show:

- Application name
- Authority
- Photo constraints
- Signature constraints
- Last verified date
- Official source/reference

Avoid claiming the preset guarantees acceptance.

## Validation language

Good:

- `✓ 42 KB — within the 20–50 KB range`
- `✓ 413 × 531 px`
- `✓ JPEG`
- `Technical checks passed`

Avoid:

- `Guaranteed to be accepted`
- `Officially approved`

## Error UX

Errors should tell the user what to do next.

Bad:

`EncodingError: canvas.toBlob failed`

Good:

`This image could not be exported at the selected settings. Try JPG or reduce the output dimensions.`

## Responsive behavior

### Mobile

- Full-width controls
- Large touch targets
- Camera capture is first-class
- Bottom-anchored primary action when useful

### Desktop

- Preview on left/right with controls alongside
- Drag and drop
- Keyboard shortcuts where helpful

## Visual language

Suggested direction:

- Clean neutral background
- One accent color
- High contrast text
- Rounded but not overly playful cards
- Minimal decoration
- Strong use of whitespace

The UI should communicate reliability and speed.
