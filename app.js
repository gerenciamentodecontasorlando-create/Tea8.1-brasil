/* ===========================
   PWA install + Service Worker
=========================== */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("btnInstall");
  btn.hidden = false;
  btn.onclick = async () => {
    btn.hidden = true;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}

/* ===========================
   TTS (voz do sistema / IA local)
=========================== */
const voiceSelect = document.getElementById("voiceSelect");
const rateEl = document.getElementById("rate");
const pitchEl = document.getElementById("pitch");

let voices = [];
function loadVoices() {
  voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  voiceSelect.innerHTML = "";

  // Prioriza pt-BR se tiver
  const sorted = [...voices].sort((a,b) => {
    const ap = (a.lang || "").toLowerCase().includes("pt");
    const bp = (b.lang || "").toLowerCase().includes("pt");
    return (bp?1:0) - (ap?1:0);
  });

  sorted.forEach((v, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = `${v.name} — ${v.lang}`;
    voiceSelect.appendChild(opt);
  });
}
if (window.speechSynthesis) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
  if (!window.speechSynthesis) return;

  // Em alguns celulares, precisa parar o que estiver falando antes
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const idx = parseInt(voiceSelect.value || "0", 10);
  const chosen = voices[idx] || voices.find(v => (v.lang||"").toLowerCase().includes("pt")) || voices[0];
  if (chosen) u.voice = chosen;

  u.lang = (chosen && chosen.lang) ? chosen.lang : "pt-BR";
  u.rate = parseFloat(rateEl.value || "0.9");
  u.pitch = parseFloat(pitchEl.value || "1.0");

  speechSynthesis.speak(u);
}

/* ===========================
   Situações (8 no total)
=========================== */
const situations = [
  {
    id: "bloqueio",
    phaseTitle: "Caminho bloqueado",
    goal: "Pedir passagem com educação",
    scene: "Duas crianças bloquearam a calçada. Barto quer passar sem brigar.",
    emotions: ["😠 Bravo", "😕 Confuso", "😟 Ansioso"],
    phrases: [
      "Com licença, posso passar?",
      "Por favor, dá pra abrir um espacinho?",
      "Eu não quero brigar. Só quero passar."
    ],
    okPhrases: [0,1,2],
    reinforce: "Boa! Falar com calma ajuda as pessoas a entenderem."
  },
  {
    id: "fome",
    phaseTitle: "Cheguei com fome",
    goal: "Expressar necessidade básica",
    scene: "Barto chega em casa e sente fome. Ele precisa comunicar o que quer.",
    emotions: ["🤤 Com fome", "😣 Cansado", "😕 Confuso"],
    phrases: [
      "Estou com fome.",
      "Posso comer agora, por favor?",
      "Você pode me ajudar a escolher uma comida?"
    ],
    okPhrases: [0,1,2],
    reinforce: "Perfeito. Quando eu digo o que preciso, fica mais fácil receber ajuda."
  },
  {
    id: "barulho",
    phaseTitle: "Barulho alto",
    goal: "Pedir pausa / silêncio",
    scene: "Um caminhão passa fazendo um barulho muito alto. Barto fica incomodado.",
    emotions: ["😰 Assustado", "😖 Incomodado", "😟 Ansioso"],
    phrases: [
      "Está muito alto.",
      "Quero um lugar silencioso, por favor.",
      "Preciso parar um pouco."
    ],
    okPhrases: [0,1,2],
    reinforce: "Ótimo. Pedir pausa é uma forma inteligente de se cuidar."
  },
  {
    id: "objeto",
    phaseTitle: "Objeto sumiu",
    goal: "Pedir ajuda sem crise",
    scene: "Barto não encontra o capacete. Ele sente frustração, mas pode pedir ajuda.",
    emotions: ["😠 Frustrado", "😢 Triste", "😕 Confuso"],
    phrases: [
      "Eu não achei meu capacete.",
      "Você pode me ajudar a procurar?",
      "Vamos procurar juntos?"
    ],
    okPhrases: [0,1,2],
    reinforce: "Boa! Pedir ajuda é mais rápido do que brigar com o problema."
  },
  {
    id: "rotina",
    phaseTitle: "Mudança de rotina",
    goal: "Negociar / perguntar o próximo passo",
    scene: "Barto queria brincar, mas agora é hora do banho. Mudou o plano.",
    emotions: ["😤 Irritado", "😕 Confuso", "😟 Ansioso"],
    phrases: [
      "Mais 5 minutos, por favor?",
      "O que vem depois do banho?",
      "Podemos combinar um horário pra brincar?"
    ],
    okPhrases: [0,1,2],
    reinforce: "Excelente. Perguntar e combinar deixa a rotina mais previsível."
  },
  {
    id: "naoentendido",
    phaseTitle: "Não me entenderam",
    goal: "Tentar de novo de forma calma",
    scene: "Barto falou, mas a pessoa não entendeu. Ele pode tentar de novo sem desistir.",
    emotions: ["😣 Frustrado", "😔 Desanimado", "😕 Confuso"],
    phrases: [
      "Vou tentar falar de outro jeito.",
      "Você pode repetir o que entendeu?",
      "Espera um pouquinho, por favor."
    ],
    okPhrases: [0,1,2],
    reinforce: "Isso! Tentar de novo é coragem. Comunicação é treino."
  },
  {
    id: "fila",
    phaseTitle: "Esperar na fila",
    goal: "Pedir informação / regular ansiedade",
    scene: "Barto precisa esperar na fila. Ele fica inquieto.",
    emotions: ["😟 Ansioso", "😣 Impaciente", "😕 Confuso"],
    phrases: [
      "Quanto tempo falta, por favor?",
      "Eu estou ficando ansioso. Posso respirar um pouco?",
      "Eu preciso de um minutinho."
    ],
    okPhrases: [0,1,2],
    reinforce: "Boa. Nomear a ansiedade e pedir um minuto ajuda muito."
  },
  {
    id: "cansaco",
    phaseTitle: "Sobrecarga",
    goal: "Pedir descanso",
    scene: "Depois de tanta coisa, Barto sente o corpo pesado e a mente cheia.",
    emotions: ["😵 Cansado", "😔 Triste", "😖 Sobrecarregado"],
    phrases: [
      "Quero descansar um pouco.",
      "Preciso de silêncio.",
      "Posso ficar sozinho um minutinho?"
    ],
    okPhrases: [0,1,2],
    reinforce: "Perfeito. Descanso é parte do cuidado. Você fez uma escolha saudável."
  }
];

