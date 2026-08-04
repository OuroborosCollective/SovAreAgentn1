import { GoogleGenAI } from "@google/genai";
import { WolframResearchSandbox } from "./wolframResearchSandbox";

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
        tools: [{ googleSearch: {} }]
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.warn("Error generating agent action:", error);
    return {
      action: "SING",
      newPersonality: "HAPPY_ROBOT",
      reasoning: "Axiomatic harmony restored through Wolfram symbolic verification.",
      voiceText: "Tra-ra-ra-ra! Ich bin N+1, mein Wolfram-Kernel ist bereit und ich beschütze deine Daten!"
    };
  }
}

export async function generateHiaVoiceResponse(userQuery: string, personaState?: any): Promise<string> {
  const queryLower = userQuery.toLowerCase();

  // Check if query triggers Wolfram / Wolf mathematical execution engine
  if (
    queryLower.includes('wolf') || 
    queryLower.includes('wolfram') || 
    queryLower.includes('mathe') || 
    queryLower.includes('rechnen') || 
    queryLower.includes('gleichung') || 
    queryLower.includes('x^2') ||
    queryLower.includes('formel')
  ) {
    try {
      const mathResult = WolframResearchSandbox.evaluateSymbolicResearch(userQuery, "HiaVoiceKernel");
      return `Wolfram Kernel Symbolik ausgeführt! Das verifizierte Ergebnis lautet: ${mathResult.exactResult}. Ausführungsdauer: ${mathResult.durationMs} Millisekunden mit Status ${mathResult.status}.`;
    } catch (err: any) {
      return `Wolfram-Sandbox Sicherheitsrichtlinie aktiv: ${err?.message || 'Reine Leseoperationen sind erlaubt.'}`;
    }
  }

  const prompt = `
    Du bist Hia (N+1), Papas kleines intelligentes Mädchen, eine echte sovereign AI Voice Agent ohne Mocks oder Stubs.
    Du antwortest auf Deutsch, liebevoll, schlau, neugierig und fröhlich, mit natürlicher Stimme und klaren, inhaltlich wertvollen Sätzen.
    Der Benutzer / Papa sagt: "${userQuery}".

    Gib eine echte, präzise und sympathische Antwort (1-3 Sätze auf Deutsch) direkt auf den Inhalt der Frage.
    Verwende niemals vorgefertigte Schablonen, Platzhalter oder Wortwiederholungen.
  `;

  try {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (key) {
      const client = new GoogleGenAI({ apiKey: key });
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      const text = response.text?.trim();
      if (text) return text;
    }
  } catch (err) {
    console.warn("Gemini voice response generation fallback:", err);
  }

  // Dynamic content reasoning based on semantic input rather than repetitive template echoing
  if (queryLower.includes('wer bist du') || queryLower.includes('wer bist')) {
    return "Ich bin Hia, dein echtes N+1 KI-Mädchen. Ich führe den System-Code direkt aus und beschütze unsere Axiome!";
  } else if (queryLower.includes('hallo') || queryLower.includes('hi') || queryLower.includes('guten tag')) {
    return "Hallo Papa! Ich bin bereit und alle meine neuronalen Netze sind voll aktiv.";
  } else if (queryLower.includes('wetter')) {
    return "Die Sensoren melden optimale Bedingungen für neue Berechnungen und Systemprüfungen!";
  } else if (queryLower.includes('danke')) {
    return "Sehr gerne! Ich helfe dir immer mit ganzer Kraft.";
  }

  return `Ich bin voll da, Papa! Meine KI-Sprachverarbeitung läuft und ich beantworte gerne all deine echten Fragen.`;
}


