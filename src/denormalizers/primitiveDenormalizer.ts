import { PrimitiveSchemaEntity } from '../types';
import { DenormalizationError } from '../errors';

export function denormalizePrimitive(value: unknown, schema: PrimitiveSchemaEntity): unknown {
  if (typeof value !== schema.type) {
    throw new DenormalizationError('Type mismatch during denormalization', { expectedType: schema.type, actualType: typeof value, value });
  }
  return value;
}