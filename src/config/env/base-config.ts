import { registerAs } from '@nestjs/config';

export default registerAs('baseConfig', () => {
  return {
    app: {
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
      env: process.env.APP_ENV,
      url: process.env.APP_URL,
      port: process.env.PORT,
      lang: process.env.APP_LANG,
      langWatch: process.env.APP_LANG_WATCH,
    },
    logger: {
      buffer: process.env.BUFFER_LOG,
    },
    database: {
      host: process.env.TYPEORM_HOST,
      port: process.env.TYPEORM_PORT,
      user: process.env.TYPEORM_USERNAME,
      pass: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      maxPerPage: process.env.MAX_ITEMS_PER_PAGE,
    },
    typeorm: {
      entities: process.env.TYPEORM_ENTITIES,
      synchronize: process.env.TYPEORM_SYNCHRONIZE,
      migrations: process.env.TYPEORM_MIGRATIONS,
      migrations_dir: process.env.TYPEORM_MIGRATIONS_DIR,
      logging: process.env.TYPEORM_LOGGING,
    },
  };
});
