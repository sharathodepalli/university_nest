import nodemailer from 'nodemailer';
import { errorHandler } from './errorHandler';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  userEmail: string;
  verificationToken: string;
  verificationUrl: string;
}

export class Office365EmailService {
  private static fromEmail = process.env.SMTP_USER || 'noreply@uninest.us';
  private static fromName = 'UniNest Team';
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Check if we're running in a server environment
   */
  private static isServerEnvironment(): boolean {
    return typeof window === 'undefined' && typeof process !== 'undefined';
  }

  /**
   * Initialize the SMTP transporter with Office 365 settings
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.isServerEnvironment()) {
      throw new Error('Office365EmailService can only be used in server-side environments');
    }

    if (!this.transporter) {
      // Validate required environment variables
      const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required SMTP environment variables: ${missingVars.join(', ')}`);
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, // smtp.office365.com
        port: Number(process.env.SMTP_PORT), // 587
        secure: process.env.SMTP_SECURE === 'true', // false for STARTTLS
        auth: {
          user: process.env.SMTP_USER, // noreply@uninest.us
          pass: process.env.SMTP_PASS, // Office 365 password or app password
        },
        // Office 365 specific settings
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        // Connection timeout and retry settings
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });

      console.log('✅ Office 365 SMTP transporter initialized');
    }

    // At this point, transporter is guaranteed to be non-null
    return this.transporter as nodemailer.Transporter;
  }

  /**
   * Send a generic email using Office 365 SMTP
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isServerEnvironment()) {
      console.error('❌ Office365EmailService attempted to run in browser environment');
      return false;
    }

    try {
      // In development mode without SMTP credentials, simulate email sending
      if (import.meta.env.DEV && !process.env.SMTP_USER) {
        console.log('📧 [DEV MODE] Simulating email send to:', options.to);
        console.log('📧 [DEV MODE] Subject:', options.subject);
        console.log('📧 [DEV MODE] SMTP not configured, email simulation successful');
        return true;
      }

      const transporter = this.getTransporter();

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        // Email headers for better deliverability
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'UniNest Platform',
          'Return-Path': this.fromEmail,
        },
      };

      const result = await transporter.sendMail(mailOptions);
      
      // Log success only in development
      if (import.meta.env.DEV) {
        console.log('✅ Email sent successfully via Office 365 SMTP to:', options.to);
        console.log('📧 Message ID:', result.messageId);
      }
      
      return true;

    } catch (error) {
      console.error('❌ Office 365 SMTP email error:', error);
      errorHandler.logError(new Error(`SMTP Email failed: ${error}`));
      return false;
    }
  }

  /**
   * Send verification email for university email verification
   */
  static async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    if (!this.isServerEnvironment()) {
      console.error('❌ Office365EmailService.sendVerificationEmail attempted to run in browser environment');
      return false;
    }

