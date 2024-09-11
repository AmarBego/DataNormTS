export class SchemaValidationError extends Error {
    constructor(message: string, public context: Record<string, unknown>) {
      super(message);
      this.name = 'SchemaValidationError';
    }
  }
  
  export class NormalizationError extends Error {
    constructor(message: string, public context: Record<string, unknown>, public cause?: Error) {
      super(message);
      this.name = 'NormalizationError';
    }
  }