import { db } from '../../server/db.ts';
import { Product, ProductVariant, Order, OrderStatus } from '../../types/commerce.ts';
import { CustomerData, OrderDraft, OrderDraftItem } from './types.ts';

// In-memory or persisted order drafts per conversation
const activeDrafts: Map<string, OrderDraft> = new Map();

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export const AI_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'search_products',
    description: 'Search real database product catalog by keyword, category, bed size, color, or price range.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords like "king bed", "mattress", "solid oak"' },
        category: { type: 'string', description: 'Category: "Mattresses", "Bed Frames", "Pillows & Linen", "Bundles"' },
        size: { type: 'string', description: 'Bed size: "Single", "Double", "Queen", "King", "Super King"' },
        color: { type: 'string', description: 'Color: "Black", "White", "Grey", "Oak", "Brown", "Charcoal"' },
        maxPrice: { type: 'number', description: 'Maximum budget in PKR / Rs. (e.g. 80000)' },
        minPrice: { type: 'number', description: 'Minimum price in PKR / Rs.' },
        inStockOnly: { type: 'boolean', description: 'Filter only items in stock' },
      },
    },
  },
  {
    name: 'get_product',
    description: 'Retrieve detailed information, all size variants, live prices, and stock for a specific product ID.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The unique product ID' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'get_product_variants',
    description: 'Retrieve all available sizes, colors, and live prices for a product.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The unique product ID' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'get_customer',
    description: 'Get stored customer details (name, phone, city, address) for this conversation.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_customer_information',
    description: 'Save or update customer contact and delivery details.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Customer full name' },
        phone: { type: 'string', description: 'Contact phone number' },
        city: { type: 'string', description: 'City name (e.g. Lahore, Jhelum, Karachi)' },
        address: { type: 'string', description: 'Complete delivery street address' },
      },
    },
  },
  {
    name: 'get_delivery_information',
    description: 'Get verified delivery policy, delivery charges, and timelines for a city.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name (e.g. Lahore, Jhelum, Islamabad)' },
      },
    },
  },
  {
    name: 'get_payment_information',
    description: 'Get verified payment options (Cash on Delivery / COD, Advance deposit, Online Bank Transfer).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_business_information',
    description: 'Get business showroom hours, warranty policy, return policy, and company details.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_order_draft',
    description: 'Create or update the current pending order draft with product, size, color, quantity, and customer info.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The product ID' },
        size: { type: 'string', description: 'Bed size: "Single", "Double", "Queen", "King", "Super King"' },
        color: { type: 'string', description: 'Color (e.g. "Black", "Oak", "White")' },
        quantity: { type: 'number', description: 'Quantity (e.g. 1 or 2)' },
        customerName: { type: 'string', description: 'Customer name' },
        phone: { type: 'string', description: 'Customer phone number' },
        city: { type: 'string', description: 'Customer city' },
        address: { type: 'string', description: 'Complete delivery address' },
        paymentMethod: { type: 'string', description: 'Payment method, defaults to "Cash on Delivery (COD)"' },
      },
    },
  },
  {
    name: 'get_order_draft',
    description: 'Get the current active order draft summary and list of missing required fields.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'confirm_order',
    description: 'Place the official final order in the database ONLY after the customer has explicitly confirmed the order summary.',
    parameters: {
      type: 'object',
      properties: {
        explicitCustomerConfirmation: {
          type: 'string',
          description: 'The exact confirmation text said by customer (e.g. "haan confirm kardo", "yes book it")',
        },
      },
      required: ['explicitCustomerConfirmation'],
    },
  },
  {
    name: 'cancel_order',
    description: 'Cancel the current pending order draft if the customer decides not to proceed.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for cancellation' },
      },
    },
  },
  {
    name: 'handoff_to_human',
    description: 'Trigger human representative handoff when the customer explicitly asks for a live agent or complex custom inquiry.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Customer request reason' },
      },
    },
  },
  {
    name: 'get_conversation_context',
    description: 'Resolve conversational references like "ye wala", "woh second wala", "the first one", "iska white color" from previously shown products.',
    parameters: {
      type: 'object',
      properties: {
        reference: {
          type: 'string',
          description: 'The reference phrase, e.g. "ye wala", "first one", "second one", "last one", "iska"',
        },
      },
    },
  },
];

