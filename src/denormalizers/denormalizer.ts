import { Schema, NormalizedData, EntityID, SchemaEntity } from '../types';
import { DenormalizationError } from '../errors';

export function denormalize(normalizedData: NormalizedData, schema: Schema): unknown {
  const { entities, result } = normalizedData;

  function denormalizeEntity(entityId: EntityID, schemaEntity: SchemaEntity): unknown {
    if (schemaEntity.type !== 'object' && schemaEntity.type !== 'array') {
      return entityId;
    }
    const entityType = schemaEntity.name;
    const entityMap = entityType ? entities[entityType] : entities;
    if (!entityMap) {
      throw new DenormalizationError(`No entities found for type: ${entityType || 'unknown'}`, { entityType });
    }
    const entity = entityType ? entityMap[entityId] : entityId;
    if (!entity) {
      throw new DenormalizationError(`Entity not found: ${entityType || 'unknown'}:${entityId}`, { entityType, entityId });
    }
    if (schemaEntity.type === 'object') {
      const denormalizedEntity: Record<string, unknown> = {};
      if (typeof entity === 'object' && !Array.isArray(entity)) {
        for (const [key, propSchema] of Object.entries(schemaEntity.properties)) {
          if (key in entity) {
            if (propSchema.type === 'object' || propSchema.type === 'array') {
              denormalizedEntity[key] = denormalizeEntity((entity as Record<string, EntityID>)[key], propSchema);
            } else {
              denormalizedEntity[key] = (entity as Record<string, unknown>)[key];
            }
          }
        }
      }
      return denormalizedEntity;
    } else if (schemaEntity.type === 'array') {
      if (!Array.isArray(entity)) {
        throw new DenormalizationError(`Expected array for entity: ${entityType || 'unknown'}:${entityId}`, { entityType, entityId });
      }
      return entity.map(id => denormalizeEntity(id as EntityID, schemaEntity.items));
    }
    return entity;
  }

  const rootSchemaEntity = Object.values(schema)[0];
  if (!rootSchemaEntity) {
    throw new DenormalizationError('Empty schema provided', {});
  }

  if (Array.isArray(result)) {
    return result.map(id => denormalizeEntity(id, rootSchemaEntity));
  } else if (typeof result === 'string' || typeof result === 'number') {
    return denormalizeEntity(result, rootSchemaEntity);
  } else {
    return result;
  }
}