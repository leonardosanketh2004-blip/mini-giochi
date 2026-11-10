// ===== Navigazione =====
const menu = document.getElementById('menu');
const gameArea = document.getElementById('game-area');
const gameTitle = document.getElementById('game-title');
const gameContainer = document.getElementById('game-container');
const backBtn = document.getElementById('back-btn');

const games = {
  snake: { title: '🐍 Snake', render: renderSnake },
  memory: { title: '🧠 Memory', render: renderMemory },
  tictactoe: { title: '❌ Tic-Tac-Toe', render: renderTicTacToe },
  reaction: { title: '⚡ Tempo di Reazione', render: renderReaction },
  rps: { title: '✊ Sasso Carta Forbice', render: renderRPS },
  whack: { title: '🔨 Whack-a-Mole', render: renderWhack },
  pong: { title: '🏓 Pong', render: renderPong },
  quiz: { title: '❓ Quiz', render: renderQuiz },
  aim: { title: '🎯 Aim Trainer', render: renderAim },
  g2048: { title: '🔢 2048', render: render2048 },
  breakout: { title: '🧱 Breakout', render: renderBreakout },
  tetris: { title: '🧊 Tetris', render: renderTetris },
  flappy: { title: '🐦 Flappy Bird', render: renderFlappy },
  tttonline: { title: '🌐 Tic-Tac-Toe Online', render: (c) => renderOnlineGame(c, 'ttt') },
  memonline: { title: '🌐 Memory Online', render: (c) => renderOnlineGame(c, 'mem') },
};

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  card.addEventListener('click', () => {
    const key = card.dataset.game;
    gameTitle.textContent = games[key].title;
    menu.classList.add('hidden');
    gameArea.classList.remove('hidden');
    gameContainer.innerHTML = '';
    games[key].render(gameContainer);
  });
});

backBtn.addEventListener('click', () => {
  gameArea.classList.add('hidden');
  menu.classList.remove('hidden');
});

// ===== 1. SNAKE =====
function renderSnake(container) {
  const size = 20, cells = 20;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * cells;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.className = 'snake-hud';
  hud.innerHTML = '<span>Punteggio: <b id="snake-score">0</b></span><span>Record: <b id="snake-best">0</b></span>';
  container.prepend(hud);

  let snake = [{x:10,y:10}], dir = {x:1,y:0}, nextDir = dir;
  let food = spawnFood(), score = 0, best = +(localStorage.getItem('snakeBest')||0);
  document.getElementById('snake-best').textContent = best;
  let dead = false, loop = null;
  let particles = [], floatTexts = [];

  function burst(x, y, color, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, color });
    }
  }

  function spawnFood() {
    let f;
    do { f = {x: Math.floor(Math.random()*cells), y: Math.floor(Math.random()*cells)}; }
    while (snake.some(s => s.x===f.x && s.y===f.y));
    return f;
  }

  document.addEventListener('keydown', onKey);
  function onKey(e) {
    const map = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    const k = e.key.length===1 ? e.key.toLowerCase() : e.key;
    if (map[k]) {
      const [dx,dy] = map[k];
      if (!(dx === -dir.x && dy === -dir.y)) nextDir = {x:dx, y:dy};
    }
  }

  function tick() {
    dir = nextDir;
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    if (head.x<0||head.y<0||head.x>=cells||head.y>=cells||snake.some(s=>s.x===head.x&&s.y===head.y)) {
      dead = true; clearInterval(loop);
      document.removeEventListener('keydown', onKey);
      if (score > best) { best = score; localStorage.setItem('snakeBest', best); }
      document.getElementById('snake-best').textContent = best;
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff'; ctx.font = '30px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Game Over!', canvas.width/2, canvas.height/2-10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Punteggio: ' + score, canvas.width/2, canvas.height/2+25);
      const btn = document.createElement('button');
      btn.className='primary'; btn.textContent='Rigioca';
      btn.onclick = () => renderSnake(container);
      container.appendChild(btn);
      return;
    }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score += 10;
      document.getElementById('snake-score').textContent = score;
      burst(food.x*size+size/2, food.y*size+size/2, '#ff2d78', 18);
      floatTexts.push({ x: food.x*size+size/2, y: food.y*size, text: '+10', life: 1 });
      food = spawnFood();
    } else snake.pop();

    // aggiorna particelle e testi fluttuanti
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.025; });
    floatTexts = floatTexts.filter(t => t.life > 0);
    floatTexts.forEach(t => { t.y -= 0.6; t.life -= 0.02; });

    ctx.fillStyle = '#080a14'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = 'rgba(0,229,255,0.05)'; ctx.lineWidth = 1;
    for (let i = 1; i < cells; i++) {
      ctx.beginPath(); ctx.moveTo(i*size,0); ctx.lineTo(i*size,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*size); ctx.lineTo(canvas.width,i*size); ctx.stroke();
    }
    // particelle
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // testi fluttuanti
    floatTexts.forEach(t => {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 14px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    // cibo pulsante con glow
    const pulse = 1 + Math.sin(Date.now()/250) * 0.15;
    const fx = food.x*size+size/2, fy = food.y*size+size/2;
    ctx.shadowBlur = 18; ctx.shadowColor = '#ff2d78';
    const grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, size/2);
    grad.addColorStop(0, '#ff6b9d'); grad.addColorStop(1, '#ff2d78');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(fx, fy, (size/2-2)*pulse, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    // foglia del cibo
    ctx.fillStyle = '#00ff88';
    ctx.beginPath(); ctx.ellipse(fx+4, fy-8, 4, 2, -0.6, 0, 7); ctx.fill();

    // serpente
    snake.forEach((s,i) => {
      const t = i / Math.max(1, snake.length);
      ctx.fillStyle = i===0 ? '#00e5ff' : `hsl(${165 - t*40}, 80%, ${55 - t*20}%)`;
      const pad = i===0 ? 1 : 2 + t*2;
      ctx.beginPath();
      ctx.roundRect(s.x*size+pad, s.y*size+pad, size-pad*2, size-pad*2, 6);
      ctx.fill();
    });
    // occhi sulla testa
    const h = snake[0], cx = h.x*size+size/2, cy = h.y*size+size/2;
    const ex = dir.y !== 0 ? 5 : 0, ey = dir.x !== 0 ? 5 : 0;
    const px = -dir.y * 4, py = dir.x * 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx+px+ex*0.5, cy+py+ey*0.5, 3.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-px+ex*0.5, cy-py+ey*0.5, 3.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0c1a';
    ctx.beginPath(); ctx.arc(cx+px+ex*0.9, cy+py+ey*0.9, 1.8, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-px+ex*0.9, cy-py+ey*0.9, 1.8, 0, 7); ctx.fill();
  }

  loop = setInterval(tick, 120);
}

// ===== 2. MEMORY (co-op 2 giocatori) =====
function renderMemory(container) {
  const emojis = ['🍎','🍌','🍇','🍓','🍊','🍑','🥝','🍉'];
  let deck = [...emojis, ...emojis].sort(() => Math.random()-0.5);
  let first = null, lock = false, matched = 0;
  let scores = [0,0], current = 0;

  const info = document.createElement('div');
  info.className = 'memory-info';
  container.appendChild(info);

  const grid = document.createElement('div');
  grid.className = 'memory-grid';
  container.appendChild(grid);

  function updateInfo() {
    info.innerHTML = `Turno: <b>Giocatore ${current+1}</b> 🔴🟡 &nbsp;|&nbsp; P1: <b>${scores[0]}</b> &nbsp; P2: <b>${scores[1]}</b> &nbsp;|&nbsp; Coppie: ${matched}/8`;
  }
  updateInfo();

  deck.forEach(emoji => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `<div class="memory-card-inner">
      <div class="memory-face memory-front">?</div>
      <div class="memory-face memory-back">${emoji}</div>
    </div>`;
    card.addEventListener('click', () => {
      if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped');
      if (!first) { first = card; return; }
      const a = first.querySelector('.memory-back').textContent;
      const b = card.querySelector('.memory-back').textContent;
      if (a === b) {
        card.classList.add('matched'); first.classList.add('matched');
        scores[current]++; matched++;
        first = null;
        if (matched === 8) {
          info.innerHTML = `🏆 Ha vinto il Giocatore ${scores[0]>scores[1]?1:scores[0]<scores[1]?2:'1 e 2 (pareggio)'}! P1: ${scores[0]} - P2: ${scores[1]}`;
          const btn = document.createElement('button');
          btn.className='primary'; btn.textContent='Rigioca'; btn.style.marginTop='1rem';
          btn.onclick = () => renderMemory(container);
          container.appendChild(btn);
          return;
        }
      } else {
        lock = true;
        const c1 = first, c2 = card;
        setTimeout(() => { c1.classList.remove('flipped'); c2.classList.remove('flipped'); first=null; lock=false; current = 1-current; updateInfo(); }, 800);
        return;
      }
      current = 1-current;
      updateInfo();
    });
    grid.appendChild(card);
  });
}

