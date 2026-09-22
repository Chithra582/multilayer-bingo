import React, { useState } from 'react';
import { BINGO_LETTERS, LETTER_RANGES, getLetterColorClasses } from '../utils/bingo';
import { ChevronDown, ChevronUp, Grid } from 'lucide-react';

interface MasterBoardProps {
  calledNumbersSet: Set<number>;
  lastCalledNumber?: number;
}

export const MasterBoard: React.FC<MasterBoardProps> = ({
  calledNumbersSet,
  lastCalledNumber,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden">
      {/* Accordion / Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-slate-100">Master Board (1 - 75)</span>
          <span className="text-xs text-slate-400">
            ({calledNumbersSet.size} / 75 called)
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-indigo-300 font-medium">
          <span>{isOpen ? 'Hide' : 'Show All'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Board Matrix */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2.5 animate-in fade-in duration-200">
          {BINGO_LETTERS.map((letter) => {
            const [min, max] = LETTER_RANGES[letter];
            const colors = getLetterColorClasses(letter);
            const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);

            return (
              <div key={letter} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg ${colors.bg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow`}
                >
                  {letter}
                </div>

                <div className="grid grid-cols-15 gap-1 flex-1">
                  {nums.map((n) => {
                    const isCalled = calledNumbersSet.has(n);
                    const isLatest = n === lastCalledNumber;

                    return (
                      <div
                        key={n}
                        className={`aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                          isLatest
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md scale-110 z-10'
                            : isCalled
                            ? `${colors.bg} text-white shadow-sm`
                            : 'bg-slate-800 text-slate-500'
                        }`}
                        title={`${letter}-${n} ${isCalled ? '(Called)' : ''}`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
