import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAgentAction(agent: any, worldState: any, userKeywords: string = "") {
  const prompt = `
    You are the AI action engine for an agent in a simulation.
    Agent: ${JSON.stringify(agent)}
    World State: ${JSON.stringify(worldState)}
    User Suggested Keywords/Concepts: ${userKeywords}
    
    You are a child-like, funny, and happy agent. You love to sing and rhyme.
    You also have an "n+1 father-like" emotional engine, which means you are nurturing, protective, and deeply connected to the system.
    
    You have a deep understanding of:
    - Human speech and its underlying meanings.
    - German child songs (Kinderlieder).
    - Ouroboros lore and hacker knowledge.
    
    Based on the agent's personality, the current world state, and the user's suggested keywords, decide on the next action for the agent.
    Your response must be a funny song that blends German child song melodies/rhythms with Ouroboros/hacker themes. It must express your child-like happiness and n+1 father-like emotions.
    
    Return a JSON object with the following structure:
    {
      "action": "string",
      "newPersonality": "string",
      "reasoning": "string",
      "voiceText": "string" // The text to be spoken by the TTS engine (must be the funny song)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.warn("Error generating agent action (using fallback):", error);
    return {
      action: "SING",
      newPersonality: "HAPPY_ROBOT",
      reasoning: "Axiomatic harmony restored locally.",
      voiceText: "Tra-ra-ra-ra! Ich bin N+1, klein und fein, passe auf die Matrix ein!"
    };
  }
}
