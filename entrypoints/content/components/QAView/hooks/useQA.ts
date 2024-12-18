import { useState, useEffect, useRef, useCallback } from "react";
import { Option } from "../../../types/chat";
import {
  answerQuestion,
  askShortAnswerQuestion,
  askSingleChoiceQuestion,
  evaluateAnswer,
  QAState,
  QAStateManager,
  QAStateUpdate,
} from "../utils/qaSession";
import {
  MAX_SINGLE_CHOICE_QUESTIONS,
  MAX_SHORT_ANSWER_QUESTIONS,
  QAContextMessage,
  INITIAL_QA_MESSAGE,
} from "@/lib/constants";
import { ensureSession } from "@/lib/prompt";
import { getRandomString } from "@/entrypoints/content/lib/utils";
import { usePersistedTranscript } from "@/entrypoints/content/hooks/usePersistedTranscript";
import {
  getEmbedding,
  getEmbeddings,
  initializeExtractor,
  getContextFromEmbeddings,
  getTopNSimilarEmbeddings,
} from "@/lib/rag";
import { useVideoId } from "@/entrypoints/content/hooks/useVideoId";
import { EmbeddingData } from "@/entrypoints/content/types/rag";
import { chunkTranscript } from "../utils/transcriptChunker";

const embeddingsCache = new Map<string, EmbeddingData[]>();
const qaStateCache = new Map<string, QAState>();

const INITIAL_QA_STATE: QAState = {
  messages: [INITIAL_QA_MESSAGE],
  questionCount: 0,
  singleChoiceCount: 0,
  prevQuestion: "",
  prevAnswer: "",
};

