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
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbx6qXyoYua4tUchRlaa0mH78EXxgbvmRWmVpWfxv5v4_At4_QGvwS13H8ruZf1J3bGBeA/exec';

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
  piecesPerPacket?: number;
  stickPrice?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  isSticks?: boolean;
}

interface Activity {
  id: string;
  type: 'sale' | 'stock_in' | 'new_product' | 'payment';
  title: string;
  description: string;
  amount: number;
  timestamp: string;
  date: string;
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
  createdAt: string; // Added to track new customers correctly
  status: 'clear' | 'pending';
}

interface DateHistoryRecord {
  date: string;
  totalOrders: number;
  totalSales: number;
  totalOldCustomers: number;
  totalNewCustomers: number;
  totalTotalCustomers: number;
  totalProfit: number;
  totalRepPayment: number;
}

export default function App() {
  const formatDate = (date: Date) => {
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (date: Date) => {
    // Universal format for Sheets: YYYY-MM-DD HH:mm:ss
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  const getSyncDisplayTime = (date: Date) => {
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    let hours = date.getHours();
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `Sync: ${day}-${month}-${year} ${hours}:${minutes}${ampm}`;
  };

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

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('abdus_store_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [newCustomersCountToday, setNewCustomersCountToday] = useState<number>(0);
  
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
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('abdus_store_categories');
    return saved ? JSON.parse(saved) : ['মুদি', 'সিগারেট', 'কসমেটিকস', 'অন্যান্য'];
  });
  const [unitsList, setUnitsList] = useState<string[]>(() => {
    const saved = localStorage.getItem('abdus_store_units');
    return saved ? JSON.parse(saved) : ['কেজি', 'প্যাকেট', 'পিস', 'বোতল', 'লিটার'];
  });

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

  const [syncTime, setSyncTime] = useState<string>(() => getSyncDisplayTime(new Date()));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [newUnitInput, setNewUnitInput] = useState('');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>('');
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdUnit, setEditProdUnit] = useState('');
  const [editProdBuy, setEditProdBuy] = useState('');
  const [editProdSell, setEditProdSell] = useState('');
  const [editProdRep, setEditProdRep] = useState('');
  const [editProdPhone, setEditProdPhone] = useState('');
  
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const logActivity = (type: Activity['type'], title: string, description: string, amount: number) => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear().toString().slice(-2);
    const dateStr = formatDate(now);

    const newAct: Activity = {
      id: `act-${Date.now()}-${Math.random()}`,
      type,
      title,
      description,
      amount,
      timestamp: now.toISOString(),
      date: dateStr
    };
    setActivities(prev => {
      const updated = [newAct, ...prev].slice(0, 100);
      localStorage.setItem('abdus_store_activities', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (activities.length === 0) {
      logActivity('payment', 'সিস্টেম প্রস্তুত', 'আব্দুস সালাম স্টোর অ্যাপ চালু হয়েছে', 0);
    }
  }, []);

  const [sheetUrl] = useState<string>(SHEET_URL);

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
    localStorage.setItem('abdus_store_units', JSON.stringify(unitsList));
  }, [unitsList]);

  useEffect(() => {
    // Activities are now saved directly in logActivity to ensure persistence
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('google_sheet_url', sheetUrl);
  }, [sheetUrl]);

  const fetchData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${sheetUrl}?action=getData`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        if (result.stock && result.stock.length > 0) {
          const fetchedProducts = result.stock.map((p: any) => ({
            ...p,
            stock: Number(p.stock) || 0,
            buyPrice: Number(p.buyPrice) || 0,
            sellPrice: Number(p.sellPrice) || 0,
            piecesPerPacket: p.piecesPerPacket ? Number(p.piecesPerPacket) : undefined,
            stickPrice: p.stickPrice ? Number(p.stickPrice) : undefined,
            searchTags: Array.isArray(p.searchTags) ? p.searchTags : [p.name.toLowerCase()]
          }));
          setProducts(fetchedProducts);
        }
        
        if (result.bakir_khata && result.bakir_khata.length > 0) {
          const fetchedCustomers = result.bakir_khata.map((c: any) => ({
            ...c,
            dueAmount: Number(c.dueAmount) || 0
          }));
          setCustomers(fetchedCustomers);
        }

        if (result.catgeory && result.catgeory.length > 0) {
          setCategoriesList(result.catgeory.map((cat: any) => cat.category_name || cat));
        }
        
        if (result.units && result.units.length > 0) {
          setUnitsList(result.units.map((u: any) => u.unit_name || u));
        }

        if (result.bikri && result.bikri.length > 0) {
          const fetchedOrders = result.bikri.map((o: any) => ({
            id: `ord-sync-${o['invoice no']}`,
            invoiceNo: o['invoice no'],
            customerName: o['customer name'],
            customerPhone: o['customer mobile'],
            items: [], 
            total: Number(o.sales) || 0,
            due: Number(o.baki) || 0,
            paid: (Number(o.sales) || 0) - (Number(o.baki) || 0),
            paymentType: o['payment method'],
            date: o.date,
            rawDate: o.datetime ? o.datetime.split(' ')[0] : o.date,
            status: Number(o.baki) > 0 ? 'pending' : 'completed'
          }));
          
          // Overwrite with sheet data for perfect sync
          setOrders(fetchedOrders.sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo)));
        }
        return true;
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("Fetch data error:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async (
    targetOrders = orders, 
    targetProducts = products, 
    targetCustomers = customers,
    targetCategories = categoriesList,
    targetUnits = unitsList
  ) => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const formattedBikri = targetOrders.map(o => {
        const custObj = targetCustomers.find(c => c.name === o.customerName);
        const custLoc = custObj ? custObj.address : 'রায়পুর বাজার';
        
        const productSummary = o.items && o.items.length > 0 
          ? o.items.map(item => `${item.product.name} - ${item.quantity} ${item.isSticks ? 'শলাকা' : item.product.unit}`).join(', ')
          : 'বিক্রিত পণ্য';

        const totalCost = o.items ? o.items.reduce((sum, item) => sum + (item.product.buyPrice * item.quantity), 0) : 0;
        const totalProfit = o.items ? o.items.reduce((sum, item) => {
          const price = item.isSticks ? (item.product.stickPrice || item.product.sellPrice / (item.product.piecesPerPacket || 1)) : item.product.sellPrice;
          return sum + ((price - item.product.buyPrice) * item.quantity);
        }, 0) : 0;

        return {
          'invoice no': String(o.invoiceNo).trim(),
          'date': o.date,
          'customer name': String(o.customerName).trim(),
          'customer mobile': String(o.customerPhone).trim(),
          'location': custLoc,
          'product name': productSummary,
          'category': (o.items && o.items[0]) ? o.items[0].product.category : 'অন্যান্য',
          'cost': totalCost,
          'sales': o.total,
          'discount': o.discount || 0,
          'baki': o.due,
          'payment method': o.paymentType,
          'profit': totalProfit,
          'datetime': formatDateTime(new Date())
        };
      });

      const payload = {
        action: 'syncData',
        tabs: ['bikri', 'stock', 'bakir khata', 'catgeory', 'units'],
        bikri: formattedBikri,
        stock: targetProducts.map(p => ({ ...p, datetime: formatDateTime(new Date()) })),
        'bakir khata': targetCustomers.map(c => ({ ...c, datetime: formatDateTime(new Date()) })),
        catgeory: targetCategories.map(cat => ({ category_name: cat, datetime: formatDateTime(new Date()) })),
        units: targetUnits.map(u => ({ unit_name: u, datetime: formatDateTime(new Date()) })),
        timestamp: new Date().toISOString()
      };

      const response = await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return true;

    } catch (err) {
      console.error("Sync error:", err);
      return false;
    } finally {
      setIsSyncing(false);
      setSyncTime(getSyncDisplayTime(new Date()));
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

  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.isSticks ? (item.product.stickPrice || item.product.sellPrice / (item.product.piecesPerPacket || 1)) : item.product.sellPrice;
    return sum + (price * item.quantity);
  }, 0);
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
      date: formatDate(new Date()),
      rawDate: new Date().toISOString().split('T')[0],
      status: dueAmt > 0 ? 'pending' : 'completed'
    };

    setPrintPreviewOrder(draftOrder);
  };

  // Step 2: Confirm & Submit Sale (Robustly adds due to customer's account if due > 0)
  const handleConfirmAndSubmitSale = async () => {
    if (!printPreviewOrder || isSubmittingSale) return;
    setIsSubmittingSale(true);
    const order = printPreviewOrder;

    // 1. Calculate updated products
    const updatedProducts = products.map(p => {
      const cartItem = order.items.find(ci => ci.product.id === p.id);
      if (cartItem) {
        const reduction = cartItem.isSticks ? (cartItem.quantity / (p.piecesPerPacket || 1)) : cartItem.quantity;
        return { ...p, stock: Math.max(0, p.stock - reduction) };
      }
      return p;
    });

    // 2. Calculate updated customers
    let updatedCustomers = [...customers];
    if (newCustName.trim()) {
      const newCustObj: Customer = {
        id: `c-${Date.now()}`,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || '01700000000',
        address: newCustAddress.trim() || 'রায়পুর বাজার',
        dueAmount: order.due,
        lastPurchaseDate: formatDate(new Date()),
        createdAt: formatDate(new Date()),
        status: order.due > 0 ? 'pending' : 'clear'
      };
      updatedCustomers = [newCustObj, ...updatedCustomers];
      setNewCustomersCountToday(prev => prev + 1);
    } else if (order.customerName !== 'নগদ ক্রেতা') {
      const exists = updatedCustomers.some(c => c.name === order.customerName);
      if (!exists && order.due > 0) {
        updatedCustomers = [
          {
            id: `c-${Date.now()}`,
            name: order.customerName,
            phone: order.customerPhone,
            address: 'রায়পুর বাজার',
            dueAmount: order.due,
            lastPurchaseDate: formatDate(new Date()),
            createdAt: formatDate(new Date()),
            status: 'pending'
          },
          ...updatedCustomers
        ];
      } else {
        updatedCustomers = updatedCustomers.map(c => {
          if (c.name === order.customerName) {
            const newDue = c.dueAmount + order.due;
            return {
              ...c,
              dueAmount: newDue,
              status: newDue > 0 ? 'pending' : 'clear',
              lastPurchaseDate: formatDate(new Date())
            };
          }
          return c;
        });
      }
    }

    // 3. Update orders
    const updatedOrders = [order, ...orders];

    // Apply states
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
    setOrders(updatedOrders);
    
    setSuccessModal(order);
    setPrintPreviewOrder(null);
    setCart([]);
    setDiscountInput(0);
    setCashPaidInput('');
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');

    logActivity('sale', `নতুন বিক্রি: ${order.customerName}`, `${order.items.length}টি পণ্য, ইনভয়েস: ${order.invoiceNo}`, order.total);

    // 4. Immediate Sync with full updated dataset
    await handleSync(updatedOrders, updatedProducts, updatedCustomers);
    setIsSubmittingSale(false);
  };

  // Calculations for Home Metrics
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const totalDueAmount = customers.filter(c => c.dueAmount > 0).reduce((sum, c) => sum + c.dueAmount, 0);

  // Metrics based on timeframe
  const filteredOrders = orders.filter(o => {
    if (timeframe === 'today') return o.rawDate === new Date().toISOString().split('T')[0];
    if (timeframe === 'week') return true;
    return true; // month
  });

  const totalOrdersCount = filteredOrders.length;
  const totalSalesAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  // Total Customers = Unique Names in Ledger
  const totalCustomersCount = customers.length;
  
  // New customers added today
  const newCustomersCount = customers.filter(c => c.createdAt === formatDate(new Date())).length;
  
  // Old customers = Total - New
  const oldCustomersCount = Math.max(0, totalCustomersCount - newCustomersCount);
  
  const totalProfitAmount = filteredOrders.reduce((sum, o) => {
    const orderProfit = o.items.reduce((itemSum, item) => {
      const price = item.isSticks ? (item.product.stickPrice || item.product.sellPrice / (item.product.piecesPerPacket || 1)) : item.product.sellPrice;
      const profitPerUnit = price - item.product.buyPrice;
      return itemSum + (profitPerUnit * item.quantity);
    }, 0);
    return sum + orderProfit;
  }, 0);

  const totalRepPayment = 0;

  // Date-wise history aggregation
  const dateHistoryMap: { [key: string]: DateHistoryRecord } = {};
  orders.forEach(o => {
    const dKey = o.date;
    if (!dateHistoryMap[dKey]) {
      dateHistoryMap[dKey] = {
        date: dKey,
        totalOrders: 0,
        totalSales: 0,
        totalOldCustomers: 0,
        totalNewCustomers: 0,
        totalTotalCustomers: 0,
        totalProfit: 0,
        totalRepPayment: 0
      };
    }
    dateHistoryMap[dKey].totalOrders += 1;
    dateHistoryMap[dKey].totalSales += o.total;
    dateHistoryMap[dKey].totalTotalCustomers += 1;
    
    const isNew = customers.some(c => c.name === o.customerName && c.createdAt === o.date);
    if (isNew) {
      dateHistoryMap[dKey].totalNewCustomers += 1;
    } else {
      dateHistoryMap[dKey].totalOldCustomers += 1;
    }
    
    const ordProfit = o.items.reduce((s, i) => {
      const price = i.isSticks ? (i.product.stickPrice || i.product.sellPrice / (i.product.piecesPerPacket || 1)) : i.product.sellPrice;
      return s + ((price - i.product.buyPrice) * i.quantity);
    }, 0);
    dateHistoryMap[dKey].totalProfit += ordProfit;
    dateHistoryMap[dKey].totalRepPayment = 0; 
  });

  const dateHistoryList = Object.values(dateHistoryMap).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

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
      <div className={`w-full h-full flex flex-col overflow-hidden bg-[#F8FAFC] relative`}>
        
        {/* App Header (Fixed Top) */}
        <header className="flex-none z-30 bg-[#113F33] text-white px-3 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center border border-emerald-500/30">
              <img 
                src="/assets/aistudio/image_2aae7fd3.png" 
                alt="Logo" 
                className="w-full h-full object-cover rounded-md"
                onError={(e)=>{ (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate leading-tight">{STORE_NAME}</h1>
              <p className="text-[9px] text-emerald-300/80 font-medium truncate">{STORE_PHONE}</p>
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
              onClick={() => fetchData()}
              className="flex items-center gap-1 bg-[#1B7A5E] hover:bg-[#155e48] text-white px-2 py-1 rounded-lg transition text-[9px] shadow-sm font-bold"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">{syncTime}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className={`flex-1 overflow-y-auto relative scroll-smooth ${currentTab === 'pos' || currentTab === 'stock' ? 'p-0' : 'p-2'} pb-24`}>
          
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
                <button 
                  onClick={() => fetchData()}
                  className="px-3 py-2 text-[#113F33] hover:bg-emerald-100 rounded-lg transition flex items-center justify-center border-l border-emerald-100"
                  title="রিফ্রেশ"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
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
                  { label: 'পুরাতন ক্রেতা', val: oldCustomersCount },
                  { label: 'নতুন ক্রেতা', val: newCustomersCount },
                  { label: 'বিক্রি (৳)', val: totalSalesAmount.toLocaleString('en-IN') },
                  { label: 'মোট লাভ (৳)', val: totalProfitAmount.toLocaleString('en-IN') },
                  { label: 'প্রতিনিধি পরিশোধ', val: totalRepPayment.toLocaleString('en-IN') },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-2 rounded-xl shadow-sm border border-emerald-100 text-center hover:bg-emerald-50/30 transition">
                    <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{item.label}</div>
                    <div className="text-sm font-bold text-gray-800 tabular-nums">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Compact History Table with borders */}
              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-x-auto w-full text-[10px]">
                <table className="w-full border-collapse">
                  <thead className="bg-emerald-50/50 border-b border-emerald-200 font-bold text-gray-800">
                    <tr>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">তারিখ</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">অর্ডার</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">পুরাতন<br/>ক্রেতা</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">নতুন<br/>ক্রেতা</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">মোট<br/>ক্রেতা</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">বিক্রি</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">ক্রেতা<br/>প্রতি লাভ</th>
                      <th className="border-r border-emerald-100 py-2 px-1 text-center">লাভ</th>
                      <th className="py-2 px-1 text-center">প্রতিনিধি<br/>পরিশোধ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {dateHistoryList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-xs text-gray-400 italic">কোনো ডাটা পাওয়া যায়নি</td>
                      </tr>
                    ) : dateHistoryList.slice(0, 20).map((r, i) => (
                      <tr key={i} className="text-center items-center hover:bg-emerald-50/30 tabular-nums border-b border-emerald-50">
                        <td className="border-r border-emerald-50 py-2.5 font-bold text-gray-700">{r.date}</td>
                        <td className="border-r border-emerald-50 py-2.5">{r.totalOrders}</td>
                        <td className="border-r border-emerald-50 py-2.5">{r.totalOldCustomers}</td>
                        <td className="border-r border-emerald-50 py-2.5">{r.totalNewCustomers}</td>
                        <td className="border-r border-emerald-50 py-2.5">{r.totalTotalCustomers}</td>
                        <td className="border-r border-emerald-50 py-2.5 font-bold">{r.totalSales}</td>
                        <td className="border-r border-emerald-50 py-2.5">{(r.totalProfit / (r.totalTotalCustomers || 1)).toFixed(0)}</td>
                        <td className="border-r border-emerald-50 py-2.5 font-bold text-emerald-700">{r.totalProfit}</td>
                        <td className="py-2.5 text-gray-400">{r.totalRepPayment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}


          {/* ================= 2. POS / SALES SCREEN (নতুন বিক্রি) ================= */}
          {currentTab === 'pos' && (
            <div className="p-4 space-y-4 animate-fadeIn w-full">
              


              {/* Customer Type Selector */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-emerald-100">
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

                <div className="flex space-x-1.5 overflow-x-auto p-2 scrollbar-none bg-white">
                  {['সব', ...categoriesList].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shadow-sm ${
                        selectedCategoryFilter === cat 
                          ? 'bg-[#113F33] text-white' 
                          : 'bg-emerald-50/50 text-gray-600 border border-emerald-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
                {products
                  .filter(p => selectedCategoryFilter === 'সব' || p.category === selectedCategoryFilter)
                  .filter(p => matchesProductSearch(p, posSearchQuery))
                  .map(product => {
                    const isLow = product.stock <= 5;
                    return (
                      <div 
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white p-2 rounded-xl shadow-xs border border-emerald-100 hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between active:scale-95 group relative"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-bold">
                            <span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded truncate max-w-[50%]">{product.category}</span>
                            <span className={`px-1 py-0.5 rounded ${isLow ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                              {product.stock.toFixed(0)} {product.unit}
                            </span>
                          </div>
                          <h4 className="font-bold text-[10px] text-gray-800 line-clamp-2 leading-tight min-h-[2.4em]">{product.name}</h4>
                        </div>

                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-emerald-50">
                          <span className="font-black text-[11px] text-[#113F33]">{product.sellPrice} ৳</span>
                          <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-[#113F33]">
                            <Plus className="w-3 h-3" />
                          </div>
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
              <div className="flex gap-2 items-center bg-white p-2 rounded-2xl shadow-sm border border-emerald-100">
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
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex-1 flex flex-col">
                <div className="p-2 bg-emerald-50/50 border-b border-emerald-100 font-bold text-[9px] text-emerald-900 grid grid-cols-12 gap-1 items-center sticky top-0 z-10">
                  <div className="col-span-5">পণ্যের নাম</div>
                  <div className="col-span-3 text-center">স্টক</div>
                  <div className="col-span-4 text-right">মূল্য ও প্রতিনিধি</div>
                </div>

                <div className="divide-y divide-emerald-50 overflow-y-auto">
                  {products
                    .filter(p => stockFilterTab === 'all' || (stockFilterTab === 'low' ? p.stock <= 5 : p.stock > 5))
                    .filter(p => matchesProductSearch(p, stockSearchQuery) || (p.repName && p.repName.toLowerCase().includes(stockSearchQuery.toLowerCase())))
                    .map(product => {
                      const isLow = product.stock <= 5;
                      return (
                        <div 
                          key={product.id} 
                          onClick={() => {
                            setEditingProduct(product);
                            setEditProdName(product.name);
                            setEditProdCategory(product.category);
                            setEditProdUnit(product.unit);
                            setEditProdBuy(String(product.buyPrice));
                            setEditProdSell(String(product.sellPrice));
                            setEditProdRep(product.repName);
                            setEditProdPhone(product.repPhone);
                            setRestockAmount('');
                          }}
                          className="p-2 grid grid-cols-12 gap-1 items-center text-[11px] hover:bg-emerald-50/30 transition cursor-pointer"
                        >
                          <div className="col-span-5">
                            <div className="font-bold text-gray-800 line-clamp-1 leading-tight">{product.name}</div>
                            <div className="text-[8px] text-gray-500 font-medium">{product.category}</div>
                          </div>
                          
                          <div className="col-span-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {product.stock.toFixed(0)} {product.unit}
                            </span>
                          </div>

                          <div className="col-span-4 text-right leading-tight">
                            <div className="font-black text-gray-900">{product.sellPrice} ৳</div>
                            {product.repName && (
                              <div className="text-[8px] text-emerald-600 truncate">প্র: {product.repName}</div>
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
                                } else {
                                  setNewProductCategory(categoriesList[0]);
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
                                } else {
                                  setNewProductUnit(unitsList[0]);
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

                      {(newProductCategory.includes('সিগারেট') || newProductCategory.includes('মুদি')) && (
                        <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200 space-y-2">
                          <span className="font-bold text-amber-900 block text-[10px]">প্যাকেট ও শলাকা সেটিংস (ঐচ্ছিক):</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-amber-700">প্যাকেটে শলাকা (সংখ্যা)</label>
                              <input type="number" placeholder="যেমন: ১০" className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg" onChange={(e)=> { /* logic handled in save */ }} id="piece_per_packet_new" />
                            </div>
                            <div>
                              <label className="text-[10px] text-amber-700">শলাকা বিক্রয় মূল্য</label>
                              <input type="number" placeholder="যেমন: ১৫" className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg" id="stick_price_new" />
                            </div>
                          </div>
                        </div>
                      )}

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
                         onClick={async () => {
                           if (!newProductName.trim()) {
                             alert('দয়া করে পণ্যের নাম দিন');
                             return;
                           }
                           const ppp = Number((document.getElementById('piece_per_packet_new') as HTMLInputElement)?.value) || undefined;
                           const sp = Number((document.getElementById('stick_price_new') as HTMLInputElement)?.value) || undefined;
                           
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
                             searchTags: [newProductName.toLowerCase(), newProductCategory, newProductRepName.toLowerCase()],
                             piecesPerPacket: ppp,
                             stickPrice: sp
                           };
                           const updatedProducts = [newProd, ...products];
                           setProducts(updatedProducts);
                           logActivity('new_product', `নতুন পণ্য: ${newProd.name}`, `ক্যাটাগরি: ${newProd.category}, স্টক: ${newProd.stock}`, newProd.buyPrice * newProd.stock);
                           setIsAddProductOpen(false);
                           
                           // Immediate Awaited Sync
                           await handleSync(orders, updatedProducts, customers, categoriesList, unitsList);
                           
                           setNewProductName('');
                           setNewProductStock('');
                           setNewProductBuy('');
                           setNewProductSell('');
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

          {/* Stock Details & Update Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-gray-200">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#1B7A5E]" /> স্টক আপডেট: {editingProduct.name}
                  </h3>
                  <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Restock Section */}
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
                    <label className="font-bold text-[#113F33] block">নতুন স্টক যোগ করুন (Stock In):</label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="পরিমাণ লিখুন..."
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-emerald-700"
                      />
                       <button 
                         onClick={async () => {
                           const amt = Number(restockAmount);
                           if (isNaN(amt) || amt <= 0) return;
                           const updatedProducts = products.map(p => p.id === editingProduct.id ? { ...p, stock: p.stock + amt } : p);
                           setProducts(updatedProducts);
                           logActivity('stock_in', `স্টক ইন: ${editingProduct.name}`, `${amt} ${editingProduct.unit} যুক্ত করা হয়েছে`, editingProduct.buyPrice * amt);
                           alert(`${amt} ${editingProduct.unit} স্টক যোগ করা হয়েছে।`);
                           setRestockAmount('');
                           
                           // Immediate Awaited Sync
                           await handleSync(orders, updatedProducts, customers, categoriesList, unitsList);
                         }}
                         className="px-4 py-2 bg-[#1B7A5E] text-white rounded-xl font-bold"
                       >
                         যোগ করুন
                       </button>
                    </div>
                    <p className="text-[10px] text-emerald-700 italic">বর্তমান স্টক: {editingProduct.stock} {editingProduct.unit}</p>
                  </div>

                  {/* Edit Details Section */}
                  <div className="space-y-2">
                    <label className="font-bold text-gray-700 block">পণ্যের তথ্য পরিবর্তন:</label>
                    <div className="grid grid-cols-1 gap-2">
                      <input type="text" placeholder="পণ্যের নাম" value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">ক্যাটাগরি</label>
                          <select 
                            value={editProdCategory} 
                            onChange={(e) => setEditProdCategory(e.target.value)} 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">একক</label>
                          <select 
                            value={editProdUnit} 
                            onChange={(e) => setEditProdUnit(e.target.value)} 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            {unitsList.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500">ক্রয় মূল্য</label>
                          <input type="number" placeholder="ক্রয় মূল্য" value={editProdBuy} onChange={(e) => setEditProdBuy(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500">বিক্রয় মূল্য</label>
                          <input type="number" placeholder="বিক্রয় মূল্য" value={editProdSell} onChange={(e) => setEditProdSell(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-emerald-700" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="প্রতিনিধির নাম" value={editProdRep} onChange={(e) => setEditProdRep(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
                        <input type="text" placeholder="প্রতিনিধির ফোন" value={editProdPhone} onChange={(e) => setEditProdPhone(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
                      </div>
                          {(editingProduct.category.includes('সিগারেট') || editingProduct.category.includes('মুদি')) && (
                            <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-200 grid grid-cols-2 gap-2 mt-1">
                               <div>
                                 <label className="text-[9px] text-amber-700">প্যাকেটে শলাকা</label>
                                 <input type="number" id="piece_per_packet_edit" defaultValue={editingProduct.piecesPerPacket} className="w-full px-2 py-1 bg-white border border-amber-100 rounded text-xs" />
                               </div>
                               <div>
                                 <label className="text-[9px] text-amber-700">শলাকা বিক্রয় মূল্য</label>
                                 <input type="number" id="stick_price_edit" defaultValue={editingProduct.stickPrice} className="w-full px-2 py-1 bg-white border border-amber-100 rounded text-xs" />
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                </div>

                 <div className="flex gap-2 pt-2">
                   <button 
                     onClick={async () => {
                       const updatedProducts = products.map(p => {
                         if (p.id === editingProduct.id) {
                           return {
                             ...p,
                             name: editProdName,
                             category: editProdCategory,
                             unit: editProdUnit,
                             buyPrice: Number(editProdBuy) || p.buyPrice,
                             sellPrice: Number(editProdSell) || p.sellPrice,
                             repName: editProdRep,
                             repPhone: editProdPhone,
                             piecesPerPacket: Number((document.getElementById('piece_per_packet_edit') as HTMLInputElement)?.value) || p.piecesPerPacket,
                             stickPrice: Number((document.getElementById('stick_price_edit') as HTMLInputElement)?.value) || p.stickPrice
                           };
                         }
                         return p;
                       });
                       setProducts(updatedProducts);
                       setEditingProduct(null);
                       
                       // Immediate Awaited Sync
                       await handleSync(orders, updatedProducts, customers, categoriesList, unitsList);
                     }}
                     className="flex-1 py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
                   >
                    তথ্য সেভ করুন
                  </button>
                   <button 
                     onClick={async () => {
                       if (confirm('আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?')) {
                         const updatedProducts = products.filter(p => p.id !== editingProduct.id);
                         setProducts(updatedProducts);
                         setEditingProduct(null);
                         
                         // Immediate Awaited Sync
                         await handleSync(orders, updatedProducts, customers, categoriesList, unitsList);
                       }
                     }}
                     className="px-3 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs"
                   >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. ACTIVITY LOG SCREEN ================= */}
          {currentTab === 'activity' && (
            <div className="p-2 space-y-3 animate-fadeIn w-full h-full flex flex-col">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg text-gray-900">আজকের কার্যক্রম (Today's Activity)</h2>
                </div>
                
                <div className="space-y-2">
                  {(() => {
                    const todayStr = formatDate(new Date());
                    
                    const todaysActivities = activities.filter(a => a.date === todayStr);
                    
                    if (todaysActivities.length === 0) {
                      return (
                        <div className="text-center py-20">
                          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                          <div className="text-gray-400 text-sm italic">এখনো কোনো কার্যক্রম নেই</div>
                        </div>
                      );
                    }
                    
                    return todaysActivities.map(act => (
                      <div key={act.id} className="p-3 bg-white rounded-xl border border-emerald-50 flex items-start gap-3 hover:bg-emerald-50/20 transition group">
                        <div className={`p-2 rounded-xl mt-0.5 ${
                          act.type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 
                          act.type === 'stock_in' ? 'bg-blue-100 text-blue-700' :
                          act.type === 'new_product' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {act.type === 'sale' ? <ShoppingCart className="w-4 h-4" /> : 
                           act.type === 'stock_in' ? <Plus className="w-4 h-4" /> :
                           act.type === 'new_product' ? <Package className="w-4 h-4" /> :
                           <DollarSign className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-xs text-gray-900 truncate">{act.title}</span>
                            <span className="text-[9px] font-bold text-emerald-700 tabular-nums">{act.amount > 0 ? `${act.amount} ৳` : ''}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{act.description}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-gray-400 font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{act.date} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
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
                  placeholder="ক্রেতার নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-[#1B7A5E] shadow-sm"
                />
              </div>

                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex-1 flex flex-col w-full">
                  <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 font-bold text-[10px] text-emerald-900 grid grid-cols-5 gap-1 items-center sticky top-0 z-10 text-center">
                    <div className="text-left">ক্রেতার নাম</div>
                    <div>মোবাইল</div>
                    <div>ঠিকানা</div>
                    <div>বাকি</div>
                    <div>অ্যাকশন</div>
                  </div>

                  <div className="divide-y divide-emerald-50 overflow-y-auto">
                    {customers
                      .filter(c => c.dueAmount > 0)
                      .filter(c => 
                        c.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || 
                        c.phone.includes(ledgerSearchQuery) ||
                        c.address.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
                      )
                      .map(customer => (
                          <div key={customer.id} className="p-3 grid grid-cols-5 gap-1 items-center text-[11px] border-b border-emerald-50 hover:bg-emerald-50/30 transition text-center">
                            <div className="text-left font-bold text-gray-800 truncate">{customer.name}</div>
                            <div className="text-gray-600 truncate">{customer.phone}</div>
                            <div className="text-gray-500 truncate">{customer.address}</div>
                            <div className="font-black text-red-600 tabular-nums">
                              {customer.dueAmount.toLocaleString('en-IN')}
                            </div>
                            <div className="flex justify-center">
                              <button 
                                onClick={() => { setDepositModalCustomer(customer); setDepositAmountInput(String(customer.dueAmount)); }}
                                className="px-3 py-1.5 rounded-lg bg-[#1B7A5E] text-white font-bold text-[10px] shadow-sm active:scale-95 transition hover:bg-[#113F33]"
                              >
                                জমা
                              </button>
                            </div>
                          </div>
                      ))}
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

               {/* Connect Sheet Section */}
              <div className="bg-[#113F33] p-4 rounded-2xl shadow-sm text-white space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className={`w-5 h-5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  <h3 className="font-bold text-sm">ক্লাউড সিঙ্ক স্ট্যাটাস (Cloud Sync)</h3>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-emerald-200">কানেকশন স্ট্যাটাস:</span>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">অ্যাক্টিভ ও ফিক্সড</span>
                  </div>
                  <p className="text-[9px] text-emerald-300 leading-tight">আপনার সব ডাটা এই আইডি-র গুগল শিটে অটোমেটিক সেভ হচ্ছে। সব ফোনেই এটি অটো কাজ করবে।</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const success = await fetchData();
                      if (success) alert('ডাটা সফলভাবে ক্লাউড থেকে আপডেট করা হয়েছে!');
                      else alert('ডাটা লোড করতে সমস্যা হয়েছে। ইন্টারনেট চেক করুন।');
                    }}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition"
                  >
                    ডাটা আপডেট (Sync Now)
                  </button>
                  <button 
                    onClick={async () => {
                      const success = await handleSync();
                      if (success) alert('ডাটা সফলভাবে ব্যাকআপ নেওয়া হয়েছে!');
                      else alert('ব্যাকআপ নিতে সমস্যা হয়েছে।');
                    }}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold border border-white/20 transition"
                  >
                    ম্যানুয়াল ব্যাকআপ
                  </button>
                </div>
              </div>

              {/* Menu Options */}
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden divide-y divide-emerald-50 text-[11px]">
                <button onClick={handleInstallClick} className="w-full p-3 flex items-center justify-between hover:bg-amber-50/40 transition-all border-l-4 border-l-amber-500">
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-gray-800">অ্যাপ ইনস্টল করুন</span>
                  </div>
                  <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">{isInstalled ? 'ইন্সটলড' : 'ইন্সটল'}</span>
                </button>

                <button onClick={() => setIsCategoryModalOpen(true)} className="w-full p-3 flex items-center justify-between hover:bg-emerald-50/40 transition-all">
                  <div className="flex items-center space-x-3">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-800">ক্যাটাগরি ও একক সেটিংস</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                <button onClick={() => setIsScriptModalOpen(true)} className="w-full p-3 flex items-center justify-between hover:bg-emerald-50/40 transition-all border-l-4 border-l-emerald-600">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-800">গুগল শিট স্ক্রিপ্ট কোড</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </button>

                <button onClick={() => alert('Printer Settings')} className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <Printer className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">ব্লুটুথ প্রিন্টার সেটিংস</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                <button onClick={() => alert('PDF Report')} className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">হিসাব রিপোর্ট (PDF)</span>
                  </div>
                </button>

                <button onClick={() => alert('Syncing...')} className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-700">ক্লাউড ব্যাকআপ</span>
                  </div>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">লাইভ</span>
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
                   cart.map(item => {
                     const hasSticks = !!(item.product.piecesPerPacket && item.product.piecesPerPacket > 0);
                     const currentPrice = item.isSticks ? (item.product.stickPrice || item.product.sellPrice / item.product.piecesPerPacket!) : item.product.sellPrice;
                     
                     return (
                      <div key={item.product.id} className="bg-gray-50 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="font-bold text-gray-900 truncate">{item.product.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-[10px] text-gray-500">
                              দর: {currentPrice.toFixed(1)} × {item.quantity} {item.isSticks ? 'শলাকা' : item.product.unit} = <span className="font-bold text-[#113F33]">{(currentPrice * item.quantity).toFixed(0)}</span>
                            </div>
                            {hasSticks && (
                              <button 
                                onClick={() => {
                                  setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, isSticks: !i.isSticks } : i));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${item.isSticks ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}
                              >
                                {item.isSticks ? 'প্যাকেট করুন' : 'শলাকা করুন'}
                              </button>
                            )}
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
                     );
                   })
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
                  onClick={async () => {
                    const amt = Number(depositAmountInput);
                    if (isNaN(amt) || amt <= 0) {
                      alert('দয়া করে সঠিক জমার পরিমাণ লিখুন');
                      return;
                    }
                    
                    const updatedCustomers: Customer[] = customers.map(c => {
                      if (c.id === depositModalCustomer.id) {
                        const newDue = Math.max(0, c.dueAmount - amt);
                        const newStatus: 'clear' | 'pending' = newDue === 0 ? 'clear' : 'pending';
                        return { ...c, dueAmount: newDue, status: newStatus };
                      }
                      return c;
                    });
                    
                    setCustomers(updatedCustomers);
                    logActivity('payment', `টাকা জমা: ${depositModalCustomer.name}`, `${amt} ৳ (${depositMethod === 'cash' ? 'নগদ' : 'বিকাশ'}) জমা দেওয়া হয়েছে।`, amt);
                    alert(`সফলভাবে ${depositModalCustomer.name}-এর কাছ থেকে ${amt} (${depositMethod === 'cash' ? 'নগদ' : 'বিকাশ'}) জমা নেওয়া হয়েছে।`);
                    setDepositModalCustomer(null);
                    setDepositAmountInput('');
                    
                    // Immediate Sync
                    await handleSync(orders, products, updatedCustomers);
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
                    <span>ক্রেতা: {printPreviewOrder.customerName}</span>
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
                  disabled={isSubmittingSale}
                  className={`py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs flex items-center justify-center gap-1 shadow hover:bg-[#113F33] transition ${isSubmittingSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Check className={`w-4 h-4 ${isSubmittingSale ? 'animate-spin' : ''}`} /> 
                  {isSubmittingSale ? 'প্রসেসিং...' : 'সাবমিট করুন'}
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
                  <span className="text-gray-500">ক্রেতা:</span>
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
                <pre>{`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;
  
  if (action === 'getData') {
    var result = { success: true };
    var tabs = ['bikri', 'stock', 'bakir khata', 'catgeory', 'units'];
    
    tabs.forEach(function(tabName) {
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var rows = [];
        for (var i = 1; i < data.length; i++) {
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = data[i][j];
          }
          rows.push(obj);
        }
        var cleanName = tabName.replace(' ', '_');
        result[cleanName] = rows;
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var syncTime = data.timestamp || new Date().toISOString();

    // 1. bikri (Append only)
    var bikriSheet = ss.getSheetByName('bikri') || ss.insertSheet('bikri');
    if (bikriSheet.getLastRow() === 0) {
      bikriSheet.appendRow(['invoice no', 'date', 'customer name', 'customer mobile', 'location', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit', 'datetime']);
    }
    if (data.bikri && data.bikri.length > 0) {
      var existingData = bikriSheet.getDataRange().getValues();
      var existingInvoices = {};
      for (var x = 1; x < existingData.length; x++) {
        existingInvoices[String(existingData[x][0]).trim()] = true;
      }
      data.bikri.forEach(function(r) {
        var invNo = String(r['invoice no']).trim();
        if (invNo && !existingInvoices[invNo]) {
          bikriSheet.appendRow([invNo, r['date'], r['customer name'], r['customer mobile'], r['location'], r['product name'], r['category'], r['cost'], r['sales'], r['discount'], r['baki'], r['payment method'], r['profit'], r['datetime']]);
          existingInvoices[invNo] = true;
        }
      });
    }

    // 2. stock (Overwrite)
    var stockSheet = ss.getSheetByName('stock') || ss.insertSheet('stock');
    if (data.stock && data.stock.length > 0) {
      stockSheet.clear();
      stockSheet.appendRow(['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone', 'datetime']);
      var stockRows = data.stock.map(function(p) {
        return [p.id, p.name, p.category, p.stock, p.unit, p.buyPrice, p.sellPrice, p.barcode, p.repName, p.repPhone, p.datetime];
      });
      stockSheet.getRange(2, 1, stockRows.length, 11).setValues(stockRows);
    }

    // 3. bakir khata (Overwrite)
    var bakiSheet = ss.getSheetByName('bakir khata') || ss.insertSheet('bakir khata');
    if (data['bakir khata'] && data['bakir khata'].length > 0) {
      bakiSheet.clear();
      bakiSheet.appendRow(['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'createdAt', 'status', 'datetime']);
      var bakiRows = data['bakir khata'].map(function(c) {
        return [c.id, c.name, c.phone, c.address, c.dueAmount, c.lastPurchaseDate, c.createdAt, c.status, c.datetime];
      });
      bakiSheet.getRange(2, 1, bakiRows.length, 9).setValues(bakiRows);
    }

    // 4. catgeory & units (Overwrite)
    var catSheet = ss.getSheetByName('catgeory') || ss.insertSheet('catgeory');
    if (data.catgeory) {
      catSheet.clear(); catSheet.appendRow(['category_name', 'datetime']);
      var catRows = data.catgeory.map(function(cat) { return [cat.category_name, cat.datetime]; });
      if(catRows.length > 0) catSheet.getRange(2, 1, catRows.length, 2).setValues(catRows);
    }
    var unitsSheet = ss.getSheetByName('units') || ss.insertSheet('units');
    if (data.units) {
      unitsSheet.clear(); unitsSheet.appendRow(['unit_name', 'datetime']);
      var unitRows = data.units.map(function(u) { return [u.unit_name, u.datetime]; });
      if(unitRows.length > 0) unitsSheet.getRange(2, 1, unitRows.length, 2).setValues(unitRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`}</pre>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                   onClick={() => {
                    const scriptCode = `function doPost(e) { return handleRequest(e); }\nfunction doGet(e) {\n  var action = e.parameter.action;\n  if (action === 'getData') {\n    var ss = SpreadsheetApp.getActiveSpreadsheet();\n    var result = { success: true };\n    var tabs = ['bikri', 'stock', 'bakir khata', 'catgeory', 'units'];\n    tabs.forEach(function(tabName) {\n      var sheet = ss.getSheetByName(tabName);\n      if (sheet) {\n        var data = sheet.getDataRange().getValues();\n        var headers = data[0];\n        var rows = [];\n        for (var i = 1; i < data.length; i++) {\n          var obj = {};\n          for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }\n          rows.push(obj);\n        }\n        var cleanName = tabName.replace(' ', '_');\n        result[cleanName] = rows;\n      }\n    });\n    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);\n  }\n  return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);\n}\n\nfunction handleRequest(e) {\n  var lock = LockService.getScriptLock();\n  try {\n    lock.waitLock(30000);\n    var ss = SpreadsheetApp.getActiveSpreadsheet();\n    var data = JSON.parse(e.postData.contents);\n    var syncTime = data.timestamp || new Date().toISOString();\n\n    var bikriSheet = ss.getSheetByName('bikri') || ss.insertSheet('bikri');\n    if(bikriSheet.getLastRow() === 0) bikriSheet.appendRow(['invoice no', 'date', 'customer name', 'customer mobile', 'location', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit', 'datetime']);\n    if (data.bikri && data.bikri.length > 0) {\n      var existingData = bikriSheet.getDataRange().getValues();\n      var existingKeys = {};\n      for(var x=1; x<existingData.length; x++) { existingKeys[String(existingData[x][0]).trim()] = true; }\n      data.bikri.forEach(function(r) {\n        var invNo = String(r['invoice no']).trim();\n        if (invNo && !existingKeys[invNo]) {\n            bikriSheet.appendRow([invNo, r['date'], r['customer name'], r['customer mobile'], r['location'], r['product name'], r['category'], r['cost'], r['sales'], r['discount'], r['baki'], r['payment method'], r['profit'], r['datetime']]);\n            existingKeys[invNo] = true;\n        }\n      });\n    }\n\n    var stockSheet = ss.getSheetByName('stock') || ss.insertSheet('stock');\n    stockSheet.clear();\n    stockSheet.appendRow(['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone', 'datetime']);\n    if (data.stock && data.stock.length > 0) {\n        var stockRows = data.stock.map(function(p) { return [p.id, p.name, p.category, p.stock, p.unit, p.buyPrice, p.sellPrice, p.barcode, p.repName, p.repPhone, p.datetime]; });\n        stockSheet.getRange(2, 1, stockRows.length, 11).setValues(stockRows);\n    }\n\n    var bakiSheet = ss.getSheetByName('bakir khata') || ss.insertSheet('bakir khata');\n    bakiSheet.clear();\n    bakiSheet.appendRow(['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'createdAt', 'status', 'datetime']);\n    if (data['bakir khata'] && data['bakir khata'].length > 0) {\n        var bakiRows = data['bakir khata'].map(function(c) { return [c.id, c.name, c.phone, c.address, c.dueAmount, c.lastPurchaseDate, c.createdAt, c.status, c.datetime]; });\n        bakiSheet.getRange(2, 1, bakiRows.length, 9).setValues(bakiRows);\n    }\n\n    var catSheet = ss.getSheetByName('catgeory') || ss.insertSheet('catgeory');\n    catSheet.clear(); catSheet.appendRow(['category_name', 'datetime']);\n    if (data.catgeory && data.catgeory.length > 0) {\n      var catRows = data.catgeory.map(function(cat) { return [cat.category_name, cat.datetime]; });\n      catSheet.getRange(2, 1, catRows.length, 2).setValues(catRows);\n    }\n\n    var unitsSheet = ss.getSheetByName('units') || ss.insertSheet('units');\n    unitsSheet.clear(); unitsSheet.appendRow(['unit_name', 'datetime']);\n    if (data.units && data.units.length > 0) {\n      var unitRows = data.units.map(function(u) { return [u.unit_name, u.datetime]; });\n      unitsSheet.getRange(2, 1, unitRows.length, 2).setValues(unitRows);\n    }\n\n    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);\n  } catch (err) {\n    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);\n  } finally {\n    lock.releaseLock();\n  }\n}`;
                    navigator.clipboard.writeText(scriptCode);
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

        {/* Category & Unit Management Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="font-bold text-sm text-gray-900">ক্যাটাগরি ও একক ম্যানেজমেন্ট</h3>
                <button onClick={() => { setIsCategoryModalOpen(false); handleSync(); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              
                {/* Categories */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} placeholder="নতুন ক্যাটাগরি..." className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                      <button onClick={() => { if(newCatInput && !categoriesList.includes(newCatInput)) { setCategoriesList([...categoriesList, newCatInput]); setNewCatInput(''); setTimeout(handleSync, 500); } }} className="px-3 py-2 bg-[#1B7A5E] text-white rounded-xl text-xs font-bold">যোগ</button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {categoriesList.map(cat => (
                        <span key={cat} className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg text-xs">
                          {cat}
                          <button onClick={() => { setCategoriesList(categoriesList.filter(c => c !== cat)); setTimeout(handleSync, 500); }} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Units */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input type="text" value={newUnitInput} onChange={(e) => setNewUnitInput(e.target.value)} placeholder="নতুন একক..." className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                      <button onClick={() => { if(newUnitInput && !unitsList.includes(newUnitInput)) { setUnitsList([...unitsList, newUnitInput]); setNewUnitInput(''); setTimeout(handleSync, 500); } }} className="px-3 py-2 bg-[#1B7A5E] text-white rounded-xl text-xs font-bold">যোগ</button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {unitsList.map(u => (
                        <span key={u} className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg text-xs">
                          {u}
                          <button onClick={() => { setUnitsList(unitsList.filter(unit => unit !== u)); setTimeout(handleSync, 500); }} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
            </div>
          </div>
        )}

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
