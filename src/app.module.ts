import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configValidation from './config/env/config-validation';
import baseConfig from './config/env/base-config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { AuthModule } from './http/auth/auth.module';
import { User } from './http/auth/entities/user.entity';
import * as path from 'path';
import { EmailModule } from './http/auth/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [baseConfig],
      validationSchema: configValidation,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('TYPEORM_HOST'),
        port: configService.get<number>('TYPEORM_PORT'),
        password: configService.get<string>('TYPEORM_PASSWORD'),
        username: configService.get<string>('TYPEORM_USERNAME'),
        entities: [User],
        database: configService.get<string>('TYPEORM_DATABASE'),
        synchronize: configService.get<boolean>('TYPEORM_SYNCHRONIZE'),
        logging: true,
      }),
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        console.log(
          123,
          configService.getOrThrow('APP_LANG'),
          path.join(__dirname, '/i18n/'),
        );
        return {
          fallbackLanguage: configService.getOrThrow('APP_LANG'),
          loaderOptions: {
            path: path.join(__dirname, '/i18n/'),
            watch: true,
          },
          typesOutputPath: path.join(
            __dirname,
            '../src/generated/i18n.generated.ts',
          ),
        };
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    EmailModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
