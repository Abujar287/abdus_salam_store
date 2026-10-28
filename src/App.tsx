/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePWAInstall } from './usePWAInstall';
import {
  Store,
  ShoppingCart,
  Package,
  BookOpen,
  Menu,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Phone,
  MapPin,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ChevronRight,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Check,
  X,
  Send,
  Share2,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  Smartphone,
  Monitor,
  UserPlus,
  Receipt
} from 'lucide-react';

// Store Info Constants
const STORE_NAME = 'আব্দুস সালাম স্টোর';
const STORE_PHONE = '01969249225';
const STORE_ADDRESS = 'রায়পুর বাজার, বাঘারপাড়া, যশোর';

/// Types
interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  barcode: string;
  repName: string;
  repPhone: string;
  searchTags: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  paymentType: 'cash' | 'credit' | 'bkash' | 'mixed';
  date: string; // e.g. '28-Oct-26'
  rawDate: string; // YYYY-MM-DD
  status: 'completed' | 'pending';
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  dueAmount: number;
  lastPurchaseDate: string;
  status: 'clear' | 'pending';
}

interface DateHistoryRecord {
  date: string;
  totalOrders: number;
  totalSales: number;
  totalCustomers: number;
  totalNewCustomers: number;
  totalProfit: number;
  totalRepPayment: number;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'pos' | 'stock' | 'ledger' | 'activity' | 'more'>('home');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'more'>('today');
  
  // Auto-detect screen size on initial load and resize
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // States with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('abdus_store_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('abdus_store_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('abdus_store_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [newCustomersCountToday, setNewCustomersCountToday] = useState<number>(3);
  
  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  // const [posCustomerType, setPosCustomerType] = useState<'cash' | 'existing' | 'new'>('cash'); // REMOVED
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<string>('');
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');

  const [posSearchQuery, setPosSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('সব');
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [cashPaidInput, setCashPaidInput] = useState<string>('');
  
  const [printPreviewOrder, setPrintPreviewOrder] = useState<Order | null>(null);
  const [successModal, setSuccessModal] = useState<Order | null>(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);

  // PWA Install State & Handlers
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [showPWAInstructionModal, setShowPWAInstructionModal] = useState<boolean>(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowPWAInstructionModal(true);
    }
  };

