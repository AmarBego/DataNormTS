import { validateSchema } from '../src/schemaValidator';
import { Schema, SchemaEntity } from '../src/types';
import { SchemaValidationError } from '../src/errors';

describe('Schema Validator', () => {
    it('should validate a correct schema with nested objects', () => {
        const schema: Schema = {
          user: {
            type: 'object',
            name: 'user', 
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'number' },
              isActive: { type: 'boolean' },
              posts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' }
                  }
                }
              }
            }
          }
        };
      
        expect(() => validateSchema(schema)).not.toThrow();
    });
      
    it('should throw for top-level object schema without a name', () => {
        const schema: Schema = {
          user: {
            type: 'object',
            properties: {}
          } as any
        };
      
        expect(() => validateSchema(schema)).toThrow('Top-level object schema must have a name at path: user');
    });

    it('should validate nested object schemas', () => {
        const schema: Schema = {
          user: {
            type: 'object',
            name: 'user',
            properties: {
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' }
                }
              }
            }
          }
        };
      
        expect(() => validateSchema(schema)).not.toThrow();
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
      
    it('should validate schemas with arrays of primitives', () => {
        const schema: Schema = {
          tags: {
            type: 'array',
            items: { type: 'string' }
          }
        };

        expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should validate schemas with custom types', () => {
        const schema: Schema = {
          location: {
            type: 'custom',
            name: 'geopoint'
          }
        };

        expect(() => validateSchema(schema)).not.toThrow();
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

    it('should validate schema with empty object', () => {
        const schema: Schema = {
            emptyObject: {
                type: 'object',
                name: 'emptyObject',
                properties: {}
            }
        };
        expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should validate schema with empty array', () => {
        const schema: Schema = {
            emptyArray: {
                type: 'array',
                items: { type: 'string' }
            }
        };
        expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should validate complex nested schema', () => {
        const schema: Schema = {
            user: {
                type: 'object',
                name: 'user',
                properties: {
                    id: { type: 'string' },
                    profile: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            age: { type: 'number' },
                            addresses: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        street: { type: 'string' },
                                        city: { type: 'string' },
                                        zipCode: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        };
        expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should handle optional fields correctly', () => {
        const schema: Schema = {
            user: {
                type: 'object',
                name: 'user',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    age: { type: 'number', optional: true },
                    email: { type: 'string', optional: true }
                }
            }
        };
        expect(() => validateSchema(schema)).not.toThrow();
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

    it('should validate a large schema within a reasonable time', () => {
        const generateLargeSchema = (depth: number, breadth: number): SchemaEntity => {
            if (depth === 0) {
                return { type: 'string' } as SchemaEntity;
            }
            const properties: Record<string, SchemaEntity> = {};
            for (let i = 0; i < breadth; i++) {
                properties[`prop${i}`] = generateLargeSchema(depth - 1, breadth);
            }
            return {
                type: 'object',
                name: `object_${depth}`,
                properties
            } as SchemaEntity;
        };
    
        const largeSchema: Schema = {
            root: generateLargeSchema(5, 5) as SchemaEntity
        };
    
        const startTime = Date.now();
        validateSchema(largeSchema);
        const endTime = Date.now();
        const executionTime = endTime - startTime;
    
        expect(executionTime).toBeLessThan(1000);
    });
    
    it('should throw for schema exceeding maximum depth', () => {
        const generateDeepSchema = (depth: number): SchemaEntity => {
            if (depth === 0) {
                return { type: 'string' } as SchemaEntity;
            }
            return {
                type: 'object',
                name: `object_${depth}`, 
                properties: {
                    nested: generateDeepSchema(depth - 1)
                }
            } as SchemaEntity;
        };
    
        const deepSchema: Schema = {
            root: generateDeepSchema(101) as SchemaEntity
        };
    
        expect(() => validateSchema(deepSchema)).toThrow('Schema too deeply nested');
    });
});