/* Original canvas artwork. All coordinates use the same 1280 x 650 arena. */
(() => {
  'use strict';
  const background = document.createElement('canvas');
  background.width = 640;
  background.height = 325;
  const b = background.getContext('2d');
  let seed = 99;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const rect = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function line(c, points, color, width = 1) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = 'bevel';
    c.lineCap = 'butt';
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.stroke();
  }
  function polygon(c, points, color) {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fill();
  }
  function lettering(c, word, x, y, size, color, font = 'Impact') {
    c.font = `${size}px ${font}, sans-serif`;
    c.fillStyle = color;
    c.fillText(word, x, y);
  }
  function windowGrid(x, y, width, height, columns, color, lit) {
    const spacing = width / columns;
    for (let row = 0; row < height / 15 - 1; row++) {
      for (let col = 0; col < columns; col++) {
        const wx = x + 4 + col * spacing;
        const wy = y + 9 + row * 15;
        rect(b, wx, wy, spacing - 6, 8, random() > .72 ? lit : color);
        rect(b, wx, wy + 8, spacing - 6, 1, '#c2b39d35');
      }
    }
  }
  function building(x, y, w, h, front, side, windows, lit, cols) {
    rect(b, x, y, w, h, front);
    rect(b, x + w - 7, y, 7, h, side);
    rect(b, x - 2, y, w + 3, 3, '#d2bdad');
    windowGrid(x + 2, y, w - 11, h, cols, windows, lit);
  }

  rect(b, 0, 0, 640, 325, '#8499a1');
  rect(b, 0, 33, 640, 52, '#a4a5a2');
  rect(b, 0, 85, 640, 47, '#c5aca0');
  rect(b, 0, 132, 640, 64, '#dcafa0');
  rect(b, 0, 196, 640, 66, '#e7b397');
  b.fillStyle = '#f2d5a1';
  b.beginPath(); b.arc(434, 91, 25, 0, Math.PI * 2); b.fill();
  for (let i = 0; i < 16; i++) {
    const x = random() * 640;
    const y = 25 + random() * 80;
    rect(b, x, y, 20 + random() * 55, 2 + random() * 3, '#dbc3aa45');
  }
  for (let x = 0; x < 640; x += 22 + random() * 14) {
    const h = 28 + random() * 80;
    const y = 191 - h;
    rect(b, x, y, 19 + random() * 24, h, '#788782');
    if (random() > .55) rect(b, x + 7, y - 9, 2, 9, '#788782');
    for (let j = 0; j < 4; j++) rect(b, x + 4, y + 7 + j * 11, 2, 3, '#bdb6a1');
  }
  building(134, 89, 57, 125, '#657973', '#4e6865', '#3e5c5d', '#d8c59e', 4);
  building(205, 114, 54, 99, '#b09a8f', '#907d78', '#647c75', '#e7c893', 4);
  building(270, 72, 60, 142, '#85858d', '#6c7580', '#4f6570', '#caba8d', 5);
  rect(b, 285, 61, 27, 11, '#75827b');
  rect(b, 298, 37, 2, 26, '#516b68');
  line(b, [[284, 53], [314, 53]], '#6b8179');
  building(345, 128, 68, 90, '#b2988c', '#8c807d', '#59756c', '#f3d09d', 5);
  building(460, 119, 68, 107, '#a39191', '#847e83', '#45615e', '#d6ba8b', 5);
  building(529, 78, 80, 148, '#72827b', '#576d68', '#385551', '#c0b78a', 6);
  rect(b, 547, 60, 5, 18, '#4b6560');
  rect(b, 570, 68, 21, 10, '#596f66');
  // Elevated railway and its weathered concrete supports.
  rect(b, 96, 170, 473, 8, '#536c64');
  rect(b, 95, 180, 485, 12, '#b3ac91');
  rect(b, 96, 190, 485, 7, '#52675b');
  rect(b, 99, 177, 480, 3, '#ded1ac');
  for (let x = 115; x < 580; x += 32) {
    line(b, [[x, 182], [x + 17, 190], [x + 32, 181]], '#7b8875', 2);
    rect(b, x, 197, 1, 3, '#d8c398');
  }
  polygon(b, [[221, 197], [250, 197], [243, 208], [240, 262], [225, 262], [224, 208]], '#8e9680');
  rect(b, 225, 212, 4, 50, '#b0aa8b');
  polygon(b, [[481, 197], [509, 197], [504, 208], [503, 262], [487, 262], [486, 208]], '#788c79');
  // Left corner shop.
  rect(b, 0, 76, 124, 187, '#4c6b60');
  rect(b, 99, 76, 25, 187, '#3a594f');
  rect(b, 0, 71, 128, 6, '#8a9b81');
  rect(b, 5, 83, 88, 4, '#799381');
  windowGrid(3, 84, 97, 83, 5, '#263f3b', '#b7b88c');
  rect(b, 8, 80, 2, 169, '#acac88');
  rect(b, 2, 80, 2, 180, '#273f3b');
  for (let y = 90; y < 162; y += 21) rect(b, 0, y, 98, 1, '#8da08a35');
  rect(b, 13, 44, 89, 29, '#1f3934');
  rect(b, 16, 47, 83, 23, '#d0d282');
  lettering(b, 'RUA 99', 22, 67, 23, '#243c35');
  rect(b, 22, 73, 3, 8, '#263f3b');
  rect(b, 86, 73, 3, 8, '#263f3b');
  rect(b, 14, 164, 83, 13, '#d7b797');
  lettering(b, 'MERCEARIA CENTRAL', 19, 173, 7, '#394f44', 'monospace');
  polygon(b, [[5, 177], [99, 177], [105, 188], [0, 188]], '#c08065');
  for (let x = 0; x < 104; x += 14) polygon(b, [[x + 6, 178], [x + 12, 178], [x + 15, 188], [x + 7, 188]], '#d8b99c');
  rect(b, 0, 188, 105, 4, '#573f34');
  rect(b, 14, 193, 67, 63, '#324c44');
  for (let y = 196; y < 257; y += 4) rect(b, 16, y, 64, 1, '#617768');
  rect(b, 87, 192, 20, 70, '#273f36');
  rect(b, 91, 197, 12, 42, '#708672');
  rect(b, 99, 241, 2, 3, '#ded2a0');
  rect(b, 109, 176, 20, 61, '#1e3931');
  rect(b, 112, 179, 14, 54, '#d67c67');
  for (let i = 0; i < 4; i++) lettering(b, 'LUTA'[i], 115, 190 + i * 12, 10, '#f2ddac');
  // Right workshop and water tank.
  building(571, 133, 69, 130, '#4e6c62', '#345346', '#2c4841', '#d2bd92', 4);
  rect(b, 548, 204, 92, 61, '#2e4b41');
  rect(b, 549, 204, 91, 3, '#9f9275');
  rect(b, 551, 220, 89, 2, '#567560');
  rect(b, 579, 92, 40, 34, '#797c64');
  polygon(b, [[576, 94], [599, 82], [622, 94]], '#405b4e');
  rect(b, 579, 98, 40, 3, '#485e4d');
  rect(b, 579, 116, 40, 2, '#405b4e');
  rect(b, 585, 127, 3, 6, '#2a443a');
  rect(b, 612, 127, 3, 6, '#2a443a');
  rect(b, 591, 94, 3, 32, '#9b997820');
  rect(b, 564, 182, 76, 15, '#d28867');
  lettering(b, 'OFICINA 24H', 569, 193, 11, '#293f35');
  rect(b, 566, 226, 60, 28, '#546952');
  lettering(b, 'SEM', 571, 239, 13, '#c2c183');
  lettering(b, 'MEDO', 574, 252, 15, '#c2c183');
  // Fence behind the playable sidewalk.
  rect(b, 133, 243, 413, 21, '#60765d');
  rect(b, 133, 245, 413, 2, '#9b9d73');
  b.save();
  b.beginPath(); b.rect(133, 212, 414, 37); b.clip();
  for (let x = 95; x < 590; x += 10) {
    line(b, [[x, 211], [x + 36, 250]], '#374f4280');
    line(b, [[x, 250], [x + 36, 211]], '#374f4280');
  }
  b.restore();
  for (let x = 135; x < 550; x += 83) {
    rect(b, x, 210, 3, 56, '#354f40');
    rect(b, x, 210, 1, 56, '#a5a886');
  }
  rect(b, 134, 211, 413, 2, '#4d6652');
  rect(b, 136, 251, 410, 1, '#3e5947');
  for (let i = 0; i < 30; i++) rect(b, 139 + random() * 404, 248 + random() * 14, 2 + random() * 11, 1, '#90a17740');
  rect(b, 165, 222, 37, 27, '#c0ba8d');
  rect(b, 166, 223, 35, 3, '#cd7860');
  lettering(b, 'PROIBIDO', 169, 232, 5, '#42553f', 'monospace');
  lettering(b, 'VACILAR', 169, 240, 7, '#42553f', 'monospace');
  // Telephone wires, lamp and foreground props.
  rect(b, 524, 104, 4, 161, '#2c483a');
  rect(b, 523, 113, 33, 3, '#29493c');
  polygon(b, [[548, 110], [559, 111], [562, 118], [547, 118]], '#29483c');
  rect(b, 548, 117, 13, 2, '#e1d19a');
  line(b, [[0, 116], [143, 142], [311, 134], [526, 111], [640, 127]], '#334f42');
  line(b, [[0, 110], [142, 134], [312, 127], [526, 107], [640, 119]], '#334f42');
  rect(b, 132, 111, 3, 152, '#314e40');
  rect(b, 122, 117, 26, 3, '#344f42');
  rect(b, 52, 252, 25, 16, '#827953');
  rect(b, 54, 254, 21, 2, '#b3a576');
  line(b, [[54, 257], [75, 264]], '#b3a576', 2);
  line(b, [[54, 264], [75, 257]], '#b3a576', 2);
  rect(b, 99, 250, 13, 19, '#263f36');
  rect(b, 98, 249, 15, 3, '#637963');
  rect(b, 100, 254, 1, 12, '#75866a');
  rect(b, 544, 251, 14, 17, '#385847');
  rect(b, 543, 249, 16, 3, '#779271');
  // The fighting plane has a strong, continuous edge.
  rect(b, 0, 265, 640, 5, '#b0ab86');
  rect(b, 0, 270, 640, 5, '#657859');
  rect(b, 0, 275, 640, 50, '#354d3f');
  rect(b, 0, 277, 640, 2, '#1f392f');
  rect(b, 0, 294, 640, 1, '#556b50');
  for (let x = 0; x < 640; x += 54) {
    line(b, [[x, 265], [x - 5, 274]], '#53674e');
    line(b, [[x + 4, 280], [x - 22, 325]], '#283f33');
  }
  for (let i = 0; i < 300; i++) {
    rect(b, random() * 640, 280 + random() * 45, 1 + random() * 4, 1, random() > .5 ? '#69806530' : '#1f372c55');
  }
  rect(b, 273, 297, 89, 3, '#a69f66');
  rect(b, 279, 301, 81, 1, '#8b906150');
  rect(b, 16, 308, 49, 6, '#263a31');
  for (let x = 19; x < 62; x += 5) rect(b, x, 309, 2, 4, '#697659');
  polygon(b, [[452, 288], [471, 287], [475, 291], [458, 292]], '#b7ad86');
  line(b, [[390, 313], [399, 310], [407, 313], [417, 311]], '#192f27');

  const colors = {
    player: { jacket:'#d4ed75', shadow:'#829b49', light:'#f1ffb1', skin:'#bd805b', skinLight:'#e3ac7d', hair:'#263333', pants:'#3d4e54', pantsLight:'#617578', shoe:'#e3e7ce', wrap:'#eef1d3', accent:'#f08775' },
    enemy: { jacket:'#ed8765', shadow:'#ac4f46', light:'#ffb085', skin:'#ce9477', skinLight:'#edba8c', hair:'#d3d0b6', pants:'#3c4142', pantsLight:'#67706a', shoe:'#e9c9a3', wrap:'#3d4942', accent:'#e6e8c6' }
  };
  function limb(c, a, m, z, color, width, highlight) {
    line(c, [a, m, z], '#1e302b', width + 3);
    line(c, [a, m, z], color, width);
    if (highlight) line(c, [[a[0]-1,a[1]], [m[0]-1,m[1]], [z[0]-1,z[1]]], highlight, 2);
  }
  function fighter(c, f, time, portrait = false) {
    const p = colors[f.id];
    const feet = f.body.position.y + 82;
    const moving = Math.abs(f.body.velocity.x) > 1 && f.grounded;
    const bob = f.grounded ? Math.sin(time * 7 + (f.id === 'enemy' ? 1 : 0)) * .7 : 0;
    const walk = moving ? Math.sin(time * 16) : 0;
    const phase = f.attack ? f.attack.age / f.attack.duration : 0;
    const reach = f.attack ? Math.sin(Math.min(1, phase / .65) * Math.PI) : 0;
    c.save();
    c.translate(Math.round(f.body.position.x), Math.round(feet));
    if (f.hp <= 0 && !portrait) { c.translate(0, -8); c.rotate(-f.facing * Math.PI / 2.7); }
    c.scale(f.facing * 3, 3);
    c.translate(0, bob);
    if (f.stun > 0) c.rotate(-.09);
    if (f.flash > 0) c.filter = 'brightness(1.75)';
    const block = f.blocking;
    let frontKnee = [11 + walk * 5, -13];
    let frontFoot = [17 + walk * 8, -2];
    let backKnee = [-13 - walk * 4, -13];
    let backFoot = [-21 - walk * 8, -2];
    if (!f.grounded) { frontKnee = [16, -20]; frontFoot = [18, -13]; backKnee = [-9, -14]; backFoot = [-16, -10]; }
    if (f.attack?.type === 'kick') { frontKnee = [12 + reach * 12, -16 - reach * 15]; frontFoot = [16 + reach * 31, -3 - reach * 31]; }
    limb(c, [-4,-26], backKnee, backFoot, p.pants, 8, p.pantsLight);
    rect(c, backFoot[0]-4, backFoot[1]-2, 13, 5, '#1e302b');
    rect(c, backFoot[0]-3, backFoot[1]-2, 10, 3, p.shoe);
    limb(c, [4,-26], frontKnee, frontFoot, p.pants, 9, p.pantsLight);
    rect(c, frontFoot[0]-4, frontFoot[1]-2, 15, 5, '#1e302b');
    rect(c, frontFoot[0]-3, frontFoot[1]-2, 12, 3, p.shoe);
    rect(c, frontFoot[0]+2, frontFoot[1]-3, 3, 2, p.shadow);
    let backElbow = [-16,-33], backHand = [-12,-44];
    if (moving) { backElbow = [-18,-34]; backHand = [-19,-29]; }
    limb(c, [-6,-43], backElbow, backHand, p.shadow, 7);
    rect(c, backHand[0]-3, backHand[1]-4, 7, 8, p.skin);
    polygon(c, [[-8,-48],[7,-48],[13,-37],[9,-24],[-8,-24],[-12,-37]], '#1e302b');
    polygon(c, [[-7,-46],[5,-47],[10,-37],[7,-26],[-7,-26],[-10,-37]], p.jacket);
    polygon(c, [[-7,-45],[-3,-43],[-5,-29],[-8,-27],[-10,-37]], p.shadow);
    rect(c, -5,-26,13,4,'#283b33');
    rect(c, 1,-45,2,18,p.light);
    rect(c, 4,-34,4,2,p.shadow);
    if (f.id === 'player') { rect(c, -6,-45,3,7,p.light); rect(c, 3,-44,4,3,'#36452f'); }
    else { rect(c, -8,-45,5,10,p.skin); rect(c, 5,-45,6,10,p.skin); rect(c, -3,-33,6,4,'#dfc69c'); }
    // Face, hair, bandana and two-pixel eye stay crisp at every scale.
    rect(c, -5,-61,13,15,'#1e302b');
    rect(c, -4,-59,11,13,p.skin);
    rect(c, 1,-57,7,9,p.skinLight);
    rect(c, 7,-54,3,4,p.skinLight);
    rect(c, 0,-48,6,2,p.skin);
    rect(c, -7,-63,13,6,p.hair);
    rect(c, -5,-65,8,3,p.hair);
    rect(c, -6,-58,3,7,p.hair);
    if (f.id === 'player') {
      rect(c, -6,-58,14,3,p.accent);
      polygon(c, [[-6,-57],[-14,-54 + Math.sin(time*9)*2],[-13,-51],[-4,-56]], p.accent);
    } else { rect(c, -3,-64,7,2,'#f0e4c5'); rect(c, -7,-59,3,6,'#676f60'); }
    rect(c, 4,-55,3,1,'#314035');
    rect(c, 5,-54,2,2,'#1b2925');
    rect(c, 6,-49,3,1,'#694d3e');
    let elbow = [14,-35], hand = [19,-46];
    if (block) { elbow = [16,-39]; hand = [12,-57]; }
    if (f.attack && f.attack.type !== 'kick') { elbow = [12+reach*15,-36-reach*7]; hand = [19+reach*(f.attack.type === 'special' ? 29 : 24),-46+reach*3]; }
    limb(c, [6,-43], elbow, hand, f.id === 'player' ? p.jacket : p.skin, 8, f.id === 'player' ? p.light : p.skinLight);
    rect(c, hand[0]-4,hand[1]-3,8,8,'#1e302b');
    rect(c, hand[0]-3,hand[1]-2,7,6,p.wrap);
    rect(c, hand[0],hand[1]-3,6,6,p.skinLight);
    rect(c, hand[0]+1,hand[1]-1,4,1,p.skin);
    c.restore();
  }
  function scene(c, time, camera, viewportWidth, viewportHeight) {
    c.fillStyle = '#263d32'; c.fillRect(0, 0, viewportWidth, viewportHeight);
    c.drawImage(background, 0, 0, 1280, 650);
    // A local train passes on the raised tracks, behind the fence.
    const trainX = ((time * 24) % 1900) - 550;
    c.save();
    c.beginPath(); c.rect(257, 276, 843, 74); c.clip();
    for (let car = 0; car < 3; car++) {
      const x = trainX + car * 143;
      rect(c, x, 292, 135, 45, '#d5caaa');
      rect(c, x + 3, 289, 128, 4, '#657e6a');
      rect(c, x, 326, 135, 5, '#b35f50');
      rect(c, x, 335, 135, 6, '#38523e');
      for (let w = 0; w < 5; w++) { rect(c, x+9+w*24, 299, 18, 19, '#4b6e65'); rect(c, x+10+w*24, 300, 16, 2, '#87a596'); }
      rect(c, x+31, 332, 8, 12, '#223c32'); rect(c, x+99, 332, 8, 12, '#223c32');
    }
    c.restore();
    // Wind-blown leaves and a loose paper use the arena's real depth.
    for (let i = 0; i < 7; i++) {
      const x = (time * (13 + i) + i * 201) % 1330 - 25;
      const y = 420 + i * 14 + Math.sin(time * 1.3 + i) * 9;
      rect(c, x, y, 4 + i % 3, 2, i % 2 ? '#b8b775' : '#c5aa7e');
    }
    if (Math.sin(time * 2) > -.8) rect(c, 224, 358, 28, 2, '#ffc498');
  }
  function shadow(c, f) {
    const altitude = Math.max(0, 532 - f.body.position.y - 82);
    c.fillStyle = '#102a2165';
    c.beginPath(); c.ellipse(f.body.position.x, 540, Math.max(22, 54-altitude*.14), 9, 0, 0, Math.PI*2); c.fill();
  }
  window.ArenaArt = { scene, fighter, shadow, rect, line, polygon };
})();
