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

export const WHISPER_BASE_MODEL = "onnx-community/whisper-base_timestamped";
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

export const MAX_TOKENS = 1500;
export const WORD_COUNTS = {
  START: 400,
  MIDDLE: 200,
  END: 200,
};