    const { userEmail, verificationUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎓 Verify Your UniNest Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .urgent-banner { background: linear-gradient(90deg, #ff6b6b, #feca57); color: white; padding: 15px; text-align: center; font-weight: bold; margin-bottom: 30px; border-radius: 8px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; }
          .verification-code { background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0; font-family: 'Courier New', monospace; font-size: 18px; text-align: center; color: #333; letter-spacing: 2px; }
          .timer { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .benefits { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .benefits ul { margin: 10px 0; padding-left: 20px; }
          .benefits li { margin: 8px 0; color: #1976d2; }
          .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 14px; }
          .security-note { background: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; padding: 15px; margin: 20px 0; color: #c62828; }
          @media (max-width: 600px) { .container { padding: 10px; } .content { padding: 25px 20px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>🏠 UniNest</h1>
              <p>Your University Housing Platform</p>
            </div>
            <div class="content">
              <div class="urgent-banner">
                ⚡ ACTION REQUIRED: Verify your account now!
              </div>
              
              <h2 style="color: #333; margin-top: 0;">Welcome to UniNest! 🎉</h2>
              <p style="font-size: 16px; color: #555;">You're just one click away from accessing the best university housing platform. <strong>Verify your email to get started:</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="cta-button">✅ Verify My Email Now</a>
              </div>
              
              <div class="timer">
                <strong>⏰ Time Sensitive:</strong> This verification link expires in <strong>15 minutes</strong> for your security.
              </div>
              
              <div class="benefits">
                <h3 style="margin-top: 0; color: #1976d2;">🚀 What you'll get access to:</h3>
                <ul>
                  <li><strong>🏠 Premium Listings</strong> - Find verified university housing</li>
                  <li><strong>🎓 Student Network</strong> - Connect with verified classmates</li>
                  <li><strong>💬 Direct Messaging</strong> - Chat safely with other students</li>
                  <li><strong>🔒 Verified Community</strong> - University-only verified users</li>
                </ul>
              </div>
              
              <p><strong>Can't click the button?</strong> Copy and paste this link:</p>
              <div class="verification-code">${verificationUrl}</div>
              
              <div class="security-note">
                <strong>🔒 Security Notice:</strong> If you didn't create this account, please ignore this email. Your security is our priority.
              </div>
              
              <p style="margin-top: 30px;">Questions? Reply to this email or contact <strong>support@uninest.us</strong></p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px;">
                <p style="margin: 0;"><strong>Why am I receiving this?</strong> You recently created an account on UniNest using this email address.</p>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">© 2025 UniNest - University Housing Made Simple</p>
              <p style="margin: 5px 0 0 0;">
                <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
                <a href="#" style="color: #667eea; text-decoration: none;">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textVersion = `
Welcome to UniNest! 🎉

You're just one click away from accessing the best university housing platform. 
Verify your email to get started: ${verificationUrl}

⏰ Time Sensitive: This verification link expires in 15 minutes for your security.

🚀 What you'll get access to:
• 🏠 Premium Listings - Find verified university housing
• 🎓 Student Network - Connect with verified classmates  
• 💬 Direct Messaging - Chat safely with other students
• 🔒 Verified Community - University-only verified users

Questions? Reply to this email or contact support@uninest.us

🔒 Security Notice: If you didn't create this account, please ignore this email.

© 2025 UniNest - University Housing Made Simple
    `.trim();

    try {
      const success = await this.sendEmail({
        to: userEmail,
        subject: '🎓 Verify Your UniNest Account - Action Required',
        html,
        text: textVersion,
      });

      if (success) {
        // Log success only in development
        if (import.meta.env.DEV) {
          console.log('✅ Verification email sent successfully to:', userEmail);
        }
      } else {
        console.error('❌ Failed to send verification email to:', userEmail);
      }

      return success;
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      errorHandler.logError(new Error(`Verification email failed: ${error}`));
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(userEmail: string, resetUrl: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>🔑 Reset Your UniNest Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }
          .timer { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .security-note { background: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; padding: 15px; margin: 20px 0; color: #c62828; }
          .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>🔑 Password Reset</h1>
              <p>UniNest Account Security</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p style="font-size: 16px; color: #555;">Someone requested a password reset for your UniNest account. Click the button below to set a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="cta-button">🔑 Reset My Password</a>
              </div>
              
              <div class="timer">
                <strong>⏰ Time Sensitive:</strong> This reset link expires in <strong>1 hour</strong> for your security.
              </div>
              
              <p><strong>Can't click the button?</strong> Copy and paste this link:</p>
              <div style="background: #f8f9fa; border: 2px solid #ff6b6b; border-radius: 8px; padding: 15px; font-family: monospace; word-break: break-all;">
                ${resetUrl}
              </div>
              
              <div class="security-note">
                <strong>🔒 Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">© 2025 UniNest - University Housing Made Simple</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔑 Reset Your UniNest Password',
      html,
      text: `Reset your UniNest password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour for your security.\n\nIf you didn't request this, please ignore this email.`,
    });
  }

  /**
   * Strip HTML tags from string for plain text version
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Test SMTP connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      
      // Log success only in development
      if (import.meta.env.DEV) {
        console.log('✅ Office 365 SMTP connection test successful');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Office 365 SMTP connection test failed:', error);
      return false;
    }
  }
}

// Export for backward compatibility
export { Office365EmailService as EmailService };
export default Office365EmailService;
