import { SchemaEntity, SchemaType, ObjectSchemaEntity, ArraySchemaEntity, PrimitiveSchemaEntity, CustomSchemaEntity, EntityID, StringSchemaEntity, NumberSchemaEntity } from '../types';

export function isValidSchemaType(type: unknown): type is SchemaType {
  return typeof type === 'string' && (['object', 'array', 'string', 'number', 'boolean', 'custom'] as SchemaType[]).includes(type as SchemaType);
}

export function isObjectSchemaEntity(schema: SchemaEntity): schema is ObjectSchemaEntity {
  return schema.type === 'object';
}

export function isArraySchemaEntity(schema: SchemaEntity): schema is ArraySchemaEntity {
  return schema.type === 'array';
}

export function isPrimitiveSchemaEntity(schema: SchemaEntity): schema is PrimitiveSchemaEntity {
  return ['string', 'number', 'boolean'].includes(schema.type);
}

export function isCustomSchemaEntity(schema: SchemaEntity): schema is CustomSchemaEntity {
  return schema.type === 'custom';
}

export function isStringSchemaEntity(schema: PrimitiveSchemaEntity): schema is StringSchemaEntity {
  return schema.type === 'string';
}

export function isNumberSchemaEntity(schema: PrimitiveSchemaEntity): schema is NumberSchemaEntity {
  return schema.type === 'number';
}

export function isValidEntityIDArray(value: unknown): value is EntityID[] {
  return Array.isArray(value) && value.every(isEntityID);
}

export function isEntityID(value: unknown): value is EntityID {
  return typeof value === 'string' || typeof value === 'number';
}