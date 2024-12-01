import { useState, useEffect, useCallback, useRef } from "react";
import { TranscriptEntry } from "../../../types/transcript";
import { useVideoId } from "@/entrypoints/content/hooks/useVideoId";
import { getStoredTranslation, storeTranslation } from "@/lib/storage";
import { translateMultipleTexts } from "@/lib/translate";
import { Language } from "@/lib/constants";
import { getLanguageCode } from "@/entrypoints/content/lib/utils";

export function useTranslate({
  transcripts,
  isLive,
  language,
  targetLanguage = "chinese",
  translateEnabled,
}: {
  language: Language;
  transcripts: TranscriptEntry[];
  isLive: boolean;
  targetLanguage: Language;
  translateEnabled: boolean;
}) {
  const [translatedTranscript, setTranslatedTranscript] = useState<
    TranscriptEntry[]
  >([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslationDone, setIsTranslationDone] = useState(false);
  const videoId = useVideoId();
  const lastProcessedIndex = useRef(-1);

  const resetTranslation = useCallback(() => {
    setTranslatedTranscript([]);
    setIsTranslating(false);
    setIsTranslationDone(false);
    lastProcessedIndex.current = -1;
  }, []);

  useEffect(() => {
    async function translateTranscript() {
      if (transcripts.length === 0) {
        resetTranslation();
        return;
      }

      if (!videoId) return;

      if (!translateEnabled) {
        setTranslatedTranscript(transcripts);
        setIsTranslationDone(true);
        return;
      }

      // Handle cached translations
      if (!isLive) {
        const cachedTranslations = getStoredTranslation(videoId);
        if (cachedTranslations && cachedTranslations.length > 0) {
          console.info("[useTranslate] Using cached translation");

          setTranslatedTranscript(cachedTranslations);
          setIsTranslationDone(true);
          return;
        }
      }

      // Only process new entries
      const newEntries = transcripts.slice(lastProcessedIndex.current + 1);
      if (newEntries.length === 0) return;

      setIsTranslating(true);

      try {
        // Translate new entries one by one
        for (let i = 0; i < newEntries.length; i++) {
          const translation = await translateMultipleTexts(
            [newEntries[i].text],
            getLanguageCode(language),
            getLanguageCode(targetLanguage)
          );

          setTranslatedTranscript((prev) => {
            const currentIndex = prev.length + i;
            const updated = [...prev];
            updated[currentIndex] = {
              ...newEntries[i],
              translation: translation[0],
            };
            lastProcessedIndex.current = currentIndex;
            return updated.filter((v) => v);
          });
        }

        lastProcessedIndex.current = transcripts.length - 1;

        if (!isLive) {
          setTranslatedTranscript((prev) => {
            storeTranslation(videoId, prev);
            return prev;
          });
        }

        setIsTranslationDone(true);
      } catch (error) {
        console.error("[useTranslate] Translation error:", error);
        setIsTranslationDone(false);
      } finally {
        setIsTranslating(false);
      }
    }

    translateTranscript();
  }, [transcripts, videoId, isLive, language, targetLanguage]);

  return {
    translatedTranscript,
    isTranslating,
    isTranslationDone,
    resetTranslation,
  };
}
