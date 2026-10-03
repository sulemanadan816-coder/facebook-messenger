import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Phone,
  MapPin,
  DollarSign,
  Search,
  ExternalLink,
  MessageSquare,
  PackageCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types/commerce.ts';

interface OrdersManagerProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenCustomerChat: (customerName: string) => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onUpdateStatus,
  onOpenCustomerChat,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-blue-400" /> Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Processing
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <Truck className="w-3 h-3 text-emerald-400" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-400" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{orders.length}</div>
          <span className="text-[10px] text-blue-400">Via Facebook Messenger</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Gross Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-400/80">Delivered & Confirmed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Confirmed (COD)</span>
            <PackageCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">
            {orders.filter((o) => o.status === 'confirmed').length}
          </div>
          <span className="text-[10px] text-amber-400/80">Awaiting Dispatch</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Delivered Today</span>
            <Truck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-300">
            {orders.filter((o) => o.status === 'delivered').length}
          </div>
          <span className="text-[10px] text-teal-400/80">Completed Deliveries</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search order #, customer, address, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'processing', label: 'Processing' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 text-xs">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            No orders found matching this filter.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl transition-all space-y-4"
            >
              {/* Top row: Order Number, Customer, Date, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{order.orderNumber}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs font-semibold text-slate-200">{order.createdAt}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{order.customerName}</h3>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {getStatusBadge(order.status)}
                  <span className="text-base font-extrabold text-emerald-400">
                    ${order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100">{item.productTitle}</h4>
                      <p className="text-[11px] text-slate-400">
                        Size: <strong className="text-blue-400">{item.variantSize}</strong> • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      ${item.totalPrice}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Address & Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-300">Delivery Address:</span>
                  </div>
                  <p className="text-slate-300 pl-5 leading-relaxed">{order.shippingAddress}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-300">Contact & Payment:</span>
                  </div>
                  <p className="text-slate-300 pl-5">
                    Phone: <strong className="text-white">{order.customerPhone}</strong>
                  </p>
                  <p className="text-slate-400 pl-5 text-[11px]">
                    Method: <span className="text-blue-400 font-semibold">{order.paymentMethod}</span>
                  </p>
                </div>
              </div>

              {/* Actions & Status Changers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Update Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="pending_confirmation">Pending Confirmation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCustomerChat(order.customerName)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat with Customer</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
