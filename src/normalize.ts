import { 
  Schema, 
  NormalizedData, 
  ObjectSchemaEntity, 
  ArraySchemaEntity, 
  PrimitiveSchemaEntity, 
  SchemaEntity, 
  EntityID,
  SchemaType,
  CustomSchemaEntity,
  StringSchemaEntity,
  NumberSchemaEntity
} from './types';
import { redactSensitiveFields } from './utils';
import { getCustomSchemaHandler } from './types';
import { logger } from './logger';
import AsyncLock = require('async-lock');
import { validateSchema } from './schemaValidator';
import { SchemaValidationError, NormalizationError } from './errors';
import crypto from 'crypto';

/**
 * Handles errors during normalization process
 * @param error - The error to handle
 * @param context - Additional context for the error
 * @throws {NormalizationError} Always throws a NormalizationError
 */
function handleError(error: unknown, context: Record<string, unknown>): never {
  if (error instanceof NormalizationError) {
    logger.error('Normalization error:', { message: error.message, context: { ...error.context, ...context } });
    throw error;
  } else {
    const normError = new NormalizationError(
      error instanceof Error ? error.message : 'Unknown error during normalization',
      context
    );
    logger.error('Unexpected normalization error:', { message: normError.message, context: normError.context });
    throw normError;
  }
}

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const memoizedValidateSchema = memoize(validateSchema);

/**
 * Type guard for SchemaType
 * @param type - The type to check
 * @returns True if the type is a valid SchemaType, false otherwise
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
 * Type guard for EntityID array
 * @param value - The value to check
 * @returns True if the value is a valid EntityID array, false otherwise
 */
function isValidEntityIDArray(value: unknown): value is EntityID[] {
  return Array.isArray(value) && value.every(isEntityID);
}
/**
 * Type guard for EntityID
 * @param value - The value to check
 * @returns True if the value is a valid EntityID, false otherwise
 */
function isEntityID(value: unknown): value is EntityID {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Normalizes data according to the provided schema
 * @param data - The data to normalize
 * @param schema - The schema to use for normalization
 * @returns Normalized data
 * @throws {NormalizationError} If normalization fails
 */
export function normalize(data: unknown, schema: Schema): NormalizedData {
  try {
    validateSchema(schema);
    memoizedValidateSchema(schema);

    if (!data || typeof data !== 'object') {
      throw new NormalizationError('Invalid input data', { receivedType: typeof data });
    }

    const entities: NormalizedData['entities'] = {};

    const firstSchemaKey = Object.keys(schema)[0];
    if (!firstSchemaKey) {
      throw new NormalizationError('Schema must have at least one entry', { schema });
    }

    const firstSchemaEntity = schema[firstSchemaKey];
    const result = normalizeEntity(data, firstSchemaEntity, entities);

    return { entities, result };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      throw new NormalizationError(`Schema validation failed: ${error.message}`, { originalError: error.message, context: error.context });
    }
    if (error instanceof NormalizationError) {
      throw error;
    }
    throw new NormalizationError('Unexpected error during normalization', { originalError: (error as Error).message });
  }
}

/**
 * Normalizes a single entity according to its schema
 * @param entity - The entity to normalize
 * @param schema - The schema for the entity
 * @param entities - The collection of normalized entities
 * @returns Normalized entity or EntityID
 * @throws {NormalizationError} If normalization fails
 */
function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown {
  try {
    if (isCustomSchemaEntity(schema)) {
      return normalizeCustomEntity(entity, schema, entities);
    } else if (isObjectSchemaEntity(schema)) {
      return normalizeObject(entity as Record<string, unknown>, schema, entities);
    } else if (isArraySchemaEntity(schema)) {
      return normalizeArray(entity as unknown[], schema, entities);
    } else if (isPrimitiveSchemaEntity(schema)) {
      return normalizePrimitive(entity, schema);
    } else {
      const exhaustiveCheck: never = schema;
      throw new NormalizationError('Unsupported schema type', { schemaType: (schema as SchemaEntity).type, entity });
    }
  } catch (error) {
    return handleError(error, { entity, schema, entities });
  }
}

/**
 * Normalizes a custom entity
 * @param entity - The entity to normalize
 * @param schema - The custom schema
 * @param entities - The collection of normalized entities
 * @returns Normalized custom entity
 * @throws {NormalizationError} If normalization fails
 */
/**
 * Normalizes a custom entity
 * @param entity - The entity to normalize
 * @param schema - The custom schema
 * @param entities - The collection of normalized entities
 * @returns Normalized custom entity
 * @throws {NormalizationError} If normalization fails
 */
