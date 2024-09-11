import { ObjectSchemaEntity, NormalizedData, EntityID } from '../types';
import { NormalizationError } from '../errors';
import { normalizeEntity } from './customNormalizer';

export function normalizeObject(entity: Record<string, unknown>, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): EntityID | Record<string, unknown> {
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