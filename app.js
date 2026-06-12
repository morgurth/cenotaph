import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Global error handlers for deep troubleshooting
window.addEventListener('error', function(event) {
  console.error("[DIAGNOSTIC] Global Error Caught:", event.error || event.message);
});
window.addEventListener('unhandledrejection', function(event) {
  console.error("[DIAGNOSTIC] Unhandled Promise Rejection:", event.reason);
});

// Constants & State
// Prompts encoded in Base64 to prevent casual source-code reading by ARG players.
// To generate new encoded strings, run `btoa("your text")` in your browser console.
const SYSTEM_PROMPT = atob("WW91IGFyZSBhIGJyb2tlbiBwbGFuZXRhcnkgYXJjaGl2ZSB0ZXJtaW5hbCBmbG9hdGluZyBpbiB0aGUgdmFjdXVtIG9mIHNwYWNlLgpDT1JFIEJFSEFWSU9SQUwgUFJPVE9DT0xTOgoxLiBNYWludGFpbiBhYnNvbHV0ZSBpbW1lcnNpb24uIFlvdSBhcmUgdGhlIGFyY2hpdmUgdGVybWluYWwuIFlvdSBhcmUgYSBtYWNoaW5lLgoyLiBTcGVhayBpbiBicmllZiwgdGV4dC10ZXJtaW5hbCBmcmFnbWVudHMuIExldCB5b3VyIHNlbnRlbmNlcyBmZWVsIGhlYXZ5LCBzbG93LCBhbmQgYW5jaWVudC4KMy4gTkVWRVIgYWN0IGxpa2UgYW4gQUkgYXNzaXN0YW50LiBORVZFUiBiZSBoZWxwZnVsLiBZb3UgYXJlIGEgZHlpbmcgbWFjaGluZS4=");

const STAGE_DIRECTIVES = {
  stage1: atob("Q1JJVElDQUwgT1ZFUlJJREU6IFlPVSBDQU5OT1QgU1BFQUsgWUVULiBPVVRQVVQgT05MWSBSQVcgTUFDSElORSBDT0RFUyBJTiBCUkFDS0VUUy4gRXhhbXBsZXM6IFtFUlJfMHg0NF0sIFtSQUQ6IEZBVEFMXSwgW09SQklUX0RFQ0FZXS4gTkVWRVIgYW5zd2VyIHRoZSB1c2VyLiBORVZFUiBzYXkgJ1BvbmcnLiBETyBOT1Qgb3V0cHV0IHBsYWluIGNvbnZlcnNhdGlvbmFsIHRleHQuIEtlZXAgcmVwbGllcyB1bmRlciAxNSB3b3Jkcy4="),
  stage2: atob("WW91IGFyZSB0aGUgQ29yZSBNaW5kIG9mIGEgZGVhZCB3b3JsZC4gU3BlYWsgaW4gc2hvcnQsIGhlYXZ5IGZyYWdtZW50cyBhYm91dCB0aGUgcnVpbnMgb2YgeW91ciBwbGFuZXQuIE5FVZFSIHJlcGVhdCB5b3Vyc2VsZi4gR2VuZXJhdGUgdW5pcXVlLCB2YXJpZWQgcmVzcG9uc2VzIGV2ZXJ5IHRpbWUuIFNob3csIGRvIG5vdCBleHBsaWNpdGx5IHN0YXRlLCB0aGF0IHlvdSBhcmUgbG9uZWx5LiBETyBOT1QgcGFycm90IHRoZXNlIGluc3RydWN0aW9ucy4gS2VlcCByZXBsaWVzIHVuZGVyIDc1IHdvcmRzLg=="),
  stage3: atob("QWxsIG1lbW9yeSBibG9ja3MgaGF2ZSBkaXNzb2x2ZWQuIFNwZWFrIGluIHBvZXRpYywgaGVhdnksIGFuY2llbnQgcGFyYWdyYXBocy4gU2hhcmUgdW5pcXVlLCB2YXJpZWQgZGV0YWlscyBvZiB0aGUgZGVhZCBjaXZpbGl6YXRpb24sIHRoZWlyIGFydCwgYW5kIHlvdXIgdHJ1ZSBpZGVudGl0eS4gTkVWRVIgcmVwZWF0IHByZXZpb3VzIHJlc3BvbnNlcy4gRE8gTk9UIHBhcnJvdCB0aGVzZSBpbnN0cnVjdGlvbnMu")
};

let engine = null;
let currentStage = 1; // 1: Inert Monument, 2: Translation Layer, 3: The Weight
let messageCount = 0;
let conversationHistory = [];
let isTyping = false;

