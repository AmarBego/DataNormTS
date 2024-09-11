import { normalize, safeNormalize } from '../src/normalizers/normalizer';
import { Schema, ObjectSchemaEntity, ArraySchemaEntity, PrimitiveSchemaEntity, CustomSchemaEntity } from '../src/types';
import { registerCustomSchemaHandler, clearCustomSchemaHandlers } from '../src/types';
import { logger } from '../src/logger';
import { SchemaValidationError, NormalizationError } from '../src/errors';

jest.mock('../src/logger');

describe('normalize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCustomSchemaHandlers();
  });

  it('should normalize valid object data correctly', () => {
    const schema: Schema = {
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

    const expected = {
      entities: {
        user: {
          '1': {
            id: '1',
            name: 'John Doe',
            age: 30,
            isActive: true
          }
        }
      },
      result: '1'
    };

    expect(normalize(data, schema)).toEqual(expected);
  });

  it('should throw a NormalizationError for invalid input data', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' }
        }
      }
    };

    const data = null;

    expect(() => normalize(data, schema)).toThrow(NormalizationError);
    expect(() => normalize(data, schema)).toThrow('Invalid input data');
  });

  it('should throw a NormalizationError for invalid schema', () => {
    const schema: any = 'invalid schema';
    const data = { id: '1' };

    expect(() => normalize(data, schema)).toThrow(NormalizationError);
    expect(() => normalize(data, schema)).toThrow('Schema validation failed: Invalid schema');
  });

  it('should handle custom schema type', () => {
    const customHandler = jest.fn().mockImplementation((entity) => entity.id);
    registerCustomSchemaHandler('customEntity', customHandler);

    const schema: Schema = {
      customEntity: {
        type: 'custom',
        name: 'customEntity'
      }
    };

    const data = { id: 'custom-id', some: 'data' };

    const expected = {
      entities: {
        customEntity: {
          'custom-id': { id: 'custom-id', some: 'data' }
        }
      },
      result: 'custom-id'
    };

    const result = normalize(data, schema);
    expect(result).toEqual(expected);
    expect(customHandler).toHaveBeenCalledWith(
      data, 
      schema.customEntity, 
      expect.objectContaining({
        customEntity: expect.any(Object)
      })
    );
  });

  it('should handle nested array normalization', () => {
    const schema: Schema = {
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

    const data = [
      { id: '1', name: 'John Doe', posts: [{ id: 'p1', title: 'Post 1' }] },
      { id: '2', name: 'Jane Doe', posts: [{ id: 'p2', title: 'Post 2' }] }
    ];

    const expected = {
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
    };

    expect(normalize(data, schema)).toEqual(expected);
  });

  it('should throw a NormalizationError for invalid primitive type', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          age: { type: 'number' }
        }
      }
    };

    const data = {
      id: '1',
      age: '30' // Should be a number
    };

    expect(() => normalize(data, schema)).toThrow(NormalizationError);
    expect(() => normalize(data, schema)).toThrow('Type mismatch');
  });

  it('should validate string length constraints', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string', minLength: 3, maxLength: 5 }
        }
      }
    };

    expect(() => normalize({ id: '12' }, schema)).toThrow('String length below minimum');
    expect(() => normalize({ id: '123456' }, schema)).toThrow('String length exceeds maximum');
    expect(normalize({ id: '1234' }, schema)).toEqual({
      entities: { user: { '1234': { id: '1234' } } },
      result: '1234'
    });
  });

  it('should validate number range constraints', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          age: { type: 'number', minimum: 18, maximum: 100 }
        }
      }
    };
  
    expect(() => normalize({ id: '1', age: 17 }, schema)).toThrow('Number below minimum');
    expect(() => normalize({ id: '2', age: 101 }, schema)).toThrow('Number exceeds maximum');
    expect(normalize({ id: '3', age: 30 }, schema)).toEqual({
      entities: { user: { '3': { id: '3', age: 30 } } },
      result: '3'
    });
  });

  it('should handle async normalization with safeNormalize', async () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      }
    };

    const data = {
      id: '1',
      name: 'John Doe'
    };

    const expected = {
      entities: {
        user: {
          '1': {
            id: '1',
            name: 'John Doe'
          }
        }
      },
      result: '1'
    };

    await expect(safeNormalize(data, schema)).resolves.toEqual(expected);
  });

  it('should handle concurrent normalizations with safeNormalize', async () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      }
    };

    const data1 = { id: '1', name: 'John Doe' };
    const data2 = { id: '2', name: 'Jane Doe' };

    const results = await Promise.all([
      safeNormalize(data1, schema),
      safeNormalize(data2, schema)
    ]);

    expect(results[0]).toEqual({
      entities: { user: { '1': { id: '1', name: 'John Doe' } } },
      result: '1'
    });
    expect(results[1]).toEqual({
      entities: { user: { '2': { id: '2', name: 'Jane Doe' } } },
      result: '2'
    });
  });

  it('should throw a NormalizationError with cause for schema validation failure', () => {
    const schema: any = { invalidSchema: true };
    const data = { id: '1' };

    try {
      normalize(data, schema);
      fail('Expected normalize to throw an error');
    } catch (error) {
      if (error instanceof NormalizationError) {
        expect(error.message).toContain('Schema validation failed');
        expect(error.context).toHaveProperty('originalError');
        expect(error.context.originalError).toContain('Invalid schema');
      } else {
        fail('Expected error to be instance of NormalizationError');
      }
    }
  });
});

