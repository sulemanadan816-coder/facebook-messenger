import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Product, Order, CustomerProfile, BusinessHoursConfig, OrderStatus } from '../types/commerce.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface StoredLead {
  id: string;
  psid: string;
  name: string;
  avatar: string;
  platform: 'facebook_messenger' | 'instagram' | 'whatsapp';
  company?: string;
  email?: string;
  phone?: string;
  score: number;
  tier: 'Hot' | 'Warm' | 'Cold';
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won';
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

export interface StoredMessage {
  id: string;
  leadId: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  encryptedPayload?: {
    algorithm: string;
    iv: string;
    ciphertext: string;
    tag?: string;
    timestamp: string;
    keyFingerprint: string;
  };
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
    tier: 'Hot' | 'Warm' | 'Cold';
    stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won';
    budget?: string;
    timeline?: string;
    painPoint?: string;
    confidence?: number;
    recommendedOffer?: string;
    matchedProduct?: string;
  };
}

export interface StoredCampaign {
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

export interface StoredFacebookConfig {
  pageId: string;
  pageName: string;
  pageCategory?: string;
  pagePictureUrl?: string;
  verifyToken: string;
  pageAccessToken: string;
  appSecret: string;
  appId: string;
  webhookConnected: boolean;
  autoPilotEnabled: boolean;
  lastVerifiedAt?: string;
}

export interface WebhookEventLog {
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
  rawPayload?: any;
}

export interface DatabaseSchema {
  facebookConfig: StoredFacebookConfig;
  products: Product[];
  orders: Order[];
  customers: CustomerProfile[];
  leads: StoredLead[];
  messages: Record<string, StoredMessage[]>;
  campaigns: StoredCampaign[];
  businessHours: BusinessHoursConfig;
  webhookLogs: WebhookEventLog[];
  agentConfig: {
    brandName: string;
    industry: string;
    tone: 'friendly_consultative' | 'direct_closing' | 'executive' | 'creative';
    qualificationThreshold: number;
    e2eeDefault: boolean;
    offeringSummary: string;
  };
}

const defaultProducts: Product[] = [
  {
    id: 'prod_cloud_rest',
    title: 'Orthopedic Cloud Rest Mattress',
    category: 'Mattresses',
    description: 'Triple-layer orthopedic memory foam with ergonomic spine alignment and cool-gel airflow layer. Prevents morning back pain.',
    features: ['Zero Motion Transfer', 'Gel-infused cooling top', 'Removable washable cover', '10-Year Warranty'],
    basePrice: 299,
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewsCount: 342,
    isPopular: true,
    variants: [
      { id: 'var_cr_single', size: 'Single', dimensions: '90 x 190 cm', sku: 'CR-SIN-01', price: 299, stock: 15, available: true },
      { id: 'var_cr_double', size: 'Double', dimensions: '135 x 190 cm', sku: 'CR-DBL-02', price: 399, stock: 22, available: true },
      { id: 'var_cr_queen', size: 'Queen', dimensions: '150 x 200 cm', sku: 'CR-QEN-03', price: 499, compareAtPrice: 599, stock: 28, available: true },
      { id: 'var_cr_king', size: 'King', dimensions: '180 x 200 cm', sku: 'CR-KNG-04', price: 599, compareAtPrice: 699, stock: 18, available: true },
      { id: 'var_cr_superking', size: 'Super King', dimensions: '200 x 200 cm', sku: 'CR-SKN-05', price: 699, stock: 8, available: true },
    ],
  },
  {
    id: 'prod_hybrid_luxe',
    title: 'Hybrid Pocket Spring Luxe Mattress',
    category: 'Mattresses',
    description: '1,200 individually pocketed contour springs encased in high-density latex and cashmere breathable quilting for luxury hotel comfort.',
    features: ['1,200 Pocket Springs', 'Organic Natural Latex', 'Edge-to-edge support', 'Breathable Cashmere Quilt'],
    basePrice: 349,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewsCount: 198,
    isPopular: true,
    variants: [
      { id: 'var_hl_single', size: 'Single', dimensions: '90 x 190 cm', sku: 'HL-SIN-01', price: 349, stock: 12, available: true },
      { id: 'var_hl_double', size: 'Double', dimensions: '135 x 190 cm', sku: 'HL-DBL-02', price: 459, stock: 14, available: true },
      { id: 'var_hl_queen', size: 'Queen', dimensions: '150 x 200 cm', sku: 'HL-QEN-03', price: 589, compareAtPrice: 699, stock: 20, available: true },
      { id: 'var_hl_king', size: 'King', dimensions: '180 x 200 cm', sku: 'HL-KNG-04', price: 729, compareAtPrice: 849, stock: 11, available: true },
    ],
  },
  {
    id: 'prod_oak_frame',
    title: 'Nordic Solid Oak Platform Bed Frame',
    category: 'Bed Frames',
    description: 'Handcrafted solid Scandinavian oak with noise-free mortise-and-tenon joints and reinforced solid wood slat foundation.',
    features: ['100% Solid Natural Oak', 'Zero-Squeak Heavy Duty', '15-min Tool-Free Assembly', 'Sleek Headboard Included'],
    basePrice: 449,
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewsCount: 124,
    isPopular: false,
    variants: [
      { id: 'var_of_double', size: 'Double', dimensions: '142 x 202 cm', sku: 'OF-DBL-01', price: 449, stock: 9, available: true },
      { id: 'var_of_queen', size: 'Queen', dimensions: '157 x 212 cm', sku: 'OF-QEN-02', price: 549, stock: 15, available: true },
      { id: 'var_of_king', size: 'King', dimensions: '187 x 212 cm', sku: 'OF-KNG-03', price: 649, stock: 7, available: true },
    ],
  },
  {
    id: 'prod_bamboo_linen',
    title: '100% Organic Bamboo Silk Bedding Set',
    category: 'Pillows & Linen',
    description: 'Silky smooth 300-thread count 100% organic bamboo viscose. Thermoregulating, antibacterial, and gentler than mulberry silk.',
    features: ['Includes Fitted Sheet, Flat Sheet, 2 Pillowcases', 'Naturally Hypoallergenic', 'Deep 40cm Pockets', 'Anti-frizz texture'],
    basePrice: 129,
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewsCount: 88,
    isPopular: false,
    variants: [
      { id: 'var_bm_double', size: 'Double', sku: 'BM-DBL-01', price: 129, stock: 35, available: true },
      { id: 'var_bm_queen', size: 'Queen', sku: 'BM-QEN-02', price: 149, stock: 40, available: true },
      { id: 'var_bm_king', size: 'King', sku: 'BM-KNG-03', price: 169, stock: 25, available: true },
    ],
  },
  {
    id: 'prod_master_bundle',
    title: 'Master Suite Dream Sleep Bundle',
    category: 'Bundles',
    description: 'The ultimate bedroom upgrade: Queen/King Solid Oak Frame + Cloud Rest Mattress + 2 Cooling Gel Memory Pillows + Organic Bamboo Sheet Set.',
    features: ['Complete Bedroom in a Box', 'Instant 25% Bundle Savings', 'Free White Glove Delivery', '100-Night Sleep Trial'],
    basePrice: 1099,
    imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80',
    rating: 5.0,
    reviewsCount: 67,
    isPopular: true,
    variants: [
      { id: 'var_bun_queen', size: 'Queen', sku: 'BUN-QEN-01', price: 1099, compareAtPrice: 1450, stock: 10, available: true },
      { id: 'var_bun_king', size: 'King', sku: 'BUN-KNG-02', price: 1299, compareAtPrice: 1690, stock: 8, available: true },
    ],
  },
];

const defaultOrders: Order[] = [
  {
    id: 'ord_1042',
    orderNumber: 'BED-2026-1042',
    customerId: 'cust_01',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (415) 892-0192',
    shippingAddress: '742 Evergreen Terrace, San Francisco, CA 94107',
    items: [
      {
        productId: 'prod_cloud_rest',
        variantId: 'var_cr_queen',
        productTitle: 'Orthopedic Cloud Rest Mattress',
        variantSize: 'Queen',
        unitPrice: 499,
        quantity: 1,
        totalPrice: 499,
      },
    ],
    subtotal: 499,
    discountAmount: 50,
    discountCode: 'SCALE25',
    totalAmount: 449,
    paymentMethod: 'Cash on Delivery (COD)',
    status: 'confirmed',
    createdAt: 'Today, 10:20 AM',
    updatedAt: 'Today, 10:22 AM',
    notes: 'Customer asked for afternoon delivery. Back pain relief priority.',
  },
  {
    id: 'ord_1041',
    orderNumber: 'BED-2026-1041',
    customerId: 'cust_02',
    customerName: 'Sarah Jenkins',
    customerPhone: '+1 (212) 555-0193',
    shippingAddress: '350 5th Avenue, Penthouse B, New York, NY 10118',
    items: [
      {
        productId: 'prod_master_bundle',
        variantId: 'var_bun_king',
        productTitle: 'Master Suite Dream Sleep Bundle',
        variantSize: 'King',
        unitPrice: 1299,
        quantity: 1,
        totalPrice: 1299,
      },
    ],
    subtotal: 1299,
    discountAmount: 100,
    discountCode: 'VIPDEAL',
    totalAmount: 1199,
    paymentMethod: 'Bank Transfer / GCash',
    status: 'processing',
    createdAt: 'Yesterday, 3:45 PM',
    updatedAt: 'Today, 8:00 AM',
  },
  {
    id: 'ord_1040',
    orderNumber: 'BED-2026-1040',
    customerId: 'cust_03',
    customerName: 'Elena Rostova',
    customerPhone: '+1 (310) 459-2819',
    shippingAddress: '120 Ocean View Drive, Santa Monica, CA 90401',
    items: [
      {
        productId: 'prod_bamboo_linen',
        variantId: 'var_bm_queen',
        productTitle: '100% Organic Bamboo Silk Bedding Set',
        variantSize: 'Queen',
        unitPrice: 149,
        quantity: 1,
        totalPrice: 149,
      },
    ],
    subtotal: 149,
    discountAmount: 0,
    totalAmount: 149,
    paymentMethod: 'Credit Card / Online Link',
    status: 'delivered',
    createdAt: '3 days ago',
    updatedAt: 'Yesterday, 2:10 PM',
  },
];

const defaultCustomers: CustomerProfile[] = [
  {
    id: 'cust_01',
    psid: 'fb_user_892102',
    name: 'Marcus Vance',
    phone: '+1 (415) 892-0192',
    email: 'marcus@vanceapparel.co',
    deliveryAddress: '742 Evergreen Terrace, San Francisco, CA 94107',
    totalOrders: 1,
    totalSpend: 449,
    firstSeenAt: 'Today',
    lastSeenAt: 'Today, 10:25 AM',
  },
  {
    id: 'cust_02',
    psid: 'fb_user_719284',
    name: 'Sarah Jenkins',
    phone: '+1 (212) 555-0193',
    email: 'sarah@jenkins.biz',
    deliveryAddress: '350 5th Avenue, Penthouse B, New York, NY 10118',
    totalOrders: 2,
    totalSpend: 1548,
    firstSeenAt: 'Last month',
    lastSeenAt: 'Yesterday',
  },
];

const defaultBusinessHours: BusinessHoursConfig = {
  enabled: true,
  timezone: 'Asia/Manila',
  openHour: 8,
  closeHour: 22,
  daysOpen: [0, 1, 2, 3, 4, 5, 6], // Mon-Sun
  afterHoursMessage: 'Hello! Thank you for messaging BED Messenger CRM. Our live agents are resting, but our AI shopping assistant is online 24/7 to recommend products, calculate discounts, and confirm your order!',
};

const defaultDatabase: DatabaseSchema = {
  facebookConfig: {
    pageId: '109283748291039',
    pageName: 'BED Master & Sleep Lab',
    verifyToken: 'omni_secure_verify_2026',
    pageAccessToken: '',
    appSecret: '',
    appId: '',
    webhookConnected: true,
    autoPilotEnabled: true,
  },
  products: defaultProducts,
  orders: defaultOrders,
  customers: defaultCustomers,
  businessHours: defaultBusinessHours,
  leads: [
    {
      id: 'lead_01',
      psid: 'fb_user_892102',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      platform: 'facebook_messenger',
      company: 'Vance Residence',
      email: 'marcus@vanceapparel.co',
      phone: '+1 (415) 892-0192',
      score: 92,
      tier: 'Hot',
      stage: 'Won',
      budget: '$400 - $600',
      timeline: 'Immediate',
      painPoint: 'Severe lower back pain, needs firm orthopedic queen mattress',
      recommendedOffer: 'Cloud Rest Queen ($449 with COD)',
      tags: ['Queen Size', 'Back Pain', 'Order Placed', 'COD'],
      lastActive: '2 min ago',
      unreadCount: 0,
      e2eeEnabled: true,
      safetyNumber: '48291 93821 04921 59201 39182 48102',
      deviceKeyId: 'ecdh_p256_vance_01',
      interestedProduct: 'Orthopedic Cloud Rest Mattress',
      selectedSize: 'Queen',
    },
    {
      id: 'lead_02',
      psid: 'fb_user_394819',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
      platform: 'facebook_messenger',
      company: 'Rostova Design',
      email: 'elena@luminaskin.io',
      phone: '+1 (310) 459-2819',
      score: 78,
      tier: 'Hot',
      stage: 'Qualified',
      budget: '$500 - $800',
      timeline: 'This weekend',
      painPoint: 'Wants cooling hybrid mattress for warm bedroom',
      recommendedOffer: 'Hybrid Pocket Spring Luxe (Queen)',
      tags: ['Cooling', 'Queen Size', 'High Intent'],
      lastActive: '18 min ago',
      unreadCount: 0,
      e2eeEnabled: true,
      safetyNumber: '19203 48192 30192 84910 29381 50192',
      deviceKeyId: 'ecdh_p256_elena_02',
      interestedProduct: 'Hybrid Pocket Spring Luxe Mattress',
      selectedSize: 'Queen',
    },
    {
      id: 'lead_03',
      psid: 'fb_user_581903',
      name: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      platform: 'facebook_messenger',
      score: 60,
      tier: 'Warm',
      stage: 'Contacted',
      budget: 'Under $400',
      timeline: 'Next 2 weeks',
      painPoint: 'Looking for affordable double size bed base',
      recommendedOffer: 'Nordic Oak Frame (Double)',
      tags: ['Bed Frame', 'Double Size', 'Price Sensitive'],
      lastActive: '2 hours ago',
      unreadCount: 0,
      e2eeEnabled: false,
      safetyNumber: '73910 28190 49102 81920 39182 59102',
      deviceKeyId: 'ecdh_p256_chen_03',
      selectedSize: 'Double',
    },
  ],
  messages: {
    lead_01: [
      {
        id: 'msg_01',
        leadId: 'lead_01',
        sender: 'user',
        text: 'Hello! I saw your Facebook ad for orthopedic mattresses. I wake up with terrible lower back pain every morning. What do you recommend for a Queen size bed?',
        timestamp: '10:14 AM',
        isEncrypted: true,
      },
      {
        id: 'msg_02',
        leadId: 'lead_01',
        sender: 'agent',
        text: "Hi Marcus! We specialize in ergonomic spinal alignment mattresses. For lower back pain, our #1 top-rated product is the Orthopedic Cloud Rest Mattress (Queen size: 150x200cm).\n\nIt features high-density contour foam that supports the lumbar spine while relieving hip pressure. Would you like to see pricing and our 100-night risk-free trial?",
        timestamp: '10:15 AM',
        isEncrypted: true,
        quickReplies: ['Yes, send pricing', 'Do you offer COD?', 'What firmness is it?'],
        nlpMetrics: {
          intent: 'Back Pain Orthopedic Mattress Inquiry',
          score: 85,
          tier: 'Hot',
          stage: 'Qualified',
          budget: '$400 - $600',
          timeline: 'Immediate',
          painPoint: 'Severe lower back pain',
          recommendedOffer: 'Orthopedic Cloud Rest Mattress (Queen)',
          matchedProduct: 'prod_cloud_rest',
        },
      },
      {
        id: 'msg_03',
        leadId: 'lead_01',
        sender: 'user',
        text: 'Yes please! How much is Queen size, and can I pay Cash on Delivery (COD) to San Francisco?',
        timestamp: '10:18 AM',
        isEncrypted: true,
      },
      {
        id: 'msg_04',
        leadId: 'lead_01',
        sender: 'agent',
        text: "The Queen size Cloud Rest is normally $599, but with our current Promo code SCALE25 it's discounted to $449!\n\nYes! We offer 100% Cash on Delivery (COD) with free home delivery. To confirm your order, simply reply with your Complete Delivery Address and Phone Number.",
        timestamp: '10:19 AM',
        isEncrypted: true,
        quickReplies: ['Confirm Order #BED-2026-1042', 'Send Delivery Details', 'Check delivery date'],
        orderSummary: {
          orderNumber: 'BED-2026-1042',
          productTitle: 'Orthopedic Cloud Rest Mattress',
          variantSize: 'Queen (150x200cm)',
          totalAmount: 449,
          status: 'Confirmed (COD)',
        },
      },
    ],
  },
  campaigns: [
    {
      id: 'camp_01',
      name: 'Spring Sleep Sale (25% Off Queen & King)',
      discountCode: 'SCALE25',
      discountPercent: 25,
      description: 'Instant discount on all Cloud Rest & Hybrid Luxe mattresses for Queen & King sizes. Free white-glove setup.',
      active: true,
      targetAudience: 'Homeowners with back pain or upgrading bed',
      ctaUrl: 'https://omnigrowth.ai/beds',
      conversionCount: 38,
    },
    {
      id: 'camp_02',
      name: 'VIP Cash on Delivery (COD) Guarantee',
      discountCode: 'VIPDEAL',
      discountPercent: 15,
      description: 'Zero upfront payment needed. Pay upon delivery after inspecting mattress in your home.',
      active: true,
      targetAudience: 'COD Shoppers on Facebook Messenger',
      ctaUrl: 'https://omnigrowth.ai/cod',
      conversionCount: 54,
    },
  ],
  webhookLogs: [],
  agentConfig: {
    brandName: 'BED Master & Sleep Lab',
    industry: 'Orthopedic Mattresses & Bedroom Furniture',
    tone: 'friendly_consultative',
    qualificationThreshold: 65,
    e2eeDefault: true,
    offeringSummary: 'Orthopedic Cloud Foam Mattresses, Pocket Spring Hybrid Beds, Solid Oak Frames, Organic Bamboo Bedding with 100-Night Trial & Free COD Delivery',
  },
};

class JSONDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (!parsed.products || parsed.products.length === 0) {
          parsed.products = defaultProducts;
        }
        if (!parsed.orders) parsed.orders = defaultOrders;
        if (!parsed.customers) parsed.customers = defaultCustomers;
        if (!parsed.businessHours) parsed.businessHours = defaultBusinessHours;
        return parsed;
      }
    } catch (e) {
      console.error('[Database] Error loading JSON DB, initializing defaults:', e);
    }
    this.save(defaultDatabase);
    return defaultDatabase;
  }

  public save(data?: DatabaseSchema) {
    if (data) this.data = data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Failed to save DB to disk:', e);
    }
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProduct(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public upsertProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = product;
    } else {
      this.data.products.unshift(product);
    }
    this.save();
    return product;
  }

  // Orders
  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getOrder(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }

  public updateOrderStatus(id: string, status: OrderStatus): Order | null {
    const order = this.data.orders.find((o) => o.id === id || o.orderNumber === id);
    if (order) {
      order.status = status;
      order.updatedAt = 'Just now';
      this.save();
      return order;
    }
    return null;
  }

  // Customers
  public getCustomers(): CustomerProfile[] {
    return this.data.customers;
  }

  public upsertCustomer(cust: CustomerProfile): CustomerProfile {
    const idx = this.data.customers.findIndex((c) => c.id === cust.id || c.psid === cust.psid);
    if (idx >= 0) {
      this.data.customers[idx] = { ...this.data.customers[idx], ...cust };
    } else {
      this.data.customers.unshift(cust);
    }
    this.save();
    return cust;
  }

  // Business Hours
  public getBusinessHours(): BusinessHoursConfig {
    return this.data.businessHours;
  }

  public updateBusinessHours(partial: Partial<BusinessHoursConfig>): BusinessHoursConfig {
    this.data.businessHours = { ...this.data.businessHours, ...partial };
    this.save();
    return this.data.businessHours;
  }

  // Facebook Config
  public getFacebookConfig(): StoredFacebookConfig {
    return this.data.facebookConfig;
  }

  public updateFacebookConfig(partial: Partial<StoredFacebookConfig>): StoredFacebookConfig {
    this.data.facebookConfig = { ...this.data.facebookConfig, ...partial };
    this.save();
    return this.data.facebookConfig;
  }

  // Agent Config
  public getAgentConfig() {
    return this.data.agentConfig;
  }

  public updateAgentConfig(partial: Partial<DatabaseSchema['agentConfig']>) {
    this.data.agentConfig = { ...this.data.agentConfig, ...partial };
    this.save();
    return this.data.agentConfig;
  }

  // Leads
  public getLeads(): StoredLead[] {
    return this.data.leads;
  }

  public getLead(id: string): StoredLead | undefined {
    return this.data.leads.find((l) => l.id === id);
  }

  public findLeadByPsid(psid: string): StoredLead | undefined {
    return this.data.leads.find((l) => l.psid === psid);
  }

  public upsertLead(lead: StoredLead): StoredLead {
    const idx = this.data.leads.findIndex((l) => l.id === lead.id || (lead.psid && l.psid === lead.psid));
    if (idx >= 0) {
      this.data.leads[idx] = { ...this.data.leads[idx], ...lead };
    } else {
      this.data.leads.unshift(lead);
    }
    this.save();
    return lead;
  }

  public updateLead(id: string, partial: Partial<StoredLead>): StoredLead | null {
    const idx = this.data.leads.findIndex((l) => l.id === id);
    if (idx >= 0) {
      this.data.leads[idx] = { ...this.data.leads[idx], ...partial };
      this.save();
      return this.data.leads[idx];
    }
    return null;
  }

  // Messages
  public getMessages(leadId: string): StoredMessage[] {
    return this.data.messages[leadId] || [];
  }

  public getAllMessages(): Record<string, StoredMessage[]> {
    return this.data.messages;
  }

  public addMessage(leadId: string, message: StoredMessage): StoredMessage {
    if (!this.data.messages[leadId]) {
      this.data.messages[leadId] = [];
    }
    this.data.messages[leadId].push(message);
    this.save();
    return message;
  }

  // Campaigns
  public getCampaigns(): StoredCampaign[] {
    return this.data.campaigns;
  }

  public upsertCampaign(campaign: StoredCampaign): StoredCampaign {
    const idx = this.data.campaigns.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) {
      this.data.campaigns[idx] = campaign;
    } else {
      this.data.campaigns.unshift(campaign);
    }
    this.save();
    return campaign;
  }

  public toggleCampaign(id: string): StoredCampaign | null {
    const camp = this.data.campaigns.find((c) => c.id === id);
    if (camp) {
      camp.active = !camp.active;
      this.save();
      return camp;
    }
    return null;
  }

  public deleteCampaign(id: string): boolean {
    const initialLen = this.data.campaigns.length;
    this.data.campaigns = this.data.campaigns.filter((c) => c.id !== id);
    if (this.data.campaigns.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Webhook Logs
  public getWebhookLogs(): WebhookEventLog[] {
    return this.data.webhookLogs;
  }

  public addWebhookLog(log: WebhookEventLog) {
    this.data.webhookLogs.unshift(log);
    if (this.data.webhookLogs.length > 100) {
      this.data.webhookLogs.pop();
    }
    this.save();
  }
}

export const db = new JSONDatabase();
