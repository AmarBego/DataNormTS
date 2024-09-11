import { 
    SchemaType, 
    SchemaEntity, 
    ObjectSchemaEntity, 
    ArraySchemaEntity, 
    PrimitiveSchemaEntity,
    CustomSchemaEntity,
    StringSchemaEntity,
    NumberSchemaEntity,
    BooleanSchemaEntity
} from '../types';

/**
 * Checks if the given type is a valid SchemaType.
 * 
 * @param type - The type to check.
 * @returns True if the type is a valid SchemaType, otherwise false.
 */
export function isValidSchemaType(type: unknown): type is SchemaType {
  return typeof type === 'string' && (['object', 'array', 'string', 'number', 'boolean', 'custom'] as SchemaType[]).includes(type as SchemaType);
}

/**
 * Checks if the given schema is an ObjectSchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is an ObjectSchemaEntity, otherwise false.
 */
export function isObjectSchemaEntity(schema: SchemaEntity): schema is ObjectSchemaEntity {
  return schema.type === 'object';
}

/**
 * Checks if the given schema is an ArraySchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is an ArraySchemaEntity, otherwise false.
 */
export function isArraySchemaEntity(schema: SchemaEntity): schema is ArraySchemaEntity {
  return schema.type === 'array';
}

/**
 * Checks if the given schema is a PrimitiveSchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is a PrimitiveSchemaEntity, otherwise false.
 */
export function isPrimitiveSchemaEntity(schema: SchemaEntity): schema is PrimitiveSchemaEntity {
  return ['string', 'number', 'boolean'].includes(schema.type);
}

/**
 * Checks if the given schema is a CustomSchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is a CustomSchemaEntity, otherwise false.
 */
export function isCustomSchemaEntity(schema: SchemaEntity): schema is CustomSchemaEntity {
  return schema.type === 'custom';
}

/**
 * Checks if the given schema is a StringSchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is a StringSchemaEntity, otherwise false.
 */
export function isStringSchemaEntity(schema: PrimitiveSchemaEntity): schema is StringSchemaEntity {
  return schema.type === 'string';
}

/**
 * Checks if the given schema is a NumberSchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is a NumberSchemaEntity, otherwise false.
 */
export function isNumberSchemaEntity(schema: PrimitiveSchemaEntity): schema is NumberSchemaEntity {
  return schema.type === 'number';
}

/**
 * Checks if the given schema is a BooleanSchemaEntity.
 * 
 * @param schema - The schema to check.
 * @returns True if the schema is a BooleanSchemaEntity, otherwise false.
 */
export function isBooleanSchemaEntity(schema: PrimitiveSchemaEntity): schema is BooleanSchemaEntity {
  return schema.type === 'boolean';
}