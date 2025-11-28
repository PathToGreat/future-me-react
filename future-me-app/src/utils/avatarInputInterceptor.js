import routingRules from '../config/avatarRoutingRules.json';

const ROUTING_LOG_ENABLED = true;
const MAX_LOG_ENTRIES = 100;

let routingLogs = [];
let blockedAttempts = [];
let testModeEnabled = false;
let testModeInputs = [];

const RoutingDecision = {
  CURRENT_ME: 'CURRENT_ME',
  FUTURE_ME: 'FUTURE_ME',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN'
};

function normalizeInputKey(inputKey) {
  return inputKey
    .replace(/^device_/, '')
    .replace(/^onboardingBaseline\./, '')
    .toLowerCase()
    .trim();
}

function isCurrentMeInput(inputKey) {
  const normalizedKey = normalizeInputKey(inputKey);
  const currentMeInputs = routingRules.current_me_affects.all_inputs.map(i => i.toLowerCase());
  
  if (currentMeInputs.includes(normalizedKey)) return true;
  if (currentMeInputs.includes(inputKey.toLowerCase())) return true;
  
  for (const category of Object.values(routingRules.current_me_affects.categories)) {
    if (category.inputs.some(i => i.toLowerCase() === normalizedKey || i.toLowerCase() === inputKey.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

function isFutureMeInput(inputKey) {
  const normalizedKey = normalizeInputKey(inputKey);
  const futureMeInputs = routingRules.future_me_affects.all_inputs.map(i => i.toLowerCase());
  
  if (futureMeInputs.includes(normalizedKey)) return true;
  if (futureMeInputs.includes(inputKey.toLowerCase())) return true;
  
  for (const category of Object.values(routingRules.future_me_affects.categories)) {
    if (category.inputs.some(i => i.toLowerCase() === normalizedKey || i.toLowerCase() === inputKey.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

function isBlockedInput(inputKey) {
  const normalizedKey = normalizeInputKey(inputKey);
  return routingRules.blocked_inputs.inputs.some(
    i => i.toLowerCase() === normalizedKey || i.toLowerCase() === inputKey.toLowerCase()
  );
}

function determineRouting(inputKey, source = 'manual') {
  if (isBlockedInput(inputKey)) {
    return RoutingDecision.BLOCKED;
  }
  
  if (source === 'device' || inputKey.startsWith('device_')) {
    return RoutingDecision.FUTURE_ME;
  }
  
  if (source === 'daily_log' || source === 'zone_log') {
    return RoutingDecision.FUTURE_ME;
  }
  
  if (isCurrentMeInput(inputKey)) {
    return RoutingDecision.CURRENT_ME;
  }
  
  if (isFutureMeInput(inputKey)) {
    return RoutingDecision.FUTURE_ME;
  }
  
  if (routingRules.routing_behavior.unknown_input_policy === 'route_to_future_me') {
    return RoutingDecision.FUTURE_ME;
  }
  
  return RoutingDecision.UNKNOWN;
}

function logRoutingDecision(inputKey, value, decision, source, context = {}) {
  if (!ROUTING_LOG_ENABLED) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    inputKey,
    value: typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100),
    decision,
    source,
    context,
    isTestMode: testModeEnabled
  };
  
  routingLogs.unshift(logEntry);
  
  if (routingLogs.length > MAX_LOG_ENTRIES) {
    routingLogs = routingLogs.slice(0, MAX_LOG_ENTRIES);
  }
  
  if (decision === RoutingDecision.BLOCKED) {
    blockedAttempts.unshift(logEntry);
    if (blockedAttempts.length > 50) {
      blockedAttempts = blockedAttempts.slice(0, 50);
    }
  }
  
  console.log(`🔀 [Avatar Router] ${inputKey}: ${decision} (source: ${source})`);
}

export function interceptInput(inputKey, value, source = 'manual', context = {}) {
  const decision = determineRouting(inputKey, source);
  
  logRoutingDecision(inputKey, value, decision, source, context);
  
  return {
    inputKey,
    value,
    decision,
    source,
    timestamp: new Date().toISOString(),
    shouldUpdateCurrentMe: decision === RoutingDecision.CURRENT_ME,
    shouldUpdateFutureMe: decision === RoutingDecision.FUTURE_ME,
    isBlocked: decision === RoutingDecision.BLOCKED,
    context
  };
}

export function interceptBatchInputs(inputs, source = 'manual', context = {}) {
  const results = {
    currentMeUpdates: {},
    futureMeUpdates: {},
    blocked: {},
    unknown: {},
    allDecisions: []
  };
  
  for (const [key, value] of Object.entries(inputs)) {
    const intercepted = interceptInput(key, value, source, context);
    results.allDecisions.push(intercepted);
    
    switch (intercepted.decision) {
      case RoutingDecision.CURRENT_ME:
        results.currentMeUpdates[key] = value;
        break;
      case RoutingDecision.FUTURE_ME:
        results.futureMeUpdates[key] = value;
        break;
      case RoutingDecision.BLOCKED:
        results.blocked[key] = value;
        break;
      default:
        results.unknown[key] = value;
    }
  }
  
  return results;
}

export function interceptDailyLogData(logData, zoneId = null) {
  const source = zoneId ? 'zone_log' : 'daily_log';
  const context = { zoneId, logType: 'daily' };
  
  return interceptBatchInputs(logData, source, context);
}

export function interceptDeviceData(deviceData, providerName) {
  const context = { provider: providerName, dataType: 'device' };
  
  const prefixedData = {};
  for (const [key, value] of Object.entries(deviceData)) {
    prefixedData[`device_${key}`] = value;
  }
  
  return interceptBatchInputs(prefixedData, 'device', context);
}

export function interceptOnboardingData(onboardingData) {
  const context = { source: 'onboarding', isReassessment: false };
  
  const results = {
    currentMeUpdates: {},
    futureMeUpdates: {},
    blocked: {},
    allDecisions: []
  };
  
  for (const [key, value] of Object.entries(onboardingData)) {
    const fullKey = `onboardingBaseline.${key}`;
    const intercepted = interceptInput(fullKey, value, 'onboarding', context);
    results.allDecisions.push(intercepted);
    
    results.currentMeUpdates[key] = value;
  }
  
  return results;
}

export function interceptReassessmentData(reassessmentData) {
  const context = { source: 'reassessment', isReassessment: true };
  
  console.log('🔄 [Avatar Router] Processing reassessment - updating Current Me baseline');
  
  const results = {
    currentMeUpdates: {},
    futureMeUpdates: {},
    allDecisions: []
  };
  
  for (const [key, value] of Object.entries(reassessmentData)) {
    results.currentMeUpdates[key] = value;
    
    const decision = RoutingDecision.CURRENT_ME;
    logRoutingDecision(key, value, decision, 'reassessment', context);
    
    results.allDecisions.push({
      inputKey: key,
      value,
      decision,
      source: 'reassessment',
      shouldUpdateCurrentMe: true,
      shouldUpdateFutureMe: false
    });
  }
  
  return results;
}

export function canUpdateCurrentMe(inputKey, source = 'manual') {
  if (source === 'device' || source === 'daily_log' || source === 'zone_log') {
    const decision = determineRouting(inputKey, source);
    if (decision !== RoutingDecision.CURRENT_ME) {
      console.warn(`⛔ [Avatar Router] Blocked attempt to update Current Me with ${inputKey} from ${source}`);
      blockedAttempts.unshift({
        timestamp: new Date().toISOString(),
        inputKey,
        source,
        reason: 'Daily/device data cannot modify Current Me baseline'
      });
      return false;
    }
  }
  
  return isCurrentMeInput(inputKey) || source === 'onboarding' || source === 'reassessment';
}

export function canUpdateFutureMe(inputKey) {
  return !isBlockedInput(inputKey);
}

export function getRoutingLogs() {
  return [...routingLogs];
}

export function getBlockedAttempts() {
  return [...blockedAttempts];
}

export function clearRoutingLogs() {
  routingLogs = [];
  blockedAttempts = [];
}

export function enableTestMode() {
  testModeEnabled = true;
  testModeInputs = [];
  console.log('🧪 [Avatar Router] Test mode ENABLED');
}

export function disableTestMode() {
  testModeEnabled = false;
  testModeInputs = [];
  console.log('🧪 [Avatar Router] Test mode DISABLED');
}

export function isTestModeEnabled() {
  return testModeEnabled;
}

export function simulateInput(inputKey, value, source = 'manual') {
  if (!testModeEnabled) {
    console.warn('⚠️ [Avatar Router] Cannot simulate input - test mode not enabled');
    return null;
  }
  
  const result = interceptInput(inputKey, value, source, { simulated: true });
  
  testModeInputs.push(result);
  
  console.log(`🧪 [Avatar Router] SIMULATED: ${inputKey} -> ${result.decision}`);
  
  return result;
}

export function simulateBatchInputs(inputs, source = 'manual') {
  if (!testModeEnabled) {
    console.warn('⚠️ [Avatar Router] Cannot simulate inputs - test mode not enabled');
    return null;
  }
  
  const results = [];
  for (const [key, value] of Object.entries(inputs)) {
    results.push(simulateInput(key, value, source));
  }
  
  return results;
}

export function getTestModeInputs() {
  return [...testModeInputs];
}

export function clearTestModeInputs() {
  testModeInputs = [];
}

export function getRoutingRules() {
  return { ...routingRules };
}

export function getRoutingStats() {
  const stats = {
    totalIntercepted: routingLogs.length,
    currentMeRouted: routingLogs.filter(l => l.decision === RoutingDecision.CURRENT_ME).length,
    futureMeRouted: routingLogs.filter(l => l.decision === RoutingDecision.FUTURE_ME).length,
    blocked: blockedAttempts.length,
    testModeActive: testModeEnabled,
    testModeInputCount: testModeInputs.length,
    bySource: {}
  };
  
  for (const log of routingLogs) {
    stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
  }
  
  return stats;
}

export { RoutingDecision };

export default {
  interceptInput,
  interceptBatchInputs,
  interceptDailyLogData,
  interceptDeviceData,
  interceptOnboardingData,
  interceptReassessmentData,
  canUpdateCurrentMe,
  canUpdateFutureMe,
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
};
