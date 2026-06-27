import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

export const ApiWorkspaceSlugParam = () =>
  applyDecorators(
    ApiParam({
      name: 'slug',
      description: 'Workspace slug',
      example: 'brij',
    }),
  );

export const ApiWorkspaceParams = () =>
  applyDecorators(
    ApiParam({
      name: 'apiPublicId',
      description: 'Api container public ID',
      example: 'api_Abc1DEF_2u',
    }),
    ApiParam({
      name: 'apiKeyPublicId',
      description: 'Api Key public ID',
      example: 'api_Bbc1DEF_2u',
    }),
    ApiWorkspaceSlugParam(),
  );
