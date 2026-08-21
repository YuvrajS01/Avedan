# Requirements Schema

The processing engine consumes a generic requirements object.

```ts
type OutputFormat = 'jpeg' | 'png' | 'webp';

type BackgroundMode = 'original' | 'white' | 'transparent';

type ImageRequirements = {
  format: OutputFormat;

  aspectRatio?: {
    width: number;
    height: number;
  };

  pixelSize?: {
    width: number;
    height: number;
  };

  physicalSizeMm?: {
    width: number;
    height: number;
  };

  dpi?: number;

  fileSizeBytes?: {
    min?: number;
    max?: number;
    target?: number;
  };

  background?: BackgroundMode;

  features?: {
    faceGuidance?: boolean;
    blurCheck?: boolean;
    lightingCheck?: boolean;
  };
};
```

## Preset metadata

```ts
type FormPreset = {
  id: string;
  name: string;
  authority: string;
  applicationYear?: number;
  description?: string;
  lastVerified: string;
  sourceUrl?: string;
  photo?: ImageRequirements;
  signature?: ImageRequirements;
  thumbImpression?: ImageRequirements;
};
```

## Example

```json
{
  "id": "example-form",
  "name": "Example Form",
  "authority": "Example Authority",
  "applicationYear": 2026,
  "lastVerified": "2026-08-21",
  "sourceUrl": "https://example.gov/",
  "photo": {
    "format": "jpeg",
    "pixelSize": { "width": 413, "height": 531 },
    "fileSizeBytes": { "min": 20480, "max": 51200 },
    "background": "white"
  },
  "signature": {
    "format": "jpeg",
    "fileSizeBytes": { "min": 10240, "max": 20480 }
  }
}
```

The example values are illustrative and must not be presented as official requirements for a real application.
