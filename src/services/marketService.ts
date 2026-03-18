import { getMarketPriceAnalysis } from './geminiService';

interface MarketData {
  price: {
    low: number;
    high: number;
    average: number;
    new?: number;
    used?: number;
  };
  referenceImageUrl: string;
  source: string;
  referenceUrl: string;
  referenceUrlNew?: string;
  report: string;
}

export async function fetchMarketData(partName: string, vehicleModel: string): Promise<MarketData> {
  try {
    // Use Gemini to get real market data
    const analysis = await getMarketPriceAnalysis(partName, vehicleModel);
    
    const estimatedPrice = analysis.price.average || 1000;
    const low = Math.round(estimatedPrice * 0.8);
    const high = Math.round(estimatedPrice * 1.2);

    return {
      price: { 
        low, 
        high, 
        average: estimatedPrice,
        new: analysis.price.new,
        used: analysis.price.used
      },
      referenceImageUrl: `https://placehold.co/600x400/1a1a1a/orange?text=${encodeURIComponent(partName)}`,
      source: 'MercadoLibre (IA)',
      referenceUrl: analysis.referenceUrlUsed || `https://listado.mercadolibre.com.mx/${encodeURIComponent(partName + ' ' + vehicleModel + ' usado').replace(/%20/g, '-')}`,
      referenceUrlNew: analysis.referenceUrlNew || `https://listado.mercadolibre.com.mx/${encodeURIComponent(partName + ' ' + vehicleModel + ' nuevo').replace(/%20/g, '-')}`,
      report: analysis.report || 'Análisis no disponible.'
    };
  } catch (error) {
    console.error("Error fetching market data from AI, falling back to simulation", error);
    
    // Fallback to simulated data if AI fails
    const BASE_PRICES: Record<string, number> = {
      'Alternador': 1200, 'Marcha': 950, 'Compresor': 2500, 'Computadora': 3500,
      'Motor': 15000, 'Transmision': 8500, 'Puerta': 1800, 'Cofre': 2200,
      'Faro': 1100, 'Calavera': 850, 'Espejo': 650, 'Facia': 1500,
      'Salpicadera': 900, 'Radiador': 1100, 'Ventilador': 950, 'Bomba': 800,
      'Sensor': 450, 'Bobina': 600, 'Multiple': 1200, 'Cuerpo': 1300,
    };
    
    const base = BASE_PRICES[Object.keys(BASE_PRICES).find(k => partName.includes(k)) || ''] || 1000;
    const variability = 0.3;
    const randomFactor = 1 + (Math.random() * variability * 2 - variability);
    const yearMatch = vehicleModel.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : 2010;
    const ageFactor = Math.max(0.5, 1 - (2024 - year) * 0.02); 

    const estimatedPrice = Math.round(base * randomFactor * (1 + ageFactor));
    const low = Math.round(estimatedPrice * 0.8);
    const high = Math.round(estimatedPrice * 1.2);

    const query = encodeURIComponent(`${partName} ${vehicleModel}`).replace(/%20/g, '-');
    const referenceUrl = `https://listado.mercadolibre.com.mx/${query}-usado`;
    const referenceUrlNew = `https://listado.mercadolibre.com.mx/${query}-nuevo`;

    const report = `
ANÁLISIS DE MERCADO (SIMULADO):
-------------------------
PIEZA: ${partName}
VEHÍCULO: ${vehicleModel}

1. RASTREO: Se encontraron publicaciones similares con un rango de precios entre $${low} y $${high}.

2. FACTORES DE AJUSTE:
   - Depreciación por Modelo (${year}): ${(ageFactor * 100).toFixed(0)}% aplicado.
   - Condición: USADO (Funcional)

3. CONCLUSIÓN:
   El precio sugerido de $${estimatedPrice} se sitúa en la media del mercado.
    `.trim();

    return {
      price: { 
        low, 
        high, 
        average: estimatedPrice,
        new: Math.round(estimatedPrice * 1.8),
        used: estimatedPrice
      },
      referenceImageUrl: `https://placehold.co/600x400/1a1a1a/orange?text=${encodeURIComponent(partName)}`,
      source: 'MercadoLibre (Simulado)',
      referenceUrl,
      referenceUrlNew,
      report
    };
  }
}