// ===== 3. TIC-TAC-TOE (co-op) =====
function renderTicTacToe(container) {
  let board = Array(9).fill(null), current = 'X', over = false;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  const status = document.createElement('div');
  status.className = 'ttt-status';
  container.appendChild(status);

  const grid = document.createElement('div');
  grid.className = 'ttt-grid';
  container.appendChild(grid);

  function updateStatus() { status.textContent = over ? '' : `Turno: ${current === 'X' ? '🔴 Giocatore X' : '🟡 Giocatore O'}`; }
  updateStatus();

  board.forEach((_, i) => {
    const cell = document.createElement('button');
    cell.className = 'ttt-cell';
    cell.addEventListener('click', () => {
      if (over || board[i]) return;
      board[i] = current;
      cell.textContent = current;
      cell.classList.add(current.toLowerCase());
      cell.disabled = true;
      const line = wins.find(w => w.every(j => board[j] === current));
      if (line) {
        over = true;
        line.forEach(j => grid.children[j].style.background = 'rgba(233,69,96,0.4)');
        status.textContent = `🎉 Vince ${current === 'X' ? '🔴 X' : '🟡 O'}!`;
      } else if (board.every(Boolean)) {
        over = true;
        status.textContent = '🤝 Pareggio!';
      } else {
        current = current === 'X' ? 'O' : 'X';
        updateStatus();
      }
    });
    grid.appendChild(cell);
  });

  const btn = document.createElement('button');
  btn.className='secondary'; btn.textContent='Nuova partita'; btn.style.marginTop='1rem';
  btn.onclick = () => renderTicTacToe(container);
  container.appendChild(btn);
}

// ===== 4. REACTION =====
function renderReaction(container) {
  const area = document.createElement('div');
  area.className = 'reaction-area';
  area.style.background = '#333';
  area.textContent = 'Premi START per iniziare';
  container.appendChild(area);

  const result = document.createElement('div');
  result.className = 'reaction-result';
  container.appendChild(result);

  let state = 'idle', startTime = 0, timeout = null;

  const btn = document.createElement('button');
  btn.className='primary'; btn.textContent='START'; btn.style.marginTop='1rem';
  container.appendChild(btn);

  btn.onclick = () => {
    clearTimeout(timeout);
    state = 'waiting';
    area.style.background = '#c0392b';
    area.style.boxShadow = '0 0 40px rgba(255,45,120,0.4), inset 0 0 60px rgba(0,0,0,0.4)';
    area.textContent = 'Aspetta il VERDE...';
    result.textContent = '';
    btn.disabled = true;
    const delay = 1500 + Math.random()*3000;
    timeout = setTimeout(() => {
      state = 'go';
      startTime = performance.now();
      area.style.background = '#27ae60';
      area.style.boxShadow = '0 0 60px rgba(0,255,136,0.5), inset 0 0 60px rgba(0,0,0,0.3)';
      area.textContent = 'CLICCA!';
    }, delay);
  };

  area.addEventListener('click', () => {
    if (state === 'waiting') {
      clearTimeout(timeout);
      state = 'idle';
      area.style.background = '#c0392b';
      area.style.boxShadow = '0 0 40px rgba(255,45,120,0.4)';
      area.textContent = 'Troppo presto! Riprova.';
      result.textContent = '❌ Hai cliccato prima del verde.';
      btn.disabled = false;
    } else if (state === 'go') {
      const ms = Math.round(performance.now() - startTime);
      state = 'idle';
      area.style.background = '#1a1f35';
      area.style.boxShadow = 'none';
      area.textContent = 'Premi START per giocare ancora';
      result.innerHTML = `⚡ Tempo di reazione: <b>${ms} ms</b> ${ms<200?'🚀 Fulmine!':ms<350?'👍 Ottimo':ms<500?'👌 Bene':'🐢 Puoi fare di meglio'}`;
      btn.disabled = false;
    }
  });
}

// ===== 5. ROCK PAPER SCISSORS =====
function renderRPS(container) {
  let playerScore = 0, cpuScore = 0, draws = 0;
  const choices = { '✊': 'Sasso', '✋': 'Carta', '✌️': 'Forbice' };
  const beats = { '✊':'✌️', '✋':'✊', '✌️':'✋' };

  const score = document.createElement('div');
  score.className = 'rps-score';
  container.appendChild(score);

  const buttons = document.createElement('div');
  buttons.className = 'rps-buttons';
  container.appendChild(buttons);

  const result = document.createElement('div');
  result.className = 'rps-result';
  container.appendChild(result);

  function updateScore() {
    score.innerHTML = `Tu: <b>${playerScore}</b> &nbsp;|&nbsp; Computer: <b>${cpuScore}</b> &nbsp;|&nbsp; Pareggi: <b>${draws}</b>`;
  }
  updateScore();

  Object.keys(choices).forEach(c => {
    const b = document.createElement('button');
    b.className = 'rps-btn'; b.textContent = c;
    b.onclick = () => {
      const cpu = Object.keys(choices)[Math.floor(Math.random()*3)];
      let msg;
      if (c === cpu) { draws++; msg = `🤝 Pareggio! Entrambi ${choices[c]}`; }
      else if (beats[c] === cpu) { playerScore++; msg = `🎉 Vinci! ${choices[c]} batte ${choices[cpu]}`; }
      else { cpuScore++; msg = `😢 Perdi! ${choices[cpu]} batte ${choices[c]}`; }
      result.textContent = `Tu: ${c}  vs  CPU: ${cpu} — ${msg}`;
      updateScore();
    };
    buttons.appendChild(b);
  });
}

// ===== 6. WHACK-A-MOLE =====
function renderWhack(container) {
  const info = document.createElement('div');
  info.className = 'whack-info';
  container.appendChild(info);

  const grid = document.createElement('div');
  grid.className = 'whack-grid';
  container.appendChild(grid);

  let score = 0, timeLeft = 30, playing = false, moleTimer = null, countTimer = null;

  const holes = [];
  for (let i = 0; i < 9; i++) {
    const hole = document.createElement('div');
    hole.className = 'whack-hole';
    hole.innerHTML = '<div class="whack-mole">🐹</div>';
    hole.addEventListener('click', () => {
      if (hole.classList.contains('active') && playing) {
        score++;
        hole.classList.add('hit');
        setTimeout(() => hole.classList.remove('hit'), 150);
        hole.classList.remove('active');
      }
    });
    grid.appendChild(hole);
    holes.push(hole);
  }

  function updateInfo() { info.innerHTML = `Punteggio: <b>${score}</b> &nbsp;|&nbsp; Tempo: <b>${timeLeft}s</b>`; }
  updateInfo();

  const btn = document.createElement('button');
  btn.className='primary'; btn.textContent='GIOCA!'; btn.style.marginTop='1rem';
  container.appendChild(btn);

  btn.onclick = () => {
    score = 0; timeLeft = 30; playing = true;
    btn.disabled = true;
    updateInfo();

    moleTimer = setInterval(() => {
      holes.forEach(h => h.classList.remove('active'));
      const h = holes[Math.floor(Math.random()*holes.length)];
      h.classList.add('active');
      setTimeout(() => h.classList.remove('active'), 700 + Math.random()*500);
    }, 800);

    countTimer = setInterval(() => {
      timeLeft--;
      updateInfo();
      if (timeLeft <= 0) {
        playing = false;
        clearInterval(moleTimer); clearInterval(countTimer);
        holes.forEach(h => h.classList.remove('active'));
        info.innerHTML = `🏁 Tempo scaduto! Punteggio finale: <b>${score}</b>`;
        btn.disabled = false; btn.textContent = 'Rigioca';
      }
    }, 1000);
  };
}

