import { GoogleGenAI, Type, Schema } from "@google/genai";
import { WorkflowPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Data = await blobToBase64(audioBlob);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioBlob.type, data: base64Data } },
        { text: "Transcribe exactly as spoken." }
      ]
    }
  });
  return response.text || "";
};

export interface PlanGenerationResult {
  isValid: boolean;
  question?: string;
  plan?: WorkflowPlan;
}

export const generateAutomationPlan = async (userPrompt: string, history: string[] = []): Promise<PlanGenerationResult> => {
  // We define a schema that can handle both valid plans and clarification requests
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      isValid: { 
        type: Type.BOOLEAN, 
        description: "Set to true ONLY if the user has provided specific triggers, services, and actions. Set to false if ambiguous." 
      },
      question: { 
        type: Type.STRING, 
        description: "If isValid is false, ask a specific question to clarify the missing details (e.g. 'Which email provider?', 'What is the trigger?')." 
      },
      plan: {
        type: Type.OBJECT,
        description: "The workflow plan. Only populate if isValid is true.",
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                action: { type: Type.STRING, description: "A highly descriptive, verbose, and technical explanation of exactly what this step involves." },
                service: { type: Type.STRING, description: "The Google Workspace service involved (e.g., Gmail, Sheets, Drive)." }
              },
              required: ["id", "action", "service"]
            }
          }
        },
        required: ["name", "description", "steps"]
      }
    },
    required: ["isValid"]
  };

  const contextStr = history.length > 0 
    ? `Previous conversation context:\n${history.join('\n')}\n\nCurrent Request: ` 
    : '';

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Role: You are an expert Google Apps Script Solution Architect.
    
    Task: Analyze the following automation request to determine if it is specific enough to build.
    "${contextStr}${userPrompt}"
    
    Validation Rules:
    1.  **Trigger**: Is it clear WHEN this runs? (e.g., "Daily", "On Form Submit", "When email arrives"). "Automatically" is too vague.
    2.  **Services**: Are specific Google services named? (e.g., "Gmail" vs "Email", "Sheets" vs "Excel").
    3.  **Action**: Is the data flow clear?

    Logic:
    - If CRITICAL details are missing, set 'isValid' to false and put a polite but direct question in 'question'.
    - If the request is sufficient (even if simple), set 'isValid' to true and generate the 'plan'.
    
    Plan Rules:
    - The "action" field must be technical (e.g., "Query Gmail API for label 'Invoices'").
    `,
    config: { 
      responseMimeType: 'application/json', 
      responseSchema: schema,
      thinkingConfig: {
        thinkingBudget: 2048
      }
    }
  });

  const text = response.text || "{}";
  try {
    const result = JSON.parse(text);
    return {
      isValid: result.isValid,
      question: result.question,
      plan: result.plan as WorkflowPlan
    };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("AI generated an invalid format.");
  }
};

export const generateScript = async (plan: WorkflowPlan, originalPrompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a production-ready Google Apps Script for this plan: ${JSON.stringify(plan)}. Context: ${originalPrompt}. Use modern ES6+ features and include robust error handling. Return only code.`,
    config: {
      thinkingConfig: {
        thinkingBudget: 4096
      }
    }
  });
  return (response.text || "").replace(/```javascript/g, '').replace(/```/g, '').trim();
};

export const chatWithFlowAI = async (history: any[], message: string): Promise<string> => {
  const chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: { systemInstruction: "You are FlowAI, a helpful assistant for Google Apps Script automation. Be technical, helpful, and concise." }
  });
  const response = await chatSession.sendMessage({ message });
  return response.text || "Error occurred.";
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
}