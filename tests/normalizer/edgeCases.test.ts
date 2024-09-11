import { normalize } from '../../src/normalizers/normalizer';
import { Schema, clearCustomSchemaHandlers, registerCustomSchemaHandler } from '../../src/types';
import { NormalizationError } from '../../src/errors';

describe('normalize edge cases', () => {
  beforeEach(() => {
    clearCustomSchemaHandlers();
  });

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