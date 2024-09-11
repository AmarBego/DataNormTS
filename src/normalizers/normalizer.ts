import { Schema, NormalizedData, SchemaEntity, EntityID } from '../types';
import { validateSchema } from '../schemaValidator';
import { memoize } from '../utils/utils';
import { SchemaValidationError, NormalizationError } from '../errors';
import { normalizeEntity } from './customNormalizer';
import { logger } from '../logger';
import AsyncLock = require('async-lock');
import { generateLockKey } from '../utils/utils';

const memoizedValidateSchema = memoize(validateSchema);

export function normalize(data: unknown, schema: Schema): NormalizedData {
  try {
    validateSchema(schema);
    memoizedValidateSchema(schema);

    if (!data || typeof data !== 'object') {
      throw new NormalizationError('Invalid input data', { receivedType: typeof data });
    }

    const entities: NormalizedData['entities'] = {};

    const firstSchemaKey = Object.keys(schema)[0];
    if (!firstSchemaKey) {
      throw new NormalizationError('Schema must have at least one entry', { schema });
    }

    const firstSchemaEntity = schema[firstSchemaKey];
    const result = normalizeEntity(data, firstSchemaEntity, entities);

    return { entities, result };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      throw new NormalizationError(`Schema validation failed: ${error.message}`, { originalError: error.message, context: error.context });
    }
    if (error instanceof NormalizationError) {
      throw error;
    }
    throw new NormalizationError('Unexpected error during normalization', { originalError: (error as Error).message });
  }
}

const normalizationLock = new AsyncLock();

export async function safeNormalize(data: unknown, schema: Schema): Promise<NormalizedData> {
  const lockKey = generateLockKey(data, schema);

  return normalizationLock.acquire(lockKey, async () => {
    try {
      logger.debug('Starting normalization', { lockKey });
      const result = normalize(data, schema);
      logger.debug('Normalization completed', { lockKey });
      return result;
    } catch (error) {
      logger.error('Error during normalization', { lockKey, error: (error as Error).message });
      throw error;
    }
  });
}