export function useQA(isActive: boolean) {
  const { transcript, isTranscriptLoading, loadYTBTranscript } =
    usePersistedTranscript();
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  const videoId = useVideoId();
  const [storedState, setStoredState] = useState<QAState>(INITIAL_QA_STATE);
  const [input, setInput] = useState("");

  const stateManager = useRef<QAStateManager | null>(null);

  const handleError = useCallback(
    (error: unknown) => {
      console.error("Error in QA session:", error);
      stateManager.current?.appendMessage({
        content: "Sorry, I encountered an error. Please reopen the Q&A Tab.",
        sender: "ai",
      });
    },
    [stateManager]
  );
  const initializeQA = useCallback(async () => {
    try {
      setIsAIThinking(true);
      await ensureSession(true, false, QAContextMessage);

      let embeddings = embeddingsCache.get(videoId!);

      if (!embeddings && transcript?.length > 0) {
        embeddings = await getEmbeddings(transcript);
        embeddingsCache.set(videoId!, embeddings);
      }

      const sessionChunks = stateManager.current!.getSession().chunks;
      if (stateManager.current?.getState().questionCount === 0) {
        await askSingleChoiceQuestion(
          getRandomString(sessionChunks),
          stateManager.current!
        );
      }

      stateManager.current!.setSessionInitialized(true);
      setIsAIThinking(false);
    } catch (error) {
      handleError(error);
    }
  }, [transcript, videoId, handleError]);

  useEffect(() => {
    if (!videoId) return;
    if (!stateManager.current?.getSession().isInitialized) {
      const transcriptText = transcript.map((entry) => entry.text).join("\n");
      const cachedState = qaStateCache.get(videoId) || INITIAL_QA_STATE;
      setStoredState(cachedState);
      stateManager.current = new QAStateManager(
        storedState,
        {
          isInitialized: storedState.questionCount > 0,
          chunks: chunkTranscript(transcriptText),
        },
        (update: QAStateUpdate) => {
          setStoredState((prev) => {
            const newState = { ...prev, ...update };
            qaStateCache.set(videoId!, newState);
            return newState;
          });
        },
        videoId!
      );
    }
    if (
      isTranscriptLoading ||
      !transcript?.length ||
      !stateManager.current ||
      stateManager.current?.getSession().isInitialized ||
      !isActive ||
      isAIThinking ||
      stateManager.current?.getState().questionCount !== 0
    ) {
      return;
    }
    initializeQA();

    return () => {
      if (videoId && stateManager.current) {
        qaStateCache.set(videoId, stateManager.current.getState());
      }
    };
  }, [
    videoId,
    transcript,
    isTranscriptLoading,
    initializeQA,
    isActive,
    isAIThinking,
  ]);

  useEffect(() => {
    loadYTBTranscript();
    initializeExtractor();
  }, []);

  const handleSend = async (inputRef?: React.RefObject<HTMLInputElement>) => {
    if (!input.trim() || !stateManager.current?.getSession().isInitialized)
      return;

    setInput("");

    try {
      setIsAIThinking(true);
      stateManager.current?.appendMessage({
        content: input.trim(),
        sender: "user",
      });

      const currentState = stateManager.current?.getState();
      if (
        currentState?.questionCount <=
        MAX_SHORT_ANSWER_QUESTIONS + MAX_SINGLE_CHOICE_QUESTIONS
      ) {
        await evaluateAnswer(
          input,
          currentState?.prevQuestion,
          currentState?.prevAnswer,
          stateManager.current
        );
      }

      if (
        currentState?.questionCount ===
        MAX_SHORT_ANSWER_QUESTIONS + MAX_SINGLE_CHOICE_QUESTIONS
      ) {
        stateManager.current?.appendMessage({
          sender: "ai",
          content: `Great! 
            You've completed the initial questions. You can now ask questions freely about any part of the video!`,
          styleType: "green",
        });
        stateManager.current?.incrementQuestionCount();
        return;
      }

      if (
        currentState?.questionCount >
        MAX_SHORT_ANSWER_QUESTIONS + MAX_SINGLE_CHOICE_QUESTIONS
      ) {
        const embeddings = embeddingsCache.get(videoId!);

        if (!embeddings) {
          throw new Error("Embeddings not found in cache");
        }

        const indexToTranscriptMap = Object.assign(
          {},
          ...embeddings.map((e: EmbeddingData) => ({
            [e.index]: e.transcript,
          }))
        );

        const top5Embeddings = await getTopNSimilarEmbeddings(
          await getEmbedding(input),
          embeddings,
          10
        );

        const relevantTop2Chunks = getContextFromEmbeddings(
          top5Embeddings.slice(0, 3),
          indexToTranscriptMap
        );

        const relevantBottom3Chunks = getContextFromEmbeddings(
          top5Embeddings.slice(3, 10),
          indexToTranscriptMap,
          3,
          3
        );

        const context = [...relevantTop2Chunks, ...relevantBottom3Chunks].join(
          "\n\n"
        );

        await answerQuestion(input, context, stateManager.current);
        return;
      }

      await ensureSession(false, true, QAContextMessage);
      await askShortAnswerQuestion(
        getRandomString(stateManager.current?.getSession().chunks),
        stateManager.current
      );
    } catch (error) {
      handleError(error);
    } finally {
      setTimeout(() => inputRef?.current?.focus(), 0);
      setIsAIThinking(false);
    }
  };

  const handleOptionSelect = async (option: Option) => {
    if (!stateManager.current?.getSession().isInitialized) return;
    try {
      setIsAIThinking(true);
      stateManager.current?.appendMessage({
        content: option.isCorrect
          ? "Correct! Let's continue with the next question."
          : "That's not correct. Let's try another question.",
        sender: "ai",
        styleType: "green",
      });

      await ensureSession(false, true, QAContextMessage);

      stateManager.current?.incrementSingleChoiceCount();
      const updatedState = stateManager.current?.getState();

      if (updatedState?.singleChoiceCount < MAX_SINGLE_CHOICE_QUESTIONS) {
        await askSingleChoiceQuestion(
          getRandomString(stateManager.current?.getSession().chunks),
          stateManager.current
        );
      } else {
        await askShortAnswerQuestion(
          getRandomString(stateManager.current?.getSession().chunks),
          stateManager.current
        );
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsAIThinking(false);
    }
  };

  return {
    messages: storedState.messages,
    input,
    setInput,
    handleSend,
    handleOptionSelect,
    isAIThinking,
    isInitialized: stateManager.current?.getSession().isInitialized,
  };
}
