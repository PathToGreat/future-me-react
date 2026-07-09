import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STRENGTHENING_IMG = '/demo/future-me-strengthening.webp';
const DECLINING_IMG     = '/demo/future-me-declining.webp';

const CONTROLS = [
  { id: 'sleep',     label: 'Sleep',     emoji: '💤', options: ['Poor', 'Okay', 'Restful'] },
  { id: 'nutrition', label: 'Nutrition', emoji: '🌱', options: ['Poor', 'Mixed', 'Balanced'] },
  { id: 'movement',  label: 'Movement',  emoji: '💪', options: ['Rare', 'Some', 'Regular'] },
  { id: 'stress',    label: 'Stress',    emoji: '⚖️', options: ['High', 'Moderate', 'Managed'] },
];

const TRAITS = [
  { id: 'vitality',   label: 'Vitality',            inputs: ['sleep', 'movement'] },
  { id: 'discipline', label: 'Discipline',          inputs: ['nutrition', 'movement'] },
  { id: 'stability',  label: 'Emotional Stability', inputs: ['stress', 'sleep'] },
  { id: 'resilience', label: 'Resilience',          inputs: ['stress', 'movement'] },
];

const TIERS = {
  advancing: {
    status: 'Advancing',
    dot: 'bg-green-500',
    text: 'text-green-700',
    chip: 'bg-green-50 border-green-200',
    reflection:
      'Restful sleep and regular movement are compounding. Energy, focus, and confidence are trending upward — the direction is strengthening.',
    summary:
      'Consistent sleep, balanced nutrition, and regular movement are projected to increase energy, improve health, and support a calmer, more focused mindset.',
  },
  stabilizing: {
    status: 'Stabilizing',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    chip: 'bg-amber-50 border-amber-200',
    reflection:
      'The pattern is holding steady, but not building. A stronger routine in one or two areas could tip the direction upward.',
    summary:
      'Small daily choices compound. Strengthening sleep, nutrition, movement, or stress management can shift this steady pattern into forward motion.',
  },
  declining: {
    status: 'Declining',
    dot: 'bg-red-500',
    text: 'text-red-700',
    chip: 'bg-red-50 border-red-200',
    reflection:
      'Low sleep and high stress are compounding quietly. Left unchanged, this pattern points toward lower energy and a heavier daily load.',
    summary:
      'Small daily choices compound. Improving sleep, nutrition, movement, and stress management can shift the trajectory toward more energy and better health.',
  },
};

const FLOW_STEPS = ['Behavior', 'Patterns', 'Identity', 'Trajectory', 'Visualization'];

const APP_PREVIEWS = [
  { emoji: '📊', title: 'Dashboard',          desc: 'Your wellness score, life zones, and current trajectory at a glance.' },
  { emoji: '✓',  title: "Today's Reflection", desc: 'A quick daily check-in that keeps your patterns honest.' },
  { emoji: '🎯', title: 'Core Habits',         desc: 'Build the small routines that move your direction.' },
  { emoji: '⭐', title: 'Avatar',              desc: 'A visual reflection that responds to the patterns you build.' },
  { emoji: '➡️', title: 'Future Lab',          desc: 'A photorealistic look at the direction your patterns point.' },
  { emoji: '📈', title: 'Connected Inputs',    desc: 'Sleep, movement, nutrition, and stress signals feed the picture.' },
];

