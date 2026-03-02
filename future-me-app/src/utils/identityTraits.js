const IDENTITY_TRAITS = {
  vitality: {
    id: 'vitality',
    label: 'Vitality',
    description: 'Physical energy capacity and recovery efficiency'
  },
  resilience: {
    id: 'resilience',
    label: 'Resilience',
    description: 'Ability to absorb stress and recover from setbacks'
  },
  emotionalStability: {
    id: 'emotionalStability',
    label: 'Emotional Stability',
    description: 'Consistency of emotional regulation under varying conditions'
  },
  discipline: {
    id: 'discipline',
    label: 'Discipline',
    description: 'Behavioral reliability and follow-through over time'
  },
  confidence: {
    id: 'confidence',
    label: 'Confidence',
    description: 'Self-trust derived from consistent action and measurable progress'
  },
  socialConnectedness: {
    id: 'socialConnectedness',
    label: 'Social Connectedness',
    description: 'Depth and frequency of meaningful interpersonal engagement'
  },
  purposeAlignment: {
    id: 'purposeAlignment',
    label: 'Purpose Alignment',
    description: 'Coherence between daily actions and stated values or faith commitments'
  }
};

function createEmptyTraitState(traitId) {
  return {
    traitId,
    currentScore: 50,
    baselineScore: 50,
    sevenDayAvg: 50,
    thirtyDayAvg: 50,
    velocity: 0,
    projected12Month: 50,
    projected5Year: 50
  };
}

function createEmptyIdentityState() {
  const state = {};
  for (const id of Object.keys(IDENTITY_TRAITS)) {
    state[id] = createEmptyTraitState(id);
  }
  return state;
}

function getTraitIds() {
  return Object.keys(IDENTITY_TRAITS);
}

function getTraitMeta(traitId) {
  return IDENTITY_TRAITS[traitId] || null;
}

export {
  IDENTITY_TRAITS,
  createEmptyTraitState,
  createEmptyIdentityState,
  getTraitIds,
  getTraitMeta
};
