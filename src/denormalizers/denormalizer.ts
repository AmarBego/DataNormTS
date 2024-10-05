import { Schema, NormalizedData, EntityID } from '../types';
import { DenormalizationError } from '../errors';
import { denormalizeEntity } from './entityDenormalizer';

export function denormalize(normalizedData: NormalizedData, schema: Schema): unknown {
  const { entities, result } = normalizedData;

  const rootSchemaEntity = Object.values(schema)[0];
  if (!rootSchemaEntity) {
    throw new DenormalizationError('Empty schema provided', {});
  }

  if (Array.isArray(result)) {
    return result.map(id => denormalizeEntity(id, rootSchemaEntity, entities));
  } else if (typeof result === 'string' || typeof result === 'number') {
    return denormalizeEntity(result, rootSchemaEntity, entities);
  } else {
    return result;
  }
}