/* ===========================
   UI da lateral (emoções/frases)
=========================== */
const situationText = document.getElementById("situationText");
const emotionRow = document.getElementById("emotionRow");
const phraseRow = document.getElementById("phraseRow");
const feedback = document.getElementById("feedback");

const hudPhase = document.getElementById("hudPhase");
const hudGoal = document.getElementById("hudGoal");
const hudMode = document.getElementById("hudMode");

const btnSpeakSituation = document.getElementById("btnSpeakSituation");
const btnSpeakSelected = document.getElementById("btnSpeakSelected");
const btnReset = document.getElementById("btnReset");

let current = 0;
let selectedEmotion = -1;
let selectedPhrase = -1;

function renderSituation() {
  const s = situations[current];

  hudPhase.textContent = `Fase: ${current + 1}/8 — ${s.phaseTitle}`;
  hudGoal.textContent = `Objetivo: ${s.goal}`;

  situationText.textContent = s.scene;

  emotionRow.innerHTML = "";
  s.emotions.forEach((emo, i) => {
    const chip = document.createElement("div");
    chip.className = "chip" + (i === selectedEmotion ? " active" : "");
    chip.textContent = emo;
    chip.onclick = () => {
      selectedEmotion = i;
      setFeedback("Escolha agora uma frase pra ajudar o Barto.", "warn");
      renderSituation();
    };
    emotionRow.appendChild(chip);
  });

  phraseRow.innerHTML = "";
  s.phrases.forEach((ph, i) => {
    const c = document.createElement("div");
    c.className = "choice" + (i === selectedPhrase ? " active" : "");
    c.textContent = ph;
    c.onclick = () => {
      selectedPhrase = i;
      setFeedback("Boa! Agora aperta Espaço (ou toque em “Ouvir frase”) pra reforçar.", "ok");
      renderSituation();
    };
    phraseRow.appendChild(c);
  });
}

function setFeedback(text, kind="") {
  feedback.className = "feedback" + (kind ? " " + kind : "");
  feedback.textContent = text;
}

btnSpeakSituation.onclick = () => speak(situations[current].scene);
btnSpeakSelected.onclick = () => {
  const s = situations[current];
  if (selectedPhrase < 0) return setFeedback("Escolhe uma frase primeiro 🙂", "warn");
  speak(s.phrases[selectedPhrase]);
};

btnReset.onclick = () => resetAll();

function resetAll() {
  current = 0;
  selectedEmotion = -1;
  selectedPhrase = -1;
  gameState.mode = "ride";
  gameState.distance = 0;
  gameState.blocked = false;
  setFeedback("Vamos lá. Use ← →. Quando encontrar um desafio, aperte Espaço.", "warn");
  renderSituation();
}

