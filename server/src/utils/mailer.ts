import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let testTransporter: nodemailer.Transporter | null = null;

/**
 * Get or initialize Nodemailer Ethereal SMTP transporter.
 */
export async function getEtherealTransporter(): Promise<nodemailer.Transporter> {
  if (testTransporter) {
    return testTransporter;
  }

  // Create an Ethereal test account if credentials are default/missing
  if (
    !process.env.SMTP_USER ||
    process.env.SMTP_USER === 'ethereal_user' ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_PASS === 'ethereal_password'
  ) {
    console.log('🔄 Creating new Ethereal SMTP test account...');
    const testAccount = await nodemailer.createTestAccount();

    testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(`📧 Ethereal SMTP initialized for: ${testAccount.user}`);
    return testTransporter;
  }

  // Use specified Ethereal SMTP credentials from environment
  testTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return testTransporter;
}

export interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendMailResult {
  messageId: string;
  previewUrl: string | false;
}

/**
 * Send an email via Ethereal SMTP and return the message ID & preview URL.
 */
export async function sendMailViaEthereal(options: SendMailOptions): Promise<SendMailResult> {
  const transporter = await getEtherealTransporter();

  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
