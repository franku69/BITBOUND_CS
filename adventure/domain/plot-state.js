/** Serializable plot schema and explicit migration for earlier manual saves. */
const PLOT_FLAGS = ['originSeen', 'prisonersMet', 'cageKey', 'partyFreed', 'betrayed', 'scrollRead', 'daggerFound', 'keyForged', 'escaped', 'rivalsSeen', 'paladinDefeated', 'fusionSeen', 'immortal'];
const FINAL_PHASES = ['none', 'paladin', 'barrier', 'demon', 'fused', 'complete'];
function newPlot() {
  return Object.assign(Object.fromEntries(PLOT_FLAGS.map(key => [key, false])), {
    version: 1,
    scene: null,
    scenePage: 0,
    forgeStep: 0,
    finalPhase: 'none',
    camps: [false, false, false]
  });
}
function validatePlot(raw, saved, scenes) {
  if (raw == null) {
    const p = newPlot();
    p.originSeen = true;
    p.prisonersMet = saved.level > 0;
    p.partyFreed = saved.level > 0;
    p.cageKey = !!saved.bossDefeated[0];
    for (const key of ['betrayed', 'scrollRead', 'daggerFound', 'keyForged', 'escaped']) p[key] = saved.level > 3;
    p.camps = p.camps.map( (_, i) => saved.level > i + 1);
    if (saved.assessmentPassed[7]) {
      p.rivalsSeen = p.paladinDefeated = true;
      p.finalPhase = 'demon';
    }
    if (saved.bossDefeated[7]) {
      p.fusionSeen = true;
      p.finalPhase = 'complete';
      p.immortal = !!saved.finished;
    }
    return p;
  }
  if (raw.version !== 1 || PLOT_FLAGS.some(key => typeof raw[key] !== 'boolean') || !FINAL_PHASES.includes(raw.finalPhase)) return null;
  if (!Array.isArray(raw.camps) || raw.camps.length !== 3 || raw.camps.some(flag => typeof flag !== 'boolean')) return null;
  if (!Number.isInteger(raw.forgeStep) || raw.forgeStep < 0 || raw.forgeStep > 3) return null;
  if (raw.scene !== null && raw.scene !== 'cell' && !Object.hasOwn(scenes, raw.scene)) return null;
  if (!Number.isInteger(raw.scenePage) || raw.scenePage < 0 || raw.scenePage >= (scenes[raw.scene]?.pages.length || 1)) return null;
  const p = newPlot();
  for (const key of Object.keys(p)) p[key] = raw[key];
  return p;
}
export { PLOT_FLAGS, FINAL_PHASES, newPlot, validatePlot };
