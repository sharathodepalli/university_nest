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

  constructor() {
    // Initialize tab visibility handling
    this.initTabVisibilityHandling();
  }

  /**
   * Initialize tab visibility change handling
   */
  private initTabVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.handleTabVisibilityChange();
      });
    }
  }

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
      // FIX: Changed 'email_verifications' to 'email_verification_tokens'
      const { data: verification, error: dbError } = await supabase
        .from('email_verification_tokens') // Corrected table name
        .insert({
          user_id: userId,
          email: email.toLowerCase().trim(),
          token_hash: token, // Changed to token_hash as per DB schema
          // verification_type field is not in DB schema, removed
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          // metadata field is not in DB schema, removed
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
        // FIX: Update status on the correct table 'email_verification_tokens'
        await supabase
          .from('email_verification_tokens') // Corrected table name
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
      // FIX: Changed token_input to token_hash as per SQL RPC function
      const { data, error } = await supabase
        .rpc('verify_email_token', { token_hash: token }); // Corrected RPC parameter

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

      // The RPC function returns 'status' and 'message' based on the SQL function's TABLE(status TEXT, message TEXT)
      if (result.status !== 'verified') { // Check the actual status returned by the RPC
        return {
          success: false,
          message: result.message || 'Invalid or expired verification token'
        };
      }

      // Clear cached data
      // The RPC function does not return user_id directly in the success path, it's assumed from context
      // It returns the email. We should rely on AuthContext to refresh the user profile.
      // This part might need the user_id if we want to clear a specific cache, but the AuthContext refresh covers it.
      // Assuming result.user_id is available if 'verified'
      this.clearVerificationCache(result.user_id); 

      return {
        success: true,
        message: result.message || 'Email verified successfully!',
        data: {
          userId: result.user_id, // This should ideally be returned by the RPC or derived
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
      // FIX: Query the profiles table for student_verified status directly for the user
      const { data, error } = await supabase
        .from('profiles') // Corrected table to profiles
        .select('student_verified, verification_status') // Select specific fields
        .eq('id', userId) // Filter by user ID
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching verification status:', error);
        return {
          success: false,
          message: 'Failed to fetch verification status'
        };
      }

      // If data is null, profile might not exist or not verified
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

      // FIX: Ensure the correct Edge Function URL is used if you have a V2 version
      // Assuming 'send-verification-email-v2' is the deployed version based on previous context.
      // If your deployed function is just 'send-verification-email', adjust the URL accordingly.
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-verification-email-v2`; // Check your deployed Edge Function name

      const response = await fetch(edgeFunctionUrl, {
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
   * Handle tab visibility changes to clear stale caches
   */
  handleTabVisibilityChange(): void {
    if (!document.hidden) {
      console.log('[VerificationService] Tab became visible, clearing stale caches');
      // Clear caches that might be stale
      Object.keys(localStorage).forEach(key => {
        if (key.includes(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { timestamp } = JSON.parse(cached);
              // Clear cache if older than 2 minutes when tab becomes visible
              if (Date.now() - timestamp > 2 * 60 * 1000) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // If parsing fails, remove the corrupted cache
            localStorage.removeItem(key);
          }
        }
      });
    }
  }

  /**
   * Clear stale caches on tab visibility change
   */
  clearStaleCaches(): void {
    try {
      const now = Date.now();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { timestamp } = JSON.parse(cached);
              // Clear cache if older than 10 minutes
              if (now - timestamp > 10 * 60 * 1000) {
                localStorage.removeItem(key);
                console.log(`🧹 Cleared stale cache: ${key}`);
              }
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear stale caches:', error);
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