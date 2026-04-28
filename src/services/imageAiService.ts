import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getArtDirection(base64Image: string, partName: string, vehicleModel: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: `Eres un Director de Arte experto. Analiza esta imagen de una autoparte (${partName}) para un ${vehicleModel}.
            Devuelve un JSON con:
            1. background_prompt: Un prompt optimizado para generar un fondo publicitario profesional (en inglés).
            2. object_scale: Escala sugerida para el objeto (0.5 a 1.5).
            3. text_color: Color de texto sugerido que contraste con el fondo (hex).
            4. shadow_type: Tipo de sombra sugerida ('contact', '3d_floor', 'drop').
            5. composition_notes: Breve nota de por qué elegiste esto.` },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Image.split(',')[1]
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error getting art direction:", error);
    return null;
  }
}

export async function generateBackground(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          parts: [
            { text: `Generate a professional advertising background for an auto part. 
            Style: Professional studio photography, high-end commercial look.
            Prompt: ${prompt}` }
          ]
        }
      ],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating background:", error);
    return null;
  }
}
