# Validators

The `@validators` module provides functions for validating schemas and data structures. It ensures that the schemas and data conform to the expected formats and constraints.

## Main Functions

### validateSchema

```typescript
function validateSchema(schema: Schema): void
```

Validates the provided schema to ensure it meets the required structure and constraints.

#### Parameters:
- `schema`: The schema to validate (type: `Schema`).

#### Throws:
- `SchemaValidationError`: If the schema is invalid or fails to meet the required structure.

#### Usage:
```typescript
import { validateSchema, Schema } from '@validators';

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

try {
  validateSchema(schema);
  console.log('Schema is valid');
} catch (error) {
  console.error('Schema validation failed:', error.message);
}
```

### validateStringValue

```typescript
function validateStringValue(value: string, schema: StringSchemaEntity): void
```

Validates a string value against a StringSchemaEntity.

#### Parameters:
- `value`: The string value to validate.
- `schema`: The StringSchemaEntity to use for validation.

#### Throws:
- `NormalizationError`: If the string value fails validation.

#### Usage:
```typescript
import { validateStringValue, StringSchemaEntity } from '@validators';

const stringSchema: StringSchemaEntity = {
  type: 'string',
  minLength: 3,
  maxLength: 10
};

try {
  validateStringValue('Hello', stringSchema);
  console.log('String is valid');
} catch (error) {
  console.error('String validation failed:', error.message);
}
```

### validateNumberValue

```typescript
function validateNumberValue(value: number, schema: NumberSchemaEntity): void
```

Validates a number value against a NumberSchemaEntity.

#### Parameters:
- `value`: The number value to validate.
- `schema`: The NumberSchemaEntity to use for validation.

#### Throws:
- `NormalizationError`: If the number value fails validation.

#### Usage:
```typescript
import { validateNumberValue, NumberSchemaEntity } from '@validators';

const numberSchema: NumberSchemaEntity = {
  type: 'number',
  minimum: 0,
  maximum: 100
};

try {
  validateNumberValue(50, numberSchema);
  console.log('Number is valid');
} catch (error) {
  console.error('Number validation failed:', error.message);
}
```

## Error Handling

The module uses `SchemaValidationError` and `NormalizationError` for error reporting. These errors provide detailed information about what went wrong during the validation process.

For more detailed information on specific validator functions, refer to the inline documentation in the source code:

```typescript
/**
 * Validates a string value against a StringSchemaEntity.
 * 
 * @param value - The string value to validate.
 * @param schema - The StringSchemaEntity to use for validation.
 * @throws {NormalizationError} If the string value fails validation.
 */
function validateStringValue(value: string, schema: StringSchemaEntity): void {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    throw new NormalizationError('String length below minimum', { value, minLength: schema.minLength, actualLength: value.length, schema });
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    throw new NormalizationError('String length exceeds maximum', { value, maxLength: schema.maxLength, actualLength: value.length, schema });
  }
  if (schema.pattern !== undefined) {
    try {
      if (!new RegExp(schema.pattern).test(value)) {
        throw new NormalizationError('String does not match pattern', { value, pattern: schema.pattern, schema });
      }
    } catch (error) {
      throw new NormalizationError('Invalid pattern in schema', { error: (error as Error).message, schema });
    }
  }
}

/**
 * Validates a number value against a NumberSchemaEntity.
 * 
 * @param value - The number value to validate.
 * @param schema - The NumberSchemaEntity to use for validation.
 * @throws {NormalizationError} If the number value fails validation.
 */
function validateNumberValue(value: number, schema: NumberSchemaEntity): void {
  if (schema.minimum !== undefined && value < schema.minimum) {
    throw new NormalizationError('Number below minimum', { value, minimum: schema.minimum, schema });
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    throw new NormalizationError('Number exceeds maximum', { value, maximum: schema.maximum, schema });
  }
}
```