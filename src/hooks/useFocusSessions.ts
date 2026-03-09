import { useState, useEffect } from 'react';
import { FocusSessionService, FocusSession } from '../services/focusSessions';

export const useFocusSessions = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const [sessionsData, statsData] = await Promise.all([
        FocusSessionService.getUserSessions(),
        FocusSessionService.getSessionStats(),
      ]);
      
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading focus sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (durationMinutes: number) => {
    try {
      const newSession = await FocusSessionService.createSession({
        duration_minutes: durationMinutes,
        actual_duration_seconds: 0,
        completed: false,
        started_at: new Date().toISOString(),
      });
      
      if (newSession) {
        setSessions(prev => [newSession, ...prev]);
        return newSession;
      }
      return null;
    } catch (error) {
      console.error('Error creating focus session:', error);
      return null;
    }
  };

  const completeSession = async (sessionId: string, actualDurationSeconds: number) => {
    try {
      const updatedSession = await FocusSessionService.completeSession(sessionId, actualDurationSeconds);
      
      if (updatedSession) {
        setSessions(prev => 
          prev.map(session => 
            session.id === sessionId ? updatedSession : session
          )
        );
        await loadSessions(); // Refresh stats
        return updatedSession;
      }
      return null;
    } catch (error) {
      console.error('Error completing focus session:', error);
      return null;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const success = await FocusSessionService.deleteSession(sessionId);
      
      if (success) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        await loadSessions(); // Refresh stats
      }
      return success;
    } catch (error) {
      console.error('Error deleting focus session:', error);
      return false;
    }
  };

  return {
    sessions,
    loading,
    stats,
    createSession,
    completeSession,
    deleteSession,
    refreshSessions: loadSessions,
  };
};
