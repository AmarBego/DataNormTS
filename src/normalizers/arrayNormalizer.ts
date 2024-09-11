import { ArraySchemaEntity, NormalizedData, EntityID } from '../types';
import { NormalizationError } from '../errors';
import { normalizeEntity } from './customNormalizer';
import { isEntityID } from './normalizationUtils';

/**
 * Normalizes an array of entities based on the provided schema and stores them in the entities collection.
 * 
 * @param array - The array of entities to normalize.
 * @param schema - The schema to use for normalization.
 * @param entities - The collection of normalized entities.
 * @returns An array of EntityIDs representing the normalized entities.
 * @throws {NormalizationError} If the input is not an array, if nested arrays are encountered, or if an item normalization does not result in an EntityID.
 */
export function normalizeArray(array: unknown[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): EntityID[] {
  if (!Array.isArray(array)) {
    throw new NormalizationError('Invalid entity for array schema', { expectedType: 'array', receivedType: typeof array, schema });
  }

  return array.map((item, index) => {
    const result = normalizeEntity(item, schema.items, entities);
    if (Array.isArray(result)) {
      throw new NormalizationError('Nested arrays are not supported', { index, item, schema });
    }
    if (!isEntityID(result)) {
      throw new NormalizationError('Array item normalization did not result in an EntityID', { index, item, result, schema });
    }
    return result;
  });
}