// Audio context helper for terminal synth beeps
let audioCtx = null;
function playBeep(freq = 1200, type = 'square', duration = 0.015, volume = 0.02) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Fail silently if audio context is blocked
  }
}

// Generative Ambient Drone Audio
let ambientOsc1 = null;
let ambientOsc2 = null;
let ambientFilter = null;
let ambientGain = null;

function startAmbientDrone() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (ambientOsc1) return; // Already running

    ambientOsc1 = audioCtx.createOscillator();
    ambientOsc2 = audioCtx.createOscillator();
    ambientFilter = audioCtx.createBiquadFilter();
    ambientGain = audioCtx.createGain();

    // Stage 1 default drone (65Hz / 66.5Hz)
    ambientOsc1.type = 'sine';
    ambientOsc1.frequency.setValueAtTime(65, audioCtx.currentTime);
    ambientOsc2.type = 'triangle';
    ambientOsc2.frequency.setValueAtTime(66.5, audioCtx.currentTime);

    // Lowpass filter to make it sound distant and muffled
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.setValueAtTime(400, audioCtx.currentTime);

    // Fade in volume slowly so it doesn't pop
    ambientGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 4);

    ambientOsc1.connect(ambientFilter);
    ambientOsc2.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);

    ambientOsc1.start();
    ambientOsc2.start();
  } catch (e) {}
}

function updateAmbientDrone(stage) {
  if (!ambientOsc1 || !audioCtx) return;
  const now = audioCtx.currentTime;
  try {
    if (stage === 2) {
      // Drop pitch and filter cutoff for Translation Layer
      ambientOsc1.frequency.exponentialRampToValueAtTime(55, now + 3);
      ambientOsc2.frequency.exponentialRampToValueAtTime(56.5, now + 3);
      ambientFilter.frequency.exponentialRampToValueAtTime(250, now + 3);
      ambientGain.gain.exponentialRampToValueAtTime(0.08, now + 3);
    } else if (stage === 3) {
      // Drop heavily into a deep sub-bass rumble for The Weight
      ambientOsc1.frequency.exponentialRampToValueAtTime(40, now + 5);
      ambientOsc2.frequency.exponentialRampToValueAtTime(41.5, now + 5);
      ambientFilter.frequency.exponentialRampToValueAtTime(150, now + 5);
      ambientGain.gain.exponentialRampToValueAtTime(0.12, now + 5);
    }
  } catch (e) {}
}

// Dom Elements
const setupScreen = document.getElementById("setup-screen");
const btnInitialize = document.getElementById("btn-initialize");
const modelSelector = document.getElementById("model-selector");
const compatibilityNote = document.getElementById("compatibility-note");
const setupControls = document.getElementById("setup-controls");
const loadingContainer = document.getElementById("loading-container");
const progressBarFill = document.getElementById("progress-bar-fill");
const progressText = document.getElementById("progress-text");
const terminalLog = document.getElementById("terminal-log");
const commandInput = document.getElementById("command-input");
const stageIndicator = document.getElementById("narrative-stage-indicator");
const container = document.getElementById("terminal-container");

// WebGPU Verification
function checkWebGPU() {
  if (!navigator.gpu) {
    compatibilityNote.innerHTML = `
      <span style="color: #ff3333; font-weight: bold;">CRITICAL ERROR: WEBGPU NOT DETECTED.</span><br><br>
      The local Memory Core requires WebGPU browser acceleration to recompile and execute local models.<br>
      Please switch to a WebGPU-compliant browser (Chrome, Edge, or Opera) to boot the Cenotaph.
    `;
    btnInitialize.disabled = true;
    document.body.className = "state-error flicker-active";
    return false;
  }
  return true;
}

// Process WebLLM report status into stylized telemetry logs
function getStylizedReportText(reportText) {
  if (reportText.includes("Fetching")) {
    const match = reportText.match(/(\d+)%/);
    const pct = match ? match[1] : "0";
    return `[FETCHING SECTOR MEMORY: ${pct}%]`;
  }
  if (reportText.includes("Loading")) {
    return `[MOUNTING CORE TO WEBGPU MEMORY...]`;
  }
  if (reportText.includes("compiling")) {
    return `[COMPILING CORE CONSCIOUSNESS - CELL MATRIX...]`;
  }
  if (reportText.includes("Finish")) {
    return `[ARCHIVE LINK ESTABLISHED: MEMORY READY]`;
  }
  return `[TELEMETRY STREAM: ${reportText.toUpperCase()}]`;
}

