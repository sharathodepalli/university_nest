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

      // CORRECTED: Assuming the backend RPC will now return named columns 'status' and 'message'.
      // This part depends on the next fix for the Supabase SQL function.
      if (result.status !== 'verified') { // Check the actual status returned by the RPC function
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

      // Query database directly from profiles table for user's verification status
      // FIX: Changed table from 'user_verification_status' to 'profiles'
      const { data, error } = await supabase
        .from('profiles') // Corrected table to profiles
        .select('student_verified, verification_status') // Select specific fields
        .eq('id', userId) // Filter by user ID
        .single();

      if (error && error.code !== 'PGRST116') { // Not found (PGRST116) is ok, other errors are not
        console.error('Error fetching verification status:', error);
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
      console.error('Error fetching verification status:', error);
      return {
        success: false,
        message: 'Failed to fetch verification status'
      };
    }
  }

  /**
   * Send verification email via Edge Function
   * Changed to private as it's an internal helper for requestEmailVerification
   */
  private async sendVerificationEmail(
    email: string,
    token: string, // This token will be the token_hash for the DB insertion
    studentName: string | undefined,
    userId: string // FIX: Pass userId to the Edge Function to allow it to create token
  ): Promise<VerificationResult> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // FIX: Ensure the correct Edge Function URL is used if you have a V2 version.
      // Based on provided logs and typical deployment, this is the expected name.
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-verification-email-v2`; 

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`, // Use anon key for client-side call to Edge Function
        },
        body: JSON.stringify({
          email,
          verificationToken: token, // Pass the generated token
          studentName: studentName || 'Student',
          userId: userId // FIX: Pass userId to the Edge Function
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

    } catch (error: any) {
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
    } catch (error: any) {
      console.warn('Failed to retrieve cached verification data:', error);
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
      
      console.log('🧹 All verification caches cleared');
    } catch (error: any) {
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
          } catch (error) { // Catch potential parsing errors
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error: any) {
      console.warn('Failed to clear stale caches:', error);
    }
  }

  /**
   * Cleanup expired verifications
   */
  async cleanupExpiredVerifications(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_verifications');
    } catch (error: any) {
      console.warn('Failed to cleanup expired verifications:', error);
    }
  }
}

export const verificationService = new VerificationService();