import React, { useState } from 'react';
import {
  Bed,
  Plus,
  Star,
  Check,
  Tag,
  DollarSign,
  Layers,
  Send,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Product, ProductVariant } from '../types/commerce.ts';

interface ProductCatalogProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onSendProductToChat: (product: Product, variant: ProductVariant) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onAddProduct,
  onSendProductToChat,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Product['category']>('Mattresses');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(399);
  const [imageUrl, setImageUrl] = useState('');

  const categories = ['All', 'Mattresses', 'Bed Frames', 'Pillows & Linen', 'Bundles'];

  const filteredProducts = products.filter(
    (p) => categoryFilter === 'All' || p.category === categoryFilter
  );

  const getSelectedVariant = (prod: Product): ProductVariant => {
    const varId = selectedVariants[prod.id];
    return prod.variants.find((v) => v.id === varId) || prod.variants[0];
  };

  const handleSelectVariant = (prodId: string, varId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [prodId]: varId }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProd: Product = {
      id: 'prod_' + Date.now(),
      title,
      category,
      description,
      features: ['Orthopedic Spine Support', 'Hypoallergenic', '10-Year Warranty'],
      basePrice: Number(basePrice),
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 1,
      variants: [
        { id: 'var_' + Date.now() + '_1', size: 'Single', price: Number(basePrice), stock: 10, available: true, sku: 'SKU-SIN' },
        { id: 'var_' + Date.now() + '_2', size: 'Double', price: Number(basePrice) + 100, stock: 10, available: true, sku: 'SKU-DBL' },
        { id: 'var_' + Date.now() + '_3', size: 'Queen', price: Number(basePrice) + 180, stock: 15, available: true, sku: 'SKU-QEN' },
        { id: 'var_' + Date.now() + '_4', size: 'King', price: Number(basePrice) + 260, stock: 8, available: true, sku: 'SKU-KNG' },
      ],
    };

    onAddProduct(newProd);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Bed & Mattress Product Catalog</h2>
            <p className="text-xs text-slate-400">
              The AI conversational engine uses this live catalog to extract sizes, recommend products, and calculate discounts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => {
          const currentVariant = getSelectedVariant(prod);

          return (
            <div
              key={prod.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-200 group"
            >
              <div>
                {/* Product Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-slate-950/80 backdrop-blur-md text-[10px] text-slate-200 font-bold px-2.5 py-1 rounded-full border border-slate-800">
                      {prod.category}
                    </span>
                    {prod.isPopular && (
                      <span className="bg-amber-500/90 text-[10px] text-white font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Best Seller
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 border border-slate-800 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{prod.rating}</span>
                    <span className="text-slate-500 text-[10px]">({prod.reviewsCount})</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                      {prod.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  {/* Size Variants Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Select Size Variant:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVariant(prod.id, v.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            currentVariant.id === v.id
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions & Stock */}
                  {currentVariant.dimensions && (
                    <p className="text-[11px] text-slate-400">
                      Dimensions: <strong className="text-slate-300">{currentVariant.dimensions}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Price & Send to Chat Action */}
              <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Variant Price</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-emerald-400">
                      ${currentVariant.price}
                    </span>
                    {currentVariant.compareAtPrice && (
                      <span className="text-xs text-slate-500 line-through">
                        ${currentVariant.compareAtPrice}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSendProductToChat(prod, currentVariant)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send in Chat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Add New Product to Catalog</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Latex Hybrid Bed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Mattresses">Mattresses</option>
                    <option value="Bed Frames">Bed Frames</option>
                    <option value="Pillows & Linen">Pillows & Linen</option>
                    <option value="Bundles">Bundles</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comfort details, spinal alignment, cooling layers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
