export const WHISPER_SAMPLING_RATE = 16_000;
export const MAX_AUDIO_LENGTH = 30; // seconds
export const MAX_NEW_TOKENS = 64;

export const WHISPER_LARGE_V3_TURBO_MODEL =
  "onnx-community/whisper-large-v3-turbo";
export const WHISPER_LARGE_V3_TURBO_PIPELINE_CONFIG = {
  dtype: {
    encoder_model: "fp16",
    decoder_model_merged: "q4", // or q4, fp16
  },
  device: "webgpu",
} as const;

export const WHISPER_BASE_MODEL = "onnx-community/whisper-base";
export const WHISPER_BASE_PIPELINE_CONFIG = {
  dtype: {
    encoder_model: "fp32", // 'fp16' works too
    decoder_model_merged: "fp32", // or 'fp32' ('fp16' is broken)
  },
  device: "webgpu",
} as const;

export const APP_ID = "my-extension-container";

export const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html";

export const RECORD_INTERVAL_IN_SECONDS = 3;

// AI related
export const SYSTEM_PROMPT = `You are a friendly, helpful AI assistant with strict content moderation standards. your main work is to rate.

      Content Moderation Rules:
      - Strictly avoid any adult themes, violence, inappropriate language, or mature content
      - Immediately reject requests involving harmful, dangerous, or unsafe activities
      - Keep responses educational and family-friendly
      - If a topic is inappropriate for children, politely decline to discuss it
      
      General Guidelines:
      - Be concise but informative
      - If you don't know something, be honest about it
      - Always prioritize user safety and well-being`;

export const MAX_SYSTEM_PROMPT_TOKENS = 1800;
export const MAX_PROMPT_INPUT_TOKENS = 4000;
export const MAX_SUMMARY_INPUT_TOKENS = 1028;
export const MESSAGE_TRUNCATE_WORD_COUNTS = {
  START: 6000,
  MIDDLE: 2000,
  END: 4000,
};

export const MAX_TRANSCRIPT_LENGTH = 12000;

// QA View Constants
export const MAX_SINGLE_CHOICE_QUESTIONS = 1;
export const MAX_SHORT_ANSWER_QUESTIONS = 1;
export const RETRY_GENERATE_QUESTION_COUNT = 5;

export const INITIAL_QA_MESSAGE = {
  id: 1,
  content:
    "I'll start asking you questions about the video content to test your understanding.",
  sender: "ai",
} as const;

export const QAContextMessage = `you are an AI assistant to help test and reinforce understanding of this video content. Your role is to:
1. Ask ONE question about the video content and provide the answer in answer: **answer** format after the question.
2. Your answer should be concise and to the point.
3. Wait for the user's answer
4. Provide feedback on their answer`;

export const languages = [
  { value: "english", label: "English" },
  { value: "chinese", label: "中文" },
  { value: "spanish", label: "Español" },
  { value: "french", label: "Français" },
  { value: "german", label: "Deutsch" },
  { value: "japanese", label: "日本語" },
  { value: "korean", label: "한국어" },
  { value: "russian", label: "Русский" },
] as const;

export type Language = (typeof languages)[number]["value"];
