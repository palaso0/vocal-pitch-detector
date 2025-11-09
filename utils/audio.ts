export interface NoteData {
  note: string;
  octave: number;
  frequency: number;
  detune: number;
}

const NOTE_STRINGS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

export function frequencyToNoteInfo(frequency: number): NoteData {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const roundedNoteNum = Math.round(noteNum) + 69;
  
  const octave = Math.floor(roundedNoteNum / 12) - 1;
  const noteIndex = roundedNoteNum % 12;
  const note = NOTE_STRINGS[noteIndex];
  
  const expectedFrequency = 440 * Math.pow(2, (roundedNoteNum - 69) / 12);
  const detune = 1200 * Math.log2(frequency / expectedFrequency);

  return { note, octave, frequency, detune };
}


// Autocorrelation function to find the fundamental frequency
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) { // not enough signal
    return -1;
  }

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;

  // find first zero crossing
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  // find next zero crossing
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  const buffer2 = buffer.slice(r1, r2);
  const newSize = buffer2.length;
  const c = new Array(newSize).fill(0);

  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] = c[i] + buffer2[j] * buffer2[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;

  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];

  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  if (T0 === 0) return -1;

  return sampleRate / T0;
}