import { db, StoredLead, StoredMessage } from '../../server/db.ts';
import { ConversationContextData, CustomerData } from './types.ts';

export function buildConversationContext(
  leadId: string,
  conversationId: string,
  userMessage: string
): ConversationContextData {
  const lead = db.getLead(leadId);
  const messages = db.getMessages(leadId);
  const campaigns = db.getCampaigns();
  const activePromo = campaigns.find((c) => c.active);

  // Extract recent message history (limit to last 8 messages to prevent context explosion)
  const recentMessages = messages.slice(-8).map((m) => ({
    role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    text: m.text,
    timestamp: m.timestamp,
  }));

  // Identify last shown product IDs from recent assistant messages
  const lastShownProductIds: string[] = [];
  for (const m of messages.slice().reverse()) {
    if (m.productCards && m.productCards.length > 0) {
      for (const card of m.productCards) {
        if (!lastShownProductIds.includes(card.id)) {
          lastShownProductIds.push(card.id);
        }
      }
    }
  }

  // Detect language
  const lower = userMessage.toLowerCase();
  let language = 'Roman Urdu / Hinglish';
  if (
    lower.includes('mujhe') ||
    lower.includes('bhai') ||
    lower.includes('chahiye') ||
    lower.includes('kitne') ||
    lower.includes('wala') ||
    lower.includes('hai') ||
    lower.includes('karo') ||
    lower.includes('haan')
  ) {
    language = 'Roman Urdu';
  } else if (lower.includes('the') || lower.includes('what') || lower.includes('have') || lower.includes('price')) {
    language = 'English';
  }

  const customer: CustomerData = {
    psid: lead?.psid || 'psid_default',
    name: lead?.name && !lead.name.startsWith('Facebook User') ? lead.name : undefined,
    phone: lead?.phone || undefined,
    city: lead?.company || undefined,
  };

  return {
    conversationId,
    businessId: 'biz_bed_crm',
    customer,
    recentMessages,
    lastShownProductIds: lastShownProductIds.slice(0, 5),
    campaign: activePromo
      ? {
          name: activePromo.name,
          discountCode: activePromo.discountCode,
          discountPercent: activePromo.discountPercent,
        }
      : undefined,
    language,
  };
}
