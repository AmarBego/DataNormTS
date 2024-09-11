import { SchemaEntity, NormalizedData, EntityID, CustomSchemaEntity } from '../types';
import { NormalizationError } from '../errors';
import { getCustomSchemaHandler } from '../types';
import { isEntityID, isCustomSchemaEntity, isObjectSchemaEntity, isArraySchemaEntity, isPrimitiveSchemaEntity } from './normalizationUtils';
import { normalizeObject } from './objectNormalizer';
import { normalizeArray } from './arrayNormalizer';
import { normalizePrimitive } from './primitiveNormalizer';
import { logger } from '../logger';

/**
 * Normalizes the given entity according to the provided schema.
 * 
 * @param entity - The entity to normalize.
 * @param schema - The schema to use for normalization.
 * @param entities - The collection of normalized entities.
 * @returns The ID of the normalized entity if it has an ID, otherwise the normalized entity itself.
 * @throws {NormalizationError} If the entity is invalid for the schema or if a required property is missing.
 */
export function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown {
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
}

/**
 * Normalizes a custom entity based on the provided schema and stores it in the entities collection.
 * 
 * @param entity - The entity to normalize.
 * @param schema - The schema to use for normalization.
 * @param entities - The collection of normalized entities.
 * @returns The ID of the normalized entity if it has an ID, otherwise the normalized entity itself.
 * @throws {NormalizationError} If the entity is invalid for the custom schema or if a required property is missing.
 */
function normalizeCustomEntity(entity: unknown, schema: CustomSchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] {

  if (!schema.name) {
    throw new NormalizationError('Custom schema must have a name', { schema });
  }

  const customHandler = getCustomSchemaHandler(schema.name);
  if (!customHandler) {
    logger.error('Custom handler not found', { schemaName: schema.name });
    throw new NormalizationError('No custom handler found for schema type', { schemaType: schema.name });
  }

  const result = customHandler(entity, schema, entities);

  if (!entities[schema.name]) {
    entities[schema.name] = {};
  }
  if (Array.isArray(entity)) {
    if (!Array.isArray(result)) {
      throw new NormalizationError('Custom handler must return an array for array input', { result, entity, schema });
    }
    if (!result.every(isEntityID)) {
      throw new NormalizationError('Custom handler must return an array of EntityIDs for array input', { result, entity, schema });
    }
    if (result.length !== entity.length) {
      throw new NormalizationError('Custom handler must return an array of EntityIDs for array input', { result, entity, schema });
    }
    result.forEach((id, index) => {
      if (typeof id !== 'string' && typeof id !== 'number') {
        throw new NormalizationError('EntityID must be a string or number', { id, index, entity, schema });
      }
      entities[schema.name][id] = entity[index];
    });
  } else {
    if (Array.isArray(result)) {
      throw new NormalizationError('Custom handler must return a single EntityID for non-array input', { result, entity, schema });
    }
    if (!isEntityID(result)) {
      throw new NormalizationError('Custom handler must return an EntityID for non-array input', { result, entity, schema });
    }
    if (typeof result !== 'string' && typeof result !== 'number') {
      throw new NormalizationError('EntityID must be a string or number', { result, entity, schema });
    }
    entities[schema.name][result] = entity;
  }

  return result;
}
/**
 * Handles errors that occur during normalization.
 * 
 * @param error - The error that occurred.
 * @param context - The context in which the error occurred.
 * @returns Never.
 * @throws {NormalizationError} If the error is an instance of NormalizationError.
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