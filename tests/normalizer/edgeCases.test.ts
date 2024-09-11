import { normalize } from '../../src/normalizers/normalizer';
import { Schema, clearCustomSchemaHandlers, registerCustomSchemaHandler } from '../../src/types';
import { NormalizationError } from '../../src/errors';
import { logger } from '../../src/logger';
describe('normalize edge cases', () => {
  beforeEach(() => {
    clearCustomSchemaHandlers();
    logger.setSilent(true);
  });

  afterEach(() => {
    logger.setSilent(false);
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

  describe('normalize edge cases with invalid custom handlers', () => {
    beforeEach(() => {
      clearCustomSchemaHandlers();
    });
  
    it('should handle invalid custom handler for non-array input', () => {
      const invalidSingleHandler = jest.fn().mockReturnValue({ notAnEntityID: true });
      registerCustomSchemaHandler('invalidSingleCustom', invalidSingleHandler);
  
      const singleSchema: Schema = {
        custom: {
          type: 'custom',
          name: 'invalidSingleCustom'
        }
      };
  
      const singleData = { id: 'test' };
  
      expect(() => normalize(singleData, singleSchema)).toThrow(NormalizationError);
      expect(() => normalize(singleData, singleSchema)).toThrow('Custom handler must return an EntityID for non-array input');
      expect(invalidSingleHandler).toHaveBeenCalled();
    });
  
    it('should handle invalid custom handler for array input', () => {
      const invalidArrayHandler = jest.fn().mockReturnValue(['not', 'an', 'array', 'of', 'EntityIDs']);
      registerCustomSchemaHandler('invalidArrayCustom', invalidArrayHandler);
  
      const arraySchema: Schema = {
        custom: {
          type: 'custom',
          name: 'invalidArrayCustom'
        }
      };
  
      const arrayData = [{ id: 'test1' }, { id: 'test2' }];
  
      expect(() => normalize(arrayData, arraySchema)).toThrow(NormalizationError);
      expect(() => normalize(arrayData, arraySchema)).toThrow('Custom handler must return an array of EntityIDs for array input');
      expect(invalidArrayHandler).toHaveBeenCalled();
    });
  });
});