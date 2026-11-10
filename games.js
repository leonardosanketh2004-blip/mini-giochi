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
      food = spawnFood();
    } else snake.pop();

    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#e94560';
    ctx.beginPath(); ctx.arc(food.x*size+size/2, food.y*size+size/2, size/2-2, 0, 7); ctx.fill();
    snake.forEach((s,i) => {
      ctx.fillStyle = i===0 ? '#7ec8ff' : `hsl(140, 60%, ${50 - i*1.5}%)`;
      ctx.fillRect(s.x*size+1, s.y*size+1, size-2, size-2);
    });
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
    area.textContent = 'Aspetta il VERDE...';
    result.textContent = '';
    btn.disabled = true;
    const delay = 1500 + Math.random()*3000;
    timeout = setTimeout(() => {
      state = 'go';
      startTime = performance.now();
      area.style.background = '#27ae60';
      area.textContent = 'CLICCA!';
    }, delay);
  };

  area.addEventListener('click', () => {
    if (state === 'waiting') {
      clearTimeout(timeout);
      state = 'idle';
      area.style.background = '#c0392b';
      area.textContent = 'Troppo presto! Riprova.';
      result.textContent = '❌ Hai cliccato prima del verde.';
      btn.disabled = false;
    } else if (state === 'go') {
      const ms = Math.round(performance.now() - startTime);
      state = 'idle';
      area.style.background = '#333';
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

  document.addEventListener('keydown', onKey);
  function onKey(e) {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') me.y = Math.max(0, me.y - 22);
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') me.y = Math.min(H - ph, me.y + 22);
  }
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    me.y = Math.max(0, Math.min(H - ph, (e.clientY - r.top) * (H / r.height) - ph/2));
  });

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
    }
    // paddle cpu
    if (ball.vx > 0 && ball.x + ballR >= cpu.x && ball.x + ballR <= cpu.x + pw + ballR && ball.y > cpu.y - ballR && ball.y < cpu.y + ph + ballR) {
      ball.vx = -Math.abs(ball.vx) * 1.05; ball.vy += (ball.y - (cpu.y + ph/2)) * 0.15;
      ball.x = cpu.x - ballR;
    }

    if (ball.x < -20) { cpuScore++; document.getElementById('pong-cpu').textContent = cpuScore; resetBall(1); }
    if (ball.x > W + 20) { meScore++; document.getElementById('pong-me').textContent = meScore; resetBall(-1); }
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

    ctx.fillStyle = '#080a14'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.setLineDash([6,8]);
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);
    ctx.shadowBlur = 15; ctx.shadowColor = '#00e5ff';
    ctx.fillStyle = '#00e5ff'; ctx.fillRect(me.x, me.y, pw, ph);
    ctx.shadowColor = '#ff2d78'; ctx.fillStyle = '#ff2d78'; ctx.fillRect(cpu.x, cpu.y, pw, ph);
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ballR, 0, 7); ctx.fill();
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
      t.remove();
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
