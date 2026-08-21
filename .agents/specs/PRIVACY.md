# Privacy & Security Specification

## Principle

Source images are sensitive personal media. The core product must not require them to leave the user's device.

## MVP rules

- No upload endpoint for source images.
- No image blobs in analytics.
- No image data in console logs shipped to production.
- No persistent cloud storage of images.
- Use object URLs carefully and revoke them when no longer needed.
- Clear image buffers/references on session reset where practical.
- Do not include images in client error-report attachments.

## EXIF

When exporting, remove unnecessary metadata where the chosen encoder permits this. The goal is to avoid carrying GPS/location information into a form asset.

## Transparency

The UI should explain, in plain language, that processing occurs locally in the browser. If a future feature requires network access for an advanced model or service, this must be explicit and opt-in.

## Third-party models

A client-side ML model should be loaded only when needed. If model assets are hosted remotely, the product documentation must state that the model files are fetched from the network while user image processing remains local.