/* ===========================
   Mini-game Canvas (bike side scroller)
=========================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = new Set();
window.addEventListener("keydown", (e) => {
  if (["ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
  keys.add(e.code);

  if (e.code === "Space") {
    // Interagir: se estiver em conversa e já escolheu frase, conclui
    if (gameState.mode === "talk") {
      confirmTalkChoice();
    } else if (gameState.mode === "ride" && gameState.blocked) {
      enterTalk();
    }
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

const gameState = {
  mode: "ride",            // ride | talk | home
  distance: 0,
  speed: 2.2,
  blocked: false,
  playerX: 130,
  playerY: 370,
  camX: 0
};

function enterTalk() {
  gameState.mode = "talk";
  hudMode.textContent = "Modo: Conversa";
  setFeedback("Escolha uma emoção e uma frase. Depois aperte Espaço para confirmar.", "warn");
  // “puxa” UI atual
  selectedEmotion = -1;
  selectedPhrase = -1;
  renderSituation();
  speak(situations[current].scene);
}

function confirmTalkChoice() {
  const s = situations[current];
  if (selectedPhrase < 0) {
    setFeedback("Escolhe uma frase primeiro 🙂", "warn");
    return;
  }

  speak(s.phrases[selectedPhrase]);

  // Aqui a regra é gentil: qualquer escolha “válida” passa
  setFeedback(s.reinforce, "ok");

  // Avança fase após 1.1s
  setTimeout(() => {
    current++;
    if (current >= situations.length) current = 0;

    // volta a andar
    gameState.mode = "ride";
    hudMode.textContent = "Modo: Jogo";
    gameState.blocked = false;
    selectedEmotion = -1;
    selectedPhrase = -1;
    renderSituation();
  }, 1100);
}

/* Obstáculos simples: a cada “meta” vira uma situação */
const triggers = [
  { at: 260, type: "talk" },   // bloqueio
  { at: 520, type: "talk" },   // fome (chegando em casa)
  { at: 820, type: "talk" },
  { at: 1120, type: "talk" },
  { at: 1420, type: "talk" },
  { at: 1720, type: "talk" },
  { at: 2020, type: "talk" },
  { at: 2320, type: "talk" }
];

function update(dt) {
  if (gameState.mode === "ride") {
    let vx = 0;
    if (keys.has("ArrowLeft")) vx -= 1;
    if (keys.has("ArrowRight")) vx += 1;

    gameState.distance += gameState.speed * vx;

    // limita pra não ir “pra trás” demais
    if (gameState.distance < 0) gameState.distance = 0;

    // checa gatilhos
    const nextTrigger = triggers.find(t => t.at > gameState.camX && t.at <= gameState.camX + 6);
    // camX avança com distância
    gameState.camX = gameState.distance;

    // bloqueia em pontos definidos (quando “chega” perto)
    const upcoming = triggers.find(t => Math.abs(t.at - gameState.camX) < 10);
    if (upcoming) {
      gameState.blocked = true;
      // O index da situação acompanha o current
      // (current já está apontando pra situação correspondente)
      setFeedback("Desafio! Aperte Espaço para conversar.", "warn");
    } else {
      gameState.blocked = false;
    }
  }
}

function draw() {
  // fundo
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // skyline simples
  ctx.fillStyle = "rgba(255,255,255,.05)";
  for (let i=0;i<14;i++){
    const bx = (i*90 - (gameState.camX*0.2)%90);
    ctx.fillRect(bx, 120, 70, 120 + (i%4)*20);
  }

  // rua
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fillRect(0, 410, canvas.width, 90);

  // calçada
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0, 360, canvas.width, 50);

  // “faixas” retrô
  ctx.fillStyle = "rgba(74,163,255,.25)";
  for (let i=0;i<20;i++){
    const x = (i*80 - (gameState.camX*1.0)%80);
    ctx.fillRect(x, 452, 40, 6);
  }

  // player (bike simples)
  const px = 180;
  const py = 370;

  // rodas
  ctx.strokeStyle = "rgba(231,236,255,.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px-25, py+35, 14, 0, Math.PI*2);
  ctx.arc(px+25, py+35, 14, 0, Math.PI*2);
  ctx.stroke();

  // corpo
  ctx.fillStyle = "rgba(74,163,255,.85)";
  ctx.fillRect(px-18, py+10, 36, 14);
  ctx.fillStyle = "rgba(231,236,255,.9)";
  ctx.fillRect(px-10, py-10, 20, 20); // cabeça

  // obstáculo visual quando bloqueado
  if (gameState.blocked && gameState.mode === "ride") {
    ctx.fillStyle = "rgba(255,204,102,.18)";
    ctx.fillRect(520, 330, 220, 90);

    ctx.fillStyle = "rgba(231,236,255,.95)";
    ctx.font = "16px system-ui";
    ctx.fillText("Crianças bloqueando → Aperte Espaço", 540, 380);
  }

  // overlay modo conversa
  if (gameState.mode === "talk") {
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "rgba(231,236,255,.95)";
    ctx.font = "22px system-ui";
    ctx.fillText("Momento de conversa", 30, 50);

    ctx.font = "14px system-ui";
    ctx.fillStyle = "rgba(231,236,255,.85)";
    ctx.fillText("Escolha emoção + frase na lateral. Aperte Espaço para confirmar.", 30, 78);
  }
}

let last = performance.now();
function loop(now){
  const dt = Math.min(0.033, (now-last)/1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

/* Boot */
function boot(){
  renderSituation();
  setFeedback("Use ← →. Quando aparecer um desafio, aperte Espaço.", "warn");
  requestAnimationFrame(loop);
}
boot();
