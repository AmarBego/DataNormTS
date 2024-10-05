import { CustomSchemaEntity, NormalizedData, EntityID } from '../types';
import { DenormalizationError } from '../errors';
import { CustomSchemaHandler } from '../types';
import { getCustomSchemaHandler } from '../types';
import { logger } from '../logger';

export function denormalizeCustom(entity: unknown, schema: CustomSchemaEntity, entities: NormalizedData['entities']): unknown {
  if (!schema.name) {
    throw new DenormalizationError('Custom schema must have a name', { schema });
  }

  const customHandler: CustomSchemaHandler = (entity: any, schema: any, entities: any) => {
    console.log('Custom handler called with:', { entity, schema, entities });
    
    if (typeof entity === 'string' || typeof entity === 'number') {
      // During normalization: entity is ID, return the entity ID
      return entity;
    } else {
      // During denormalization: entity is the object, return the object itself
      return entity;
    }
  };
  
  if (typeof entity === 'string' || typeof entity === 'number') {
    const entityData = denormalizeCustomEntity(entity, schema, entities);
    return customHandler(entityData, schema, entities);
  } else {
    return customHandler(entity, schema, entities);
  }
}
function denormalizeCustomEntity(entityId: EntityID, schema: CustomSchemaEntity, entities: NormalizedData['entities']): unknown {
  const entityData = entities[schema.name]?.[entityId];
  if (!entityData) {
    throw new DenormalizationError(`Entity not found: ${schema.name}:${entityId}`, { entityType: schema.name, entityId });
  }
  return entityData;
}