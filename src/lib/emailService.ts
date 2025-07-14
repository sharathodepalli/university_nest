// Client-safe email service interface
// This file can be imported by client-side code without causing issues

export interface EmailServiceInterface {
  sendVerificationEmail(data: VerificationEmailData): Promise<boolean>;
  sendEmail(options: EmailOptions): Promise<boolean>;
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

// Client-side safe email service
export class ClientEmailService implements EmailServiceInterface {
  
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    // In browser environment, simulate email sending
    if (typeof window !== 'undefined') {
      if (import.meta.env.DEV) {
        console.log('📧 [CLIENT DEV] Simulating verification email send');
        console.log('📧 [CLIENT DEV] To:', data.userEmail);
        console.log('📧 [CLIENT DEV] Verification URL:', data.verificationUrl);
        console.log('📧 [CLIENT DEV] In production, this would call a server API endpoint');
      }
      
      // In production, you would call a server API endpoint:
      // return await fetch('/api/send-verification-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // }).then(r => r.ok);
      
      return true; // Simulate success for now
    }
    
    // Server-side: This shouldn't happen in our current architecture
    // since we're building a client-side app for Vercel static hosting
    console.error('❌ Server-side email service called in client-only build');
    return false;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (typeof window !== 'undefined') {
      if (import.meta.env.DEV) {
        console.log('📧 [CLIENT DEV] Simulating email send');
        console.log('📧 [CLIENT DEV] To:', options.to);
        console.log('📧 [CLIENT DEV] Subject:', options.subject);
      }
      return true; // Simulate success
    }
    
    console.error('❌ Server-side email service called in client-only build');
    return false;
  }
}

// Export singleton instance
export const emailService = new ClientEmailService();
export default emailService;
