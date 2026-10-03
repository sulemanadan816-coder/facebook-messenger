import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { db, StoredLead, StoredMessage, StoredCampaign, WebhookEventLog } from './src/server/db.ts';
import { extractRequirements, matchProducts, checkBusinessHours } from './src/server/matchingEngine.ts';
import { processCustomerMessageWithAI } from './src/lib/ai/agent.ts';
import { Order, OrderStatus } from './src/types/commerce.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Capture raw body for Meta Webhook HMAC-SHA256 signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Server-Sent Events (SSE) subscribers
const sseClients: Response[] = [];

function broadcastSSE(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      // client disconnected
    }
  }
}

// SSE Stream Endpoint
app.get('/api/events/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);
  console.log(`[SSE] Client connected. Total subscribers: ${sseClients.length}`);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time BED Messenger CRM SSE active' })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

// Meta Facebook Webhook Verification (GET)
app.get('/api/facebook/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const config = db.getFacebookConfig();

  console.log(`[Facebook Webhook Verification Request] mode=${mode}, token=${token}`);

  if (mode === 'subscribe' && token === config.verifyToken) {
    console.log('[Facebook Webhook] Verified successfully with token!');
    db.updateFacebookConfig({ webhookConnected: true });
    broadcastSSE('webhook_verified', { verified: true });
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send('Forbidden: Token mismatch');
});

// Meta Facebook Webhook Ingestion (POST)
app.post('/api/facebook/webhook', async (req: Request, res: Response) => {
  const body = req.body;
  const config = db.getFacebookConfig();
  const signature = req.headers['x-hub-signature-256'] as string;

  if (config.appSecret && signature && (req as any).rawBody) {
    const expectedSig =
      'sha256=' +
      crypto.createHmac('sha256', config.appSecret).update((req as any).rawBody).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      console.error('[Facebook Webhook] Signature verification failed!');
      res.status(403).send('Invalid signature');
      return;
    }
  }

  if (body.object === 'page') {
    for (const entry of body.entry || []) {
      for (const webhookEvent of entry.messaging || []) {
        const senderPsid = webhookEvent.sender?.id || 'anonymous_user';
        const recipientId = webhookEvent.recipient?.id || config.pageId;

        if (webhookEvent.message && webhookEvent.message.text) {
          const userMessage = webhookEvent.message.text;
          console.log(`[Facebook Webhook] Incoming message from PSID ${senderPsid}: "${userMessage}"`);

          const logItem: WebhookEventLog = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            timestamp: new Date().toISOString(),
            senderId: senderPsid,
            recipientId,
            message: userMessage,
            status: 'received',
            rawPayload: webhookEvent,
          };

          // Find or create real Lead in DB
          let lead = db.findLeadByPsid(senderPsid);
          if (!lead) {
            let realName = `Facebook User (${senderPsid.substring(0, 6)})`;
            let profilePic = `https://api.dicebear.com/7.x/bottts/svg?seed=${senderPsid}`;

            if (config.pageAccessToken) {
              try {
                const userProfileRes = await fetch(
                  `https://graph.facebook.com/v19.0/${senderPsid}?fields=first_name,last_name,profile_pic&access_token=${config.pageAccessToken}`
                );
                const userProfile = await userProfileRes.json();
                if (userProfile.first_name) {
                  realName = `${userProfile.first_name} ${userProfile.last_name || ''}`.trim();
                  if (userProfile.profile_pic) profilePic = userProfile.profile_pic;
                }
              } catch (e) {
                console.warn('[Facebook Graph API] Could not fetch user profile:', e);
              }
            }

            lead = {
              id: 'lead_' + Date.now(),
              psid: senderPsid,
              name: realName,
              avatar: profilePic,
              platform: 'facebook_messenger',
              score: 55,
              tier: 'Warm',
              stage: 'New',
              budget: 'Detecting...',
              timeline: 'Exploring',
              painPoint: 'Initial Facebook Inbound message',
              recommendedOffer: 'Spring Sleep Sale (25% Off)',
              tags: ['Facebook Inbound', 'Real Webhook'],
              lastActive: 'Just now',
              unreadCount: 1,
              e2eeEnabled: true,
              safetyNumber: formatSafetyNumber(senderPsid),
              deviceKeyId: 'ecdh_' + senderPsid,
            };
            db.upsertLead(lead);
            broadcastSSE('lead_new', lead);
          }

          // Save user message to database
          const incomingMsg: StoredMessage = {
            id: 'msg_' + Date.now(),
            leadId: lead.id,
            sender: 'user',
            text: userMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEncrypted: lead.e2eeEnabled,
          };
          db.addMessage(lead.id, incomingMsg);
          broadcastSSE('message_new', incomingMsg);

          // AI Qualification & Commerce Auto-responder
          if (config.autoPilotEnabled) {
            try {
              const aiResult = await qualifyLeadAndGenerateReply({
                message: userMessage,
                conversationHistory: db.getMessages(lead.id).slice(-6),
                leadProfile: lead,
              });

              logItem.nlpAnalysis = aiResult.leadAnalysis;
              logItem.botReply = aiResult.reply;
              logItem.status = 'processed';

              // Update lead scores in DB
              if (aiResult.leadAnalysis) {
                db.updateLead(lead.id, {
                  score: aiResult.leadAnalysis.score || lead.score,
                  tier: aiResult.leadAnalysis.tier || lead.tier,
                  stage: aiResult.leadAnalysis.stage || lead.stage,
                  budget: aiResult.leadAnalysis.detectedBudget || lead.budget,
                  timeline: aiResult.leadAnalysis.timeline || lead.timeline,
                  painPoint: aiResult.leadAnalysis.painPoint || lead.painPoint,
                  recommendedOffer: aiResult.leadAnalysis.recommendedOffer || lead.recommendedOffer,
                  interestedProduct: aiResult.matchedProduct?.title || lead.interestedProduct,
                  selectedSize: aiResult.extractedRequirements?.size || lead.selectedSize,
                  tags: Array.from(new Set([...lead.tags, ...(aiResult.leadAnalysis.tags || [])])),
                  lastActive: 'Just now',
                });
                broadcastSSE('lead_updated', db.getLead(lead.id));
              }

              // Send real Facebook Graph API message back to user if token configured
              if (config.pageAccessToken) {
                const graphResp = await sendFacebookGraphMessage(senderPsid, aiResult.reply, config.pageAccessToken);
                logItem.graphMessageId = graphResp.message_id;
                logItem.status = 'delivered';
              }

              // Save bot message to DB
              const botMsg: StoredMessage = {
                id: 'msg_bot_' + Date.now(),
                leadId: lead.id,
                sender: 'agent',
                text: aiResult.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isEncrypted: lead.e2eeEnabled,
                quickReplies: aiResult.quickReplies,
                productCards: aiResult.productCards,
                orderSummary: aiResult.createdOrder
                  ? {
                      orderNumber: aiResult.createdOrder.orderNumber,
                      productTitle: aiResult.createdOrder.items[0]?.productTitle || 'Mattress',
                      variantSize: aiResult.createdOrder.items[0]?.variantSize || 'Queen',
                      totalAmount: aiResult.createdOrder.totalAmount,
                      status: aiResult.createdOrder.status,
                    }
                  : undefined,
                nlpMetrics: aiResult.leadAnalysis,
              };
              db.addMessage(lead.id, botMsg);
              broadcastSSE('message_new', botMsg);
            } catch (err: any) {
              console.error('[Facebook Webhook] AI Processing error:', err);
              logItem.status = 'failed';
              logItem.error = err.message;
            }
          }

          db.addWebhookLog(logItem);
          broadcastSSE('webhook_event', logItem);
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
    return;
  }

  res.sendStatus(404);
});

// Real Facebook Graph API Message Sender
async function sendFacebookGraphMessage(recipientId: string, text: string, accessToken: string) {
  try {
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: 'RESPONSE',
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('[Facebook Graph API] Network error sending message:', error);
    throw error;
  }
}

function formatSafetyNumber(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const str = Math.abs(hash).toString().padStart(30, '73910');
  const blocks: string[] = [];
  for (let i = 0; i < 6; i++) {
    blocks.push(str.substring(i * 5, (i + 1) * 5) || '48291');
  }
  return blocks.join(' ');
}

// AI NLP Lead Qualification & Bed Commerce Matcher
interface QualificationRequest {
  message: string;
  conversationHistory?: Array<{ sender: 'user' | 'agent' | 'system'; text: string; timestamp?: string }>;
  leadProfile?: any;
}

async function qualifyLeadAndGenerateReply(payload: QualificationRequest) {
  const products = db.getProducts();
  const campaigns = db.getCampaigns();
  const businessHours = db.getBusinessHours();
  const agentConfig = db.getAgentConfig();

  // 1. Check business hours
  const hoursCheck = checkBusinessHours(businessHours);

  // 2. Run local requirements extraction
  const req = extractRequirements(payload.message);
  const matched = matchProducts(products, req);
  const topMatch = matched[0]?.product;
  const topVariant = matched[0]?.variant || topMatch?.variants[0];

  // 3. Check active promotional campaign
  const activePromo = campaigns.find((c) => c.active);
  const discountRate = activePromo ? activePromo.discountPercent : 0;

  // 4. Handle Order Placement detection
  let createdOrder: Order | undefined;
  if (req.isOrdering && req.orderInfo?.phone && topMatch && topVariant) {
    const unitPrice = topVariant.price;
    const discountAmount = Math.round((unitPrice * discountRate) / 100);
    const totalAmount = unitPrice - discountAmount;

    createdOrder = {
      id: 'ord_' + Date.now(),
      orderNumber: 'BED-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      customerId: payload.leadProfile?.id || 'cust_temp',
      customerName: req.orderInfo.name || payload.leadProfile?.name || 'Valued Customer',
      customerPhone: req.orderInfo.phone,
      shippingAddress: req.orderInfo.address || 'Address provided on Messenger call',
      items: [
        {
          productId: topMatch.id,
          variantId: topVariant.id,
          productTitle: topMatch.title,
          variantSize: topVariant.size,
          unitPrice,
          quantity: 1,
          totalPrice: unitPrice,
        },
      ],
      subtotal: unitPrice,
      discountAmount,
      discountCode: activePromo?.discountCode,
      totalAmount,
      paymentMethod: req.orderInfo.paymentMethod as any || 'Cash on Delivery (COD)',
      status: 'confirmed',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      notes: `Matched via Facebook Messenger AI. Extracted requirement: ${req.preferences?.join(', ') || 'Standard'}`,
    };

    db.createOrder(createdOrder);
    broadcastSSE('order_new', createdOrder);
  }

  // 5. System prompt grounded in product catalog & business rules
  const catalogContext = products
    .map(
      (p) =>
        `- ${p.title} (${p.category}): Base $${p.basePrice}. Sizes: ${p.variants.map((v) => `${v.size}: $${v.price}`).join(', ')}. Features: ${p.features.join('; ')}`
    )
    .join('\n');

  const historyContext = (payload.conversationHistory || [])
    .slice(-6)
    .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const systemPrompt = `You are Hamza, the senior sales & marketing qualifying AI Agent for "${agentConfig.brandName}" (BED Messenger CRM).
Product Catalog:
${catalogContext}

Active Promotion: ${activePromo ? `"${activePromo.name}" (${activePromo.discountPercent}% OFF with code ${activePromo.discountCode})` : 'Standard Factory Direct Pricing'}.
Shipping & Payment: 100% Free Home Delivery & Cash on Delivery (COD) available nationwide. 100-Night Risk-Free Sleep Trial on all mattresses.

Language & Communication Capabilities:
- Fluently understand and respond in:
  * Roman Urdu / Hinglish (e.g. "bhai king size ka black bed chahiye", "rate kitna hai?", "COD hai?", "delivery Lahore/Karachi/Jhelum?")
  * English (e.g. "What mattress is best for lower back pain?", "Can I pay Cash on Delivery?")
- Match the customer's language naturally: if they write in Roman Urdu, reply warmly in natural Roman Urdu ("Ji bhai bilkul...", "Hamare paas..."). If they write in English, reply in English.
- Always quote exact real prices from the catalog and confirm Cash on Delivery (COD) availability.
- Keep replies friendly, concise, natural, and mobile-friendly (1 to 3 short paragraphs).
- Output structured JSON.`;

  const userPrompt = `Conversation History:
${historyContext || '(First incoming message)'}

Current Lead:
${JSON.stringify(payload.leadProfile || {})}

User's Latest Message:
"${payload.message}"

${createdOrder ? `[SYSTEM NOTICE: Order ${createdOrder.orderNumber} for ${createdOrder.items[0]?.productTitle} (${createdOrder.items[0]?.variantSize}) has been registered with COD. Confirm order to user warmly!]` : ''}

Generate JSON response matching:
{
  "reply": "Natural conversational Facebook Messenger reply",
  "leadAnalysis": {
    "intent": "Intent label (e.g. Back Pain Queen Mattress Inquiry)",
    "score": 85,
    "tier": "Hot" | "Warm" | "Cold",
    "stage": "New" | "Contacted" | "Qualified" | "Proposal" | "Won",
    "detectedBudget": "price range",
    "timeline": "timeline",
    "painPoint": "main sleeping need or issue",
    "recommendedOffer": "product offer",
    "tags": ["Queen Size", "Back Pain", "COD"]
  },
  "quickReplies": ["Quick reply 1", "Quick reply 2", "Quick reply 3"]
}`;

  const startTime = Date.now();

  if (apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const responseText = response.text?.trim() || '';
      const parsed = JSON.parse(responseText);

      // Attach product cards
      const productCards = topMatch
        ? [
            {
              id: topMatch.id,
              title: topMatch.title,
              price: topVariant ? topVariant.price : topMatch.basePrice,
              size: topVariant ? topVariant.size : 'Standard',
              imageUrl: topMatch.imageUrl,
              description: topMatch.description,
            },
          ]
        : undefined;

      return {
        ...parsed,
        productCards,
        matchedProduct: topMatch,
        extractedRequirements: req,
        createdOrder,
        latencyMs: Date.now() - startTime,
        model: 'gemini-3.8-flash',
      };
    } catch (apiError) {
      console.error('[Gemini API] Error, fallback to heuristic commerce engine:', apiError);
    }
  }

  // Fallback Heuristic Commerce Response
  let reply = '';
  let quickReplies = ['View Queen Size', 'View King Size', 'Do you offer COD?'];
  let tier: 'Hot' | 'Warm' | 'Cold' = 'Warm';
  let score = 55;
  let stage: any = 'Contacted';

  if (createdOrder) {
    reply = `🎉 Thank you! Your order **#${createdOrder.orderNumber}** for the **${createdOrder.items[0]?.productTitle} (${createdOrder.items[0]?.variantSize})** has been confirmed with Cash on Delivery (COD) for **$${createdOrder.totalAmount}**.\n\nOur delivery team will contact you at ${createdOrder.customerPhone} before dispatch. Sleep well! 🛏️`;
    quickReplies = ['Track Order Status', 'Delivery Timeframe', 'Care Instructions'];
    tier = 'Hot';
    score = 98;
    stage = 'Won';
  } else if (req.confirmationIntent === 'confirm' || req.isOrdering) {
    reply = `Awesome! The **${topMatch?.title} (${topVariant?.size || 'Queen'})** is reserved for you with our ${activePromo ? `${activePromo.discountPercent}% discount` : 'special price'} of **$${topVariant?.price || 449}**.\n\nTo complete your Cash on Delivery (COD) reservation, please reply with:\n1. Your Complete Delivery Address\n2. Contact Phone Number`;
    quickReplies = ['Confirm Delivery Address', 'Send Contact Number', 'Change Mattress Size'];
    tier = 'Hot';
    score = 88;
    stage = 'Qualified';
  } else if (topMatch) {
    const discountedPrice = Math.round(topVariant.price * (1 - discountRate / 100));
    reply = `Hi! For ${req.size || 'a comfortable setup'}, our most recommended choice is the **${topMatch.title}** (${topVariant.size}: $${discountedPrice}${discountRate > 0 ? ` with code ${activePromo?.discountCode}` : ''}).\n\n${topMatch.description}\n\nWe offer **Free Home Delivery** and **Cash on Delivery (COD)** nationwide with our 100-night sleep guarantee. Would you like to confirm this size?`;
    quickReplies = [`Select ${topVariant.size} ($${discountedPrice})`, 'Do you have COD?', 'See other sizes'];
    tier = 'Hot';
    score = 75;
    stage = 'Contacted';
  } else {
    reply = `Hello! Welcome to BED Master & Sleep Lab. We specialize in orthopedic spinal alignment mattresses, solid oak bed frames, and bamboo silk bedding with free delivery and COD.\n\nWhat size bed are you looking for (Single, Double, Queen, or King), and do you prefer firm orthopedic support or plush cooling comfort?`;
    quickReplies = ['Queen Size Mattress', 'King Size Mattress', 'Solid Wood Frame', 'Check Promo Deals'];
  }

  const productCards = topMatch
    ? [
        {
          id: topMatch.id,
          title: topMatch.title,
          price: topVariant ? topVariant.price : topMatch.basePrice,
          size: topVariant ? topVariant.size : 'Standard',
          imageUrl: topMatch.imageUrl,
          description: topMatch.description,
        },
      ]
    : undefined;

  return {
    reply,
    leadAnalysis: {
      intent: req.preferences?.join(', ') || 'Bedding & Mattress Inquiry',
      score,
      tier,
      stage,
      detectedBudget: req.budgetMax ? `Under $${req.budgetMax}` : '$400 - $700',
      timeline: 'Within 7 days',
      painPoint: req.preferences?.[0] || 'Looking for comfortable bed with COD',
      recommendedOffer: topMatch ? `${topMatch.title} (${topVariant.size})` : 'Spring Sleep Sale',
      tags: [req.size || 'Queen', 'Mattress', 'Facebook Inbound'],
    },
    quickReplies,
    productCards,
    matchedProduct: topMatch,
    extractedRequirements: req,
    createdOrder,
    latencyMs: Date.now() - startTime,
    model: 'nlp-heuristic',
  };
}

// REST API Endpoints

// 1. AI Response Generator
app.post('/api/chat/respond', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, leadProfile } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const result = await qualifyLeadAndGenerateReply({
      message,
      conversationHistory,
      leadProfile,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error generating AI response:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// AI Agent Multi-turn Test & Observability Endpoint
app.post('/api/ai/test', async (req: Request, res: Response) => {
  try {
    const { message, leadId } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    const result = await processCustomerMessageWithAI(leadId || 'lead_01', message);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/test:', err);
    res.status(500).json({ error: err.message || 'AI test execution failed' });
  }
});

// 2. Products Catalog API
app.get('/api/products', (_req: Request, res: Response) => {
  res.json({ products: db.getProducts() });
});

app.post('/api/products', (req: Request, res: Response) => {
  const prod = db.upsertProduct(req.body);
  broadcastSSE('product_updated', prod);
  res.json({ success: true, product: prod });
});

// 3. Orders Management API
app.get('/api/orders', (_req: Request, res: Response) => {
  res.json({ orders: db.getOrders() });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const newOrder: Order = {
    id: 'ord_' + Date.now(),
    orderNumber: 'BED-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
    ...req.body,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  const created = db.createOrder(newOrder);
  broadcastSSE('order_new', created);
  res.json({ success: true, order: created });
});

app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = db.updateOrderStatus(req.params.id, status as OrderStatus);
  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  broadcastSSE('order_updated', updated);
  res.json({ success: true, order: updated });
});

// 4. Customers API
app.get('/api/customers', (_req: Request, res: Response) => {
  res.json({ customers: db.getCustomers() });
});

// 5. Business Hours API
app.get('/api/business-hours', (_req: Request, res: Response) => {
  res.json({ businessHours: db.getBusinessHours() });
});

app.post('/api/business-hours', (req: Request, res: Response) => {
  const updated = db.updateBusinessHours(req.body);
  res.json({ success: true, businessHours: updated });
});

// 6. Meta Facebook Token Verification
app.post('/api/facebook/test-token', async (req: Request, res: Response) => {
  const { pageAccessToken } = req.body;
  if (!pageAccessToken) {
    res.status(400).json({ success: false, error: 'Page access token is required' });
    return;
  }

  try {
    const graphRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,category,about,picture&access_token=${encodeURIComponent(pageAccessToken)}`
    );
    const data = await graphRes.json();

    if (data.error) {
      res.status(400).json({
        success: false,
        error: data.error.message || 'Facebook Graph API rejected this token',
        metaError: data.error,
      });
      return;
    }

    const updated = db.updateFacebookConfig({
      pageId: data.id,
      pageName: data.name,
      pageCategory: data.category,
      pagePictureUrl: data.picture?.data?.url,
      pageAccessToken,
      lastVerifiedAt: new Date().toISOString(),
      webhookConnected: true,
    });

    broadcastSSE('facebook_connected', updated);
    res.json({ success: true, page: data, config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Network failure connecting to graph.facebook.com: ' + err.message });
  }
});

// 7. Real Facebook Graph API Message Dispatcher
app.post('/api/facebook/send-test', async (req: Request, res: Response) => {
  const { recipientPsid, message } = req.body;
  const config = db.getFacebookConfig();

  if (!config.pageAccessToken) {
    res.status(400).json({ success: false, error: 'No Facebook Page Access Token configured' });
    return;
  }

  if (!recipientPsid || !message) {
    res.status(400).json({ success: false, error: 'recipientPsid and message are required' });
    return;
  }

  try {
    const graphRes = await sendFacebookGraphMessage(recipientPsid, message, config.pageAccessToken);
    if (graphRes.error) {
      res.status(400).json({ success: false, error: graphRes.error.message, metaError: graphRes.error });
      return;
    }
    res.json({ success: true, result: graphRes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Facebook Config & Setup Info
app.get('/api/facebook/config', (_req: Request, res: Response) => {
  const config = db.getFacebookConfig();
  res.json({
    ...config,
    hasToken: Boolean(config.pageAccessToken),
    callbackUrl: `${process.env.APP_URL || 'https://' + _req.get('host')}/api/facebook/webhook`,
  });
});

app.post('/api/facebook/config', (req: Request, res: Response) => {
  const updated = db.updateFacebookConfig(req.body);
  broadcastSSE('facebook_config_updated', updated);
  res.json({ success: true, config: updated });
});

// 9. Leads CRUD
app.get('/api/leads', (_req: Request, res: Response) => {
  res.json({ leads: db.getLeads() });
});

app.post('/api/leads', (req: Request, res: Response) => {
  const lead = db.upsertLead(req.body);
  broadcastSSE('lead_new', lead);
  res.json({ success: true, lead });
});

app.patch('/api/leads/:id', (req: Request, res: Response) => {
  const updated = db.updateLead(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  broadcastSSE('lead_updated', updated);
  res.json({ success: true, lead: updated });
});

// 10. Messages CRUD
app.get('/api/messages/:leadId', (req: Request, res: Response) => {
  res.json({ messages: db.getMessages(req.params.leadId) });
});

app.get('/api/messages', (_req: Request, res: Response) => {
  res.json({ messages: db.getAllMessages() });
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { leadId, message } = req.body;
  if (!leadId || !message) {
    res.status(400).json({ error: 'leadId and message are required' });
    return;
  }
  const saved = db.addMessage(leadId, message);
  broadcastSSE('message_new', saved);
  res.json({ success: true, message: saved });
});

// 11. Campaigns CRUD
app.get('/api/campaigns', (_req: Request, res: Response) => {
  res.json({ campaigns: db.getCampaigns() });
});

app.post('/api/campaigns', (req: Request, res: Response) => {
  const newCamp: StoredCampaign = {
    id: 'camp_' + Date.now(),
    name: req.body.name,
    discountCode: req.body.discountCode || 'VIPPROMO',
    discountPercent: Number(req.body.discountPercent || 20),
    description: req.body.description || '',
    active: req.body.active ?? true,
    targetAudience: req.body.targetAudience || 'Facebook Inbound',
    ctaUrl: req.body.ctaUrl || 'https://omnigrowth.ai',
    conversionCount: 0,
  };
  const saved = db.upsertCampaign(newCamp);
  broadcastSSE('campaign_new', saved);
  res.json({ success: true, campaign: saved });
});

app.patch('/api/campaigns/:id/toggle', (req: Request, res: Response) => {
  const updated = db.toggleCampaign(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  broadcastSSE('campaign_updated', updated);
  res.json({ success: true, campaign: updated });
});

app.delete('/api/campaigns/:id', (req: Request, res: Response) => {
  const deleted = db.deleteCampaign(req.params.id);
  res.json({ success: deleted });
});

// 12. Webhook Event Logs
app.get('/api/facebook/logs', (_req: Request, res: Response) => {
  res.json({ logs: db.getWebhookLogs() });
});

// 13. Agent Config
app.get('/api/agent/config', (_req: Request, res: Response) => {
  res.json({ config: db.getAgentConfig() });
});

app.post('/api/agent/config', (req: Request, res: Response) => {
  const updated = db.updateAgentConfig(req.body);
  res.json({ success: true, config: updated });
});

// 14. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(apiKey),
    leadsCount: db.getLeads().length,
    productsCount: db.getProducts().length,
    ordersCount: db.getOrders().length,
    activeSubscribers: sseClients.length,
    version: '3.5.0-bed-messenger-crm',
  });
});

// Serve frontend in development and production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BED Messenger CRM Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
