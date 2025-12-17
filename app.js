const game = document.getElementById("game");
const hudStatus = document.getElementById("hudStatus");
const hudPos = document.getElementById("hudPos");

const layerFar = document.getElementById("layerFar");
const layerMid = document.getElementById("layerMid");
const layerNear = document.getElementById("layerNear");

const dialog = document.getElementById("dialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const choicesEl = document.getElementById("choices");
const btnClose = document.getElementById("btnClose");
const btnSpeak = document.getElementById("btnSpeak");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const actBtn = document.getElementById("actBtn");

const hotspots = [...document.querySelectorAll(".hotspot")];

let x = 0;               // posição “mundo”
let vx = 0;              // velocidade
let facing = 1;
let isDialogOpen = false;

const WORLD_MAX = 2200;  // tamanho “virtual” do bairro

const scenes = {
  casa1: {
    title: "Casa 1 — Pedido de ajuda",
    text: "Você chegou perto de uma casa. Um colega está confuso e você quer ajudar sem brigar. Qual frase é melhor?",
    choices: [
      { label: "Você quer que eu te ajude?", ok: true, feedback: "Boa! Perguntar com calma é acolhedor." },
      { label: "Sai daqui!", ok: false, feedback: "Essa frase pode assustar e aumentar o conflito." },
      { label: "Eu preciso de uma pausa.", ok: true, feedback: "Ótimo! Pausa é uma estratégia inteligente." },
    ],
  },
  escola: {
    title: "Escola — Situação social",
    text: "Na escola, o barulho ficou forte. Você quer se comunicar com segurança. O que dizer?",
    choices: [
      { label: "Está muito alto. Posso ir para um lugar mais calmo?", ok: true, feedback: "Perfeito! Você explicou a necessidade." },
      { label: "Eu odeio todo mundo!", ok: false, feedback: "Isso pode machucar e piorar a situação." },
      { label: "Posso usar meu fone ou fazer pausa?", ok: true, feedback: "Excelente! Alternativas ajudam muito." },
    ],
  },
  parque: {
    title: "Parque — Emoções",
    text: "No parque, alguém pegou seu brinquedo. Você ficou irritado. Como falar?",
    choices: [
      { label: "Eu não gostei. Devolve, por favor.", ok: true, feedback: "Ótimo! Claro e respeitoso." },
      { label: "Vou bater!", ok: false, feedback: "Violência não é uma boa saída. Vamos tentar outra frase." },
      { label: "Eu estou bravo. Preciso de ajuda.", ok: true, feedback: "Excelente! Nomeou a emoção e pediu suporte." },
    ],
  },
};

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function updateLayers(){
  // move as camadas em velocidades diferentes (parallax)
  const far = -x * 0.15;
  const mid = -x * 0.35;
  const near = -x * 0.55;
  layerFar.style.transform = `translateX(${far}px)`;
  layerMid.style.transform = `translateX(${mid}px)`;
  layerNear.style.transform = `translateX(${near}px)`;

  hudPos.textContent = `x: ${Math.round(x)}`;
}

function findNearbyHotspot(){
  // hotspots estão em pixels “do mundo” (left)
  const playerWorldX = x + (game.clientWidth / 2);
  const tolerance = 80;

  let best = null;
  let bestDist = Infinity;

  for (const hs of hotspots){
    const left = parseFloat(hs.style.left || "0");
    const dist = Math.abs(left - playerWorldX);
    if (dist < tolerance && dist < bestDist){
      bestDist = dist;
      best = hs;
    }
  }
  return best ? best.dataset.id : null;
}

function openDialog(id){
  const s = scenes[id];
  if (!s) return;

  isDialogOpen = true;
  dialog.hidden = false;
  dialogTitle.textContent = s.title;
  dialogText.textContent = s.text;

  choicesEl.innerHTML = "";
  s.choices.forEach((c) => {
    const b = document.createElement("button");
    b.className = "btn choice";
    b.type = "button";
    b.textContent = c.label;
    b.addEventListener("click", () => {
      hudStatus.textContent = c.feedback;
      hudStatus.style.borderColor = c.ok ? "rgba(49,208,125,.6)" : "rgba(255,93,108,.6)";
      closeDialog();
    });
    choicesEl.appendChild(b);
  });
}

function closeDialog(){
  isDialogOpen = false;
  dialog.hidden = true;
  game.focus();
}

function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch(e){
    // sem TTS, segue o baile
  }
}

function tryInteract(){
  const near = findNearbyHotspot();
  if (!near){
    hudStatus.textContent = "Nada para interagir aqui. Ande até uma casa/escola/parque.";
    return;
  }
  hudStatus.textContent = `Interagindo com: ${near}`;
  openDialog(near);
}

function onKeyDown(e){
  if (isDialogOpen){
    if (e.key === "Escape") closeDialog();
    return;
  }

  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a"){
    vx = -2.2; facing = -1;
  } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d"){
    vx = 2.2; facing = 1;
  } else if (e.key === " " || e.code === "Space"){
    e.preventDefault();
    tryInteract();
  }
}

function onKeyUp(e){
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a"){
    if (vx < 0) vx = 0;
  } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d"){
    if (vx > 0) vx = 0;
  }
}

function tick(){
  if (!isDialogOpen){
    x = clamp(x + vx, 0, WORLD_MAX);
    updateLayers();

    const near = findNearbyHotspot();
    if (near){
      hudStatus.textContent = `Perto de ${near}. Aperte Espaço (ou 🤝).`;
    } else if (vx !== 0){
      hudStatus.textContent = "Pedalando… encontre um local para interagir.";
    }
  }
  requestAnimationFrame(tick);
}

// Touch buttons (segura pra andar)
let touchLeft=false, touchRight=false;
function applyTouch(){
  if (isDialogOpen) return;
  if (touchLeft && !touchRight){ vx = -2.2; facing = -1; }
  else if (touchRight && !touchLeft){ vx = 2.2; facing = 1; }
  else vx = 0;
}
function bindHold(btn, onDown, onUp){
  btn.addEventListener("pointerdown", (e)=>{ e.preventDefault(); onDown(); applyTouch(); });
  btn.addEventListener("pointerup", (e)=>{ e.preventDefault(); onUp(); applyTouch(); });
  btn.addEventListener("pointercancel", (e)=>{ e.preventDefault(); onUp(); applyTouch(); });
  btn.addEventListener("pointerleave", (e)=>{ e.preventDefault(); onUp(); applyTouch(); });
}

bindHold(leftBtn, ()=>touchLeft=true, ()=>touchLeft=false);
bindHold(rightBtn, ()=>touchRight=true, ()=>touchRight=false);
actBtn.addEventListener("click", ()=>{ if(!isDialogOpen) tryInteract(); });

btnClose.addEventListener("click", closeDialog);
btnSpeak.addEventListener("click", ()=> speak(`${dialogTitle.textContent}. ${dialogText.textContent}`));

game.addEventListener("click", ()=> game.focus());
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

// Start
game.focus();
updateLayers();
tick();
