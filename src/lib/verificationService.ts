import { supabase } from './supabase';
import { emailService } from './emailService';

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

      // Generate verification token (client-side only for sending to Edge Function)
      const token = this.generateToken();
      
      // FIX: Removed client-side database insert for verification token.
      // The Edge Function will now handle the token insertion securely on the backend.
      // Call Edge Function to send verification email and create token record
      const emailResult = await this.sendVerificationEmail(email, token, studentName, userId);
      
      if (!emailResult.success) {
        return emailResult;
      }

      // Cache verification data (optional, depends on how you want to track pending state client-side)
      // For now, we rely on the backend to manage the token state.
      // this.cacheVerificationData(userId, verification); // 'verification' object is no longer available directly here

      return {
        success: true,
        message: `Verification email sent to ${email}. Please check your inbox and click the verification link.`,
        data: {
          email,
          // We no longer have verification.id or expiresAt directly here,
          // as the Edge Function handles the DB insertion.
          // If needed, the Edge Function could return this info.
        }
      };

    } catch (error: any) {
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
      // Call database function to verify token
      const { data, error } = await supabase
        .rpc('verify_email_token', { token_input: token });

      if (error) {
        return {
          success: false,
          message: `Database error: ${error.message || 'Unknown error'}`
        };
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return {
          success: false,
          message: 'Invalid verification response from database'
        };
      }

      const result = data[0];
      
      if (!result) {
        return {
          success: false,
          message: 'No verification result returned'
        };
      }

      // Check the actual status returned by the RPC function
      if (result.status !== 'verified') {
        // Status check failed
        return {
          success: false,
          message: result.message || 'Invalid or expired verification token'
        };
      }

      // Clear cached data
      // The RPC function (verify_email_token) does not return user_id directly in the success path,
      // it returns the verified email. We should rely on AuthContext to refresh the user profile
      // after this function completes successfully to get the updated user data.
      // If result.user_id is passed back from RPC, uncomment below. For now, assuming AuthContext refresh.
      // this.clearVerificationCache(result.user_id); 

      return {
        success: true,
        message: result.message || 'Email verified successfully!',
        // The RPC returns { status, message }. Adapt data to match expected output if needed by consumers.
        data: {
          // userId: result.user_id, // If RPC returns user_id
          // email: result.verified_email // If RPC returns verified_email
        }
      };

    } catch (error: any) {
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

      // Query database directly from profiles table for user's verification status
      // FIX: Changed table from 'user_verification_status' to 'profiles'
      const { data, error } = await supabase
        .from('profiles') // Corrected table to profiles
        .select('student_verified, verification_status') // Select specific fields
        .eq('id', userId) // Filter by user ID
        .single();

      if (error && error.code !== 'PGRST116') { // Not found (PGRST116) is ok, other errors are not
        return {
          success: false,
          message: 'Failed to fetch verification status'
        };
      }

      // If data is null (profile not found), assume unverified
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

    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to fetch verification status'
      };
    }
  }

  /**
   * Send verification email using Edge Function (Resend API)
   * Changed to private as it's an internal helper for requestEmailVerification
   */
  private async sendVerificationEmail(
    email: string,
    token: string,
    _studentName: string | undefined,
    userId: string
  ): Promise<VerificationResult> {
    try {
      // Send email using Edge Function (Resend API)
      const emailResult = await emailService.sendVerificationEmail({
        userEmail: email,
        verificationToken: token,
        verificationUrl: '', // URL is generated in Edge Function
        userId: userId
      });

      if (emailResult) {
        return {
          success: true,
          message: 'Verification email sent successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send verification email. Please check your internet connection and try again.'
        };
      }

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send verification email: ${error.message || 'Unknown error'}`
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
      // Silently handle cache errors
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
    } catch (error: any) {
      return null;
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
    } catch (error: any) {
      // Silently handle cache errors
    }
  }

  /**
   * Handle tab visibility changes to clear stale caches
   */
  handleTabVisibilityChange(): void {
    if (!document.hidden) {
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
              }
            }
          } catch (error) { // Catch potential parsing errors
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error: any) {
      // Silently handle cache errors
    }
  }

  /**
   * Cleanup expired verifications
   */
  async cleanupExpiredVerifications(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_verifications');
    } catch (error: any) {
      // Silently handle cleanup errors
    }
  }
}

export const verificationService = new VerificationService();