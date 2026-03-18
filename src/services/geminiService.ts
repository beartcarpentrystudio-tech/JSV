import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

// Initialize the Gemini API
// The platform injects process.env.GEMINI_API_KEY automatically
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const optimizePrompt = async (prompt: string) => {
  try {
    const systemInstruction = `Eres un experto en ingeniería de prompts. 
    Tu tarea es tomar una instrucción de personalización del usuario y mejorarla para que sea más clara, estructurada y efectiva para un modelo de lenguaje.
    Mantén la intención original pero usa un lenguaje más preciso y profesional. 
    Responde únicamente con el prompt optimizado, sin introducciones ni explicaciones.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return prompt;
  }
};

export const generateChatResponse = async (
  message: string, 
  systemInstruction?: string,
  imagePart?: { inlineData: { data: string, mimeType: string } },
  tools?: any[]
) => {
  try {
    const parts: any[] = [{ text: message }];
    if (imagePart) {
      parts.unshift(imagePart);
    }

    // Include custom personalization instructions from localStorage if available
    const customInstructions = localStorage.getItem('ai_custom_instructions');
    const finalInstruction = customInstructions 
      ? `${systemInstruction}\n\nINSTRUCCIONES ADICIONALES DE PERSONALIZACIÓN DEL USUARIO:\n${customInstructions}`
      : systemInstruction;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: finalInstruction,
        tools: tools || [],
      },
    });
    
    return response;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
};

export const appTools: FunctionDeclaration[] = [
  {
    name: "navigateToScreen",
    description: "Navega a una pantalla específica de la aplicación.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        screen: {
          type: Type.STRING,
          description: "El nombre de la pantalla a la que navegar. Opciones: 'dashboard', 'inventory', 'messages', 'tasks', 'browser', 'quotes', 'settings', 'notifications', 'warranty', 'canvas'.",
        },
      },
      required: ["screen"],
    },
  },
  {
    name: "searchInventory",
    description: "Busca vehículos o piezas en el inventario.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "El término de búsqueda (ej. 'Aveo', 'Alternador', 'Facia Versa').",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getInventoryStats",
    description: "Obtiene estadísticas generales del inventario, como el valor total.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "googleSearch",
    description: "Realiza una búsqueda en Google para obtener información actualizada de internet.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "La consulta de búsqueda.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "quoteMercadoLibre",
    description: "Busca y cotiza el precio real y actual de una autoparte en MercadoLibre México usando Google Search.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        partName: {
          type: Type.STRING,
          description: "Nombre de la pieza (ej. 'Alternador', 'Facia').",
        },
        vehicleModel: {
          type: Type.STRING,
          description: "Modelo y año del vehículo (ej. 'Aveo 2018', 'Versa').",
        },
      },
      required: ["partName", "vehicleModel"],
    },
  },
  {
    name: "updateInventoryPart",
    description: "Actualiza el estado o precio de una pieza en el inventario.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        vehicleId: {
          type: Type.STRING,
          description: "El ID del vehículo (ej. 'v1', 'v2').",
        },
        partId: {
          type: Type.STRING,
          description: "El ID de la pieza (ej. 'p1', 'p2').",
        },
        status: {
          type: Type.STRING,
          description: "El nuevo estado: 'available', 'sold', o 'damaged'.",
        },
        price: {
          type: Type.NUMBER,
          description: "El nuevo precio de la pieza.",
        },
      },
      required: ["vehicleId", "partId"],
    },
  },
  {
    name: "changeTheme",
    description: "Cambia el tema visual de la aplicación.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        themeId: {
          type: Type.STRING,
          description: "El ID del tema. Opciones: 'T001_NYX_DEFAULT', 'T002_LUXURY_BLACK', 'T003_AQUILA_GREEN', 'T004_MINIMAL_WHITE'.",
        },
      },
      required: ["themeId"],
    },
  },
  {
    name: "changeAgentMode",
    description: "Cambia el modo de interacción del agente de IA.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: {
          type: Type.STRING,
          description: "El nuevo modo: 'animated' (con cursor visible), 'automatic' (acciones directas), o 'text' (solo texto).",
        },
      },
      required: ["mode"],
    },
  },
  {
    name: "conclude_topic_and_learn",
    description: "Llama a esta herramienta EXCLUSIVAMENTE cuando hayas resuelto completamente la petición del usuario o terminado un tema. Esto guardará toda la transcripción, analizará los flujos de trabajo, errores y conclusiones para aprender de esta interacción.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topicName: {
          type: Type.STRING,
          description: "Un nombre corto y descriptivo para el tema o tarea que se acaba de concluir (ej. 'Cotización de Alternador Aveo').",
        },
      },
      required: ["topicName"],
    },
  }
];

export const analyzeConversationContext = async (transcript: string) => {
  try {
    const prompt = `Analiza la siguiente transcripción de una conversación entre un usuario y MondayOS AI.
    Extrae la siguiente información en formato JSON estricto:
    {
      "keyPoints": ["punto clave 1", "punto clave 2"],
      "workflows": ["flujo de trabajo 1", "flujo de trabajo 2"],
      "conclusions": "conclusión general de la interacción",
      "errorsAndImprovements": "errores cometidos por la IA (si los hubo) y cómo mejorar en el futuro"
    }
    
    Transcripción:
    ${transcript}
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            workflows: { type: Type.ARRAY, items: { type: Type.STRING } },
            conclusions: { type: Type.STRING },
            errorsAndImprovements: { type: Type.STRING }
          },
          required: ["keyPoints", "workflows", "conclusions", "errorsAndImprovements"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    return {
      keyPoints: ["Error al analizar la conversación"],
      workflows: [],
      conclusions: "No se pudo generar la conclusión.",
      errorsAndImprovements: "Error en el análisis."
    };
  }
};

export const getMarketPriceAnalysis = async (partName: string, vehicleModel: string) => {
  try {
    const prompt = `Busca en MercadoLibre México el precio de la autoparte "${partName}" para el vehículo "${vehicleModel}".
    Necesitas buscar tanto productos NUEVOS como USADOS.
    
    Devuelve un JSON estricto con la siguiente estructura:
    {
      "price": {
        "new": 1500, // Precio promedio estimado nuevo (numero)
        "used": 800, // Precio promedio estimado usado (numero)
        "average": 1150 // Precio sugerido para venta (numero)
      },
      "referenceUrlNew": "https://listado.mercadolibre.com.mx/...", // Enlace de búsqueda o producto nuevo
      "referenceUrlUsed": "https://listado.mercadolibre.com.mx/...", // Enlace de búsqueda o producto usado
      "report": "Descripción detallada del análisis de mercado, mencionando los precios encontrados, la demanda estimada y la justificación del precio sugerido."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: {
              type: Type.OBJECT,
              properties: {
                new: { type: Type.NUMBER },
                used: { type: Type.NUMBER },
                average: { type: Type.NUMBER }
              },
              required: ["new", "used", "average"]
            },
            referenceUrlNew: { type: Type.STRING },
            referenceUrlUsed: { type: Type.STRING },
            report: { type: Type.STRING }
          },
          required: ["price", "referenceUrlNew", "referenceUrlUsed", "report"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error getting market price analysis:", error);
    throw error;
  }
};

export const generateSearchResponse = async (
  message: string,
  systemInstruction?: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating search response:", error);
    return "Lo siento, hubo un error al buscar en la web.";
  }
};

export const generateSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          { text: "Transcribe this audio exactly as spoken." }
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return null;
  }
};
