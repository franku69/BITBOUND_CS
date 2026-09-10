/* Encounter definitions stay independent of simulation and drawing. */
( () => {
  'use strict';
  const definitions = {
    slime: {
      name: 'Bit Slime',
      design: 'bit_slime',
      behavior: 'hop',
      hp: 2,
      w: 30,
      h: 24,
      speed: .8,
      jump: 6,
      minWorld: 0,
      color: '#72f0a6',
      voice: 'bubble'
    },
    bat: {
      name: 'Packet Bat',
      design: 'packet_bat',
      behavior: 'fly',
      hp: 2,
      w: 28,
      h: 20,
      speed: 1.7,
      minWorld: 1,
      color: '#b693ff',
      voice: 'chirp'
    },
    bug: {
      name: 'Data Beetle',
      design: 'data_beetle',
      behavior: 'shoot',
      hp: 3,
      w: 30,
      h: 24,
      speed: 1.1,
      minWorld: 2,
      color: '#ffa36d',
      voice: 'clank'
    },
    frog: {
      name: 'Buffer Frog',
      design: 'buffer_frog',
      behavior: 'hop',
      hp: 2,
      w: 32,
      h: 26,
      speed: 1.2,
      jump: 8,
      minWorld: 0,
      color: '#8cdc72',
      voice: 'croak'
    },
    moth: {
      name: 'Spark Moth',
      design: 'spark_moth',
      behavior: 'flyShoot',
      hp: 2,
      w: 32,
      h: 28,
      speed: 1.2,
      minWorld: 1,
      color: '#ffcc72',
      voice: 'flutter'
    },
    crab: {
      name: 'Moss Crab',
      design: 'moss_crab',
      behavior: 'walk',
      hp: 4,
      w: 32,
      h: 24,
      speed: .65,
      minWorld: 2,
      color: '#80c2a2',
      voice: 'clank'
    },
    crawler: {
      name: 'Gear Crawler',
      design: 'gear_crawler',
      behavior: 'walk',
      hp: 3,
      w: 32,
      h: 24,
      speed: 1.6,
      minWorld: 3,
      color: '#dda76b',
      voice: 'rattle'
    },
    wisp: {
      name: 'Glitch Wisp',
      design: 'glitch_wisp',
      behavior: 'flyShoot',
      hp: 3,
      w: 26,
      h: 30,
      speed: 1.35,
      minWorld: 4,
      color: '#bd95ff',
      voice: 'wisp'
    },
    mimic: {
      name: 'Null Mimic',
      design: 'null_mimic',
      behavior: 'hop',
      hp: 4,
      w: 32,
      h: 28,
      speed: .9,
      jump: 5,
      minWorld: 5,
      color: '#eacb73',
      voice: 'chomp'
    }
  };
  const MOBS = Object.freeze(Object.fromEntries(Object.entries(definitions).map( ([id, spec]) => [id, Object.freeze({ id, ... spec })])));
  // Precomputed pools make each encounter selection O(1); common early creatures recur.
  const pools = Object.freeze(Array.from({ length: 8 }, (_, level) => Object.freeze(Object.keys(MOBS).filter(id => MOBS[id].minWorld <= level))));
  function choose(level, random = Math.random) {
    const pool = pools[Math.max(0, Math.min(7, level | 0))];
    return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
  }
  const isFlying = spec => spec.behavior === 'fly' || spec.behavior === 'flyShoot';
  window.BitboundEncounters = Object.freeze({
    MOBS,
    pools,
    choose,
    isFlying,
    MAX_ENEMIES: 18,
    RESPAWN_SECONDS: 18
  });
})();
