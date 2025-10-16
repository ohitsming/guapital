"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AnimatedTextProps {
  initialText: string;
  wordsToCycle: string[]; // Array of words to cycle through after the initial word
  className?: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ initialText, wordsToCycle, className }) => {
  const [prefix, setPrefix] = useState('');
  const [currentWord, setCurrentWord] = useState(''); // The word currently displayed (Weeks, Days, Minutes)
  const [suffix, setSuffix] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'deleting' | 'typing'>('idle');
  const wordIndexRef = useRef(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCycleCompletedRef = useRef(false);

  const fullWordList = useRef<string[]>([]);

  useEffect(() => {
    const initialWord = initialText.split(' ').pop() || ''; // Assuming the last word is the one to animate
    const initialPrefix = initialText.substring(0, initialText.lastIndexOf(initialWord));
    const initialSuffix = initialText.substring(initialText.lastIndexOf(initialWord) + initialWord.length);

    setPrefix(initialPrefix);
    setCurrentWord(initialWord);
    setSuffix(initialSuffix);

    fullWordList.current = [initialWord, ...wordsToCycle];
  }, [initialText, wordsToCycle]);

  const animateWord = useCallback((wordToType: string, wordToDelete: string) => {
    if (hasCycleCompletedRef.current) return; // Stop if cycle completed

    let currentAnimatedChars = wordToDelete;
    let charIndex = wordToDelete.length;

    setAnimationPhase('deleting');
    const deletingInterval = setInterval(() => {
      if (charIndex > 0) {
        charIndex--;
        currentAnimatedChars = wordToDelete.substring(0, charIndex);
        setCurrentWord(currentAnimatedChars);
      } else {
        clearInterval(deletingInterval);
        setAnimationPhase('typing');
        charIndex = 0;
        currentAnimatedChars = '';
        const typingInterval = setInterval(() => {
          if (charIndex < wordToType.length) {
            currentAnimatedChars += wordToType[charIndex];
            setCurrentWord(currentAnimatedChars);
            charIndex++;
          } else {
            clearInterval(typingInterval);
            setAnimationPhase('idle');
            setCursorVisible(true); // Keep cursor visible after animation finishes

            // Check if this is the last word in the cycle
            if (wordIndexRef.current === fullWordList.current.length - 1) {
              hasCycleCompletedRef.current = true;
              // Optionally, stop cursor blinking after final word is typed
              if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
              setCursorVisible(true); // Ensure cursor is visible at the end
              return;
            }

            // Move to the next word in the cycle after a short delay
            animationTimeoutRef.current = setTimeout(() => {
              wordIndexRef.current = (wordIndexRef.current + 1) % fullWordList.current.length;
              const nextWordToType = fullWordList.current[wordIndexRef.current];
              const nextWordToDelete = fullWordList.current[(wordIndexRef.current - 1 + fullWordList.current.length) % fullWordList.current.length];
              animateWord(nextWordToType, nextWordToDelete);
            }, 1500); // Delay before starting next word animation
          }
        }, 300); // Slower Typing speed
        animationTimeoutRef.current = typingInterval;
      }
    }, 200); // Slower Deleting speed
    animationTimeoutRef.current = deletingInterval;
  }, [fullWordList]);

  useEffect(() => {
    // Delay the start of the initial animation cycle
    const initialDelayTimeout = setTimeout(() => {
      if (fullWordList.current.length > 0 && !hasCycleCompletedRef.current) {
        const initialWord = fullWordList.current[0];
        const nextWord = fullWordList.current[1 % fullWordList.current.length];
        wordIndexRef.current = 1; // Start from the second word in the list
        animateWord(nextWord, initialWord);
      }
    }, 1000); // 1 second delay before starting the first transition

    // Initial cursor blinking
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => {
      clearTimeout(initialDelayTimeout);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, [animateWord, fullWordList]);

  // Stop cursor blinking during animation, restart after
  useEffect(() => {
    if (animationPhase !== 'idle') {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
      setCursorVisible(true); // Keep cursor visible during animation
    } else {
      if (!cursorIntervalRef.current && !hasCycleCompletedRef.current) {
        cursorIntervalRef.current = setInterval(() => {
          setCursorVisible(prev => !prev);
        }, 500);
      }
    }
  }, [animationPhase]);

  return (
    <h1 className={className}>
      {prefix}
      <span style={{ color: '#E27A70CC' }}>{currentWord}</span>
      {suffix}
      <span className={`inline-block w-0.5 h-full bg-neutral-900 align-text-bottom transition-opacity duration-300 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>
    </h1>
  );
};

export default AnimatedText;
