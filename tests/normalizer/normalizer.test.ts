import { normalize } from '../../src/normalizers/normalizer';
import { Schema, NormalizedData, clearCustomSchemaHandlers } from '../../src/types';
import { NormalizationError } from '../../src/errors';

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

    const expected: NormalizedData = {
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

    const expected: NormalizedData = {
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
});