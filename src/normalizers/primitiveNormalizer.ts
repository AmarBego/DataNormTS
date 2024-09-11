import { PrimitiveSchemaEntity, StringSchemaEntity, NumberSchemaEntity } from '../types';
import { NormalizationError } from '../errors';
import { isStringSchemaEntity, isNumberSchemaEntity } from './utils';


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

function validateNumberValue(value: number, schema: NumberSchemaEntity): void {
  if (schema.minimum !== undefined && value < schema.minimum) {
    throw new NormalizationError('Number below minimum', { value, minimum: schema.minimum, schema });
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    throw new NormalizationError('Number exceeds maximum', { value, maximum: schema.maximum, schema });
  }
}