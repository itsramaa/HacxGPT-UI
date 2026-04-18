"use client";

import { useEffect, useMemo, useState } from "react";
import { type BundledLanguage, type BundledTheme, type HighlighterGeneric, type ThemedToken, createHighlighter } from "shiki";

export interface TokenizedCode {
  tokens: ThemedToken[][];
  fg: string;
  bg: string;
}

// Highlighter cache (singleton per language)
const highlighterCache = new Map<
  string,
  Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>
>();

// Token cache
const tokensCache = new Map<string, TokenizedCode>();

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokenizedCode) => void>>();

const getTokensCacheKey = (code: string, language: BundledLanguage) => {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return `${language}:${code.length}:${start}:${end}`;
};

const LANGUAGE_MAP: Record<string, BundledLanguage> = {
  proguard: "java",
};

const getHighlighter = (
  language: BundledLanguage
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> => {
  const targetLang = LANGUAGE_MAP[language as string] || language;
  const cached = highlighterCache.get(targetLang);
  if (cached) return cached;

  const highlighterPromise = createHighlighter({
    langs: [targetLang],
    themes: ["github-light", "github-dark"],
  }).catch((err) => {
    console.warn(`Shiki failed to load ${targetLang}, falling back to text:`, err);
    return createHighlighter({
      langs: ["text"],
      themes: ["github-light", "github-dark"],
    });
  });

  highlighterCache.set(targetLang, highlighterPromise);
  return highlighterPromise;
};

export const createRawTokens = (code: string): TokenizedCode => ({
  bg: "transparent",
  fg: "inherit",
  tokens: code.split("\n").map((line) =>
    line === ""
      ? []
      : [
          {
            color: "inherit",
            content: line,
          } as ThemedToken,
        ]
  ),
});

export const highlightCode = (
  code: string,
  language: BundledLanguage,
  callback?: (result: TokenizedCode) => void
): TokenizedCode | null => {
  const tokensCacheKey = getTokensCacheKey(code, language);

  const cached = tokensCache.get(tokensCacheKey);
  if (cached) return cached;

  if (callback) {
    if (!subscribers.has(tokensCacheKey)) {
      subscribers.set(tokensCacheKey, new Set());
    }
    subscribers.get(tokensCacheKey)?.add(callback);
  }

  getHighlighter(language)
    .then((highlighter) => {
      const targetLang = LANGUAGE_MAP[language as string] || language;
      const availableLangs = highlighter.getLoadedLanguages();
      const langToUse = availableLangs.includes(targetLang) ? targetLang : "text";

      const result = highlighter.codeToTokens(code, {
        lang: langToUse,
        themes: {
          dark: "github-dark",
          light: "github-light",
        },
      });

      const tokenized: TokenizedCode = {
        bg: result.bg ?? "transparent",
        fg: result.fg ?? "inherit",
        tokens: result.tokens,
      };

      tokensCache.set(tokensCacheKey, tokenized);

      const subs = subscribers.get(tokensCacheKey);
      if (subs) {
        for (const sub of subs) sub(tokenized);
        subscribers.delete(tokensCacheKey);
      }
    })
    .catch((error) => {
      console.error("Failed to highlight code:", error);
      subscribers.delete(tokensCacheKey);
    });

  return null;
};

export function useHighlighter(code: string, language: BundledLanguage) {
  const rawTokens = useMemo(() => createRawTokens(code), [code]);

  const [tokenized, setTokenized] = useState<TokenizedCode>(
    () => highlightCode(code, language) ?? rawTokens
  );

  useEffect(() => {
    let cancelled = false;

    // Reset to raw tokens when code changes
    const syncResult = highlightCode(code, language);
    setTokenized(syncResult ?? rawTokens);

    // Subscribe to async result
    highlightCode(code, language, (result) => {
      if (!cancelled) {
        setTokenized(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, rawTokens]);

  return tokenized;
}
