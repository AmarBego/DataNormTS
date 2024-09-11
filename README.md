# TypeScript Data Normalization Library

Welcome to the TypeScript Data Normalization Library! This powerful library provides robust tools for normalizing and validating complex data structures using customizable schemas.

## 🚀 Features

- **Schema-based Normalization**: Convert complex data structures into a normalized format based on your defined schemas.
- **Comprehensive Validation**: Ensure data integrity with thorough schema validation, including support for primitive types, objects, arrays, and custom schemas.
- **Custom Schema Handling**: Extend functionality with support for custom schema types and handlers.
- **Robust Error Handling**: Benefit from detailed error reporting and logging for both normalization and validation processes.
- **Concurrency Control**: Maintain data consistency with built-in support for managing concurrent operations using `async-lock`.
- **Type Safety**: Leverage TypeScript's type system for enhanced code reliability and developer experience.

## 📦 Installation

To install the library, use npm or yarn:


```bash
npm install typescript-data-normalization
# or
yarn add typescript-data-normalization
```

*Note: Still not uploaded to NPM as it's work in progress*

## 🛠️ Usage

### Normalization

To normalize data according to a schema:

```typescript
typescript
import { normalize, Schema } from 'typescript-data-normalization';

const schema: Schema = {
  // Define your schema here
};

const data = {
  // Your data here
};

try {
  const normalizedData = normalize(data, schema);
  console.log(normalizedData);
} catch (error) {
  console.error('Normalization error:', error);
}
```

### Safe Normalization (with Concurrency Control)

For thread-safe normalization:

```typescript
import { safeNormalize, Schema } from 'typescript-data-normalization';

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

## 🚧 Work in Progress: Denormalization

I am currently working on a denormalization feature that will allow you to convert normalized data back into its original structure. This feature is still under development and is not yet available in the public API. Stay tuned for updates!

Key points about the upcoming denormalization feature:
- Convert normalized data back to its original nested structure
- Maintain consistency with the normalization process
- Handle complex scenarios like circular references
- Provide options for partial denormalization

I appreciate your patience as we work on this feature. If you have any suggestions or use cases you'd like to see supported, please open an issue on our GitHub repository.

## 📖 Normalization Details

The library supports various schema types:

- **Objects**: Normalize complex nested objects.
- **Arrays**: Handle arrays of entities.
- **Primitives**: Validate and normalize strings, numbers, and booleans.
- **Custom**: Extend functionality with custom schema types.

### Error Handling

The library provides detailed error messages for various scenarios:

- Schema validation errors
- Type mismatches
- Missing required properties
- Invalid primitive values (e.g., string length, number range)

### Concurrency Control

The `safeNormalize` function uses `async-lock` to ensure thread-safe operations when normalizing data concurrently.

## 🔍 Validation Details

The schema validation process includes:

- Checking for valid schema types
- Validating object properties
- Ensuring array items conform to the schema
- Verifying primitive value constraints (e.g., string length, number range)
- Custom schema validation

## 🤝 Contributing

Contributions are welcome! If you have suggestions, bug reports, or want to contribute code, please open an issue or submit a pull request on our GitHub repository.

## 📜 License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.