import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { workspaceApi } from '../api/client';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    const saved = localStorage.getItem('teamsync_active_workspace');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workspaceApi.getAll();
      const list = res.data || [];
      setWorkspaces(list);

      // If active workspace is not set or not in list, pick the default or first one
      setActiveWorkspace((current) => {
        if (current && list.some((w) => w._id === current._id)) {
          const fresh = list.find((w) => w._id === current._id);
          localStorage.setItem('teamsync_active_workspace', JSON.stringify(fresh));
          return fresh;
        }
        const defaultWs = list.find((w) => w.isDefault) || list[0] || null;
        if (defaultWs) {
          localStorage.setItem('teamsync_active_workspace', JSON.stringify(defaultWs));
        }
        return defaultWs;
      });
    } catch (err) {
      console.warn('Could not load workspaces:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchWorkspaces]);

  const switchWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('teamsync_active_workspace', JSON.stringify(workspace));
  };

  const changeCurrentSprint = async (workspaceId, newSprint) => {
    try {
      const res = await workspaceApi.update(workspaceId, { currentSprint: newSprint });
      const updated = res.data;

      setWorkspaces((prev) =>
        prev.map((w) => (w._id === workspaceId ? updated : w))
      );

      if (activeWorkspace?._id === workspaceId) {
        setActiveWorkspace(updated);
        localStorage.setItem('teamsync_active_workspace', JSON.stringify(updated));
      }
      return updated;
    } catch (err) {
      console.error('Failed to change sprint:', err);
      throw err;
    }
  };

  const createNewWorkspace = async ({ name, currentSprint = 'Sprint 1', description = '' }) => {
    try {
      const res = await workspaceApi.create({
        name,
        currentSprint,
        sprints: [currentSprint, 'Sprint 2', 'Backlog'],
        description,
      });
      const newWs = res.data;

      setWorkspaces((prev) => [...prev, newWs]);
      switchWorkspace(newWs);
      return newWs;
    } catch (err) {
      console.error('Failed to create workspace:', err);
      throw err;
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      await workspaceApi.delete(workspaceId);
      const remaining = workspaces.filter((w) => w._id !== workspaceId);
      setWorkspaces(remaining);

      if (activeWorkspace?._id === workspaceId) {
        const next = remaining[0] || null;
        setActiveWorkspace(next);
        if (next) {
          localStorage.setItem('teamsync_active_workspace', JSON.stringify(next));
        } else {
          localStorage.removeItem('teamsync_active_workspace');
        }
      }
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      throw err;
    }
  };

  const removeSprint = async (workspaceId, sprintName) => {
    try {
      const res = await workspaceApi.removeSprint(workspaceId, sprintName);
      const updated = res.data;

      setWorkspaces((prev) =>
        prev.map((w) => (w._id === workspaceId ? updated : w))
      );

      if (activeWorkspace?._id === workspaceId) {
        setActiveWorkspace(updated);
        localStorage.setItem('teamsync_active_workspace', JSON.stringify(updated));
      }
      return updated;
    } catch (err) {
      console.error('Failed to remove sprint:', err);
      throw err;
    }
  };

  const value = {
    workspaces,
    activeWorkspace,
    loading,
    fetchWorkspaces,
    switchWorkspace,
    changeCurrentSprint,
    createNewWorkspace,
    deleteWorkspace,
    removeSprint,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceContext;
