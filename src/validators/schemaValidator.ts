import { SchemaValidationError } from '../errors';
import { Schema } from '../types';
import { validateSchemaEntity } from './validators';

/**
 * Validates a complete schema against a set of predefined rules.
 * 
 * This function checks if the provided schema is a valid object and not an array. 
 * It then iterates through each property of the schema and validates its value using the validateSchemaEntity function.
 * 
 * @param {Schema} schema - The schema to validate. It must be a non-array object.
 * @throws {SchemaValidationError} If the schema is invalid, an error is thrown with a message indicating the problem.
 */
export function validateSchema(schema: Schema): void {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new SchemaValidationError('Invalid schema: must be a non-array object', { schema });
  }

  for (const [key, value] of Object.entries(schema)) {
    validateSchemaEntity(value, key, true);
  }
}