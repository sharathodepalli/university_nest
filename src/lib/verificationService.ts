import { supabase } from './supabase';

export interface VerificationRequest {
  id: string;
  userId: string;
  email: string;
  token: string;
  status: 'pending' | 'verified' | 'expired' | 'failed';
  expiresAt: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  data?: any;
}

class VerificationService {
  private readonly CACHE_PREFIX = 'uninest_verification_';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Request email verification for a student email
   */
  async requestEmailVerification(
    userId: string,
    email: string,
    studentName?: string
  ): Promise<VerificationResult> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Invalid email format'
        };
      }

      // Validate .edu domain
      if (!this.isEduEmail(email)) {
        return {
          success: false,
          message: 'Please use your official university email address (.edu domain)'
        };
      }

      // Generate verification token
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Insert verification record into database
      const { data: verification, error: dbError } = await supabase
        .from('email_verifications')
        .insert({
          user_id: userId,
          email: email.toLowerCase().trim(),
          token,
          verification_type: 'student_email',
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          metadata: { studentName }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return {
          success: false,
          message: 'Failed to create verification request'
        };
      }

      // Send verification email via Edge Function
      const emailResult = await this.sendVerificationEmail(email, token, studentName);
      
      if (!emailResult.success) {
        // Clean up database record if email failed
        await supabase
          .from('email_verifications')
          .update({ status: 'failed' })
          .eq('id', verification.id);

        return emailResult;
      }

      // Cache verification data for quick access
      this.cacheVerificationData(userId, verification);

      return {
        success: true,
        message: `Verification email sent to ${email}. Please check your inbox and click the verification link.`,
        data: {
          id: verification.id,
          email,
          expiresAt: expiresAt.toISOString()
        }
      };

    } catch (error) {
      console.error('Verification request error:', error);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      };
    }
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token: string): Promise<VerificationResult> {
    try {
      console.log(`[VerificationService] Calling verify_email_token with token: ${token}`);
      
      // Call database function to verify token
      const { data, error } = await supabase
        .rpc('verify_email_token', { token_input: token });

      console.log(`[VerificationService] Database response:`, { data, error });

      if (error) {
        console.error('Token verification database error:', error);
        return {
          success: false,
          message: `Database error: ${error.message || 'Unknown error'}`
        };
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid verification response - no data returned');
        return {
          success: false,
          message: 'Invalid verification response from database'
        };
      }

      const result = data[0];
      console.log(`[VerificationService] Parsed result:`, result);
      
      if (!result) {
        return {
          success: false,
          message: 'No verification result returned'
        };
      }

      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Invalid or expired verification token'
        };
      }

      // Clear cached data
      this.clearVerificationCache(result.user_id);

      return {
        success: true,
        message: result.message || 'Email verified successfully!',
        data: {
          userId: result.user_id,
          email: result.verified_email // Fixed: use verified_email not email
        }
      };

    } catch (error) {
      console.error('Token verification unexpected error:', error);
      return {
        success: false,
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<VerificationResult> {
    try {
      // Check cache first
      const cached = this.getCachedVerificationData(userId);
      if (cached) {
        return {
          success: true,
          message: 'Verification status retrieved',
          data: cached
        };
      }

      // Query database
      const { data, error } = await supabase
        .from('user_verification_status')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching verification status:', error);
        return {
          success: false,
          message: 'Failed to fetch verification status'
        };
      }

      const status = data || {
        student_verified: false,
        verification_status: 'unverified'
      };

      // Cache the result
      this.cacheVerificationData(userId, status);

      return {
        success: true,
        message: 'Verification status retrieved',
        data: status
      };

    } catch (error) {
      console.error('Error fetching verification status:', error);
      return {
        success: false,
        message: 'Failed to fetch verification status'
      };
    }
  }

  /**
   * Send verification email via Edge Function
   */
  private async sendVerificationEmail(
    email: string,
    token: string,
    studentName?: string
  ): Promise<VerificationResult> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email,
          verificationToken: token,
          studentName: studentName || 'Student'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return {
        success: true,
        message: result.message || 'Verification email sent successfully'
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  }

  /**
   * Utility methods
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isEduEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain?.endsWith('.edu') || false;
  }

  private generateToken(): string {
    // Generate a secure random token
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Caching methods for better performance
   */
  private cacheVerificationData(userId: string, data: any): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${this.CACHE_PREFIX}${userId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache verification data:', error);
    }
  }

  private getCachedVerificationData(userId: string): any | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${userId}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(`${this.CACHE_PREFIX}${userId}`);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to retrieve cached verification data:', error);
      return null;
    }
  }

  private clearVerificationCache(userId: string): void {
    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${userId}`);
      // Also clear any old localStorage keys
      Object.keys(localStorage).forEach(key => {
        if (key.includes('verification_request_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear verification cache:', error);
    }
  }

  /**
   * Clear all verification and user caches to force fresh data
   */
  clearAllCaches(): void {
    try {
      // Clear verification cache
      Object.keys(localStorage).forEach(key => {
        if (key.includes('verification_') || key.includes('uninest_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear service worker cache if available
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('workbox') || cacheName.includes('runtime')) {
              caches.delete(cacheName);
            }
          });
        });
      }
      
      console.log('🧹 All verification caches cleared');
    } catch (error) {
      console.warn('Failed to clear all caches:', error);
    }
  }

  /**
   * Cleanup expired verifications
   */
  async cleanupExpiredVerifications(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_verifications');
    } catch (error) {
      console.warn('Failed to cleanup expired verifications:', error);
    }
  }
}

export const verificationService = new VerificationService();
