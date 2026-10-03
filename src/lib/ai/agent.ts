import { GoogleGenAI } from '@google/genai';
import { db } from '../../server/db.ts';
import {
  AISettings,
  AIResponseOutput,
  AIToolCall,
  AIObservabilityDebug,
  ConversationContextData,
} from './types.ts';
import { buildSystemPrompt } from './prompts.ts';
import { buildConversationContext } from './context.ts';
import { AI_TOOL_DEFINITIONS, executeServerTool } from './tools.ts';

import dotenv from 'dotenv';
dotenv.config();

// Gemini client initialization
function getGenAIClient(): { client: GoogleGenAI; key: string } {
  const key = process.env.GEMINI_API_KEY || '';
  return {
    key,
    client: new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    }),
  };
}

export async function processCustomerMessageWithAI(
  leadId: string,
  userMessage: string,
  isDryRun: boolean = false
): Promise<AIResponseOutput> {
  const startTime = Date.now();
  const lead = db.getLead(leadId);
  const conversationId = leadId;
  const businessId = 'biz_bed_crm';
  const customerPsid = lead?.psid || 'psid_default';

  // 1. Fetch AI Settings
  const settings: AISettings = {
    enabled: true,
    model: process.env.OPENAI_MODEL || 'gemini-3.8-flash',
    agentName: 'Hamza',
    personality: 'friendly_pakistani_consultant',
    customInstructions: '',
    languageBehavior: 'auto',
    maxOrderQuantity: 3,
    handoffKeywords: ['human', 'agent', 'call me', 'representative', 'real person', 'insan'],
  };

  // 2. Check for explicit human handoff keywords
  const lowerMsg = userMessage.toLowerCase();
  if (settings.handoffKeywords.some((kw) => lowerMsg.includes(kw))) {
    await executeServerTool('handoff_to_human', { reason: userMessage }, {
      businessId,
      conversationId,
      leadId,
      customerPsid,
    });

    return {
      reply: 'Ji bilkul, main aapko hamare live human showroom representative se connect kar raha hoon. Wo jald hi aapse yahan Messenger par baat karenge aur aapke order ya sawal mein guide karenge! 🤝',
      toolCalls: [{ id: 'tc_handoff', name: 'handoff_to_human', arguments: { message: userMessage } }],
      debug: {
        ai_model: 'rule-based-handoff',
        ai_latency_ms: Date.now() - startTime,
        ai_tool_calls: [],
        ai_intent: 'Human Representative Handoff',
        ai_response_status: 'handoff',
      },
      quickReplies: ['View Bed Sizes', 'Delivery Times', 'Location of Showroom'],
      isHandoff: true,
    };
  }

  // 3. Build Conversation Context & System Prompt
  const context = buildConversationContext(leadId, conversationId, userMessage);
  const systemPrompt = buildSystemPrompt(settings, context);

  const executedToolCalls: AIToolCall[] = [];
  let modelUsed = 'gemini-3.8-flash';
  let generatedReply = '';
  let productCards: any[] | undefined;
  let orderSummary: any | undefined;

  // 4. Check for OpenAI API Key vs Gemini Native Engine
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (openAiApiKey) {
    try {
      modelUsed = process.env.OPENAI_MODEL || 'gpt-4o';
      const openAiResult = await callOpenAIAgent(
        openAiApiKey,
        modelUsed,
        systemPrompt,
        context,
        userMessage,
        executedToolCalls,
        { businessId, conversationId, leadId, customerPsid, lastShownProductIds: context.lastShownProductIds }
      );
      generatedReply = openAiResult.reply;
      productCards = openAiResult.productCards;
      orderSummary = openAiResult.orderSummary;
    } catch (openAiError) {
      console.warn('[OpenAI Agent] Error, attempting Gemini fallback:', openAiError);
    }
  }

  // 5. Native Gemini 3.8 Flash Server Engine (Primary/High-Efficiency)
  const { key: geminiApiKey, client: genai } = getGenAIClient();
  if (!generatedReply && geminiApiKey) {
    try {
      modelUsed = 'gemini-3.8-flash';
      const geminiResult = await callGeminiAgent(
        genai,
        systemPrompt,
        context,
        userMessage,
        executedToolCalls,
        { businessId, conversationId, leadId, customerPsid, lastShownProductIds: context.lastShownProductIds }
      );
      generatedReply = geminiResult.reply;
      productCards = geminiResult.productCards;
      orderSummary = geminiResult.orderSummary;
    } catch (geminiError) {
      console.warn('[Gemini Agent] Error, attempting deterministic fallback:', geminiError);
    }
  }

  // 6. Safe Deterministic Fallback Engine if AI APIs are offline
  if (!generatedReply) {
    modelUsed = 'deterministic-fallback';
    const fallback = await callDeterministicFallback(
      userMessage,
      context,
      executedToolCalls,
      { businessId, conversationId, leadId, customerPsid, lastShownProductIds: context.lastShownProductIds }
    );
    generatedReply = fallback.reply;
    productCards = fallback.productCards;
    orderSummary = fallback.orderSummary;
  }

  const latencyMs = Date.now() - startTime;

  return {
    reply: generatedReply,
    toolCalls: executedToolCalls,
    debug: {
      ai_model: modelUsed,
      ai_latency_ms: latencyMs,
      ai_tool_calls: executedToolCalls,
      ai_intent: 'Product Inquiry & Sales Assistance',
      ai_response_status: 'success',
    },
    quickReplies: [
      'King Size (Rs. 75,000)',
      'Queen Size (Rs. 68,000)',
      'Check Cash on Delivery',
      'Talk to Human Agent',
    ],
    productCards,
    orderSummary,
  };
}

