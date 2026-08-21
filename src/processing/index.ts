export { ProcessingError, type ProcessingErrorCode } from './errors'
export {
  computeCropRect,
  computeResizeDimensions,
  dimensionsFromPhysical,
  type FocusPoint,
  type Rect,
  type Size,
} from './geometry'
export {
  cropToAspectRatio,
  cropToCanvas,
  defaultCanvasFactory,
  type CanvasFactory,
  type CanvasLike,
  type DrawableSource,
} from './crop'
export { resizeToCanvas } from './resize'
export {
  encodeCanvas,
  isOutputFormat,
  MIME_BY_FORMAT,
  OUTPUT_FORMATS,
  type OutputFormat,
} from './encode'
export {
  assertDecodableFile,
  decodeImage,
  isSupportedImageType,
  SUPPORTED_INPUT_TYPES,
  type DecodedImage,
} from './decode'
export { dimensionsOf, inspectImage, type ImageMetadata } from './metadata'
export {
  createCanvasEncoder,
  optimizeEncoding,
  type EncodeAt,
  type OptimizationOutcome,
  type OptimizationResult,
  type OptimizeOptions,
} from './optimize'
