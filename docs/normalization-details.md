# Normalizers

The `@normalizers` module provides a set of functions for normalizing complex data structures according to defined schemas. It's designed to handle various types of data, including objects, arrays, and custom entities.

## Main Functions

### normalize

```typescript
function normalize(data: unknown, schema: Schema): NormalizedData
```

Normalizes the given data according to the provided schema.

#### Parameters:
- `data`: The data to normalize (type: `unknown`).
- `schema`: The schema to use for normalization (type: `Schema`).

#### Returns:
- `NormalizedData`: An object containing the normalized entities and the result.

#### Throws:
- `NormalizationError`: If the data is invalid or fails to match the schema.

#### Usage:
```typescript
import { normalize, Schema } from '@normalizers';

const schema: Schema = {
  user: {
    type: 'object',
    name: 'user',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      age: { type: 'number' }
    }
  }
};

const data = {
  id: '1',
  name: 'John Doe',
  age: 30
};

const normalizedData = normalize(data, schema);
console.log(normalizedData);
```

### safeNormalize

```typescript
async function safeNormalize(data: unknown, schema: Schema): Promise<NormalizedData>
```

Performs safe normalization of data using a lock to prevent concurrent modifications.

#### Parameters:
- `data`: The data to normalize (type: `unknown`).
- `schema`: The schema to use for normalization (type: `Schema`).

#### Returns:
- `Promise<NormalizedData>`: A promise that resolves to the normalized data.

#### Throws:
- `NormalizationError`: If the data is invalid or fails to match the schema.

#### Usage:
```typescript
import { safeNormalize, Schema } from '@normalizers';

const schema: Schema = {
  // Define your schema here
};

const data = {
  // Your data here
};

safeNormalize(data, schema)
  .then(normalizedData => console.log(normalizedData))
  .catch(error => console.error('Safe normalization error:', error));
```
### Schema Validation

To validate a schema:


```typescript
import { validateSchema, Schema } from 'typescript-data-normalization';

const schema: Schema = {
  // Define your schema here
};

try {
  validateSchema(schema);
  console.log('Schema is valid');
} catch (error) {
  console.error('Schema validation error:', error);
}
```

## Helper Functions

### normalizeEntity

```typescript
function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown
```

Normalizes a single entity according to the provided schema.

### normalizeObject

```typescript
function normalizeObject(entity: Record<string, unknown>, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): EntityID | Record<string, unknown>
```

Normalizes an object entity based on the provided schema.

### normalizeArray

```typescript
function normalizeArray(array: unknown[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): EntityID[]
```

Normalizes an array of entities based on the provided schema.

### normalizePrimitive

```typescript
function normalizePrimitive(value: unknown, schema: PrimitiveSchemaEntity): unknown
```

Normalizes a primitive value based on the provided schema.

## Custom Schema Handling

The `@normalizers` module supports custom schema types through the use of custom schema handlers. You can register custom handlers using the `registerCustomSchemaHandler` function from the `@types` module.

```typescript
import { registerCustomSchemaHandler } from '@types';

registerCustomSchemaHandler('customType', (entity, schema, entities) => {
  // Your custom normalization logic here
});
```

## Error Handling

The module uses `NormalizationError` for error reporting. These errors provide detailed information about what went wrong during the normalization process.

## Thread Safety

The `safeNormalize` function uses an `AsyncLock` to ensure thread-safe operations when normalizing data concurrently.

For more detailed information on specific normalizer functions, refer to the inline documentation in the source code:


```typescript
import { Schema, NormalizedData, SchemaEntity, EntityID } from '../types';
import { validateSchema } from '../validators/schemaValidator';
import { memoize } from '../utils/utils';
import { SchemaValidationError, NormalizationError } from '../errors';
import { normalizeEntity } from './customNormalizer';
import { logger } from '../logger';
import AsyncLock = require('async-lock');
import { generateLockKey } from '../utils/utils';

/**
 * Memoizes the validateSchema function to improve performance.
 */
const memoizedValidateSchema = memoize(validateSchema);

/**
 * Normalizes the given data according to the provided schema.
 * 
 * @param data - The data to normalize.
 * @param schema - The schema to use for normalization.
 * @returns The normalized data.
 * @throws {NormalizationError} If the data is invalid or fails to match the schema.
 */
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
/**
 * Creates a lock for normalization operations to ensure thread safety.
 */
const normalizationLock = new AsyncLock();

/**
 * Performs safe normalization of data using a lock to prevent concurrent modifications.
 * 
 * @param data - The data to normalize.
 * @param schema - The schema to use for normalization.
 * @returns A promise that resolves to the normalized data.
 * @throws {NormalizationError} If the data is invalid or fails to match the schema.
 */
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
```



