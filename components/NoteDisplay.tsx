import React from "react";
import { NoteData } from "../utils/audio";

interface NoteDisplayProps {
  data: NoteData | null;
}

const DetuneMeter: React.FC<{ detune: number }> = ({ detune }) => {
  const clampedDetune = Math.max(-50, Math.min(50, detune));
  const percentage = clampedDetune + 50; // 0 to 100

  return (
    <div className="w-full max-w-xs mx-auto mt-4">
      <div className="h-2 bg-gray-700 rounded-full relative overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-transform duration-100"
          style={{
            width: "100%",
            transform: `translateX(${percentage - 100}%)`,
          }}
        ></div>
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/50 transform -translate-x-1/2"></div>
      </div>
    </div>
  );
};

export const NoteDisplay: React.FC<NoteDisplayProps> = ({ data }) => {
  if (!data || !data.note) {
    return (
      <div className="text-5xl text-gray-600 font-light transition-opacity duration-300">...</div>
    );
  }

  const { note, octave, detune } = data;
  const isSharp = note.includes("#");
  const noteName = note.replace("#", "");

  return (
    <div className="flex flex-col items-center justify-center w-full transition-all duration-100 ease-in-out">
      <div className="relative">
        <span className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
          {noteName}
        </span>
        {isSharp && (
          <span className="absolute top-2 -right-6 md:-right-8 text-5xl md:text-6xl font-semibold text-purple-400">
            #
          </span>
        )}
        <span className="absolute -bottom-2 right-0 text-3xl font-light text-gray-400">
          {octave}
        </span>
      </div>
      <DetuneMeter detune={detune} />
    </div>
  );
};