export default function DirectionDemo() {
  const [inputs, setInputs] = useState({
    sleep: 2,
    nutrition: 2,
    movement: 2,
    stress: 2,
  });

  const score = inputs.sleep + inputs.nutrition + inputs.movement + inputs.stress; // 0–8

  const tierKey = score >= 5 ? 'advancing' : score >= 3 ? 'stabilizing' : 'declining';
  const tier = TIERS[tierKey];
  const imageSrc = score >= 5 ? STRENGTHENING_IMG : DECLINING_IMG;
  const percent = Math.round(22 + score * 7.5); // 22–82

  const traitValues = useMemo(
    () =>
      TRAITS.map(t => ({
        ...t,
        value: 25 + (t.inputs.reduce((sum, id) => sum + inputs[id], 0)) * 15, // 25–85
      })),
    [inputs]
  );

  const setLevel = (id, level) => setInputs(prev => ({ ...prev, [id]: level }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      className="max-w-5xl mx-auto mb-16"
    >
      {/* ── Section header ─────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            See Direction in Action
          </span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Small daily patterns become long-term direction. Explore how different choices can change the path.
        </p>
      </div>

      <div className="card bg-white/80 backdrop-blur-sm p-6 md:p-10">
        {/* ── Controls ─────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CONTROLS.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{c.emoji}</span>
                <span className="font-semibold text-gray-800">{c.label}</span>
              </div>
              <div className="flex rounded-lg bg-gray-200/70 p-1" role="group" aria-label={`${c.label} level`}>
                {c.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLevel(c.id, i)}
                    aria-pressed={inputs[c.id] === i}
                    className={`flex-1 text-xs sm:text-sm py-1.5 rounded-md transition-all font-medium ${
                      inputs[c.id] === i
                        ? 'bg-white text-primary-700 shadow'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Comparison image + status ────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 aspect-[3/2]">
              {/* Both images stay mounted so switching is instant */}
              <img
                src={DECLINING_IMG}
                alt="Sample comparison showing a declining trajectory"
                width="1280"
                height="853"
                aria-hidden={imageSrc !== DECLINING_IMG}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageSrc === DECLINING_IMG ? 'opacity-100' : 'opacity-0'}`}
              />
              <img
                src={STRENGTHENING_IMG}
                alt="Sample comparison showing a strengthening trajectory"
                width="1280"
                height="853"
                aria-hidden={imageSrc !== STRENGTHENING_IMG}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageSrc === STRENGTHENING_IMG ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Trajectory status */}
            <div className={`rounded-xl border p-4 ${tier.chip}`}>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Trajectory Status</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${tier.dot}`} />
                <span className={`text-lg font-bold ${tier.text}`}>{tier.status}</span>
                <span className="text-lg font-bold text-gray-800 ml-auto">{percent}%</span>
              </div>
            </div>

            {/* Identity traits */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">Identity Traits</div>
              <div className="space-y-2.5">
                {traitValues.map(t => (
                  <div key={t.id}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-gray-700">{t.label}</span>
                      <span className="text-gray-500 font-medium">{t.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                        animate={{ width: `${t.value}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Reflection */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Today's Reflection</div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tierKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  {tier.reflection}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Transformation summary ───────────────────────────────── */}
        <div className="mt-6 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 p-4 md:p-5 flex gap-3 items-start">
          <span className="text-xl leading-none mt-0.5">➡️</span>
          <AnimatePresence mode="wait">
            <motion.p
              key={tierKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-sm md:text-base text-gray-700"
            >
              <span className="font-semibold text-gray-800">Key Transformation: </span>
              {tier.summary}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── Demo note ────────────────────────────────────────────── */}
        <p className="text-xs text-gray-400 text-center mt-4">
          This is a sample demonstration. Your own Future Me is built from your actual patterns over time.
        </p>
      </div>

      {/* ── System flow ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="mt-16 text-center"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-6">How It Works</h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 mb-6">
          {FLOW_STEPS.map((step, i) => (
            <div key={step} className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
              <div className="px-5 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm font-semibold text-gray-700">
                {step}
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <span className="text-gray-400 text-lg rotate-90 md:rotate-0" aria-hidden="true">➡️</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Future Me translates everyday patterns into meaningful insights about the direction those patterns are producing.
        </p>
      </motion.div>

      {/* ── App preview ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="mt-16"
      >
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">Inside the App</h3>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">
          Once you begin, Future Me becomes your personal reflection space.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APP_PREVIEWS.map(item => (
            <div
              key={item.title}
              className="card bg-white/80 backdrop-blur-sm p-5 hover:shadow-lg transition-shadow"
            >
              <div className="w-11 h-11 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl">{item.emoji}</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
