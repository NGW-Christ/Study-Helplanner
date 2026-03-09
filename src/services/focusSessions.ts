import { supabase } from './supabase';

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  actual_duration_seconds: number;
  completed: boolean;
  started_at: string;
  ended_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class FocusSessionService {
  // Create a new focus session
  static async createSession(sessionData: Omit<FocusSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FocusSession | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          ...sessionData,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating focus session:', error);
      return null;
    }
  }

  // Complete a focus session
  static async completeSession(sessionId: string, actualDurationSeconds: number): Promise<FocusSession | null> {
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          completed: true,
          actual_duration_seconds: actualDurationSeconds,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing focus session:', error);
      return null;
    }
  }

  // Get user's focus sessions
  static async getUserSessions(limit: number = 50): Promise<FocusSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching focus sessions:', error);
      return [];
    }
  }

  // Get session statistics
  static async getSessionStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    averageSessionLength: number;
  }> {
    try {
      const sessions = await this.getUserSessions(1000); // Get all sessions for stats
      
      const completedSessions = sessions.filter(s => s.completed);
      const totalMinutes = completedSessions.reduce((acc, session) => 
        acc + (session.actual_duration_seconds / 60), 0
      );
      const averageSessionLength = completedSessions.length > 0 
        ? totalMinutes / completedSessions.length 
        : 0;

      return {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        totalMinutes: Math.round(totalMinutes),
        averageSessionLength: Math.round(averageSessionLength),
      };
    } catch (error) {
      console.error('Error calculating session stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
      };
    }
  }

  // Delete a session
  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting focus session:', error);
      return false;
    }
  }
}