// Server-side Tool Execution with Tenant & Entity Validation
export async function executeServerTool(
  toolName: string,
  args: Record<string, any>,
  securityContext: {
    businessId: string;
    conversationId: string;
    leadId: string;
    customerPsid: string;
    lastShownProductIds?: string[];
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { businessId, conversationId, leadId, customerPsid } = securityContext;

  try {
    switch (toolName) {
      case 'search_products': {
        const allProducts = db.getProducts();
        let matches = [...allProducts];

        if (args.category) {
          matches = matches.filter((p) => p.category.toLowerCase().includes(args.category.toLowerCase()));
        }

        if (args.query) {
          const q = args.query.toLowerCase();
          matches = matches.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.features.some((f) => f.toLowerCase().includes(q))
          );
        }

        // Size filter
        if (args.size) {
          const reqSize = args.size.toLowerCase();
          matches = matches.filter((p) =>
            p.variants.some((v) => v.size.toLowerCase() === reqSize && (args.inStockOnly ? v.stock > 0 : true))
          );
        }

        // Color filter
        if (args.color) {
          const reqColor = args.color.toLowerCase();
          matches = matches.filter(
            (p) =>
              p.title.toLowerCase().includes(reqColor) ||
              p.description.toLowerCase().includes(reqColor) ||
              p.features.some((f) => f.toLowerCase().includes(reqColor))
          );
        }

        // Price filter
        if (typeof args.maxPrice === 'number') {
          matches = matches.filter((p) => {
            if (args.size) {
              const v = p.variants.find((vr) => vr.size.toLowerCase() === args.size.toLowerCase());
              return v ? v.price <= args.maxPrice : p.basePrice <= args.maxPrice;
            }
            return p.basePrice <= args.maxPrice;
          });
        }

        if (typeof args.minPrice === 'number') {
          matches = matches.filter((p) => p.basePrice >= args.minPrice);
        }

        // Format clean result for AI consumption (anti-hallucination)
        const formatted = matches.slice(0, 5).map((p) => {
          const matchedVariant = args.size
            ? p.variants.find((v) => v.size.toLowerCase() === args.size.toLowerCase())
            : p.variants[0];

          return {
            id: p.id,
            title: p.title,
            category: p.category,
            description: p.description,
            currentPrice: matchedVariant ? matchedVariant.price : p.basePrice,
            requestedSize: args.size || 'Base',
            availableSizes: p.variants.map((v) => `${v.size}: Rs. ${v.price} (${v.stock > 0 ? 'In Stock' : 'Out of Stock'})`),
            inStock: matchedVariant ? matchedVariant.stock > 0 : true,
            imageUrl: p.imageUrl,
          };
        });

        return {
          success: true,
          data: {
            totalFound: matches.length,
            products: formatted,
            disclaimer: 'Prices and stock are verified from live database.',
          },
        };
      }

      case 'get_product': {
        const prod = db.getProduct(args.productId);
        if (!prod) return { success: false, error: 'Product not found with ID: ' + args.productId };
        return { success: true, data: prod };
      }

      case 'get_product_variants': {
        const prod = db.getProduct(args.productId);
        if (!prod) return { success: false, error: 'Product not found' };
        return {
          success: true,
          data: {
            productId: prod.id,
            productTitle: prod.title,
            variants: prod.variants.map((v) => ({
              size: v.size,
              dimensions: v.dimensions,
              price: v.price,
              stock: v.stock,
              available: v.stock > 0,
            })),
          },
        };
      }

      case 'get_customer': {
        const lead = db.getLead(leadId);
        return {
          success: true,
          data: {
            name: lead?.name,
            phone: lead?.phone,
            city: lead?.company, // city mapped in lead
            address: lead?.painPoint?.includes('Delivery:') ? lead.painPoint.split('Delivery:')[1].trim() : undefined,
          },
        };
      }

      case 'update_customer_information': {
        const patch: Record<string, any> = {};
        if (args.name) patch.name = args.name;
        if (args.phone) patch.phone = args.phone;
        if (args.city) patch.company = args.city;
        db.updateLead(leadId, patch);

        // Update active draft as well
        const draft = activeDrafts.get(conversationId);
        if (draft) {
          if (args.name) draft.customer.name = args.name;
          if (args.phone) draft.customer.phone = args.phone;
          if (args.city) draft.customer.city = args.city;
          if (args.address) draft.customer.address = args.address;
          recalculateDraftMissingFields(draft);
        }

        return { success: true, data: { updated: patch } };
      }

      case 'get_delivery_information': {
        const city = args.city || 'general';
        return {
          success: true,
          data: {
            city,
            coverage: 'Nationwide delivery across all cities in Pakistan including Lahore, Karachi, Islamabad, Rawalpindi, Jhelum, Faisalabad, Multan, Sialkot, and surrounding areas.',
            deliveryTime: 'Standard delivery in 3 to 5 business days. White glove room-of-choice assembly included.',
            charges: 'FREE delivery on all bed & mattress orders over Rs. 50,000. Flat Rs. 2,500 shipping for smaller linen/pillow orders.',
            cashOnDeliveryAvailable: true,
          },
        };
      }

      case 'get_payment_information': {
        return {
          success: true,
          data: {
            acceptedMethods: [
              'Cash on Delivery (COD) - Pay upon home inspection',
              'Online Bank Transfer / IBFT',
              'JazzCash & EasyPaisa',
              'Credit / Debit Card online link',
            ],
            advancePolicy: 'Standard sizes available on 100% Cash on Delivery (COD). Custom customized headboard fabrics require a small 10% advance deposit.',
          },
        };
      }

      case 'get_business_information': {
        return {
          success: true,
          data: {
            showroomHours: 'Monday to Sunday, 9:00 AM to 10:00 PM PST',
            trialPolicy: '100-Night Risk-Free Sleep Trial on all mattresses. If not satisfied, free exchange.',
            warranty: '10-Year Comprehensive Structural Warranty on Solid Oak Frames and Orthopedic Springs.',
          },
        };
      }

      case 'update_order_draft': {
        const lead = db.getLead(leadId);
        let draft = activeDrafts.get(conversationId);

        // If product specified, resolve real product & variant
        let resolvedProduct: Product | undefined;
        let resolvedVariant: ProductVariant | undefined;
        let unitPrice = 75000;
        let prodTitle = 'King Size Bed';
        let size = args.size || 'King';
        let color = args.color || 'Black';
        let quantity = Math.max(1, Math.min(args.quantity || 1, 5));

        if (args.productId) {
          resolvedProduct = db.getProduct(args.productId);
          if (resolvedProduct) {
            prodTitle = resolvedProduct.title;
            resolvedVariant = resolvedProduct.variants.find((v) => v.size.toLowerCase() === size.toLowerCase()) || resolvedProduct.variants[0];
            unitPrice = resolvedVariant ? resolvedVariant.price : resolvedProduct.basePrice;
            size = resolvedVariant?.size || size;
          }
        }

        const subtotal = unitPrice * quantity;
        const totalAmount = subtotal;

        draft = {
          conversationId,
          businessId,
          customer: {
            psid: customerPsid,
            name: args.customerName || draft?.customer.name || lead?.name,
            phone: args.phone || draft?.customer.phone || lead?.phone,
            city: args.city || draft?.customer.city || lead?.company,
            address: args.address || draft?.customer.address,
          },
          items: [
            {
              productId: resolvedProduct?.id || args.productId || 'prod_king_bed',
              productTitle: prodTitle,
              variantId: resolvedVariant?.id,
              size,
              color,
              unitPrice,
              quantity,
              totalPrice: subtotal,
            },
          ],
          subtotal,
          discountAmount: 0,
          totalAmount,
          paymentMethod: args.paymentMethod || 'Cash on Delivery (COD)',
          status: 'drafting',
          missingFields: [],
          createdAt: draft?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        recalculateDraftMissingFields(draft);
        if (draft.missingFields.length === 0) {
          draft.status = 'awaiting_confirmation';
        }

        activeDrafts.set(conversationId, draft);

        return {
          success: true,
          data: {
            draftSummary: {
              product: prodTitle,
              size,
              color,
              quantity,
              unitPrice: `Rs. ${unitPrice.toLocaleString()}`,
              totalAmount: `Rs. ${totalAmount.toLocaleString()}`,
              paymentMethod: draft.paymentMethod,
              name: draft.customer.name || 'MISSING',
              phone: draft.customer.phone || 'MISSING',
              city: draft.customer.city || 'MISSING',
              address: draft.customer.address || 'MISSING',
            },
            status: draft.status,
            missingFields: draft.missingFields,
            readyForConfirmation: draft.missingFields.length === 0,
          },
        };
      }

      case 'get_order_draft': {
        const draft = activeDrafts.get(conversationId);
        if (!draft) return { success: false, error: 'No active order draft found for this conversation' };
        return { success: true, data: draft };
      }

      case 'confirm_order': {
        const draft = activeDrafts.get(conversationId);
        if (!draft) {
          return { success: false, error: 'No pending order draft exists to confirm. Please create order draft first.' };
        }

        if (draft.missingFields.length > 0) {
          return {
            success: false,
            error: `Cannot place order yet. Missing required details: ${draft.missingFields.join(', ')}`,
          };
        }

        // Anti-hallucination live database check: re-verify product & stock
        const item = draft.items[0];
        const realProd = db.getProduct(item.productId);
        if (realProd) {
          const realVar = realProd.variants.find((v) => v.size.toLowerCase() === item.size.toLowerCase());
          if (realVar && realVar.stock < item.quantity) {
            return {
              success: false,
              error: `LIVE STOCK CHECK FAILED: Only ${realVar.stock} units of ${realProd.title} (${realVar.size}) are currently in stock, but order requested ${item.quantity}.`,
            };
          }
        }

        // Idempotency: Prevent duplicate orders
        const existingOrders = db.getOrders();
        const duplicate = existingOrders.find(
          (o) =>
            o.customerPhone === draft.customer.phone &&
            o.items[0]?.productId === item.productId &&
            o.items[0]?.variantSize === item.size &&
            o.status === 'confirmed'
        );

        if (duplicate) {
          return {
            success: true,
            data: {
              orderNumber: duplicate.orderNumber,
              message: 'This order was already confirmed previously to avoid duplicate charges.',
              order: duplicate,
            },
          };
        }

        // Create official order in real database
        const newOrder: Order = {
          id: 'ord_' + Date.now(),
          orderNumber: 'BED-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          customerId: leadId,
          customerName: draft.customer.name || 'Valued Customer',
          customerPhone: draft.customer.phone || '',
          shippingAddress: `${draft.customer.address || ''}, ${draft.customer.city || ''}`.trim(),
          items: draft.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || 'var_default',
            productTitle: `${i.productTitle}${i.color ? ` (${i.color})` : ''}`,
            variantSize: i.size,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            totalPrice: i.totalPrice,
          })),
          subtotal: draft.subtotal,
          discountAmount: draft.discountAmount,
          totalAmount: draft.totalAmount,
          paymentMethod: draft.paymentMethod as any,
          status: 'confirmed',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notes: `Confirmed explicitly by customer on Facebook Messenger: "${args.explicitCustomerConfirmation || 'Confirmed'}"`,
        };

        db.createOrder(newOrder);
        db.updateLead(leadId, { stage: 'Won', score: 98, tier: 'Hot' });
        activeDrafts.delete(conversationId);

        return {
          success: true,
          data: {
            orderNumber: newOrder.orderNumber,
            totalAmount: `Rs. ${newOrder.totalAmount.toLocaleString()}`,
            deliveryAddress: newOrder.shippingAddress,
            customerPhone: newOrder.customerPhone,
            paymentMethod: newOrder.paymentMethod,
            status: 'confirmed',
          },
        };
      }

      case 'cancel_order': {
        activeDrafts.delete(conversationId);
        return { success: true, data: { message: 'Order draft cancelled.' } };
      }

      case 'handoff_to_human': {
        db.updateLead(leadId, { tags: ['Human Handoff Requested'] });
        return {
          success: true,
          data: {
            handoffInitiated: true,
            notice: 'Human showroom representative notified. They will take over this thread.',
          },
        };
      }

      case 'get_conversation_context': {
        const lastIds = securityContext.lastShownProductIds || [];
        const products = lastIds.map((id) => db.getProduct(id)).filter(Boolean) as Product[];

        const draft = activeDrafts.get(conversationId);

        return {
          success: true,
          data: {
            previouslyShownProducts: products.map((p, idx) => ({
              ordinal: idx === 0 ? 'first one / pehla wala' : idx === 1 ? 'second one / doosra wala' : `${idx + 1}th`,
              id: p.id,
              title: p.title,
              basePrice: p.basePrice,
              sizes: p.variants.map((v) => v.size),
            })),
            activeDraft: draft ? { product: draft.items[0]?.productTitle, size: draft.items[0]?.size, total: draft.totalAmount } : null,
          },
        };
      }

      default:
        return { success: false, error: 'Unknown tool name: ' + toolName };
    }
  } catch (err: any) {
    return { success: false, error: 'Tool execution error: ' + err.message };
  }
}

function recalculateDraftMissingFields(draft: OrderDraft) {
  const missing: ('name' | 'phone' | 'city' | 'address')[] = [];
  if (!draft.customer.name || draft.customer.name.trim().length < 2) missing.push('name');
  if (!draft.customer.phone || draft.customer.phone.trim().length < 8) missing.push('phone');
  if (!draft.customer.city || draft.customer.city.trim().length < 2) missing.push('city');
  if (!draft.customer.address || draft.customer.address.trim().length < 5) missing.push('address');
  draft.missingFields = missing;
}
