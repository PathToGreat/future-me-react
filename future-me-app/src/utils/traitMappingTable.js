const TRAIT_MAPPING_TABLE = {
  vitality: [
    { source: 'health.activity', weight: 0.30, polarity: 1, smoothing: 0.3 },
    { source: 'health.sleep', weight: 0.25, polarity: 1, smoothing: 0.3 },
    { source: 'health.nutrition', weight: 0.20, polarity: 1, smoothing: 0.3 },
    { source: 'health.stress', weight: 0.15, polarity: -1, smoothing: 0.4 },
    { source: 'zone.health', weight: 0.10, polarity: 1, smoothing: 0.5 }
  ],

  resilience: [
    { source: 'health.stress', weight: 0.25, polarity: -1, smoothing: 0.4 },
    { source: 'health.sleep', weight: 0.20, polarity: 1, smoothing: 0.3 },
    { source: 'health.activity', weight: 0.15, polarity: 1, smoothing: 0.3 },
    { source: 'zone.health', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'zone.faith', weight: 0.10, polarity: 1, smoothing: 0.5 },
    { source: 'consistency.logging', weight: 0.15, polarity: 1, smoothing: 0.6 }
  ],

  emotionalStability: [
    { source: 'health.stress', weight: 0.30, polarity: -1, smoothing: 0.4 },
    { source: 'health.sleep', weight: 0.20, polarity: 1, smoothing: 0.3 },
    { source: 'zone.socialEmotional', weight: 0.20, polarity: 1, smoothing: 0.5 },
    { source: 'zone.faith', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'zone.family', weight: 0.15, polarity: 1, smoothing: 0.5 }
  ],

  discipline: [
    { source: 'consistency.logging', weight: 0.30, polarity: 1, smoothing: 0.6 },
    { source: 'consistency.habitCompletion', weight: 0.25, polarity: 1, smoothing: 0.5 },
    { source: 'health.activity', weight: 0.15, polarity: 1, smoothing: 0.3 },
    { source: 'health.nutrition', weight: 0.15, polarity: 1, smoothing: 0.3 },
    { source: 'zone.wealth', weight: 0.15, polarity: 1, smoothing: 0.5 }
  ],

  confidence: [
    { source: 'consistency.logging', weight: 0.20, polarity: 1, smoothing: 0.6 },
    { source: 'consistency.habitCompletion', weight: 0.20, polarity: 1, smoothing: 0.5 },
    { source: 'zone.health', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'zone.wealth', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'zone.socialEmotional', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'health.stress', weight: 0.15, polarity: -1, smoothing: 0.4 }
  ],

  socialConnectedness: [
    { source: 'zone.socialEmotional', weight: 0.30, polarity: 1, smoothing: 0.5 },
    { source: 'zone.community', weight: 0.30, polarity: 1, smoothing: 0.5 },
    { source: 'zone.family', weight: 0.25, polarity: 1, smoothing: 0.5 },
    { source: 'health.stress', weight: 0.15, polarity: -1, smoothing: 0.4 }
  ],

  purposeAlignment: [
    { source: 'zone.faith', weight: 0.35, polarity: 1, smoothing: 0.5 },
    { source: 'zone.community', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'zone.family', weight: 0.15, polarity: 1, smoothing: 0.5 },
    { source: 'consistency.logging', weight: 0.15, polarity: 1, smoothing: 0.6 },
    { source: 'zone.socialEmotional', weight: 0.10, polarity: 1, smoothing: 0.5 },
    { source: 'health.stress', weight: 0.10, polarity: -1, smoothing: 0.4 }
  ]
};

function getMappingsForTrait(traitId) {
  return TRAIT_MAPPING_TABLE[traitId] || [];
}

function getTraitsInfluencedBySource(sourceKey) {
  const results = [];
  for (const [traitId, mappings] of Object.entries(TRAIT_MAPPING_TABLE)) {
    for (const mapping of mappings) {
      if (mapping.source === sourceKey) {
        results.push({ traitId, ...mapping });
      }
    }
  }
  return results;
}

function validateMappingTable() {
  const issues = [];
  for (const [traitId, mappings] of Object.entries(TRAIT_MAPPING_TABLE)) {
    const totalWeight = mappings.reduce((sum, m) => sum + m.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      issues.push(`${traitId}: weights sum to ${totalWeight.toFixed(2)}, expected 1.00`);
    }
  }
  return { valid: issues.length === 0, issues };
}

export {
  TRAIT_MAPPING_TABLE,
  getMappingsForTrait,
  getTraitsInfluencedBySource,
  validateMappingTable
};
