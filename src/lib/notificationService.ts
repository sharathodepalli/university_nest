// Notification service for listing status changes
import { supabase } from './supabase';
import { Listing } from '../types';

interface NotificationData {
  id: string;
  user_id: string;
  listing_id: string;
  type: 'listing_available' | 'listing_rented' | 'new_message' | 'listing_updated';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  listing?: Listing;
}

class NotificationService {
  /**
   * Notify users who favorited a listing when it becomes available again
   */
  async notifyFavoriteUsersOfAvailability(listingId: string, listingTitle: string) {
    try {
      // This would need a favorites table in the database to track who favorited what
      // For now, we'll log this functionality
      console.log(`[NotificationService] Would notify favorite users that listing ${listingId} "${listingTitle}" is now available`);
      
      // In a real implementation, you would:
      // 1. Query the favorites table for users who favorited this listing
      // 2. Create notifications for each user
      // 3. Optionally send email notifications
      
      return { success: true };
    } catch (error) {
      console.error('[NotificationService] Error notifying users:', error);
      return { success: false, error };
    }
  }

  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    listingId: string,
    type: NotificationData['type'],
    title: string,
    message: string
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          listing_id: listingId,
          type,
          title,
          message,
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[NotificationService] Notification created for user ${userId}`);
      return { success: true, data };
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          listing:listings (
            id,
            title,
            price,
            location,
            images
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data as NotificationData[] };
    } catch (error) {
      console.error('[NotificationService] Error fetching notifications:', error);
      return { success: false, error };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      return { success: false, error };
    }
  }

  /**
   * Handle listing status change notifications
   */
  async handleListingStatusChange(
    listing: Listing, 
    oldStatus: Listing['status'], 
    newStatus: Listing['status']
  ) {
    try {
      // Notify when listing becomes available again
      if (oldStatus === 'rented' && newStatus === 'active') {
        await this.notifyFavoriteUsersOfAvailability(listing.id, listing.title);
        
        // Create a general notification that could be shown to interested users
        console.log(`[NotificationService] Listing "${listing.title}" is now available again`);
      }

      // Log status changes for analytics
      console.log(`[NotificationService] Listing ${listing.id} status changed: ${oldStatus} → ${newStatus}`);
      
      return { success: true };
    } catch (error) {
      console.error('[NotificationService] Error handling status change:', error);
      return { success: false, error };
    }
  }
}

export const notificationService = new NotificationService();
export default NotificationService;
