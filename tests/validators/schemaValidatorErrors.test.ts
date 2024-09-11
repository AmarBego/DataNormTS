import { validateSchema } from '../../src/validators/schemaValidator';
import { Schema } from '../../src/types';
import { SchemaValidationError } from '../../src/errors';

describe('Schema Validator Errors', () => {
    it('should throw for top-level object schema without a name', () => {
        const schema: Schema = {
          user: {
            type: 'object',
            properties: {}
          } as any
        };
      
        expect(() => validateSchema(schema)).toThrow('Top-level object schema must have a name at path: user');
    });

    it('should throw for invalid nested schemas', () => {
        const schema: Schema = {
          user: {
            type: 'object',
            name: 'user',
            properties: {
              address: {
                type: 'object',
                properties: {
                  street: { type: 'invalid' as any }
                }
              }
            }
          }
        };
      
        expect(() => validateSchema(schema)).toThrow(SchemaValidationError);
        expect(() => validateSchema(schema)).toThrow('Invalid or missing schema type at path: user.address.street');
    });

    it('should throw for invalid primitive schema', () => {
        const schema: Schema = {
          age: {
            type: 'number',
            minimum: '18' as any,
          }
        };

        expect(() => validateSchema(schema)).toThrow('minimum must be a number at path: age');
    });

    it('should throw when minimum > maximum in number schema', () => {
        const schema: Schema = {
          age: {
            type: 'number',
            minimum: 100,
            maximum: 50,
          }
        };

        expect(() => validateSchema(schema)).toThrow('minimum cannot be greater than maximum at path: age');
    });

    it('should throw for invalid string schema', () => {
        const schema: Schema = {
          name: {
            type: 'string',
            minLength: -1,
          }
        };

        expect(() => validateSchema(schema)).toThrow('minLength must be a non-negative number at path: name');
    });

    it('should throw when minLength > maxLength in string schema', () => {
        const schema: Schema = {
          name: {
            type: 'string',
            minLength: 10,
            maxLength: 5,
          }
        };

        expect(() => validateSchema(schema)).toThrow('minLength cannot be greater than maxLength at path: name');
    });

    it('should throw for invalid pattern in string schema', () => {
        const schema: Schema = {
          name: {
            type: 'string',
            pattern: 123 as any,
          }
        };

        expect(() => validateSchema(schema)).toThrow('pattern must be a string at path: name');
    });

    it('should throw for invalid array schema', () => {
        const schema: Schema = {
          tags: {
            type: 'array',
            items: 'string' as any,
          }
        };

        expect(() => validateSchema(schema)).toThrow('Array schema must have items at path: tags');
    });

    it('should throw for invalid custom schema', () => {
        const schema: Schema = {
          location: {
            type: 'custom',
          } as any
        };

        expect(() => validateSchema(schema)).toThrow('Custom schema must have a name at path: location');
    });

    it('should throw for invalid optional field', () => {
        const schema: Schema = {
            user: {
                type: 'object',
                name: 'user',
                properties: {
                    id: { type: 'string' },
                    age: { type: 'number', optional: 'yes' as any }
                }
            }
        };
        expect(() => validateSchema(schema)).toThrow('Invalid optional field at path: user.age');
    });
});