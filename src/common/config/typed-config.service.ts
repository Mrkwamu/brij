// // src/common/config/typed-config.service.ts
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { StringValue } from 'ms';

// export interface EnvConfig {
//   ACCESS_TOKEN_SECRET: string;
//   REFRESH_TOKEN_SECRET: string;
//   ACCESS_EXPIRY: StringValue;
//   REFRESH_EXPIRY: StringValue;
//   APP_NAME: string;
//   NODE_ENV: string;
// }

// @Injectable()
// export class TypedConfigService {
//   constructor(private readonly config: ConfigService) {}

//   get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
//     return this.config.getOrThrow<EnvConfig[K]>(key);
//   }
// }
