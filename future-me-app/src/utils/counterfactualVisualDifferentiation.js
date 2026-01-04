const PROJECTION_VISUAL_CONFIG = {
  overlayOpacity: 0.12,
  borderStyle: 'subtle',
  saturationReduction: 0.92,
  contrastSoftening: 0.95,
  glowDampening: 0.7,
  labelStyle: 'minimal'
};

const RESTRAINT_MULTIPLIERS = {
  postureIntensity: 0.85,
  expressionIntensity: 0.88,
  effectIntensity: 0.75,
  transitionSpeed: 1.2
};

export function applyProjectionVisualDifferentiation(projectedState) {
  if (!projectedState) return null;

  const differentiatedState = { ...projectedState };

  if (differentiatedState.postureScore !== undefined) {
    differentiatedState.postureScore = applyRestraint(
      differentiatedState.postureScore,
      50,
      RESTRAINT_MULTIPLIERS.postureIntensity
    );
  }

  if (differentiatedState.expressionScore !== undefined) {
    differentiatedState.expressionScore = applyRestraint(
      differentiatedState.expressionScore,
      50,
      RESTRAINT_MULTIPLIERS.expressionIntensity
    );
  }

  if (differentiatedState.glowIntensity !== undefined) {
    differentiatedState.glowIntensity *= PROJECTION_VISUAL_CONFIG.glowDampening;
  }

  if (differentiatedState.saturationLevel !== undefined) {
    differentiatedState.saturationLevel *= PROJECTION_VISUAL_CONFIG.saturationReduction;
  }

  differentiatedState.visualDifferentiation = {
    isProjection: true,
    overlayOpacity: PROJECTION_VISUAL_CONFIG.overlayOpacity,
    borderStyle: PROJECTION_VISUAL_CONFIG.borderStyle,
    transitionMultiplier: RESTRAINT_MULTIPLIERS.transitionSpeed
  };

  differentiatedState.isCounterfactual = true;

  return differentiatedState;
}

function applyRestraint(score, center, multiplier) {
  const deviation = score - center;
  const restrainedDeviation = deviation * multiplier;
  return center + restrainedDeviation;
}

export function getProjectionOverlayStyles() {
  return {
    position: 'absolute',
    inset: 0,
    backgroundColor: `rgba(59, 130, 246, ${PROJECTION_VISUAL_CONFIG.overlayOpacity})`,
    borderRadius: 'inherit',
    pointerEvents: 'none'
  };
}

export function getProjectionBorderStyles() {
  return {
    border: '2px dashed rgba(59, 130, 246, 0.35)',
    borderRadius: '1rem'
  };
}

export function getProjectionLabelStyles() {
  return {
    fontSize: '0.7rem',
    color: 'rgba(59, 130, 246, 0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };
}

export function validateProjectionNotExaggerated(projectedState, realState) {
  if (!projectedState || !realState) return { isValid: true, issues: [] };

  const issues = [];

  const postureChange = Math.abs((projectedState.postureScore || 50) - (realState.postureScore || 50));
  const expressionChange = Math.abs((projectedState.expressionScore || 50) - (realState.expressionScore || 50));

  const maxAllowedChange = 30;

  if (postureChange > maxAllowedChange) {
    issues.push({
      field: 'posture',
      severity: 'high',
      description: 'Projection posture change exceeds restraint threshold'
    });
  }

  if (expressionChange > maxAllowedChange) {
    issues.push({
      field: 'expression',
      severity: 'high',
      description: 'Projection expression change exceeds restraint threshold'
    });
  }

  if (projectedState.glowIntensity > 0.3) {
    issues.push({
      field: 'glow',
      severity: 'medium',
      description: 'Projection glow intensity too prominent'
    });
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

export function enforceProjectionRestraint(projectedState, realState) {
  const validation = validateProjectionNotExaggerated(projectedState, realState);

  if (validation.isValid) {
    return projectedState;
  }

  const corrected = { ...projectedState };

  for (const issue of validation.issues) {
    switch (issue.field) {
      case 'posture':
        corrected.postureScore = constrainToRange(
          projectedState.postureScore,
          realState.postureScore,
          30
        );
        break;
      case 'expression':
        corrected.expressionScore = constrainToRange(
          projectedState.expressionScore,
          realState.expressionScore,
          30
        );
        break;
      case 'glow':
        corrected.glowIntensity = Math.min(projectedState.glowIntensity, 0.25);
        break;
    }
  }

  corrected.restraintApplied = true;

  return corrected;
}

function constrainToRange(projected, real, maxChange) {
  const change = projected - real;
  if (Math.abs(change) <= maxChange) return projected;
  
  return real + (change > 0 ? maxChange : -maxChange);
}

export function isVisuallyDistinguishable(projectedState, realState) {
  if (!projectedState || !realState) return false;

  const postureChange = Math.abs((projectedState.postureScore || 50) - (realState.postureScore || 50));
  const expressionChange = Math.abs((projectedState.expressionScore || 50) - (realState.expressionScore || 50));

  return postureChange >= 3 || expressionChange >= 3;
}

export { PROJECTION_VISUAL_CONFIG, RESTRAINT_MULTIPLIERS };
