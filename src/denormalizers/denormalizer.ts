import { Schema, NormalizedData, EntityID, SchemaEntity } from '../types';
import { DenormalizationError } from '../errors';
import { isPrimitiveSchemaEntity, isObjectSchemaEntity, isArraySchemaEntity, isCustomSchemaEntity } from '../normalizers/normalizationUtils';

export function denormalize(normalizedData: NormalizedData, schema: Schema): unknown {
  const { entities, result } = normalizedData;

  function denormalizeEntity(entityId: EntityID, schemaEntity: SchemaEntity): unknown {
    if (isPrimitiveSchemaEntity(schemaEntity)) {
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
    if (isObjectSchemaEntity(schemaEntity)) {
      const denormalizedEntity: Record<string, unknown> = {};
      if (typeof entity === 'object' && !Array.isArray(entity)) {
        for (const [key, propSchema] of Object.entries(schemaEntity.properties)) {
          if (key in entity) {
            denormalizedEntity[key] = denormalizeEntity((entity as Record<string, EntityID>)[key], propSchema);
          }
        }
      }
      return denormalizedEntity;
    } else if (isArraySchemaEntity(schemaEntity)) {
      if (Array.isArray(entity)) {
        return entity.map(item => denormalizeEntity(item, schemaEntity.items));
      } else if (isPrimitiveSchemaEntity(schemaEntity.items)) {
        return entity;
      } else {
        throw new DenormalizationError(`Expected array for entity: ${entityType || 'unknown'}:${entityId}`, { entityType, entityId });
      }
    } else if (isCustomSchemaEntity(schemaEntity)) {
      throw new DenormalizationError(`Custom schema entities are not supported in denormalization`, { schemaEntity });
    }
    throw new DenormalizationError(`Unsupported schema type`, { schemaEntity });
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