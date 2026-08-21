# Validation Specification

## Validation philosophy

Validation checks whether the generated asset matches the configured technical constraints. It must not claim official acceptance.

## Checks

### Format

Confirm MIME type/extension matches the requirement.

### Dimensions

Confirm exact width/height when specified.

### Aspect ratio

Compare actual and target aspect ratio within a documented tolerance when the output dimensions are derived.

### File size

Compare byte count to minimum/maximum/target requirements.

### Background

Optional heuristic only. Mark as advisory unless the requirement is objectively measurable.

### Face checks

Optional advisory checks:

- face detected
- approximate center
- blur
- lighting
- orientation

Do not label these as official compliance unless an exact rule exists.

## Result shape

```ts
type ValidationCheck = {
  id: string;
  label: string;
  status: 'pass' | 'attention' | 'not-run';
  details?: string;
};

type ValidationResult = {
  status: 'pass' | 'attention';
  checks: ValidationCheck[];
};
```
