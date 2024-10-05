/**
 * Represents an error that occurs during schema validation.
 * 
 * @param message - The error message.
 * @param context - Additional context about the error.
 */
export class SchemaValidationError extends Error {
    constructor(message: string, public context: Record<string, unknown>) {
      super(message);
      this.name = 'SchemaValidationError';
    }
  }
  
  /**
   * Represents an error that occurs during normalization.
   * 
   * @param message - The error message.
   * @param context - Additional context about the error.
   * @param cause - The underlying error that caused this error.
   */
  export class NormalizationError extends Error {
    constructor(message: string, public context: Record<string, unknown>, public cause?: Error) {
      super(message);
      this.name = 'NormalizationError';
    }
  }

  /**
 * Represents an error that occurs during denormalization.
 * 
 * @param message - The error message.
 * @param context - Additional context about the error.
 * @param cause - The underlying error that caused this error.
 */
  export class DenormalizationError extends Error {
    constructor(message: string, public context: Record<string, unknown>) {
      super(message);
    this.name = 'DenormalizationError';
  }
}
