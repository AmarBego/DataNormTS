import { SchemaValidationError } from './errors';
import { 
    Schema, 
    SchemaEntity, 
    SchemaType, 
    ObjectSchemaEntity, 
    ArraySchemaEntity, 
    CustomSchemaEntity,
    PrimitiveSchemaEntity,
    StringSchemaEntity,
    NumberSchemaEntity,
    BooleanSchemaEntity
} from './types';

/** Maximum allowed depth for nested schemas */
const MAX_DEPTH = 100;

/**
 * Type guard to check if a value is a valid SchemaType
 * @param type - The value to check
 * @returns True if the value is a valid SchemaType, false otherwise
 */
function isValidSchemaType(type: unknown): type is SchemaType {
  return typeof type === 'string' && (['object', 'array', 'string', 'number', 'boolean', 'custom'] as SchemaType[]).includes(type as SchemaType);
}

/**
 * Type guard for ObjectSchemaEntity
 * @param schema - The schema to check
 * @returns True if the schema is an ObjectSchemaEntity, false otherwise
 */
function isObjectSchemaEntity(schema: SchemaEntity): schema is ObjectSchemaEntity {
  return schema.type === 'object';
}

/**
 * Type guard for ArraySchemaEntity
 * @param schema - The schema to check
 * @returns True if the schema is an ArraySchemaEntity, false otherwise
 */
function isArraySchemaEntity(schema: SchemaEntity): schema is ArraySchemaEntity {
  return schema.type === 'array';
}

/**
 * Type guard for PrimitiveSchemaEntity
 * @param schema - The schema to check
 * @returns True if the schema is a PrimitiveSchemaEntity, false otherwise
 */
function isPrimitiveSchemaEntity(schema: SchemaEntity): schema is PrimitiveSchemaEntity {
  return ['string', 'number', 'boolean'].includes(schema.type);
}

/**
 * Type guard for CustomSchemaEntity
 * @param schema - The schema to check
 * @returns True if the schema is a CustomSchemaEntity, false otherwise
 */
function isCustomSchemaEntity(schema: SchemaEntity): schema is CustomSchemaEntity {
  return schema.type === 'custom';
}

/**
 * Type guard for StringSchemaEntity
 * @param schema - The schema to check
 * @returns True if the schema is a StringSchemaEntity, false otherwise
 */
function isStringSchemaEntity(schema: PrimitiveSchemaEntity): schema is StringSchemaEntity {
  return schema.type === 'string';
}

/**
 * Type guard for NumberSchemaEntity
 * @param schema - The schema to check
 * @returns True if the schema is a NumberSchemaEntity, false otherwise
 */
function isNumberSchemaEntity(schema: PrimitiveSchemaEntity): schema is NumberSchemaEntity {
  return schema.type === 'number';
}

/**
 * Validates an object schema
 * @param entity - The object schema to validate
 * @param path - The current path in the schema
 * @param isTopLevel - Whether this is a top-level schema
 * @param depth - The current depth in the schema
 */
function validateObjectSchema(entity: ObjectSchemaEntity, path: string, isTopLevel: boolean, depth: number): void {
  if (isTopLevel && !entity.name) {
    throw new SchemaValidationError(`Top-level object schema must have a name at path: ${path}`, { path, entity });
  }
  if (!entity.properties || typeof entity.properties !== 'object') {
    throw new SchemaValidationError(`Object schema must have properties at path: ${path}`, { path, entity });
  }
  for (const [key, value] of Object.entries(entity.properties)) {
    validateSchemaEntity(value, `${path}.${key}`, false, depth + 1);
  }
}

/**
 * Validates an array schema
 * @param entity - The array schema to validate
 * @param path - The current path in the schema
 * @param depth - The current depth in the schema
 */
function validateArraySchema(entity: ArraySchemaEntity, path: string, depth: number): void {
  if (!entity.items || typeof entity.items !== 'object') {
    throw new SchemaValidationError(`Array schema must have items at path: ${path}`, { path, entity });
  }
  validateSchemaEntity(entity.items, `${path}.items`, false, depth + 1);
}

/**
 * Validates a primitive schema (string, number, or boolean)
 * @param entity - The primitive schema to validate
 * @param path - The current path in the schema
 */
function validatePrimitiveSchema(entity: PrimitiveSchemaEntity, path: string): void {
  if (isStringSchemaEntity(entity)) {
    validateStringSchema(entity, path);
  } else if (isNumberSchemaEntity(entity)) {
    validateNumberSchema(entity, path);
  }
  // No additional validation needed for boolean
}