// Gemini Function-Calling Loop
async function callGeminiAgent(
  genai: GoogleGenAI,
  systemPrompt: string,
  context: ConversationContextData,
  userMessage: string,
  executedToolCalls: AIToolCall[],
  securityContext: any
) {
  // Convert tools into Gemini Function Declarations
  const functionDeclarations = AI_TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT' as any,
      properties: Object.entries(tool.parameters.properties).reduce((acc: any, [k, v]) => {
        acc[k] = { type: v.type.toUpperCase() as any, description: v.description };
        return acc;
      }, {}),
      required: tool.parameters.required || [],
    },
  }));

  const messagesPayload: any[] = [
    ...context.recentMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  let currentTurn = await genai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: messagesPayload,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.5,
      tools: [{ functionDeclarations: functionDeclarations as any }],
    },
  });

  let productCards: any[] | undefined;
  let orderSummary: any | undefined;

  // Handle up to 3 multi-turn tool calling steps
  for (let step = 0; step < 3; step++) {
    const candidate = currentTurn.candidates?.[0];
    const functionCalls = currentTurn.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    const toolResponses: any[] = [];

    for (const fc of functionCalls) {
      const toolName = fc.name || 'unknown_tool';
      const toolArgs = (fc.args as Record<string, any>) || {};

      const toolResult = await executeServerTool(toolName, toolArgs, securityContext);

      executedToolCalls.push({
        id: `call_${Date.now()}_${step}`,
        name: toolName,
        arguments: toolArgs,
        result: toolResult.data || toolResult.error,
      });

      if (toolName === 'search_products' && toolResult.data?.products?.length > 0) {
        productCards = toolResult.data.products.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.currentPrice,
          size: p.requestedSize,
          imageUrl: p.imageUrl,
          description: p.description,
        }));
      }

      if (toolName === 'confirm_order' && toolResult.data?.orderNumber) {
        orderSummary = {
          orderNumber: toolResult.data.orderNumber,
          productTitle: 'Confirmed Bed Order',
          size: 'Standard',
          price: toolResult.data.totalAmount,
          customerPhone: toolResult.data.customerPhone,
          address: toolResult.data.deliveryAddress,
          status: 'Confirmed (COD)',
        };
      }

      toolResponses.push({
        functionResponse: {
          name: toolName,
          response: { output: toolResult.data || { error: toolResult.error } },
        },
      });
    }

    // Feed tool execution results back to model
    const historyWithCalls = [
      ...messagesPayload,
      candidate?.content,
      { role: 'user', parts: toolResponses },
    ];

    currentTurn = await genai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: historyWithCalls,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });
  }

  const finalReply = currentTurn.text || 'Ji, main aapki request check kar raha hoon. Kya aap koi specific bed dekhna chahte hain?';

  return { reply: finalReply, productCards, orderSummary };
}

