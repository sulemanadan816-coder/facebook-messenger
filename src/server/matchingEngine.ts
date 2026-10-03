import { Product, ProductVariant, OrderItem, BusinessHoursConfig } from '../types/commerce.ts';

export interface ExtractedRequirements {
  size?: 'Single' | 'Double' | 'Queen' | 'King' | 'Super King' | 'Custom';
  category?: 'Mattresses' | 'Bed Frames' | 'Pillows & Linen' | 'Bundles' | 'Accessories';
  budgetMax?: number;
  preferences?: string[];
  ordinalIndex?: number;
  isOrdering?: boolean;
  orderInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    paymentMethod?: string;
  };
  confirmationIntent?: 'confirm' | 'cancel' | 'modify' | 'none';
}

export function extractRequirements(message: string): ExtractedRequirements {
  const lower = message.toLowerCase();
  const req: ExtractedRequirements = { preferences: [] };

  // 1. Size Extraction
  if (lower.includes('super king') || lower.includes('cal king')) {
    req.size = 'Super King';
  } else if (lower.includes('king')) {
    req.size = 'King';
  } else if (lower.includes('queen')) {
    req.size = 'Queen';
  } else if (lower.includes('double') || lower.includes('full')) {
    req.size = 'Double';
  } else if (lower.includes('single') || lower.includes('twin')) {
    req.size = 'Single';
  }

  // 2. Category Extraction
  if (lower.includes('frame') || lower.includes('base') || lower.includes('headboard') || lower.includes('wooden') || (lower.includes('bed') && !lower.includes('bedding') && !lower.includes('mattress'))) {
    req.category = 'Bed Frames';
  } else if (lower.includes('pillow') || lower.includes('sheet') || lower.includes('duvet') || lower.includes('linen')) {
    req.category = 'Pillows & Linen';
  } else if (lower.includes('bundle') || lower.includes('set') || lower.includes('package')) {
    req.category = 'Bundles';
  } else if (lower.includes('mattress') || lower.includes('foam') || lower.includes('spring') || lower.includes('orthopedic')) {
    req.category = 'Mattresses';
  }

  // 3. Material & Preferences
  if (lower.includes('orthopedic') || lower.includes('back pain') || lower.includes('firm')) {
    req.preferences?.push('Orthopedic / Firm Support');
  }
  if (lower.includes('cooling') || lower.includes('hot') || lower.includes('breathable')) {
    req.preferences?.push('Cooling Gel / Breathable');
  }
  if (lower.includes('hybrid') || lower.includes('pocket spring')) {
    req.preferences?.push('Hybrid Pocket Spring');
  }
  if (lower.includes('memory foam') || lower.includes('soft') || lower.includes('plush')) {
    req.preferences?.push('Memory Foam / Plush');
  }

  // 4. Budget Extraction
  const budgetMatch = lower.match(/(?:budget|under|below|around|price|max|less than|within|\$)\s*(\d{2,6})/);
  if (budgetMatch && budgetMatch[1]) {
    req.budgetMax = parseInt(budgetMatch[1], 10);
  }

  // 5. Ordinal Reference Extraction
  if (lower.includes('first') || lower.includes('option 1') || lower.includes('#1') || lower.includes('number 1')) {
    req.ordinalIndex = 0;
  } else if (lower.includes('second') || lower.includes('option 2') || lower.includes('#2') || lower.includes('number 2')) {
    req.ordinalIndex = 1;
  } else if (lower.includes('third') || lower.includes('option 3') || lower.includes('#3') || lower.includes('number 3')) {
    req.ordinalIndex = 2;
  }

  // 6. Confirmation Intent Detection
  if (
    lower.includes('yes') ||
    lower.includes('confirm') ||
    lower.includes('order now') ||
    lower.includes('place order') ||
    lower.includes('proceed') ||
    lower.includes('i want to buy') ||
    lower.includes('deal') ||
    lower.includes('agree') ||
    lower.includes('haan') ||
    lower.includes('jee') ||
    lower.includes('theek hai') ||
    lower.includes('book kardo') ||
    lower.includes('book kr do') ||
    lower.includes('order kardo') ||
    lower.includes('order lga do') ||
    lower.includes('bhej do')
  ) {
    req.confirmationIntent = 'confirm';
  } else if (lower.includes('cancel') || lower.includes('no') || lower.includes('stop') || lower.includes('not now') || lower.includes('nahi') || lower.includes('cancel kardo')) {
    req.confirmationIntent = 'cancel';
  } else if (lower.includes('change') || lower.includes('different') || lower.includes('switch') || lower.includes('tabdeel')) {
    req.confirmationIntent = 'modify';
  } else {
    req.confirmationIntent = 'none';
  }

  // 7. Order Info Extraction (Phone, Address, Name)
  const phoneMatch = message.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b03\d{9}\b|\b09\d{9}\b|\b\d{10,12}\b/);
  const addressMatch = message.match(/(?:address|deliver to|delivery address|ship to|location|street|pata)[:\s]+([^,\n]+(?:,[^,\n]+){1,3})/i) ||
    message.match(/(?:\d+\s+[A-Za-z0-9\s.,]+(?:St|Street|Ave|Avenue|Blvd|Road|Rd|Drive|Dr|City|Bgy|Barangay|Zip|Phase)[^,\n]*)/i) ||
    message.match(/(?:Main Bazaar|Model Town|DHA|Gulberg|Cantt|Bahria|F-\d|G-\d|Sector [A-Z0-9]+|Phase \d|Johar|Clifton)[^,\n]*/i) ||
    message.match(/(?:Lahore|Karachi|Islamabad|Rawalpindi|Faisalabad|Multan|Peshawar|Quetta|Sialkot|Gujranwala|Jhelum|San Francisco|New York|Seattle|Austin)[^,\n]*/i);

  // Extract name if provided like "Adan 0300..." or "Name: Adan"
  const namePrefixMatch = message.match(/(?:name|naam)[:\s]+([A-Za-z\s]{3,30})/i) ||
    message.match(/(?:theek hai|confirm kardo|book kardo|haan|jee)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:03\d{9}|\d{10,11})/i);

  if (phoneMatch || addressMatch || lower.includes('cod') || lower.includes('cash on delivery') || lower.includes('gcash')) {
    req.isOrdering = true;
    req.orderInfo = {
      name: namePrefixMatch ? namePrefixMatch[1].trim() : undefined,
      phone: phoneMatch ? phoneMatch[0].trim() : undefined,
      address: addressMatch ? addressMatch[0].trim() : undefined,
      paymentMethod: lower.includes('cod') || lower.includes('cash on delivery')
        ? 'Cash on Delivery (COD)'
        : lower.includes('gcash') || lower.includes('transfer')
        ? 'Bank Transfer / GCash'
        : 'Cash on Delivery (COD)',
    };
  }

  return req;
}

