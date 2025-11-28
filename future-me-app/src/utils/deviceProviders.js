const PROVIDER_STATUS = {
  NOT_CONNECTED: 'not_connected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  SYNCING: 'syncing'
};

const PROVIDER_INFO = {
  apple_health: {
    id: 'apple_health',
    name: 'Apple Health',
    icon: '🍎',
    description: 'Sync sleep, activity, and heart rate from your Apple devices',
    platforms: ['ios'],
    metrics: ['sleep', 'activity', 'heart_rate', 'hrv']
  },
  google_fit: {
    id: 'google_fit',
    name: 'Google Fit',
    icon: '🏃',
    description: 'Sync fitness and wellness data from Android devices',
    platforms: ['android'],
    metrics: ['sleep', 'activity', 'heart_rate']
  },
  oura: {
    id: 'oura',
    name: 'Oura Ring',
    icon: '💍',
    description: 'Detailed sleep, readiness, and activity tracking',
    platforms: ['ios', 'android'],
    metrics: ['sleep', 'activity', 'hrv', 'stress']
  },
  garmin: {
    id: 'garmin',
    name: 'Garmin',
    icon: '⌚',
    description: 'Comprehensive fitness and health metrics',
    platforms: ['ios', 'android'],
    metrics: ['sleep', 'activity', 'heart_rate', 'hrv', 'stress']
  },
  whoop: {
    id: 'whoop',
    name: 'WHOOP',
    icon: '📈',
    description: 'Recovery, strain, and sleep performance data',
    platforms: ['ios', 'android'],
    metrics: ['sleep', 'activity', 'hrv', 'stress']
  }
};

export async function fetchAppleHealthData(userId) {
  console.log('📱 [STUB] Fetching Apple Health data for user:', userId);
  
  return {
    success: false,
    message: 'Apple Health integration not yet implemented',
    provider: 'apple_health',
    data: null
  };
}

export async function fetchGoogleFitData(userId) {
  console.log('📱 [STUB] Fetching Google Fit data for user:', userId);
  
  return {
    success: false,
    message: 'Google Fit integration not yet implemented',
    provider: 'google_fit',
    data: null
  };
}

export async function fetchOuraData(userId) {
  console.log('📱 [STUB] Fetching Oura Ring data for user:', userId);
  
  return {
    success: false,
    message: 'Oura Ring integration not yet implemented',
    provider: 'oura',
    data: null
  };
}

export async function fetchGarminData(userId) {
  console.log('📱 [STUB] Fetching Garmin data for user:', userId);
  
  return {
    success: false,
    message: 'Garmin integration not yet implemented',
    provider: 'garmin',
    data: null
  };
}

export async function fetchWhoopData(userId) {
  console.log('📱 [STUB] Fetching WHOOP data for user:', userId);
  
  return {
    success: false,
    message: 'WHOOP integration not yet implemented',
    provider: 'whoop',
    data: null
  };
}

export async function connectProvider(userId, providerId) {
  console.log(`🔗 [STUB] Connecting ${providerId} for user:`, userId);
  
  return {
    success: false,
    message: `${PROVIDER_INFO[providerId]?.name || providerId} connection not yet available`,
    providerId,
    status: PROVIDER_STATUS.NOT_CONNECTED
  };
}

export async function disconnectProvider(userId, providerId) {
  console.log(`🔌 [STUB] Disconnecting ${providerId} for user:`, userId);
  
  return {
    success: true,
    message: `${PROVIDER_INFO[providerId]?.name || providerId} disconnected`,
    providerId,
    status: PROVIDER_STATUS.NOT_CONNECTED
  };
}

export async function syncProviderData(userId, providerId) {
  console.log(`🔄 [STUB] Syncing ${providerId} data for user:`, userId);
  
  const providerFetchers = {
    apple_health: fetchAppleHealthData,
    google_fit: fetchGoogleFitData,
    oura: fetchOuraData,
    garmin: fetchGarminData,
    whoop: fetchWhoopData
  };

  const fetcher = providerFetchers[providerId];
  if (fetcher) {
    return await fetcher(userId);
  }

  return {
    success: false,
    message: 'Unknown provider',
    providerId
  };
}

export function getProviderInfo(providerId) {
  return PROVIDER_INFO[providerId] || null;
}

export function getAllProviders() {
  return Object.values(PROVIDER_INFO);
}

export { PROVIDER_STATUS, PROVIDER_INFO };
