const keyboard = document.getElementById("keyboard");
const transposeDown = document.getElementById("transpose-down");
const transposeUp = document.getElementById("transpose-up");
const transposeReset = document.getElementById("transpose-reset");
const transposeValue = document.getElementById("transpose-value");
const keySignatureValue = document.getElementById("key-signature-value");
const keySignatureAccidentals = document.getElementById(
  "key-signature-accidentals",
);

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const semitoneNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
const blackKeyMap = [
  { note: "C#", position: 1 },
  { note: "D#", position: 2 },
  { note: "F#", position: 4 },
  { note: "G#", position: 5 },
  { note: "A#", position: 6 },
];

// Movable-do solfège, indexed by semitone above the tonic. The physical C key
// is always the tonic of the current key, so labels stay fixed to the keys.
// Black keys show the raised (sharp) and lowered (flat) syllables.
const solfegeNames = [
  "Do",
  "Di/Ra",
  "Re",
  "Ri/Me",
  "Mi",
  "Fa",
  "Fi/Se",
  "Sol",
  "Si/Le",
  "La",
  "Li/Te",
  "Ti",
];

let transpose = 0;
const transposeLimit = 11;
const middleCMidi = 60;

const keySignatures = [
  { name: "C", accidentals: "no sharps/flats" },
  { name: "D♭", accidentals: "B♭ E♭ A♭ D♭ G♭" },
  { name: "D", accidentals: "F♯ C♯" },
  { name: "E♭", accidentals: "B♭ E♭ A♭" },
  { name: "E", accidentals: "F♯ C♯ G♯ D♯" },
  { name: "F", accidentals: "B♭" },
  { name: "G♭", accidentals: "B♭ E♭ A♭ D♭ G♭ C♭" },
  { name: "G", accidentals: "F♯" },
  { name: "A♭", accidentals: "B♭ E♭ A♭ D♭" },
  { name: "A", accidentals: "F♯ C♯ G♯" },
  { name: "B♭", accidentals: "B♭ E♭" },
  { name: "B", accidentals: "F♯ C♯ G♯ D♯ A♯" },
];

const midiFromNote = (note, octave) => {
  const index = semitoneNames.indexOf(note);
  return 12 * (octave + 1) + index;
};

const frequencyFromMidi = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

const noteLabelFromMidi = (midi) => {
  const index = ((midi % 12) + 12) % 12;
  return semitoneNames[index].replace("#", "♯");
};

const playNote = (midi) => {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  const duration = 1.5;

  osc.type = "sine";
  osc.frequency.value = frequencyFromMidi(midi);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(now + duration + 0.05);
};

const updateTransposeDisplay = () => {
  transposeValue.textContent = transpose > 0 ? `+${transpose}` : `${transpose}`;
};

const updateKeySignature = () => {
  const pitchClass = (((middleCMidi + transpose) % 12) + 12) % 12;
  const signature = keySignatures[pitchClass];
  keySignatureValue.textContent = signature.name;
  keySignatureAccidentals.textContent = signature.accidentals;
};

const updateKeyLabels = () => {
  const keys = keyboard.querySelectorAll(".key");
  keys.forEach((key) => {
    const physicalMidi = Number(key.dataset.midi);
    key.querySelector(".note-name").textContent = noteLabelFromMidi(
      physicalMidi + transpose,
    );
    const degree = ((physicalMidi % 12) + 12) % 12;
    key.querySelector(".solfege").innerHTML = solfegeNames[degree]
      .split("/")
      .map((s) => `<span>${s}</span>`)
      .join("");
  });
};

const handleKeyPress = (key) => {
  const midi = Number(key.dataset.midi) + transpose;
  playNote(midi);
  key.classList.add("active");

  const release = () => {
    key.classList.remove("active");
    key.removeEventListener("pointerup", release);
    key.removeEventListener("pointerleave", release);
    key.removeEventListener("pointercancel", release);
  };

  key.addEventListener("pointerup", release);
  key.addEventListener("pointerleave", release);
  key.addEventListener("pointercancel", release);
};

// The full range is four octaves (C3-B6). The main keyboard shows a window of
// it in one row; the overview strip below shows the whole range and a
// draggable highlight marking the window.
const firstOctave = 3;
const octaveCount = 4;
const totalWhite = octaveCount * 7;
document.documentElement.style.setProperty("--total-white", totalWhite);
const blackAfterWhite = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

const overview = document.getElementById("overview");
const overviewKeys = document.getElementById("overview-keys");
const overviewWindow = document.getElementById("overview-window");
const keyboardStrip = document.createElement("div");
keyboardStrip.className = "keyboard-strip";
keyboard.appendChild(keyboardStrip);

let visibleWhite = 14;
// Index of the leftmost visible white key. Fractional while dragging.
let windowStart = (4 - firstOctave) * 7;

const forEachKey = (callback) => {
  for (let o = 0; o < octaveCount; o++) {
    const octave = firstOctave + o;
    whiteKeys.forEach((note, i) =>
      callback({ note, octave, isBlack: false, whiteIndex: o * 7 + i }),
    );
    blackKeyMap.forEach(({ note }) =>
      callback({
        note,
        octave,
        isBlack: true,
        whiteIndex: o * 7 + blackAfterWhite[note],
      }),
    );
  }
};

