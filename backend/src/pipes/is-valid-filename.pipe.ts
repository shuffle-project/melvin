import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Types } from 'mongoose';
import { CustomValidationException } from '../utils/exceptions';

@Injectable()
export class IsValidFilenamePipe implements PipeTransform<string> {
  public transform(value: any, metadata: ArgumentMetadata): string {
    const [base, ext] = value.split('.');
    const [mediaId, resolution] = base.split('_');

    const isValid = Types.ObjectId.isValid(mediaId);

    if (!isValid) {
      const error = new ValidationError();

      error.property = `${metadata.data ?? 'param'}`;
      error.value = value;
      error.constraints = {
        invalid: `value must have a valid mongoid`,
      };

      throw new CustomValidationException([error]);
    } else if (!ext) {
      const error = new ValidationError();

      error.property = `${metadata.data ?? 'param'}`;
      error.value = value;
      error.constraints = {
        invalid: `value must have an extension`,
      };

      throw new CustomValidationException([error]);
    }

    return value;
  }
}
