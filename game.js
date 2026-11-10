(() => {
  'use strict';
  const { Engine, Bodies, Body, Composite, Query } = Matter;
  const $ = id => document.getElementById(id);
  const arena = $('arena');
  const ctx = arena.getContext('2d', { alpha: false });
  const W = 1280, H = 650, FLOOR = 535, STEP = 1000 / 60;
  const DEPTH_MIN = -24, DEPTH_MAX = 30, DEPTH_SPEED = 145;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const pad = value => String(value).padStart(2, '0');
  const engine = Engine.create({ gravity: { x: 0, y: 1.65 } });
  const ground = Bodies.rectangle(W / 2, FLOOR + 60, W + 400, 120, { isStatic: true, friction: 0 });
  const walls = [Bodies.rectangle(-20, 200, 40, 1000, { isStatic: true }), Bodies.rectangle(W + 20, 200, 40, 1000, { isStatic: true })];
  Composite.add(engine.world, [ground, ...walls]);
  const attackTypes = {
    punch: { duration: .29, active: .085, end: .17, damage: 8, reach: 126, knockback: 3.5, energy: 8 },
    kick: { duration: .49, active: .16, end: .29, damage: 13, reach: 168, knockback: 6, energy: 11 },
    special: { duration: .69, active: .22, end: .38, damage: 26, reach: 206, knockback: 11, energy: 0 }
  };
  const levels = {
    easy: { speed: 2.5, delay: .64, block: .1, special: .08, aggression: .64 },
    normal: { speed: 3.1, delay: .38, block: .28, special: .17, aggression: .79 },
    hard: { speed: 3.8, delay: .22, block: .5, special: .28, aggression: .93 }
  };
  let stats = { wins: 0, losses: 0, best: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem('rua99-stats') || '{}');
    for (const key of Object.keys(stats)) if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) stats[key] = saved[key];
  } catch { /* The game also works when browser storage is unavailable. */ }
  function saveStats() {
    try { localStorage.setItem('rua99-stats', JSON.stringify(stats)); } catch { /* Optional persistence. */ }
    $('wins').textContent = pad(stats.wins);
    $('losses').textContent = pad(stats.losses);
    $('best-combo').textContent = pad(stats.best);
  }
  saveStats();
  function makeFighter(id, x, facing) {
    const body = Bodies.rectangle(x, FLOOR - 82, 58, 164, {
      inertia: Infinity, friction: 0, frictionStatic: 0, frictionAir: .014,
      restitution: 0, label: id, collisionFilter: { category: 2, mask: 1 }
    });
    Composite.add(engine.world, body);
    return { id, body, facing, depth: 0, laneVelocity: 0, hp: 100, energy: 40, rounds: 0, grounded: true, blocking: false, attack: null,
      stun: 0, flash: 0, cooldown: 0, combo: 0, comboTime: 0, aiTimer: .6, aiBlock: 0, knockback: 0 };
  }
  const player = makeFighter('player', 350, 1);
  const enemy = makeFighter('enemy', 930, -1);
  const fighters = [player, enemy];
  const heldKeys = new Set();
  const heldPointers = new Map();
  const pending = new Set();
  const keyActions = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', Space: 'jump', ShiftLeft: 'block', ShiftRight: 'block', KeyJ: 'punch', KeyK: 'kick', KeyL: 'special' };
  const controlButtons = [...document.querySelectorAll('[data-control]')];
  let state = 'ready', resumeState = 'fighting', timer = 60, round = 1, countdown = 0, transition = 0;
  let camera = 0, viewWidth = W, visualTime = 0, accumulator = 0, previousTime = 0;
  let shake = 0, hitstop = 0, particles = [], popups = [], announced = '', uiSnapshot = '';
  let muted = true, audioContext = null, musicTime = 0, beat = 0;
  let resetOrigin = null;

  function syncControls() {
    for (const button of controlButtons) button.classList.toggle('pressed', isHeld(button.dataset.control));
  }
  function isHeld(action) {
    return [...heldKeys].some(code => keyActions[code] === action) || [...heldPointers.values()].includes(action);
  }
  function clearInput() {
    heldKeys.clear(); heldPointers.clear(); pending.clear(); syncControls();
    player.blocking = false;
    for (const f of fighters) f.laneVelocity = 0;
  }
  function resize() {
    const bounds = arena.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    arena.width = Math.round(bounds.width * ratio);
    arena.height = Math.round(bounds.height * ratio);
    viewWidth = Math.min(W, H * bounds.width / bounds.height);
    camera = (W - viewWidth) / 2;
    Body.setPosition(walls[0], { x: camera - 20, y: 200 });
    Body.setPosition(walls[1], { x: camera + viewWidth + 20, y: 200 });
    if (state === 'ready') {
      Body.setPosition(player.body, { x: W / 2 - viewWidth * .225, y: FLOOR - 82 });
      Body.setPosition(enemy.body, { x: W / 2 + viewWidth * .225, y: FLOOR - 82 });
    } else {
      for (const f of fighters) Body.setPosition(f.body, { x: clamp(f.body.position.x, camera + 42, camera + viewWidth - 42), y: f.body.position.y });
    }
    ctx.imageSmoothingEnabled = false;
  }
  new ResizeObserver(resize).observe(arena);
  function initAudio() {
    if (!audioContext) {
      try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }
  function tone(frequency, duration, type = 'square', volume = .035, endFrequency = frequency) {
    if (muted || !audioContext || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function setSound() {
    muted = !muted;
    if (!muted) { initAudio(); tone(420, .1, 'triangle'); }
    $('sound').querySelector('img').src = `assets/icons/volume-${muted ? 'x' : '2'}.svg`;
    $('sound').setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som');
    $('sound').setAttribute('title', muted ? 'Ativar som (M)' : 'Desativar som (M)');
    $('sound').setAttribute('aria-pressed', String(!muted));
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('app').requestFullscreen) await $('app').requestFullscreen();
    } catch { announce('TELA CHEIA INDISPONIVEL'); }
  }
  document.addEventListener('fullscreenchange', () => {
    const full = !!document.fullscreenElement;
    $('fullscreen').querySelector('img').src = `assets/icons/${full ? 'minimize' : 'maximize'}.svg`;
    $('fullscreen').setAttribute('aria-label', full ? 'Sair da tela cheia' : 'Tela cheia');
    resize();
  });
  if (!$('app').requestFullscreen) $('fullscreen').hidden = true;
  function announce(text) { $('live-status').textContent = text; }
  function showOverlay(kind, kicker, title, action, secondary) {
    $('overlay').className = `overlay ${kind}`;
    $('overlay').hidden = false;
    $('overlay-kicker').textContent = kicker;
    $('overlay-title').textContent = title;
    $('overlay-title').classList.toggle('lime', kind === 'result' && player.rounds === 2);
    $('main-action').replaceChildren(document.createTextNode(action));
    const icon = document.createElement('img');
    icon.src = 'assets/icons/arrow-right.svg'; icon.alt = '';
    $('main-action').append(icon);
    $('cancel-action').hidden = !secondary;
    if (secondary) $('cancel-action').textContent = secondary;
    $('announcement').hidden = true;
    clearInput();
  }
  function beginRound() {
    clearInput();
    timer = 60; particles = []; popups = []; hitstop = 0; shake = 0; announced = '';
    for (const f of fighters) {
      const sign = f.id === 'player' ? -1 : 1;
      Body.setPosition(f.body, { x: W / 2 + sign * viewWidth * .225, y: FLOOR - 82 });
      Body.setVelocity(f.body, { x: 0, y: 0 });
      Object.assign(f, { facing: -sign, depth: 0, laneVelocity: 0, hp: 100, energy: 40, attack: null, blocking: false, grounded: true, stun: 0, flash: 0, cooldown: 0, combo: 0, comboTime: 0, aiTimer: .7, aiBlock: 0, knockback: 0 });
    }
    Engine.clear(engine);
    // Engine.clear empties Matter's collision detector; mark the world dirty so
    // the next Engine.update repopulates it with the floor, walls, and fighters.
    Composite.setModified(engine.world, true, false, false);
    state = 'countdown'; countdown = 1.9;
    $('overlay').hidden = true;
    $('difficulty').disabled = true;
    initAudio();
    announce(`Round ${round}. Kai contra Rex.`);
    updateHUD();
  }
  function startMatch() { player.rounds = 0; enemy.rounds = 0; round = 1; beginRound(); }
  function pause() {
    if (state === 'paused') { unpause(); return; }
    if (!['fighting', 'countdown', 'roundEnd'].includes(state)) return;
    resumeState = state; state = 'paused';
    showOverlay('paused', `ROUND ${pad(round)}`, 'PAUSA', 'Continuar');
    announce('Partida pausada.'); updateHUD();
  }
  function unpause() {
    state = resumeState; $('overlay').hidden = true; clearInput(); initAudio(); updateHUD();
  }
  function requestRestart() {
    if (state === 'confirm') return;
    if (state === 'ready' || state === 'matchEnd') { startMatch(); return; }
    resetOrigin = state;
    if (state !== 'paused') resumeState = state;
    state = 'confirm';
    showOverlay('paused', 'NOVA PARTIDA', 'RECOMECAR?', 'Reiniciar', 'Continuar');
    updateHUD();
  }
  $('main-action').addEventListener('click', () => {
    if (state === 'paused') unpause();
    else if (['ready', 'matchEnd', 'confirm'].includes(state)) startMatch();
  });
  $('cancel-action').addEventListener('click', () => {
    if (resetOrigin === 'paused') { state = 'paused'; showOverlay('paused', `ROUND ${pad(round)}`, 'PAUSA', 'Continuar'); }
    else unpause();
  });
  $('pause').addEventListener('click', pause);
  $('restart').addEventListener('click', requestRestart);
  $('sound').addEventListener('click', setSound);
  $('fullscreen').addEventListener('click', fullscreen);
  document.addEventListener('keydown', event => {
    if (['SELECT', 'INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
    const action = keyActions[event.code];
    if (action) {
      if (event.code === 'Space' && event.target.tagName === 'BUTTON') return;
      event.preventDefault();
      if (state === 'fighting') {
        if (!event.repeat && !heldKeys.has(event.code) && ['jump', 'punch', 'kick', 'special'].includes(action)) pending.add(action);
        heldKeys.add(event.code); syncControls();
      }
    }
    if (event.repeat) return;
    if (event.code === 'Enter' && event.target.tagName !== 'BUTTON' && ['ready', 'matchEnd'].includes(state)) startMatch();
    if (event.code === 'KeyP' || event.code === 'Escape') {
      if (state === 'confirm') $('cancel-action').click(); else pause();
    }
    if (event.code === 'KeyR') requestRestart();
    if (event.code === 'KeyM') setSound();
    if (event.code === 'KeyF') fullscreen();
  });
  document.addEventListener('keyup', event => { heldKeys.delete(event.code); syncControls(); });
  for (const button of controlButtons) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (state !== 'fighting') return;
      button.setPointerCapture(event.pointerId);
      const action = button.dataset.control;
      heldPointers.set(event.pointerId, action);
      if (['jump', 'punch', 'kick', 'special'].includes(action)) pending.add(action);
      initAudio(); syncControls();
    });
    const release = event => { heldPointers.delete(event.pointerId); syncControls(); };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('click', event => {
      if (event.detail === 0 && state === 'fighting') {
        const action = button.dataset.control;
        if (['jump', 'punch', 'kick', 'special'].includes(action)) pending.add(action);
      }
    });
  }
  window.addEventListener('blur', () => { clearInput(); if (['fighting', 'countdown', 'roundEnd'].includes(state)) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pause(); } });

  function startAttack(f, type) {
    if (f.attack || f.stun > 0 || f.cooldown > 0 || f.blocking || f.hp <= 0) return false;
    if (type === 'special' && f.energy < 60) {
      if (f.id === 'player') popup('SEM ENERGIA', f.body.position.x, f.body.position.y - 118, '#e1dcb5', 13);
      return false;
    }
    if (type === 'special') { f.energy -= 60; tone(100, .3, 'sawtooth', .026, 750); }
    else tone(type === 'kick' ? 170 : 290, .08, 'triangle', .024, 65);
    f.attack = { type, ...attackTypes[type], age: 0, hit: false };
    return true;
  }
  function jump(f) {
    if (!f.grounded || f.stun > 0 || f.blocking || f.attack) return;
    Body.setVelocity(f.body, { x: f.body.velocity.x, y: -13.1 });
    f.grounded = false;
    burst(f.body.position.x, FLOOR + f.depth, '#c0be92', 7, 1.2);
    tone(190, .12, 'triangle', .016, 420);
  }
  function burst(x, y, color, amount = 14, strength = 1) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (50 + Math.random() * 190) * strength;
      particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-30, life: .18+Math.random()*.23, max: .42, size: 2+Math.random()*5, color });
    }
  }
  function popup(text, x, y, color = '#e6f78b', size = 25) {
    popups.push({ text, x, y, color, size, life: .8, max: .8 });
  }
  function ai(dt) {
    const settings = levels[$('difficulty').value];
    const distance = Math.abs(player.body.position.x - enemy.body.position.x);
    const depthDifference = player.depth - enemy.depth;
    const aligned = Math.abs(depthDifference) < 28;
    enemy.aiTimer -= dt; enemy.aiBlock = Math.max(0, enemy.aiBlock - dt);
    if (enemy.stun > 0 || enemy.attack) { enemy.blocking = false; return { x: 0, depth: 0 }; }
    if (enemy.aiTimer <= 0) {
      enemy.aiTimer = settings.delay * (.7 + Math.random() * .8);
      if (player.attack && distance < 215 && aligned && enemy.grounded && Math.random() < settings.block) enemy.aiBlock = .28 + Math.random()*.19;
      else if (aligned && distance < 168 && Math.random() < settings.aggression) {
        enemy.blocking = false;
        const type = enemy.energy >= 60 && Math.random() < settings.special ? 'special' : distance > 118 || Math.random() > .58 ? 'kick' : 'punch';
        startAttack(enemy, type);
      } else if (distance > 200 && enemy.grounded && Math.random() < .08) jump(enemy);
    }
    enemy.blocking = enemy.aiBlock > 0 && enemy.grounded && !enemy.attack;
    if (enemy.blocking || enemy.attack) return { x: 0, depth: 0 };
    let x = 0;
    if (distance > 111) x = enemy.facing * settings.speed;
    else if (distance < 83 && enemy.aiTimer > .14) x = -enemy.facing * settings.speed * .6;
    const depth = Math.abs(depthDifference) > 7 ? Math.sign(depthDifference) * DEPTH_SPEED * .82 : 0;
    return { x, depth };
  }
  function updateFighter(f, movement, depthMovement, dt) {
    f.stun = Math.max(0, f.stun-dt); f.flash = Math.max(0, f.flash-dt); f.cooldown = Math.max(0, f.cooldown-dt);
    f.comboTime = Math.max(0, f.comboTime-dt);
    if (!f.comboTime) f.combo = 0;
    f.energy = Math.min(100, f.energy + dt * 2.5);
    const wasGrounded = f.grounded;
    f.grounded = f.body.bounds.max.y >= FLOOR - 1.3 && f.body.velocity.y >= -.6;
    if (!wasGrounded && f.grounded) burst(f.body.position.x, FLOOR + f.depth, '#a9b383', 5, .7);
    let velocity = movement;
    if (f.blocking) velocity *= .2;
    if (f.attack) velocity *= .28;
    if (f.stun > 0) { velocity = f.knockback; f.knockback *= .87; }
    let laneVelocity = depthMovement;
    if (f.blocking) laneVelocity *= .2;
    if (f.attack) laneVelocity *= .28;
    if (f.stun > 0) laneVelocity = 0;
    f.laneVelocity = laneVelocity;
    f.depth = clamp(f.depth + laneVelocity * dt, DEPTH_MIN, DEPTH_MAX);
    Body.setVelocity(f.body, { x: velocity, y: f.body.velocity.y });
    if (f.attack) {
      f.attack.age += dt;
      if (f.attack.age >= f.attack.duration) { f.attack = null; f.cooldown = .045; }
    }
  }
  function attackConnects(attacker, defender) {
    const attack = attacker.attack;
    if (!attack || attack.hit || attack.age < attack.active || attack.age > attack.end || Math.abs(attacker.depth - defender.depth) > 30) return false;
    const x = attacker.body.position.x;
    const feet = attacker.body.position.y + 82;
    const bounds = {
      min: { x: attacker.facing === 1 ? x + 17 : x - attack.reach, y: feet - 151 },
      max: { x: attacker.facing === 1 ? x + attack.reach : x - 17, y: feet - 53 }
    };
    return Query.region([defender.body], bounds).length > 0;
  }
  function hit(attacker, defender) {
    const attack = attacker.attack;
    if (!attack) return;
    attack.hit = true;
    const blocked = defender.blocking && defender.grounded && defender.facing !== attacker.facing;
    const damage = blocked ? (attack.type === 'special' ? 6 : 1) : attack.damage;
    defender.hp = Math.max(0, defender.hp - damage);
    defender.energy = Math.min(100, defender.energy + (blocked ? 6 : 8));
    attacker.energy = Math.min(100, attacker.energy + attack.energy);
    defender.stun = blocked ? .11 : attack.type === 'special' ? .33 : .18;
    defender.knockback = attacker.facing * attack.knockback * (blocked ? .35 : 1);
    defender.flash = blocked ? 0 : .1;
    defender.attack = null;
    if (!blocked) { defender.combo = 0; defender.comboTime = 0; }
    const hitX = defender.body.position.x - attacker.facing * 24;
    const hitY = defender.body.position.y - 21 + defender.depth;
    burst(hitX, hitY, blocked ? '#b3dde3' : attack.type === 'special' ? '#e1ff81' : '#ffe2a1', blocked ? 10 : 22, attack.type === 'special' ? 1.7 : 1);
    if (blocked) { popup('DEFESA', hitX, hitY-55, '#c8e7e6', 18); tone(490,.09,'triangle',.04,240); }
    else {
      hitstop = attack.type === 'special' ? .075 : .045;
      shake = reducedMotion ? 0 : attack.type === 'special' ? 11 : 5;
      tone(attack.type === 'kick' ? 110 : 170, .11, 'sawtooth', .045, 30);
      attacker.combo++; attacker.comboTime = 1.05;
      if (attacker.combo > 1) popup(`${attacker.combo} HITS`, attacker.body.position.x, attacker.body.position.y-127, attacker.id === 'player' ? '#deff83' : '#ffac87');
      if (attack.type === 'special') popup('IMPACTO!', hitX, hitY-78, '#e6ff9b', 29);
      if (attacker.id === 'player' && attacker.combo > stats.best) { stats.best = attacker.combo; saveStats(); }
    }
  }
  function finishRound() {
    if (state !== 'fighting') return;
    state = 'roundEnd'; transition = 2.7; clearInput();
    let result;
    if (player.hp === enemy.hp) result = 'EMPATE';
    else if (player.hp > enemy.hp) { player.rounds++; result = player.hp > 0 && enemy.hp === 0 ? 'K.O.' : 'TEMPO!'; }
    else { enemy.rounds++; result = player.hp === 0 ? 'K.O.' : 'TEMPO!'; }
    const winner = player.hp === enemy.hp ? 'Empate. O round sera repetido.' : `${player.hp > enemy.hp ? 'Kai' : 'Rex'} venceu o round.`;
    announced = result;
    $('announcement').textContent = result;
    $('announcement').hidden = false;
    announce(winner);
    for (const f of fighters) {
      f.attack = null; f.blocking = false; f.grounded = true;
      f.laneVelocity = 0;
      Body.setPosition(f.body, { x: f.body.position.x, y: FLOOR - 82 });
      Body.setVelocity(f.body, { x: 0, y: 0 });
    }
    tone(120,.45,'square',.035,40);
    updateHUD();
  }
  function finishMatch() {
    state = 'matchEnd';
    const won = player.rounds === 2;
    if (won) stats.wins++; else stats.losses++;
    saveStats();
    showOverlay('result', `${pad(player.rounds)} - ${pad(enemy.rounds)} / FIM DE PARTIDA`, won ? 'A RUA E SUA!' : 'REX VENCEU', 'Jogar novamente');
    $('difficulty').disabled = false;
    announce(won ? 'Vitoria! Kai venceu a partida.' : 'Rex venceu a partida.');
    tone(won ? 523 : 196, .4, 'triangle', .05, won ? 1046 : 98);
    updateHUD();
  }
  function updateHUD() {
    const snapshot = [state, round, Math.ceil(timer), player.hp, enemy.hp, Math.floor(player.energy), player.rounds, enemy.rounds].join('|');
    if (snapshot === uiSnapshot) return;
    uiSnapshot = snapshot;
    for (const f of fighters) {
      const health = $(`${f.id}-health`);
      for (const bar of health.children) bar.style.transform = `scaleX(${f.hp / 100})`;
      health.setAttribute('aria-valuenow', String(f.hp));
      $(`${f.id}-hp`).textContent = `${f.hp} / 100`;
      [...$(`${f.id}-rounds`).children].forEach((dot, i) => dot.classList.toggle('won', i < f.rounds));
    }
    const energy = Math.floor(player.energy);
    $('energy-value').textContent = `${energy}%`;
    $('energy-fill').style.width = `${energy}%`;
    $('energy-meter').setAttribute('aria-valuenow', String(energy));
    document.querySelector('[data-control="special"]').classList.toggle('ready', energy >= 60);
    $('timer').textContent = pad(Math.max(0, Math.ceil(timer)));
    $('timer').style.color = timer <= 10 ? '#ff9376' : '';
    $('round-label').textContent = `ROUND ${pad(round)}`;
    const paused = state === 'paused';
    $('pause').querySelector('img').src = `assets/icons/${paused ? 'play' : 'pause'}.svg`;
    $('pause').setAttribute('aria-label', paused ? 'Continuar' : 'Pausar');
    $('pause').setAttribute('title', paused ? 'Continuar (P ou Esc)' : 'Pausar (P ou Esc)');
    $('pause').disabled = ['ready', 'matchEnd', 'confirm'].includes(state);
    $('footer-state').textContent = ({ ready:'ARENA PRONTA', countdown:'PREPARANDO ROUND', fighting:'EM COMBATE', paused:'PARTIDA PAUSADA', confirm:'PARTIDA PAUSADA', roundEnd:'FIM DE ROUND', matchEnd:'FIM DE PARTIDA' })[state];
  }
  function simulation(dt) {
    if (['paused', 'confirm', 'ready', 'matchEnd'].includes(state)) return;
    if (hitstop > 0) { hitstop -= dt; return; }
    if (state === 'countdown') {
      countdown -= dt;
      const text = countdown > .72 ? `ROUND ${pad(round)}` : 'LUTE!';
      if (announced !== text) {
        announced = text; $('announcement').textContent = text; $('announcement').hidden = false;
        tone(countdown > .72 ? 330 : 660, .15, 'square', .025);
      }
      if (countdown <= 0) { state = 'fighting'; $('announcement').hidden = true; clearInput(); announce('Lute!'); }
      Engine.update(engine, STEP); updateHUD(); return;
    }
    if (state === 'roundEnd') {
      transition -= dt;
      if (transition <= 0) {
        if (player.rounds >= 2 || enemy.rounds >= 2) finishMatch();
        else { round++; beginRound(); }
      }
      return;
    }
    player.grounded = player.body.bounds.max.y >= FLOOR-1.3 && player.body.velocity.y >= -.6;
    enemy.grounded = enemy.body.bounds.max.y >= FLOOR-1.3 && enemy.body.velocity.y >= -.6;
    if (!player.attack && player.stun <= 0) player.facing = enemy.body.position.x >= player.body.position.x ? 1 : -1;
    if (!enemy.attack && enemy.stun <= 0) enemy.facing = player.body.position.x >= enemy.body.position.x ? 1 : -1;
    player.blocking = isHeld('block') && player.grounded && !player.attack && player.stun <= 0;
    if (pending.has('jump')) jump(player);
    for (const type of ['special', 'kick', 'punch']) if (pending.has(type)) { if (startAttack(player, type)) break; }
    pending.clear();
    const movement = (Number(isHeld('right'))-Number(isHeld('left'))) * 4.2;
    const depthMovement = (Number(isHeld('down'))-Number(isHeld('up'))) * DEPTH_SPEED;
    const enemyMovement = ai(dt);
    updateFighter(player, movement, depthMovement, dt); updateFighter(enemy, enemyMovement.x, enemyMovement.depth, dt);
    Engine.update(engine, STEP);
    // Grounded fighters push each other; jumping permits a clean crossover.
    const dx = enemy.body.position.x-player.body.position.x;
    if (Math.abs(dx) < 66 && Math.abs(enemy.body.position.y-player.body.position.y) < 115 && Math.abs(enemy.depth-player.depth) < 25) {
      const push = (66-Math.abs(dx))/2;
      const direction = dx >= 0 ? 1 : -1;
      Body.setPosition(player.body, { x: clamp(player.body.position.x-push*direction, camera+30, camera+viewWidth-30), y: player.body.position.y });
      Body.setPosition(enemy.body, { x: clamp(enemy.body.position.x+push*direction, camera+30, camera+viewWidth-30), y: enemy.body.position.y });
    }
    for (const f of fighters) {
      const x = clamp(f.body.position.x, camera+30, camera+viewWidth-30);
      if (x !== f.body.position.x) Body.setPosition(f.body, { x, y:f.body.position.y });
    }
    if (attackConnects(player, enemy)) hit(player, enemy);
    if (enemy.hp > 0 && attackConnects(enemy, player)) hit(enemy, player);
    timer = Math.max(0, timer-dt);
    if (player.hp <= 0 || enemy.hp <= 0 || timer <= 0) finishRound();
    musicTime -= dt;
    if (musicTime <= 0) {
      musicTime = .24;
      const bass = [65.41,65.41,77.78,65.41,87.31,87.31,77.78,58.27];
      if (beat % 2 === 0) tone(bass[Math.floor(beat/2)%bass.length], .18, 'triangle', .018);
      if (beat % 4 === 0) tone(90,.08,'sine',.03,30);
      beat++;
    }
    updateHUD();
  }
  function render(dt) {
    if (!['paused', 'confirm'].includes(state)) {
      visualTime += dt;
      for (const p of particles) { p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 360*dt; }
      for (const p of popups) { p.life -= dt; p.y -= dt*32; }
      particles = particles.filter(p => p.life > 0); popups = popups.filter(p => p.life > 0);
      shake = Math.max(0, shake-dt*34);
    }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = '#141512'; ctx.fillRect(0,0,arena.width,arena.height);
    const scale = Math.min(arena.width/viewWidth, arena.height/H);
    const offsetX = (arena.width-viewWidth*scale)/2;
    const offsetY = (arena.height-H*scale)/2;
    ctx.setTransform(scale,0,0,scale,offsetX-camera*scale,offsetY);
    if (shake > 0) ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    ArenaArt.scene(ctx,visualTime,camera,W,H);
    const depthOrder = [...fighters].sort((a,b) => a.depth-b.depth);
    for (const f of depthOrder) ArenaArt.shadow(ctx,f);
    for (const f of depthOrder) {
      if (f.attack?.type === 'special') {
        ctx.save();
        ctx.globalAlpha = .16;
        ctx.translate(-f.facing*22,0);
        ArenaArt.fighter(ctx,f,visualTime);
        ctx.translate(-f.facing*20,0);
        ArenaArt.fighter(ctx,f,visualTime);
        ctx.restore();
      }
      ArenaArt.fighter(ctx,f,visualTime);
      if (f.blocking) {
        ctx.strokeStyle = '#bbe2dbb0'; ctx.lineWidth = 3;
        const x = f.body.position.x + f.facing*45, y = f.body.position.y-19+f.depth;
        ctx.beginPath(); ctx.ellipse(x,y,16,49,0,-Math.PI/2,Math.PI/2,f.facing===-1); ctx.stroke();
      }
    }
    if (state === 'ready') {
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      for (const f of fighters) {
        const x = f.body.position.x, y = f.body.position.y-135+f.depth;
        ctx.fillStyle = f.id === 'player' ? '#dcf88c' : '#ffb494';
        ctx.fillText(f.id === 'player' ? '01 / KAI' : 'CPU / REX', x,y);
        ArenaArt.polygon(ctx, [[x-4,y+9],[x+4,y+9],[x,y+13]],ctx.fillStyle);
      }
    }
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life/p.max,0,1);
      ArenaArt.rect(ctx,p.x,p.y,p.size,p.size,p.color);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const p of popups) {
      ctx.globalAlpha = Math.min(1,p.life*4);
      ctx.font = `italic bold ${p.size}px Arial`;
      ctx.fillStyle = '#17291f'; ctx.fillText(p.text,p.x+2,p.y+2);
      ctx.fillStyle = p.color; ctx.fillText(p.text,p.x,p.y);
    }
    ctx.globalAlpha = 1;
  }
  function frame(now) {
    const elapsed = previousTime ? Math.min((now-previousTime)/1000,.1) : 0;
    previousTime = now;
    accumulator += elapsed*1000;
    let steps = 0;
    while (accumulator >= STEP && steps < 6) { simulation(STEP/1000); accumulator -= STEP; steps++; }
    render(elapsed);
    requestAnimationFrame(frame);
  }
  const portrait = $('portrait').getContext('2d');
  portrait.imageSmoothingEnabled = false;
  portrait.fillStyle = '#39482d'; portrait.fillRect(0,0,64,64);
  portrait.save(); portrait.translate(30,174); portrait.scale(.77,.77);
  ArenaArt.fighter(portrait, { ...player, body: { position:{x:0,y:-82}, velocity:{x:0,y:0} } },0,true);
  portrait.restore();
  resize(); updateHUD(); requestAnimationFrame(frame);
  // Read-only snapshots make browser verification possible without changing match state.
  window.Rua99 = Object.freeze({
    snapshot: () => ({ state, round, timer, difficulty:$('difficulty').value, viewport:{width:viewWidth,camera}, stats:{...stats},
      player:{hp:player.hp,energy:player.energy,x:player.body.position.x,y:player.body.position.y,depth:player.depth,blocking:player.blocking,grounded:player.grounded,attack:player.attack?.type || null,rounds:player.rounds},
      enemy:{hp:enemy.hp,energy:enemy.energy,x:enemy.body.position.x,y:enemy.body.position.y,depth:enemy.depth,blocking:enemy.blocking,grounded:enemy.grounded,attack:enemy.attack?.type || null,rounds:enemy.rounds} })
  });
})();
