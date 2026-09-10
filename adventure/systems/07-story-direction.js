/* Final acting pass. Pure scene data in -> scene data out. No timers, audio,
 * physics, duplicate actors or sprite copies belong here. Prop positions use
 * the same continuous pose as the hands that hold them. */
const STORY_CAST_IDS = Object.freeze(['aster', 'mira', 'rook', 'fern']);
const ACTOR_PHASE = Object.freeze({
  hero: .08,
  byte: .39,
  aster: .17,
  mira: .71,
  rook: .48,
  fern: .9,
  demon: .22
});
function directPose(actor, motion, phase, fromMotion = 'idle', blend = 1, fromPhase = phase) {
  if (!actor) return;
  Object.assign(actor, {
    motion,
    fromPhase,
    phase: clamp(phase, 0, 1),
    fromMotion,
    blend: clamp(blend, 0, 1)
  });
}
function attachStoryProp(frame, id, holder, extra = {}) {
  const prop = frame.props.find(p => p.id === id);
  if (!prop) return;
  delete prop.x;
  delete prop.y;
  Object.assign(prop, { holder, hand: 1 }, extra);
}
function directConversation(frame) {
  const t = frame.t, hero = frame.actors.get('hero'), beat = STORY_BEATS[frame.page.beat];
  for (const actor of frame.actors.values()) {
    if (actor.motion === 'idle') {
      actor.motion = 'listen';
      actor.phase = (t * .7 + (ACTOR_PHASE[actor.id] || 0)) % 1;
    }
    const speaking = actor.id === 'hero' ? frame.page.speaker === '{name}': actor.id === 'byte' ? frame.page.speaker === 'BYTE': actor.kind === 'ally' && frame.page.speaker === DAWN_COMPANY[actor.index].name;
    if (speaking && ['listen', 'wave', 'reach'].includes(actor.motion) && !actor.armed && !beat) {
      directPose(actor, 'speak', t);
      if (actor.id === 'byte' && frame.page.art === 'prison') directPose(actor, 'laugh', t);
    }
    // Listen with eyes and head; each actor has their own single blink.
    const blinkAt = .34 + (ACTOR_PHASE[actor.id] || 0) * .4;
    if (t > blinkAt && t < blinkAt + .027 && actor.mood !== 'shock' && actor.rotation === undefined) actor.mood = 'blink';
  }
  if (frame.stage === 'camp' && beat) {
    let slot = 0;
    for (const a of frame.actors.values()) if (a.kind === 'ally' && a.index !== beat.actor) {
      a.x = [430, 510, 586][slot];
      a.foot = [254, 260, 251][slot++];
      a.face = - 1;
      if (a.motion === 'listen' && a.index === 1) a.motion = 'sit';
    }
    const partner = frame.actors.get(STORY_CAST_IDS[beat.actor]);
    if (!hero || !partner) return;
    if (beat.verb === 'give') {
      const meet = rigEase( (t - .24) / .22);
      partner.x = lerp(310, 277, rigEase(t / .24));
      if (t >= .24) directPose(partner, 'offer', meet);
      directPose(hero, 'offer', meet);
      attachStoryProp(frame, beat.prop, t < .62 ? partner.id: 'hero');
      if (t > .68) {
        directPose(partner, 'offer', 1 - rigEase( (t - .68) / .28));
        directPose(hero, ['cup', 'bowl'].includes(beat.prop) ? 'drink': 'read', (t - .68) / .32, 'offer', rigEase( (t - .68) / .12), 1);
      }
    }
    if (beat.verb === 'invite' && t > .3) {
      partner.mood = t > .62 ? 'smile': 'calm';
      hero.mood = t > .72 ? 'smile': 'calm';
    }
  }
}
function directPrisonProps(frame) {
  const t = frame.t, hero = frame.actors.get('hero'), beat = frame.page.beat;
  if (!hero) return;
  if (beat === 'scroll') {
    directPose(hero, t < .32 ? 'kneel': 'read', rigEase( (t - .32) / .34), 'kneel', rigEase( (t - .32) / .34));
    const prop = frame.props.find(p => p.id === 'scroll');
    if (prop) {
      const hand = rigSocket(hero), u = rigEase(t / .32);
      prop.x = lerp(hand.x, 350, 1 - u);
      prop.y = lerp(251, hand.y, u);
      if (t >= .32) attachStoryProp(frame, 'scroll', 'hero');
    }
  }
  if (beat === 'forge') {
    const step = frame.page.forgeStep || 0;
    if (step === 0) {
      directPose(hero, 'read', .75);
      attachStoryProp(frame, 'dagger', 'hero', { angle: - .45 });
    }
    if (step === 1) {
      const cycle = t === 1 ? 1: t * 3 % 1;
      directPose(hero, 'forge', cycle);
      hero.phase = cycle;
      // The hammer is a real prop painted from this exact pose (no separate clock).
      frame.props.push({
        id: 'hammer',
        holder: 'hero',
        offset: { x: 0, y: 0 },
        followAngle: true
      });
    }
    if (step === 2) {
      directPose(hero, 'kneel', 0);
      attachStoryProp(frame, 'dagger', 'hero', { angle: Math.PI });
    }
    if (step === 3) attachStoryProp(frame, 'key', 'hero');
  }
  if (frame.page.escapeBeat === 0) {
    // The key stays in the lock until the door has slid clear; then in the hand.
    if (t < .6) {
      const key = frame.props.find(p => p.id === 'key');
      key.angle = Math.sin(clamp( (t - .05) / .2, 0, 1) * Math.PI) * .65;
    } else {
      hero.fromMotion = 'reach';
      hero.fromPhase = 1;
      hero.blend = rigEase( (t - .6) / .12);
      attachStoryProp(frame, 'key', 'hero');
    }
  }
  if (frame.page.escapeBeat === 3) {
    const u = rigEase( (t - .4) / .6);
    hero.x = lerp(262, 371, u);
    directPose(hero, t < .4 ? 'kneel': 'walk', t < .4 ? 0: Math.abs(hero.x - 262) / 42 % 1, 'kneel', rigEase( (t - .4) / .15));
    if (t >= .4) attachStoryProp(frame, 'pack', 'hero', { hand: 0, offset: { x: - 4, y: 5 } });
  }
}
function directBetrayal(frame) {
  const hero = frame.actors.get('hero'), verb = STORY_BEATS[frame.page.beat]?.verb, t = frame.t;
  if (!hero) return;
  if (verb === 'takePack') {
    const id = 'pack', actor = frame.actors.get('rook');
    directPose(actor, t < .45 ? 'kneel': 'read', rigEase( (t - .45) / .35), 'kneel', rigEase( (t - .45) / .35));
    const prop = frame.props.find(p => p.id === id), hand = rigSocket(actor), u = rigEase(t / .45);
    prop.x = lerp(267, hand.x, u);
    prop.y = lerp(259, hand.y, u);
    if (t >= .45) attachStoryProp(frame, id, actor.id);
  }
}
function directStoryCamera(frame) {
  if (frame.camera) return;
  const moving = ['arrival', 'reunion', 'escape', 'collapse', 'dawn', 'leap'].includes(frame.page.art);
  const crowded = frame.actors.size > 3;
  const push = rigEase(frame.t) * (moving ? .012: crowded ? .025: .065);
  frame.camera = { x: 320, y: 150 + push * 24, zoom: 1 + push };
  if (frame.page.art === 'impact') {
    const strike = .25 + .48 * .65, shock = Math.max(0, 1 - Math.abs(frame.t - strike) / .09);
    frame.camera.x += Math.sin(frame.t * 210) * shock * 1.8;
  }
  // A brief iris-like fade separates memories, never two overlaid casts.
  if (STORY_BEATS[frame.page.beat]?.verb === 'memories' && frame.transition === undefined) {
    const local = frame.t === 1 ? 1: frame.t * 3 % 1;
    frame.transition = Math.max(0, 1 - local / .12, 1 - (1 - local) / .12) * .7;
  }
}
function finishStoryDirection(frame) {
  directConversation(frame);
  directPrisonProps(frame);
  directBetrayal(frame);
  if (frame.effects.includes('gateRecall')) for (const a of frame.actors.values()) if (a.kind === 'ally') {
    const start = 470 + ['mira', 'fern', 'rook', 'aster'].indexOf(a.id) * 70, travel = Math.abs(a.x - start) / 42 % 1;
    const crouch = storyWindow(433 - a.x, 0, 35) * (1 - storyWindow(235 - a.x, 0, 35));
    if (crouch > 0) {
      directPose(a, 'crawl', travel, 'walk', crouch, travel);
      a.foot = 264;
    }
  }
  if (frame.page.beat === 'gateRegret') {
    frame.transition = Math.max(0, 1 - Math.abs(frame.t - .6) / .045);
  }
  directPhysicalInteractions(frame);
  directCinematicStory(frame);
  directStoryCamera(frame);
  return directStoryPerformance(frame);
}
