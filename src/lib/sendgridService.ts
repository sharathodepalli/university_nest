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
  private static fromEmail = import.meta.env.VITE_FROM_EMAIL || 'noreply@yourdomain.com';
  private static fromName = 'UniNest Team';

  /**
   * Send a generic email using SendGrid
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!import.meta.env.VITE_SENDGRID_API_KEY) {
        // Email simulation mode for development
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
        text: options.text || this.stripHtml(options.html),
        // Deliverability optimizations
        mail_settings: {
          spam_check: {
            enable: true,
            threshold: 1
          }
        },
        tracking_settings: {
          click_tracking: {
            enable: true,
            enable_text: false
          },
          open_tracking: {
            enable: true
          }
        },
        // Priority for fast delivery
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
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
                <strong>� Security Notice:</strong> If you didn't create this account, please ignore this email. Your security is our priority.
              </div>
              
              <p style="margin-top: 30px;">Questions? Reply to this email or contact <strong>support@yourdomain.com</strong></p>
            </div>
            <div class="footer">
              <p><strong>UniNest Team</strong> | Your trusted university housing platform</p>
              <p>This email was sent to <strong>${userEmail}</strong></p>
              <p>© 2024 UniNest. All rights reserved.</p>
            </div>
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

Need help? Contact contact@thetrueshades.com

© 2024 UniNest. All rights reserved.
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🎓 [ACTION REQUIRED] Verify Your UniNest Account - 15 Minutes Left',
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
            <p><strong>Contact:</strong> If you have questions, reach out to contact@thetrueshades.com</p>
            
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

Questions? Contact contact@thetrueshades.com

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
