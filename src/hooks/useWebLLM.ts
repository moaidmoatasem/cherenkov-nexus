import { useState, useEffect } from 'react';
import { CreateMLCEngine } from '@mlc-ai/web-llm';

export function useWebLLM(modelName = 'Llama-3.1-8B-Instruct-q4f16_1-MLC') {
  const [engine, setEngine] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initWebGPU() {
      if (!(navigator as any).gpu) {
        console.warn("WebGPU not supported in this browser. Falling back to Cloud Gemini.");
        setError("WebGPU not supported in this browser.");
        return;
      }
      
      const initProgressCallback = (progress: { text: string; progress: number }) => {
        setLoadingProgress(Math.round(progress.progress * 100));
      };

      try {
        const mlcEngine = await CreateMLCEngine(modelName, {
          initProgressCallback,
        });
        setEngine(mlcEngine);
        setIsReady(true);
        setError(null);
      } catch (err: any) {
        console.warn("WebGPU fallback triggered:", err);
        setError(err.message || String(err));
      }
    }

    initWebGPU();
  }, [modelName]);

  const synthesizeLocally = async (prompt: string) => {
    if (!engine) throw new Error("Local engine not initialized");
    const reply = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
    return reply.choices[0].message.content;
  };

  return { engine, isReady, loadingProgress, synthesizeLocally, error };
}
