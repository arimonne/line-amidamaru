// Supabase スキーマ の型定義

export interface Database {
  public: {
    Tables: {
      lotteries: {
        Row: {
          id: string;
          group_line_id: string;
          title: string;
          description: string | null;
          phase: 'registration' | 'closed' | 'amida_generated' | 'completed';
          max_participants: number;
          registration_deadline: string;
          created_at: string;
          updated_at: string;
          amida_hash: string | null;
          amida_data: any | null;
        };
        Insert: Omit<Database['public']['Tables']['lotteries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['lotteries']['Row']>;
      };
      participants: {
        Row: {
          id: string;
          lottery_id: string;
          line_user_id: string;
          line_display_name: string;
          assigned_column: number | null;
          result_prize_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['participants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['participants']['Row']>;
      };
      prizes: {
        Row: {
          id: string;
          lottery_id: string;
          name: string;
          description: string | null;
          quantity: number;
          goal_column: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prizes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['prizes']['Row']>;
      };
      results: {
        Row: {
          id: string;
          lottery_id: string;
          participant_id: string;
          prize_id: string | null;
          final_column: number;
          fall_path: any | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['results']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['results']['Row']>;
      };
    };
  };
}
