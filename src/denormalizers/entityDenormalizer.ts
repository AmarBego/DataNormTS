import { SchemaEntity, EntityID, NormalizedData } from '../types';
import { DenormalizationError } from '../errors';
import { isPrimitiveSchemaEntity, isObjectSchemaEntity, isArraySchemaEntity, isCustomSchemaEntity } from '../normalizers/normalizationUtils';
import { denormalizeObject } from './objectDenormalizer';
import { denormalizeArray } from './arrayDenormalizer';
import { denormalizeCustom } from './customDenormalizer';
import { denormalizePrimitive } from './primitiveDenormalizer';

export function denormalizeEntity(entityId: EntityID, schemaEntity: SchemaEntity, entities: NormalizedData['entities']): unknown {
  if (isPrimitiveSchemaEntity(schemaEntity)) {
    return denormalizePrimitive(entityId, schemaEntity);
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
    return denormalizeObject(entity, schemaEntity, entities);
  } else if (isArraySchemaEntity(schemaEntity)) {
    return denormalizeArray(entity, schemaEntity, entities);
  } else if (isCustomSchemaEntity(schemaEntity)) {
    return denormalizeCustom(entity, schemaEntity, entities);
  }
  throw new DenormalizationError(`Unsupported schema type`, { schemaEntity });
}