import { SchemaEntity, NormalizedData, EntityID, CustomSchemaEntity } from '../types';
import { NormalizationError } from '../errors';
import { getCustomSchemaHandler } from '../types';
import { isEntityID, isCustomSchemaEntity, isObjectSchemaEntity, isArraySchemaEntity, isPrimitiveSchemaEntity } from './utils';
import { normalizeObject } from './objectNormalizer';
import { normalizeArray } from './arrayNormalizer';
import { normalizePrimitive } from './primitiveNormalizer';
import { logger } from '../logger';


export function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown {
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