// ============================================================
//  ONLINE CO-OP (WebRTC P2P + MQTT broker pubblico per signaling)
// ============================================================

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';

class NetSession {
  // role: 'host' | 'guest'
  // onMessage(obj), onStatus(text), onOpen()
  constructor(role, code, onMessage, onStatus, onOpen) {
    this.role = role;
    this.code = code;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.onOpen = onOpen;
    this.channel = null;
    this.pc = null;
    this.pendingIce = [];
    this.base = `arcade-games/${code}/`;
  }

  send(obj) {
    if (this.channel && this.channel.readyState === 'open') {
      this.channel.send(JSON.stringify(obj));
    }
  }

  close() {
    try { this.channel && this.channel.close(); } catch(e) {}
    try { this.pc && this.pc.close(); } catch(e) {}
    try { this.mqtt && this.mqtt.end(); } catch(e) {}
  }

  _ice(candidate) {
    if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(()=>{});
    } else {
      this.pendingIce.push(candidate);
    }
  }

  _flushIce() {
    while (this.pendingIce.length) {
      const c = this.pendingIce.shift();
      this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{});
    }
  }

  _setupChannelHandlers(channel) {
    this.channel = channel;
    channel.onopen = () => this.onOpen();
    channel.onmessage = (e) => {
      try { this.onMessage(JSON.parse(e.data)); } catch(err) {}
    };
  }

  // ---- HOST ----
  static host(onMessage, onStatus, onOpen) {
    const code = Math.random().toString(36).slice(2, 6).toUpperCase();
    const s = new NetSession('host', code, onMessage, onStatus, onOpen);
    s.mqtt = mqtt.connect(MQTT_BROKER, { clientId: 'host-' + code + '-' + Math.random().toString(36).slice(2) });
    s.mqtt.on('connect', () => {
      s.mqtt.subscribe(s.base + 'toHost', () => {
        onStatus('ready');
      });
      s.mqtt.on('message', (topic, payload) => {
        let msg;
        try { msg = JSON.parse(payload.toString()); } catch(e) { return; }
        if (topic === s.base + 'toHost') {
          if (msg.type === 'offer') {
            s.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            s.pc.onicecandidate = (e) => {
              if (e.candidate) s.mqtt.publish(s.base + 'toGuest', JSON.stringify({ type: 'ice', candidate: e.candidate }));
            };
            s.pc.ondatachannel = (e) => s._setupChannelHandlers(e.channel);
            s.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => s.pc.createAnswer())
              .then(ans => s.pc.setLocalDescription(ans))
              .then(() => {
                s.mqtt.publish(s.base + 'toGuest', JSON.stringify({ type: 'answer', sdp: s.pc.localDescription }));
              })
              .catch(err => onStatus('Errore connessione: ' + err.message));
          } else if (msg.type === 'ice') {
            s._ice(msg.candidate);
          }
        } else if (topic === s.base + 'toGuest') {
          if (msg.type === 'ice') {
            s._ice(msg.candidate);
            s._flushIce();
          }
        }
      });
    });
    s.mqtt.on('error', () => onStatus('Errore broker MQTT'));
    return { session: s, code };
  }

  // ---- GUEST ----
  static join(code, onMessage, onStatus, onOpen) {
    const s = new NetSession('guest', code, onMessage, onStatus, onOpen);
    s.mqtt = mqtt.connect(MQTT_BROKER, { clientId: 'guest-' + code + '-' + Math.random().toString(36).slice(2) });
    s.mqtt.on('connect', () => {
      s.mqtt.subscribe(s.base + 'toGuest', () => {
        s.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        const dc = s.pc.createDataChannel('game');
        s._setupChannelHandlers(dc);
        s.pc.onicecandidate = (e) => {
          if (e.candidate) s.mqtt.publish(s.base + 'toHost', JSON.stringify({ type: 'ice', candidate: e.candidate }));
        };
        s.pc.createOffer()
          .then(o => s.pc.setLocalDescription(o))
          .then(() => {
            s.mqtt.publish(s.base + 'toHost', JSON.stringify({ type: 'offer', sdp: s.pc.localDescription }));
            onStatus('waiting');
          })
          .catch(err => onStatus('Errore: ' + err.message));
      });
      s.mqtt.on('message', (topic, payload) => {
        let msg;
        try { msg = JSON.parse(payload.toString()); } catch(e) { return; }
        if (topic === s.base + 'toGuest') {
          if (msg.type === 'answer') {
            s.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => s._flushIce())
              .catch(()=>{});
          } else if (msg.type === 'ice') {
            s._ice(msg.candidate);
          }
        }
      });
    });
    s.mqtt.on('error', () => onStatus('Errore broker MQTT'));
    return { session: s };
  }
}

// ---- UI di setup stanza (condivisa) ----
function renderOnlineGame(container, type) {
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:1rem;width:100%';
  container.appendChild(wrap);

  const status = document.createElement('div');
  status.style.cssText = 'font-size:1.1rem;min-height:2em;text-align:center';
  wrap.appendChild(status);

  const setup = document.createElement('div');
  setup.style.cssText = 'display:flex;flex-direction:column;gap:1rem;align-items:center';
  wrap.appendChild(setup);

  const hostBtn = document.createElement('button');
  hostBtn.className = 'primary'; hostBtn.textContent = '🏠 Crea stanza';
  setup.appendChild(hostBtn);

  const joinRow = document.createElement('div');
  joinRow.style.cssText = 'display:flex;gap:0.5rem;align-items:center';
  const codeInput = document.createElement('input');
  codeInput.placeholder = 'CODICE';
  codeInput.maxLength = 4;
  codeInput.style.cssText = 'padding:0.6rem;font-size:1rem;text-transform:uppercase;width:110px;text-align:center;border-radius:8px;border:2px solid #533483;background:#1a1a2e;color:#fff';
  const joinBtn = document.createElement('button');
  joinBtn.className = 'secondary'; joinBtn.textContent = 'Unisciti';
  joinRow.appendChild(codeInput);
  joinRow.appendChild(joinBtn);
  setup.appendChild(joinRow);

  let session = null;

  hostBtn.onclick = () => {
    setup.innerHTML = '';
    status.textContent = 'Creazione stanza...';
    const res = NetSession.host(
      (msg) => { if (res.session._handler) res.session._handler(msg); },
      (st) => {
        if (st === 'ready') {
          const codeEl = document.createElement('div');
          codeEl.innerHTML = `Condividi questo codice con il tuo amico:<br><b style="font-size:2rem;letter-spacing:0.3rem;color:#e94560">${res.code}</b>`;
          setup.appendChild(codeEl);
          status.textContent = '⏳ In attesa che il tuo amico si unisca...';
        }
      },
      () => {
        status.textContent = '🎮 Amico connesso! Iniziamo...';
        const gameEl = document.createElement('div');
        wrap.appendChild(gameEl);
        if (type === 'ttt') initTTTOnline(gameEl, res.session, 'host', status);
        else initMemOnline(gameEl, res.session, 'host', status);
      }
    );
    session = res.session;
  };

  joinBtn.onclick = () => {
    const code = codeInput.value.trim().toUpperCase();
    if (code.length !== 4) { status.textContent = '⚠️ Inserisci un codice di 4 caratteri'; return; }
    setup.innerHTML = '';
    status.textContent = 'Connessione alla stanza ' + code + '...';
    const res = NetSession.join(
      code,
      (msg) => { if (res.session._handler) res.session._handler(msg); },
      (st) => { if (st === 'waiting') status.textContent = '⏳ In attesa del giocatore host...'; },
      () => {
        status.textContent = '🎮 Connesso! Iniziamo...';
        const gameEl = document.createElement('div');
        wrap.appendChild(gameEl);
        if (type === 'ttt') initTTTOnline(gameEl, res.session, 'guest', status);
        else initMemOnline(gameEl, res.session, 'guest', status);
      }
    );
    session = res.session;
  };
}

