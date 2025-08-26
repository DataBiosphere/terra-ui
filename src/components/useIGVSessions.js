import { useEffect, useState } from 'react';
import { withErrorReporting } from 'src/libs/error';

export const useIGVSessions = (workspaceId) => {
  const [savedSessions, setSavedSessions] = useState([]);

  const getSavedSessions = () => {
    try {
      if (!workspaceId) return [];

      const sessionListKey = `igv-session-list-${workspaceId}`;
      const list = localStorage.getItem(sessionListKey);
      return list ? JSON.parse(list) : [];
    } catch {
      return [];
    }
  };

  const refreshSessions = () => {
    if (!workspaceId) {
      setSavedSessions([]);
      return;
    }

    try {
      const sessionListKey = `igv-session-list-${workspaceId}`;
      const list = localStorage.getItem(sessionListKey);
      setSavedSessions(list ? JSON.parse(list) : []);
    } catch {
      setSavedSessions([]);
    }
  };

  const loadSession = withErrorReporting('Unable to load session')(async (sessionName) => {
    try {
      const sessionKey = `igvSession-${workspaceId}-${sessionName}`;
      const sessionData = localStorage.getItem(sessionKey);
      if (!sessionData) {
        throw new Error(`Session '${sessionName}' not found`);
      }

      const parsed = JSON.parse(sessionData);
      return parsed; // Return the parsed session data instead of loading it directly
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  });

  const saveSession = withErrorReporting('Unable to save session')(async (sessionName, sessionData, genome) => {
    try {
      const sessionKey = `igvSession-${workspaceId}-${sessionName}`;

      const fullSessionData = {
        name: sessionName,
        timestamp: new Date().toISOString(),
        data: sessionData,
        workspace: workspaceId,
        genome,
      };

      localStorage.setItem(sessionKey, JSON.stringify(fullSessionData));

      // Update session list
      const sessionList = getSavedSessions();
      const existingIndex = sessionList.findIndex((s) => s.name === sessionName);

      let updatedList;
      if (existingIndex >= 0) {
        // Update existing session timestamp
        updatedList = [...sessionList];
        updatedList[existingIndex] = { name: sessionName, timestamp: fullSessionData.timestamp };
      } else {
        // Add new session
        updatedList = [...sessionList, { name: sessionName, timestamp: fullSessionData.timestamp }];
      }

      const sessionListKey = `igv-session-list-${workspaceId}`;
      localStorage.setItem(sessionListKey, JSON.stringify(updatedList));
      setSavedSessions(updatedList);

      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  });

  const deleteSession = (sessionName) => {
    try {
      const sessionKey = `igvSession-${workspaceId}-${sessionName}`;

      // Remove the session data
      localStorage.removeItem(sessionKey);

      // Update the session list
      const sessionList = getSavedSessions().filter((session) => session.name !== sessionName);
      const sessionListKey = `igv-session-list-${workspaceId}`;
      localStorage.setItem(sessionListKey, JSON.stringify(sessionList));
      setSavedSessions(sessionList);

      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!workspaceId) {
      setSavedSessions([]);
      return;
    }

    try {
      const sessionListKey = `igv-session-list-${workspaceId}`;
      const list = localStorage.getItem(sessionListKey);
      setSavedSessions(list ? JSON.parse(list) : []);
    } catch {
      setSavedSessions([]);
    }
  }, [workspaceId]);

  return {
    savedSessions,
    getSavedSessions,
    loadSession,
    saveSession,
    deleteSession,
    refreshSessions,
  };
};
