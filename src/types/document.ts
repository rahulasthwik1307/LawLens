export type DocumentLifecycleState =
  | "idle"
  | "selected"
  | "validating"
  | "processing"
  | "ready"
  | "error"

export interface UploadedDocument {
  id: string
  name: string
  size: number
  type: string
  extension: string
  content: string
  isTextReadable: boolean
  lineCount: number
  wordCount: number
  uploadedAt: Date
  jurisdiction: string
  isSample?: boolean
}

export type ValidationErrorType =
  | "unsupported_type"
  | "file_too_large"
  | "empty_file"
  | "read_error"

export interface ValidationError {
  type: ValidationErrorType
  title: string
  message: string
  suggestion: string
}

export interface ValidationResult {
  isValid: boolean
  error?: ValidationError
  document?: UploadedDocument
}
