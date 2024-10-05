1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Normalizers](#normalizers)
   - [Overview](#overview)
   - [Core Functions](#core-functions)
     - [`normalize`](#normalize)
     - [`safeNormalize`](#safenormalize)
   - [Submodules](#submodules)
     - [Custom Normalizer](#custom-normalizer)
     - [Object Normalizer](#object-normalizer)
     - [Array Normalizer](#array-normalizer)
     - [Primitive Normalizer](#primitive-normalizer)
     - [Normalization Utilities](#normalization-utilities)
4. [Denormalizers](#denormalizers)
   - [Overview](#overview-1)
   - [Core Function](#core-function)
     - [`denormalize`](#denormalize)
   - [Submodules](#submodules-1)
     - [Entity Denormalizer](#entity-denormalizer)
     - [Object Denormalizer](#object-denormalizer-1)
     - [Array Denormalizer](#array-denormalizer)
     - [Custom Denormalizer](#custom-denormalizer)
     - [Primitive Denormalizer](#primitive-denormalizer)
5. [Schemas](#schemas)
   - [Schema Structure](#schema-structure)
   - [Schema Types](#schema-types)
     - [Object Schema](#object-schema)
     - [Array Schema](#array-schema)
     - [Primitive Schema](#primitive-schema)
     - [Custom Schema](#custom-schema)
6. [Custom Schema Handlers](#custom-schema-handlers)
   - [Registering Custom Handlers](#registering-custom-handlers)
   - [Using Custom Handlers](#using-custom-handlers)
7. [Error Handling](#error-handling)
   - [Normalization Errors](#normalization-errors)
   - [Denormalization Errors](#denormalization-errors)
8. [Usage Examples](#usage-examples)
   - [Basic Normalization and Denormalization](#basic-normalization-and-denormalization)
   - [Handling Nested Structures](#handling-nested-structures)
   - [Using Custom Handlers](#using-custom-handlers)
9. [Configuration](#configuration)
10. [Testing](#testing)
11. [Contributing](#contributing)
12. [License](#license)

---

## Introduction

**DataNormTS** facilitates the transformation of complex and nested data structures into normalized formats and vice versa. Normalization is essential for optimizing data management, especially when dealing with relational data or preparing data for state management libraries like Redux.
#### Key Features
- **Flexible Schemas**: Define customizable schemas to dictate how data should be normalized or denormalized.

- **Custom Handlers**: Extend functionality by registering custom schema handlers for specialized data types.

- **Performance Optimizations**: Utilize memoization and asynchronous operations to ensure efficient data processing.

- **Comprehensive Testing**: Ensure reliability with extensive test suites covering various scenarios and edge cases.

## Installation

You can install **DataNormTS** via [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/):

### Using npm

```bash
npm install datanormts
```

### Using yarn

```bash
yarn add datanormts
```

### Importing into Your Project

```typescript
import { normalize, denormalize } from 'datanormts';
```

---

## Normalizers

### Overview

The **Normalizers** module is responsible for transforming input data into a normalized format based on predefined schemas. Normalization processes data structures to improve efficiency, avoid redundancy, and simplify data manipulation.

### Core Functions

#### `normalize`

```typescript:src/normalizers/normalizer.ts
export function normalize(data: unknown, schema: Schema): NormalizedData;
```

**Description**:  
Transforms the provided data into a normalized format according to the specified schema.

**Parameters**:
- `data` (`unknown`): The data to normalize.
- `schema` (`Schema`): The schema defining the normalization rules.

**Returns**:
- `NormalizedData`: The normalized representation of the input data.

**Throws**:
- `NormalizationError`: If the data is invalid or does not conform to the schema.

**Example**:

```typescript
import { normalize } from 'datanormts';

const schema = {
  user: {
    type: 'object',
    name: 'user',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      age: { type: 'number' },
      isActive: { type: 'boolean' }
    }
  }
};

const data = {
  id: '1',
  name: 'John Doe',
  age: 30,
  isActive: true
};

const normalizedData = normalize(data, schema);
console.log(normalizedData);
```

#### `safeNormalize`

```typescript:src/normalizers/normalizer.ts
export async function safeNormalize(data: unknown, schema: Schema): Promise<NormalizedData>;
```

**Description**:  
Performs normalization in a thread-safe manner using locks to prevent concurrent modifications.

**Parameters**:
- `data` (`unknown`): The data to normalize.
- `schema` (`Schema`): The schema defining the normalization rules.

**Returns**:
- `Promise<NormalizedData>`: A promise that resolves to the normalized data.

**Throws**:
- `NormalizationError`: If the data is invalid or does not conform to the schema.

**Example**:

```typescript
import { safeNormalize } from 'datanormts';

const schema = { /* schema definition */ };
const data = { /* data to normalize */ };

safeNormalize(data, schema)
  .then(normalizedData => {
    console.log(normalizedData);
  })
  .catch(error => {
    console.error(error);
  });
```

### Submodules

#### Custom Normalizer

Handles normalization for custom schema types.

```typescript:src/normalizers/customNormalizer.ts
export function normalizeEntity(entity: unknown, schema: SchemaEntity, entities: NormalizedData['entities']): EntityID | EntityID[] | unknown;
```

**Description**:  
Normalizes entities based on custom schema definitions, allowing for specialized handling beyond standard types.

**Key Functions**:
- `normalizeEntity`: Determines the normalization path based on schema type.
- `normalizeCustomEntity`: Handles custom schema normalization using registered handlers.

#### Object Normalizer

Handles normalization of object-type schemas.

```typescript:src/normalizers/objectNormalizer.ts
export function normalizeObject(entity: Record<string, unknown>, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): EntityID | Record<string, unknown>;
```

**Description**:  
Normalizes objects by extracting and storing entities with unique identifiers.

**Example**:

```typescript
const schema = {
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

const data = { id: '1', name: 'John Doe', age: 30 };
const normalizedData = normalize(data, schema);
```

#### Array Normalizer

Handles normalization of array-type schemas.

```typescript:src/normalizers/arrayNormalizer.ts
export function normalizeArray(array: unknown[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): EntityID[];
```

**Description**:  
Normalizes arrays by processing each item according to the specified item schema.

#### Primitive Normalizer

Handles normalization of primitive data types.

```typescript:src/normalizers/primitiveNormalizer.ts
export function normalizePrimitive(entity: unknown, schema: PrimitiveSchemaEntity): EntityID | number | string | boolean;
```

**Description**:  
Validates and returns primitive data types based on the schema.

#### Normalization Utilities

Provides utility functions to assist with the normalization process.

```typescript:src/normalizers/normalizationUtils.ts
export function isValidSchemaType(type: unknown): type is SchemaType;
export function isObjectSchemaEntity(schema: SchemaEntity): schema is ObjectSchemaEntity;
export function isArraySchemaEntity(schema: SchemaEntity): schema is ArraySchemaEntity;
export function isPrimitiveSchemaEntity(schema: SchemaEntity): schema is PrimitiveSchemaEntity;
export function isCustomSchemaEntity(schema: SchemaEntity): schema is CustomSchemaEntity;
export function isStringSchemaEntity(schema: PrimitiveSchemaEntity): schema is StringSchemaEntity;
export function isNumberSchemaEntity(schema: PrimitiveSchemaEntity): schema is NumberSchemaEntity;
export function isValidEntityIDArray(value: unknown): value is EntityID[];
```

**Description**:  
Includes type guard functions to determine the schema entity types and validate data.

---

## Denormalizers

### Overview

The **Denormalizers** module is responsible for reconstructing the original data structure from its normalized form. Denormalization transforms normalized data back into its nested, relational format based on the provided schemas.

### Core Function

#### `denormalize`

```typescript:src/denormalizers/denormalizer.ts
export function denormalize(normalizedData: NormalizedData, schema: Schema): unknown;
```

**Description**:  
Reconstructs the original data structure from normalized data using the specified schema.

**Parameters**:
- `normalizedData` (`NormalizedData`): The data to denormalize.
- `schema` (`Schema`): The schema defining the denormalization rules.

**Returns**:
- `unknown`: The denormalized data structure.

**Throws**:
- `DenormalizationError`: If the normalized data is invalid or does not conform to the schema.

**Example**:

```typescript
import { denormalize } from 'datanormts';

const schema = { /* schema definition */ };
const normalizedData = { /* normalized data */ };

const originalData = denormalize(normalizedData, schema);
console.log(originalData);
```

### Submodules

#### Entity Denormalizer

Handles denormalization of individual entities.

```typescript:src/denormalizers/entityDenormalizer.ts
export function denormalizeEntity(entityId: EntityID, schemaEntity: SchemaEntity, entities: NormalizedData['entities']): unknown;
```

**Description**:  
Denormalizes entities by retrieving them from the normalized entities collection based on their identifiers and schema definitions.

#### Object Denormalizer

Handles denormalization of object-type schemas.

```typescript:src/denormalizers/objectDenormalizer.ts
export function denormalizeObject(entity: unknown, schema: ObjectSchemaEntity, entities: NormalizedData['entities']): Record<string, unknown>;
```

**Description**:  
Reconstructs objects by denormalizing each property according to the schema.

**Example**:

```typescript
const schema = { /* object schema */ };
const normalizedData = { /* normalized entities */ };
const denormalizedObject = denormalize(normalizedData, schema);
console.log(denormalizedObject);
```

#### Array Denormalizer

Handles denormalization of array-type schemas.

```typescript:src/denormalizers/arrayDenormalizer.ts
export function denormalizeArray(array: EntityID[], schema: ArraySchemaEntity, entities: NormalizedData['entities']): unknown[];
```

**Description**:  
Reconstructs arrays by denormalizing each element based on the item schema.

#### Custom Denormalizer

Handles denormalization for custom schema types.

```typescript:src/denormalizers/customDenormalizer.ts
export function denormalizeCustom(entity: unknown, schema: CustomSchemaEntity, entities: NormalizedData['entities']): unknown;
```

**Description**:  
Denormalizes entities based on custom schema handlers, allowing for specialized reconstruction beyond standard types.

#### Primitive Denormalizer

Handles denormalization of primitive data types.

```typescript:src/denormalizers/primitiveDenormalizer.ts
export function denormalizePrimitive(entityId: EntityID, schema: PrimitiveSchemaEntity): string | number | boolean;
```

**Description**:  
Validates and returns primitive data types based on the schema.

---

## Schemas

### Schema Structure

Schemas define how data should be normalized or denormalized. A schema is a TypeScript object that outlines the structure, types, and properties of the data entities.

### Schema Types

Schemas can be of various types, each catering to different data structures and requirements.

#### Object Schema

Defines the structure of an object with specific properties.

**Example**:

```typescript
const userSchema: Schema = {
  user: {
    type: 'object',
    name: 'user',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      age: { type: 'number' },
      isActive: { type: 'boolean' }
    }
  }
};
```

#### Array Schema

Defines an array structure, specifying the schema of its items.

**Example**:

```typescript
const usersSchema: Schema = {
  users: {
    type: 'array',
    items: {
      type: 'object',
      name: 'user',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    }
  }
};
```

#### Primitive Schema

Defines primitive data types such as strings, numbers, and booleans.

**Example**:

```typescript
const tagsSchema: Schema = {
  tags: {
    type: 'array',
    items: { type: 'string' }
  }
};
```

#### Custom Schema

Allows for custom data handling by registering specialized handlers.

**Example**:

```typescript
const customEntitySchema: Schema = {
  customEntity: {
    type: 'custom',
    name: 'customEntity'
  }
};
```

---

## Custom Schema Handlers

### Registering Custom Handlers

Custom schema handlers enable specialized processing of data types that go beyond the standard normalization and denormalization mechanisms. To utilize custom handlers, you must register them with the library.

**Function**: `registerCustomSchemaHandler`

```typescript:src/types.ts
export function registerCustomSchemaHandler(name: string, handler: CustomSchemaHandler): void;
```

**Parameters**:
- `name` (`string`): The identifier for the custom schema type.
- `handler` (`CustomSchemaHandler`): The function that handles normalization or denormalization for the custom schema.

**Example**:

```typescript
import { registerCustomSchemaHandler } from 'datanormts';

const customHandler: CustomSchemaHandler = (entity, schema, entities) => {
  // Custom normalization logic
  return entity.id;
};

registerCustomSchemaHandler('customEntity', customHandler);
```

### Using Custom Handlers

Once registered, custom schema handlers are invoked automatically during normalization and denormalization processes based on the schema definitions.

**Example**:

```typescript
import { normalize, denormalize } from 'datanormts';

// Register the custom handler
registerCustomSchemaHandler('customEntity', customHandler);

// Define the schema using the custom type
const schema: Schema = {
  customEntity: {
    type: 'custom',
    name: 'customEntity'
  }
};

// Normalize data
const data = { id: 'custom-id', some: 'data' };
const normalizedData = normalize(data, schema);

// Denormalize data
const originalData = denormalize(normalizedData, schema);
console.log(originalData);
```

---

## Error Handling

DataNormTS provides robust error handling mechanisms to ensure that developers receive clear and actionable feedback when issues arise during normalization or denormalization.

### Normalization Errors

**Class**: `NormalizationError`

**Description**:  
Thrown when normalization fails due to invalid input data, schema mismatches, or other related issues.

**Common Scenarios**:
- Invalid input data type.
- Schema validation failures.
- Missing required properties.
- Custom handler errors.

**Example**:

```typescript
try {
  const normalizedData = normalize(data, schema);
} catch (error) {
  if (error instanceof NormalizationError) {
    console.error('Normalization failed:', error.message);
  }
}
```

### Denormalization Errors

**Class**: `DenormalizationError`

**Description**:  
Thrown when denormalization fails due to missing entities, invalid schemas, or other related issues.

**Common Scenarios**:
- Missing entities in normalized data.
- Invalid schema definitions.
- Circular references that cannot be resolved.

**Example**:

```typescript
try {
  const originalData = denormalize(normalizedData, schema);
} catch (error) {
  if (error instanceof DenormalizationError) {
    console.error('Denormalization failed:', error.message);
  }
}
```

---

## Usage Examples

### Basic Normalization and Denormalization

```typescript
import { normalize, denormalize } from 'datanormts';

// Define the schema
const schema = {
  user: {
    type: 'object',
    name: 'user',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      age: { type: 'number' },
      isActive: { type: 'boolean' }
    }
  }
};

// Original data
const data = {
  id: '1',
  name: 'John Doe',
  age: 30,
  isActive: true
};

// Normalize the data
const normalizedData = normalize(data, schema);
console.log('Normalized Data:', normalizedData);

/*
Output:
{
  entities: {
    user: {
      '1': { id: '1', name: 'John Doe', age: 30, isActive: true }
    }
  },
  result: '1'
}
*/

// Denormalize the data
const denormalizedData = denormalize(normalizedData, schema);
console.log('Denormalized Data:', denormalizedData);

/*
Output:
{
  id: '1',
  name: 'John Doe',
  age: 30,
  isActive: true
}
*/
```

### Handling Nested Structures

```typescript
import { normalize, denormalize } from 'datanormts';

// Define the schema for users and posts
const schema = {
  users: {
    type: 'array',
    items: {
      type: 'object',
      name: 'user',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        posts: {
          type: 'array',
          items: {
            type: 'object',
            name: 'post',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

// Original data with nested posts
const data = [
  { id: '1', name: 'John Doe', posts: [{ id: 'p1', title: 'Post 1' }] },
  { id: '2', name: 'Jane Doe', posts: [{ id: 'p2', title: 'Post 2' }] }
];

// Normalize the data
const normalizedData = normalize(data, schema);
console.log('Normalized Data:', normalizedData);

/*
Output:
{
  entities: {
    user: {
      '1': { id: '1', name: 'John Doe', posts: ['p1'] },
      '2': { id: '2', name: 'Jane Doe', posts: ['p2'] }
    },
    post: {
      'p1': { id: 'p1', title: 'Post 1' },
      'p2': { id: 'p2', title: 'Post 2' }
    }
  },
  result: ['1', '2']
}
*/

// Denormalize the data
const denormalizedData = denormalize(normalizedData, schema);
console.log('Denormalized Data:', denormalizedData);

/*
Output:
[
  { id: '1', name: 'John Doe', posts: [{ id: 'p1', title: 'Post 1' }] },
  { id: '2', name: 'Jane Doe', posts: [{ id: 'p2', title: 'Post 2' }] }
]
*/
```

### Using Custom Handlers

```typescript
import { normalize, denormalize, registerCustomSchemaHandler } from 'datanormts';

// Define a custom handler for 'customEntity'
const customHandler: CustomSchemaHandler = (entity, schema, entities) => {
  if (typeof entity === 'string' || typeof entity === 'number') {
    // During denormalization: entity is ID, return the entity ID
    return entity;
  } else {
    // During normalization: entity is the object, return the object ID
    return entity.id;
  }
};

// Register the custom handler
registerCustomSchemaHandler('customEntity', customHandler);

// Define the custom schema
const schema = {
  customEntity: {
    type: 'custom',
    name: 'customEntity'
  }
};

// Original data
const data = { id: 'custom-id', some: 'data' };

// Normalize the data
const normalizedData = normalize(data, schema);
console.log('Normalized Data:', normalizedData);

/*
Output:
{
  entities: {
    customEntity: {
      'custom-id': { id: 'custom-id', some: 'data' }
    }
  },
  result: 'custom-id'
}
*/

// Denormalize the data
const denormalizedData = denormalize(normalizedData, schema);
console.log('Denormalized Data:', denormalizedData);

/*
Output:
{ id: 'custom-id', some: 'data' }
*/
```

---

## Configuration

DataNormTS utilizes several configuration options to tailor its behavior according to project requirements.

### TypeScript Configuration

Ensure your `tsconfig.json` is set up correctly to support DataNormTS.

```json:tsconfig.json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["jest", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

### Logging Configuration

The library includes a configurable logger (`src/logger.ts`) that can be adjusted to set logging levels, output destinations, and other settings. Refer to the [Logger Documentation](./src/logger.ts) for more details.

---

## Testing

DataNormTS is built with reliability in mind, supported by comprehensive test suites covering diverse scenarios and edge cases.

### Running Tests

Ensure you have Jest installed, then execute:

```bash
npx jest
```

**Sample Test Output**:

```
Test Suites: 8 passed, 8 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        2.883 s
Ran all test suites.
```

### Test Coverage

- **Normalizers**: Validates normalization logic across various data structures, including objects, arrays, primitives, and custom entities.
- **Denormalizers**: Ensures accurate reconstruction of original data from normalized forms, handling nested structures and error scenarios.
- **Edge Cases**: Tests deeply nested structures, large datasets, circular references, and invalid custom handlers to ensure robustness.
- **Custom Handlers**: Verifies the registration and functionality of custom schema handlers, including error handling for invalid scenarios.

---

## Contributing

Contributions are welcome! Help improve DataNormTS by submitting issues, feature requests, or pull requests.

### How to Contribute

1. **Fork the Repository**: Create a fork of the DataNormTS repository on GitHub.
2. **Clone the Fork**:

   ```bash
   git clone https://github.com/your-username/DataNormTS.git
   ```

3. **Create a Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**: Implement your feature or fix.
5. **Run Tests**:

   ```bash
   npx jest
   ```

6. **Commit Changes**:

   ```bash
   git commit -m "Description of your changes"
   ```

7. **Push to Fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**: Submit a pull request detailing your changes.

### Code Standards

- Follow existing coding conventions and styles.
- Ensure all tests pass.
- Provide clear and concise commit messages.
- Update documentation as necessary.

---

## License

DataNormTS is licensed under the [MIT License](./LICENSE). See the [LICENSE](./LICENSE) file for more details.

---
