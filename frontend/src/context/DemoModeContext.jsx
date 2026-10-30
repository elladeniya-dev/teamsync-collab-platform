import React, { createContext, useContext, useState, useEffect } from 'react';

const DemoModeContext = createContext(null);

export const DemoModeProvider = ({ children }) => {
  // Defaults to false (Unplugged / Pure Production Deploy State)
  // Can be plugged in via UI toggle or VITE_TEST_HARNESS_PLUGGED env
  const [isTestHarnessPlugged, setIsTestHarnessPlugged] = useState(() => {
    const saved = localStorage.getItem('teamsync_test_harness_plugged');
    if (saved !== null) {
      return saved === 'true';
    }
    // If environment explicitly enables it in development
    return import.meta.env.VITE_TEST_HARNESS_PLUGGED === 'true';
  });

  const plugTestHarness = () => {
    setIsTestHarnessPlugged(true);
    localStorage.setItem('teamsync_test_harness_plugged', 'true');
  };

  const unplugTestHarness = () => {
    setIsTestHarnessPlugged(false);
    localStorage.setItem('teamsync_test_harness_plugged', 'false');
  };

  const toggleTestHarness = () => {
    setIsTestHarnessPlugged((prev) => {
      const next = !prev;
      localStorage.setItem('teamsync_test_harness_plugged', String(next));
      return next;
    });
  };

  return (
    <DemoModeContext.Provider
      value={{
        isTestHarnessPlugged,
        plugTestHarness,
        unplugTestHarness,
        toggleTestHarness,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

export default DemoModeContext;
