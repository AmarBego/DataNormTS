import { ArraySchemaEntity, NormalizedData } from '../types';
import { DenormalizationError } from '../errors';
import { denormalizeEntity } from './entityDenormalizer';
import { isPrimitiveSchemaEntity } from '../normalizers/normalizationUtils';

export function denormalizeArray(entity: unknown, schema: ArraySchemaEntity, entities: NormalizedData['entities']): unknown[] {
  if (Array.isArray(entity)) {
    return entity.map(item => denormalizeEntity(item, schema.items, entities));
  } else if (isPrimitiveSchemaEntity(schema.items)) {
    return entity as unknown[];
  } else if (typeof entity === 'string' || typeof entity === 'number') {
    const denormalizedItem = denormalizeEntity(entity, schema.items, entities);
    return Array.isArray(denormalizedItem) ? denormalizedItem : [denormalizedItem];
  }
  throw new DenormalizationError(`Expected array or EntityID for entity`, { entity, schema });
}