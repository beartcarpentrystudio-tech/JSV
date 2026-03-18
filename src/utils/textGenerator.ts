import { Vehicle, Part, PartState } from '../types';

interface QuoteParams {
  vehicle: string; // Model and Year
  partName: string;
  priceVD: number;
  priceAC?: number; // Optional, calculated if not provided
  compatibleModels?: string; // "LOBO/F-150 (2000-2004)"
  isOnOrder?: boolean;
  arrivalDate?: string; // For On Order
  shippingCost?: number; // Custom shipping cost
  isFreeShipping?: boolean; // Force free shipping
  warrantyDays?: number; // 15, 30, 60
}

export const calculateACPrice = (priceVD: number): number => {
  if (priceVD < 1000) {
    return priceVD - 100;
  }
  return priceVD - 200;
};

const getShippingText = (price: number, customCost: number = 80, isFree: boolean = false) => {
  if (isFree || price >= 1000) return "¡GRATIS!";
  return `COSTO ADICIONAL DE $${customCost}.00`;
};

const getShippingTextShort = (price: number, customCost: number = 80, isFree: boolean = false) => {
  if (isFree || price >= 1000) return "GRATIS";
  return `$${customCost}`;
};

const getWarrantyText = (days?: number) => {
  if (!days) return "";
  return `
    GARANTÍA: ${days} DÍAS POR ESCRITO (Ver póliza adjunta)
  `;
};

export const generateStandardQuote = (params: QuoteParams): string => {
  const { vehicle, partName, priceVD, priceAC, compatibleModels, shippingCost, isFreeShipping, warrantyDays } = params;
  const finalAC = priceAC || calculateACPrice(priceVD);

  return `¡HOLA! TENEMOS LA AUTOPARTE QUE BUSCAS, TE PASO LA INFORMACIÓN.

LAS PIEZAS QUE TENEMOS DISPONIBLES SON DESMONTADAS DE: ${vehicle.toUpperCase()}

${compatibleModels ? `TAMBIÉN SON COMPATIBLES CON: ${compatibleModels.toUpperCase()}` : ''}

AUNQUE COINCIDE, SIEMPRE RECOMENDAMOS VERIFICAR TU PIEZA ACTUAL (FOTO/NÚMERO) PARA ESTAR 100% SEGUROS ANTES DE COMPRAR.

OFERTAS DISPONIBLES:

  - ${partName.toUpperCase()} (INCLUYE COMPONENTES)

    ESTADO: USADO FUNCIONANDO CORRECTAMENTE 

    OFERTA DISPONIBLE:

    (AL CAMBIO): $${finalAC}

    (VENTA DIRECTA): $${priceVD}

ENTREGA A DOMICILIO: ${getShippingText(priceVD, shippingCost, isFreeShipping)}

DENTRO DE ÁREA LOCAL: TORREÓN-GÓMEZ-LERDO
${getWarrantyText(warrantyDays)}
¡DUDAS/PEDIDOS DIRECTOS AL WHATSAPP! HTTPS://WA.ME/5218711412774

¡MÁS AUTOPARTES DE ${vehicle.toUpperCase()} DISPONIBLES EN OFERTA!

JSV-AUTOPARTES`;
};

export const generateFastQuote = (params: QuoteParams): string => {
  const { vehicle, partName, priceVD, priceAC, shippingCost, isFreeShipping, warrantyDays } = params;
  const finalAC = priceAC || calculateACPrice(priceVD);

  return `COTIZACIÓN RÁPIDA (MODO EDICIÓN)

PIEZA: ${partName.toUpperCase()}

APLICA A: ${vehicle.toUpperCase()}

CONDICIÓN: USADO ORIGINAL

OFERTA AL CAMBIO (ENTREGANDO CASCO): $${finalAC}

OFERTA VENTA DIRECTA (SOLO PIEZA): $${priceVD}

ENVÍO LOCAL: ${getShippingTextShort(priceVD, shippingCost, isFreeShipping)}
${warrantyDays ? `GARANTÍA: ${warrantyDays} DÍAS` : ''}
WHATSAPP: HTTPS://WA.ME/5218711412774`;
};

export const generateOnOrderQuote = (params: QuoteParams): string => {
  const { vehicle, partName, priceVD, compatibleModels, arrivalDate, warrantyDays } = params;

  return `¡HOLA! TE CONFIRMO QUE LA PIEZA ESTÁ DISPONIBLE, PERO ÚNICAMENTE SOBRE PEDIDO.

LAS PIEZAS SON COMPATIBLES CON: ${compatibleModels ? compatibleModels.toUpperCase() : vehicle.toUpperCase()}

EL SERVICIO DE SOBRE PEDIDO INCLUYE: BÚSQUEDA, MANEJO, SEGUIMIENTO LOGÍSTICO E IMPUESTOS DE IMPORTACIÓN. ESTE SERVICIO TIENE UN CARGO ADICIONAL DEL 20% SOBRE EL VALOR TOTAL.

OFERTA DE SERVICIO SOBRE PEDIDO:

  - ${partName.toUpperCase()} (INCLUYE COMPONENTES)

    ESTADO: USADO / IMPORTACIÓN

    PRECIO FINAL CON SERVICIO (20%): $${priceVD}

    ESTIMADO DE LLEGADA: ${arrivalDate ? arrivalDate.toUpperCase() : 'POR DEFINIR'}

AUNQUE COINCIDE, SIEMPRE RECOMENDAMOS VERIFICAR TU PIEZA ACTUAL (FOTO/NÚMERO) PARA ESTAR 100% SEGUROS ANTES DE COMPRAR.

ENTREGA A DOMICILIO: ¡GRATIS! (DENTRO DE ÁREA LOCAL: TORREÓN-GÓMEZ-LERDO)
${getWarrantyText(warrantyDays)}
¡DUDAS/PEDIDOS DIRECTOS AL WHATSAPP! HTTPS://WA.ME/5218711412774

JSV-AUTOPARTES`;
};