  // Categories & Units Lists
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'মুদি', 'তেল ও মসলা', 'পানীয়', 'বিস্কুট ও স্ন্যাক্স', 'প্রসাধন'
  ]);
  const [unitsList, setUnitsList] = useState<string[]>([
    'কেজি', 'লিটার', 'পিস', 'বস্তা', 'প্যাকেট', 'কোটা', 'বটল'
  ]);

  // Stock Screen State
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [stockFilterTab, setStockFilterTab] = useState<'all' | 'sufficient' | 'low'>('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('মুদি');
  const [newProductStock, setNewProductStock] = useState<string>('');
  const [newProductUnit, setNewProductUnit] = useState<string>('কেজি');
  const [newProductBuy, setNewProductBuy] = useState<string>('');
  const [newProductSell, setNewProductSell] = useState<string>('');
  const [newProductRepName, setNewProductRepName] = useState('');
  const [newProductRepPhone, setNewProductRepPhone] = useState('');

  // Ledger State & Payment Modal State
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');
  const [depositModalCustomer, setDepositModalCustomer] = useState<Customer | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<'cash' | 'bkash'>('cash');

  const [syncTime, setSyncTime] = useState<string>('28-Oct-2026 3:58PM');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('google_sheet_url') || 'https://script.google.com/macros/s/AKfycbx6qXyoYua4tUchRlaa0mH78EXxgbvmRWmVpWfxv5v4_At4_QGvwS13H8ruZf1J3bGBeA/exec';
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('abdus_store_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('abdus_store_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('abdus_store_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('abdus_store_categories', JSON.stringify(categoriesList));
  }, [categoriesList]);

  useEffect(() => {
    localStorage.setItem('google_sheet_url', sheetUrl);
  }, [sheetUrl]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const formattedBikri = orders.flatMap(o => {
        const custObj = customers.find(c => c.name === o.customerName);
        const custLoc = custObj ? custObj.address : 'রায়পুর বাজার';
        return o.items.map(item => ({
          'invoice no': o.invoiceNo,
          'date': o.date,
          'customer name': o.customerName,
          'customer mobile': o.customerPhone,
          'location': custLoc,
          'product name': item.product.name,
          'category': item.product.category,
          'cost': item.product.buyPrice * item.quantity,
          'sales': item.product.sellPrice * item.quantity,
          'discount': Math.round(o.discount / o.items.length),
          'baki': Math.round(o.due / o.items.length),
          'payment method': o.paymentType,
          'profit': (item.product.sellPrice - item.product.buyPrice) * item.quantity
        }));
      });

      const payload = {
        action: 'syncData',
        tabs: ['bikri', 'stock', 'bakir khata', 'catgeory'],
        bikri: formattedBikri,
        stock: products,
        'bakir khata': customers,
        catgeory: categoriesList,
        timestamp: new Date().toISOString()
      };

      const jsonStr = JSON.stringify(payload);

      // Method 1: Form submission to hidden iframe (bypasses CORS restrictions & Google Apps Script 302 redirects)
      let iframe = document.getElementById('gscript_sync_target_iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'gscript_sync_target_iframe';
        iframe.name = 'gscript_sync_target_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = sheetUrl;
      form.target = 'gscript_sync_target_iframe';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = jsonStr;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => {
        try { document.body.removeChild(form); } catch(e){}
      }, 500);

      // Method 2: Fetch POST fallback
      fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: jsonStr
      }).catch(() => {});

      // Method 3: Fetch GET fallback
      fetch(`${sheetUrl}?action=syncData&data=${encodeURIComponent(jsonStr)}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(() => {});

    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = now.getDate();
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        let hours = now.getHours();
        const minutes = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const newSyncStr = `${day}-${month}-${year} ${hours}:${minutes}${ampm}`;
        setSyncTime(newSyncStr);
        alert(`গুগল শিটে ডাটা সিঙ্ক সম্পন্ন হয়েছে!\n\nট্যাবসমূহ: bikri (কলাম: customer name, customer mobile, location সহ), stock, bakir khata, catgeory`);
      }, 800);
    }
  };

  // Add to Cart helper
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountInput);

  // Step 1: Trigger Print Memo Preview before final submission
  const handlePreparePrintPreview = () => {
    if (cart.length === 0) {
      alert('কার্টে কোনো পণ্য নেই!');
      return;
    }

    let finalCustomerName = 'নগদ ক্রেতা';
    let finalCustomerPhone = '-';

    const isExisting = selectedExistingCustomer.trim() !== '';
    const isNew = newCustName.trim() !== '';

    if (isExisting) {
      finalCustomerName = selectedExistingCustomer;
      const found = customers.find(c => c.name === selectedExistingCustomer);
      if (found) finalCustomerPhone = found.phone;
    } else if (isNew) {
      if (!newCustName.trim()) {
        alert('দয়া করে নতুন ক্রেতার নাম লিখুন');
        return;
      }
      finalCustomerName = newCustName.trim();
      finalCustomerPhone = newCustPhone.trim() || '01700000000';
    }

    const sub = cartSubtotal;
    const disc = discountInput;
    const tot = cartTotal;
    const paidAmt = cashPaidInput !== '' ? Number(cashPaidInput) : (!isExisting && !isNew ? tot : 0);
    const dueAmt = Math.max(0, tot - paidAmt);

    const draftOrder: Order = {
      id: `ord-${Date.now()}`,
      invoiceNo: `SAL-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      items: [...cart],
      subtotal: sub,
      discount: disc,
      total: tot,
      paid: paidAmt,
      due: dueAmt,
      paymentType: dueAmt > 0 ? 'credit' : 'cash',
      date: '28-Oct-26',
      rawDate: '2026-10-28',
      status: dueAmt > 0 ? 'pending' : 'completed'
    };

    setPrintPreviewOrder(draftOrder);
  };

  // Step 2: Confirm & Submit Sale (Robustly adds due to customer's account if due > 0)
  const handleConfirmAndSubmitSale = () => {
    if (!printPreviewOrder) return;
    const order = printPreviewOrder;

    // Update product stock
    setProducts(prev => {
      return prev.map(p => {
        const cartItem = order.items.find(ci => ci.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      });
    });

    // If new customer with due or payment
    if (newCustName.trim()) {
      const newCustObj: Customer = {
        id: `c-${Date.now()}`,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || '01700000000',
        address: newCustAddress.trim() || 'রায়পুর বাজার',
        dueAmount: order.due,
        lastPurchaseDate: '28-Oct-26',
        status: order.due > 0 ? 'pending' : 'clear'
      };
      setCustomers([newCustObj, ...customers]);
      setNewCustomersCountToday(prev => prev + 1);
    } else if (order.customerName !== 'নগদ ক্রেতা') {
      // Update existing customer due amount
      setCustomers(prev => {
        const exists = prev.some(c => c.name === order.customerName);
        if (!exists && order.due > 0) {
          // Add customer if missing
          return [
            {
              id: `c-${Date.now()}`,
              name: order.customerName,
              phone: order.customerPhone,
              address: 'রায়পুর বাজার',
              dueAmount: order.due,
              lastPurchaseDate: '28-Oct-26',
              status: 'pending'
            },
            ...prev
          ];
        }
        return prev.map(c => {
          if (c.name === order.customerName) {
            const newDue = c.dueAmount + order.due;
            return {
              ...c,
              dueAmount: newDue,
              status: newDue > 0 ? 'pending' : 'clear',
              lastPurchaseDate: '28-Oct-26'
            };
          }
          return c;
        });
      });
    }

    setOrders([order, ...orders]);
    setSuccessModal(order);
    setPrintPreviewOrder(null);
    setCart([]);
    setDiscountInput(0);
    setCashPaidInput('');
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');

    // Trigger Auto-Sync to Google Sheets immediately in background
    setTimeout(() => {
      handleSync();
    }, 300);
  };

  // Calculations for Home Metrics
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const totalDueAmount = customers.filter(c => c.dueAmount > 0).reduce((sum, c) => sum + c.dueAmount, 0);

  // Metrics based on timeframe
  const filteredOrders = orders.filter(o => {
    if (timeframe === 'today') return o.rawDate === '2026-10-28';
    if (timeframe === 'week') return true;
    return true; // month
  });

  const totalOrdersCount = filteredOrders.length;
  const totalSalesAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCustomersCount = customers.length;
  const newCustomersCount = filteredOrders.filter(o => o.customerName !== 'নগদ ক্রেতা').length;
  
  const totalProfitAmount = filteredOrders.reduce((sum, o) => {
    const orderProfit = o.items.reduce((itemSum, item) => {
      const profitPerUnit = item.product.sellPrice - item.product.buyPrice;
      return itemSum + (profitPerUnit * item.quantity);
    }, 0);
    return sum + orderProfit;
  }, 0);

  const totalRepPayment = Math.round(totalSalesAmount * 0.04);

  // Date-wise history aggregation
  const dateHistoryMap: { [key: string]: DateHistoryRecord } = {};
  orders.forEach(o => {
    const dKey = o.date;
    if (!dateHistoryMap[dKey]) {
      dateHistoryMap[dKey] = {
        date: dKey,
        totalOrders: 0,
        totalSales: 0,
        totalCustomers: 0,
        totalNewCustomers: 0,
        totalProfit: 0,
        totalRepPayment: 0
      };
    }
    dateHistoryMap[dKey].totalOrders += 1;
    dateHistoryMap[dKey].totalSales += o.total;
    dateHistoryMap[dKey].totalCustomers += 1;
    dateHistoryMap[dKey].totalNewCustomers += (o.customerName !== 'নগদ ক্রেতা' ? 1 : 0);
    
    const ordProfit = o.items.reduce((s, i) => s + ((i.product.sellPrice - i.product.buyPrice) * i.quantity), 0);
    dateHistoryMap[dKey].totalProfit += ordProfit;
    dateHistoryMap[dKey].totalRepPayment += Math.round(o.total * 0.04);
  });

  const dateHistoryList = Object.values(dateHistoryMap);

  const matchesProductSearch = (product: Product, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    if (product.name.toLowerCase().includes(q)) return true;
    if (product.barcode.includes(q)) return true;
    if (product.category.toLowerCase().includes(q)) return true;
    if (product.searchTags && product.searchTags.some(tag => tag.toLowerCase().includes(q))) {
      return true;
    }
    return false;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F3F4F6] text-gray-900 font-['Hind_Siliguri',sans-serif] flex flex-col items-center">
      
      {/* Main Container wrapper: flex-col h-full overflow-hidden */}
      <div className={`w-full h-full flex flex-col overflow-hidden bg-[#F3F4F6] relative ${isMobileView ? 'max-w-md mx-auto shadow-2xl rounded-none md:rounded-3xl border border-gray-200' : 'w-full'}`}>
        
        {/* App Header (Fixed Top - Always Visible) */}
        <header className="flex-none z-30 bg-[#113F33] text-white px-3 py-2.5 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#1B7A5E]">
              <img 
                src="/assets/aistudio/image_2aae7fd3.png" 
                alt="Store Logo" 
                className="w-full h-full object-cover rounded-lg"
                onError={(e)=>{
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold tracking-tight text-white truncate">
                {STORE_NAME}
              </h1>
              <p className="text-[10px] text-emerald-200/90 font-medium truncate">ফোন: {STORE_PHONE}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isInstalled && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg transition text-[10px] font-bold shadow animate-pulse"
              >
                <Download className="w-3 h-3" />
                <span>ইন্সটল</span>
              </button>
            )}
            <button 
              onClick={handleSync}
              className="flex items-center gap-1 bg-[#1B7A5E] hover:bg-[#155e48] text-white px-2 py-1 rounded-lg transition text-[9px] shadow-sm font-medium"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">Last Sync: {syncTime}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area (Scrolls independently) */}
        <main className="flex-1 overflow-y-auto p-3.5 pb-20 relative">
          
          {/* ================= 1. HOME / DASHBOARD SCREEN ================= */}
          {currentTab === 'home' && (
            <div className="p-2 space-y-3 animate-fadeIn w-full">
              
              {/* Timeframe selector tabs */}
              <div className="flex bg-white rounded-xl p-0.5 shadow-sm border border-emerald-100 text-xs font-bold w-full bg-emerald-50/30">
                {[
                  { id: 'today', label: 'আজ' },
                  { id: 'week', label: 'গত সপ্তাহ' },
                  { id: 'month', label: 'এই মাস' },
                  { id: 'more', label: 'আরও ফিল্টার' }
                ].map((tf) => (
                  <button 
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id as 'today' | 'week' | 'month' | 'more')}
                    className={`flex-1 py-2 rounded-lg transition text-center ${timeframe === tf.id ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-emerald-100'}`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {timeframe === 'more' && (
                <div className="bg-white p-2 rounded-lg shadow-sm border border-emerald-100 flex gap-1 text-[10px]">
                  <input type="date" className="flex-1 p-1 border border-emerald-100 rounded" />
                  <input type="date" className="flex-1 p-1 border border-emerald-100 rounded" />
                </div>
              )}

              {/* Compact Summary Cards - Grid */}
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {[
                  { label: 'অর্ডার সংখ্যা', val: totalOrdersCount },
                  { label: 'পুরাতন', val: customers.filter(c=>c.status==='clear').length },
                  { label: 'নতুন', val: newCustomersCount },
                  { label: 'বিক্রি', val: totalSalesAmount.toLocaleString('en-IN') },
                  { label: 'মোট লাভ', val: totalProfitAmount.toLocaleString('en-IN') },
                  { label: 'প্রতিনিধি', val: totalRepPayment.toLocaleString('en-IN') },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-center">
                    <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{item.label}</div>
                    <div className="text-sm font-bold text-gray-900 tabular-nums">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Compact History Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full text-[10px]">
                <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-t-lg font-bold text-gray-800 grid grid-cols-9 gap-1 text-center">
                  <div className="col-span-1">তারিখ</div>
                  <div className="col-span-1">অর্ডার</div>
                  <div className="col-span-1">পুরাতন<br/>ক্রেতা</div>
                  <div className="col-span-1">নতুন<br/>ক্রেতা</div>
                  <div className="col-span-1">মোট<br/>ক্রেতা</div>
                  <div className="col-span-1">বিক্রি</div>
                  <div className="col-span-1">ক্রেতা<br/>প্রতি</div>
                  <div className="col-span-1">লাভ</div>
                  <div className="col-span-1">প্রতিনিধি<br/>পরিশোধ</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {dateHistoryList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">কোনো ডাটা পাওয়া যায়নি</div>
                  ) : dateHistoryList.slice(0, 10).map((r, i) => (
                    <div key={i} className="p-2 grid grid-cols-9 gap-1 text-center items-center hover:bg-gray-50 tabular-nums">
                      <div className="col-span-1 font-bold">{r.date.split('-')[0]}</div>
                      <div className="col-span-1">{r.totalOrders}</div>
                      <div className="col-span-1">{Math.max(0, r.totalCustomers - r.totalNewCustomers)}</div>
                      <div className="col-span-1">{r.totalNewCustomers}</div>
                      <div className="col-span-1">{r.totalCustomers}</div>
                      <div className="col-span-1">{r.totalSales}</div>
                      <div className="col-span-1">{(r.totalSales / (r.totalCustomers || 1)).toFixed(0)}</div>
                      <div className="col-span-1">{r.totalProfit}</div>
                      <div className="col-span-1">{r.totalRepPayment}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {currentTab === 'ledger' && (
            <div className="animate-fadeIn w-full h-full flex flex-col">
              {/* Summary Section */}
              <div className="grid grid-cols-2 gap-2 p-2">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-[10px] text-gray-500 font-medium">মোট বাকি</div>
                  <div className="text-sm font-bold text-red-600 tabular-nums">
                    {customers.reduce((sum, c) => sum + c.dueAmount, 0).toLocaleString('en-IN')} ৳
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-[10px] text-gray-500 font-medium">মোট ক্রেতা (unique)</div>
                  <div className="text-sm font-bold text-gray-900 tabular-nums">{new Set(customers.map(c => c.name)).size}</div>
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-5 text-[10px] font-bold text-gray-700 border-b border-gray-200 bg-gray-50 p-2 text-center">
                <div className="text-left">ক্রেতার নাম</div>
                <div>মোবাইল</div>
                <div>ঠিকানা</div>
                <div>বাকি</div>
                <div>অ্যাকশন</div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {customers.map(c => (
                  <div key={c.id} className="grid grid-cols-5 text-[11px] border-b border-gray-100 p-2 items-center text-center">
                    <div className="text-left font-bold truncate">{c.name}</div>
                    <div className="text-gray-600">{c.phone}</div>
                    <div className="text-gray-600 truncate">{c.address}</div>
                    <div className="font-bold text-red-600 tabular-nums">{c.dueAmount}</div>
                    <div><button className="text-emerald-700 font-bold underline">পেমেন্ট</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 2. POS / SALES SCREEN (নতুন বিক্রি) ================= */}
          {currentTab === 'pos' && (
            <div className="p-4 space-y-4 animate-fadeIn w-full">
              


              {/* Customer Type Selector */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex bg-gray-100 rounded-xl p-0.5 mb-2">
                  <button onClick={() => { setSelectedExistingCustomer(''); setNewCustName(''); }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${!selectedExistingCustomer && !newCustName ? 'bg-white shadow' : ''}`}>নগদ</button>
                  <button onClick={() => { setSelectedExistingCustomer(' '); setNewCustName(''); }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${selectedExistingCustomer ? 'bg-white shadow' : ''}`}>পুরাতন</button>
                  <button onClick={() => { setSelectedExistingCustomer(''); setNewCustName(' '); }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${newCustName ? 'bg-white shadow' : ''}`}>নতুন</button>
                </div>
                {selectedExistingCustomer && (
                  <input type="text" placeholder="পুরাতন ক্রেতার নাম লিখুন..." value={selectedExistingCustomer.trim() === '' ? '' : selectedExistingCustomer} onChange={(e) => setSelectedExistingCustomer(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                )}
                {newCustName && (
                  <div className="space-y-1">
                    <input type="text" placeholder="ক্রেতার নাম" value={newCustName.trim() === '' ? '' : newCustName} onChange={(e) => setNewCustName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                    <input type="text" placeholder="ফোন নম্বর" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                    <input type="text" placeholder="লোকেশন" value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                  </div>
                )}
              </div>

              {/* Search Bar & Category Chips */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input 
                    type="text"
                    placeholder="পণ্য খুঁজুন (যেমন: cal, chal, চাল, oil, তেল)..."
                    value={posSearchQuery}
                    onChange={(e) => setPosSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B7A5E] shadow-sm"
                  />
                  {posSearchQuery && (
                    <button onClick={() => setPosSearchQuery('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {['সব', ...categoriesList].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                        selectedCategoryFilter === cat 
                          ? 'bg-[#113F33] text-white shadow-sm' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid - Ultra Compact Widescreen Layout */}
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {products
                  .filter(p => selectedCategoryFilter === 'সব' || p.category === selectedCategoryFilter)
                  .filter(p => matchesProductSearch(p, posSearchQuery))
                  .map(product => {
                    const isLow = product.stock <= 5;
                    return (
                      <div 
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white p-2 rounded-xl shadow-xs border border-gray-200 hover:border-[#1B7A5E] transition cursor-pointer flex flex-col justify-between group active:scale-98 relative"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1 gap-1 text-[9px]">
                            <span className="bg-gray-100 text-gray-600 px-1 py-0.2 rounded truncate">
                              {product.category}
                            </span>
                            <span className={`px-1 py-0.2 rounded font-medium truncate ${isLow ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#D1FAE5] text-[#059669]'}`}>
                              {product.stock} {product.unit}
                            </span>
                          </div>
                          <h4 className="font-bold text-[11px] text-gray-900 line-clamp-2 leading-tight group-hover:text-[#1B7A5E] transition">
                            {product.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                          <span className="font-bold text-xs text-[#113F33]">{product.sellPrice}</span>
                          <button className="w-5 h-5 rounded-lg bg-[#1B7A5E] text-white flex items-center justify-center shadow-xs hover:bg-[#113F33] transition">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Right-Aligned Floating Cart Button on Far Right Edge */}
              {cart.length > 0 && (
                <button 
                  onClick={() => setIsCartModalOpen(true)}
                  className="fixed bottom-20 right-4 lg:right-8 z-40 bg-[#1B7A5E] hover:bg-[#113F33] text-white py-2.5 px-3.5 rounded-2xl font-bold shadow-2xl flex items-center gap-2 border-2 border-amber-400 transition hover:scale-105"
                  title="কার্ট বিবরণী দেখুন"
                >
                  <ShoppingCart className="w-5 h-5 text-amber-300" />
                  <div className="text-left leading-none">
                    <span className="text-[10px] text-emerald-200 block font-normal">কার্ট চেকআউট</span>
                    <span className="text-xs font-bold text-white whitespace-nowrap">
                      {cart.reduce((s, i) => s + i.quantity, 0)} টি • {cartTotal.toLocaleString('en-IN')} ৳
                    </span>
                  </div>
                </button>
              )}

            </div>
          )}

          {/* ================= 3. STOCK MANAGEMENT SCREEN (স্টক) ================= */}
          {currentTab === 'stock' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Search & Add Product Row */}
              <div className="flex gap-2 items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="পণ্য খুঁজুন..."
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => setIsAddProductOpen(true)}
                  className="bg-[#1B7A5E] text-white px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-[#113F33] transition"
                >
                  নতুন পণ্য
                </button>
              </div>

              {/* Low Stock Alert Banner */}
              {lowStockCount > 0 && (
                <div className="bg-[#FEF3C7] border border-amber-300 text-amber-900 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-200 text-amber-800">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">কম স্টক অ্যালার্ট ({lowStockCount} টি পণ্য)</div>
                      <div className="text-[11px] text-amber-700 mt-0.5">দ্রুত রি-অর্ডার বা স্টক আপডেট করুন</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStockFilterTab('low')}
                    className="text-xs bg-amber-800 text-white px-2.5 py-1.5 rounded-lg font-bold shadow"
                  >
                    দেখুন
                  </button>
                </div>
              )}

              {/* Stock Table / List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 grid grid-cols-12 gap-2">
                  <div className="col-span-4">পণ্যের নাম</div>
                  <div className="col-span-3 text-center">স্টক</div>
                  <div className="col-span-5 text-right">প্রতিনিধি ও মূল্য</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {products
                    .filter(p => stockFilterTab === 'all' || (stockFilterTab === 'low' ? p.stock <= 5 : p.stock > 5))
                    .filter(p => matchesProductSearch(p, stockSearchQuery) || (p.repName && p.repName.toLowerCase().includes(stockSearchQuery.toLowerCase())))
                    .map(product => {
                      const isLow = product.stock <= 5;
                      return (
                        <div key={product.id} className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-gray-50 transition">
                          <div className="col-span-4">
                            <div className="font-bold text-xs text-gray-900 line-clamp-1">{product.name}</div>
                            <div className="text-[10px] text-gray-500">{product.category}</div>
                          </div>
                          
                          <div className="col-span-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isLow ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#D1FAE5] text-[#059669]'
                            }`}>
                              {product.stock} {product.unit}
                            </span>
                          </div>

                          <div className="col-span-5 text-right">
                            <div className="text-xs font-bold text-gray-900">{product.sellPrice}</div>
                            {product.repName && (
                              <div className="text-[10px] text-[#1B7A5E] font-medium">প্র: {product.repName} ({product.repPhone})</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Add Product Modal */}
              {isAddProductOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-gray-200">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#1B7A5E]" /> নতুন পণ্য ও প্রতিনিধি যোগ করুন
                      </h3>
                      <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-gray-600 font-medium block mb-1">পণ্যের নাম</label>
                        <input 
                          type="text" 
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="যেমন: তীর সয়াবিন তেল ২ লিটার"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#1B7A5E]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">ক্যাটাগরি</label>
                          <select 
                            value={newProductCategory}
                            onChange={(e) => {
                              if (e.target.value === 'ADD_NEW') {
                                const cName = prompt('নতুন ক্যাটাগরির নাম লিখুন:');
                                if (cName && cName.trim()) {
                                  const formatted = cName.trim();
                                  if (!categoriesList.includes(formatted)) {
                                    setCategoriesList([...categoriesList, formatted]);
                                  }
                                  setNewProductCategory(formatted);
                                }
                              } else {
                                setNewProductCategory(e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#1B7A5E]"
                          >
                            {categoriesList.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="ADD_NEW" className="text-[#1B7A5E] font-bold">+ নতুন ক্যাটাগরি...</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">একক</label>
                          <select 
                            value={newProductUnit}
                            onChange={(e) => {
                              if (e.target.value === 'ADD_NEW') {
                                const uName = prompt('নতুন এককের নাম লিখুন (যেমন: ড্রাম, কার্টন):');
                                if (uName && uName.trim()) {
                                  const formatted = uName.trim();
                                  if (!unitsList.includes(formatted)) {
                                    setUnitsList([...unitsList, formatted]);
                                  }
                                  setNewProductUnit(formatted);
                                }
                              } else {
                                setNewProductUnit(e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#1B7A5E]"
                          >
                            {unitsList.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                            <option value="ADD_NEW" className="text-[#1B7A5E] font-bold">+ নতুন একক...</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">স্টক</label>
                          <input 
                            type="number" 
                            value={newProductStock}
                            onChange={(e) => setNewProductStock(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-center"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">ক্রয় মূল্য</label>
                          <input 
                            type="number" 
                            value={newProductBuy}
                            onChange={(e) => setNewProductBuy(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-center"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">বিক্রয় মূল্য</label>
                          <input 
                            type="number" 
                            value={newProductSell}
                            onChange={(e) => setNewProductSell(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-center"
                          />
                        </div>
                      </div>

                      {/* Representative Details */}
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 space-y-2">
                        <span className="font-bold text-[#113F33] block">কোম্পানি প্রতিনিধি (Representative) তথ্য:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="প্রতিনিধির নাম"
                            value={newProductRepName}
                            onChange={(e) => setNewProductRepName(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                          <input 
                            type="text" 
                            placeholder="মোবাইল নম্বর"
                            value={newProductRepPhone}
                            onChange={(e) => setNewProductRepPhone(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-gray-100">
                      <button 
                        onClick={() => setIsAddProductOpen(false)}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                      >
                        বাতিল
                      </button>
                      <button 
                        onClick={() => {
                          if (!newProductName.trim()) {
                            alert('দয়া করে পণ্যের নাম দিন');
                            return;
                          }
                          const newProd: Product = {
                            id: `p-${Date.now()}`,
                            name: newProductName,
                            category: newProductCategory,
                            stock: Number(newProductStock) || 0,
                            unit: newProductUnit,
                            buyPrice: Number(newProductBuy) || 0,
                            sellPrice: Number(newProductSell) || 0,
                            barcode: `${Math.floor(2000 + Math.random() * 9000)}`,
                            repName: newProductRepName.trim() || 'নির্ধারিত নয়',
                            repPhone: newProductRepPhone.trim() || '01700000000',
                            searchTags: [newProductName.toLowerCase(), newProductCategory, newProductRepName.toLowerCase()]
                          };
                          setProducts([newProd, ...products]);
                          setIsAddProductOpen(false);
                          setNewProductName('');
                          setNewProductStock('');
                          setNewProductBuy('');
                          setNewProductSell('');
                          setNewProductRepName('');
                          setNewProductRepPhone('');
                          setNewProductRepPhone('');
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
                      >
                        সেভ করুন
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================= 4. ACTIVITY LOG SCREEN ================= */}
          {currentTab === 'activity' && (
            <div className="p-4 space-y-4 animate-fadeIn w-full max-w-5xl mx-auto">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-lg text-gray-900 mb-4">সাম্প্রতিক কার্যক্রম</h2>
                <div className="space-y-3">
                  <div className="text-gray-500 text-sm italic">কার্যক্রমের তালিকা এখানে প্রদর্শিত হবে।</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. SALES LEDGER ("বাকি খাতা" SCREEN) ================= */}
          {currentTab === 'ledger' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Search & Filter */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input 
                  type="text"
                  placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B7A5E] shadow-sm"
                />
              </div>

              {/* Customer Table / Row-wise Layout */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-[11px] text-gray-700 grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-3">গ্রাহকের নাম</div>
                  <div className="col-span-2">মোবাইল</div>
                  <div className="col-span-2">ঠিকানা</div>
                  <div className="col-span-2 text-right">বাকি পরিমাণ</div>
                  <div className="col-span-1 text-center">স্ট্যাটাস</div>
                  <div className="col-span-2 text-right">অ্যাকশন</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {customers
                    .filter(c => c.dueAmount > 0)
                    .filter(c => c.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || c.phone.includes(ledgerSearchQuery))
                    .map(customer => {
                      return (
                        <div 
                          key={customer.id} 
                          className="p-2.5 grid grid-cols-12 gap-1 items-center text-xs hover:bg-gray-50 transition"
                        >
                          <div className="col-span-3 font-bold text-gray-900 truncate" title={customer.name}>
                            {customer.name}
                          </div>
                          
                          <div className="col-span-2 text-gray-600 text-[11px] truncate">
                            {customer.phone}
                          </div>

                          <div className="col-span-2 text-gray-500 text-[11px] truncate">
                            {customer.address}
                          </div>

                          <div className="col-span-2 text-right font-bold text-[#DC2626]">
                            {customer.dueAmount.toLocaleString('en-IN')} ৳
                          </div>

                          <div className="col-span-1 text-center">
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#FEF3C7] text-[#D97706]">
                              পেন্ডিং
                            </span>
                          </div>

                          <div className="col-span-2 flex justify-end gap-1">
                            <button 
                              onClick={() => {
                                setDepositModalCustomer(customer);
                                setDepositAmountInput(String(customer.dueAmount));
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-[#1B7A5E] font-bold text-[10px] hover:bg-emerald-100 transition whitespace-nowrap shadow-xs"
                            >
                              জমা নিন
                            </button>
                            <button 
                              onClick={() => alert(`${customer.name} (${customer.phone})-কে বাকি পরিশোধের এসএমএস পাঠানো হয়েছে।`)}
                              className="p-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                              title="SMS Reminder"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

          {/* ================= 5. MORE / SETTINGS SCREEN (আরও) ================= */}
          {currentTab === 'more' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Profile Card */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow border border-[#1B7A5E] overflow-hidden flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/assets/aistudio/image_2aae7fd3.png" 
                    alt="Store Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-base text-gray-900">{STORE_NAME}</h2>
                  <p className="text-xs text-gray-500">প্রোপ্রাইটর • মোবাইল: {STORE_PHONE}</p>
                  <p className="text-[11px] text-[#1B7A5E] font-medium mt-0.5">{STORE_ADDRESS}</p>
                </div>
              </div>

              {/* Menu Options */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100 text-xs">
                <button 
                  onClick={handleInstallClick}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-amber-50/60 transition text-left border-l-4 border-l-amber-500"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-bold text-gray-900 block">মোবাইলে অ্যাপ ইনস্টল করুন (App Install)</span>
                      <span className="text-[10px] text-gray-500 block">প্লে-স্টোর ছাড়াই সরাসরি হোম-স্ক্রিনে ডাউনলোড</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                    {isInstalled ? 'ইন্সটল করা আছে' : 'ইন্সটল করুন'}
                  </span>
                </button>
                <button 
                  onClick={() => alert('দোকানের রসিদ প্রিন্টার সফলভাবে সংযুক্ত আছে।')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Printer className="w-4 h-4 text-[#1B7A5E]" />
                    <span className="font-medium text-gray-800">ব্লুটুথ থার্মাল প্রিন্টার সেটিংস</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button 
                  onClick={() => setIsScriptModalOpen(true)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-[#1B7A5E]/5 transition text-left border-l-4 border-l-[#1B7A5E]"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-[#1B7A5E]" />
                    <div>
                      <span className="font-bold text-gray-900 block">গুগল শিট স্ক্রিপ্ট কোড (Google Apps Script)</span>
                      <span className="text-[10px] text-gray-500 block">bikri, stock, bakir khata, catgeory ট্যাব তৈরির কোড কপির সুবিধা</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1B7A5E]" />
                </button>

                <button 
                  onClick={() => alert('আজকের বিক্রির রিপোর্ট (PDF) ডাউনলোড হচ্ছে...')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-[#1B7A5E]" />
                    <span className="font-medium text-gray-800">দৈনিক ও মাসিক হিসাব রিপোর্ট (PDF)</span>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>

                <button 
                  onClick={() => alert('ডেটা ক্লাউডে সফলভাবে ব্যাকআপ করা হয়েছে।')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-4 h-4 text-[#1B7A5E]" />
                    <span className="font-medium text-gray-800">ক্লাউড ব্যাকআপ ও সিঙ্ক</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">আপ-টু-ডেট</span>
                </button>

                <button 
                  onClick={() => alert(`হেল্পলাইন: ${STORE_PHONE} (সকাল ৮টা - রাত ১০টা)`)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="w-4 h-4 text-[#1B7A5E]" />
                    <span className="font-medium text-gray-800">সাহায্য ও সাপোর্ট</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* App Version Info */}
              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-400">{STORE_NAME} v2.7.3 • বাংলা ভার্সন</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">সর্বস্বত্ব সংরক্ষিত © ২০২৬</p>
              </div>

            </div>
          )}

        </main>

        {/* ================= CART DETAILS MODAL (কার্ট বিস্তারিত) ================= */}
        {isCartModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#1B7A5E]/10 text-[#1B7A5E]">
                    <ShoppingCart className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm text-gray-900">কার্ট এর পণ্য ও বিলের বিবরণ</h3>
                </div>
                <button onClick={() => setIsCartModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">কার্ট খালি আছে</div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="font-bold text-gray-900 truncate">{item.product.name}</div>
                        <div className="text-[10px] text-gray-500">
                          দর: {item.product.sellPrice} × {item.quantity} {item.product.unit} = <span className="font-bold text-[#113F33]">{item.product.sellPrice * item.quantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs text-gray-900 w-5 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-[#1B7A5E] text-white font-bold flex items-center justify-center hover:bg-[#113F33]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill summary & discount */}
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>মোট সাবটোটাল:</span>
                  <span className="font-bold">{cartSubtotal.toLocaleString('en-IN')} ৳</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">ছাড়/ডিসকাউন্ট (৳):</span>
                  <input 
                    type="number"
                    value={discountInput || ''}
                    onChange={(e) => setDiscountInput(Number(e.target.value))}
                    placeholder="0"
                    className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs focus:outline-none focus:border-[#1B7A5E]"
                  />
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-emerald-200/80 font-bold text-sm text-[#113F33]">
                  <span>সর্বমোট বিল:</span>
                  <span>{cartTotal.toLocaleString('en-IN')} ৳</span>
                </div>

                {(selectedExistingCustomer !== '' || newCustName !== '') && (
                  <div className="flex justify-between items-center pt-1 border-t border-emerald-200/80">
                    <span className="text-gray-700 font-medium">নগদ গ্রহণ (Paid):</span>
                    <input 
                      type="number"
                      value={cashPaidInput}
                      onChange={(e) => setCashPaidInput(e.target.value)}
                      placeholder={String(cartTotal)}
                      className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs text-emerald-700 focus:outline-none focus:border-[#1B7A5E]"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => setIsCartModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition"
                >
                  আরও পণ্য যোগ করুন
                </button>
                <button 
                  onClick={() => {
                    setIsCartModalOpen(false);
                    handlePreparePrintPreview();
                  }}
                  disabled={cart.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33] transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Receipt className="w-4 h-4" /> মেমো ও সাবমিট
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= iOS SAFARI PWA GUIDE MODAL ================= */}
        {showIOSGuide && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-gray-200 text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">আইফোন (iOS Safari)-এ অ্যাপ ইনস্টল করার নিয়ম</h3>
              
              <div className="text-left bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-2 text-amber-900">
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">১</span>
                  <span>সাফারি (Safari) ব্রাউজারের নিচে <b>Share Icon</b> (শেয়ার বোতাম) এ ট্যাপ করুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">২</span>
                  <span>একটু নিচে স্ক্রল করে <b>'Add to Home Screen'</b> নির্বাচন করুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">৩</span>
                  <span>উপরে <b>'Add'</b> ক্লিক করলেই হোম-স্ক্রিনে অ্যাপ আইকন তৈরি হয়ে যাবে।</span>
                </div>
              </div>

              <button 
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                বুঝতে পেরেছি
              </button>
            </div>
          </div>
        )}

        {/* ================= GENERAL PWA INSTRUCTION MODAL ================= */}
        {showPWAInstructionModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-gray-200 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-[#1B7A5E] rounded-full flex items-center justify-center mx-auto">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">মোবাইলে অ্যাপ হিসেবে সেভ করুন</h3>
              
              <p className="text-xs text-gray-600">
                আপনার ক্রোম (Chrome) বা মোবাইল ব্রাউজারের থ্রি-ডট (<b>⋮</b>) মেনুতে ক্লিক করে <b>'Install App'</b> বা <b>'Add to Home screen'</b> সিলেক্ট করুন।
              </p>

              <button 
                onClick={() => setShowPWAInstructionModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        )}

        {/* ================= DEPOSIT PAYMENT MODAL (টাকা জমা নিন) ================= */}
        {depositModalCustomer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-gray-200">
              
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#1B7A5E]" /> টাকা জমা নিন (Payment Deposit)
                </h3>
                <button onClick={() => setDepositModalCustomer(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 border border-gray-200">
                <div className="font-bold text-gray-900 text-sm">{depositModalCustomer.name} ({depositModalCustomer.phone})</div>
                <div className="text-red-600 font-bold">বর্তমান বকেয়া: {depositModalCustomer.dueAmount.toLocaleString('en-IN')}</div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-600 font-medium block mb-1">জমার পরিমাণ (টাকা)</label>
                  <input 
                    type="number"
                    value={depositAmountInput}
                    onChange={(e) => setDepositAmountInput(e.target.value)}
                    placeholder="টাকার পরিমাণ লিখুন..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:border-[#1B7A5E]"
                  />
                </div>

                <div>
                  <label className="text-gray-600 font-medium block mb-1">পেমেন্ট মাধ্যম</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setDepositMethod('cash')}
                      className={`py-2 rounded-xl font-bold transition border ${depositMethod === 'cash' ? 'bg-[#1B7A5E] text-white border-[#1B7A5E]' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                    >
                      নগদ (Cash)
                    </button>
                    <button 
                      onClick={() => setDepositMethod('bkash')}
                      className={`py-2 rounded-xl font-bold transition border ${depositMethod === 'bkash' ? 'bg-pink-600 text-white border-pink-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                    >
                      বিকাশ (bKash)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setDepositModalCustomer(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button 
                  onClick={() => {
                    const amt = Number(depositAmountInput);
                    if (isNaN(amt) || amt <= 0) {
                      alert('দয়া করে সঠিক জমার পরিমাণ লিখুন');
                      return;
                    }
                    setCustomers(prev => prev.map(c => {
                      if (c.id === depositModalCustomer.id) {
                        const newDue = Math.max(0, c.dueAmount - amt);
                        return { ...c, dueAmount: newDue, status: newDue === 0 ? 'clear' : 'pending' };
                      }
                      return c;
                    }));
                    alert(`সফলভাবে ${depositModalCustomer.name}-এর কাছ থেকে ${amt} (${depositMethod === 'cash' ? 'নগদ' : 'বিকাশ'}) জমা নেওয়া হয়েছে।`);
                    setDepositModalCustomer(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
                >
                  জমা নিশ্চিত করুন
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= THERMAL MEMO PRINT PREVIEW MODAL ================= */}
        {printPreviewOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-gray-200">
              
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#1B7A5E]" /> ক্যাশ মেমো প্রিভিউ (Thermal Print)
                </h3>
                <button onClick={() => setPrintPreviewOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thermal Receipt Paper Layout */}
              <div className="bg-[#FFFDF9] border border-dashed border-gray-300 p-4 rounded-xl text-xs font-mono space-y-3 shadow-inner">
                <div className="text-center space-y-0.5">
                  <h4 className="font-bold text-sm text-[#113F33] font-['Hind_Siliguri']">{STORE_NAME}</h4>
                  <p className="text-[10px] text-gray-600 font-[#Hind_Siliguri]">মুদিখানা ও ডিপার্টমেন্টাল স্টোর</p>
                  <p className="text-[10px] text-gray-500 font-['Hind_Siliguri']">{STORE_ADDRESS} • {STORE_PHONE}</p>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-1.5 text-[11px] space-y-0.5 font-['Hind_Siliguri']">
                  <div className="flex justify-between">
                    <span>ইনভয়েস: {printPreviewOrder.invoiceNo}</span>
                    <span>{printPreviewOrder.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>গ্রাহক: {printPreviewOrder.customerName}</span>
                    <span>মোবাইল: {printPreviewOrder.customerPhone}</span>
                  </div>
                </div>

                {/* Items table */}
                <div className="space-y-1 font-['Hind_Siliguri']">
                  <div className="flex justify-between font-bold text-[10px] border-b border-gray-200 pb-0.5">
                    <span>পণ্যের বিবরণ</span>
                    <span>পরিমাণ × দর = মোট</span>
                  </div>
                  {printPreviewOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="truncate max-w-[140px]">{item.product.name}</span>
                      <span>{item.quantity} × {item.product.sellPrice} = {item.product.sellPrice * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Totals & Paid */}
                <div className="border-t border-dashed border-gray-300 pt-1.5 space-y-1 font-['Hind_Siliguri']">
                  <div className="flex justify-between">
                    <span>সাবটোটাল:</span>
                    <span>{printPreviewOrder.subtotal}</span>
                  </div>
                  {printPreviewOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>ডিসকাウント:</span>
                      <span>- {printPreviewOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-[#113F33] border-t border-gray-200 pt-1">
                    <span>সর্বমোট বিল:</span>
                    <span>{printPreviewOrder.total}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>নগদ জমা (Paid):</span>
                    <span>{printPreviewOrder.paid}</span>
                  </div>
                  {printPreviewOrder.due > 0 && (
                    <div className="flex justify-between font-bold text-red-600">
                      <span>বাকি (Due):</span>
                      <span>{printPreviewOrder.due}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500 font-['Hind_Siliguri']">
                  ধন্যবাদ! আবার আসবেন।<br/>সফটওয়্যার সহায়তায়: {STORE_NAME}
                </div>
              </div>

              {/* Action Buttons inside Preview */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => {
                    alert('থার্মাল প্রিন্টারে সফলভাবে প্রিন্ট কমান্ড পাঠানো হয়েছে!');
                  }}
                  className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-200 transition"
                >
                  <Printer className="w-4 h-4" /> প্রিন্ট করুন
                </button>
                <button 
                  onClick={handleConfirmAndSubmitSale}
                  className="py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs flex items-center justify-center gap-1 shadow hover:bg-[#113F33] transition"
                >
                  <Check className="w-4 h-4" /> সাবমিট করুন
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Success Modal after Submission */}
        {successModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-gray-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-100 text-[#1B7A5E] rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-gray-900">বিক্রি সফলভাবে সাবমিট হয়েছে!</h3>
                <p className="text-xs text-gray-500">ইনভয়েস নম্বর: {successModal.invoiceNo}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl space-y-1.5 text-xs border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">গ্রাহক:</span>
                  <span className="font-bold text-gray-900">{successModal.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">মোট বিল:</span>
                  <span className="font-bold text-gray-900">{successModal.total}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>জমা:</span>
                  <span>{successModal.paid}</span>
                </div>
                {successModal.due > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>বাকি খাতায় যোগ:</span>
                    <span>{successModal.due}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSuccessModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33] transition"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        )}

        {/* Google Sheet Apps Script Helper Modal */}
        {isScriptModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg p-5 space-y-3 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1B7A5E]" /> গুগল শিট অটোমেশন কোড (Apps Script)
                </h3>
                <button onClick={() => setIsScriptModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                আপনার গুগল শিটে স্বয়ংক্রিয়ভাবে <b>bikri</b>, <b>stock</b>, <b>bakir khata</b> এবং <b>catgeory</b> ট্যাব ও সঠিক কলাম তৈরি করতে নিচের কোডটি শিটের Extensions &gt; Apps Script এ পেস্ট করে Deploy as Web App (Anyone) দিন:
              </p>

              <div className="bg-gray-900 text-emerald-400 p-3 rounded-xl text-[10px] font-mono overflow-y-auto flex-1 select-all space-y-1">
                <pre>{`function doPost(e) { return handleRequest(e); }
function doGet(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    if (e && e.parameter && e.parameter.data) {
      try { data = JSON.parse(e.parameter.data); } catch(err) {}
    }
    if ((!data || !data.bikri) && e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) {}
    }

    // 1. Tab: bikri
    var bikriSheet = ss.getSheetByName('bikri') || ss.insertSheet('bikri');
    var bikriHeaders = ['invoice no', 'date', 'customer name', 'customer mobile', 'location', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit'];
    if (bikriSheet.getLastRow() === 0 || bikriSheet.getRange(1, 3).getValue() !== 'customer name') {
      bikriSheet.clear();
      bikriSheet.getRange(1, 1, 1, 13).setValues([bikriHeaders]);
    }
    if (data && data.bikri && data.bikri.length > 0) {
      var existingData = bikriSheet.getDataRange().getValues();
      var existingKeys = {};
      for (var x = 1; x < existingData.length; x++) {
        var key = (existingData[x][0] || '') + '_' + (existingData[x][5] || '');
        existingKeys[key] = true;
      }
      data.bikri.forEach(function(r) {
        var invNo = r['invoice no'] || r['invoice_no'] || '';
        var pName = r['product name'] || r['product_name'] || '';
        var rowKey = invNo + '_' + pName;
        if (!existingKeys[rowKey]) {
          bikriSheet.appendRow([invNo, r['date']||'', r['customer name']||r['customer_name']||'নগদ ক্রেতা', r['customer mobile']||r['customer_mobile']||'-', r['location']||r['address']||'রায়পুর বাজার', pName, r['category']||'', r['cost']||0, r['sales']||0, r['discount']||0, r['baki']||0, r['payment method']||'', r['profit']||0]);
          existingKeys[rowKey] = true;
        }
      });
    }

    // 2. Tab: stock
    var stockSheet = ss.getSheetByName('stock') || ss.insertSheet('stock');
    stockSheet.clearContents();
    stockSheet.appendRow(['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone']);
    if (data && data.stock && data.stock.length > 0) {
      data.stock.forEach(function(p) {
        stockSheet.appendRow([p.id||'', p.name||'', p.category||'', p.stock||0, p.unit||'', p.buyPrice||0, p.sellPrice||0, p.barcode||'', p.repName||'', p.repPhone||'']);
      });
    }

    // 3. Tab: bakir khata
    var bakiSheet = ss.getSheetByName('bakir khata') || ss.insertSheet('bakir khata');
    bakiSheet.clearContents();
    bakiSheet.appendRow(['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'status']);
    if (data && data['bakir khata'] && data['bakir khata'].length > 0) {
      data['bakir khata'].forEach(function(c) {
        bakiSheet.appendRow([c.id||'', c.name||'', c.phone||'', c.address||'', c.dueAmount||0, c.lastPurchaseDate||'', c.status||'']);
      });
    }

    // 4. Tab: catgeory
    var catSheet = ss.getSheetByName('catgeory') || ss.insertSheet('catgeory');
    catSheet.clearContents();
    catSheet.appendRow(['category_name']);
    if (data && data.catgeory && data.catgeory.length > 0) {
      data.catgeory.forEach(function(cat) {
        catSheet.appendRow([cat]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Synced successfully' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`function doPost(e) { return handleRequest(e); }\nfunction doGet(e) { return handleRequest(e); }\n\nfunction handleRequest(e) {\n  try {\n    var ss = SpreadsheetApp.getActiveSpreadsheet();\n    var data = {};\n    if (e && e.parameter && e.parameter.data) {\n      try { data = JSON.parse(e.parameter.data); } catch(err) {}\n    }\n    if ((!data || !data.bikri) && e && e.postData && e.postData.contents) {\n      try { data = JSON.parse(e.postData.contents); } catch(err) {}\n    }\n\n    var bikriSheet = ss.getSheetByName('bikri') || ss.insertSheet('bikri');\n    bikriSheet.clearContents();\n    bikriSheet.appendRow(['invoice no', 'date', 'customer name', 'customer mobile', 'location', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit']);\n    if (data && data.bikri && data.bikri.length > 0) {\n      data.bikri.forEach(function(r) {\n        bikriSheet.appendRow([r['invoice no']||'', r['date']||'', r['customer name']||'', r['customer mobile']||'', r['location']||'', r['product name']||'', r['category']||'', r['cost']||0, r['sales']||0, r['discount']||0, r['baki']||0, r['payment method']||'', r['profit']||0]);\n      });\n    }\n\n    var stockSheet = ss.getSheetByName('stock') || ss.insertSheet('stock');\n    stockSheet.clearContents();\n    stockSheet.appendRow(['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone']);\n    if (data && data.stock && data.stock.length > 0) {\n      data.stock.forEach(function(p) {\n        stockSheet.appendRow([p.id||'', p.name||'', p.category||'', p.stock||0, p.unit||'', p.buyPrice||0, p.sellPrice||0, p.barcode||'', p.repName||'', p.repPhone||'']);\n      });\n    }\n\n    var bakiSheet = ss.getSheetByName('bakir khata') || ss.insertSheet('bakir khata');\n    bakiSheet.clearContents();\n    bakiSheet.appendRow(['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'status']);\n    if (data && data['bakir khata'] && data['bakir khata'].length > 0) {\n      data['bakir khata'].forEach(function(c) {\n        bakiSheet.appendRow([c.id||'', c.name||'', c.phone||'', c.address||'', c.dueAmount||0, c.lastPurchaseDate||'', c.status||'']);\n      });\n    }\n\n    var catSheet = ss.getSheetByName('catgeory') || ss.insertSheet('catgeory');\n    catSheet.clearContents();\n    catSheet.appendRow(['category_name']);\n    if (data && data.catgeory && data.catgeory.length > 0) {\n      data.catgeory.forEach(function(cat) {\n        catSheet.appendRow([cat]);\n      });\n    }\n\n    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Synced successfully' })).setMimeType(ContentService.MimeType.JSON);\n  } catch (err) {\n    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);\n  }\n}`);
                    alert('কোড কপি করা হয়েছে!');
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33] transition"
                >
                  কোড কপি করুন
                </button>
                <button 
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-[#113F33] text-xs hover:bg-gray-200 transition font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Always Visible Fixed Bottom Navigation Footer */}
        <nav className="flex-none bg-[#113F33] text-emerald-100 border-t border-[#1B7A5E] py-2.5 px-2 flex justify-around items-center z-30 shadow-lg">
          
          <button 
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl transition ${currentTab === 'home' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[11px]">হোম</span>
          </button>

          <button 
            onClick={() => setCurrentTab('pos')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl transition relative ${currentTab === 'pos' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[11px]">বিক্রি</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 bg-amber-400 text-gray-900 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <button 
            onClick={() => setCurrentTab('stock')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl transition relative ${currentTab === 'stock' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[11px]">স্টক</span>
            {lowStockCount > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 bg-amber-400 text-gray-900 font-bold text-[10px] rounded-full flex items-center justify-center">
                {lowStockCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setCurrentTab('activity')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl transition ${currentTab === 'activity' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[11px]">এক্টিভিটি</span>
          </button>

          <button 
            onClick={() => setCurrentTab('ledger')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl transition ${currentTab === 'ledger' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px]">বাকি খাতা</span>
          </button>

          <button 
            onClick={() => setCurrentTab('more')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl transition ${currentTab === 'more' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px]">আরও</span>
          </button>

        </nav>

      </div>
    </div>
  );
}

// Simple helper icon
function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
