import { HttpException, HttpStatus } from '@nestjs/common';

export const throwHttpException = (
  httpStatus: HttpStatus,
  message?: string,
  errors?: Record<string, unknown>,
) => {
  console.log({ message, errors });
  throw new HttpException({ message, errors }, httpStatus);
};
