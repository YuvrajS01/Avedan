# Product Requirements Document — Avedan

## 1. Product summary

Avedan is a client-side web app that helps users prepare passport-style photographs, signatures, thumb impressions, and other application images to the technical requirements specified by government forms, exams, recruitment portals, scholarships, and educational applications.

## 2. Problem

Users frequently need the same image in exact dimensions, aspect ratios, file formats, and narrow file-size ranges. Existing image editors expose too many low-level controls and still require users to know how to reach the target constraints.

The product should hide the complexity and let users work from requirements rather than image-editing concepts.

## 3. Target users

### Primary

- Government exam applicants
- Job/recruitment applicants
- Scholarship applicants
- University/college applicants
- Students submitting online forms

### Secondary

- Coaching institutes
- Colleges and placement cells
- Recruitment agencies
- Office administrators processing batches of applications

## 4. Core value proposition

**Prepare application-ready photos and signatures without installing software or uploading personal images.**

## 5. MVP scope

### Photo

- Upload image
- Capture via browser camera
- Fixed aspect-ratio crop
- Resize to specified dimensions
- Convert format
- Target a file-size range
- Download processed image
- Technical validation summary

### Signature

- Upload image
- Draw signature in browser
- Remove empty margins
- Resize
- Convert format
- Target file-size range
- Download processed signature

### Custom requirements

- Width/height in pixels
- Optional physical size in mm/cm
- Optional DPI
- File format
- Minimum/maximum bytes
- Target file size
- Background mode where supported

### Presets

- Schema for exam/application requirements
- Source URL/reference
- Authority
- Last verified date
- Manual verification workflow

### Privacy

- No image upload backend
- No image content in analytics
- Session-local processing

## 6. Post-MVP scope

### Phase 2

- Face detection
- Auto face positioning
- Blur detection
- Lighting guidance
- Background uniformity check
- White background mode
- EXIF cleanup
- PWA/offline support
- Recent local projects

### Phase 3

- Form presets for popular applications
- Batch processing
- ZIP export
- Thumb impression preparation
- Application kit generation

### Phase 4

- Client-side background removal
- Document scan/crop/perspective correction
- PDF generation/compression
- OCR-assisted workflows
- Institution workflows

## 7. Non-goals

The MVP is not a general-purpose photo editor. Do not prioritize filters, artistic effects, social templates, complex layers, or AI portrait generation.

## 8. Functional requirements

### FR-01 Requirement definition

The app must represent an image-processing job as a typed set of constraints.

### FR-02 Image intake

The app must accept supported local image files through file picker and drag-and-drop on desktop.

### FR-03 Camera intake

The app should use browser camera APIs for live capture where permission and browser support are available.

### FR-04 Crop

The cropper must maintain the target aspect ratio and provide user-adjustable framing.

### FR-05 Resize

The processor must generate exact target pixel dimensions when specified.

### FR-06 Compression

The processor should meet maximum file-size constraints while preserving the highest practical visual quality.

### FR-07 Validation

Before download, the app must report resulting format, dimensions, and file size and indicate whether explicit constraints are satisfied.

### FR-08 Signature drawing

The app must provide a basic pen canvas with clear/reset support.

### FR-09 Export

The user must be able to download the output file without server-side processing.

### FR-10 Presets

Preset requirements must be represented independently of UI code.

## 9. Non-functional requirements

- Responsive on common phones and desktops.
- Core flow usable with keyboard navigation.
- Clear focus states.
- Avoid unnecessary large dependencies.
- Processing should not freeze the UI for common image sizes.
- Memory use should be bounded and temporary assets released after session reset.
- Core photo/signature workflow should remain functional without a backend.

## 10. Privacy requirements

- No raw image data sent to analytics.
- No server upload in MVP.
- No default permanent storage of source images.
- Avoid embedding sensitive image data in errors/logging.
- Clear privacy explanation near the intake flow.

## 11. Success metrics

### Product metrics

- Completion rate from image intake to download
- Median time to successful output
- Validation failure rate after optimization
- Percentage of users who finish without opening advanced controls

### Technical metrics

- Client-side processing error rate
- Median processing time by input size
- Memory failures/crashes
- Browser compatibility

## 12. Product quality bar

A first-time user should be able to take a phone photo, select a requirement preset, and produce a technically compliant asset without knowing what JPEG quality, aspect ratio, canvas size, or DPI means.
