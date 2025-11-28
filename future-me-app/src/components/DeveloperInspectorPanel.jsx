import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRoutingLogs,
  getBlockedAttempts,
  clearRoutingLogs,
  enableTestMode,
  disableTestMode,
  isTestModeEnabled,
  simulateInput,
  simulateBatchInputs,
  getTestModeInputs,
  clearTestModeInputs,
  getRoutingRules,
  getRoutingStats,
  RoutingDecision
} from '../utils/avatarInputInterceptor';
import { getAvatarState } from '../utils/avatarStateManager';

export default function DeveloperInspectorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [blockedAttempts, setBlockedAttempts] = useState([]);
  const [stats, setStats] = useState({});
  const [avatarState, setAvatarState] = useState({});
  const [testMode, setTestMode] = useState(false);
  const [testInputs, setTestInputs] = useState([]);
  const [simulationKey, setSimulationKey] = useState('');
  const [simulationValue, setSimulationValue] = useState('');
  const [simulationSource, setSimulationSource] = useState('manual');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshData = useCallback(() => {
    setLogs(getRoutingLogs());
    setBlockedAttempts(getBlockedAttempts());
    setStats(getRoutingStats());
    setAvatarState(getAvatarState());
    setTestMode(isTestModeEnabled());
    setTestInputs(getTestModeInputs());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, refreshData]);

  useEffect(() => {
    if (isOpen && autoRefresh) {
      const interval = setInterval(refreshData, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh, refreshData]);

  const handleToggleTestMode = () => {
    if (testMode) {
      disableTestMode();
    } else {
      enableTestMode();
    }
    setTestMode(!testMode);
    refreshData();
  };

  const handleSimulateInput = () => {
    if (!simulationKey.trim()) return;
    
    const value = simulationValue || 'test_value';
    simulateInput(simulationKey, value, simulationSource);
    
    setSimulationKey('');
    setSimulationValue('');
    refreshData();
  };

  const handleSimulateBatch = () => {
    const testBatch = {
      sleep: 4,
      activity: 3,
      nutrition: 4,
      stress: 2,
      hydration: 3,
      faithActions: true
    };
    
    simulateBatchInputs(testBatch, 'daily_log');
    refreshData();
  };

  const handleClearLogs = () => {
    clearRoutingLogs();
    refreshData();
  };

  const handleClearTestInputs = () => {
    clearTestModeInputs();
    refreshData();
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case RoutingDecision.CURRENT_ME:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case RoutingDecision.FUTURE_ME:
        return 'bg-green-100 text-green-800 border-green-300';
      case RoutingDecision.BLOCKED:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case RoutingDecision.CURRENT_ME:
        return '🔒';
      case RoutingDecision.FUTURE_ME:
        return '➡️';
      case RoutingDecision.BLOCKED:
        return '⛔';
      default:
        return '❓';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        className="fixed right-0 top-0 h-full w-96 bg-gray-900 text-white shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🔧</span>
              Avatar Routing Inspector
            </h2>
            <p className="text-xs text-purple-200">Shift + M to toggle</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          {['logs', 'blocked', 'state', 'test'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab === 'logs' && '📋 Logs'}
              {tab === 'blocked' && '⛔ Blocked'}
              {tab === 'state' && '📊 State'}
              {tab === 'test' && '🧪 Test'}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-green-400">
                ➡️ Future: {stats.futureMeRouted || 0}
              </span>
              <span className="text-blue-400">
                🔒 Current: {stats.currentMeRouted || 0}
              </span>
              <span className="text-red-400">
                ⛔ Blocked: {stats.blocked || 0}
              </span>
            </div>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-gray-400">Auto</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">
                  Routing Logs ({logs.length})
                </h3>
                <button
                  onClick={handleClearLogs}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Clear
                </button>
              </div>
              
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No routing logs yet. Inputs will appear here as they are intercepted.
                </p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border text-xs ${getDecisionColor(log.decision)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold">
                        {getDecisionIcon(log.decision)} {log.inputKey}
                      </span>
                      <span className="text-xs opacity-75">
                        {log.source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-48" title={log.value}>
                        {log.value}
                      </span>
                      <span className="text-xs opacity-50">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.isTestMode && (
                      <span className="text-xs bg-yellow-500 text-black px-1 rounded mt-1 inline-block">
                        TEST MODE
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Blocked Attempts ({blockedAttempts.length})
              </h3>
              
              {blockedAttempts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No blocked attempts recorded.
                </p>
              ) : (
                blockedAttempts.map((attempt, index) => (
                  <div
                    key={index}
                    className="p-3 rounded bg-red-900/30 border border-red-700 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold text-red-300">
                        ⛔ {attempt.inputKey}
                      </span>
                      <span className="text-red-400">
                        {attempt.source}
                      </span>
                    </div>
                    {attempt.reason && (
                      <p className="text-red-200 mt-1">{attempt.reason}</p>
                    )}
                    <span className="text-xs text-red-400 opacity-50">
                      {new Date(attempt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'state' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  🔒 Current Me Baseline
                  {avatarState.currentMe?.isLocked && (
                    <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">LOCKED</span>
                  )}
                </h3>
                <div className="bg-gray-800 rounded p-3 text-xs">
                  {avatarState.currentMe?.baseline ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap text-gray-300">
                      {JSON.stringify(avatarState.currentMe.baseline, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-500">No baseline set</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  ➡️ Future Me Projection
                  <span className="text-xs bg-green-600 px-2 py-0.5 rounded">DYNAMIC</span>
                </h3>
                <div className="bg-gray-800 rounded p-3 text-xs">
                  {avatarState.futureMe?.projection ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap text-gray-300">
                      {JSON.stringify(avatarState.futureMe.projection, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-500">No projection calculated</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">
                  📊 Routing Statistics
                </h3>
                <div className="bg-gray-800 rounded p-3 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Total Intercepted:</span>
                    <span className="ml-2 text-white">{stats.totalIntercepted || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Test Mode:</span>
                    <span className={`ml-2 ${stats.testModeActive ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {stats.testModeActive ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  {stats.bySource && Object.entries(stats.bySource).map(([source, count]) => (
                    <div key={source}>
                      <span className="text-gray-500">{source}:</span>
                      <span className="ml-2 text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">
                  Routing Test Mode
                </h3>
                <button
                  onClick={handleToggleTestMode}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    testMode
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {testMode ? '🧪 Test Mode ON' : 'Enable Test Mode'}
                </button>
              </div>

              {testMode && (
                <>
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 text-xs">
                    <p className="text-yellow-300">
                      Test mode active. Simulated inputs will be logged but won't affect user data.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400">Simulate Single Input</h4>
                    <input
                      type="text"
                      placeholder="Input key (e.g., sleep, activity)"
                      value={simulationKey}
                      onChange={(e) => setSimulationKey(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={simulationValue}
                      onChange={(e) => setSimulationValue(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                    <select
                      value={simulationSource}
                      onChange={(e) => setSimulationSource(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    >
                      <option value="manual">Manual</option>
                      <option value="daily_log">Daily Log</option>
                      <option value="zone_log">Zone Log</option>
                      <option value="device">Device</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="reassessment">Reassessment</option>
                    </select>
                    <button
                      onClick={handleSimulateInput}
                      disabled={!simulationKey.trim()}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
                    >
                      Simulate Input
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Quick Tests</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleSimulateBatch}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                      >
                        Daily Log Batch
                      </button>
                      <button
                        onClick={() => {
                          simulateInput('age', 30, 'manual');
                          refreshData();
                        }}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                      >
                        Current Me Input
                      </button>
                      <button
                        onClick={() => {
                          simulateInput('device_steps', 10000, 'device');
                          refreshData();
                        }}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                      >
                        Device Input
                      </button>
                      <button
                        onClick={() => {
                          simulateInput('password', 'secret123', 'manual');
                          refreshData();
                        }}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                      >
                        Blocked Input
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-400">
                        Test Inputs ({testInputs.length})
                      </h4>
                      <button
                        onClick={handleClearTestInputs}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {testInputs.map((input, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded border text-xs ${getDecisionColor(input.decision)}`}
                        >
                          <span className="font-mono">
                            {getDecisionIcon(input.decision)} {input.inputKey}
                          </span>
                          <span className="ml-2 opacity-75">= {String(input.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!testMode && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Enable test mode to simulate inputs and verify routing behavior.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-800 border-t border-gray-700 p-3 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Avatar Input Routing Gateway v1.0</span>
            <button
              onClick={refreshData}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