```typescript
import { SchemaEntity, NormalizedData, EntityID, CustomSchemaEntity } from '../types';
import { NormalizationError } from '../errors';
import { getCustomSchemaHandler } from '../types';
import { isEntityID, isCustomSchemaEntity, isObjectSchemaEntity, isArraySchemaEntity, isPrimitiveSchemaEntity } from './normalizationUtils';
import { normalizeObject } from './objectNormalizer';
import { normalizeArray } from './arrayNormalizer';
import { normalizePrimitive } from './primitiveNormalizer';
import { logger } from '../logger';

/**
 * Normalizes the given entity according to the provided schema.
 * 
 * @param entity - The entity to normalize.
 * @param schema - The schema to use for normalization.
 * @param entities - The collection of normalized entities.
 * @returns The ID of the normalized entity if it has an ID, otherwise the normalized entity itself.
 * @throws {NormalizationError} If the entity is invalid for the schema or if a required property is missing.
 */
export function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown {
  if (isCustomSchemaEntity(schema)) {
    return normalizeCustomEntity(entity, schema, entities);
  } else if (isObjectSchemaEntity(schema)) {
    return normalizeObject(entity as Record<string, unknown>, schema, entities);
  } else if (isArraySchemaEntity(schema)) {
    return normalizeArray(entity as unknown[], schema, entities);
  } else if (isPrimitiveSchemaEntity(schema)) {
    return normalizePrimitive(entity, schema);
  } else {
    const exhaustiveCheck: never = schema;
    throw new NormalizationError('Unsupported schema type', { schemaType: (schema as SchemaEntity).type, entity });
  }
}
/**
 * Normalizes a custom entity based on the provided schema and stores it in the entities collection.
 * 
 * @param entity - The entity to normalize.
 * @param schema - The schema to use for normalization.
 * @param entities - The collection of normalized entities.
 * @returns The ID of the normalized entity if it has an ID, otherwise the normalized entity itself.
 * @throws {NormalizationError} If the entity is invalid for the custom schema or if a required property is missing.
 */
function normalizeCustomEntity(entity: unknown, schema: CustomSchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] {

  if (!schema.name) {
    throw new NormalizationError('Custom schema must have a name', { schema });
  }
  const customHandler = getCustomSchemaHandler(schema.name);
  if (!customHandler) {
    logger.error('Custom handler not found', { schemaName: schema.name });
    throw new NormalizationError('No custom handler found for schema type', { schemaType: schema.name });
  }

  const result = customHandler(entity, schema, entities);

  if (!entities[schema.name]) {
    entities[schema.name] = {};
  }
  if (Array.isArray(entity)) {
    if (!Array.isArray(result)) {
      throw new NormalizationError('Custom handler must return an array for array input', { result, entity, schema });
    }
    if (!result.every(isEntityID)) {
      throw new NormalizationError('Custom handler must return an array of EntityIDs for array input', { result, entity, schema });
    }
    if (result.length !== entity.length) {
      throw new NormalizationError('Custom handler must return an array of EntityIDs for array input', { result, entity, schema });
    }
    result.forEach((id, index) => {
      if (typeof id !== 'string' && typeof id !== 'number') {
        throw new NormalizationError('EntityID must be a string or number', { id, index, entity, schema });
      }
      entities[schema.name][id] = entity[index];
    });
  } else {
    if (Array.isArray(result)) {
      throw new NormalizationError('Custom handler must return a single EntityID for non-array input', { result, entity, schema });
    }
    if (!isEntityID(result)) {
      throw new NormalizationError('Custom handler must return an EntityID for non-array input', { result, entity, schema });
    }
    if (typeof result !== 'string' && typeof result !== 'number') {
      throw new NormalizationError('EntityID must be a string or number', { result, entity, schema });
    }
    entities[schema.name][result] = entity;
  }
  logger.debug('Custom entity normalization completed', { schema: schema.name });

  return result;
}
```



```typescript
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
```



```typescript
import { ObjectSchemaEntity, NormalizedData, EntityID } from '../types';
import { NormalizationError } from '../errors';
import { normalizeEntity } from './customNormalizer';

/**
 * Normalizes an object entity based on the provided schema and stores it in the entities collection.
 * 
 * @param entity - The entity to normalize.
 * @param schema - The schema to use for normalization.
 * @param entities - The collection of normalized entities.
 * @returns The ID of the normalized entity if it has an ID, otherwise the normalized entity itself.
 * @throws {NormalizationError} If the entity is invalid for the object schema or if a required property is missing.
 */
export function normalizeObject(entity: Record<string, unknown>, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): EntityID | Record<string, unknown> {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    throw new NormalizationError('Invalid entity for object schema', { expectedType: 'object', receivedType: typeof entity });
  }

  const entityName = schema.name || 'unnamed';

  if (!entities[entityName]) {
    entities[entityName] = {};
  }

  const id = entity.id as EntityID;
  if (id === undefined) {
    // If there's no ID, just normalize the object without adding it to entities
    const normalizedEntity: Record<string, unknown> = {};
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      if (key in entity) {
        normalizedEntity[key] = normalizeEntity(entity[key], propertySchema, entities);
      }
    }
    return normalizedEntity;
  }

  const normalizedEntity: Record<string, unknown> = {};
  const properties = Object.entries(schema.properties);

  for (const [key, propertySchema] of properties) {
    if (key in entity) {
      normalizedEntity[key] = normalizeEntity(entity[key], propertySchema, entities);
    } else if (Array.isArray(schema.required) && schema.required.includes(key)) {
      throw new NormalizationError('Missing required property', { entityName, id, missingProperty: key });
    }
  }

  entities[entityName][id] = normalizedEntity;

  return id;
}
```