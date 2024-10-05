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

  it('should handle deeply nested structures', () => {
    const schema: Schema = {
      company: {
        type: 'object',
        name: 'company',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          departments: {
            type: 'array',
            items: {
              type: 'object',
              name: 'department',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                employees: {
                  type: 'array',
                  items: {
                    type: 'object',
                    name: 'employee',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      position: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const originalData = {
      id: 'c1',
      name: 'Acme Corp',
      departments: [
        {
          id: 'd1',
          name: 'HR',
          employees: [
            { id: 'e1', name: 'Alice', position: 'Manager' },
            { id: 'e2', name: 'Bob', position: 'Assistant' }
          ]
        },
        {
          id: 'd2',
          name: 'Engineering',
          employees: [
            { id: 'e3', name: 'Charlie', position: 'Developer' },
            { id: 'e4', name: 'David', position: 'Designer' }
          ]
        }
      ]
    };

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);

    expect(denormalizedData).toEqual(originalData);
  });

  it('should handle circular references', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        name: 'user',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          friends: {
            type: 'array',
            items: {
              type: 'object',
              name: 'user',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                friends: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    };
  
    interface User {
        id: string;
        name: string;
        friends: Array<User | string>;
      }
      
      const originalData: User = {
        id: '1',
        name: 'John',
        friends: [
          { id: '2', name: 'Jane', friends: [] },
          { id: '3', name: 'Bob', friends: [] }
        ]
      };
      
      // Create circular references
      (originalData.friends[0] as User).friends.push(originalData.id);
      (originalData.friends[1] as User).friends.push(originalData.id);
      
      const normalizedData = normalize(originalData, schema);
      const denormalizedData = denormalize(normalizedData, schema) as User;
      
      expect(denormalizedData).toEqual(originalData);
      expect((denormalizedData.friends[0] as User).friends[0]).toBe(denormalizedData.id);
      expect((denormalizedData.friends[1] as User).friends[0]).toBe(denormalizedData.id);
  });

  it('should handle arrays of primitive values', () => {
    const schema: Schema = {
      tags: {
        type: 'array',
        items: { type: 'string' }
      }
    };

    const originalData = ['tag1', 'tag2', 'tag3'];

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);

    expect(denormalizedData).toEqual(originalData);
  });

  it('should handle objects with array of objects', () => {
    const schema: Schema = {
      playlist: {
        type: 'object',
        name: 'playlist',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          songs: {
            type: 'array',
            items: {
              type: 'object',
              name: 'song',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                artist: { type: 'string' }
              }
            }
          }
        }
      }
    };

    const originalData = {
      id: 'p1',
      name: 'My Playlist',
      songs: [
        { id: 's1', title: 'Song 1', artist: 'Artist 1' },
        { id: 's2', title: 'Song 2', artist: 'Artist 2' }
      ]
    };

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);

    expect(denormalizedData).toEqual(originalData);
  });

  it('should handle empty arrays and objects', () => {
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
          },
          settings: {
            type: 'object',
            properties: {}
          }
        }
      }
    };

    const originalData = {
      id: '1',
      name: 'John Doe',
      posts: [],
      settings: {}
    };

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);

    expect(denormalizedData).toEqual(originalData);
  });

  it('should throw DenormalizationError for invalid schema', () => {
    const schema: Schema = {} as any;
    const normalizedData: NormalizedData = { entities: {}, result: '1' };

    expect(() => denormalize(normalizedData, schema)).toThrow('Empty schema provided');
  });

  it('should throw DenormalizationError for missing entities', () => {
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

    const normalizedData: NormalizedData = {
      entities: {},
      result: '1'
    };

    expect(() => denormalize(normalizedData, schema)).toThrow('No entities found for type: user');
  });

  it('should throw DenormalizationError for missing entity', () => {
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

    const normalizedData: NormalizedData = {
      entities: {
        user: {}
      },
      result: '1'
    };

    expect(() => denormalize(normalizedData, schema)).toThrow('Entity not found: user:1');
  });
});