// ---- TIC-TAC-TOE ONLINE (host = X, guest = O, host autorevole) ----
function initTTTOnline(container, sess, role, statusEl) {
  const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let board, turn, winner, over;

  const status = document.createElement('div');
  status.className = 'ttt-status';
  container.appendChild(status);
  const grid = document.createElement('div');
  grid.className = 'ttt-grid';
  container.appendChild(grid);

  const cells = [];
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('button');
    c.className = 'ttt-cell';
    c.addEventListener('click', () => onCell(i));
    grid.appendChild(c);
    cells.push(c);
  }

  const btn = document.createElement('button');
  btn.className='secondary'; btn.textContent='Nuova partita'; btn.style.marginTop='1rem';
  btn.onclick = () => { if (role === 'host') newGame(); };
  container.appendChild(btn);

  function mySymbol() { return role === 'host' ? 'X' : 'O'; }
  function oppSymbol() { return role === 'host' ? 'O' : 'X'; }

  function render() {
    cells.forEach((c, i) => {
      c.textContent = board[i] || '';
      c.className = 'ttt-cell' + (board[i] ? ' ' + board[i].toLowerCase() : '');
      c.disabled = over || board[i] || turn !== mySymbol();
    });
    if (over) {
      status.textContent = winner ? `🎉 Vince ${winner === 'X' ? '🔴 X (Host)' : '🟡 O (Guest)'}!` : '🤝 Pareggio!';
    } else {
      status.textContent = `Turno: ${turn === mySymbol() ? '⭐ TU' : 'Avversario'} (${turn === 'X' ? '🔴 X' : '🟡 O'})`;
    }
  }

  function checkEnd() {
    const line = WINS.find(w => w.every(j => board[j] === turn));
    if (line) { winner = turn; over = true; return; }
    if (board.every(Boolean)) { over = true; return; }
    turn = turn === 'X' ? 'O' : 'X';
  }

  function broadcast() {
    sess.send({ type: 'ttt-state', board, turn, winner, over });
  }

  function newGame() {
    board = Array(9).fill(null);
    turn = 'X'; winner = null; over = false;
    broadcast();
    render();
  }

  function onCell(i) {
    if (over || board[i] || turn !== mySymbol()) return;
    if (role === 'host') {
      board[i] = 'X';
      checkEnd();
      broadcast();
      render();
    } else {
      sess.send({ type: 'ttt-move', i });
      cells[i].disabled = true;
    }
  }

  sess._handler = (msg) => {
    if (msg.type === 'ttt-state') {
      board = msg.board; turn = msg.turn; winner = msg.winner; over = msg.over;
      render();
    } else if (msg.type === 'ttt-move' && role === 'host') {
      const i = msg.i;
      if (!over && !board[i] && turn === 'O') {
        board[i] = 'O';
        checkEnd();
        broadcast();
        render();
      }
    }
  };

  if (role === 'host') {
    newGame();
  } else {
    // guest aspetta lo stato iniziale
    status.textContent = '⏳ In attesa dell\'host...';
    board = Array(9).fill(null); turn = 'X'; winner = null; over = false;
    render();
  }
}

// ---- MEMORY ONLINE (host autorevole) ----
function initMemOnline(container, sess, role, statusEl) {
  const EMOJIS = ['🍎','🍌','🍇','🍓','🍊','🍑','🥝','🍉'];
  let deck, flipped, matched, scores, turn, lock, over;

  const info = document.createElement('div');
  info.className = 'memory-info';
  container.appendChild(info);
  const grid = document.createElement('div');
  grid.className = 'memory-grid';
  container.appendChild(grid);

  const cells = [];
  for (let i = 0; i < 16; i++) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `<div class="memory-card-inner">
      <div class="memory-face memory-front">?</div>
      <div class="memory-face memory-back"></div>
    </div>`;
    card.addEventListener('click', () => onFlip(i));
    grid.appendChild(card);
    cells.push(card);
  }

  const btn = document.createElement('button');
  btn.className='secondary'; btn.textContent='Nuova partita'; btn.style.marginTop='1rem';
  btn.onclick = () => { if (role === 'host') newGame(); };
  container.appendChild(btn);

  function myIdx() { return role === 'host' ? 0 : 1; }
  function name(idx) { return idx === 0 ? '🔴 Host' : '🟡 Guest'; }

  function render() {
    cells.forEach((card, i) => {
      const back = card.querySelector('.memory-back');
      const isUp = flipped.includes(i) || matched.includes(i);
      back.textContent = isUp && deck ? deck[i] : '';
      card.classList.toggle('flipped', isUp);
      card.classList.toggle('matched', matched && matched.includes(i));
      const canFlip = !over && !lock && !isUp && turn === myIdx();
      card.style.cursor = canFlip ? 'pointer' : 'default';
    });
    if (over) {
      const w = scores[0] === scores[1] ? 'Pareggio' : `Vince ${name(scores[0] > scores[1] ? 0 : 1)}`;
      info.innerHTML = `🏆 ${w}! — Host: <b>${scores[0]}</b> — Guest: <b>${scores[1]}</b>`;
    } else {
      info.innerHTML = `Turno: <b>${turn === myIdx() ? '⭐ TU' : name(turn)}</b> &nbsp;|&nbsp; Host: <b>${scores[0]}</b> — Guest: <b>${scores[1]}</b>`;
    }
  }

  function broadcast() {
    sess.send({ type: 'mem-state', deck, flipped, matched, scores, turn, lock, over });
  }

  function newGame() {
    const base = [...EMOJIS, ...EMOJIS];
    deck = base.sort(() => Math.random() - 0.5);
    flipped = []; matched = []; scores = [0, 0]; turn = 0; lock = false; over = false;
    broadcast();
    render();
  }

  function onFlip(i) {
    if (role === 'host') hostFlip(i, 0);
    else {
      if (!over && !lock && !flipped.includes(i) && !matched.includes(i) && turn === 1) {
        sess.send({ type: 'mem-flip', i });
      }
    }
  }

  function hostFlip(i, playerIdx) {
    if (over || lock || flipped.includes(i) || matched.includes(i)) return;
    if (turn !== playerIdx) return;
    flipped.push(i);
    broadcast();
    render();
    if (flipped.length === 2) {
      lock = true;
      const [a, b] = flipped;
      if (deck[a] === deck[b]) {
        matched.push(a, b);
        scores[turn]++;
        flipped = [];
        lock = false;
        if (matched.length === 16) {
          over = true;
        } else {
          turn = 1 - turn;
        }
        broadcast(); render();
      } else {
        setTimeout(() => {
          flipped = [];
          turn = 1 - turn;
          lock = false;
          broadcast(); render();
        }, 800);
      }
    }
  }

  sess._handler = (msg) => {
    if (msg.type === 'mem-state') {
      deck = msg.deck; flipped = msg.flipped; matched = msg.matched;
      scores = msg.scores; turn = msg.turn; lock = msg.lock; over = msg.over;
      render();
    } else if (msg.type === 'mem-flip' && role === 'host') {
      hostFlip(msg.i, 1);
    }
  };

  if (role === 'host') {
    newGame();
  } else {
    info.textContent = '⏳ In attesa dell\'host...';
    deck = null; flipped = []; matched = []; scores = [0,0]; turn = 0; lock = true; over = false;
    render();
  }
}

