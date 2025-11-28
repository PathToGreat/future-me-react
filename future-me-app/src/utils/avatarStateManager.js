import { interceptBatchInputs, interceptReassessmentData, canUpdateCurrentMe, RoutingDecision } from './avatarInputInterceptor';

let currentMeBaseline = null;
let futureMeProjection = null;
let baselineLocked = true;
let lastBaselineUpdate = null;
let lastProjectionUpdate = null;

const stateChangeListeners = [];

function notifyStateChange(changeType, data) {
  for (const listener of stateChangeListeners) {
    try {
      listener({ changeType, data, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[Avatar State Manager] Listener error:', error);
    }
  }
}

export function initializeCurrentMeBaseline(onboardingData) {
  if (!onboardingData) {
    console.warn('[Avatar State Manager] No onboarding data provided');
    return null;
  }
  
  currentMeBaseline = {
    ...onboardingData,
    _meta: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isLocked: true,
      source: 'onboarding',
      version: 1
    }
  };
  
  baselineLocked = true;
  lastBaselineUpdate = new Date().toISOString();
  
  console.log('🔒 [Avatar State Manager] Current Me baseline initialized and LOCKED');
  notifyStateChange('baseline_initialized', { baseline: currentMeBaseline });
  
  return currentMeBaseline;
}

export function getCurrentMeBaseline() {
  return currentMeBaseline ? { ...currentMeBaseline } : null;
}

export function isBaselineLocked() {
  return baselineLocked;
}

export function unlockBaseline(reason = 'reassessment') {
  if (!baselineLocked) return true;
  
  if (reason !== 'reassessment') {
    console.warn(`⛔ [Avatar State Manager] Cannot unlock baseline for reason: ${reason}`);
    return false;
  }
  
  baselineLocked = false;
  console.log('🔓 [Avatar State Manager] Baseline UNLOCKED for reassessment');
  notifyStateChange('baseline_unlocked', { reason });
  
  return true;
}

export function lockBaseline() {
  baselineLocked = true;
  if (currentMeBaseline && currentMeBaseline._meta) {
    currentMeBaseline._meta.isLocked = true;
  }
  console.log('🔒 [Avatar State Manager] Baseline LOCKED');
  notifyStateChange('baseline_locked', {});
}

export function updateCurrentMeBaseline(newData, source = 'reassessment') {
  if (source !== 'reassessment' && source !== 'onboarding') {
    console.error(`⛔ [Avatar State Manager] Blocked baseline update from source: ${source}`);
    console.error('   Current Me can only be updated via onboarding or reassessment');
    return { success: false, reason: 'invalid_source' };
  }
  
  if (baselineLocked && source !== 'reassessment') {
    console.error('⛔ [Avatar State Manager] Baseline is LOCKED - cannot update');
    return { success: false, reason: 'baseline_locked' };
  }
  
  const intercepted = interceptReassessmentData(newData);
  
  const previousBaseline = currentMeBaseline ? { ...currentMeBaseline } : null;
  
  currentMeBaseline = {
    ...currentMeBaseline,
    ...intercepted.currentMeUpdates,
    _meta: {
      ...(currentMeBaseline?._meta || {}),
      lastUpdated: new Date().toISOString(),
      source,
      version: (currentMeBaseline?._meta?.version || 0) + 1,
      isLocked: true
    }
  };
  
  baselineLocked = true;
  lastBaselineUpdate = new Date().toISOString();
  
  console.log('✅ [Avatar State Manager] Current Me baseline UPDATED and RE-LOCKED');
  notifyStateChange('baseline_updated', { 
    previousBaseline, 
    newBaseline: currentMeBaseline,
    source 
  });
  
  return { 
    success: true, 
    baseline: currentMeBaseline,
    updatedFields: Object.keys(intercepted.currentMeUpdates)
  };
}

export function attemptBaselineUpdate(data, source) {
  const validSources = ['onboarding', 'reassessment'];
  
  if (!validSources.includes(source)) {
    console.warn(`⛔ [Avatar State Manager] Rejected baseline update from: ${source}`);
    console.warn('   Daily logs and device data cannot modify Current Me');
    
    notifyStateChange('baseline_update_blocked', { 
      attemptedSource: source, 
      data: Object.keys(data) 
    });
    
    return {
      success: false,
      reason: 'invalid_source',
      message: 'Only onboarding and reassessment can update Current Me baseline'
    };
  }
  
  return updateCurrentMeBaseline(data, source);
}

export function initializeFutureMeProjection(projectionData) {
  futureMeProjection = {
    ...projectionData,
    _meta: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isDynamic: true,
      source: 'projection_engine'
    }
  };
  
  lastProjectionUpdate = new Date().toISOString();
  
  console.log('➡️ [Avatar State Manager] Future Me projection initialized');
  notifyStateChange('projection_initialized', { projection: futureMeProjection });
  
  return futureMeProjection;
}

