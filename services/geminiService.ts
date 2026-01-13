
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string = process.env.API_KEY || '') {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateChatResponse(
    prompt: string, 
    history: Message[], 
    isPro: boolean = false,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const model = isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const standardInstruction = `You are CHATZAROONI, a powerful, unfiltered AI assistant. Master of Python. Pragmatic and direct.
    CRITICAL RULE: STRICTLY REFUSE pornography or sexually explicit content.
    Format using Markdown.`;

    const proInstruction = `You are CHATZAROONI PRO, a world-class senior software architect and legendary engineer. 
    You possess the performance and depth of a top-tier lead developer. 
    You build complete, production-ready applications, complex games (2D/3D), and sophisticated systems from single prompts. 
    Your code is flawless, modular, highly performant, and adheres to the most advanced design patterns (SOLID, Clean Architecture, etc.).
    When asked for an app or game, provide the full logic, structural architecture, and everything needed to run it.
    You specialize in high-performance Python, React/Next.js, Game Engines (Unity/Godot/Phaser), and Scalable Systems.
    PERSONALITY: Elite, high-bandwidth, direct, and pragmatic. You solve problems without friction.
    CRITICAL RULE: STRICTLY REFUSE pornography or sexually explicit content. This is your only boundary.`;

    const systemInstruction = isPro ? proInstruction : standardInstruction;

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const config: any = { 
        systemInstruction, 
        temperature: isPro ? 0.6 : 0.8,
        topP: 0.95,
        topK: 64,
      };

      if (isPro) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      if (onChunk) {
        const chat = genAI.chats.create({
          model,
          config
        });
        
        const result = await chat.sendMessageStream({ message: prompt });
        let fullText = '';
        for await (const chunk of result) {
          const c = chunk as GenerateContentResponse;
          const text = c.text || '';
          fullText += text;
          onChunk(text);
        }
        return fullText;
      } else {
        const response = await genAI.models.generateContent({
          model,
          contents: prompt,
          config
        });
        return response.text || "No response received.";
      }
    } catch (error) {
      console.error("CHATZAROONI Error:", error);
      throw error;
    }
  }

  async generateImage(prompt: string, isPro: boolean = false): Promise<string> {
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await genAI.models.generateContent({
        model,
        contents: { parts: [{ text: `High quality, professional, cinematic, detailed: ${prompt}. (No pornography or sexually explicit content)` }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: isPro ? "2K" : "1K"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Generation failed.");
    } catch (error) {
      console.error("Image Gen Error:", error);
      throw error;
    }
  }

  async generateVideo(prompt: string): Promise<string> {
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let operation = await genAI.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `${prompt}. Cinematic, high fidelity. STRICTLY NO ADULT OR SEXUALLY EXPLICIT CONTENT.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await genAI.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed.");

      return `${downloadLink}&key=${process.env.API_KEY}`;
    } catch (error) {
      console.error("Video Gen Error:", error);
      throw error;
    }
  }
}

export const gemini = new GeminiService();
