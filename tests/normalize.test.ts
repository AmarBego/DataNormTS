// tests/normalize.test.ts
import { normalize, safeNormalize, NormalizationError } from '../src/normalize';
import { Schema, ObjectSchemaEntity, ArraySchemaEntity, PrimitiveSchemaEntity, CustomSchemaEntity } from '../src/types';
import { getCustomSchemaHandler } from '../src/types'; // Correct import path
import { logger } from '../src/logger'; // Ensure logger is correctly imported if used

describe('normalize', () => {
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
    const schema: any = 'invalid schema'; // Ensure this is an invalid schema
    const data = { id: '1' };

    expect(() => normalize(data, schema)).toThrow('Invalid schema');
  });

  it('should throw an error for missing id in object schema', () => {
    const schema: ObjectSchemaEntity = {
      type: 'object',
      name: 'user',
      properties: {
        name: { type: 'string' }
      },
      required: ['id']
    };

    const data = { name: 'John Doe' };

    expect(() => normalize(data, schema as any)).toThrow('Entity must have an id field');
  });

  it('should handle custom schema type', () => {
    const customHandler = jest.fn().mockImplementation((entity: unknown, schema: CustomSchemaEntity, entities: any) => 'custom-id');
    (getCustomSchemaHandler as jest.Mock).mockReturnValue(customHandler);

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

    expect(normalize(data, schema)).toEqual(expected);
    expect(customHandler).toHaveBeenCalledWith(data, schema.customEntity, {});
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
        type: 'unsupported' as any, // Force type to trigger error
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