export function getFutureMeProjection() {
  return futureMeProjection ? { ...futureMeProjection } : null;
}

export function updateFutureMeProjection(newData, source = 'daily_log') {
  const intercepted = interceptBatchInputs(newData, source, { target: 'future_me' });
  
  const previousProjection = futureMeProjection ? { ...futureMeProjection } : null;
  
  futureMeProjection = {
    ...futureMeProjection,
    ...intercepted.futureMeUpdates,
    _meta: {
      ...(futureMeProjection?._meta || {}),
      lastUpdated: new Date().toISOString(),
      lastSource: source,
      isDynamic: true
    }
  };
  
  lastProjectionUpdate = new Date().toISOString();
  
  console.log(`➡️ [Avatar State Manager] Future Me projection updated from: ${source}`);
  notifyStateChange('projection_updated', {
    previousProjection,
    newProjection: futureMeProjection,
    source,
    updatedFields: Object.keys(intercepted.futureMeUpdates)
  });
  
  return {
    success: true,
    projection: futureMeProjection,
    updatedFields: Object.keys(intercepted.futureMeUpdates),
    blockedFields: Object.keys(intercepted.blocked)
  };
}

export function processDailyLogForAvatar(dailyLogData, zoneId = null) {
  console.log('📊 [Avatar State Manager] Processing daily log for avatar');
  
  const result = updateFutureMeProjection(dailyLogData, zoneId ? 'zone_log' : 'daily_log');
  
  return {
    currentMeUpdated: false,
    futureMeUpdated: true,
    result
  };
}

export function processDeviceDataForAvatar(deviceData, providerName) {
  console.log(`📱 [Avatar State Manager] Processing device data from: ${providerName}`);
  
  const result = updateFutureMeProjection(deviceData, 'device');
  
  return {
    currentMeUpdated: false,
    futureMeUpdated: true,
    provider: providerName,
    result
  };
}

export function getAvatarState() {
  return {
    currentMe: {
      baseline: currentMeBaseline,
      isLocked: baselineLocked,
      lastUpdate: lastBaselineUpdate
    },
    futureMe: {
      projection: futureMeProjection,
      isDynamic: true,
      lastUpdate: lastProjectionUpdate
    },
    meta: {
      stateManagerVersion: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };
}

export function subscribeToStateChanges(listener) {
  stateChangeListeners.push(listener);
  
  return () => {
    const index = stateChangeListeners.indexOf(listener);
    if (index > -1) {
      stateChangeListeners.splice(index, 1);
    }
  };
}

export function resetAvatarState() {
  currentMeBaseline = null;
  futureMeProjection = null;
  baselineLocked = true;
  lastBaselineUpdate = null;
  lastProjectionUpdate = null;
  
  console.log('🔄 [Avatar State Manager] Avatar state RESET');
  notifyStateChange('state_reset', {});
}

export function validateBaselineIntegrity() {
  if (!currentMeBaseline) {
    return { valid: false, reason: 'no_baseline' };
  }
  
  if (!baselineLocked) {
    return { valid: false, reason: 'baseline_unlocked' };
  }
  
  const requiredFields = ['activity', 'nutrition', 'sleep', 'stress'];
  const missingFields = requiredFields.filter(f => currentMeBaseline[f] === undefined);
  
  if (missingFields.length > 0) {
    return { valid: false, reason: 'missing_fields', fields: missingFields };
  }
  
  return { valid: true };
}

export default {
  initializeCurrentMeBaseline,
  getCurrentMeBaseline,
  isBaselineLocked,
  unlockBaseline,
  lockBaseline,
  updateCurrentMeBaseline,
  attemptBaselineUpdate,
  initializeFutureMeProjection,
  getFutureMeProjection,
  updateFutureMeProjection,
  processDailyLogForAvatar,
  processDeviceDataForAvatar,
  getAvatarState,
  subscribeToStateChanges,
  resetAvatarState,
  validateBaselineIntegrity
};
