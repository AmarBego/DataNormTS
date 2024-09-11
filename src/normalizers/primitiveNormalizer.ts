import { PrimitiveSchemaEntity, StringSchemaEntity, NumberSchemaEntity } from '../types';
import { NormalizationError } from '../errors';
import { isStringSchemaEntity, isNumberSchemaEntity } from './normalizationUtils';

/**
 * Normalizes a primitive value based on the provided schema.
 * 
 * @param value - The value to normalize.
 * @param schema - The schema to use for normalization.
 * @returns The normalized value.
 * @throws {NormalizationError} If the value does not match the schema type or fails additional validation.
 */
export function normalizePrimitive(value: unknown, schema: PrimitiveSchemaEntity): unknown {
  if (typeof value !== schema.type) {
    throw new NormalizationError('Type mismatch', { expectedType: schema.type, actualType: typeof value, value, schema });
  }

  switch (schema.type) {
    case 'string':
      if (isStringSchemaEntity(schema)) {
        validateStringValue(value as string, schema);
      }
      break;
    case 'number':
      if (isNumberSchemaEntity(schema)) {
        validateNumberValue(value as number, schema);
      }
      break;
    case 'boolean':
      // No additional validation needed for boolean
      break;
  }
  return value;
}

/**
 * Validates a string value against a StringSchemaEntity.
 * 
 * @param value - The string value to validate.
 * @param schema - The StringSchemaEntity to use for validation.
 * @throws {NormalizationError} If the string value fails validation.
 */
function validateStringValue(value: string, schema: StringSchemaEntity): void {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    throw new NormalizationError('String length below minimum', { value, minLength: schema.minLength, actualLength: value.length, schema });
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    throw new NormalizationError('String length exceeds maximum', { value, maxLength: schema.maxLength, actualLength: value.length, schema });
  }
  if (schema.pattern !== undefined) {
    try {
      if (!new RegExp(schema.pattern).test(value)) {
        throw new NormalizationError('String does not match pattern', { value, pattern: schema.pattern, schema });
      }
    } catch (error) {
      throw new NormalizationError('Invalid pattern in schema', { error: (error as Error).message, schema });
    }
  }
}

/**
 * Validates a number value against a NumberSchemaEntity.
 * 
 * @param value - The number value to validate.
 * @param schema - The NumberSchemaEntity to use for validation.
 * @throws {NormalizationError} If the number value fails validation.
 */
function validateNumberValue(value: number, schema: NumberSchemaEntity): void {
  if (schema.minimum !== undefined && value < schema.minimum) {
    throw new NormalizationError('Number below minimum', { value, minimum: schema.minimum, schema });
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    throw new NormalizationError('Number exceeds maximum', { value, maximum: schema.maximum, schema });
  }
}