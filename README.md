# TypeScript Data Normalization Library

Welcome to the TypeScript Data Normalization Library! 🎉 This library is your go-to solution for handling complex data structures and schemas with ease. Whether you're working with objects, arrays, or custom types, our library offers powerful features to streamline your data processing needs.

## 🚀 Features

- **Normalization**: Effortlessly convert complex data structures into a simplified, normalized format based on your schemas.
- **Denormalization**: Seamlessly transform normalized data back into its original form, complete with robust error handling and validation.
- **Custom Schema Handling**: Tailor the library to your needs with support for custom schema types and handlers.
- **Sensitive Data Redaction**: Ensure privacy and security by redacting sensitive fields as needed.
- **Validation**: Keep your data accurate with schema-based validation, including string length and number ranges.
- **Error Handling**: Benefit from comprehensive error handling with detailed logging.
- **Concurrency Control**: Maintain performance and consistency with `async-lock` for managing concurrent operations.

## 📅 Current Status

**This library is currently a work in progress. All features are still under development, and it is not yet ready for production use. Stay tuned for updates!**

## 📦 Installation

To get started, install the library using npm or yarn:

```bash
npm install (W.I.P)
# or
yarn add (W.I.P)
```

*Note: Still not uploaded to NPM as it;s work in progress*

## 🛠️ Usage

### Normalization

Transform complex data into a normalized format with the `normalize` function:

```typescript
import { normalize, Schema } from 'your-library-name';

const schema: Schema = {
  // Define your schema here
};

const data = {
  // Your data here
};

const normalizedData = normalize(data, schema);
```

### Denormalization

Convert normalized data back to its original form using the `denormalize` function:

```typescript
import { denormalize, Schema, NormalizedData } from 'your-library-name';

const schema: Schema = {
  // Define your schema here
};

const normalizedData: NormalizedData = {
  // Your normalized data here
};

const denormalizedData = denormalize(normalizedData, schema);
```

### Safe Normalization (with Concurrency Control)

Manage concurrent normalization operations with `safeNormalize`:

```typescript
import { safeNormalize, Schema } from 'your-library-name';

const schema: Schema = {
  // Define your schema here
};

const data = {
  // Your data here
};

safeNormalize(data, schema)
  .then(normalizedData => {
    // Use your normalized data here
  })
  .catch(error => {
    // Handle errors here
  });
```

### Safe Denormalization (with Concurrency Control)

Ensure data integrity with concurrent denormalization using `safeDenormalize`:

```typescript
import { safeDenormalize, Schema, NormalizedData } from 'your-library-name';

const schema: Schema = {
  // Define your schema here
};

const normalizedData: NormalizedData = {
  // Your normalized data here
};

safeDenormalize(normalizedData, schema)
  .then(denormalizedData => {
    // Use your denormalized data here
  })
  .catch(error => {
    // Handle errors here
  });
```

## 📖 Normalization Details

The `normalize` function adapts to various schema types, including objects, arrays, and custom schemas. It ensures data validity with built-in error handling.

### Error Handling

The library provides detailed error handling for normalization, including custom error types and comprehensive logging.

### Concurrency Control

With `async-lock`, `safeNormalize` manages concurrent operations effectively, ensuring that multiple processes do not interfere with each other.

## 🔄 Denormalization Details

The `denormalize` function reverses the normalization process, handling different schema types and performing thorough validation.

### Error Handling

Denormalization errors are categorized and logged in detail, including validation and type mismatch issues.

### Concurrency Control

`safeDenormalize` leverages `async-lock` for concurrent operations, maintaining data integrity and consistency.

## 🤝 Contributing

We welcome contributions to make this library even better! If you have suggestions, bug reports, or want to contribute, please open an issue or submit a pull request.

## 📜 License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more information.
