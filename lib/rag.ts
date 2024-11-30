import { EmbeddingData } from "@/entrypoints/content/types/rag";
import { TranscriptEntry } from "@/entrypoints/content/types/transcript";

import { pipeline } from "@xenova/transformers";

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

let extractorInstance: any = null;
let isInitializing = false;

export async function initializeExtractor() {
  if (!extractorInstance && !isInitializing) {
    isInitializing = true;
    console.log("Initializing extractor");
    extractorInstance = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("Extractor initialized");
    isInitializing = false;
  }
  return extractorInstance;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const extractorInstance = await initializeExtractor();
  const result = (await extractorInstance(text, {
    pooling: "mean",
    normalize: true,
  })) as unknown as { data: Float32Array }[];
  return Array.from(result[0].data);
}

export const getEmbeddings = async (
  transcripts: TranscriptEntry[]
): Promise<EmbeddingData[]> => {
  const embeddings = await Promise.all(
    transcripts.map(async (transcript, index) => ({
      index,
      embedding: await getEmbedding(transcript.text),
      transcript: transcript.text,
    }))
  );

  return embeddings;
};

async function getSimilarity(embedding1: number[], embedding2: number[]) {
  return cosineSimilarity(embedding1, embedding2);
}

export async function getTop5SimilarEmbeddings(
  embedding: number[],
  embeddings: EmbeddingData[]
): Promise<
  {
    index: number;
    embedding: number[];
    transcript: string;
    similarity: number;
  }[]
> {
  // Calculate similarity scores for all embeddings
  const similarityScores = await Promise.all(
    embeddings.map(async (e) => ({
      ...e,
      similarity: await getSimilarity(embedding, await e.embedding),
    }))
  );

  // Sort by similarity score in descending order and get top 5
  return similarityScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

export function getContextFromEmbeddings(
  topEmbeddings: { index: number }[],
  indexToTranscriptMap: { [key: number]: string },
  beforeChunks: number = 8,
  afterChunks: number = 8
): string[] {
  return topEmbeddings.map((embedding) => {
    const currentIndex = embedding.index;
    const surroundingChunks = [];

    // Get chunks before
    for (
      let i = Math.max(0, currentIndex - beforeChunks);
      i < currentIndex;
      i++
    ) {
      if (indexToTranscriptMap[i]) {
        surroundingChunks.push(indexToTranscriptMap[i]);
      }
    }

    // Add the current chunk
    surroundingChunks.push(indexToTranscriptMap[currentIndex]);

    // Get chunks after
    for (let i = currentIndex + 1; i <= currentIndex + afterChunks; i++) {
      if (indexToTranscriptMap[i]) {
        surroundingChunks.push(indexToTranscriptMap[i]);
      }
    }

    return surroundingChunks.join(" ");
  });
}