// ===== 7. PONG (vs CPU) =====
function renderPong(container) {
  const W = 640, H = 400;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.className = 'pong-hud';
  hud.innerHTML = '<span>Tu: <b id="pong-me">0</b></span><span class="cpu">CPU: <b id="pong-cpu">0</b></span>';
  container.prepend(hud);

  const pw = 12, ph = 80, ballR = 8;
  let me = { x: 20, y: H/2 - ph/2 }, cpu = { x: W-20-pw, y: H/2 - ph/2 };
  let ball = { x: W/2, y: H/2, vx: 5, vy: 3 };
  let meScore = 0, cpuScore = 0, running = true, loop = null, speed = 5;
  let trail = [], particles = [];

  document.addEventListener('keydown', onKey);
  function onKey(e) {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') me.y = Math.max(0, me.y - 22);
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') me.y = Math.min(H - ph, me.y + 22);
  }
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    me.y = Math.max(0, Math.min(H - ph, (e.clientY - r.top) * (H / r.height) - ph/2));
  });

  function burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3.5;
      particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, color });
    }
  }

  function resetBall(dir) {
    ball = { x: W/2, y: H/2, vx: dir * speed, vy: (Math.random()*6-3) };
  }

  function tick() {
    if (!running) return;
    // CPU AI
    const cpuCenter = cpu.y + ph/2;
    if (ball.vx > 0) cpu.y += Math.sign(ball.y - cpuCenter) * Math.min(4.5, Math.abs(ball.y - cpuCenter));
    cpu.y = Math.max(0, Math.min(H - ph, cpu.y));

    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y < ballR || ball.y > H - ballR) { ball.vy *= -1; ball.y = Math.max(ballR, Math.min(H-ballR, ball.y)); }

    // paddle me
    if (ball.vx < 0 && ball.x - ballR <= me.x + pw && ball.x - ballR >= me.x - ballR && ball.y > me.y - ballR && ball.y < me.y + ph + ballR) {
      ball.vx = Math.abs(ball.vx) * 1.05; ball.vy += (ball.y - (me.y + ph/2)) * 0.15;
      ball.x = me.x + pw + ballR;
      burst(ball.x, ball.y, '#00e5ff');
    }
    // paddle cpu
    if (ball.vx > 0 && ball.x + ballR >= cpu.x && ball.x + ballR <= cpu.x + pw + ballR && ball.y > cpu.y - ballR && ball.y < cpu.y + ph + ballR) {
      ball.vx = -Math.abs(ball.vx) * 1.05; ball.vy += (ball.y - (cpu.y + ph/2)) * 0.15;
      ball.x = cpu.x - ballR;
      burst(ball.x, ball.y, '#ff2d78');
    }

    if (ball.x < -20) { cpuScore++; document.getElementById('pong-cpu').textContent = cpuScore; burst(30, ball.y, '#ff2d78', 25); resetBall(1); }
    if (ball.x > W + 20) { meScore++; document.getElementById('pong-me').textContent = meScore; burst(W-30, ball.y, '#00e5ff', 25); resetBall(-1); }
    if (meScore >= 7 || cpuScore >= 7) {
      running = false; clearInterval(loop);
      document.removeEventListener('keydown', onKey);
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff'; ctx.font = '32px Orbitron, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(meScore > cpuScore ? '🏆 HAI VINTO!' : '💀 HAI PERSO', W/2, H/2 - 10);
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`${meScore} - ${cpuScore}`, W/2, H/2 + 30);
      const btn = document.createElement('button');
      btn.className='primary'; btn.textContent='Rigioca';
      btn.onclick = () => renderPong(container);
      container.appendChild(btn);
      return;
    }

    // aggiorna particelle e scia
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > 14) trail.shift();

    ctx.fillStyle = '#080a14'; ctx.fillRect(0,0,W,H);
    // rete animata
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([6,10]);
    ctx.lineDashOffset = -Date.now()/50;
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);
    // particelle
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // scia della palla
    trail.forEach((t, i) => {
      ctx.globalAlpha = (i / trail.length) * 0.35;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(t.x, t.y, ballR * (i/trail.length), 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // paddle arrotondati con glow
    ctx.shadowBlur = 18; ctx.shadowColor = '#00e5ff';
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.roundRect(me.x, me.y, pw, ph, 6); ctx.fill();
    ctx.shadowColor = '#ff2d78'; ctx.fillStyle = '#ff2d78';
    ctx.beginPath(); ctx.roundRect(cpu.x, cpu.y, pw, ph, 6); ctx.fill();
    ctx.shadowBlur = 0;
    // palla con glow
    ctx.shadowBlur = 20; ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ballR, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  loop = setInterval(tick, 1000/60);
}

// ===== 8. QUIZ =====
function renderQuiz(container) {
  const QUESTIONS = [
    { q: 'Qual è il pianeta più grande del sistema solare?', o: ['Terra', 'Giove', 'Saturno', 'Nettuno'], a: 1 },
    { q: 'In che anno è caduto il Muro di Berlino?', o: ['1987', '1989', '1991', '1993'], a: 1 },
    { q: 'Quale elemento chimico ha simbolo "O"?', o: ['Oro', 'Osmio', 'Ossigeno', 'Olio'], a: 2 },
    { q: 'Quanti continenti esistono?', o: ['5', '6', '7', '8'], a: 2 },
    { q: 'Chi ha dipinto la Gioconda?', o: ['Michelangelo', 'Raffaello', 'Leonardo da Vinci', 'Donatello'], a: 2 },
    { q: 'Qual è la capitale del Giappone?', o: ['Seul', 'Pechino', 'Tokyo', 'Bangkok'], a: 2 },
    { q: 'Quanto fa 7 × 8?', o: ['54', '56', '63', '48'], a: 1 },
    { q: 'Quale gas respirano le piante per fotosintesi?', o: ['Ossigeno', 'Azoto', 'Anidride carbonica', 'Idrogeno'], a: 2 },
    { q: 'In quale paese si trova la Torre Eiffel?', o: ['Italia', 'Spagna', 'Francia', 'Germania'], a: 2 },
    { q: 'Qual è il monte più alto del mondo?', o: ['K2', 'Monte Bianco', 'Everest', 'Kilimangiaro'], a: 2 },
  ];

  let idx = 0, score = 0, answered = false;

  const progress = document.createElement('div');
  progress.className = 'quiz-progress';
  progress.innerHTML = '<div style="width:0%"></div>';
  container.appendChild(progress);

  const qEl = document.createElement('div');
  qEl.className = 'quiz-question';
  container.appendChild(qEl);

  const optsEl = document.createElement('div');
  optsEl.className = 'quiz-options';
  container.appendChild(optsEl);

  const scoreEl = document.createElement('div');
  scoreEl.className = 'quiz-score';
  container.appendChild(scoreEl);

  function showQ() {
    answered = false;
    const item = QUESTIONS[idx];
    qEl.textContent = `${idx + 1}. ${item.q}`;
    progress.firstElementChild.style.width = (idx / QUESTIONS.length * 100) + '%';
    optsEl.innerHTML = '';
    item.o.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt;
      b.onclick = () => answer(i, b);
      optsEl.appendChild(b);
    });
  }

  function answer(i, btn) {
    if (answered) return;
    answered = true;
    const correct = QUESTIONS[idx].a;
    [...optsEl.children].forEach((c, j) => {
      c.disabled = true;
      if (j === correct) c.classList.add('correct');
      else if (j === i) c.classList.add('wrong');
    });
    if (i === correct) score++;
    scoreEl.textContent = `Punteggio: ${score}/${idx + 1}`;
    setTimeout(() => {
      idx++;
      if (idx < QUESTIONS.length) showQ();
      else {
        qEl.textContent = '🏁 Quiz completato!';
        optsEl.innerHTML = '';
        progress.firstElementChild.style.width = '100%';
        const msg = score === 10 ? '🏆 PERFETTO! Sei un genio!' :
                    score >= 7 ? '🎉 Ottimo lavoro!' :
                    score >= 4 ? '👍 Discreto, puoi fare di meglio' : '📚 Ricontrolla le risposte';
        scoreEl.innerHTML = `${msg}<br><b style="font-size:1.6rem">${score}/10</b>`;
        const btn = document.createElement('button');
        btn.className='primary'; btn.textContent='Rigioca'; btn.style.marginTop='1rem';
        btn.onclick = () => { idx = 0; score = 0; scoreEl.textContent=''; showQ(); };
        optsEl.appendChild(btn);
      }
    }, 900);
  }

  showQ();
}

