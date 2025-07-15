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
      console.log('🚀 Calling Edge Function send-verification-email-v3 with:', {
        userId: data.userId,
        email: data.userEmail,
        hasToken: !!data.verificationToken
      });

      // Debug: Check Supabase configuration
      const supabaseUrlFromEnv = import.meta.env.VITE_SUPABASE_URL;
      console.log('🔍 Supabase client check:', {
        supabaseUrl: supabaseUrlFromEnv,
        functionsUrl: `${supabaseUrlFromEnv}/functions/v1/send-verification-email-v3`
      });

      // Call Supabase Edge Function for email sending
      const { data: result, error } = await supabase.functions.invoke('send-verification-email-v3', {
        body: {
          userId: data.userId, // Use the actual userId passed from verification service
          email: data.userEmail,
          verificationToken: data.verificationToken
        }
      });

      console.log('📧 Edge Function response:', { result, error });

      if (error) {
        console.error('❌ Edge Function error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      // Handle string responses that might need parsing
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
          console.log('📧 Parsed result:', parsedResult);
        } catch (parseError) {
          console.error('❌ Failed to parse result as JSON:', result);
          return false;
        }
      }

      if (parsedResult?.success) {
        console.log('✅ Verification email sent successfully');
        console.log('📧 Email details:', {
          message: parsedResult.message,
          tokenId: parsedResult.tokenId,
          note: parsedResult.note
        });
        return true;
      } else {
        console.error('❌ Edge Function returned error:', {
          result: parsedResult,
          message: parsedResult?.message,
          error: parsedResult?.error
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Email service error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  async sendEmail(_options: EmailOptions): Promise<boolean> {
    // For now, this is a placeholder. You can extend the edge function
    // to handle generic email sending if needed
    console.log('📧 Generic email sending not implemented yet');
    return false;
  }
}

// Export singleton instance
export const emailService = new ClientEmailService();
export default emailService;