// OpenAI API Loop with Tools
async function callOpenAIAgent(
  apiKey: string,
  model: string,
  systemPrompt: string,
  context: ConversationContextData,
  userMessage: string,
  executedToolCalls: AIToolCall[],
  securityContext: any
) {
  const toolsPayload = AI_TOOL_DEFINITIONS.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const messagesPayload: any[] = [
    { role: 'system', content: systemPrompt },
    ...context.recentMessages.map((m) => ({
      role: m.role,
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  let productCards: any[] | undefined;
  let orderSummary: any | undefined;

  let res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messagesPayload,
      tools: toolsPayload,
      tool_choice: 'auto',
      temperature: 0.5,
    }),
  });

  let data = await res.json();
  if (data.error) throw new Error(data.error.message);

  let message = data.choices?.[0]?.message;

  for (let step = 0; step < 3 && message?.tool_calls; step++) {
    messagesPayload.push(message);

    for (const tc of message.tool_calls) {
      const toolName = tc.function.name;
      const toolArgs = JSON.parse(tc.function.arguments || '{}');

      const toolResult = await executeServerTool(toolName, toolArgs, securityContext);

      executedToolCalls.push({
        id: tc.id,
        name: toolName,
        arguments: toolArgs,
        result: toolResult.data || toolResult.error,
      });

      if (toolName === 'search_products' && toolResult.data?.products?.length > 0) {
        productCards = toolResult.data.products.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.currentPrice,
          size: p.requestedSize,
          imageUrl: p.imageUrl,
          description: p.description,
        }));
      }

      if (toolName === 'confirm_order' && toolResult.data?.orderNumber) {
        orderSummary = {
          orderNumber: toolResult.data.orderNumber,
          productTitle: 'Confirmed Bed Order',
          size: 'Standard',
          price: toolResult.data.totalAmount,
          customerPhone: toolResult.data.customerPhone,
          address: toolResult.data.deliveryAddress,
          status: 'Confirmed (COD)',
        };
      }

      messagesPayload.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolResult.data || { error: toolResult.error }),
      });
    }

    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messagesPayload,
      }),
    });

    data = await res.json();
    message = data.choices?.[0]?.message;
  }

  return { reply: message?.content || '', productCards, orderSummary };
}

// High-Fidelity Deterministic Fallback Engine
async function callDeterministicFallback(
  userMessage: string,
  context: ConversationContextData,
  executedToolCalls: AIToolCall[],
  securityContext: any
) {
  const lower = userMessage.toLowerCase();
  let reply = '';
  let productCards: any[] | undefined;
  let orderSummary: any | undefined;

  // 1. Reference check ("ye wala", "second wala")
  if (lower.includes('ye wala') || lower.includes('iska') || lower.includes('this one')) {
    const ctxRes = await executeServerTool('get_conversation_context', { reference: 'ye wala' }, securityContext);
    executedToolCalls.push({ id: 'tc_ref', name: 'get_conversation_context', arguments: {}, result: ctxRes.data });

    const prev = ctxRes.data?.previouslyShownProducts?.[0];
    if (prev) {
      reply = `Ji! Ye "${prev.title}" hai. Iska base price Rs. ${prev.basePrice.toLocaleString()} hai. Available sizes: ${prev.sizes.join(', ')}. Kya aap iska order book karna chahte hain?`;
      return { reply, productCards, orderSummary };
    }
  }

  // 2. Search check (King, Queen, Bed, Mattress, Under 80k)
  let size = lower.includes('king') ? 'King' : lower.includes('queen') ? 'Queen' : lower.includes('double') ? 'Double' : undefined;
  let color = lower.includes('black') ? 'Black' : lower.includes('white') ? 'White' : lower.includes('oak') ? 'Oak' : undefined;
  let maxPrice = lower.includes('80k') || lower.includes('80000') ? 80000 : lower.includes('60') ? 60000 : undefined;

  const searchRes = await executeServerTool('search_products', { size, color, maxPrice, inStockOnly: true }, securityContext);
  executedToolCalls.push({ id: 'tc_search', name: 'search_products', arguments: { size, color, maxPrice }, result: searchRes.data });

  if (searchRes.data?.products?.length > 0) {
    const top = searchRes.data.products[0];
    productCards = searchRes.data.products.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.currentPrice,
      size: p.requestedSize,
      imageUrl: p.imageUrl,
      description: p.description,
    }));

    if (lower.includes('haan') || lower.includes('confirm') || lower.includes('order')) {
      reply = `Bilkul! Aapka "${top.title}" select ho gaya hai. Final order booking ke liye apna Delivery Address aur Phone Number share kar dein.`;
    } else {
      reply = `Ji, ${size ? `${size} size mein ` : ''}${color ? `${color} color mein ` : ''}ye option hamare paas available hai: "${top.title}". Iski price Rs. ${top.currentPrice.toLocaleString()} hai aur Cash on Delivery (COD) available hai. Kya aap iski delivery details check karna chahte hain?`;
    }
    return { reply, productCards, orderSummary };
  }

  reply = 'Ji! Welcome to BED Master showroom. Hamare paas premium King, Queen, aur Double size beds aur orthopedic mattresses available hain with Cash on Delivery nationwide. Aapko kis size ya budget mein bed chahiye?';
  return { reply, productCards, orderSummary };
}
