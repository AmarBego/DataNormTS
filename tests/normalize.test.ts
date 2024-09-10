import { normalize, safeNormalize, NormalizationError } from '../src/normalize';
import { Schema, ObjectSchemaEntity, ArraySchemaEntity, PrimitiveSchemaEntity, CustomSchemaEntity } from '../src/types';
import { registerCustomSchemaHandler } from '../src/types';
import { logger } from '../src/logger';

jest.mock('../src/logger');

describe('normalize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should normalize valid object data correctly', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
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

    expect(normalize(data, schema)).toEqual(expected);
  });

  it('should throw an error for invalid schema', () => {
    const schema: any = 'invalid schema';
    const data = { id: '1' };
  
    expect(() => normalize(data, schema)).toThrow('Invalid schema');
  });

  it('should throw an error for missing id in object schema', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          name: { type: 'string' }
        }
      }
    };

    const data = { name: 'John Doe' };

    expect(() => normalize(data, schema)).toThrow('Entity must have an id field');
  });

  it('should handle custom schema type', () => {
    const customHandler = jest.fn().mockImplementation(() => 'custom-id');
    registerCustomSchemaHandler('customEntity', customHandler);

    const schema: Schema = {
      customEntity: {
        type: 'custom',
        name: 'customEntity'
      }
    };

    const data = { some: 'data' };

    const expected = {
      entities: {
        customEntity: {
          'custom-id': { some: 'data' }
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
            name: { type: 'string' }
          }
        }
      }
    };

    const data = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Doe' }
    ];

    const expected = {
      entities: {
        user: {
          '1': { id: '1', name: 'John Doe' },
          '2': { id: '2', name: 'Jane Doe' }
        }
      },
      result: ['1', '2']
    };

    expect(normalize(data, schema)).toEqual(expected);
  });

  it('should throw an error for unsupported schema type', () => {
    const schema: Schema = {
      unsupported: {
        type: 'unsupported' as any,
        name: 'unsupported'
      }
    };

    const data = { id: '1' };

    expect(() => normalize(data, schema)).toThrow('Unsupported schema type');
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
});