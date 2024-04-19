import * as nodemailer from 'nodemailer';
import * as nodemailerMailgunTransport from 'nodemailer-mailgun-transport';
import * as dotenv from 'dotenv';

dotenv.config();

const mailgunOptions = {
  auth: {
    api_key: process.env.MAILGUN_ACTIVE_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || '',
  },
};

const transport = nodemailerMailgunTransport(mailgunOptions);

export class EmailService {
  private emailClient: nodemailer.Transporter;

  constructor() {
    this.emailClient = nodemailer.createTransport(transport);
  }

  sendText(to: string, subject: string, text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.emailClient.sendMail(
        {
          from: '"MarcApp" <postmaster@sandboxe9d7672a884f4c6bbd740cd8dab7e513.mailgun.org>',
          to,
          subject,
          text,
        },
        (err, info) => {
          if (err) {
            reject(err);
          } else {
            resolve(info);
          }
        },
      );
    });
  }
}