function normalizeCustomEntity(entity: unknown, schema: CustomSchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] {
  console.log('Normalizing custom entity:', { entity, schema });
  if (!schema.name) {
    throw new NormalizationError('Custom schema must have a name', { schema });
  }
  const customHandler = getCustomSchemaHandler(schema.name);
  if (!customHandler) {
    throw new NormalizationError('No custom handler found for schema type', { schemaType: schema.name });
  }
  const result = customHandler(entity, schema, entities);
  console.log('Custom handler result:', result);
  
  if (Array.isArray(entity)) {
    if (!Array.isArray(result) || !result.every(isEntityID)) {
      throw new NormalizationError('Custom handler must return an array of EntityIDs for array input', { result });
    }
  } else if (!isEntityID(result)) {
    throw new NormalizationError('Custom handler must return an EntityID for non-array input', { result });
  }

  // Store the result in entities
  if (!entities[schema.name]) {
    entities[schema.name] = {};
  }

  if (Array.isArray(result)) {
    result.forEach((id, index) => {
      if (Array.isArray(entity)) {
        entities[schema.name][id] = entity[index];
      }
    });
  } else {
    entities[schema.name][result] = entity;
  }

  return result;
}

/**
 * Normalizes an object entity
 * @param entity - The object to normalize
 * @param schema - The object schema
 * @param entities - The collection of normalized entities
 * @returns Normalized object entity ID
 * @throws {NormalizationError} If normalization fails
 */
function normalizeObject(entity: Record<string, unknown>, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): EntityID | Record<string, unknown> {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    throw new NormalizationError('Invalid entity for object schema', { expectedType: 'object', receivedType: typeof entity });
  }

  const entityName = schema.name || 'unnamed';

  if (!entities[entityName]) {
    entities[entityName] = {};
  }

  const id = entity.id as EntityID;
  if (id === undefined) {
    // If there's no ID, just normalize the object without adding it to entities
    const normalizedEntity: Record<string, unknown> = {};
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      if (key in entity) {
        normalizedEntity[key] = normalizeEntity(entity[key], propertySchema, entities);
      }
    }
    return normalizedEntity;
  }

  const normalizedEntity: Record<string, unknown> = {};
  const properties = Object.entries(schema.properties);

  for (const [key, propertySchema] of properties) {
    if (key in entity) {
      normalizedEntity[key] = normalizeEntity(entity[key], propertySchema, entities);
    } else if (Array.isArray(schema.required) && schema.required.includes(key)) {
      throw new NormalizationError('Missing required property', { entityName, id, missingProperty: key });
    }
  }

  entities[entityName][id] = normalizedEntity;

  return id;
}

/**
 * Normalizes an array entity
 * @param array - The array to normalize
 * @param schema - The array schema
 * @param entities - The collection of normalized entities
 * @returns Array of normalized entity IDs
 * @throws {NormalizationError} If normalization fails
 */
function normalizeArray(array: unknown[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): EntityID[] {
  if (!Array.isArray(array)) {
    throw new NormalizationError('Invalid entity for array schema', { expectedType: 'array', receivedType: typeof array, schema });
  }

  return array.map((item, index) => {
    const result = normalizeEntity(item, schema.items, entities);
    if (Array.isArray(result)) {
      throw new NormalizationError('Nested arrays are not supported', { index, item, schema });
    }
    if (!isEntityID(result)) {
      throw new NormalizationError('Array item normalization did not result in an EntityID', { index, item, result, schema });
    }
    return result;
  });
}

/**
 * Validates a string value against its schema
 * @param value - The string value to validate
 * @param schema - The string schema
 * @throws {NormalizationError} If validation fails
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
 * Validates a number value against its schema
 * @param value - The number value to validate
 * @param schema - The number schema
 * @throws {NormalizationError} If validation fails
 */
function validateNumberValue(value: number, schema: NumberSchemaEntity): void {
  if (schema.minimum !== undefined && value < schema.minimum) {
    throw new NormalizationError('Number below minimum', { value, minimum: schema.minimum, schema });
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    throw new NormalizationError('Number exceeds maximum', { value, maximum: schema.maximum, schema });
  }
}

/**
 * Normalizes a primitive value
 * @param value - The primitive value to normalize
 * @param schema - The primitive schema
 * @returns Normalized primitive value
 * @throws {NormalizationError} If normalization fails
 */
function normalizePrimitive(value: unknown, schema: PrimitiveSchemaEntity): unknown {
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

const normalizationLock = new AsyncLock();

/**
 * Generates a unique hash for the given data and schema
 * @param data - The data to normalize
 * @param schema - The schema to use for normalization
 * @returns A unique hash string
 */
function generateLockKey(data: unknown, schema: Schema): string {
  const dataHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const schemaHash = crypto.createHash('sha256').update(JSON.stringify(schema)).digest('hex');
  return `${dataHash}|${schemaHash}`;
}

/**
 * Safely normalizes data with concurrency control
 * @param data - The data to normalize
 * @param schema - The schema to use for normalization
 * @returns Promise resolving to normalized data
 * @throws {NormalizationError} If normalization fails
 */
export async function safeNormalize(data: unknown, schema: Schema): Promise<NormalizedData> {
  const lockKey = generateLockKey(data, schema);

  return normalizationLock.acquire(lockKey, async () => {
    try {
      logger.debug('Starting normalization', { lockKey });
      const result = normalize(data, schema);
      logger.debug('Normalization completed', { lockKey });
      return result;
    } catch (error) {
      logger.error('Error during normalization', { lockKey, error: (error as Error).message });
      throw error;
    }
  });
}