import { validateSchema } from '../../src/validators/schemaValidator';
import { Schema } from '../../src/types';

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
});