// ===== 9. AIM TRAINER =====
function renderAim(container) {
  const DURATION = 30;
  const area = document.createElement('div');
  area.className = 'aim-area';
  container.appendChild(area);

  const hud = document.createElement('div');
  hud.className = 'aim-hud';
  hud.innerHTML = '<span>Colpiti: <b id="aim-score">0</b></span><span>Tempo: <b id="aim-time">30</b>s</span><span>Precisione: <b id="aim-acc">100%</b></span>';
  container.prepend(hud);

  let score = 0, clicks = 0, hits = 0, timeLeft = DURATION, playing = false, timer = null;

  const btn = document.createElement('button');
  btn.className='primary'; btn.textContent='INIZIA'; btn.style.marginTop='1rem';
  container.appendChild(btn);

  function spawnTarget() {
    const t = document.createElement('div');
    t.className = 'aim-target';
    t.style.left = (10 + Math.random()*80) + '%';
    t.style.top = (10 + Math.random()*80) + '%';
    t.addEventListener('click', (e) => {
      e.stopPropagation();
      hits++; score++;
      t.classList.add('hit');
      setTimeout(() => t.remove(), 250);
      updateHud();
      spawnTarget();
    });
    area.appendChild(t);
  }

  function updateHud() {
    document.getElementById('aim-score').textContent = score;
    document.getElementById('aim-time').textContent = timeLeft;
    document.getElementById('aim-acc').textContent = clicks ? Math.round(hits/clicks*100) + '%' : '100%';
  }

  area.addEventListener('click', () => { if (playing) clicks++; });

  btn.onclick = () => {
    score = 0; clicks = 0; hits = 0; timeLeft = DURATION; playing = true;
    area.innerHTML = '';
    btn.disabled = true;
    updateHud();
    spawnTarget();
    timer = setInterval(() => {
      timeLeft--;
      updateHud();
      if (timeLeft <= 0) {
        playing = false;
        clearInterval(timer);
        area.innerHTML = '';
        const acc = clicks ? Math.round(hits/clicks*100) : 0;
        hud.innerHTML = `<span>Colpiti: <b>${score}</b></span><span>Precisione: <b>${acc}%</b></span>`;
        const msg = document.createElement('div');
        msg.style.cssText = 'margin-top:1rem;font-size:1.2rem;text-align:center';
        msg.innerHTML = score >= 25 ? '🏆 LEGENDARIO!' : score >= 15 ? '🎉 Ottimo mirino!' : score >= 8 ? '👍 Bene' : '📈 Allenati di più';
        container.appendChild(msg);
        btn.disabled = false; btn.textContent = 'RIGIOCA';
      }
    }, 1000);
  };
}

// ===== 10. 2048 =====
function render2048(container) {
  const SIZE = 4;
  let board, score = 0, best = +(localStorage.getItem('best2048') || 0), over = false, won = false;

  const hud = document.createElement('div');
  hud.className = 'g2048-hud';
  hud.innerHTML = `<span>Punteggio: <b id="s2048-score">0</b></span><span>Record: <b id="s2048-best">${best}</b></span>`;
  container.appendChild(hud);

  const gridEl = document.createElement('div');
  gridEl.className = 'g2048-grid';
  container.appendChild(gridEl);

  const msgEl = document.createElement('div');
  msgEl.className = 'g2048-msg';
  container.appendChild(msgEl);

  function newGame() {
    board = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
    score = 0; over = false; won = false;
    spawn(); spawn();
    render();
  }

  function spawn() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++)
      if (!board[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideRow(row) {
    const vals = row.filter(v => v);
    const out = [];
    let gained = 0;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        out.push(vals[i] * 2); gained += vals[i] * 2; i++;
      } else out.push(vals[i]);
    }
    while (out.length < SIZE) out.push(0);
    return { row: out, gained };
  }

  function move(dir) {
    if (over) return;
    let gained = 0, moved = false;
    const nb = board.map(r => r.slice());
    for (let i = 0; i < SIZE; i++) {
      let line;
      if (dir === 'left') line = nb[i];
      else if (dir === 'right') line = nb[i].slice().reverse();
      else if (dir === 'up') line = nb.map(r => r[i]);
      else line = nb.map(r => r[i]).reverse();
      const res = slideRow(line);
      gained += res.gained;
      const final = dir === 'right' || dir === 'down' ? res.row.slice().reverse() : res.row;
      for (let j = 0; j < SIZE; j++) {
        const r = (dir === 'up' || dir === 'down') ? j : i;
        const c = (dir === 'up' || dir === 'down') ? i : j;
        if (nb[r][c] !== final[j]) moved = true;
        nb[r][c] = final[j];
      }
    }
    if (!moved) return;
    board = nb;
    score += gained;
    if (score > best) { best = score; localStorage.setItem('best2048', best); }
    spawn();
    checkEnd();
    render();
  }

  function checkEnd() {
    if (board.flat().includes(2048) && !won) { won = true; }
    const full = board.every(r => r.every(v => v));
    if (!full) return;
    const canMove = board.some((r, i) => r.some((v, j) =>
      v === board[i][j+1] || v === board[i+1]?.[j]));
    if (!canMove) over = true;
  }

  function render() {
    document.getElementById('s2048-score').textContent = score;
    document.getElementById('s2048-best').textContent = best;
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'g2048-cell';
      const v = board[r][c];
      if (v) {
        const t = document.createElement('div');
        t.className = 'g2048-tile v' + v;
        t.textContent = v;
        cell.appendChild(t);
      }
      gridEl.appendChild(cell);
    }
    if (over) {
      msgEl.innerHTML = `Game Over! Punteggio: <b>${score}</b>`;
      const btn = document.createElement('button');
      btn.className = 'primary'; btn.textContent = 'Rigioca'; btn.style.marginTop = '0.8rem';
      btn.onclick = newGame;
      msgEl.appendChild(btn);
    } else if (won) {
      msgEl.innerHTML = '🎉 Hai raggiunto <b>2048</b>! Continua per il record.';
      won = false;
    } else msgEl.innerHTML = '';
  }

  const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  function onKey(e) {
    const d = keyMap[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (d) { e.preventDefault(); move(d); }
  }
  document.addEventListener('keydown', onKey);

  let tx = 0, ty = 0;
  gridEl.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  gridEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  newGame();
}

