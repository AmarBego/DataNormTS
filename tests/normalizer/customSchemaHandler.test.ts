import { normalize } from '../../src/normalizers/normalizer';
import { Schema, NormalizedData, registerCustomSchemaHandler, clearCustomSchemaHandlers } from '../../src/types';

describe('custom schema handlers', () => {
  beforeEach(() => {
    clearCustomSchemaHandlers();
  });

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

    const expected: NormalizedData = {
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
  
    const expected: NormalizedData = {
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