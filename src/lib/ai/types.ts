import { Product, ProductVariant, Order, OrderStatus } from '../../types/commerce.ts';

export type AIModelType = 'gpt-4o' | 'gpt-4o-mini' | 'gemini-3.8-flash' | 'claude-3-5-sonnet';

export interface AISettings {
  enabled: boolean;
  model: string;
  agentName: string;
  personality: 'friendly_pakistani_consultant' | 'direct_closer' | 'formal_executive' | 'custom';
  customInstructions: string;
  languageBehavior: 'auto' | 'roman_urdu' | 'english' | 'urdu';
  maxOrderQuantity: number;
  handoffKeywords: string[];
}

export interface CustomerData {
  id?: string;
  psid: string;
  name?: string;
  phone?: string;
  city?: string;
  area?: string;
  address?: string;
}

export interface OrderDraftItem {
  productId: string;
  productTitle: string;
  variantId?: string;
  size: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderDraft {
  conversationId: string;
  businessId: string;
  customer: CustomerData;
  items: OrderDraftItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  paymentMethod: string;
  status: 'drafting' | 'awaiting_confirmation' | 'confirmed' | 'cancelled';
  missingFields: ('name' | 'phone' | 'city' | 'address')[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationContextData {
  conversationId: string;
  businessId: string;
  customer: CustomerData;
  recentMessages: Array<{ role: 'user' | 'assistant' | 'system'; text: string; timestamp?: string }>;
  lastShownProductIds: string[];
  selectedProduct?: {
    id: string;
    title: string;
    size?: string;
    color?: string;
    price: number;
  };
  orderDraft?: OrderDraft;
  campaign?: {
    name: string;
    discountCode: string;
    discountPercent: number;
  };
  language: string;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface AIObservabilityDebug {
  ai_model: string;
  ai_latency_ms: number;
  ai_tool_calls: AIToolCall[];
  ai_intent: string;
  ai_error?: string;
  ai_response_status: 'success' | 'fallback' | 'handoff' | 'error';
  tokens_used?: number;
}

export interface AIResponseOutput {
  reply: string;
  toolCalls: AIToolCall[];
  debug: AIObservabilityDebug;
  quickReplies?: string[];
  productCards?: Array<{
    id: string;
    title: string;
    price: number;
    size: string;
    color?: string;
    imageUrl: string;
    description: string;
  }>;
  orderSummary?: {
    orderNumber?: string;
    productTitle: string;
    size: string;
    color?: string;
    quantity: number;
    price: number;
    customerName?: string;
    customerPhone?: string;
    city?: string;
    address?: string;
    status: string;
  };
  isHandoff?: boolean;
}
