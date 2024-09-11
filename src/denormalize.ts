import { 
    Schema, 
    NormalizedData, 
    ObjectSchemaEntity, 
    ArraySchemaEntity, 
    PrimitiveSchemaEntity, 
    ExtendedSchemaEntity, 
    EntityID,
    PrimitiveType
  } from './types';
  import { redactSensitiveFields } from './utils/utils';
  import { getCustomSchemaHandler } from './types';
  import { logger } from './logger';
  import AsyncLock = require('async-lock');
    
  class DenormalizationError extends Error {
    constructor(message: string, public context: Record<string, unknown>) {
      super(message);
      this.name = 'DenormalizationError';
    }
  }
  
  // Error handling wrapper
  function handleError(error: unknown, context: Record<string, unknown>): never {
    if (error instanceof DenormalizationError) {
      logger.error('Denormalization error:', { message: error.message, context: { ...error.context, ...context } });
      throw error;
    } else {
      const denormError = new DenormalizationError(
        error instanceof Error ? error.message : 'Unknown error during denormalization',
        context
      );
      logger.error('Unexpected denormalization error:', { message: denormError.message, context: denormError.context });
      throw denormError;
    }
  }

  function isValidSchemaType(type: unknown): type is 'object' | 'array' | PrimitiveType {
    return typeof type === 'string' && ['object', 'array', 'string', 'number', 'boolean'].includes(type);
  }
  
  function isObjectSchemaEntity(schema: ExtendedSchemaEntity): schema is ObjectSchemaEntity {
    return schema.type === 'object' && 'properties' in schema;
  }
  
  function isArraySchemaEntity(schema: ExtendedSchemaEntity): schema is ArraySchemaEntity {
    return schema.type === 'array' && 'items' in schema;
  }
  
  function isPrimitiveSchemaEntity(schema: ExtendedSchemaEntity): schema is PrimitiveSchemaEntity {
    return ['string', 'number', 'boolean'].includes(schema.type);
  }
  
  function isStringSchema(schema: PrimitiveSchemaEntity): schema is PrimitiveSchemaEntity & { type: 'string' } {
    return schema.type === 'string';
  }
  
  function isNumberSchema(schema: PrimitiveSchemaEntity): schema is PrimitiveSchemaEntity & { type: 'number' } {
    return schema.type === 'number';
  }
  
  function isBooleanSchema(schema: PrimitiveSchemaEntity): schema is PrimitiveSchemaEntity & { type: 'boolean' } {
    return schema.type === 'boolean';
  }

  
  export function denormalize(normalizedData: NormalizedData, schema: Schema): unknown {
    try {
      if (!normalizedData || typeof normalizedData !== 'object' || Array.isArray(normalizedData)) {
        throw new DenormalizationError('Invalid normalized data', { receivedType: typeof normalizedData });
      }
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        throw new DenormalizationError('Invalid schema', { receivedType: typeof schema });
      }
      if (!normalizedData.entities || typeof normalizedData.entities !== 'object' || Array.isArray(normalizedData.entities)) {
        throw new DenormalizationError('Invalid normalized data: missing or invalid entities', { normalizedData });
      }
  
      const firstSchemaKey = Object.keys(schema)[0];
      if (!firstSchemaKey) {
        throw new DenormalizationError('Schema must have at least one entry', { schema });
      }
      
      const firstSchemaEntity = schema[firstSchemaKey];
      if (!firstSchemaEntity || typeof firstSchemaEntity !== 'object') {
        throw new DenormalizationError('Invalid schema entry', { schemaKey: firstSchemaKey, schemaEntry: firstSchemaEntity });
      }
  
      if (!('type' in firstSchemaEntity) || !isValidSchemaType(firstSchemaEntity.type)) {
        throw new DenormalizationError('Invalid schema type', { schemaKey: firstSchemaKey, schemaEntry: firstSchemaEntity });
      }
  
      return denormalizeEntity(normalizedData.result, firstSchemaEntity, normalizedData.entities);
    } catch (error) {
      return handleError(error, { normalizedData, schema });
    }
  }
  
  function denormalizeEntity(entityId: unknown, schema: ExtendedSchemaEntity, entities: NormalizedData['entities']): unknown {
    try {
      const customHandler = getCustomSchemaHandler(schema.type);
      if (customHandler) {
        return customHandler(entityId, schema, entities);
      }
  
      if (isObjectSchemaEntity(schema)) {
        return denormalizeObject(entityId as EntityID, schema, entities);
      } else if (isArraySchemaEntity(schema)) {
        return denormalizeArray(entityId as unknown[], schema, entities);
      } else if (isPrimitiveSchemaEntity(schema)) {
        return denormalizePrimitive(entityId, schema);
      } else {
        throw new DenormalizationError('Unsupported schema type', { schemaType: schema.type, entityId });
      }
    } catch (error) {
      return handleError(error, { entityId, schema, entities });
    }
  }
  
  function denormalizeObject(entityId: EntityID, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): Record<string, unknown> {
    try {
      if (typeof entityId !== 'string' && typeof entityId !== 'number') {
        throw new DenormalizationError('Invalid entityId for object schema', { entityId, expectedTypes: ['string', 'number'] });
      }
  
      const entityName = schema.name;
      if (!entities[entityName]) {
        throw new DenormalizationError('Entity type not found', { entityName, availableTypes: Object.keys(entities) });
      }
  
      const entity = entities[entityName][entityId];
      if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
        throw new DenormalizationError('Entity not found or invalid', { entityName, entityId, availableIds: Object.keys(entities[entityName]) });
      }
  
      const result: Record<string, unknown> = Object.create(null);
      const properties = Object.entries(schema.properties);
  
      for (const [key, propertySchema] of properties) {
        if (!(key in entity)) {
          if (Array.isArray(schema.required) && schema.required.includes(key)) {
            throw new DenormalizationError('Missing required property', { entityName, entityId, missingProperty: key });
          }
          continue;
        }
        const value = (entity as Record<string, unknown>)[key];
        result[key] = value === '[REDACTED]'
          ? '[REDACTED]'
          : denormalizeEntity(value, propertySchema, entities);
      }
      return redactSensitiveFields(result, entityName);
    } catch (error) {
      return handleError(error, { entityId, schema, entities });
    }
  }
  
  function denormalizeArray(array: unknown[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): unknown[] {
    if (!Array.isArray(array)) {
      throw new DenormalizationError('Invalid entity for array schema', { expectedType: 'array', receivedType: typeof array, schema });
    }
  
    if (array.length === 0) {
      return [];
    }
  
    return array.map((item, index) => {
      try {
        return denormalizeEntity(item, schema.items, entities);
      } catch (error) {
        return handleError(error, { index, item, schema });
      }
    });
  }
  
  function validateStringValue(value: string, schema: PrimitiveSchemaEntity & { type: 'string' }): void {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      throw new DenormalizationError('String length below minimum', { value, minLength: schema.minLength, actualLength: value.length, schema });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      throw new DenormalizationError('String length exceeds maximum', { value, maxLength: schema.maxLength, actualLength: value.length, schema });
    }
    if (schema.pattern !== undefined) {
      try {
        if (!new RegExp(schema.pattern).test(value)) {
          throw new DenormalizationError('String does not match pattern', { value, pattern: schema.pattern, schema });
        }
      } catch (error) {
        throw new DenormalizationError('Invalid pattern in schema', { error: (error as Error).message, schema });
      }
    }
  }
  
  function validateNumberValue(value: number, schema: PrimitiveSchemaEntity & { type: 'number' }): void {
    if (schema.minimum !== undefined && value < schema.minimum) {
      throw new DenormalizationError('Number below minimum', { value, minimum: schema.minimum, schema });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      throw new DenormalizationError('Number exceeds maximum', { value, maximum: schema.maximum, schema });
    }
  }
  
  function denormalizePrimitive(value: unknown, schema: PrimitiveSchemaEntity): unknown {
    if (typeof value !== schema.type) {
      throw new DenormalizationError('Type mismatch', { expectedType: schema.type, actualType: typeof value, value, schema });
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
        break;
    }
  
    return value;
  }
  

const denormalizationLock = new AsyncLock();

export async function safeDenormalize(normalizedData: NormalizedData, schema: Schema): Promise<unknown> {
  const lockKey = JSON.stringify(normalizedData.result);

  return denormalizationLock.acquire(lockKey, async () => {
    try {
      logger.debug('Starting denormalization', { lockKey });
      const result = denormalize(normalizedData, schema);
      logger.debug('Denormalization completed', { lockKey });
      return result;
    } catch (error) {
      logger.error('Error during denormalization', { lockKey, error: (error as Error).message });
      throw error;
    }
  });
}