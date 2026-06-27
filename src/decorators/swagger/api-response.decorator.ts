import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const ApiSuccess = (
  status: 'ok' | 'created',
  description: string,
  dto: Type<unknown>,
) =>
  status === 'created'
    ? ApiCreatedResponse({
        description,
        type: dto,
      })
    : ApiOkResponse({
        description,
        type: dto,
      });

export const ApiCommonErrors = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: 'Validation failed',
    }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

export const ApiProtectedErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Invalid or missing credentials' }),
    ApiCommonErrors(),
  );

export const ApiConflict = (message: string) =>
  ApiConflictResponse({
    description: message,
  });

export const ApiNotFound = (resource: string) =>
  ApiNotFoundResponse({
    description: `${resource} not found`,
  });
