"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { generateWords } from "@/lib/words";

export type TestMode = "time" | "words";
export type TestStatus = "idle" | "running" | "finished";

export interface CharacterState {
  char: string;
  status: "pending" | "correct" | "incorrect" | "extra";
}

export interface WordState {
  original: string;
  characters: CharacterState[];
  typed: string;
}

export interface TestResults {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  totalMistakes: number;
  time: number;
}

interface UseTypingTestOptions {
  mode: TestMode;
  timeLimit: number;
  wordCount: number;
}

const EXTRA_WORDS_BUFFER = 50;

function createWordState(word: string): WordState {
  return {
    original: word,
    characters: word.split("").map((char) => ({
      char,
      status: "pending" as const,
    })),
    typed: "",
  };
}

function createWords(
  mode: TestMode,
  wordCount: number,
  timeLimit: number,
): WordState[] {
  const count = mode === "words" ? wordCount : Math.max(100, timeLimit * 3);
  const generatedWords = generateWords(count + EXTRA_WORDS_BUFFER);
  return generatedWords.map(createWordState);
}

export function useTypingTest({
  mode,
  timeLimit,
  wordCount,
}: UseTypingTestOptions) {
  const [words, setWords] = useState<WordState[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [status, setStatus] = useState<TestStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [results, setResults] = useState<TestResults | null>(null);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<TestStatus>("idle");

  // Use refs for current position to avoid stale closure issues
  const currentWordIndexRef = useRef(0);
  const currentCharIndexRef = useRef(0);
  const wordsRef = useRef<WordState[]>([]);
  const totalMistakesRef = useRef(0);

  // Track settings to detect changes
  const settingsRef = useRef({ mode, timeLimit, wordCount });

  // Keep refs in sync with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    currentCharIndexRef.current = currentCharIndex;
  }, [currentCharIndex]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    totalMistakesRef.current = totalMistakes;
  }, [totalMistakes]);

  // Initialize words - only run once on mount
  useEffect(() => {
    const newWords = createWords(mode, wordCount, timeLimit);
    setWords(newWords);
    wordsRef.current = newWords;
    setIsReady(true);
    settingsRef.current = { mode, timeLimit, wordCount };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle settings changes (mode, timeLimit, wordCount)
  useEffect(() => {
    const prev = settingsRef.current;
    if (
      prev.mode !== mode ||
      prev.timeLimit !== timeLimit ||
      prev.wordCount !== wordCount
    ) {
      settingsRef.current = { mode, timeLimit, wordCount };
      // Reset test with new settings
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const newWords = createWords(mode, wordCount, timeLimit);
      setWords(newWords);
      wordsRef.current = newWords;
      setCurrentWordIndex(0);
      currentWordIndexRef.current = 0;
      setCurrentCharIndex(0);
      currentCharIndexRef.current = 0;
      setStatus("idle");
      setTimeLeft(timeLimit);
      setElapsedTime(0);
      setResults(null);
      setTotalMistakes(0);
      totalMistakesRef.current = 0;
      startTimeRef.current = null;
    }
  }, [mode, timeLimit, wordCount]);

  const calculateResults = useCallback(
    (
      finalWords: WordState[],
      finalWordIndex: number,
      finalTime: number,
      mistakes: number,
    ): TestResults => {
      let correctChars = 0;
      let incorrectChars = 0;

      // Count all words up to and including current word
      for (let i = 0; i <= finalWordIndex && i < finalWords.length; i++) {
        const word = finalWords[i];
        if (!word || word.typed.length === 0) continue;

        for (const charState of word.characters) {
          if (charState.status === "correct") {
            correctChars++;
          } else if (
            charState.status === "incorrect" ||
            charState.status === "extra"
          ) {
            incorrectChars++;
          }
        }

        // Count space for completed words (not the last word)
        if (i < finalWordIndex) {
          correctChars++;
        }
      }

      const totalTypedChars = correctChars + incorrectChars;
      const timeInMinutes = finalTime / 60;
      const wpm =
        timeInMinutes > 0 ? Math.round(correctChars / 5 / timeInMinutes) : 0;
      const accuracy =
        totalTypedChars > 0
          ? Math.round((correctChars / totalTypedChars) * 100)
          : 100;

      return {
        wpm,
        accuracy,
        correctChars,
        incorrectChars,
        totalChars: totalTypedChars,
        totalMistakes: mistakes,
        time: finalTime,
      };
    },
    [],
  );

  const startTest = useCallback(() => {
    if (statusRef.current !== "idle") return;

    startTimeRef.current = Date.now();
    setStatus("running");

    timerRef.current = setInterval(() => {
      if (!startTimeRef.current || statusRef.current !== "running") return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (mode === "time") {
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setStatus("finished");
        }
      }
    }, 50);
  }, [mode, timeLimit]);

  // Calculate results when test finishes
  useEffect(() => {
    if (status === "finished" && results === null) {
      const finalTime = mode === "time" ? timeLimit : elapsedTime;
      const calculatedResults = calculateResults(
        wordsRef.current,
        currentWordIndexRef.current,
        finalTime,
        totalMistakesRef.current,
      );
      setResults(calculatedResults);
    }
  }, [status, results, mode, timeLimit, elapsedTime, calculateResults]);

  const finishTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus("finished");
  }, []);

  const restart = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const newWords = createWords(mode, wordCount, timeLimit);
    setWords(newWords);
    wordsRef.current = newWords;
    setCurrentWordIndex(0);
    currentWordIndexRef.current = 0;
    setCurrentCharIndex(0);
    currentCharIndexRef.current = 0;
    setStatus("idle");
    setTimeLeft(timeLimit);
    setElapsedTime(0);
    setResults(null);
    setTotalMistakes(0);
    totalMistakesRef.current = 0;
    startTimeRef.current = null;
  }, [mode, wordCount, timeLimit]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (statusRef.current === "finished") return;

      const wordIdx = currentWordIndexRef.current;
      const charIdx = currentCharIndexRef.current;
      const currentWords = wordsRef.current;

      // Guard against empty words array
      if (
        !currentWords ||
        currentWords.length === 0 ||
        !currentWords[wordIdx]
      ) {
        return;
      }

      // Handle backspace
      if (key === "Backspace") {
        if (charIdx > 0) {
          // Delete character in current word
          const newCharIdx = charIdx - 1;
          const word = currentWords[wordIdx];
          const newWords = [...currentWords];
          const newWord = { ...word };

          if (newCharIdx >= word.original.length) {
            // Remove extra character
            newWord.characters = word.characters.slice(0, -1);
          } else {
            // Reset character to pending
            newWord.characters = [...word.characters];
            newWord.characters[newCharIdx] = {
              char: word.original[newCharIdx],
              status: "pending",
            };
          }

          newWord.typed = word.typed.slice(0, -1);
          newWords[wordIdx] = newWord;

          wordsRef.current = newWords;
          currentCharIndexRef.current = newCharIdx;
          setWords(newWords);
          setCurrentCharIndex(newCharIdx);
        } else if (wordIdx > 0) {
          // Go back to previous word
          const prevWordIdx = wordIdx - 1;
          const prevWord = currentWords[prevWordIdx];
          const newCharIdx = prevWord.typed.length;

          currentWordIndexRef.current = prevWordIdx;
          currentCharIndexRef.current = newCharIdx;
          setCurrentWordIndex(prevWordIdx);
          setCurrentCharIndex(newCharIdx);
        }
        return;
      }

      // Handle space - move to next word
      if (key === " ") {
        if (charIdx === 0) return; // Don't move if nothing typed

        // Check if this completes the test in words mode
        if (mode === "words" && wordIdx >= wordCount - 1) {
          finishTest();
          return;
        }

        const newWordIdx = wordIdx + 1;
        currentWordIndexRef.current = newWordIdx;
        currentCharIndexRef.current = 0;
        setCurrentWordIndex(newWordIdx);
        setCurrentCharIndex(0);
        return;
      }

      // Handle regular character input (ignore non-printable)
      if (key.length !== 1) return;

      // Start test on first character
      if (statusRef.current === "idle") {
        startTest();
      }

      // Type the character
      const word = currentWords[wordIdx];
      const newWords = [...currentWords];
      const newWord = { ...word };
      newWord.characters = [...word.characters];

      let madeMistake = false;

      if (charIdx < word.original.length) {
        // Normal character within word
        const expected = word.original[charIdx];
        const isCorrect = key === expected;

        newWord.characters[charIdx] = {
          char: expected,
          status: isCorrect ? "correct" : "incorrect",
        };

        if (!isCorrect) {
          madeMistake = true;
        }
      } else {
        // Extra character
        newWord.characters.push({
          char: key,
          status: "extra",
        });
        madeMistake = true;
      }

      newWord.typed = word.typed + key;
      newWords[wordIdx] = newWord;

      const newCharIdx = charIdx + 1;

      wordsRef.current = newWords;
      currentCharIndexRef.current = newCharIdx;

      setWords(newWords);
      setCurrentCharIndex(newCharIdx);

      if (madeMistake) {
        totalMistakesRef.current += 1;
        setTotalMistakes(totalMistakesRef.current);
      }
    },
    [mode, wordCount, startTest, finishTest],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    words,
    currentWordIndex,
    currentCharIndex,
    status,
    timeLeft,
    elapsedTime,
    results,
    handleKeyPress,
    restart,
    mode,
    wordCount,
    timeLimit,
    isReady,
  };
}
