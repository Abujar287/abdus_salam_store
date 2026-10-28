/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

// Types
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

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'মিনা চাল (মিনিকেট) ৫০ কেজি', category: 'মুদি', stock: 12, unit: 'বস্তা', buyPrice: 3200, sellPrice: 3450, barcode: '1001', repName: 'আবুল কালাম', repPhone: '01711001122', searchTags: ['cal', 'chal', 'rice', 'miniket', 'চাল', 'মিনা চাল', 'miniket chal'] },
  { id: 'p2', name: 'ফ্রেশ সয়াবিন তেল ১ লিটার', category: 'তেল ও মসলা', stock: 8, unit: 'লিটার', buyPrice: 160, sellPrice: 175, barcode: '1002', repName: 'রফিকুল ইসলাম', repPhone: '01822334455', searchTags: ['oil', 'tel', 'soyabean', 'fresh', 'তেল', 'সয়াবিন তেল'] },
  { id: 'p3', name: 'রূপসী বাংলা চিনি ১ কেজি', category: 'মুদি', stock: 5, unit: 'কেজি', buyPrice: 125, sellPrice: 135, barcode: '1003', repName: 'আবুল কালাম', repPhone: '01711001122', searchTags: ['sugar', 'chini', 'cini', 'চিনি'] },
  { id: 'p4', name: 'দেশি মসুর ডাল (মোটা) ১ কেজি', category: 'মুদি', stock: 18, unit: 'কেজি', buyPrice: 110, sellPrice: 130, barcode: '1004', repName: 'নজরুল ইসলাম', repPhone: '01933445566', searchTags: ['dal', 'lentil', 'mosur', 'ডাল', 'মসুর ডাল'] },
  { id: 'p5', name: 'আড়ং ঘি ৫০০ গ্রাম', category: 'মুদি', stock: 3, unit: 'কোটা', buyPrice: 850, sellPrice: 950, barcode: '1005', repName: 'রফিকুল ইসলাম', repPhone: '01822334455', searchTags: ['ghee', 'ghii', 'aarong', 'ঘি'] },
  { id: 'p6', name: 'প্রাণ ফ্রুটো ১ লিটার', category: 'পানীয়', stock: 25, unit: 'বটল', buyPrice: 110, sellPrice: 130, barcode: '1006', repName: 'সোহেল রানা', repPhone: '01644556677', searchTags: ['juice', 'drink', 'fruto', 'pran', 'জুস', 'পানীয়', 'ফ্রুটো'] },
  { id: 'p7', name: 'রংধনু লবণ ১ কেজি', category: 'মুদি', stock: 45, unit: 'কেজি', buyPrice: 35, sellPrice: 40, barcode: '1007', repName: 'আবুল কালাম', repPhone: '01711001122', searchTags: ['salt', 'lobon', 'lobhon', 'লবণ'] },
  { id: 'p8', name: 'পার্লে জি বিস্কুট (বড় প্যাকেট)', category: 'বিস্কুট ও স্ন্যাক্স', stock: 6, unit: 'পিস', buyPrice: 45, sellPrice: 55, barcode: '1008', repName: 'সোহেল রানা', repPhone: '01644556677', searchTags: ['biscuit', 'biskut', 'parle', 'snacks', 'বিস্কুট'] },
  { id: 'p9', name: 'লাক্স সাবান (গোলাপী)', category: 'প্রসাধন', stock: 4, unit: 'পিস', buyPrice: 38, sellPrice: 45, barcode: '1009', repName: 'নজরুল ইসলাম', repPhone: '01933445566', searchTags: ['soap', 'saban', 'lux', 'সাবান'] },
  { id: 'p10', name: 'হলুদ গুঁড়া (রাঁধুনি) ২০০ গ্রাম', category: 'তেল ও মসলা', stock: 15, unit: 'প্যাকেট', buyPrice: 65, sellPrice: 78, barcode: '1010', repName: 'রফিকুল ইসলাম', repPhone: '01822334455', searchTags: ['turmeric', 'holud', 'masala', 'মসলা', 'হলুদ'] },
  { id: 'p11', name: 'সরিষার তেল (সাচী) ১ লিটার', category: 'তেল ও মসলা', stock: 2, unit: 'লিটার', buyPrice: 220, sellPrice: 250, barcode: '1011', repName: 'রফিকুল ইসলাম', repPhone: '01822334455', searchTags: ['mustard', 'oil', 'sorisha', 'সরিষার তেল'] },
  { id: 'p12', name: 'মরিচ গুঁড়া (রাঁধুনি) ২০০ গ্রাম', category: 'তেল ও মসলা', stock: 1, unit: 'প্যাকেট', buyPrice: 90, sellPrice: 110, barcode: '1012', repName: 'রফিকুল ইসলাম', repPhone: '01822334455', searchTags: ['chili', 'morich', 'powder', 'মরিচ গুঁড়া'] }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'রহিম মিয়া', phone: '01711234567', address: 'রায়পুর বাজার', dueAmount: 12500, lastPurchaseDate: '27-Oct-26', status: 'pending' },
  { id: 'c2', name: 'করিম উদ্দিন', phone: '01822345678', address: 'বাঘারপাড়া', dueAmount: 8400, lastPurchaseDate: '26-Oct-26', status: 'pending' },
  { id: 'c3', name: 'আমেনা বেগম', phone: '01933456789', address: 'যশোর রোড', dueAmount: 0, lastPurchaseDate: '25-Oct-26', status: 'clear' },
  { id: 'c4', name: 'আব্দুল জব্বার', phone: '01644567890', address: 'স্টেশন রোড', dueAmount: 15600, lastPurchaseDate: '24-Oct-26', status: 'pending' },
  { id: 'c5', name: 'শরিফুল ইসলাম', phone: '01555678901', address: 'মাস্টার পাড়া', dueAmount: 6000, lastPurchaseDate: '23-Oct-26', status: 'pending' }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    invoiceNo: 'SAL-2026-101',
    customerName: 'রহিম মিয়া',
    customerPhone: '01711234567',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_PRODUCTS[1], quantity: 2 }
    ],
    subtotal: 3800,
    discount: 50,
    total: 3750,
    paid: 1000,
    due: 2750,
    paymentType: 'credit',
    date: '28-Oct-26',
    rawDate: '2026-10-28',
    status: 'pending'
  },
  {
    id: 'ord-102',
    invoiceNo: 'SAL-2026-100',
    customerName: 'নগদ ক্রেতা',
    customerPhone: '-',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 2 },
      { product: INITIAL_PRODUCTS[5], quantity: 3 }
    ],
    subtotal: 660,
    discount: 10,
    total: 650,
    paid: 650,
    due: 0,
    paymentType: 'cash',
    date: '28-Oct-26',
    rawDate: '2026-10-28',
    status: 'completed'
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'pos' | 'stock' | 'ledger' | 'more'>('home');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  
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

  // States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [newCustomersCountToday, setNewCustomersCountToday] = useState<number>(3);
  
  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posCustomerType, setPosCustomerType] = useState<'cash' | 'existing' | 'new'>('cash');
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<string>(INITIAL_CUSTOMERS[0].name);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');

  const [posSearchQuery, setPosSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('সব');
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [cashPaidInput, setCashPaidInput] = useState<string>('');
  
  const [printPreviewOrder, setPrintPreviewOrder] = useState<Order | null>(null);
  const [successModal, setSuccessModal] = useState<Order | null>(null);

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
  const [newProductStock, setNewProductStock] = useState(10);
  const [newProductUnit, setNewProductUnit] = useState('কেজি');
  const [newProductBuy, setNewProductBuy] = useState(100);
  const [newProductSell, setNewProductSell] = useState(120);
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

  const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6qXyoYua4tUchRlaa0mH78EXxgbvmRWmVpWfxv5v4_At4_QGvwS13H8ruZf1J3bGBeA/exec';

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const formattedBikri = orders.flatMap(o => 
        o.items.map(item => ({
          'invoice no': o.invoiceNo,
          'date': o.date,
          'product name': item.product.name,
          'category': item.product.category,
          'cost': item.product.buyPrice * item.quantity,
          'sales': item.product.sellPrice * item.quantity,
          'discount': Math.round(o.discount / o.items.length),
          'baki': Math.round(o.due / o.items.length),
          'payment method': o.paymentType,
          'profit': (item.product.sellPrice - item.product.buyPrice) * item.quantity
        }))
      );

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
      const encodedData = encodeURIComponent(jsonStr);

      // Method 1: Standard POST text/plain
      fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: jsonStr
      }).catch(() => {});

      // Method 2: POST form-urlencoded
      fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodedData
      }).catch(() => {});

      // Method 3: GET query parameter
      fetch(`${GOOGLE_SHEET_WEB_APP_URL}?action=syncData&data=${encodedData}`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(() => {});

    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
      setSyncTime('28-Oct-2026 3:58PM');
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

    if (posCustomerType === 'existing') {
      finalCustomerName = selectedExistingCustomer;
      const found = customers.find(c => c.name === selectedExistingCustomer);
      if (found) finalCustomerPhone = found.phone;
    } else if (posCustomerType === 'new') {
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
    const paidAmt = cashPaidInput !== '' ? Number(cashPaidInput) : (posCustomerType === 'cash' ? tot : 0);
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
    if (posCustomerType === 'new' && newCustName.trim()) {
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
  const totalCustomersCount = customers.length + 120;
  const newCustomersCount = timeframe === 'today' ? newCustomersCountToday : (timeframe === 'week' ? 18 : 35);
  
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
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-['Hind_Siliguri',sans-serif] flex flex-col items-center">
      
      {/* Main Container wrapper: automatically adapts to mobile frame when width < 768px, or widescreen desktop when >= 768px */}
      <div className={`w-full transition-all duration-300 ${isMobileView ? 'max-w-md my-0 md:my-4 shadow-2xl rounded-none md:rounded-3xl overflow-hidden bg-[#F3F4F6] relative min-h-screen md:min-h-[844px] flex flex-col' : 'max-w-6xl my-4 shadow-2xl rounded-2xl bg-[#F3F4F6] relative min-h-[900px] flex flex-col border border-gray-200'}`}>
        
        {/* App Header */}
        <div className="bg-[#113F33] text-white px-3 py-2.5 shadow-md flex items-center justify-between">
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
            <button 
              onClick={handleSync}
              className="flex items-center gap-1 bg-[#1B7A5E] hover:bg-[#155e48] text-white px-2 py-0.5 rounded-lg transition text-[9px] shadow-sm font-medium"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">Last Sync: {syncTime}</span>
            </button>
            <button 
              onClick={() => setIsScriptModalOpen(true)}
              title="গুগল শিট স্ক্রিপ্ট কোড দেখুন"
              className="p-1 rounded-lg bg-[#1B7A5E]/80 hover:bg-[#1B7A5E] text-white transition text-[10px]"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto pb-24">
          
          {/* ================= 1. HOME / DASHBOARD SCREEN ================= */}
          {currentTab === 'home' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Timeframe selector tabs */}
              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200 text-sm font-medium">
                <button 
                  onClick={() => setTimeframe('today')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${timeframe === 'today' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  আজ
                </button>
                <button 
                  onClick={() => setTimeframe('week')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${timeframe === 'week' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  গত সপ্তাহ
                </button>
                <button 
                  onClick={() => setTimeframe('month')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${timeframe === 'month' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  এই মাস
                </button>
              </div>

              {/* Summary Cards Grid */}
              <div className={`grid gap-3 ${isMobileView ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-6'}`}>
                
                {/* 1. অর্ডার */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-3 -mt-3 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-xs font-medium">অর্ডার</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <ShoppingBagIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{totalOrdersCount}</div>
                    <div className="text-[11px] text-blue-600 font-medium mt-1">সফল লেনদেন</div>
                  </div>
                </div>

                {/* 2. গ্রাহক */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-3 -mt-3 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-xs font-medium">গ্রাহক</span>
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{totalCustomersCount}</div>
                    <div className="text-[11px] text-indigo-600 font-medium mt-1">রেজিস্টার্ড ক্রেতা</div>
                  </div>
                </div>

                {/* 3. নতুন গ্রাহক */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -mr-3 -mt-3 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-xs font-medium">নতুন গ্রাহক</span>
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{newCustomersCount}</div>
                    <div className="text-[11px] text-purple-600 font-medium mt-1">যুক্ত হয়েছেন</div>
                  </div>
                </div>

                {/* 4. বিক্রি */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-3 -mt-3 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-xs font-medium">বিক্রি</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#113F33] flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{totalSalesAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">টার্নওভার</div>
                  </div>
                </div>

                {/* 5. লাভ */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 rounded-bl-full -mr-3 -mt-3 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-xs font-medium">লাভ</span>
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-emerald-700">{totalProfitAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-teal-600 font-medium mt-1">নিট প্রফিট</div>
                  </div>
                </div>

                {/* 6. প্রতিনিধি পরিশোধ */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-3 -mt-3 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-xs font-medium">প্রতিনিধি পরিশোধ</span>
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-orange-700">{totalRepPayment.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-orange-600 font-medium mt-1">কমিশন / পরিশোধ</div>
                  </div>
                </div>

              </div>

              {/* তারিখভিত্তিক ইতিহাস (Compact vertical card layout to prevent awkward scrolling) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#1B7A5E]" /> তারিখভিত্তিক ইতিহাস (October 2026)
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">অটো</span>
                </div>

                <div className="p-3 space-y-2.5">
                  {dateHistoryList.map((record, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-200 flex flex-col space-y-2 text-xs shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                        <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#1B7A5E]" /> {record.date}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          অর্ডার: {record.totalOrders}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">বিক্রি</span>
                          <span className="font-bold text-emerald-700 text-sm">{record.totalSales.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">গ্রাহক / নতুন</span>
                          <span className="font-bold text-gray-800 text-sm">{record.totalCustomers} / {record.totalNewCustomers}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">লাভ</span>
                          <span className="font-bold text-teal-700 text-sm">{record.totalProfit.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">প্রতিনিধি পরিশোধ</span>
                          <span className="font-bold text-orange-700 text-sm">{record.totalRepPayment.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= 2. POS / SALES SCREEN (নতুন বিক্রি) ================= */}
          {currentTab === 'pos' && (
            <div className={`p-4 space-y-4 animate-fadeIn ${!isMobileView ? 'max-w-4xl mx-auto' : ''}`}>
              
              {/* POS Top Header */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#1B7A5E]/10 text-[#1B7A5E]">
                      <ShoppingCart className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="font-bold text-sm text-gray-900">নতুন বিক্রি (POS কাউন্টার)</h2>
                      <p className="text-[11px] text-gray-500">গ্রাহক সিলেক্ট করে পণ্য যোগ করুন</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-50 text-[#1B7A5E] px-2.5 py-1 rounded-lg">
                    আইটেম: {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                </div>

                {/* Customer Selection Options */}
                <div className="space-y-2.5 pt-1 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-700 block">গ্রাহকের ধরন:</label>
                  
                  <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-medium">
                    <button 
                      onClick={() => setPosCustomerType('cash')}
                      className={`py-1.5 px-2 rounded-lg transition text-center ${posCustomerType === 'cash' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-white'}`}
                    >
                      নগদ ক্রেতা
                    </button>
                    <button 
                      onClick={() => setPosCustomerType('existing')}
                      className={`py-1.5 px-2 rounded-lg transition text-center ${posCustomerType === 'existing' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-white'}`}
                    >
                      পুরোনো ক্রেতা
                    </button>
                    <button 
                      onClick={() => setPosCustomerType('new')}
                      className={`py-1.5 px-2 rounded-lg transition text-center ${posCustomerType === 'new' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-white'}`}
                    >
                      নতুন ক্রেতা
                    </button>
                  </div>

                  {posCustomerType === 'existing' && (
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <User className="w-4 h-4 text-gray-500 ml-1" />
                      <select 
                        value={selectedExistingCustomer}
                        onChange={(e) => setSelectedExistingCustomer(e.target.value)}
                        className="bg-transparent text-sm font-medium text-gray-800 w-full focus:outline-none"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.phone}) - বাকি: {c.dueAmount}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {posCustomerType === 'new' && (
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 space-y-2">
                      <div className="text-[11px] font-bold text-[#113F33] flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> নতুন গ্রাহকের তথ্য দিন:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="গ্রাহকের নাম *"
                          value={newCustName}
                          onChange={(e) => setNewCustName(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#1B7A5E]"
                        />
                        <input 
                          type="text" 
                          placeholder="মোবাইল নম্বর"
                          value={newCustPhone}
                          onChange={(e) => setNewCustPhone(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#1B7A5E]"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="গ্রাম / ঠিকানা (ঐচ্ছিক)"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#1B7A5E]"
                      />
                    </div>
                  )}

                  {posCustomerType === 'cash' && (
                    <div className="text-[11px] text-gray-500 px-1">
                      সাধারণ নগদ বিক্রি (Walk-in Customer)
                    </div>
                  )}
                </div>
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

              {/* Product Grid */}
              <div className={`grid gap-2.5 ${!isMobileView ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {products
                  .filter(p => selectedCategoryFilter === 'সব' || p.category === selectedCategoryFilter)
                  .filter(p => matchesProductSearch(p, posSearchQuery))
                  .map(product => {
                    const isLow = product.stock <= 5;
                    return (
                      <div 
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 hover:border-[#1B7A5E] transition cursor-pointer flex flex-col justify-between group relative"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1 gap-1">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                              {product.category}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${isLow ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#D1FAE5] text-[#059669]'}`}>
                              স্টক: {product.stock} {product.unit}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs text-gray-900 line-clamp-2 mt-1 group-hover:text-[#1B7A5E] transition">
                            {product.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-[10px] text-gray-400">মূল্য</span>
                            <div className="font-bold text-sm text-[#113F33]">{product.sellPrice}</div>
                          </div>
                          <button className="w-7 h-7 rounded-xl bg-[#1B7A5E] text-white flex items-center justify-center shadow hover:bg-[#113F33] transition">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Cart Drawer / Bottom Summary */}
              {cart.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-[#1B7A5E] p-4 space-y-3 mt-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-[#1B7A5E]" /> কার্ট লিস্ট ({cart.reduce((s, i) => s + i.quantity, 0)})
                    </h3>
                    <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">
                      সব মুছুন
                    </button>
                  </div>

                  {/* Cart items list */}
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                        <div className="flex-1 pr-2">
                          <div className="text-xs font-bold text-gray-900 line-clamp-1">{item.product.name}</div>
                          <div className="text-[11px] text-gray-500">{item.product.sellPrice} × {item.quantity} = {item.product.sellPrice * item.quantity}</div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button onClick={() => updateCartQuantity(item.product.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.product.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center ml-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount, Totals & Paid Amount */}
                  <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>সাবটোটাল:</span>
                      <span className="font-bold">{cartSubtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>কমিশন / ডিসকাউন্ট:</span>
                      <input 
                        type="number"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(Math.max(0, Number(e.target.value)))}
                        className="w-20 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-right font-bold text-xs"
                      />
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#113F33] pt-1 border-t border-dashed border-gray-200">
                      <span>মোট প্রদেয়:</span>
                      <span className="text-base text-emerald-700">{cartTotal}</span>
                    </div>

                    {/* নগদ জমা (Paid Amount) */}
                    <div className="flex items-center justify-between pt-1 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                      <span className="font-bold text-[#113F33] flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> নগদ জমা (Paid):
                      </span>
                      <input 
                        type="number"
                        value={cashPaidInput}
                        placeholder={`${cartTotal} (পূর্ণ)`}
                        onChange={(e) => setCashPaidInput(e.target.value)}
                        className="w-28 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-right font-bold text-xs focus:outline-none focus:border-[#1B7A5E]"
                      />
                    </div>
                  </div>

                  {/* Print Memo & Submit Button */}
                  <button 
                    onClick={handlePreparePrintPreview}
                    className="w-full py-3 rounded-xl bg-[#1B7A5E] text-white font-bold text-sm shadow hover:bg-[#113F33] transition flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Printer className="w-4 h-4" /> মেমো প্রিন্ট করুন ও বিক্রি সম্পন্ন করুন
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ================= 3. STOCK MANAGEMENT SCREEN (স্টক) ================= */}
          {currentTab === 'stock' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Header & Add Product Button */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#1B7A5E]" /> স্টক ও ইনভেন্টরি
                  </h2>
                  <p className="text-[11px] text-gray-500">পণ্য মজুদ ও প্রতিনিধি তথ্য</p>
                </div>
                <button 
                  onClick={() => setIsAddProductOpen(true)}
                  className="bg-[#1B7A5E] text-white px-3 py-2 rounded-xl text-xs font-bold shadow hover:bg-[#113F33] transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> নতুন পণ্য
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

              {/* Search & Filter Tabs */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input 
                    type="text"
                    placeholder="পণ্য বা প্রতিনিধি খুঁজুন..."
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B7A5E] shadow-sm"
                  />
                </div>

                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200 text-xs font-medium">
                  <button 
                    onClick={() => setStockFilterTab('all')}
                    className={`flex-1 py-1.5 rounded-lg transition text-center ${stockFilterTab === 'all' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    সব পণ্য ({products.length})
                  </button>
                  <button 
                    onClick={() => setStockFilterTab('sufficient')}
                    className={`flex-1 py-1.5 rounded-lg transition text-center ${stockFilterTab === 'sufficient' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    পর্যাপ্ত স্টক
                  </button>
                  <button 
                    onClick={() => setStockFilterTab('low')}
                    className={`flex-1 py-1.5 rounded-lg transition text-center ${stockFilterTab === 'low' ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    কম স্টক ({lowStockCount})
                  </button>
                </div>
              </div>

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
                            onChange={(e) => setNewProductStock(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-center"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">ক্রয় মূল্য</label>
                          <input 
                            type="number" 
                            value={newProductBuy}
                            onChange={(e) => setNewProductBuy(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-center"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium block mb-1">বিক্রয় মূল্য</label>
                          <input 
                            type="number" 
                            value={newProductSell}
                            onChange={(e) => setNewProductSell(Number(e.target.value))}
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
                            stock: newProductStock,
                            unit: newProductUnit,
                            buyPrice: newProductBuy,
                            sellPrice: newProductSell,
                            barcode: `${Math.floor(2000 + Math.random() * 9000)}`,
                            repName: newProductRepName.trim() || 'নির্ধারিত নয়',
                            repPhone: newProductRepPhone.trim() || '01700000000',
                            searchTags: [newProductName.toLowerCase(), newProductCategory, newProductRepName.toLowerCase()]
                          };
                          setProducts([newProd, ...products]);
                          setIsAddProductOpen(false);
                          setNewProductName('');
                          setNewProductRepName('');
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

          {/* ================= 4. SALES LEDGER ("বাকি খাতা" SCREEN) ================= */}
          {currentTab === 'ledger' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Header & Total Due Banner */}
              <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-4 rounded-2xl shadow-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-red-700/80 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> বাকি খাতা (Credit Ledger)
                  </span>
                  <span className="text-xs text-red-200">বাকিদার গ্রাহক: {customers.filter(c => c.dueAmount > 0).length} জন</span>
                </div>
                <div>
                  <div className="text-xs text-red-200">সর্বমোট বকেয়া পাওনা</div>
                  <div className="text-2xl font-extrabold tracking-tight">{totalDueAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

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

              {/* Customer List (Only shows customers where dueAmount > 0) */}
              <div className="space-y-2.5">
                {customers
                  .filter(c => c.dueAmount > 0)
                  .filter(c => c.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || c.phone.includes(ledgerSearchQuery))
                  .map(customer => {
                    return (
                      <div 
                        key={customer.id} 
                        className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-200 hover:border-[#1B7A5E] transition space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-2.5">
                            <div className="w-10 h-10 rounded-xl bg-[#113F33] text-white flex items-center justify-center font-bold text-sm shadow">
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{customer.name}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-gray-400" /> {customer.phone} • {customer.address}
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">
                            পেন্ডিং
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                          <div>
                            <span className="text-gray-400">বাকি পরিমাণ: </span>
                            <span className="font-bold text-[#DC2626]">
                              {customer.dueAmount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setDepositModalCustomer(customer);
                                setDepositAmountInput(String(customer.dueAmount));
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#1B7A5E] font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" /> টাকা জমা নিন
                            </button>
                            <button 
                              onClick={() => alert(`${customer.name} (${customer.phone})-কে বাকি পরিশোধের এসএমএস পাঠানো হয়েছে।`)}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                              title="SMS Reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>
          )}

          {/* ================= 5. MORE / SETTINGS SCREEN (আরও) ================= */}
          {currentTab === 'more' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              
              {/* Profile Card */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl bg-[#113F33] text-white flex items-center justify-center font-bold text-xl shadow">
                  আ
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
                  <p className="text-[10px] text-gray-600 font-['Hind_Siliguri']">মুদিখানা ও ডিপার্টমেন্টাল স্টোর</p>
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
                      <span>ডিসকাউন্ট:</span>
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
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) {}
    }
    if ((!data || !data.bikri) && e && e.parameter && e.parameter.data) {
      try { data = JSON.parse(e.parameter.data); } catch(err) {}
    }

    // 1. Tab: bikri
    var bikriSheet = ss.getSheetByName('bikri') || ss.insertSheet('bikri');
    if (data.bikri && data.bikri.length > 0) {
      bikriSheet.clearContents();
      bikriSheet.appendRow(['invoice no', 'date', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit']);
      data.bikri.forEach(function(r) {
        bikriSheet.appendRow([r['invoice no']||'', r['date']||'', r['product name']||'', r['category']||'', r['cost']||0, r['sales']||0, r['discount']||0, r['baki']||0, r['payment method']||'', r['profit']||0]);
      });
    }

    // 2. Tab: stock
    var stockSheet = ss.getSheetByName('stock') || ss.insertSheet('stock');
    if (data.stock && data.stock.length > 0) {
      stockSheet.clearContents();
      stockSheet.appendRow(['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone']);
      data.stock.forEach(function(p) {
        stockSheet.appendRow([p.id, p.name, p.category, p.stock, p.unit, p.buyPrice, p.sellPrice, p.barcode, p.repName, p.repPhone]);
      });
    }

    // 3. Tab: bakir khata
    var bakiSheet = ss.getSheetByName('bakir khata') || ss.insertSheet('bakir khata');
    if (data['bakir khata'] && data['bakir khata'].length > 0) {
      bakiSheet.clearContents();
      bakiSheet.appendRow(['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'status']);
      data['bakir khata'].forEach(function(c) {
        bakiSheet.appendRow([c.id, c.name, c.phone, c.address, c.dueAmount, c.lastPurchaseDate, c.status]);
      });
    }

    // 4. Tab: catgeory
    var catSheet = ss.getSheetByName('catgeory') || ss.insertSheet('catgeory');
    if (data.catgeory && data.catgeory.length > 0) {
      catSheet.clearContents();
      catSheet.appendRow(['category_name']);
      data.catgeory.forEach(function(cat) {
        catSheet.appendRow([cat]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`function doPost(e) { return handleRequest(e); }\nfunction doGet(e) { return handleRequest(e); }\n\nfunction handleRequest(e) {\n  try {\n    var ss = SpreadsheetApp.getActiveSpreadsheet();\n    var data = {};\n    if (e && e.postData && e.postData.contents) {\n      try { data = JSON.parse(e.postData.contents); } catch(err) {}\n    }\n    if ((!data || !data.bikri) && e && e.parameter && e.parameter.data) {\n      try { data = JSON.parse(e.parameter.data); } catch(err) {}\n    }\n\n    var bikriSheet = ss.getSheetByName('bikri') || ss.insertSheet('bikri');\n    if (data.bikri && data.bikri.length > 0) {\n      bikriSheet.clearContents();\n      bikriSheet.appendRow(['invoice no', 'date', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit']);\n      data.bikri.forEach(function(r) {\n        bikriSheet.appendRow([r['invoice no']||'', r['date']||'', r['product name']||'', r['category']||'', r['cost']||0, r['sales']||0, r['discount']||0, r['baki']||0, r['payment method']||'', r['profit']||0]);\n      });\n    }\n\n    var stockSheet = ss.getSheetByName('stock') || ss.insertSheet('stock');\n    if (data.stock && data.stock.length > 0) {\n      stockSheet.clearContents();\n      stockSheet.appendRow(['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone']);\n      data.stock.forEach(function(p) {\n        stockSheet.appendRow([p.id, p.name, p.category, p.stock, p.unit, p.buyPrice, p.sellPrice, p.barcode, p.repName, p.repPhone]);\n      });\n    }\n\n    var bakiSheet = ss.getSheetByName('bakir khata') || ss.insertSheet('bakir khata');\n    if (data['bakir khata'] && data['bakir khata'].length > 0) {\n      bakiSheet.clearContents();\n      bakiSheet.appendRow(['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'status']);\n      data['bakir khata'].forEach(function(c) {\n        bakiSheet.appendRow([c.id, c.name, c.phone, c.address, c.dueAmount, c.lastPurchaseDate, c.status]);\n      });\n    }\n\n    var catSheet = ss.getSheetByName('catgeory') || ss.insertSheet('catgeory');\n    if (data.catgeory && data.catgeory.length > 0) {\n      catSheet.clearContents();\n      catSheet.appendRow(['category_name']);\n      data.catgeory.forEach(function(cat) {\n        catSheet.appendRow([cat]);\n      });\n    }\n\n    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);\n  } catch (err) {\n    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);\n  }\n}`);
                    alert('কোড কপি করা হয়েছে!');
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33] transition"
                >
                  কোড কপি করুন
                </button>
                <button 
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Consistent Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-[#113F33] text-emerald-100 border-t border-[#1B7A5E] py-2 px-2 flex justify-around items-center z-40 shadow-lg">
          
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
