import { Types } from 'mongoose';
import { CustomInternalServerException } from './exceptions';

export const getObjectIdAsString = (value: any): string => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (value.hasOwnProperty('_id')) {
    return value._id.toString();
  }

  if (typeof value === 'string' || value instanceof String) {
    return value as string;
  }

  throw new CustomInternalServerException('cannot_convert_to_objectid_string', {
    value,
  });
};

export const isSameObjectId = (a: any, b: any): boolean => {
  return getObjectIdAsString(a) === getObjectIdAsString(b);
};