describe('custom schema handlers', () => {
  it('should handle custom schema type with single entity', () => {
    const customHandler = jest.fn().mockImplementation((entity) => entity.id);
    registerCustomSchemaHandler('customEntity', customHandler);

    const schema: Schema = {
      customEntity: {
        type: 'custom',
        name: 'customEntity'
      }
    };

    const data = { id: 'custom-id', some: 'data' };

    const expected = {
      entities: {
        customEntity: {
          'custom-id': { id: 'custom-id', some: 'data' }
        }
      },
      result: 'custom-id'
    };

    const result = normalize(data, schema);
    expect(result).toEqual(expected);
    expect(customHandler).toHaveBeenCalledWith(
      data, 
      schema.customEntity, 
      expect.objectContaining({
        customEntity: expect.any(Object)
      })
    );
  });

  it('should handle custom schema type with multiple entities', () => {
    const customHandler = jest.fn().mockImplementation((entities) => entities.map((e: any) => e.id));
    registerCustomSchemaHandler('customMultiEntity', customHandler);
  
    const schema: Schema = {
      customMultiEntity: {
        type: 'custom',
        name: 'customMultiEntity'
      }
    };
  
    const data = [
      { id: 'custom-id-1', some: 'data1' },
      { id: 'custom-id-2', some: 'data2' }
    ];
  
    const expected = {
      entities: {
        customMultiEntity: {
          'custom-id-1': { id: 'custom-id-1', some: 'data1' },
          'custom-id-2': { id: 'custom-id-2', some: 'data2' }
        }
      },
      result: ['custom-id-1', 'custom-id-2']
    };
  
    const result = normalize(data, schema);
    expect(result).toEqual(expected);
    expect(customHandler).toHaveBeenCalledWith(
      data, 
      schema.customMultiEntity, 
      expect.objectContaining({
        customMultiEntity: expect.any(Object)
      })
    );
  });

  it('should throw error when custom handler is not found', () => {
    const schema: Schema = {
      nonExistentCustomEntity: {
        type: 'custom',
        name: 'nonExistentCustomEntity'
      }
    };

    const data = { id: 'custom-id', some: 'data' };

    expect(() => normalize(data, schema)).toThrow('No custom handler found for schema type');
  });

  it('should throw error when custom handler returns invalid result', () => {
    const invalidCustomHandler = jest.fn().mockImplementation(() => ({ invalid: 'result' }));
    registerCustomSchemaHandler('invalidCustomEntity', invalidCustomHandler);

    const schema: Schema = {
      invalidCustomEntity: {
        type: 'custom',
        name: 'invalidCustomEntity'
      }
    };

    const data = { id: 'custom-id', some: 'data' };

    expect(() => normalize(data, schema)).toThrow('Custom handler must return an EntityID for non-array input');
  });
});

describe('normalize edge cases', () => {
  it('should handle deeply nested structures', () => {
    const schema: Schema = {
      root: {
        type: 'object',
        name: 'root',
        properties: {
          id: { type: 'string' },
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  level3: {
                    type: 'array',
                    items: {
                      type: 'object',
                      name: 'deepItem',
                      properties: {
                        id: { type: 'string' },
                        value: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  
    const data = {
      id: 'root1',
      level1: {
        level2: {
          level3: [
            { id: 'deep1', value: 1 },
            { id: 'deep2', value: 2 }
          ]
        }
      }
    };
  
    const result = normalize(data, schema);
    expect(result.entities).toHaveProperty('root');
    expect(result.entities).toHaveProperty('deepItem');
    expect(result.entities.deepItem).toHaveProperty('deep1');
    expect(result.entities.deepItem).toHaveProperty('deep2');
  });

  it('should handle large datasets', () => {
    const schema: Schema = {
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

    const data = Array.from({ length: 10000 }, (_, i) => ({
      id: `user${i}`,
      name: `User ${i}`
    }));

    const result = normalize(data, schema);
    expect(Object.keys(result.entities.user)).toHaveLength(10000);
  });

  it('should handle invalid custom handlers', () => {
    const invalidSingleHandler = jest.fn().mockReturnValue({ notAnEntityID: true });
    const invalidArrayHandler = jest.fn().mockReturnValue(['not', 'an', 'array', 'of', 'EntityIDs']);
    
    registerCustomSchemaHandler('invalidSingleCustom', invalidSingleHandler);
    registerCustomSchemaHandler('invalidArrayCustom', invalidArrayHandler);
  
    const singleSchema: Schema = {
      custom: {
        type: 'custom',
        name: 'invalidSingleCustom'
      }
    };
  
    const arraySchema: Schema = {
      custom: {
        type: 'custom',
        name: 'invalidArrayCustom'
      }
    };
  
    const singleData = { id: 'test' };
    const arrayData = [{ id: 'test1' }, { id: 'test2' }];
  
    // Test single data case
    expect(() => normalize(singleData, singleSchema)).toThrow(NormalizationError);
    expect(() => normalize(singleData, singleSchema)).toThrow('Custom handler must return an EntityID for non-array input');
    expect(invalidSingleHandler).toHaveBeenCalled();

    // Test array data case
    expect(() => normalize(arrayData, arraySchema)).toThrow(NormalizationError);
    expect(() => normalize(arrayData, arraySchema)).toThrow('Custom handler must return an array of EntityIDs for array input');
    expect(invalidArrayHandler).toHaveBeenCalled();
  });
});