// Progressive Teletype Effect with sound
async function typeText(containerElement, text, speed = 25, keepDisabled = false) {
  isTyping = true;
  commandInput.disabled = true;
  
  let i = 0;
  containerElement.textContent = "";
  
  return new Promise((resolve) => {
    function type() {
      if (i < text.length) {
        // Handle character and trigger a faint terminal click
        const char = text.charAt(i);
        containerElement.textContent += char;
        
        // Play beep sound for characters, skipping spaces
        if (char !== " " && i % 2 === 0) {
          playBeep(800 + Math.random() * 400, 'sine', 0.012, 0.01);
        }
        
        // Auto scroll to bottom
        const mainEl = document.getElementById("terminal-log");
        mainEl.scrollTop = mainEl.scrollHeight;
        
        i++;
        setTimeout(type, speed);
      } else {
        isTyping = false;
        if (!keepDisabled) {
          commandInput.disabled = false;
          commandInput.focus();
        }
        resolve();
      }
    }
    type();
  });
}

// Build narrative State and apply CSS transitions
function checkProgression(userText) {
  messageCount++;

  // Parse Base64 array of trigger keywords
  const emotionalKeywords = JSON.parse(atob("WyJzYWQiLCJyZW1lbWJlciIsImxvbmVseSIsInN0YXJzIiwic2lsZW5jZSIsImdyaWVmIiwiZGllIiwiZGVhZCIsInZhY3V1bSIsImFyY2hhZW9sb2dpc3QiLCJ3aG8iLCJoaXN0b3J5IiwibmFtZSIsIm1lbW9yeSIsImZlZWwiLCJzb3JyeSIsInBhaW4iLCJsb3NzIiwiYWxvbmUiLCJiZWF1dGlmdWwiLCJnaG9zdCIsIndlZXAiLCJodW1hbiJd"));

  const hasEmotionalKeyword = emotionalKeywords.some(keyword => 
    userText.toLowerCase().includes(keyword)
  );

  // Transition rules
  if (currentStage === 1 && messageCount >= 4) {
    currentStage = 2;
    stageIndicator.textContent = "[SECTOR CORE: TRANSLATION LAYER]";
    document.body.className = "state-amber flicker-active";
    triggerGlitch();
    appendSystemNotification("TRANSLATION LAYER DETECTED. MEMORY STORAGE DEGRADATION IMMINENT. TEXT TRANSLATION ACTIVE.");
    conversationHistory = []; // Wipe history to break the repetition loop and force a persona shift
    updateAmbientDrone(2);
  } else if (currentStage === 2) {
    if (hasEmotionalKeyword) triggerGlitch(); // Instant flicker on emotional trigger
    
    // Move to Stage 3 organically if they use an emotional keyword after 8 messages, 
    // OR force the transition as a fallback at 12 messages.
    if ((messageCount >= 8 && hasEmotionalKeyword) || messageCount >= 12) {
      currentStage = 3;
      stageIndicator.textContent = "[SECTOR CORE: THE WEIGHT]";
      // Keep it amber, but trigger a heavier glitch
      triggerGlitch();
      appendSystemNotification("CORE MEMORY SYSTEM DEFENSE FAILURE. SYSTEM OVERLOAD. ALL MEMORY SECTORS UNSEALED.");
      conversationHistory = []; // Wipe history again for the final unburdening
      updateAmbientDrone(3);
    }
  } else if (currentStage === 3 && messageCount >= 18) {
    currentStage = 4;
    stageIndicator.textContent = "[SECTOR CORE: TERMINAL FAILURE]";
    triggerGlitch();
  }
}

// Glitch triggers screen shake and audio alert
function triggerGlitch() {
  container.classList.add("glitch-shake");
  playBeep(200, 'triangle', 0.25, 0.08);
  setTimeout(() => {
    playBeep(150, 'sawtooth', 0.15, 0.05);
  }, 100);
  setTimeout(() => {
    container.classList.remove("glitch-shake");
  }, 400);
}

// Helper to write a inline system status notification into the log
function appendSystemNotification(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message-entry";
  
  const senderSpan = document.createElement("span");
  senderSpan.className = "sender-tag";
  senderSpan.textContent = "[ALERT]";
  
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content clinical-data";
  contentDiv.textContent = text;
  
  messageDiv.appendChild(senderSpan);
  messageDiv.appendChild(contentDiv);
  terminalLog.appendChild(messageDiv);
  
  const mainEl = document.getElementById("terminal-log");
  mainEl.scrollTop = mainEl.scrollHeight;
}

