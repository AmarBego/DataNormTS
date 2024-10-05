import { ObjectSchemaEntity, NormalizedData, EntityID } from '../types';
import { denormalizeEntity } from './entityDenormalizer';

export function denormalizeObject(entity: unknown, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): Record<string, unknown> {
  const denormalizedEntity: Record<string, unknown> = {};
  if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in entity) {
        denormalizedEntity[key] = denormalizeEntity((entity as Record<string, EntityID>)[key], propSchema, entities);
      }
    }
  }
  return denormalizedEntity;
}