function normalizeWeaponState() {
  if (!Array.isArray(state.weapons)) state.weapons = ['data_blade'];
  state.weapons = [... new Set(state.weapons.filter(id => WEAPONS[id]))];
  if (!state.weapons.includes('data_blade')) state.weapons.unshift('data_blade');
  state.weaponIndex = clamp(Number.isFinite(state.weaponIndex) ? Math.floor(state.weaponIndex): 0, 0, state.weapons.length - 1);
}
function currentWeapon() {
  return WEAPONS[state.weapons[state.weaponIndex]] || WEAPONS.data_blade;
}
function ownsWeapon(id) {
  return state.weapons.includes(id);
}
function weaponAlreadyDropped(id) {
  return state.loot.some(l => l.alive && l.weaponId === id);
}
function grantWeapon(id, { equip = true, announce = true, source = 'DROP' } = {}) {
  const w = WEAPONS[id];
  if (!w) return false;
  normalizeWeaponState();
  if (ownsWeapon(id)) {
    if (equip) state.weaponIndex = state.weapons.indexOf(id);
    updateHotbar();
    return false;
  }
  state.weapons.push(id);
  if (equip) state.weaponIndex = state.weapons.length - 1;
  state.score += 35;
  state.selected = 0;
  updateHotbar();
  sfx.pickup();
  sfx.equip();
  if (announce) toast(`${source}: ${w.name.toUpperCase()} ACQUIRED! Press Q to cycle weapons.`, '#ffd166');
  markStoryChanged();
  return true;
}
function cycleWeapon(step = 1) {
  if (!state.started || state.paused) return;
  normalizeWeaponState();
  if (state.weapons.length <= 1) {
    toast('No extra weapons yet. Enemies can drop gear and bosses always drop a weapon.', '#9bdcff');
    return;
  }
  state.weaponIndex = (state.weaponIndex + step + state.weapons.length) % state.weapons.length;
  state.selected = 0;
  updateHotbar();
  const w = currentWeapon();
  sfx.equip();
  toast(`EQUIPPED: ${w.name} • ${w.damage} damage${w.type==='ranged'?' • ranged':` • ${w.reach}px reach`}`, '#9bdcff');
}
function spawnWeaponDrop(id, x, y, { guaranteed = false, source = 'MOB' } = {}) {
  if (!WEAPONS[id] || ownsWeapon(id) || weaponAlreadyDropped(id)) return false;
  const drop = pushBounded(state.loot, {
    weaponId: id,
    x: x - 12,
    y: y - 16,
    w: 24,
    h: 24,
    vx: (Math.random() - .5) * 1.5,
    vy: - 4.5,
    t: 0,
    alive: true,
    guaranteed,
    source
  }, PERF.maxLoot);
  if (!drop) return false;
  burst(x, y, WEAPONS[id].color, 18);
  sfx.weaponDrop();
  return true;
}
function maybeDropMobWeapon(e) {
  const d = MOB_WEAPON_DROPS[e.type];
  if (!d) return;
  state.mobKills[e.type] = (state.mobKills[e.type] || 0) + 1;
  if (state.level < d.minLevel || ownsWeapon(d.weapon) || weaponAlreadyDropped(d.weapon)) return;
  if (state.mobKills[e.type] >= d.killThreshold) spawnWeaponDrop(d.weapon, e.x + e.w / 2, e.y + e.h / 2, { source: 'MOB DROP' });
}
function bossWeaponId(level = state.level) {
  return BOSS_WEAPON_BY_WORLD[clamp(level, 0, BOSS_WEAPON_BY_WORLD.length - 1)];
}
function dropBossWeapon(level, x, y) {
  const id = bossWeaponId(level);
  if (!id || ownsWeapon(id)) return false;
  return spawnWeaponDrop(id, x, y, { guaranteed: true, source: 'BOSS DROP' });
}
function grantBossRewardIfMissing(level = state.level, announce = false) {
  const id = bossWeaponId(level);
  if (!id || ownsWeapon(id)) return false;
  return grantWeapon(id, { equip: true, announce, source: 'BOSS DROP' });
}
function inferLegacyBossWeapons() {
  if (!Array.isArray(state.bossDefeated)) return;
  state.bossDefeated.forEach( (done, i) => {
    const id = bossWeaponId(i);
    if (done && id && !state.weapons.includes(id)) state.weapons.push(id);
  });
  normalizeWeaponState();
}
function nearestHostileTarget(maxRange = 560) {
  const p = playerCenter();
  let best = null, bestD = maxRange;
  enemyIndex.forEach(p.x - maxRange, p.x + maxRange, e => {
    if (!e.alive) return;
    const d = Math.hypot( (e.x + e.w / 2) - p.x, (e.y + e.h / 2) - p.y);
    if (d < bestD) {
      best = e;
      bestD = d;
    }
  });
  const b = state.boss;
  if (b && b.active && !b.dead) {
    const d = Math.hypot( (b.x + b.w / 2) - p.x, (b.y + b.h / 2) - p.y);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}
function firePlayerProjectile(w) {
  const p = playerCenter(), target = nearestHostileTarget();
  let tx = p.x + player.dir * 500, ty = p.y;
  if (target) {
    tx = target.x + target.w / 2;
    ty = target.y + target.h / 2;
  }
  const base = Math.atan2(ty - p.y, tx - p.x), shots = w.pellets || 1, spread = w.spread || 0;
  for (let i = 0; i < shots; i++) {
    const angle = base + (i - (shots - 1) / 2) * spread;
    queueProjectile({
      x: p.x + player.dir * 14,
      y: p.y - 3,
      w: 10,
      h: 6,
      vx: Math.cos(angle) * w.speed,
      vy: Math.sin(angle) * w.speed,
      color: w.color,
      life: w.life || 2,
      alive: true,
      friendly: true,
      damage: w.damage,
      weaponId: w.id,
      pierce: w.pierce || 0,
      lastHitEnemyId: - 1
    });
  }
  if (w.sound) playActionCue(w.sound); else sfx.shoot();
}
function updateLoot(dt) {
  const bonus = currentPet().pickupBonus || 0, pickup = {
    x: player.x - 14 - bonus,
    y: player.y - 12 - bonus,
    w: player.w + 28 + bonus * 2,
    h: player.h + 24 + bonus * 2
  };
  for (const l of state.loot) {
    if (!l.alive) continue;
    l.t += dt;
    l.vy = Math.min(8, l.vy + GRAVITY * .55 * 60 * dt);
    l.x += l.vx * 60 * dt;
    if (tileCollisionRect(l.x, l.y, l.w, l.h)) {
      l.x -= l.vx * 60 * dt;
      l.vx *= - .35;
    }
    l.y += l.vy * 60 * dt;
    if (tileCollisionRect(l.x, l.y, l.w, l.h)) {
      l.y -= l.vy * 60 * dt;
      if (l.vy > 0) l.vy = 0; else l.vy *= - .2;
    }
    if (rects(pickup, l) || (l.guaranteed && l.t > 2.2)) {
      l.alive = false;
      grantWeapon(l.weaponId, { equip: true, announce: true, source: l.source });
    }
  }
  compactInPlace(state.loot, l => l.alive);
}
