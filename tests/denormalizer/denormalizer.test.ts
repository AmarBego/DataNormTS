import { normalize, denormalize } from '../../src';
import { Schema, NormalizedData } from '../../src/types';

describe('denormalize', () => {
  it('should correctly denormalize a simple object', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          age: { type: 'number' }
        }
      }
    };

    const originalData = {
      id: '1',
      name: 'John Doe',
      age: 30
    };

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);

    expect(denormalizedData).toEqual(originalData);
  });

  it('should correctly denormalize nested objects and arrays', () => {
    const schema: Schema = {
      user: {
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
    };

    const originalData = {
      id: '1',
      name: 'John Doe',
      posts: [
        { id: 'p1', title: 'Post 1' },
        { id: 'p2', title: 'Post 2' }
      ]
    };

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);

    expect(denormalizedData).toEqual(originalData);
  });
});