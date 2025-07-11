export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          university: string;
          year: string;
          bio: string;
          phone: string | null;
          verified: boolean;
          student_verified: boolean | null;
          student_email: string | null;
          verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | null;
          verification_method: string | null;
          verified_at: string | null;
          profile_picture: string | null;
          preferences: any; // jsonb
          created_at: string;
          updated_at: string;
          email?: string | null;
          location: any | null; // ADDED: jsonb for user location
          matching_preferences: any | null; // CORRECTED: Changed from matchingPreferences to matching_preferences
        };
        Insert: {
          id: string;
          name: string;
          university: string;
          year: string;
          bio?: string;
          phone?: string | null;
          verified?: boolean;
          student_verified?: boolean | null;
          student_email?: string | null;
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected' | null;
          verification_method?: string | null;
          verified_at?: string | null;
          profile_picture?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          location?: any | null;
          matching_preferences?: any | null; // CORRECTED: Changed from matchingPreferences to matching_preferences
        };
        Update: {
          id?: string;
          name?: string;
          university?: string;
          year?: string;
          bio?: string;
          phone?: string | null;
          verified?: boolean;
          student_verified?: boolean | null;
          student_email?: string | null;
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected' | null;
          verification_method?: string | null;
          verified_at?: string | null;
          profile_picture?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          location?: any | null;
          matching_preferences?: any | null; // CORRECTED: Changed from matchingPreferences to matching_preferences
        };
      };
      listings: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          location: any; // jsonb
          room_type: 'single' | 'shared' | 'studio' | 'apartment';
          amenities: string[];
          images: string[];
          available_from: string;
          available_to: string | null;
          max_occupants: number;
          host_id: string;
          status: 'active' | 'inactive' | 'rented';
          preferences: any; // jsonb
          rules: string[];
          deposit: number | null;
          utilities: any; // jsonb
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          location: any;
          room_type: 'single' | 'shared' | 'studio' | 'apartment';
          amenities?: string[];
          images?: string[];
          available_from: string;
          available_to?: string | null;
          max_occupants?: number;
          host_id: string;
          status?: 'active' | 'inactive' | 'rented';
          preferences?: any;
          rules?: string[];
          deposit?: number | null;
          utilities?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          location?: any;
          room_type?: 'single' | 'shared' | 'studio' | 'apartment';
          amenities?: string[];
          images?: string[];
          available_from?: string;
          available_to?: string | null;
          max_occupants?: number;
          host_id?: string;
          status?: 'active' | 'inactive' | 'rented';
          preferences?: any;
          rules?: string[];
          deposit?: number | null;
          utilities?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string;
          participant_1: string;
          participant_2: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          participant_1: string;
          participant_2: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          participant_1?: string;
          participant_2?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'system';
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'system';
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'system';
          read?: boolean;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
      };
    };
  };
}