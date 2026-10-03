/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidNavBar, NavTab } from './components/AndroidNavBar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { LiveChatSimulator } from './components/LiveChatSimulator';
import { LeadsCRM } from './components/LeadsCRM';
import { OrdersManager } from './components/OrdersManager';
import { ProductCatalog } from './components/ProductCatalog';
import { CampaignsManager } from './components/CampaignsManager';
import { E2EESecurityVault } from './components/E2EESecurityVault';
import { SettingsWebhookModal } from './components/SettingsWebhookModal';
import { InboxList } from './components/InboxList';
import {
  LeadProfile,
  ChatMessage,
  Campaign,
  AgentConfig,
  LeadStage,
  EncryptedPayload,
  FacebookConfig,
  WebhookLogEntry,
} from './types';
import { Product, ProductVariant, Order, OrderStatus } from './types/commerce.ts';
import { cryptoEngine } from './lib/crypto';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('simulator');
  const [activeLeadId, setActiveLeadId] = useState<string>('lead_01');
  const [leads, setLeads] = useState<LeadProfile[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    brandName: 'BED Master & Sleep Lab',
    industry: 'Orthopedic Mattresses & Bedroom Furniture',
    tone: 'friendly_consultative',
    autoPilotEnabled: true,
    qualificationThreshold: 65,
    e2eeDefault: true,
    offeringSummary: 'Orthopedic Cloud Foam Mattresses, Pocket Spring Hybrid Beds, Solid Oak Frames, Organic Bamboo Bedding with 100-Night Trial & Free COD Delivery',
  });

  const [fbConfig, setFbConfig] = useState<FacebookConfig>({
    pageId: '109283748291039',
    pageName: 'BED Master & Sleep Lab',
    verifyToken: 'omni_secure_verify_2026',
    pageAccessToken: '',
    webhookConnected: true,
    autoPilotEnabled: true,
  });

  // 1. Initial Data Fetch from Real Server Database
  const fetchAllData = async () => {
    try {
      const [leadsRes, msgsRes, prodsRes, ordsRes, campsRes, fbRes, logsRes, agentRes] = await Promise.all([
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/messages').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/campaigns').then((r) => r.json()),
        fetch('/api/facebook/config').then((r) => r.json()),
        fetch('/api/facebook/logs').then((r) => r.json()),
        fetch('/api/agent/config').then((r) => r.json()),
      ]);

      if (leadsRes.leads) setLeads(leadsRes.leads);
      if (msgsRes.messages) setMessages(msgsRes.messages);
      if (prodsRes.products) setProducts(prodsRes.products);
      if (ordsRes.orders) setOrders(ordsRes.orders);
      if (campsRes.campaigns) setCampaigns(campsRes.campaigns);
      if (fbRes) setFbConfig(fbRes);
      if (logsRes.logs) setWebhookLogs(logsRes.logs);
      if (agentRes.config) setAgentConfig(agentRes.config);

      if (leadsRes.leads?.length > 0 && !leads.some((l) => l.id === activeLeadId)) {
        setActiveLeadId(leadsRes.leads[0].id);
      }
    } catch (err) {
      console.error('[Client] Failed to load server data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 2. Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/events/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'message_new') {
            const newMsg = payload.data as ChatMessage;
            setMessages((prev) => ({
              ...prev,
              [newMsg.leadId]: [...(prev[newMsg.leadId] || []), newMsg],
            }));
          } else if (payload.type === 'order_new') {
            const newOrder = payload.data as Order;
            setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
          } else if (payload.type === 'order_updated') {
            const updated = payload.data as Order;
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          } else if (payload.type === 'lead_new') {
            const newLead = payload.data as LeadProfile;
            setLeads((prev) => [newLead, ...prev.filter((l) => l.id !== newLead.id)]);
          } else if (payload.type === 'lead_updated') {
            const updated = payload.data as LeadProfile;
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          } else if (payload.type === 'product_updated') {
            const updatedProd = payload.data as Product;
            setProducts((prev) => [updatedProd, ...prev.filter((p) => p.id !== updatedProd.id)]);
          } else if (payload.type === 'webhook_event') {
            const logItem = payload.data as WebhookLogEntry;
            setWebhookLogs((prev) => [logItem, ...prev.slice(0, 49)]);
          } else if (payload.type === 'facebook_connected') {
            setFbConfig(payload.data);
          }
        } catch (e) {
          console.error('[SSE Parse Error]', e);
        }
      };
    } catch (err) {
      console.warn('[SSE] EventSource init failed:', err);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const activeLead = leads.find((l) => l.id === activeLeadId) || leads[0] || {
    id: 'lead_default',
    psid: 'fb_user_default',
    name: 'Facebook Customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    platform: 'facebook_messenger' as const,
    score: 75,
    tier: 'Hot' as const,
    stage: 'Contacted' as const,
    budget: '$400 - $600',
    timeline: 'Immediate',
    painPoint: 'Needs firm orthopedic queen mattress',
    recommendedOffer: 'Cloud Rest Queen ($449 with COD)',
    tags: ['Queen Size', 'Mattress'],
    lastActive: 'Just now',
    unreadCount: 0,
    e2eeEnabled: true,
    safetyNumber: '48291 93821 04921 59201 39182 48102',
    deviceKeyId: 'ecdh_default',
  };

  const activeChat = messages[activeLeadId] || [];

  // Send message flow (calls real backend /api/chat/respond and persists to DB)
  const handleSendMessage = async (text: string, isFromUser: boolean, isEncrypted: boolean) => {
    let encryptedPayload: EncryptedPayload | undefined;

    if (isEncrypted) {
      try {
        encryptedPayload = await cryptoEngine.encrypt(activeLeadId, text);
      } catch (err) {
        console.warn('Encryption error, sending standard:', err);
      }
    }

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      leadId: activeLeadId,
      sender: isFromUser ? 'user' : 'agent',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted,
      encryptedPayload,
    };

    // Save message to real database
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: activeLeadId, message: newMsg }),
    });

    const updatedList = [...(messages[activeLeadId] || []), newMsg];
    setMessages((prev) => ({
      ...prev,
      [activeLeadId]: updatedList,
    }));

    // Trigger AI NLP lead qualification if from user and autoPilot is on
    if (isFromUser && agentConfig.autoPilotEnabled) {
      try {
        const response = await fetch('/api/chat/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: updatedList.slice(-6),
            leadProfile: activeLead,
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch AI response');
        const data = await response.json();

        // Encrypt bot reply if E2EE active
        let botEncrypted: EncryptedPayload | undefined;
        if (isEncrypted) {
          botEncrypted = await cryptoEngine.encrypt(activeLeadId, data.reply);
        }

        const botMsg: ChatMessage = {
          id: 'msg_bot_' + Date.now(),
          leadId: activeLeadId,
          sender: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted,
          encryptedPayload: botEncrypted,
          quickReplies: data.quickReplies,
          productCards: data.productCards,
          orderSummary: data.createdOrder
            ? {
                orderNumber: data.createdOrder.orderNumber,
                productTitle: data.createdOrder.items[0]?.productTitle || 'Mattress',
                variantSize: data.createdOrder.items[0]?.variantSize || 'Queen',
                totalAmount: data.createdOrder.totalAmount,
                status: data.createdOrder.status,
              }
            : undefined,
          nlpMetrics: data.leadAnalysis,
        };

        // Save bot reply to real database
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: activeLeadId, message: botMsg }),
        });

        setMessages((prev) => ({
          ...prev,
          [activeLeadId]: [...(prev[activeLeadId] || []), botMsg],
        }));

        if (data.createdOrder) {
          setOrders((prev) => [data.createdOrder, ...prev.filter((o) => o.id !== data.createdOrder.id)]);
        }

        // Update Lead profile in real database
        if (data.leadAnalysis) {
          const analysis = data.leadAnalysis;
          const patchData = {
            score: analysis.score || activeLead.score,
            tier: analysis.tier || activeLead.tier,
            stage: analysis.stage || activeLead.stage,
            budget: analysis.detectedBudget || activeLead.budget,
            timeline: analysis.timeline || activeLead.timeline,
            painPoint: analysis.painPoint || activeLead.painPoint,
            recommendedOffer: analysis.recommendedOffer || activeLead.recommendedOffer,
            tags: Array.from(new Set([...activeLead.tags, ...(analysis.tags || [])])),
            lastActive: 'Just now',
          };

          await fetch(`/api/leads/${activeLeadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchData),
          });

          setLeads((prev) =>
            prev.map((l) => (l.id === activeLeadId ? { ...l, ...patchData } : l))
          );
        }
      } catch (err) {
        console.error('Error in AI qualification response:', err);
      }
    }
  };

  const handleUpdateLead = async (updated: Partial<LeadProfile>) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === activeLeadId ? { ...l, ...updated } : l))
    );
    await fetch(`/api/leads/${activeLeadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  };

  const handleUpdateLeadStage = async (leadId: string, newStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
  };

  const handleRotateLeadKey = async (leadId: string) => {
    const newSafety = await cryptoEngine.rotateSessionKey(leadId);
    handleUpdateLead({ safetyNumber: newSafety });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success && data.order) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    }
  };

  const handleSendProductToChat = async (product: Product, variant: ProductVariant) => {
    const recommendationText = `Here is our top recommendation for you:\n\n🛏️ **${product.title}** (${variant.size}: $${variant.price})\n${product.description}\n\nFeatures:\n• ${product.features.join('\n• ')}\n\nWould you like to reserve this with free delivery and Cash on Delivery (COD)?`;
    setCurrentTab('simulator');
    await handleSendMessage(recommendationText, false, activeLead.e2eeEnabled);
  };

  const handleOpenCustomerChat = (customerName: string) => {
    const matchedLead = leads.find((l) => l.name.toLowerCase() === customerName.toLowerCase());
    if (matchedLead) {
      setActiveLeadId(matchedLead.id);
    }
    setCurrentTab('simulator');
  };

  const handleVerifyToken = async (token: string) => {
    const res = await fetch('/api/facebook/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageAccessToken: token }),
    });
    const data = await res.json();
    if (data.success && data.config) {
      setFbConfig(data.config);
    }
    return data;
  };

  const handleSendTestMessage = async (recipientPsid: string, text: string) => {
    const res = await fetch('/api/facebook/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientPsid, message: text }),
    });
    return await res.json();
  };

  const handleSimulateInbound = async () => {
    const demoBeds = [
      { name: 'Alexander Wright', company: 'San Francisco, CA', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', text: "Hello! Looking for a King size mattress that stays cool at night. Can I pay COD?" },
      { name: 'Chloe Dubois', company: 'Seattle, WA', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', text: "Do you have the solid oak bed frame in Queen size available for delivery this week?" },
      { name: 'Ryan Morales', company: 'Austin, TX', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80', text: "I have herniated disc lower back pain. Which orthopedic bed is firmest?" },
    ];

    const pick = demoBeds[Math.floor(Math.random() * demoBeds.length)];
    const newId = 'lead_' + Date.now();
    const safetyNumber = await cryptoEngine.rotateSessionKey(newId);

    const newLead: LeadProfile = {
      id: newId,
      psid: 'fb_user_' + Math.floor(100000 + Math.random() * 900000),
      name: pick.name,
      avatar: pick.avatar,
      platform: 'facebook_messenger',
      company: pick.company,
      score: 80,
      tier: 'Hot',
      stage: 'New',
      budget: '$450 - $750',
      timeline: 'This week',
      painPoint: 'Mattress & Bed Selection',
      recommendedOffer: 'Spring Sleep Sale (25% Off)',
      tags: ['Bed Inquiry', 'Hot Prospect', 'COD Shopper'],
      lastActive: 'Just now',
      unreadCount: 1,
      e2eeEnabled: true,
      safetyNumber,
      deviceKeyId: 'ecdh_' + newId,
    };

    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    });

    setLeads((prev) => [newLead, ...prev]);
    setActiveLeadId(newId);

    const initialUserMsg: ChatMessage = {
      id: 'msg_init_' + Date.now(),
      leadId: newId,
      sender: 'user',
      text: pick.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
    };

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: newId, message: initialUserMsg }),
    });

    setMessages((prev) => ({
      ...prev,
      [newId]: [initialUserMsg],
    }));

    setCurrentTab('simulator');

    if (agentConfig.autoPilotEnabled) {
      setTimeout(() => {
        handleSendMessage(pick.text, false, true);
      }, 700);
    }
  };

  const handleToggleCampaign = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success && data.campaign) {
      setCampaigns((prev) => prev.map((c) => (c.id === id ? data.campaign : c)));
    }
  };

  const handleAddCampaign = async (newCamp: Omit<Campaign, 'id' | 'conversionCount'>) => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCamp),
    });
    const data = await res.json();
    if (data.success && data.campaign) {
      setCampaigns((prev) => [data.campaign, ...prev]);
    }
  };

  const handleSaveAgentConfig = async (updated: Partial<AgentConfig>) => {
    const next = { ...agentConfig, ...updated };
    setAgentConfig(next);
    await fetch('/api/agent/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  };

  const handleSaveFbConfig = async (updated: Partial<FacebookConfig>) => {
    const next = { ...fbConfig, ...updated };
    setFbConfig(next);
    await fetch('/api/facebook/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white pb-24">
      {/* Android System Status Bar */}
      <AndroidStatusBar
        e2eeActive={activeLead.e2eeEnabled}
        autoPilotActive={agentConfig.autoPilotEnabled}
      />

      {/* PWA Install Banner & Offline notice */}
      <PWAInstallBanner />

      {/* Main App Content View based on currentTab */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading BED Messenger CRM & live product catalog...</p>
          </div>
        ) : (
          <>
            {currentTab === 'simulator' && (
              <LiveChatSimulator
                activeLead={activeLead}
                messages={activeChat}
                campaigns={campaigns}
                agentConfig={agentConfig}
                onSendMessage={handleSendMessage}
                onUpdateLead={handleUpdateLead}
                onToggleAutoPilot={() =>
                  handleSaveAgentConfig({
                    autoPilotEnabled: !agentConfig.autoPilotEnabled,
                  })
                }
              />
            )}

            {currentTab === 'inbox' && (
              <InboxList
                leads={leads}
                messages={messages}
                activeLeadId={activeLeadId}
                onSelectLead={(id) => {
                  setActiveLeadId(id);
                  setCurrentTab('simulator');
                }}
                onSimulateInbound={handleSimulateInbound}
              />
            )}

            {currentTab === 'orders' && (
              <OrdersManager
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                onOpenCustomerChat={handleOpenCustomerChat}
              />
            )}

            {currentTab === 'products' && (
              <ProductCatalog
                products={products}
                onAddProduct={(newProd) => {
                  setProducts((prev) => [newProd, ...prev]);
                  fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProd),
                  });
                }}
                onSendProductToChat={handleSendProductToChat}
              />
            )}

            {currentTab === 'crm' && (
              <LeadsCRM
                leads={leads}
                onSelectLead={(id) => {
                  setActiveLeadId(id);
                  setCurrentTab('simulator');
                }}
                onUpdateLeadStage={handleUpdateLeadStage}
              />
            )}

            {currentTab === 'campaigns' && (
              <CampaignsManager
                campaigns={campaigns}
                onToggleCampaign={handleToggleCampaign}
                onAddCampaign={handleAddCampaign}
              />
            )}

            {currentTab === 'security' && (
              <E2EESecurityVault
                leads={leads}
                onRotateLeadKey={handleRotateLeadKey}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsWebhookModal
                config={agentConfig}
                fbConfig={fbConfig}
                webhookLogs={webhookLogs}
                onSaveConfig={handleSaveAgentConfig}
                onSaveFbConfig={handleSaveFbConfig}
                onVerifyToken={handleVerifyToken}
                onSendTestMessage={handleSendTestMessage}
                onRefreshLogs={fetchAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Android Material 3 Bottom Navigation Bar */}
      <AndroidNavBar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        unreadCount={leads.filter((l) => l.unreadCount > 0).length}
        ordersCount={orders.filter((o) => o.status === 'confirmed').length}
        hotLeadsCount={leads.filter((l) => l.tier === 'Hot').length}
      />
    </div>
  );
}
