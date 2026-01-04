import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getProjectionOverlayStyles,
  getProjectionBorderStyles,
  getProjectionLabelStyles
} from '../utils/counterfactualVisualDifferentiation';
import { getProjectionModeIndicator, getExitConfirmationContent } from '../utils/counterfactualGuardrails';

export function CounterfactualExplorer({
  isActive,
  scenarios,
  activeScenarioId,
  onEnter,
  onExit,
  onChangeScenario,
  children
}) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleEnter = (scenarioId) => {
    onEnter(scenarioId);
  };

  const handleExitRequest = () => {
    setShowExitConfirm(true);
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    onExit();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
  };

  const indicator = getProjectionModeIndicator();
  const exitContent = getExitConfirmationContent();

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ExplorationEntryPoint
              scenarios={scenarios}
              onEnter={handleEnter}
            />
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <ProjectionModeIndicator
              label={indicator.label}
              sublabel={indicator.sublabel}
            />

            <div
              className="relative"
              style={getProjectionBorderStyles()}
            >
              <div style={getProjectionOverlayStyles()} />
              {children}
            </div>

            <ScenarioSelector
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onChange={onChangeScenario}
            />

            <ExitButton onExit={handleExitRequest} />

            <ExitConfirmation
              isOpen={showExitConfirm}
              content={exitContent}
              onConfirm={handleExitConfirm}
              onCancel={handleExitCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExplorationEntryPoint({ scenarios, onEnter }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-sm font-medium text-gray-700">
            Explore possibilities
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            See what sustained habits could look like
          </p>
        </div>
        <span className="text-gray-400 text-lg">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => onEnter(scenario.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors text-sm text-gray-700 hover:text-blue-700"
                >
                  {scenario.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Exploration only. Your real data stays unchanged.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectionModeIndicator({ label, sublabel }) {
  const labelStyles = getProjectionLabelStyles();

  return (
    <div className="mb-3 flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
        style={{ animationDuration: '2s' }}
      />
      <div>
        <span style={labelStyles}>{label}</span>
        <span className="text-xs text-gray-400 ml-2">{sublabel}</span>
      </div>
    </div>
  );
}

function ScenarioSelector({ scenarios, activeScenarioId, onChange }) {
  return (
    <div className="mt-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onChange(scenario.id)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors
              ${activeScenarioId === scenario.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
              }
            `}
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExitButton({ onExit }) {
  return (
    <button
      onClick={onExit}
      className="mt-4 w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
    >
      Return to current state
    </button>
  );
}

function ExitConfirmation({ isOpen, content, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl p-5 mx-4 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-medium text-gray-800 text-center">
          {content.prompt}
        </h3>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {content.description}
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Continue exploring
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            {content.confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CounterfactualExplorer;
