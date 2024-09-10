import { 
    Schema, 
    NormalizedData, 
    ObjectSchemaEntity, 
    ArraySchemaEntity, 
    PrimitiveSchemaEntity, 
    SchemaEntity, 
    EntityID,
    SchemaType,
    CustomSchemaEntity
} from './types';
import { redactSensitiveFields } from './utils';
import { getCustomSchemaHandler } from './types';
import { logger } from './logger';
import AsyncLock = require('async-lock');

export class NormalizationError extends Error {
    constructor(message: string, public context: Record<string, unknown>) {
        super(message);
        this.name = 'NormalizationError';
    }
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
  
  function isValidSchemaType(type: unknown): type is SchemaType {
    return typeof type === 'string' && (['object', 'array', 'string', 'number', 'boolean', 'custom'] as SchemaType[]).includes(type as SchemaType);
  }
  
  function isObjectSchemaEntity(schema: SchemaEntity): schema is ObjectSchemaEntity {
    return schema.type === 'object';
  }
  
  function isArraySchemaEntity(schema: SchemaEntity): schema is ArraySchemaEntity {
    return schema.type === 'array';
  }
  
  function isPrimitiveSchemaEntity(schema: SchemaEntity): schema is PrimitiveSchemaEntity {
    return ['string', 'number', 'boolean'].includes(schema.type);
  }
  
  function isCustomSchemaEntity(schema: SchemaEntity): schema is CustomSchemaEntity {
    return schema.type === 'custom';
  }
  
  function isStringSchema(schema: PrimitiveSchemaEntity): schema is PrimitiveSchemaEntity & { type: 'string' } {
    return schema.type === 'string';
  }
  
  function isNumberSchema(schema: PrimitiveSchemaEntity): schema is PrimitiveSchemaEntity & { type: 'number' } {
    return schema.type === 'number';
  }
  
  
  function isEntityID(value: unknown): value is EntityID {
    return typeof value === 'string' || typeof value === 'number';
  }
  
  export function normalize(data: unknown, schema: Schema): NormalizedData {
    try {
      if (!data || typeof data !== 'object') {
        throw new NormalizationError('Invalid input data', { receivedType: typeof data });
      }
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        throw new NormalizationError('Invalid schema', { receivedType: typeof schema });
      }
      
      const entities: NormalizedData['entities'] = {};
      
      const firstSchemaKey = Object.keys(schema)[0];
      if (!firstSchemaKey) {
        throw new NormalizationError('Schema must have at least one entry', { schema });
      }
      
      const firstSchemaEntity = schema[firstSchemaKey];
      if (!firstSchemaEntity || typeof firstSchemaEntity !== 'object') {
        throw new NormalizationError('Invalid schema entry', { schemaKey: firstSchemaKey, schemaEntry: firstSchemaEntity });
      }
      
      if (!('type' in firstSchemaEntity)) {
        throw new NormalizationError('Schema entry must have a type', { schemaKey: firstSchemaKey, schemaEntry: firstSchemaEntity });
      }
  
      if (!isValidSchemaType(firstSchemaEntity.type)) {
        throw new NormalizationError('Unsupported schema type', { schemaKey: firstSchemaKey, schemaType: firstSchemaEntity.type });
      }
      
      const result = normalizeEntity(data, firstSchemaEntity, entities);
    
      return { entities, result };
    } catch (error) {
      return handleError(error, { data, schema });
    }
  }
  
  function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown {
    try {
      if (isCustomSchemaEntity(schema)) {
        if (!schema.name) {
          throw new NormalizationError('Custom schema must have a name', { schema });
        }
        const customHandler = getCustomSchemaHandler(schema.name);
        if (customHandler) {
          const result = customHandler(entity, schema, entities);
          if (!isEntityID(result) && !Array.isArray(result)) {
            throw new NormalizationError('Custom handler returned invalid result', { result, expectedType: 'EntityID or EntityID[]' });
          }
          if (!entities[schema.name]) {
            entities[schema.name] = {};
          }
          entities[schema.name][result as EntityID] = entity;
          return result;
        }
        throw new NormalizationError('No custom handler found for schema type', { schemaType: schema.name });
      }
  
      if (isObjectSchemaEntity(schema)) {
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
  
  
  function normalizeObject(entity: Record<string, unknown>, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): EntityID {
    try {
      if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
        throw new NormalizationError('Invalid entity for object schema', { expectedType: 'object', receivedType: typeof entity });
      }
  
      const entityName = schema.name;
      if (!entities[entityName]) {
        entities[entityName] = {};
      }
  
      const id = entity.id as EntityID;
      if (id === undefined) {
        throw new NormalizationError('Entity must have an id field', { entity });
      }
  
      const redactedEntity = redactSensitiveFields(entity, entityName);
  
      const normalizedEntity: Record<string, unknown> = {};
      const properties = Object.entries(schema.properties);
  
      for (const [key, propertySchema] of properties) {
        if (!(key in redactedEntity)) {
          if (Array.isArray(schema.required) && schema.required.includes(key)) {
            throw new NormalizationError('Missing required property', { entityName, id, missingProperty: key });
          }
          continue;
        }
        normalizedEntity[key] = redactedEntity[key] === '[REDACTED]'
          ? '[REDACTED]'
          : normalizeEntity(redactedEntity[key], propertySchema, entities);
      }
  
      entities[entityName][id] = normalizedEntity;
  
      return id;
    } catch (error) {
      return handleError(error, { entity, schema, entities });
    }
  }
  
  function normalizeArray(array: unknown[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): EntityID[] {
    if (!Array.isArray(array)) {
      throw new NormalizationError('Invalid entity for array schema', { expectedType: 'array', receivedType: typeof array, schema });
    }
  
    return array.map((item, index) => {
      try {
        const result = normalizeEntity(item, schema.items, entities);
        if (Array.isArray(result)) {
          throw new NormalizationError('Nested arrays are not supported', { index, item, schema });
        }
        if (!isEntityID(result)) {
          throw new NormalizationError('Array item normalization did not result in an EntityID', { index, item, result, schema });
        }
        return result;
      } catch (error) {
        return handleError(error, { index, item, schema });
      }
    });
  }
  
  
  function validateStringValue(value: string, schema: PrimitiveSchemaEntity & { type: 'string' }): void {
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
  
  function validateNumberValue(value: number, schema: PrimitiveSchemaEntity & { type: 'number' }): void {
    if (schema.minimum !== undefined && value < schema.minimum) {
      throw new NormalizationError('Number below minimum', { value, minimum: schema.minimum, schema });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      throw new NormalizationError('Number exceeds maximum', { value, maximum: schema.maximum, schema });
    }
  }
  function normalizePrimitive(value: unknown, schema: PrimitiveSchemaEntity): unknown {
    if (typeof value !== schema.type) {
      throw new NormalizationError('Type mismatch', { expectedType: schema.type, actualType: typeof value, value, schema });
    }
  
    switch (schema.type) {
      case 'string':
        if (isStringSchema(schema)) {
          validateStringValue(value as string, schema);
        }
        break;
      case 'number':
        if (isNumberSchema(schema)) {
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

  export async function safeNormalize(data: unknown, schema: Schema): Promise<NormalizedData> {
    const lockKey = JSON.stringify(data);
  
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