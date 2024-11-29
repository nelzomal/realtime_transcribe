import { TabTemplate } from "../../TabTemplate";
import { TranslateProgress } from "./TranslateProgress";
import { TranslateContent } from "./TranslateContent";
import { useTranslate } from "../hooks/useTranslate";
import { TranscriptEntry } from "../../../types/transcript";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { useState } from "react";
import { Language } from "@/lib/constants";

interface AutoTranscriptViewProps {
  YTBTranscript: TranscriptEntry[];
  isTranscriptLoading: boolean;
  transcriptError: string | null;
}

export function AutoTranscriptView({
  YTBTranscript,
  isTranscriptLoading,
  transcriptError,
}: AutoTranscriptViewProps) {
  const [targetLanguage, setTargetLanguage] = useState<Language>("chinese");

  const { translatedTranscript, isTranslating } = useTranslate({
    transcript: YTBTranscript,
    isLive: false,
    language: "english",
    targetLanguage: targetLanguage,
  });

  return (
    <TabTemplate
      controls={
        <div className="w-full flex items-end gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm text-gray-600">Target Language</label>
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
            />
          </div>
        </div>
      }
      progressSection={
        <TranslateProgress
          isTranslating={isTranslating}
          isTranscriptLoading={isTranscriptLoading}
        />
      }
      mainContent={
        <TranslateContent
          translatedTranscript={translatedTranscript}
          transcriptError={transcriptError}
        />
      }
    />
  );
}
