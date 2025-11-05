import { Types } from 'mongoose';

export const serialize = (value: any, objects: any[] = [], depth = 10): any => {
  if (objects.includes(value)) {
    return '[Circular]';
  }

  if (depth === 0) {
    return '[Maximum depth reached]';
  }

  if (value === undefined || value === null) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    objects.push(value);
    const ret = {};
    Object.getOwnPropertyNames(value).forEach((key: string) => {
      if (key === 'stack') {
        ret[key] = value[key].split(/\n +/);
      } else {
        ret[key] = serialize(value[key], objects, depth - 1);
      }
    });
    return ret;
  }

  if (Array.isArray(value)) {
    objects.push(value);
    return value.map((v) => serialize(v, objects, depth - 1));
  }

  switch (typeof value) {
    case 'function':
      return '[Function]';
    case 'symbol':
      return '[Symbol]';
    case 'boolean':
    case 'string':
    case 'number':
    case 'undefined':
      return value;
    case 'object': {
      if (value instanceof Types.ObjectId) {
        return value.toString();
      }

      objects.push(value);
      const ret = {};
      Object.keys(value).map((key) => {
        ret[key] = serialize(value[key], objects, depth - 1);
      });
      return ret;
    }
  }
};