// Black keys sit centered on the boundary after their white key.
const blackLeft = (whiteIndex) =>
  `calc(${((whiteIndex + 1) / totalWhite) * 100}% - var(--black-width) / 2)`;

const createKey = ({ note, octave, isBlack, whiteIndex }) => {
  const key = document.createElement("button");
  key.type = "button";
  key.className = `key ${isBlack ? "black" : "white"}`;
  key.dataset.midi = midiFromNote(note, octave);

  const solfege = document.createElement("span");
  solfege.className = "solfege";
  const noteName = document.createElement("span");
  noteName.className = "note-name";
  key.append(solfege, noteName);

  if (isBlack) {
    key.style.left = blackLeft(whiteIndex);
  }

  key.addEventListener("pointerdown", () => handleKeyPress(key));
  return key;
};

const createOverviewKey = ({ note, octave, isBlack, whiteIndex }) => {
  const key = document.createElement("div");
  key.className = `mini-key ${isBlack ? "black" : "white"}`;
  if (isBlack) {
    key.style.left = blackLeft(whiteIndex);
  } else if (note === "C") {
    key.textContent = `C${octave}`;
  }
  return key;
};

const renderKeyboard = () => {
  keyboardStrip.innerHTML = "";
  overviewKeys.innerHTML = "";
  forEachKey((spec) => {
    keyboardStrip.appendChild(createKey(spec));
    overviewKeys.appendChild(createOverviewKey(spec));
  });
  updateKeyLabels();
};

const clampStart = (start) =>
  Math.min(Math.max(start, 0), totalWhite - visibleWhite);

const applyWindow = () => {
  keyboard.style.setProperty("--visible", visibleWhite);
  keyboardStrip.style.transform = `translateX(${(-windowStart / totalWhite) * 100}%)`;
  overviewWindow.style.left = `${(windowStart / totalWhite) * 100}%`;
  overviewWindow.style.width = `${(visibleWhite / totalWhite) * 100}%`;
};

const setWindowStart = (start, { snap = true } = {}) => {
  windowStart = clampStart(snap ? Math.round(start) : start);
  applyWindow();
  if (snap) {
    try {
      localStorage.setItem(
        "windowStartNote",
        String(windowStart + firstOctave * 7),
      );
    } catch {}
  }
};

// Show as many white keys as fit comfortably, up to two octaves.
const updateVisibleWhite = () => {
  const width = keyboard.clientWidth || window.innerWidth;
  visibleWhite = Math.min(14, Math.max(7, Math.floor(width / 48)));
  setWindowStart(windowStart);
};

// Dragging the overview: grabbing the highlight moves it by the drag
// distance; pressing elsewhere centers the highlight there first.
let dragOffset = null;

const whiteUnitsAt = (clientX) => {
  const rect = overview.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * totalWhite;
};

overview.addEventListener("pointerdown", (event) => {
  const units = whiteUnitsAt(event.clientX);
  const insideWindow =
    units >= windowStart && units <= windowStart + visibleWhite;
  dragOffset = insideWindow ? units - windowStart : visibleWhite / 2;
  overview.setPointerCapture(event.pointerId);
  document.body.classList.add("dragging");
  setWindowStart(units - dragOffset, { snap: false });
});

overview.addEventListener("pointermove", (event) => {
  if (dragOffset === null) return;
  setWindowStart(whiteUnitsAt(event.clientX) - dragOffset, { snap: false });
});

const endDrag = () => {
  if (dragOffset === null) return;
  dragOffset = null;
  document.body.classList.remove("dragging");
  setWindowStart(windowStart);
};

overview.addEventListener("pointerup", endDrag);
overview.addEventListener("pointercancel", endDrag);

window.addEventListener("resize", updateVisibleWhite);

try {
  // Stored as a white-key index counted from C0, so it survives range changes.
  const stored = localStorage.getItem("windowStartNote");
  const saved = Number(stored);
  if (stored !== null && Number.isFinite(saved)) {
    windowStart = saved - firstOctave * 7;
  }
} catch {}

transposeDown.addEventListener("click", () => {
  transpose = Math.max(-transposeLimit, transpose - 1);
  updateTransposeDisplay();
  updateKeyLabels();
  updateKeySignature();
});

transposeReset.addEventListener("click", () => {
  transpose = 0;
  updateTransposeDisplay();
  updateKeyLabels();
  updateKeySignature();
});

transposeUp.addEventListener("click", () => {
  transpose = Math.min(transposeLimit, transpose + 1);
  updateTransposeDisplay();
  updateKeyLabels();
  updateKeySignature();
});

document.getElementById("app-version").textContent = APP_VERSION;

updateTransposeDisplay();
renderKeyboard();
// Place the initial window without the slide animation.
document.body.classList.add("dragging");
updateVisibleWhite();
requestAnimationFrame(() =>
  requestAnimationFrame(() => document.body.classList.remove("dragging")),
);
updateKeySignature();
