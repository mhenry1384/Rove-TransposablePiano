const keyboard = document.getElementById("keyboard");
const transposeDown = document.getElementById("transpose-down");
const transposeUp = document.getElementById("transpose-up");
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

let transpose = 0;
const transposeLimit = 24;
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
    const midi = Number(key.dataset.midi) + transpose;
    key.textContent = noteLabelFromMidi(midi);
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

const createKey = ({ note, octave, isBlack, position }) => {
  const key = document.createElement("button");
  key.type = "button";
  key.className = `key ${isBlack ? "black" : "white"}`;
  key.dataset.midi = midiFromNote(note, octave);
  key.textContent = noteLabelFromMidi(Number(key.dataset.midi));

  if (isBlack) {
    key.classList.add(`black-pos-${position}`);
  }

  key.addEventListener("pointerdown", () => handleKeyPress(key));
  return key;
};

const createOctave = (octaveNumber) => {
  const octave = document.createElement("div");
  octave.className = "octave";

  whiteKeys.forEach((note) => {
    octave.appendChild(
      createKey({ note, octave: octaveNumber, isBlack: false }),
    );
  });

  blackKeyMap.forEach(({ note, position }) => {
    octave.appendChild(
      createKey({ note, octave: octaveNumber, isBlack: true, position }),
    );
  });

  return octave;
};

const renderKeyboard = () => {
  keyboard.innerHTML = "";
  const octaves = [4, 5];

  octaves.forEach((octaveNumber) =>
    keyboard.appendChild(createOctave(octaveNumber)),
  );

  updateKeyLabels();
};

transposeDown.addEventListener("click", () => {
  transpose = Math.max(-transposeLimit, transpose - 1);
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

updateTransposeDisplay();
renderKeyboard();
updateKeySignature();