/**
 * Validates a string schema
 * @param entity - The string schema to validate
 * @param path - The current path in the schema
 */
function validateStringSchema(entity: StringSchemaEntity, path: string): void {
  if (entity.minLength !== undefined) {
    if (typeof entity.minLength !== 'number' || entity.minLength < 0) {
      throw new SchemaValidationError(`minLength must be a non-negative number at path: ${path}`, { path, minLength: entity.minLength, entity });
    }
  }
  if (entity.maxLength !== undefined) {
    if (typeof entity.maxLength !== 'number' || entity.maxLength < 0) {
      throw new SchemaValidationError(`maxLength must be a non-negative number at path: ${path}`, { path, maxLength: entity.maxLength, entity });
    }
  }
  if (entity.minLength !== undefined && entity.maxLength !== undefined && entity.minLength > entity.maxLength) {
    throw new SchemaValidationError(`minLength cannot be greater than maxLength at path: ${path}`, { path, minLength: entity.minLength, maxLength: entity.maxLength, entity });
  }
  if (entity.pattern !== undefined && typeof entity.pattern !== 'string') {
    throw new SchemaValidationError(`pattern must be a string at path: ${path}`, { path, pattern: entity.pattern, entity });
  }
}

/**
 * Validates a number schema
 * @param entity - The number schema to validate
 * @param path - The current path in the schema
 */
function validateNumberSchema(entity: NumberSchemaEntity, path: string): void {
  if (entity.minimum !== undefined && typeof entity.minimum !== 'number') {
    throw new SchemaValidationError(`minimum must be a number at path: ${path}`, { path, minimum: entity.minimum, entity });
  }
  if (entity.maximum !== undefined && typeof entity.maximum !== 'number') {
    throw new SchemaValidationError(`maximum must be a number at path: ${path}`, { path, maximum: entity.maximum, entity });
  }
  if (entity.minimum !== undefined && entity.maximum !== undefined && entity.minimum > entity.maximum) {
    throw new SchemaValidationError(`minimum cannot be greater than maximum at path: ${path}`, { path, minimum: entity.minimum, maximum: entity.maximum, entity });
  }
}

/**
 * Validates a custom schema
 * @param entity - The custom schema to validate
 * @param path - The current path in the schema
 */
function validateCustomSchema(entity: CustomSchemaEntity, path: string): void {
  if (!entity.name || typeof entity.name !== 'string') {
    throw new SchemaValidationError(`Custom schema must have a name at path: ${path}`, { path, entity });
  }
}

/**
 * Validates a schema entity
 * @param entity - The schema entity to validate
 * @param path - The current path in the schema
 * @param isTopLevel - Whether this is a top-level schema
 * @param depth - The current depth in the schema
 */
function validateSchemaEntity(entity: SchemaEntity, path: string, isTopLevel: boolean = false, depth: number = 0): void {
  if (depth > MAX_DEPTH) {
    throw new SchemaValidationError(`Schema too deeply nested at path: ${path}`, { path, entity });
  }

  if (!entity || typeof entity !== 'object') {
    throw new SchemaValidationError(`Invalid schema entity at path: ${path}`, { path, entity });
  }

  if (!('type' in entity) || !isValidSchemaType(entity.type)) {
    throw new SchemaValidationError(`Invalid or missing schema type at path: ${path}`, { path, entityType: entity.type, entity });
  }

  if ('optional' in entity && typeof entity.optional !== 'boolean') {
    throw new SchemaValidationError(`Invalid optional field at path: ${path}`, { path, entity });
  }

  if (isObjectSchemaEntity(entity)) {
    validateObjectSchema(entity, path, isTopLevel, depth);
  } else if (isArraySchemaEntity(entity)) {
    validateArraySchema(entity, path, depth);
  } else if (isPrimitiveSchemaEntity(entity)) {
    validatePrimitiveSchema(entity, path);
  } else if (isCustomSchemaEntity(entity)) {
    validateCustomSchema(entity, path);
  }
}

/**
 * Validates a complete schema
 * @param schema - The schema to validate
 * @throws {SchemaValidationError} If the schema is invalid
 */
export function validateSchema(schema: Schema): void {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new SchemaValidationError('Invalid schema: must be a non-array object', { schema });
  }

  for (const [key, value] of Object.entries(schema)) {
    validateSchemaEntity(value, key, true);
  }
}