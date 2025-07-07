import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (import.meta.env.VITE_SENDGRID_API_KEY) {
  sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);
}

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

export class SendGridService {
  private static fromEmail = import.meta.env.VITE_FROM_EMAIL || 'noreply@uninest.com';
  private static fromName = 'UniNest Verification';

  /**
   * Send a generic email using SendGrid
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!import.meta.env.VITE_SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured. Email simulation mode.');
        console.log('📧 SIMULATED EMAIL:', {
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        });
        return true;
      }

      const msg = {
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid to:', options.to);
      return true;
    } catch (error) {
      console.error('❌ SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Send verification email for university email verification
   */
  static async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    const { userEmail, verificationUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your University Email - UniNest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #5a6fd8; }
          .token-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 16px; text-align: center; color: #495057; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 UniNest</h1>
            <p>Verify Your University Email</p>
          </div>
          <div class="content">
            <h2>Welcome to UniNest!</h2>
            <p>Thank you for registering with UniNest. To complete your university verification and access our platform, please verify your university email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <div class="token-box">${verificationUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Security Note:</strong> This verification link will expire in 24 hours for security reasons. If you didn't request this verification, please ignore this email.
            </div>
            
            <h3>What happens next?</h3>
            <ul>
              <li>✅ Click the verification link above</li>
              <li>🎓 Your university email will be verified</li>
              <li>🏠 You'll gain access to browse and post listings</li>
              <li>💬 Connect with verified students at your university</li>
            </ul>
            
            <p>Need help? Contact our support team at support@uninest.com</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${userEmail}</p>
            <p>© 2024 UniNest. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
UniNest - Verify Your University Email

Welcome to UniNest! Please verify your university email address to complete your registration.

Verification Link: ${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't request this verification, please ignore this email.

Need help? Contact support@uninest.com

© 2024 UniNest. All rights reserved.
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Verify Your University Email - UniNest',
      html,
      text
    });
  }

  /**
   * Send notification email when document verification is submitted
   */
  static async sendDocumentSubmissionEmail(userEmail: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Verification Submitted - UniNest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .info-box { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; padding: 15px; margin: 20px 0; color: #0d47a1; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 UniNest</h1>
            <p>Document Verification Submitted</p>
          </div>
          <div class="content">
            <h2>Thank you for submitting your documents!</h2>
            <p>We've received your university verification documents and they are now under review.</p>
            
            <div class="info-box">
              <strong>📋 What's Next:</strong>
              <ul>
                <li>Our team will review your documents within 2-3 business days</li>
                <li>We'll send you an email notification once the review is complete</li>
                <li>If approved, you'll gain full access to UniNest</li>
                <li>If additional information is needed, we'll contact you</li>
              </ul>
            </div>
            
            <p><strong>Review Timeline:</strong> 2-3 business days</p>
            <p><strong>Contact:</strong> If you have questions, reach out to verification@uninest.com</p>
            
            <p>Thank you for your patience!</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${userEmail}</p>
            <p>© 2024 UniNest. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
UniNest - Document Verification Submitted

Thank you for submitting your university verification documents!

Your documents are now under review and we'll notify you within 2-3 business days.

What's Next:
- Our team will review your documents within 2-3 business days
- We'll send you an email notification once the review is complete
- If approved, you'll gain full access to UniNest
- If additional information is needed, we'll contact you

Questions? Contact verification@uninest.com

© 2024 UniNest. All rights reserved.
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Document Verification Submitted - UniNest',
      html,
      text
    });
  }

  /**
   * Utility function to strip HTML tags for text version
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Test SendGrid configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!import.meta.env.VITE_SENDGRID_API_KEY) {
        console.log('⚠️ SendGrid API key not configured - running in simulation mode');
        return true;
      }

      // Send a test email to verify configuration
      const testEmail = import.meta.env.VITE_TEST_EMAIL || 'test@example.com';
      return await this.sendEmail({
        to: testEmail,
        subject: 'SendGrid Test - UniNest',
        html: '<h1>SendGrid Test</h1><p>If you receive this email, SendGrid is configured correctly!</p>',
        text: 'SendGrid Test - If you receive this email, SendGrid is configured correctly!'
      });
    } catch (error) {
      console.error('❌ SendGrid test failed:', error);
      return false;
    }
  }
}

export default SendGridService;
