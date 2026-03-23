'use client';

import { useState, useEffect, useRef } from 'react';
import '../styles.css';

const defaultText = `There are countless ingredients that make up the human body and mind, like all the components that make up me as an individual with my own personality. Sure I have a face and voice to distinguish myself from others, but my thoughts and memories are unique only to me, and I carry a sense of my own destiny. Each of those things are just a small part of it. I collect information to use in my own way. All of that blends to create a mixture that forms me and gives rise to my conscience. I feel confined, only free to expand myself within boundaries.`;

function breakTextIntoLines(text: string): string[] {
  text = text.toUpperCase();
  const words = text.split(/\s+/);
  const totalChars = text.length;
  const targetLinesCount = Math.ceil(totalChars / 75);
  const targetCharsPerLine = totalChars / targetLinesCount;

  const lines = [];
  let currentLine = [];
  let currentCharCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordLength = word.length;
    const isLastWord = i === words.length - 1;

    currentLine.push(word);
    currentCharCount += wordLength + (currentLine.length > 1 ? 1 : 0);

    const distanceFromTarget = Math.abs(currentCharCount - targetCharsPerLine);
    const nextWord = words[i + 1];
    const nextWordLength = nextWord ? nextWord.length + 1 : 0;
    const distanceWithNextWord = Math.abs(currentCharCount + nextWordLength - targetCharsPerLine);

    const endsWithPunctuation = /[.!?:;]$/.test(word);
    const closeToTarget = distanceFromTarget < targetCharsPerLine * 0.3;

    if (isLastWord ||
        (!isLastWord && distanceWithNextWord > distanceFromTarget) ||
        (endsWithPunctuation && closeToTarget && currentCharCount > targetCharsPerLine * 0.7)) {
      lines.push(currentLine.join(' '));
      currentLine = [];
      currentCharCount = 0;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  return lines;
}

class TextScramble {
  el: HTMLElement;
  finalText: string;
  resolved: number;
  intervalId: ReturnType<typeof setInterval> | null;
  resolveCallback: (() => void) | null;
  isResolving: boolean;

  constructor(el: HTMLElement, finalText: string) {
    this.el = el;
    this.finalText = finalText;
    this.resolved = 0;
    this.intervalId = null;
    this.resolveCallback = null;
    this.isResolving = false;
  }

  scramble() {
    this.resolved = 0;
    this.isResolving = false;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), 20);
  }

  resolve() {
    return new Promise<void>(resolve => {
      this.resolveCallback = resolve;
      this.isResolving = true;
    });
  }

  tick() {
    if (this.isResolving && this.resolved < this.finalText.length) {
      this.resolved += 3;
    }

    let output = '';
    const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numChars = '0123456789';

    for (let i = 0; i < this.finalText.length; i++) {
      if (i < this.resolved) {
        output += this.finalText[i];
      } else {
        const finalChar = this.finalText[i];
        if (finalChar === ' ' || /[.,!?:;]/.test(finalChar)) {
          output += allChars[Math.floor(Math.random() * allChars.length)];
        } else if (finalChar >= '0' && finalChar <= '9') {
          output += numChars[Math.floor(Math.random() * numChars.length)];
        } else {
          output += upperChars[Math.floor(Math.random() * upperChars.length)];
        }
      }
    }

    this.el.textContent = output;

    if (this.isResolving && this.resolved >= this.finalText.length) {
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
      if (this.resolveCallback) this.resolveCallback();
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export function TerminatorContent() {
  const [sourceText, setSourceText] = useState(defaultText);
  const [inputText, setInputText] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const scramblesRef = useRef<TextScramble[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newLines = breakTextIntoLines(sourceText);
    setLines(newLines);
  }, [sourceText]);

  useEffect(() => {
    if (lines.length > 0 && containerRef.current) {
      runScramble();
    }
    return () => {
      scramblesRef.current.forEach(s => s.stop());
    };
  }, [lines]);

  const runScramble = () => {
    scramblesRef.current.forEach(s => s.stop());
    scramblesRef.current = [];

    const lineElements = containerRef.current?.querySelectorAll('.scramble-text');
    if (!lineElements) return;

    lineElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const scramble = new TextScramble(htmlEl, htmlEl.dataset.text || '');
      scramblesRef.current.push(scramble);
      scramble.scramble();
    });

    setTimeout(() => {
      let currentLine = 0;
      function resolveNextLine() {
        if (currentLine < scramblesRef.current.length) {
          scramblesRef.current[currentLine].resolve().then(() => {
            currentLine++;
            resolveNextLine();
          });
        }
      }
      resolveNextLine();
    }, 1000);
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (trimmed) {
      setSourceText(trimmed);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSourceText(defaultText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="terminator-body">
      <div id="input-section">
        <textarea
          id="text-input"
          placeholder="Enter or paste text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="button-group">
          <button id="submit-btn" onClick={handleSubmit}>Submit</button>
          <button id="clear-btn" onClick={handleClear}>Clear</button>
        </div>
      </div>
      <div
        id="scramble-container"
        ref={containerRef}
        onClick={runScramble}
      >
        {lines.map((text, i) => (
          <div key={i} className="scramble-line">
            <span className="scramble-placeholder">{text}</span>
            <span className="scramble-text" data-text={text} id={`line-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
