/* ------------------------ Update Loop ----------------------- */
function update(dt) {
  if (!state.started || state.paused) return;
  state.gameTime += dt;
  if (touchInput.attack && player.attackCd <= 0) attack();
  const k = state.keys;
  let dir = ( (k['a'] || k['arrowleft'] ? - 1: 0) + (k['d'] || k['arrowright'] ? 1: 0)) || state.touchAxis;
  const dashing = player.dashTime > 0;
  const overclock = state.powerBuff > 0 ? 1.36: 1;
  if (dashing) {
    player.vx = player.dashDir * MOBILITY.dashSpeed * overclock;
    player.vy = lerp(player.vy, 0, .14);
  } else {
    const target = dir * MOBILITY.runSpeed * overclock;
    player.vx = lerp(player.vx, target, dir ? .23: .13);
    if (Math.abs(player.vx) < .02) player.vx = 0;
    if (dir) player.dir = Math.sign(dir);
  }
  const wasGrounded = player.onGround, fallSpeed = player.vy;
  if (!dashing) player.vy = Math.min(14, player.vy + GRAVITY * 60 * dt);
  if ( (k['s'] || k['arrowdown'] || touchInput.down) && !player.onGround && !dashing) player.vy = Math.min(MOBILITY.fastFallMax, player.vy + MOBILITY.fastFallAccel * 60 * dt);
  movePlayerX(player.vx * 60 * dt);
  movePlayerY(player.vy * 60 * dt);
  if (!wasGrounded && player.onGround && fallSpeed > 4) {
    playLandingSound(fallSpeed);
    playerAnimator.land();
  }
  if (player.onGround) player.airJumps = MOBILITY.airJumps;
  player.x = clamp(player.x, 0, COLS * TILE - player.w);
  if (state.level === 7 && plotState().finalPhase === 'barrier') player.x = Math.min(player.x, 198 * TILE - player.w);
  if (player.y > ROWS * TILE + 100) hurtPlayer(MAX_HEALTH);
  if (player.invuln > 0) player.invuln -= dt;
  if (player.attack > 0) player.attack -= dt;
  if (player.attackCd > 0) player.attackCd = Math.max(0, player.attackCd - dt * (state.powerBuff > 0 ? 1.7: 1));
  if (player.dashCd > 0) player.dashCd = Math.max(0, player.dashCd - dt * (state.powerBuff > 0 ? 1.6: 1));
  if (player.dashTime > 0) player.dashTime = Math.max(0, player.dashTime - dt);
  if (player.dropTimer > 0) player.dropTimer = Math.max(0, player.dropTimer - dt);
  if (state.powerCooldown > 0) state.powerCooldown = Math.max(0, state.powerCooldown - dt);
  if (state.powerBuff > 0) state.powerBuff = Math.max(0, state.powerBuff - dt);
  if (Math.abs(player.vx) > .3 && player.onGround) {
    player.runClock += dt;
    if (player.runClock > .12) {
      player.runClock = 0;
      player.runFrame = (player.runFrame + 1) % 4;
      if (player.runFrame % 2 === 0) playFootstep();
    }
  } else player.runFrame = 0;
  updateQuestionEncounters(dt);
  if (state.paused) return;
  updatePet(dt);
  updateParty(dt);
  if (state.paused) return;
  updateEncounters(dt);
  updateEnemies(dt);
  if (state.paused) return;
  updateBoss(dt);
  if (state.paused) return;
  updateLoot(dt);
  updateParticles(dt);
  updateInteractable();
  playerAnimator.update(dt, player, mentorMotionQuery.matches || PERF.mode === 'eco', state.currentInteract?.type === 'mentor');
  const tx = player.x + player.w / 2 - W * .46, ty = player.y + player.h / 2 - H * .55;
  state.camera.x = lerp(state.camera.x, clamp(tx, 0, COLS * TILE - W), .08);
  state.camera.y = lerp(state.camera.y, clamp(ty, 0, ROWS * TILE - H), .06);
  state.camera.shake = Math.max(0, state.camera.shake - 25 * dt);
  state.uiAccumulator += dt;
  if (state.uiAccumulator >= PERF.uiInterval) {
    state.uiAccumulator = 0;
    updateHud();
  }
}
// Timing is independent of gameplay. Paused/hidden scenes schedule no repeating work.
const simulationClock = new FixedStepClock({ hz: 60, maxSteps: 4 });
const frameScheduler = new FrameScheduler({ render: loop, shouldContinue: () => !document.hidden && state.started && !state.paused, frameMs: () => PERF.frameMs });
function resetFrameTiming() {
  simulationClock.reset();
  frameGovernor.reset();
  frameScheduler.stop();
}
function scheduleFrame() {
  if (!document.hidden) frameScheduler.request();
}
function loop(ts) {
  if (document.hidden || (!state.started && !UI.final.classList.contains('show'))) return;
  if (state.paused) {
    if (state.needsRender) {
      draw();
      state.needsRender = false;
    }
    return;
  }
  if (ts - state.timerUiTs >= 500) {
    state.timerUiTs = ts;
    updateRaceTimerDisplay();
  }
  const workStart = performance.now();
  simulationClock.advance(ts, update);
  draw();
  if (PERF.mode !== 'eco' && frameGovernor.record(ts, performance.now() - workStart, PERF.frameMs)) reduceVisualLoad();
}
