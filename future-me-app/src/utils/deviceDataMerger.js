import { getAllDeviceDataForDate, getDeviceDataHistory } from './deviceIntegrationManager';
import { interceptDeviceData } from './avatarInputInterceptor';

const DEVICE_TO_METRIC_MAP = {
  sleep: {
    deviceField: 'value.sleepScore',
    manualField: 'sleep',
    scale: { device: [0, 100], manual: [1, 5] },
    name: 'Sleep Quality'
  },
  activity: {
    deviceField: 'value.activityScore',
    alternateDeviceField: 'value.activeMinutes',
    manualField: 'activity',
    scale: { device: [0, 100], manual: [1, 5] },
    name: 'Physical Activity'
  },
  stress: {
    deviceField: 'value.stressScore',
    manualField: 'stress',
    scale: { device: [0, 100], manual: [1, 5] },
    inverted: true,
    name: 'Stress Level'
  },
  heart_rate: {
    deviceField: 'value.restingHR',
    manualField: null,
    name: 'Heart Rate'
  },
  hrv: {
    deviceField: 'value.avgHRV',
    manualField: null,
    name: 'Heart Rate Variability'
  }
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function normalizeToManualScale(deviceValue, deviceScale, manualScale, inverted = false) {
  if (deviceValue === null || deviceValue === undefined) return null;
  
  const [devMin, devMax] = deviceScale;
  const [manMin, manMax] = manualScale;
  
  const normalized = (deviceValue - devMin) / (devMax - devMin);
  let manualValue = normalized * (manMax - manMin) + manMin;
  
  if (inverted) {
    manualValue = manMax - manualValue + manMin;
  }
  
  return Math.round(Math.max(manMin, Math.min(manMax, manualValue)));
}

export function convertDeviceToManualMetric(deviceData, metricType) {
  const mapping = DEVICE_TO_METRIC_MAP[metricType];
  if (!mapping || !deviceData) return null;
  
  let deviceValue = getNestedValue(deviceData, mapping.deviceField);
  
  if ((deviceValue === null || deviceValue === undefined) && mapping.alternateDeviceField) {
    deviceValue = getNestedValue(deviceData, mapping.alternateDeviceField);
    if (deviceValue !== null && metricType === 'activity') {
      deviceValue = Math.min(100, (deviceValue / 60) * 100);
    }
  }
  
  if (deviceValue === null || deviceValue === undefined) return null;
  
  if (!mapping.manualField) {
    return { value: deviceValue, source: 'device', raw: deviceData };
  }
  
  const convertedValue = normalizeToManualScale(
    deviceValue,
    mapping.scale.device,
    mapping.scale.manual,
    mapping.inverted
  );
  
  return {
    value: convertedValue,
    source: 'device',
    deviceSource: deviceData.source,
    raw: deviceData
  };
}

export async function getMergedMetricsForDate(userId, date, manualLogs) {
  if (!userId || !date) return { metrics: manualLogs, sources: {} };
  
  const deviceData = await getAllDeviceDataForDate(userId, date);
  
  if (Object.keys(deviceData).length > 0) {
    const providerName = Object.values(deviceData)[0]?.source || 'unknown';
    const routingResult = interceptDeviceData(deviceData, providerName);
    console.log('🔀 [Avatar Router] Device data intercepted:', {
      provider: providerName,
      futureMeUpdates: Object.keys(routingResult.futureMeUpdates),
      currentMeBlocked: Object.keys(routingResult.currentMeUpdates).length === 0
    });
  }
  
  const mergedMetrics = { ...manualLogs };
  const sources = {};
  
  if (deviceData.sleep) {
    const converted = convertDeviceToManualMetric(deviceData.sleep, 'sleep');
    if (converted !== null) {
      mergedMetrics.sleep = converted.value;
      sources.sleep = {
        type: 'device',
        provider: converted.deviceSource,
        rawScore: getNestedValue(deviceData.sleep, 'value.sleepScore'),
        manualFallback: manualLogs?.sleep
      };
    } else {
      sources.sleep = { type: 'manual' };
    }
  } else {
    sources.sleep = { type: 'manual' };
  }
  
  if (deviceData.activity) {
    const converted = convertDeviceToManualMetric(deviceData.activity, 'activity');
    if (converted !== null) {
      mergedMetrics.activity = converted.value;
      sources.activity = {
        type: 'device',
        provider: converted.deviceSource,
        steps: deviceData.activity.value?.steps,
        activeMinutes: deviceData.activity.value?.activeMinutes,
        manualFallback: manualLogs?.activity
      };
    } else {
      sources.activity = { type: 'manual' };
    }
  } else {
    sources.activity = { type: 'manual' };
  }
  
  if (deviceData.stress) {
    const converted = convertDeviceToManualMetric(deviceData.stress, 'stress');
    if (converted !== null) {
      mergedMetrics.stress = converted.value;
      sources.stress = {
        type: 'device',
        provider: converted.deviceSource,
        rawScore: getNestedValue(deviceData.stress, 'value.stressScore'),
        manualFallback: manualLogs?.stress
      };
    } else {
      sources.stress = { type: 'manual' };
    }
  } else {
    sources.stress = { type: 'manual' };
  }
  
  sources.nutrition = { type: 'manual' };
  
  if (deviceData.heart_rate) {
    sources.heartRate = {
      type: 'device',
      provider: deviceData.heart_rate.source,
      restingHR: deviceData.heart_rate.value?.restingHR,
      avgHR: deviceData.heart_rate.value?.averageHR
    };
  }
  
  if (deviceData.hrv) {
    sources.hrv = {
      type: 'device',
      provider: deviceData.hrv.source,
      avgHRV: deviceData.hrv.value?.avgHRV
    };
  }
  
  return { metrics: mergedMetrics, sources };
}

export async function getMergedHistoryData(userId, historyData, days = 30) {
  if (!userId || !historyData) return historyData;
  
  const mergedHistory = [];
  
  for (const dayData of historyData) {
    const { metrics, sources } = await getMergedMetricsForDate(userId, dayData.date, dayData);
    
    mergedHistory.push({
      ...dayData,
      ...metrics,
      dataSources: sources,
      hasDeviceData: Object.values(sources).some(s => s.type === 'device')
    });
  }
  
  return mergedHistory;
}

export function getDataSourceSummary(sources) {
  const summary = {
    deviceMetrics: [],
    manualMetrics: [],
    hasDeviceData: false
  };
  
  for (const [metric, source] of Object.entries(sources || {})) {
    if (source.type === 'device') {
      summary.deviceMetrics.push({
        metric,
        provider: source.provider
      });
      summary.hasDeviceData = true;
    } else {
      summary.manualMetrics.push(metric);
    }
  }
  
  return summary;
}

export function shouldUseDeviceDataForProjections(sources) {
  const deviceCount = Object.values(sources || {}).filter(s => s.type === 'device').length;
  return deviceCount >= 2;
}

export { DEVICE_TO_METRIC_MAP };
