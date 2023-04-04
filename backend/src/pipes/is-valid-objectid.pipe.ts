import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Types } from 'mongoose';
import { CustomValidationException } from '../utils/exceptions';

@Injectable()
export class IsValidObjectIdPipe implements PipeTransform<string> {
  public transform(value: any, metadata: ArgumentMetadata): string {
    const isValid = Types.ObjectId.isValid(value);

    if (isValid) {
      return value;
    }

    const error = new ValidationError();

    error.property = `${metadata.data ?? 'param'}`;
    error.value = value;
    error.constraints = {
      invalid: `value must be a mongoid`,
    };

    throw new CustomValidationException([error]);
  }
}