// ===== 11. BREAKOUT =====
function renderBreakout(container) {
  const W = 640, H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.className = 'breakout-hud';
  hud.innerHTML = '<span>Punteggio: <b id="bo-score">0</b></span><span>Vite: <b id="bo-lives">3</b></span><span>Livello: <b id="bo-level">1</b></span>';
  container.prepend(hud);

  const ROWS = 6, COLS = 10, BW = W / COLS, BH = 22, TOP = 50;
  const COLORS = ['#ff2d78', '#ff7a45', '#ffd166', '#00ff88', '#00e5ff', '#8b5cf6'];
  let bricks, ball, paddle, score, lives, level, running, loop, particles = [], stuck = true;

  function buildBricks() {
    bricks = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        bricks.push({ x: c * BW + 2, y: TOP + r * (BH + 4), w: BW - 4, h: BH, color: COLORS[r], alive: true, hp: level > 1 && r < 2 ? 2 : 1 });
  }

  function reset() {
    paddle = { x: W / 2 - 50, w: 100, h: 12, y: H - 30 };
    ball = { x: W / 2, y: H - 50, vx: 4 * (Math.random() < 0.5 ? -1 : 1), vy: -5, r: 7 };
    stuck = true;
  }

  function newGame() {
    score = 0; lives = 3; level = 1;
    buildBricks(); reset(); running = true;
    document.getElementById('bo-score').textContent = 0;
    document.getElementById('bo-lives').textContent = 3;
    document.getElementById('bo-level').textContent = 1;
  }

  function burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    paddle.x = Math.max(0, Math.min(W - paddle.w, (e.clientX - r.left) * (W / r.width) - paddle.w / 2));
  });
  canvas.addEventListener('click', () => { if (stuck) stuck = false; });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    paddle.x = Math.max(0, Math.min(W - paddle.w, (e.touches[0].clientX - r.left) * (W / r.width) - paddle.w / 2));
  }, { passive: false });

  function tick() {
    if (!running) return;
    if (!stuck) {
      ball.x += ball.vx; ball.y += ball.vy;
      // muri
      if (ball.x - ball.r < 0 || ball.x + ball.r > W) { ball.vx *= -1; ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x)); burst(ball.x, ball.y, '#fff', 5); }
      if (ball.y - ball.r < 0) { ball.vy *= -1; ball.y = ball.r; }
      // paddle
      if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vy = -Math.abs(ball.vy) * 1.02;
        ball.vx = hit * 6;
        ball.y = paddle.y - ball.r;
        burst(ball.x, ball.y, '#00e5ff', 6);
      }
      // mattoni
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.hp--;
          if (b.hp <= 0) {
            b.alive = false;
            score += 10; burst(b.x + b.w / 2, b.y + b.h / 2, b.color, 12);
          } else burst(ball.x, ball.y, '#ffd166', 6);
          ball.vy *= -1;
          document.getElementById('bo-score').textContent = score;
          break;
        }
      }
      // palla persa
      if (ball.y - ball.r > H) {
        lives--;
        document.getElementById('bo-lives').textContent = lives;
        burst(W / 2, H - 10, '#ff2d78', 20);
        if (lives <= 0) { gameOver(); return; }
        reset();
      }
      // livello completato
      if (bricks.every(b => !b.alive)) {
        level++;
        document.getElementById('bo-level').textContent = level;
        buildBricks(); reset();
        ball.vx *= 1.15; ball.vy *= 1.1;
      }
    } else {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 1;
    }

    // particelle
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.03; });

    // disegno
    ctx.fillStyle = '#080a14'; ctx.fillRect(0, 0, W, H);
    // mattoni con glow
    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.shadowBlur = 8; ctx.shadowColor = b.color;
      ctx.fillStyle = b.hp > 1 ? '#ffd166' : b.color;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();
      ctx.shadowBlur = 0;
    });
    // particelle
    particles.forEach(p => {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // paddle
    ctx.shadowBlur = 15; ctx.shadowColor = '#00e5ff';
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6); ctx.fill();
    ctx.shadowBlur = 0;
    // palla
    ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    if (stuck) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '16px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Clicca o premi SPAZIO per lanciare', W / 2, H / 2);
    }
  }

  function gameOver() {
    running = false; clearInterval(loop);
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = '32px Orbitron, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(`Punteggio: ${score} — Livello: ${level}`, W / 2, H / 2 + 30);
    const btn = document.createElement('button');
    btn.className = 'primary'; btn.textContent = 'Rigioca';
    btn.onclick = () => { container.querySelectorAll('button').forEach(b => b.remove()); renderBreakout(container); };
    container.appendChild(btn);
  }

  document.addEventListener('keydown', function spaceHandler(e) {
    if (e.code === 'Space' && stuck && running) { stuck = false; e.preventDefault(); }
  });

  newGame();
  loop = setInterval(tick, 1000 / 60);
}

// ===== 12. TETRIS =====
function renderTetris(container) {
  const COLS = 10, ROWS = 20, CELL = 30;
  const W = 360, H = 660, OX = 30, OY = 50;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.className = 'tetris-hud';
  hud.innerHTML = '<span>Punteggio: <b id="tt-score">0</b></span><span>Linee: <b id="tt-lines">0</b></span><span>Livello: <b id="tt-level">1</b></span>';
  container.prepend(hud);

  const SHAPES = {
    I: { m: [[1,1,1,1]], c: '#00e5ff' },
    O: { m: [[1,1],[1,1]], c: '#ffd166' },
    T: { m: [[0,1,0],[1,1,1]], c: '#8b5cf6' },
    S: { m: [[0,1,1],[1,1,0]], c: '#00ff88' },
    Z: { m: [[1,1,0],[0,1,1]], c: '#ff2d78' },
    J: { m: [[1,0,0],[1,1,1]], c: '#4a9eff' },
    L: { m: [[0,0,1],[1,1,1]], c: '#ff7a45' },
  };
  const TYPES = Object.keys(SHAPES);

  let grid, piece, next, score, lines, level, running, dropTimer, particles = [];

  function rotate(m) {
    const h = m.length, w = m[0].length;
    const r = Array.from({length: w}, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) r[x][h - 1 - y] = m[y][x];
    return r;
  }

  function collide(m, px, py) {
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const gx = px + x, gy = py + y;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
      if (gy >= 0 && grid[gy][gx]) return true;
    }
    return false;
  }

  function spawn() {
    const type = next || TYPES[Math.floor(Math.random() * TYPES.length)];
    next = TYPES[Math.floor(Math.random() * TYPES.length)];
    const s = SHAPES[type];
    piece = { m: s.m.map(r => r.slice()), x: Math.floor((COLS - s.m[0].length) / 2), y: type === 'I' ? -1 : 0, color: s.c, type };
    if (collide(piece.m, piece.x, piece.y)) gameOver();
  }

  function lock() {
    piece.m.forEach((row, y) => row.forEach((v, x) => {
      if (v && piece.y + y >= 0) grid[piece.y + y][piece.x + x] = piece.color;
    }));
    // clear lines
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every(v => v)) {
        grid.splice(y, 1); grid.unshift(Array(COLS).fill(null));
        cleared++; y++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] * level;
      level = Math.floor(lines / 10) + 1;
      // particelle sulle linee cancellate
      for (let i = 0; i < 30; i++) {
        particles.push({ x: Math.random() * COLS * CELL + OX, y: OY + Math.random() * ROWS * CELL, vx: (Math.random()-0.5)*4, vy: -Math.random()*3, life: 1, color: '#00e5ff' });
      }
      updateHud();
    }
    spawn();
  }

  function updateHud() {
    document.getElementById('tt-score').textContent = score;
    document.getElementById('tt-lines').textContent = lines;
    document.getElementById('tt-level').textContent = level;
  }

  function tick() {
    if (!running) return;
    if (!collide(piece.m, piece.x, piece.y + 1)) piece.y++;
    else lock();
    draw();
  }

  function hardDrop() {
    while (!collide(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 2; }
    updateHud();
    lock();
    draw();
  }

  function drawCell(x, y, color, ghost = false) {
    const px = OX + x * CELL, py = OY + y * CELL;
    ctx.globalAlpha = ghost ? 0.15 : 1;
    ctx.shadowBlur = ghost ? 0 : 10; ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(px + 1, py + 1, CELL - 2, CELL - 2, 4); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.fillStyle = '#080a14'; ctx.fillRect(0, 0, W, H);
    // griglia
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(OX + x*CELL, OY); ctx.lineTo(OX + x*CELL, OY + ROWS*CELL); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(OX, OY + y*CELL); ctx.lineTo(OX + COLS*CELL, OY + y*CELL); ctx.stroke(); }
    // blocchi fissi
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++)
      if (grid[y][x]) drawCell(x, y, grid[y][x]);
    // ghost piece
    if (piece) {
      let gy = piece.y;
      while (!collide(piece.m, piece.x, gy + 1)) gy++;
      piece.m.forEach((row, y) => row.forEach((v, x) => {
        if (v && gy + y >= 0) drawCell(piece.x + x, gy + y, piece.color, true);
      }));
      // pezzo attuale
      piece.m.forEach((row, y) => row.forEach((v, x) => {
        if (v && piece.y + y >= 0) drawCell(piece.x + x, piece.y + y, piece.color);
      }));
    }
    // next piece preview
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px Orbitron, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('NEXT', OX, 18);
    if (next) {
      const s = SHAPES[next];
      const px = OX + 10, py = 26;
      s.m.forEach((row, y) => row.forEach((v, x) => {
        if (v) {
          ctx.shadowBlur = 8; ctx.shadowColor = s.c; ctx.fillStyle = s.c;
          ctx.beginPath(); ctx.roundRect(px + x*18, py + y*18, 16, 16, 3); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }));
    }
    // particelle
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02;
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function gameOver() {
    running = false; clearInterval(dropTimer);
    document.removeEventListener('keydown', onKey);
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = '32px Orbitron, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(`Punteggio: ${score} — ${lines} linee`, W / 2, H / 2 + 30);
    const btn = document.createElement('button');
    btn.className = 'primary'; btn.textContent = 'Rigioca';
    btn.onclick = () => renderTetris(container);
    container.appendChild(btn);
  }

  function onKey(e) {
    if (!running || !piece) return;
    const k = e.key;
    if (k === 'ArrowLeft' && !collide(piece.m, piece.x - 1, piece.y)) piece.x--;
    else if (k === 'ArrowRight' && !collide(piece.m, piece.x + 1, piece.y)) piece.x++;
    else if (k === 'ArrowDown') { if (!collide(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 1; updateHud(); } }
    else if (k === 'ArrowUp' || k === 'x' || k === 'X') {
      const rm = rotate(piece.m);
      for (const dx of [0, -1, 1, -2, 2]) {
        if (!collide(rm, piece.x + dx, piece.y)) { piece.m = rm; piece.x += dx; break; }
      }
    } else if (k === ' ') { e.preventDefault(); hardDrop(); return; }
    else return;
    draw();
  }

  function newGame() {
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(null));
    score = 0; lines = 0; level = 1; running = true; next = null;
    updateHud();
    spawn(); spawn();
    clearInterval(dropTimer);
    dropTimer = setInterval(tick, 800);
    draw();
  }

  document.addEventListener('keydown', onKey);
  newGame();
}

