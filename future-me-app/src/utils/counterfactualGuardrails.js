const GUARDRAIL_CONFIG = {
  maxSessionDuration: 10 * 60 * 1000,
  preventTimelineLanguage: true,
  preventDramaticTransformation: true,
  respectPhaseADLimits: true,
  respectPhaseAELimits: true,
  underExpressionBias: 0.85
};

const FORBIDDEN_PROJECTION_PATTERNS = {
  impliesTimeline: [
    'in X days',
    'by next week',
    'in one month',
    'within',
    'after'
  ],
  impliesCertainty: [
    'will become',
    'guaranteed',
    'definitely',
    'certainly',
    'promised'
  ],
  impliesOutcome: [
    'achieve',
    'reach',
    'attain',
    'unlock',
    'earn'
  ]
};

export function validateProjectionIntegrity(projectedState, realState, sessionState) {
  const violations = [];

  if (sessionState?.entryTimestamp) {
    const sessionDuration = Date.now() - sessionState.entryTimestamp;
    if (sessionDuration > GUARDRAIL_CONFIG.maxSessionDuration) {
      violations.push({
        type: 'session_timeout',
        severity: 'warning',
        description: 'Projection session has exceeded recommended duration'
      });
    }
  }

  if (projectedState && realState) {
    const postureDeviation = Math.abs((projectedState.postureScore || 50) - (realState.postureScore || 50));
    const expressionDeviation = Math.abs((projectedState.expressionScore || 50) - (realState.expressionScore || 50));

    if (postureDeviation > 35 || expressionDeviation > 35) {
      violations.push({
        type: 'dramatic_transformation',
        severity: 'high',
        description: 'Projection shows dramatic transformation that may imply unrealistic outcomes'
      });
    }
  }

  if (projectedState?.glowIntensity > 0.3) {
    violations.push({
      type: 'excessive_glow',
      severity: 'medium',
      description: 'Projection glow intensity exceeds trust-preservation limits'
    });
  }

  if (projectedState?.saturationLevel > 1.15) {
    violations.push({
      type: 'excessive_saturation',
      severity: 'medium',
      description: 'Projection saturation exceeds trust-preservation limits'
    });
  }

  return {
    isValid: violations.filter(v => v.severity === 'high').length === 0,
    violations,
    requiresCorrection: violations.length > 0
  };
}

export function enforceProjectionGuardrails(projectedState, realState) {
  if (!projectedState) return null;

  let corrected = { ...projectedState };

  const realPosture = realState?.postureScore || 50;
  const realExpression = realState?.expressionScore || 50;

  const maxDeviation = 30 * GUARDRAIL_CONFIG.underExpressionBias;

  if (Math.abs((corrected.postureScore || 50) - realPosture) > maxDeviation) {
    const direction = (corrected.postureScore || 50) > realPosture ? 1 : -1;
    corrected.postureScore = realPosture + (direction * maxDeviation);
  }

  if (Math.abs((corrected.expressionScore || 50) - realExpression) > maxDeviation) {
    const direction = (corrected.expressionScore || 50) > realExpression ? 1 : -1;
    corrected.expressionScore = realExpression + (direction * maxDeviation);
  }

  if (corrected.glowIntensity !== undefined) {
    corrected.glowIntensity = Math.min(corrected.glowIntensity, 0.2);
  }

  if (corrected.saturationLevel !== undefined) {
    corrected.saturationLevel = Math.min(corrected.saturationLevel, 1.1);
  }

  corrected.guardrailsEnforced = true;
  corrected.isCounterfactual = true;

  return corrected;
}

export function validateNoStateBleed(projectionSession) {
  if (!projectionSession) return { isClean: true, issues: [] };

  const issues = [];

  if (projectionSession.isActive && !projectionSession.realStateSnapshot) {
    issues.push({
      type: 'missing_snapshot',
      description: 'No real state snapshot available for restoration'
    });
  }

  if (!projectionSession.sessionId) {
    issues.push({
      type: 'missing_session_id',
      description: 'Projection session lacks unique identifier'
    });
  }

  return {
    isClean: issues.length === 0,
    issues
  };
}

export function ensureCleanExit(projectionSession, currentDisplayState) {
  if (!projectionSession?.realStateSnapshot) {
    return {
      success: false,
      restoredState: null,
      error: 'No real state snapshot available'
    };
  }

  const restoredState = { ...projectionSession.realStateSnapshot };

  restoredState.projectionResidueCheck = {
    hadProjection: true,
    cleanlyRestored: true,
    timestamp: Date.now()
  };

  return {
    success: true,
    restoredState,
    error: null
  };
}

export function getProjectionModeIndicator() {
  return {
    label: 'Exploring',
    sublabel: 'What sustained habits could look like',
    style: 'minimal',
    placement: 'top-corner'
  };
}

export function getExitConfirmationContent() {
  return {
    prompt: 'Return to your current state?',
    confirmLabel: 'Return',
    description: 'Your real avatar reflects where you are now.'
  };
}

export { GUARDRAIL_CONFIG, FORBIDDEN_PROJECTION_PATTERNS };
