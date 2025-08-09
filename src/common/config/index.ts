import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({
  path: path.resolve(process.cwd(), './.env'),
});
export default {
  port: process.env.PORT,
  redis: {
    url: process.env.REDIS_URL,
    port: process.env.REDIS_PORT || '',
    host: process.env.REDIS_HOST || '',
    password: process.env.ENV === 'dev' ? '' : process.env.REDIS_PASSWORD,
  },
  db: {
    url: process.env.DB_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'helo_secret.tech',
    longExpiration: process.env.JWT_EXPIRES_IN_LONG,
    shortExpiration: process.env.JWT_EXPIRES_IN_SHORT,
  },
  baseUrl: process.env.BASE_URL,
  env: process.env.ENV,
  zoho: {
    host: process.env.SMTP_HOST || 'smtp.zeptomail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM_EMAIL,
    url: process.env.ZOHO_URL,
    token: process.env.ZOHO_TOKEN,
  },
  frontEnd: process.env.FRONTEND_URL,
  push_provider: process.env.PUSH_PROVIDER,
  algo: process.env.ALGORITHM || '',
  iv_length: Number(process.env.IV_LENGTH) || 12,
  key_length: Number(process.env.KEY_LENGTH) || 32,
  algo_secret: process.env.DEFAULT_SECRET || '',
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    callback_url: process.env.GOOGLE_CALLBACK_URL || '',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME || 'jump-media',
  },
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  },
};