// ===== 13. FLAPPY BIRD =====
function renderFlappy(container) {
  const W = 420, H = 620, GROUND = H - 70;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.className = 'flappy-hud';
  hud.innerHTML = '<span>Punteggio: <b id="fl-score">0</b></span><span>Record: <b id="fl-best">' + (localStorage.getItem('flappyBest') || 0) + '</b></span>';
  container.prepend(hud);

  let bird, pipes, score, best = +(localStorage.getItem('flappyBest') || 0), state, particles = [], frame = 0, loop = null;

  function reset() {
    bird = { x: 90, y: H / 2, vy: 0, r: 14, rot: 0 };
    pipes = []; score = 0; frame = 0; particles = [];
    state = 'ready';
    document.getElementById('fl-score').textContent = 0;
  }

  function flap() {
    if (state === 'ready') state = 'play';
    if (state === 'play') {
      bird.vy = -7.5;
      for (let i = 0; i < 5; i++) particles.push({ x: bird.x - 10, y: bird.y + 8, vx: -1 - Math.random(), vy: 1 + Math.random() * 2, life: 1, color: '#ffd166' });
    }
  }

  function die() {
    state = 'dead';
    for (let i = 0; i < 25; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 4;
      particles.push({ x: bird.x, y: bird.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color: i % 2 ? '#00e5ff' : '#ff2d78' });
    }
    if (score > best) { best = score; localStorage.setItem('flappyBest', best); }
    document.getElementById('fl-best').textContent = best;
  }

  canvas.addEventListener('click', () => {
    if (state === 'dead') { clearInterval(loop); renderFlappy(container); return; }
    flap();
  });
  document.addEventListener('keydown', function flKey(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state === 'dead') { clearInterval(loop); renderFlappy(container); }
      else flap();
    }
  });

  function tick() {
    frame++;
    // sfondo
    ctx.fillStyle = '#0a0e1f'; ctx.fillRect(0, 0, W, H);
    // stelle
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5) % W, sy = (i * 89.3) % (GROUND - 100);
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(frame / 30 + i);
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    if (state === 'play') {
      bird.vy += 0.45;
      bird.y += bird.vy;
      bird.rot = Math.max(-0.5, Math.min(1.2, bird.vy * 0.08));
      // tubi
      if (frame % 100 === 0 || (pipes.length && pipes[pipes.length-1].x < W - 220)) {
        if (pipes.length === 0 || pipes[pipes.length-1].x < W - 220) {
          const gapH = 150, gapY = 60 + Math.random() * (GROUND - 120 - gapH);
          pipes.push({ x: W + 20, gapY, gapH, w: 60, scored: false });
        }
      }
      const speed = 2.5 + Math.min(1.5, score * 0.05);
      pipes.forEach(p => p.x -= speed);
      pipes = pipes.filter(p => p.x > -p.w - 20);
      // collisione tubi
      for (const p of pipes) {
        if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w) {
          if (bird.y - bird.r < p.gapY || bird.y + bird.r > p.gapY + p.gapH) { die(); }
        }
        if (!p.scored && p.x + p.w < bird.x) { p.scored = true; score++; document.getElementById('fl-score').textContent = score; }
      }
      // terreno
      if (bird.y + bird.r > GROUND) { bird.y = GROUND - bird.r; die(); }
      if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = 0; }
    } else if (state === 'ready') {
      bird.y = H / 2 + Math.sin(frame / 20) * 8;
      bird.rot = 0;
    } else {
      bird.vy += 0.45; bird.y += bird.vy; bird.rot = Math.min(1.5, bird.rot + 0.05);
      if (bird.y + bird.r > GROUND) bird.y = GROUND - bird.r;
    }

    // disegna tubi
    pipes.forEach(p => {
      const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      grad.addColorStop(0, '#ff2d78'); grad.addColorStop(0.5, '#ff7a45'); grad.addColorStop(1, '#ffd166');
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff2d78';
      ctx.fillStyle = grad;
      // tubo alto
      ctx.beginPath(); ctx.roundRect(p.x, -10, p.w, p.gapY + 10, [0,0,6,6]); ctx.fill();
      // tubo basso
      ctx.beginPath(); ctx.roundRect(p.x, p.gapY + p.gapH, p.w, GROUND - p.gapY - p.gapH + 10, [6,6,0,0]); ctx.fill();
      ctx.shadowBlur = 0;
      // bordi dei tubi
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x - 3, p.gapY - 18, p.w + 6, 18);
      ctx.fillRect(p.x - 3, p.gapY + p.gapH, p.w + 6, 18);
    });

    // terreno
    ctx.fillStyle = '#141a30'; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.strokeStyle = 'rgba(0,229,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
    ctx.lineWidth = 1;

    // particelle
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.03;
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // uccello
    ctx.save();
    ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
    ctx.shadowBlur = 15; ctx.shadowColor = '#00e5ff';
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.ellipse(0, 0, bird.r, bird.r * 0.8, 0, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    // ala
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath(); ctx.ellipse(-4, 2, 8, 4, -0.4, 0, 7); ctx.fill();
    // occhio
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(6, -4, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0e1f';
    ctx.beginPath(); ctx.arc(7.5, -4, 2, 0, 7); ctx.fill();
    // becco
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(20, 0); ctx.lineTo(12, 3); ctx.closePath(); ctx.fill();
    ctx.restore();

    // testi stato
    ctx.textAlign = 'center';
    if (state === 'ready') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '28px Orbitron, sans-serif';
      ctx.fillText('FLAPPY BIRD', W / 2, H / 2 - 60);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Click o SPAZIO per volare', W / 2, H / 2 - 20);
    } else if (state === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '32px Orbitron, sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.font = '20px Inter, sans-serif';
      ctx.fillText(`Punteggio: ${score} — Record: ${best}`, W / 2, H / 2 + 20);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Click per rigiocare', W / 2, H / 2 + 60);
    }
  }

  reset();
  loop = setInterval(tick, 1000 / 60);
}