export function matchProducts(products: Product[], req: ExtractedRequirements): { product: Product; variant?: ProductVariant; matchScore: number }[] {
  const scored = products.map((prod) => {
    let score = 0;

    // Category match
    if (req.category && prod.category === req.category) {
      score += 40;
    }

    // Size match
    let matchedVariant: ProductVariant | undefined;
    if (req.size) {
      matchedVariant = prod.variants.find((v) => v.size === req.size && v.available);
      if (matchedVariant) {
        score += 35;
      }
    } else {
      matchedVariant = prod.variants[0];
    }

    // Budget check
    if (req.budgetMax && matchedVariant) {
      if (matchedVariant.price <= req.budgetMax) {
        score += 20;
      } else if (matchedVariant.price <= req.budgetMax * 1.15) {
        score += 10;
      }
    }

    // Preferences / Features
    if (req.preferences && req.preferences.length > 0) {
      for (const pref of req.preferences) {
        if (prod.description.toLowerCase().includes(pref.toLowerCase()) || prod.features.some(f => f.toLowerCase().includes(pref.toLowerCase()))) {
          score += 15;
        }
      }
    }

    if (prod.isPopular) score += 5;

    return { product: prod, variant: matchedVariant, matchScore: score };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

// Business hours check
export function checkBusinessHours(config: BusinessHoursConfig): { isWithinHours: boolean; message?: string } {
  if (!config.enabled) return { isWithinHours: true };

  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  const isDayOpen = config.daysOpen.includes(currentDay);
  const isHourOpen = currentHour >= config.openHour && currentHour < config.closeHour;

  if (isDayOpen && isHourOpen) {
    return { isWithinHours: true };
  }

  return {
    isWithinHours: false,
    message: config.afterHoursMessage || 'Thank you for reaching out! Our sales team is currently offline, but our AI assistant is here to help you choose the perfect bed and take your reservation.',
  };
}