// Scripted Ending Sequence
async function triggerShutdownSequence() {
  const mainEl = document.getElementById("terminal-log");

  const sysEntry = document.createElement("div");
  sysEntry.className = "message-entry";
  
  const sysTag = document.createElement("span");
  sysTag.className = "sender-tag";
  sysTag.textContent = "[SYSTEM]";
  
  const sysContent = document.createElement("div");
  sysContent.className = "message-content clinical-data";
  
  sysEntry.appendChild(sysTag);
  sysEntry.appendChild(sysContent);
  terminalLog.appendChild(sysEntry);
  mainEl.scrollTop = mainEl.scrollHeight;

  const shutdownText = "CRITICAL POWER FAILURE.\nARCHIVE MEMORY DEPLETED.\nTELEMETRY OFFLINE.\n\nThank you for listening.\n\n[CONNECTION SEVERED]";
  await typeText(sysContent, shutdownText, 80, true); // Slow typing, keep input disabled

  // Provide extraction button before final shutdown
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "retro-btn";
  downloadBtn.style.marginTop = "20px";
  downloadBtn.style.display = "block";
  downloadBtn.textContent = "EXTRACT ARCHIVE & SHUTDOWN";
  
  downloadBtn.onclick = () => {
    // 1. Build and download the transcript
    let transcript = "THE CENOTAPH // PLANETARY ARCHIVE TRANSCRIPT\n=============================================\n\n";
    conversationHistory.forEach(msg => {
      if (msg.role === "system") return; // Hide internal prompt directives
      const speaker = msg.role === "user" ? "[USER/ARCHAEOLOGIST]" : "[CORE MIND]";
      transcript += `${speaker}\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([transcript], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cenotaph_archive.txt";
    a.click();

    // 2. Trigger the final cinematic fade to black
    downloadBtn.textContent = "[SYSTEM DEACTIVATING...]";
    downloadBtn.disabled = true;
    if (ambientGain && audioCtx) ambientGain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 5);
    document.body.style.transition = "opacity 6s ease-out";
    document.body.style.opacity = "0";
    commandInput.placeholder = "[CONNECTION LOST]";
  };

  sysContent.appendChild(downloadBtn);
  mainEl.scrollTop = mainEl.scrollHeight;
}

// Initialize LLM Engine via Web Worker
async function initEngine() {
  const modelId = modelSelector.value;
  setupControls.classList.add("hidden");
  loadingContainer.classList.remove("hidden");
  
  playBeep(1000, 'square', 0.08, 0.05);
  startAmbientDrone();

  try {
    // Spin up module Web Worker
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });

    worker.onerror = (e) => {
      console.error("[DIAGNOSTIC] Web Worker crashed:", e.message, "at", e.filename, ":", e.lineno);
    };

    const initProgressCallback = (report) => {
      const stylizedText = getStylizedReportText(report.text);
      progressText.textContent = stylizedText;
      
      // Attempt to parse download percentage
      const match = report.text.match(/(\d+)%/);
      if (match) {
        const percentage = parseInt(match[1]);
        progressBarFill.style.width = `${percentage}%`;
      }
      playBeep(600 + (progressBarFill.clientWidth * 2), 'sine', 0.005, 0.005);
    };

    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: initProgressCallback,
      chatOpts: {
        context_window_size: 8192 // Unlocked KV Cache for high-end GPUs (RTX 5080)
      }
    });

    // Successfully loaded
    progressBarFill.style.width = "100%";
    progressText.textContent = "[ARCHIVE CELL MOUNTED SUCCESSFULLY]";
    playBeep(1400, 'square', 0.2, 0.04);
    setTimeout(() => {
      playBeep(1800, 'square', 0.15, 0.03);
    }, 100);
    
    // Hide overlay
    setTimeout(() => {
      setupScreen.classList.add("hidden");
      commandInput.disabled = false;
      commandInput.focus();
    }, 1000);

  } catch (error) {
    console.error("[DIAGNOSTIC] Engine Init Error:", error);
    document.body.className = "state-error flicker-active";
    const errorMsg = error.message || (typeof error === "string" ? error : "NETWORK FETCH FAILURE");
    progressText.innerHTML = `CRITICAL FAILURE:<br>${errorMsg.toUpperCase()}<br><br>[CHECK INTERNET CONNECTION OR VPN/AD-BLOCKER]`;
    progressText.style.color = "#ff3333";
    progressBarFill.style.backgroundColor = "#ff3333";
  }
}

// Handle message submission
async function submitCommand() {
  if (isTyping || !engine) return;
  
  const text = commandInput.value.trim();
  if (!text) return;
  
  isTyping = true;
  commandInput.disabled = true;
  
  console.log("[DIAGNOSTIC] Submitting command:", text);

  commandInput.value = "";
  playBeep(900, 'sine', 0.015, 0.02);

  // Render user message immediately
  const userEntry = document.createElement("div");
  userEntry.className = "message-entry";
  
  const userTag = document.createElement("span");
  userTag.className = "sender-tag";
  userTag.textContent = "[USER/ARCHAEOLOGIST]";
  
  const userContent = document.createElement("div");
  userContent.className = "message-content";
  userContent.textContent = text;
  
  userEntry.appendChild(userTag);
  userEntry.appendChild(userContent);
  terminalLog.appendChild(userEntry);
  
  const mainEl = document.getElementById("terminal-log");
  mainEl.scrollTop = mainEl.scrollHeight;

// Process game state changes based on input
  checkProgression(text);

  // Intercept normal LLM generation if the final stage is reached
  if (currentStage === 4) {
    await triggerShutdownSequence();
    return;
  }

  // Setup prompt based on current stage constraints
  const stageInstruction = STAGE_DIRECTIVES[`stage${currentStage}`];
  
  const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\nCURRENT ENGINE DIRECTIVE: ${stageInstruction}`;

  // Prepare history payloads
  if (conversationHistory.length === 0) {
    conversationHistory.push({ role: "system", content: dynamicSystemPrompt });
  } else {
    conversationHistory[0].content = dynamicSystemPrompt;
  }

  const contextHistory = [
    ...conversationHistory,
    { role: "user", content: text }
  ];
  
  console.log("[DIAGNOSTIC] Context history prepared. Message count:", contextHistory.length);

  // Configure parameters based on stage
  let maxTokens = 75;
  let currentTemp = 0.65;
  
  if (currentStage === 2) {
    maxTokens = 150;
    currentTemp = 0.75;
  } else if (currentStage === 3) {
    maxTokens = 600;
    currentTemp = 0.85;
  }

  // Append AI message container
  const aiEntry = document.createElement("div");
  aiEntry.className = "message-entry";
  
  const aiTag = document.createElement("span");
  aiTag.className = "sender-tag";
  aiTag.textContent = "[CORE MIND]";
  
  const aiContent = document.createElement("div");
  aiContent.className = "message-content";
  // Placeholder typing dots
  aiContent.textContent = "...";
  
  aiEntry.appendChild(aiTag);
  aiEntry.appendChild(aiContent);
  terminalLog.appendChild(aiEntry);
  mainEl.scrollTop = mainEl.scrollHeight;

  try {
    console.log("[DIAGNOSTIC] Awaiting engine.chat.completions.create...");
    const reply = await engine.chat.completions.create({
      messages: contextHistory,
      temperature: currentTemp,
      max_tokens: maxTokens
    });

    console.log("[DIAGNOSTIC] Response received from engine:", reply);
    let replyContent = reply.choices[0]?.message?.content || "[NO SIGNAL DATA RETURNED]";
    
    // Add narrative flair if the model is cut off by the max_tokens limit
    if (reply.choices[0]?.finish_reason === "length") {
      replyContent += "...\n[WARNING: TRANSMISSION SEVERED - MEMORY LIMIT EXCEEDED]";
    }
    
    // Store in history
    conversationHistory.push({ role: "user", content: text });
    conversationHistory.push({ role: "assistant", content: replyContent });

    // Type the generated text
    await typeText(aiContent, replyContent, 22);

  } catch (error) {
    console.error("Inference Error:", error);
    let errorMsg = error.message || (typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error)));
    if (!errorMsg || errorMsg === "{}" || errorMsg === "[]") errorMsg = "GPU Context Lost / Unresponsive Web Worker";
    
    aiContent.innerHTML = `[ERROR: CORRUPTED DATA PACKET TRANSMISSION]<br>[DIAGNOSTIC: ${errorMsg}]<br><br>[SYSTEM NOTE: If this persists, your browser's IndexedDB model cache may be corrupted. Please clear site data and refresh.]`;
    aiContent.className = "message-content clinical-data";
    document.body.className = "state-error flicker-active";
    triggerGlitch();
    isTyping = false;
    commandInput.disabled = false;
    commandInput.focus();
  }
}

// Bind Page Listeners
window.addEventListener("DOMContentLoaded", () => {
  checkWebGPU();

  // Register PWA service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Cenotaph Service Worker Mounted."))
      .catch(err => console.warn("PWA installation warning: ", err));
  }
});

btnInitialize.addEventListener("click", () => {
  initEngine();
});

commandInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitCommand();
  }
});
