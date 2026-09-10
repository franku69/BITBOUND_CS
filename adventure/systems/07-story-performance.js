/* Facial performance for all story shots. Shared scene time, zero timers and
 * zero new sprite-cache entries: complete faces are painted within the head rig.
 * Physical choreography retains sole ownership of limbs and held objects. */
function storySpeakerId(page) {
  if (page.speaker === '{name}') return 'hero';
  if (page.speaker === 'BYTE') return 'byte';
  const index = DAWN_COMPANY.findIndex(a => a.name === page.speaker);
  return index < 0 ? null: STORY_CAST_IDS[index];
}
function directStoryPerformance(f) {
  const id = storySpeakerId(f.page), speaker = f.actors.get(id), seconds = f.t * (f.page.durationMs || 8000) / 1000 + (f.ambientTime || 0);
  for (const a of f.actors.values()) {
    if (a.kind === 'boss') continue;
    const asleep = a.motion === 'sleep' || !!a.rotation, seed = ACTOR_PHASE[a.id] || 0;
    // Short phrases alternate with listening breaths; an idle page stays alive
    // without replaying a handover, injury, death or escape.
    const talking = a.id === id && !asleep && a.opacity !== 0 && (seconds + seed) % 3.9 < 2.8;
    const blink = (seconds + seed * 5) % 4.8;
    a.expression = {
      speaking: talking,
      syllable: Math.floor( (seconds + seed) * 7) % 4,
      blink: asleep || a.mood === 'blink' || blink > 4.63,
      gaze: speaker && speaker !== a ? Math.sign(speaker.x - a.x) * (a.face || 1): 0
    };
    a.clothTime = seconds + seed;
  }
  return f;
}
