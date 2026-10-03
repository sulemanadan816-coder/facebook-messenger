export type LeadTier = 'Hot' | 'Warm' | 'Cold';
export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won';

export interface EncryptedPayload {
  algorithm: string;
  iv: string;
  ciphertext: string;
  tag?: string;
  timestamp: string;
  keyFingerprint: string;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  encryptedPayload?: EncryptedPayload;
  quickReplies?: string[];
  productCards?: {
    id: string;
    title: string;
    price: number;
    size: string;
    imageUrl: string;
    description: string;
  }[];
  orderSummary?: {
    orderNumber: string;
    productTitle: string;
    variantSize: string;
    totalAmount: number;
    status: string;
  };
  nlpMetrics?: {
    intent: string;
    score: number;
    tier: LeadTier;
    stage: LeadStage;
    budget?: string;
    timeline?: string;
    painPoint?: string;
    confidence?: number;
    recommendedOffer?: string;
  };
}

export interface LeadProfile {
  id: string;
  psid: string;
  name: string;
  avatar: string;
  platform: 'facebook_messenger' | 'instagram' | 'whatsapp';
  email?: string;
  phone?: string;
  company?: string;
  score: number; // 0 - 100
  tier: LeadTier;
  stage: LeadStage;
  budget: string;
  timeline: string;
  painPoint: string;
  recommendedOffer: string;
  tags: string[];
  lastActive: string;
  unreadCount: number;
  e2eeEnabled: boolean;
  safetyNumber: string;
  deviceKeyId: string;
  interestedProduct?: string;
  selectedSize?: string;
}

export interface Campaign {
  id: string;
  name: string;
  discountCode: string;
  discountPercent: number;
  description: string;
  active: boolean;
  targetAudience: string;
  ctaUrl: string;
  conversionCount: number;
}

export interface FacebookConfig {
  pageId: string;
  pageName: string;
  pageCategory?: string;
  pagePictureUrl?: string;
  verifyToken: string;
  pageAccessToken: string;
  appSecret?: string;
  appId?: string;
  webhookConnected: boolean;
  autoPilotEnabled: boolean;
  lastVerifiedAt?: string;
  hasToken?: boolean;
  callbackUrl?: string;
}

export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  senderId: string;
  recipientId: string;
  message: string;
  nlpAnalysis?: any;
  botReply?: string;
  graphMessageId?: string;
  status: 'received' | 'processed' | 'delivered' | 'failed';
  error?: string;
}

export interface AgentConfig {
  brandName: string;
  industry: string;
  tone: 'friendly_consultative' | 'direct_closing' | 'executive' | 'creative';
  autoPilotEnabled: boolean;
  qualificationThreshold: number;
  e2eeDefault: boolean;
  offeringSummary: string;
  pageAccessToken?: string;
  verifyToken?: string;
}

