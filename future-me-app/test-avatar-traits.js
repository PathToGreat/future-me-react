/**
 * Test file for Avatar Trait Engine
 * Run with: node test-avatar-traits.js
 */

import calculateAvatarTraits, { getExampleTraits } from './src/utils/avatarTraitEngine.js';

console.log('🧪 Testing Avatar Trait Map Engine...\n');
console.log('='.repeat(70));

// Test 1: Basic calculation with typical user data
console.log('\n📊 Test 1: Typical User Profile');
console.log('-'.repeat(70));

const typicalUser = {
  dailyMetrics: { sleep: 3, activity: 4, nutrition: 3, stress: 2 },
  wellnessScore: 65,
  lifeZones: { 
    health: 70, 
    socialEmotional: 60, 
    wealth: 55, 
    faith: 65, 
    family: 60, 
    community: 55 
  },
  habitStreaks: [10, 7, 3],
  achievements: Array(5).fill({ id: 'test' })
};

const typicalTraits = calculateAvatarTraits(typicalUser);
console.log('\nTraits for Typical User:');
console.log('  Posture:', typicalTraits.posture.score, '-', typicalTraits.posture.label);
console.log('  Body Shape:', typicalTraits.bodyShape.score, '-', typicalTraits.bodyShape.label);
console.log('  Facial Expression:', typicalTraits.facialExpression.score, '-', typicalTraits.facialExpression.label);
console.log('  Glow/Energy:', typicalTraits.glowEnergy.score, '-', typicalTraits.glowEnergy.label);
console.log('  Movement Level:', typicalTraits.movementLevel.score, '-', typicalTraits.movementLevel.label);
console.log('  Aura/Presence:', typicalTraits.auraPresence.score, '-', typicalTraits.auraPresence.label);
console.log('\nOverall Score:', typicalTraits.summary.overallScore);
console.log('Dominant Traits:');
typicalTraits.summary.dominantTraits.forEach(t => {
  console.log(`  - ${t.trait}: ${t.label} (${t.score})`);
});

// Test 2: Edge case - missing data
console.log('\n\n📊 Test 2: Edge Case - Missing Data');
console.log('-'.repeat(70));

const emptyData = calculateAvatarTraits({});
console.log('\nTraits with Empty Data:');
console.log('  Posture:', emptyData.posture.score, '-', emptyData.posture.label);
console.log('  Body Shape:', emptyData.bodyShape.score, '-', emptyData.bodyShape.label);
console.log('  Facial Expression:', emptyData.facialExpression.score, '-', emptyData.facialExpression.label);
console.log('  Overall Score:', emptyData.summary.overallScore);

// Test 3: Built-in examples
console.log('\n\n📊 Test 3: Built-in Example Scenarios');
console.log('-'.repeat(70));

const examples = getExampleTraits();

console.log('\n🌟 High Performer:');
console.log('  Posture:', examples.highPerformer.posture.score, '-', examples.highPerformer.posture.label);
console.log('  Glow/Energy:', examples.highPerformer.glowEnergy.score, '-', examples.highPerformer.glowEnergy.label);
console.log('  Overall:', examples.highPerformer.summary.overallScore);

console.log('\n😓 Struggling Individual:');
console.log('  Posture:', examples.struggling.posture.score, '-', examples.struggling.posture.label);
console.log('  Glow/Energy:', examples.struggling.glowEnergy.score, '-', examples.struggling.glowEnergy.label);
console.log('  Overall:', examples.struggling.summary.overallScore);

console.log('\n⚖️ Balanced Beginner:');
console.log('  Posture:', examples.beginner.posture.score, '-', examples.beginner.posture.label);
console.log('  Glow/Energy:', examples.beginner.glowEnergy.score, '-', examples.beginner.glowEnergy.label);
console.log('  Overall:', examples.beginner.summary.overallScore);

// Test 4: Verify score boundaries
console.log('\n\n📊 Test 4: Score Boundary Verification');
console.log('-'.repeat(70));

const extremeHigh = calculateAvatarTraits({
  dailyMetrics: { sleep: 5, activity: 5, nutrition: 5, stress: 0 },
  wellnessScore: 100,
  lifeZones: { health: 100, socialEmotional: 100, wealth: 100, faith: 100, family: 100, community: 100 },
  habitStreaks: [100, 100, 100],
  achievements: Array(20).fill({ id: 'test' })
});

console.log('\nExtreme High Inputs:');
console.log('  All trait scores should be ≤ 100');
Object.entries(extremeHigh).forEach(([key, value]) => {
  if (value.score !== undefined) {
    console.log(`  ${key}: ${value.score} ${value.score <= 100 ? '✓' : '❌ OVERFLOW!'}`);
  }
});

const extremeLow = calculateAvatarTraits({
  dailyMetrics: { sleep: 0, activity: 0, nutrition: 0, stress: 5 },
  wellnessScore: 0,
  lifeZones: { health: 0, socialEmotional: 0, wealth: 0, faith: 0, family: 0, community: 0 },
  habitStreaks: [0, 0, 0],
  achievements: []
});

console.log('\nExtreme Low Inputs:');
console.log('  All trait scores should be ≥ 0');
Object.entries(extremeLow).forEach(([key, value]) => {
  if (value.score !== undefined) {
    console.log(`  ${key}: ${value.score} ${value.score >= 0 ? '✓' : '❌ UNDERFLOW!'}`);
  }
});

// Test 5: Output structure validation
console.log('\n\n📊 Test 5: Output Structure Validation');
console.log('-'.repeat(70));

const testTraits = calculateAvatarTraits(typicalUser);
const requiredTraits = ['posture', 'bodyShape', 'facialExpression', 'glowEnergy', 'movementLevel', 'auraPresence'];
const requiredFields = ['score', 'label', 'influences'];

console.log('\nValidating output structure:');
let allValid = true;

requiredTraits.forEach(trait => {
  const hasAllFields = requiredFields.every(field => testTraits[trait][field] !== undefined);
  const scoreInRange = testTraits[trait].score >= 0 && testTraits[trait].score <= 100;
  const hasLabel = typeof testTraits[trait].label === 'string';
  
  const isValid = hasAllFields && scoreInRange && hasLabel;
  console.log(`  ${trait}: ${isValid ? '✓' : '❌'}`);
  
  if (!isValid) allValid = false;
});

console.log('  timestamp:', testTraits.timestamp ? '✓' : '❌');
console.log('  summary.overallScore:', testTraits.summary.overallScore !== undefined ? '✓' : '❌');
console.log('  summary.dominantTraits:', Array.isArray(testTraits.summary.dominantTraits) ? '✓' : '❌');

console.log('\n' + '='.repeat(70));
console.log(allValid ? '✅ All tests passed!' : '❌ Some tests failed');
console.log('='.repeat(70) + '\n');
