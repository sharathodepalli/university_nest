// Client-safe email service interface
// This file can be imported by client-side code without causing issues

import { supabase } from './supabase';

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
  userId?: string; // Add userId parameter
}

// Client-side safe email service that calls Supabase Edge Functions
export class ClientEmailService implements EmailServiceInterface {
  
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      // Call Supabase Edge Function for email sending
      const { data: result, error } = await supabase.functions.invoke('send-verification-email-v3', {
        body: {
          userId: data.userId, // Use the actual userId passed from verification service
          email: data.userEmail,
          verificationToken: data.verificationToken
        }
      });

      if (error) {
        return false;
      }

      // Handle string responses that might need parsing
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (parseError) {
          return false;
        }
      }

      if (parsedResult?.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async sendEmail(_options: EmailOptions): Promise<boolean> {
    // For now, this is a placeholder. You can extend the edge function
    // to handle generic email sending if needed
    return false;
  }
}

// Export singleton instance
export const emailService = new ClientEmailService();
export default emailService;
