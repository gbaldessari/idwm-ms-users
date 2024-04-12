import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'staging', 'production')
    .required(),
  APP_ENV: Joi.string()
    .valid('local', 'development', 'staging', 'production')
    .required(),
  APP_NAME: Joi.string().required(),
  APP_VERSION: Joi.number().min(1.0).required(),
  APP_URL: Joi.string().required(),
  APP_PORT: Joi.number().required(),
  APP_LANG: Joi.string().required(),
  APP_LANG_WATCH: Joi.bool().required(),
  BUFFER_LOG: Joi.bool().required(),
  TYPEORM_HOST: Joi.string(),
  TYPEORM_PORT: Joi.number().integer(),
  TYPEORM_USERNAME: Joi.string(),
  TYPEORM_PASSWORD: Joi.string().min(8),
  TYPEORM_DATABASE: Joi.string(),
  TYPEORM_ENTITIES: Joi.string(),
  TYPEORM_SYNCHRONIZE: Joi.string(),
  TYPEORM_LOGGING: Joi.boolean(),
});
