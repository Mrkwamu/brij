import { Body, Controller, Post } from '@nestjs/common';
import { ApikeyService } from './apiKey.service';
import { createApiKeyDto } from './apikey.dto';

@Controller('api/apikey')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @Post('create')
  async createApikey(@Body() dto: createApiKeyDto) {
    const { apiKey } = await this.apikeyService.createApiKey(dto);

    return {
      message: 'Apikey created',
      apiKey,
    };
  }
}
