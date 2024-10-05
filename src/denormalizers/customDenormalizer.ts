import { CustomSchemaEntity, NormalizedData } from '../types';
import { DenormalizationError } from '../errors';

export function denormalizeCustom(entity: unknown, schema: CustomSchemaEntity, entities: NormalizedData['entities']): unknown {
  throw new DenormalizationError(`Custom schema entities are not supported in denormalization`, { schema });
}