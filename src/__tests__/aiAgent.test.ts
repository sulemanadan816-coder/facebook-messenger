import { describe, it, expect, beforeEach } from 'vitest';
import { executeServerTool } from '../lib/ai/tools.ts';
import { extractRequirements, matchProducts } from '../server/matchingEngine.ts';
import { db } from '../server/db.ts';

const mockContext = {
  businessId: 'biz_bed_crm',
  conversationId: 'conv_test_101',
  leadId: 'lead_test_101',
  customerPsid: 'psid_test_101',
  lastShownProductIds: ['prod_cloud_rest', 'prod_oak_frame'],
};

describe('BED Messenger CRM — Real AI Agent & Tools Test Suite', () => {
  // Test 1: Product Search
  it('1. should search products from real database by keyword', async () => {
    const res = await executeServerTool('search_products', { query: 'mattress' }, mockContext);
    expect(res.success).toBe(true);
    expect(res.data.products.length).toBeGreaterThan(0);
    expect(res.data.products[0].title).toContain('Mattress');
  });

  // Test 2: Price Filtering (under 80k / max price)
  it('2. should filter products strictly below maximum budget', async () => {
    const res = await executeServerTool('search_products', { maxPrice: 500 }, mockContext);
    expect(res.success).toBe(true);
    for (const p of res.data.products) {
      expect(p.currentPrice).toBeLessThanOrEqual(500);
    }
  });

  // Test 3: Size Filtering (King Size)
  it('3. should filter products by requested size variant (King)', async () => {
    const res = await executeServerTool('search_products', { size: 'King' }, mockContext);
    expect(res.success).toBe(true);
    expect(res.data.products.length).toBeGreaterThan(0);
    expect(res.data.products[0].requestedSize).toBe('King');
  });

  // Test 4: Color Filtering
  it('4. should filter products by requested color (Oak)', async () => {
    const res = await executeServerTool('search_products', { color: 'Oak' }, mockContext);
    expect(res.success).toBe(true);
    expect(res.data.products.length).toBeGreaterThan(0);
    expect(res.data.products[0].title).toContain('Oak');
  });

  // Test 5: Customer Information Extraction
  it('5. should extract and update customer details (Adan, phone, city, address)', async () => {
    const updateRes = await executeServerTool(
      'update_customer_information',
      {
        name: 'Adan',
        phone: '03001234567',
        city: 'Jhelum',
        address: 'Main Bazaar, Jhelum',
      },
      mockContext
    );
    expect(updateRes.success).toBe(true);
    expect(updateRes.data.updated.name).toBe('Adan');
    expect(updateRes.data.updated.phone).toBe('03001234567');
  });

  // Test 6: Conversation Context & Last Shown Products
  it('6. should resolve conversational references ("ye wala", "second wala") from context', async () => {
    const res = await executeServerTool(
      'get_conversation_context',
      { reference: 'ye wala' },
      mockContext
    );
    expect(res.success).toBe(true);
    expect(res.data.previouslyShownProducts.length).toBeGreaterThan(0);
    expect(res.data.previouslyShownProducts[0].title).toBe('Orthopedic Cloud Rest Mattress');
    expect(res.data.previouslyShownProducts[1].title).toBe('Nordic Solid Oak Platform Bed Frame');
  });

  // Test 7: Natural Roman Urdu Requirements Extraction
  it('7. should understand natural Roman Urdu phrasing: "bhai mujhe king size ka black bed chahiye"', () => {
    const extracted = extractRequirements('bhai mujhe king size ka black bed chahiye');
    expect(extracted.size).toBe('King');
    expect(extracted.category).toBe('Bed Frames');
  });

  // Test 8: Order Draft Creation
  it('8. should create an order draft with missing fields tracking', async () => {
    const res = await executeServerTool(
      'update_order_draft',
      {
        productId: 'prod_cloud_rest',
        size: 'King',
        color: 'White',
        quantity: 2,
        customerName: 'Adan',
        phone: '03001234567',
        // city and address intentionally missing
      },
      mockContext
    );
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('drafting');
    expect(res.data.missingFields).toContain('city');
    expect(res.data.missingFields).toContain('address');
    expect(res.data.readyForConfirmation).toBe(false);
  });

  // Test 9: Refuse Order Creation Without Required Fields
  it('9. should refuse to confirm order when customer information is incomplete', async () => {
    const confirmRes = await executeServerTool(
      'confirm_order',
      { explicitCustomerConfirmation: 'haan order kar do' },
      mockContext
    );
    expect(confirmRes.success).toBe(false);
    expect(confirmRes.error).toContain('Missing required details');
  });

  // Test 10: Complete Order Draft & Require Explicit Confirmation
  it('10. should create and confirm order ONLY after complete details and explicit confirmation', async () => {
    // Fill remaining missing details
    await executeServerTool(
      'update_order_draft',
      {
        city: 'Jhelum',
        address: 'Main Bazaar near Clock Tower',
      },
      mockContext
    );

    const draftRes = await executeServerTool('get_order_draft', {}, mockContext);
    expect(draftRes.data.missingFields.length).toBe(0);
    expect(draftRes.data.status).toBe('awaiting_confirmation');

    // Confirm explicitly
    const finalRes = await executeServerTool(
      'confirm_order',
      { explicitCustomerConfirmation: 'haan confirm kar do, order book kardo' },
      mockContext
    );

    expect(finalRes.success).toBe(true);
    expect(finalRes.data.status).toBe('confirmed');
    expect(finalRes.data.orderNumber).toContain('BED-');
  });

  // Test 11: Idempotency & Duplicate Order Protection
  it('11. should prevent duplicate order creation on repeated confirmation triggers', async () => {
    const repeatRes = await executeServerTool(
      'confirm_order',
      { explicitCustomerConfirmation: 'haan confirm kar do' },
      mockContext
    );

    // Draft was already cleared on previous confirmation, preventing duplicate creation
    expect(repeatRes.success).toBe(false);
    expect(repeatRes.error).toContain('No pending order draft exists');
  });

  // Test 12: Order Cancellation
  it('12. should cleanly cancel an active order draft on user request', async () => {
    await executeServerTool('update_order_draft', { productId: 'prod_cloud_rest' }, mockContext);
    const cancelRes = await executeServerTool('cancel_order', { reason: 'Changed my mind' }, mockContext);
    expect(cancelRes.success).toBe(true);

    const draftCheck = await executeServerTool('get_order_draft', {}, mockContext);
    expect(draftCheck.success).toBe(false);
  });

  // Test 13: Human Handoff Trigger
  it('13. should trigger human handoff when customer asks for a live agent', async () => {
    const handoffRes = await executeServerTool('handoff_to_human', { reason: 'human se baat karni hai' }, mockContext);
    expect(handoffRes.success).toBe(true);
    expect(handoffRes.data.handoffInitiated).toBe(true);
  });

  // Test 14: Delivery Policy Verification
  it('14. should provide verified delivery information and COD terms', async () => {
    const delRes = await executeServerTool('get_delivery_information', { city: 'Lahore' }, mockContext);
    expect(delRes.success).toBe(true);
    expect(delRes.data.cashOnDeliveryAvailable).toBe(true);
    expect(delRes.data.coverage).toContain('Lahore');
  });

  // Test 15: Payment Options Verification
  it('15. should return verified payment methods (COD, Bank Transfer, JazzCash)', async () => {
    const payRes = await executeServerTool('get_payment_information', {}, mockContext);
    expect(payRes.success).toBe(true);
    expect(payRes.data.acceptedMethods.some((m: string) => m.includes('Cash on Delivery'))).toBe(true);
  });

  // Test 16: Live Stock Validation
  it('16. should validate live stock and reject orders exceeding available inventory', async () => {
    const prod = db.getProducts()[0];
    const availableStock = prod.variants[0].stock;

    await executeServerTool(
      'update_order_draft',
      {
        productId: prod.id,
        size: prod.variants[0].size,
        quantity: availableStock + 50, // exceeds inventory
        customerName: 'Adan',
        phone: '03001234567',
        city: 'Jhelum',
        address: 'Main Bazaar',
      },
      mockContext
    );

    const confirmStockRes = await executeServerTool(
      'confirm_order',
      { explicitCustomerConfirmation: 'yes confirm' },
      mockContext
    );

    expect(confirmStockRes.success).toBe(false);
    expect(confirmStockRes.error).toContain('LIVE STOCK CHECK FAILED');
  });
});
