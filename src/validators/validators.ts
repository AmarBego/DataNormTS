import { SchemaValidationError } from '../errors';
import { 
    Schema, 
    SchemaEntity, 
    ObjectSchemaEntity, 
    ArraySchemaEntity, 
    PrimitiveSchemaEntity,
    CustomSchemaEntity,
    StringSchemaEntity,
    NumberSchemaEntity
} from '../types';
import { MAX_DEPTH } from './constants';
import { 
    isObjectSchemaEntity, 
    isArraySchemaEntity, 
    isPrimitiveSchemaEntity, 
    isCustomSchemaEntity,
    isStringSchemaEntity,
    isNumberSchemaEntity,
    isValidSchemaType
} from './typeGuards';

/**
 * Validates an object schema entity.
 * 
 * @param entity - The ObjectSchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @param isTopLevel - Indicates if the entity is at the top level of the schema.
 * @param depth - The current depth of the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validateObjectSchema(entity: ObjectSchemaEntity, path: string, isTopLevel: boolean, depth: number): void {
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
 * Validates an array schema entity.
 * 
 * @param entity - The ArraySchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @param depth - The current depth of the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validateArraySchema(entity: ArraySchemaEntity, path: string, depth: number): void {
  if (!entity.items || typeof entity.items !== 'object') {
    throw new SchemaValidationError(`Array schema must have items at path: ${path}`, { path, entity });
  }
  validateSchemaEntity(entity.items, `${path}.items`, false, depth + 1);
}

/**
 * Validates a primitive schema entity.
 * 
 * @param entity - The PrimitiveSchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validatePrimitiveSchema(entity: PrimitiveSchemaEntity, path: string): void {
  if (isStringSchemaEntity(entity)) {
    validateStringSchema(entity, path);
  } else if (isNumberSchemaEntity(entity)) {
    validateNumberSchema(entity, path);
  }
  // No additional validation needed for boolean
}

/**
 * Validates a string schema entity.
 * 
 * @param entity - The StringSchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validateStringSchema(entity: StringSchemaEntity, path: string): void {
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
 * Validates a number schema entity.
 * 
 * @param entity - The NumberSchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validateNumberSchema(entity: NumberSchemaEntity, path: string): void {
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
 * Validates a custom schema entity.
 * 
 * @param entity - The CustomSchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validateCustomSchema(entity: CustomSchemaEntity, path: string): void {
  if (!entity.name || typeof entity.name !== 'string') {
    throw new SchemaValidationError(`Custom schema must have a name at path: ${path}`, { path, entity });
  }
}

/**
 * Validates a schema entity.
 * 
 * @param entity - The SchemaEntity to validate.
 * @param path - The path to the entity in the schema.
 * @param isTopLevel - Indicates if the entity is at the top level of the schema.
 * @param depth - The current depth of the entity in the schema.
 * @throws {SchemaValidationError} If the entity is invalid.
 */
export function validateSchemaEntity(entity: SchemaEntity, path: string, isTopLevel: boolean = false, depth: number = 0): void {
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