/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Receipt,
  Truck,
  Building2,
  Users,
  Pencil
} from 'lucide-react';
import { 
  isWithinInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameYear, 
  format 
} from 'date-fns';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

// Store Info Constants
const STORE_NAME = 'আব্দুস সালাম স্টোর';
const STORE_PHONE = '01969249225';
const STORE_ADDRESS = 'রায়পুর বাজার, বাঘারপাড়া, যশোর';
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbx6qXyoYua4tUchRlaa0mH78EXxgbvmRWmVpWfxv5v4_At4_QGvwS13H8ruZf1J3bGBeA/exec';
const BUILD_VERSION = '2026.10.29.1';

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
  profit: number;
}

interface Customer {
  id: string;
  invoiceNo?: string;
  name: string;
  phone: string;
  address: string;
  dueAmount: number;
  lastPurchaseDate: string;
  createdAt: string;
  status: 'clear' | 'pending';
}

interface RepTransaction {
  id: string;
  date: string;
  rawDate: string;
  repName: string;
  phone: string;
  productName: string;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'bank';
  memoNo?: string;
  notes?: string;
  datetime?: string;
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
  totalRemaining: number;
}

interface PaymentRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  method: 'cash' | 'bkash';
  date: string;
  timestamp: string;
}

export default function App() {
  // Normalize dates to Bangladesh standard timezone YYYY-MM-DD (UTC+6)
  const normalizeDate = (dateVal: any): string => {
    if (!dateVal) return '';
    try {
      const str = String(dateVal).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Dhaka',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
      }
      const parts = str.split(/[-/]/);
      if (parts.length === 3) {
        const d1 = parseInt(parts[0]);
        const m1 = parseInt(parts[1]) - 1;
        let y1 = parseInt(parts[2]);
        if (y1 < 100) y1 += 2000;
        const testDate = new Date(y1, m1, d1);
        if (!isNaN(testDate.getTime())) {
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(testDate);
        }
      }
      return str;
    } catch (e) {
      return String(dateVal);
    }
  };

  const formatDate = (dateVal: any): string => {
    try {
      const norm = normalizeDate(dateVal);
      const parts = norm.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[m - 1] || '???';
        const year = String(y).slice(-2);
        return `${d}-${month}-${year}`;
      }
      return String(dateVal);
    } catch (e) {
      return '??-???-??';
    }
  };

  const formatDateTime = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  const uniqueById = <T extends { id: string }>(arr: T[]): T[] => {
    const map = new Map();
    arr.forEach(item => {
      if (item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
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

  // Navigation & Filter States
  const [currentTab, setCurrentTab] = useState<'home' | 'pos' | 'stock' | 'protinidhi' | 'ledger' | 'activity' | 'more'>('home');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all' | 'more'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Fixed Google Sheet URL
  const sheetUrl = DEFAULT_SHEET_URL;

  // Data states (synced live with Google Sheet)
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

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('abdus_store_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [repTransactions, setRepTransactions] = useState<RepTransaction[]>(() => {
    const saved = localStorage.getItem('abdus_store_rep_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Categories & Units Lists
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('abdus_store_categories');
    return saved ? JSON.parse(saved) : ['মুদি', 'সিগারেট', 'কসমেটিকস', 'অন্যান্য'];
  });

  const [unitsList, setUnitsList] = useState<string[]>(() => {
    const saved = localStorage.getItem('abdus_store_units');
    return saved ? JSON.parse(saved) : ['কেজি', 'প্যাকেট', 'পিস', 'বোতল', 'লিটার'];
  });

  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // In-App Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

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

  // Protinidhi Screen State
  const [isAddRepPurchaseOpen, setIsAddRepPurchaseOpen] = useState<boolean>(false);
  const [newRepName, setNewRepName] = useState('');
  const [newRepPhone, setNewRepPhone] = useState('');
  const [newRepProduct, setNewRepProduct] = useState('');
  const [newRepAmount, setNewRepAmount] = useState('');
  const [newRepMethod, setNewRepMethod] = useState<'cash' | 'bkash' | 'bank'>('cash');
  const [newRepMemo, setNewRepMemo] = useState('');
  const [newRepNotes, setNewRepNotes] = useState('');
  const [repSearchQuery, setRepSearchQuery] = useState('');

  // Ledger State & Payment Modal State
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');
  const [depositModalCustomer, setDepositModalCustomer] = useState<Customer | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<'cash' | 'bkash'>('cash');

  // Sync State
  const [syncTime, setSyncTime] = useState<string>(() => getSyncDisplayTime(new Date()));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [newUnitInput, setNewUnitInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ original: string; current: string } | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ original: string; current: string } | null>(null);

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
    const dateStr = formatDate(now);
    const newAct: Activity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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

  // Local storage synchronization
  useEffect(() => { localStorage.setItem('abdus_store_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('abdus_store_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('abdus_store_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('abdus_store_categories', JSON.stringify(categoriesList)); }, [categoriesList]);
  useEffect(() => { localStorage.setItem('abdus_store_units', JSON.stringify(unitsList)); }, [unitsList]);
  useEffect(() => { localStorage.setItem('abdus_store_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('abdus_store_rep_transactions', JSON.stringify(repTransactions)); }, [repTransactions]);

  // LIVE FETCH FROM GOOGLE SHEET
  const isFetchingRef = useRef(false);
  const isPushingRef = useRef(false);
  const lastPushTimestampRef = useRef(0);

  const fetchData = async () => {
    // If a push was recently made or is in progress, pause fetch to avoid overwriting uncommitted data
    if (isPushingRef.current || (Date.now() - lastPushTimestampRef.current < 4000)) {
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsSyncing(true);
    try {
      const response = await fetch(`${sheetUrl}?action=getData`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const result = await response.json();
      
      // If a push started while fetch was in flight, abort applying stale sheet data
      if (isPushingRef.current || (Date.now() - lastPushTimestampRef.current < 4000)) {
        return;
      }

      if (result && result.success) {
        // 1. Stock / Products
        if (result.stock && Array.isArray(result.stock)) {
          const fetchedProducts = result.stock.map((p: any) => {
            let tags: string[] = [];
            let rawTags = p['seacrh keyword'] || p['seacrh_keyword'] || p.seacrhKeyword || p.seacrhkeyword || p.searchKeyword || p.searchkeyword || p['search keyword'] || p['search_keyword'] || p.searchTags || p.searchtags || p.search_tags || p.keywords || p.keyword || p['সার্চ কিওয়ার্ড'] || p['সার্চ কিওয়ার্ড'] || p['ট্যাগ'];
            
            if (!rawTags && typeof p === 'object' && p !== null) {
              const keys = Object.keys(p);
              const matchKey = keys.find(k => {
                const kLower = k.toLowerCase();
                return kLower.includes('seacrh') || kLower.includes('search') || kLower.includes('key') || kLower.includes('tag') || kLower.includes('কিওয়ার্ড') || kLower.includes('কীবোর্ড');
              });
              if (matchKey) {
                rawTags = p[matchKey];
              }
            }

            if (Array.isArray(rawTags)) {
              tags = rawTags.map((t: any) => String(t).trim()).filter(Boolean);
            } else if (typeof rawTags === 'string' && rawTags.trim()) {
              const str = rawTags.trim();
              if (str.startsWith('[') && str.endsWith(']')) {
                try { tags = JSON.parse(str); } catch { tags = str.split(/[,;\n|]/).map(t => t.trim()).filter(Boolean); }
              } else {
                tags = str.split(/[,;\n|]/).map(t => t.trim()).filter(Boolean);
              }
            }
            return {
              id: String(p.id || `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`).trim(),
              name: String(p.name || '').trim(),
              category: String(p.category || 'মুদি').trim(),
              stock: Number(p.stock) || 0,
              unit: String(p.unit || 'পিস').trim(),
              buyPrice: Number(p.buyPrice ?? p.buyprice ?? p['buy price'] ?? 0),
              sellPrice: Number(p.sellPrice ?? p.sellprice ?? p['sell price'] ?? 0),
              barcode: String(p.barcode || '').trim(),
              repName: String(p.repName || p.repname || p['rep name'] || '').trim(),
              repPhone: String(p.repPhone || p.repphone || p['rep phone'] || '').trim(),
              piecesPerPacket: p.piecesPerPacket ? Number(p.piecesPerPacket) : undefined,
              stickPrice: p.stickPrice ? Number(p.stickPrice) : undefined,
              searchTags: tags.length > 0 ? tags : [String(p.name || '').toLowerCase()]
            };
          }).filter((p: Product) => p.name.length > 0);

          setProducts(prev => {
            const fetchedMap = new Map(fetchedProducts.map(fp => [fp.id, fp]));
            const merged = [...fetchedProducts];
            prev.forEach(lp => {
              if (!fetchedMap.has(lp.id)) {
                merged.push(lp);
              }
            });
            return merged;
          });
        }
        
        // 2. Bakir Khata / Customers
        if (result.bakir_khata && Array.isArray(result.bakir_khata)) {
          const fetchedCustomers = result.bakir_khata.map((c: any) => {
            const invoiceNo = String(c.invoiceNo || c['invoiceno'] || c['invoice no'] || c['invoice_no'] || c['ইনভয়েস'] || '').trim();
            const name = String(c.name || c['customer name'] || c['customer_name'] || c['ক্রেতার নাম'] || c['নাম'] || '').trim();
            const phone = String(c.phone || c['customer mobile'] || c['customer_mobile'] || c['মোবাইল'] || c['phone'] || c['mobile'] || '').trim();
            const address = String(c.address || c['location'] || c['ঠিকানা'] || 'রায়পুর বাজার').trim();
            const due = Number(c.dueAmount ?? c.due_amount ?? c.due ?? c.baki ?? c['due amount'] ?? c['বাকি'] ?? 0);
            return {
              id: String(c.id || `c-${invoiceNo || Date.now()}`).trim(),
              invoiceNo,
              name,
              phone,
              address,
              dueAmount: due,
              createdAt: c.createdAt || formatDate(new Date()),
              lastPurchaseDate: c.lastPurchaseDate || formatDate(new Date()),
              status: (due > 0 ? 'pending' : 'clear') as ('pending' | 'clear')
            };
          }).filter((c: Customer) => c.name.length > 0);

          setCustomers(prev => {
            const customerMap = new Map<string, Customer>();
            // 1. Keep local customers as source of truth for recent dues/payments
            prev.forEach(c => customerMap.set(c.name, { ...c }));

            // 2. Append/update with sheet customers (new sheet customers are added below)
            fetchedCustomers.forEach(fc => {
              if (!customerMap.has(fc.name)) {
                customerMap.set(fc.name, fc);
              } else {
                const existing = customerMap.get(fc.name)!;
                if (!existing.phone && fc.phone) existing.phone = fc.phone;
                if (!existing.address || existing.address === 'রায়পুর বাজার') existing.address = fc.address || existing.address;
              }
            });
            return Array.from(customerMap.values());
          });
        }

        // 3. Joma / Customer Payments
        if (result.joma && Array.isArray(result.joma) && result.joma.length > 0) {
          const fetchedPayments = result.joma.map((p: any) => ({
            ...p,
            amount: Number(p.amount) || 0
          })) as PaymentRecord[];
          setPayments(uniqueById(fetchedPayments));
        }

        // 4. Categories & Units (Direct sync from Google Sheet)
        const extractStringVal = (item: any): string => {
          if (!item) return '';
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'object') {
            const val = item.category_name ?? item.category ?? item.unit_name ?? item.unit ?? item.name ?? item['ক্যাটাগরি'] ?? item['একক'] ?? Object.values(item)[0];
            return val ? String(val).trim() : '';
          }
          return String(item).trim();
        };

        if (result.category && Array.isArray(result.category)) {
          const cats = result.category
            .map(extractStringVal)
            .filter((c: string) => c && c.length > 0);
          if (cats.length > 0) {
            setCategoriesList(cats);
          }
        }
        
        if (result.units && Array.isArray(result.units)) {
          const units = result.units
            .map(extractStringVal)
            .filter((u: string) => u && u.length > 0);
          if (units.length > 0) {
            setUnitsList(units);
          }
        }

        // 5. Protinidhi / Company Purchases
        if (result.protinidhi && Array.isArray(result.protinidhi) && result.protinidhi.length > 0) {
          const fetchedReps = result.protinidhi.map((r: any) => ({
            id: r.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: r.date || formatDate(r.datetime || r.rawDate || new Date()),
            rawDate: normalizeDate(r.date || r.rawDate || r.datetime),
            repName: String(r['rep name'] || r.rep_name || r.name || 'অজ্ঞাত').trim(),
            phone: String(r.phone || r['phone'] || r.mobile || '-').trim(),
            productName: String(r['product name'] || r.product_name || r.product || '-').trim(),
            amount: Number(r.amount || 0),
            paymentMethod: r['payment method'] || r.payment_method || 'cash',
            memoNo: String(r['memo no'] || r.memo_no || '').trim(),
            notes: String(r.notes || '').trim(),
            datetime: r.datetime || ''
          }));
          setRepTransactions(uniqueById(fetchedReps));
        }

        // 6. Bikri / Sales (Aggregates multiple line-items per invoice properly)
        if (result.bikri && Array.isArray(result.bikri) && result.bikri.length > 0) {
          const fetchedOrdersMap: { [key: string]: Order } = {};
          result.bikri.forEach((o: any) => {
            const invNo = String(o['invoice no'] || o.invoice_no || '').trim();
            if (!invNo) return;

            const rawDate = normalizeDate(o.date || o.datetime || o.rawDate);
            const displayDate = formatDate(o.date || o.datetime || o.rawDate);
            const salesVal = Number(o.sales || o.total || 0);
            const profitVal = Number(o.profit || 0);
            const bakiVal = Number(o.baki || o.due || 0);
            const custName = String(o['customer name'] || o.customer_name || 'নগদ ক্রেতা').trim();
            const custPhone = String(o['customer mobile'] || o.customer_mobile || '-').trim();
            const payType = o['payment method'] || o.payment_method || (bakiVal > 0 ? 'credit' : 'cash');

            if (!fetchedOrdersMap[invNo]) {
              fetchedOrdersMap[invNo] = {
                id: `ord-sync-${invNo}`,
                invoiceNo: invNo,
                customerName: custName,
                customerPhone: custPhone,
                items: [], 
                subtotal: salesVal,
                discount: Number(o.discount || 0),
                total: salesVal,
                due: bakiVal,
                paid: Math.max(0, salesVal - bakiVal),
                paymentType: payType,
                date: displayDate,
                rawDate: rawDate,
                status: bakiVal > 0 ? 'pending' : 'completed',
                profit: profitVal
              };
            } else {
              const existing = fetchedOrdersMap[invNo];
              existing.subtotal += salesVal;
              existing.total += salesVal;
              existing.profit += profitVal;
              existing.due = Math.max(existing.due, bakiVal);
              existing.paid = Math.max(0, existing.total - existing.due);
              existing.status = existing.due > 0 ? 'pending' : 'completed';
            }
          });
          
          const sortedOrders = Object.values(fetchedOrdersMap).sort((a, b) => {
            const dateA = new Date(a.rawDate).getTime();
            const dateB = new Date(b.rawDate).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return b.invoiceNo.localeCompare(a.invoiceNo);
          });
          setOrders(uniqueById(sortedOrders));
        }
        return true;
      }
    } catch (err) {
      console.warn("Live fetch notice:", err);
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
      setSyncTime(getSyncDisplayTime(new Date()));
    }
  };

  // AUTO-SYNC EVERY 2.5 SECONDS FROM GOOGLE SHEET
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // IMMEDIATE SYNC FUNCTION TO PUSH UPDATES TO GOOGLE SHEET
  const handleSync = async (
    targetOrders = orders, 
    targetProducts = products, 
    targetCustomers = customers,
    targetCategories = categoriesList,
    targetUnits = unitsList,
    targetPayments = payments,
    targetReps = repTransactions
  ) => {
    isPushingRef.current = true;
    lastPushTimestampRef.current = Date.now();
    setIsSyncing(true);
    try {
      const formattedBikri = targetOrders.map(o => {
        const custObj = targetCustomers.find(c => c.name === o.customerName);
        const custLoc = custObj ? custObj.address : 'রায়পুর বাজার';
        
        const productSummary = o.items && o.items.length > 0 
          ? o.items.map(item => `${item.product.name} - ${item.quantity} ${item.isSticks ? 'শলাকা' : item.product.unit}`).join('\n')
          : 'বিক্রিত পণ্য';

        const totalCost = o.items ? o.items.reduce((sum, item) => sum + (item.product.buyPrice * item.quantity), 0) : 0;
        const totalProfit = o.items ? o.items.reduce((sum, item) => {
          const price = item.isSticks ? (item.product.stickPrice || item.product.sellPrice / (item.product.piecesPerPacket || 1)) : item.product.sellPrice;
          return sum + ((price - item.product.buyPrice) * item.quantity);
        }, 0) : o.profit;

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
        tabs: ['bikri', 'stock', 'bakir khata', 'category', 'units', 'joma', 'protinidhi'],
        bikri: formattedBikri,
        stock: targetProducts.map(p => {
          const tagsStr = Array.isArray(p.searchTags) ? p.searchTags.join(', ') : String(p.searchTags || '');
          return {
            id: String(p.id || '').trim(),
            name: String(p.name || '').trim(),
            category: String(p.category || 'মুদি').trim(),
            stock: Number(p.stock) || 0,
            unit: String(p.unit || 'পিস').trim(),
            buyPrice: Number(p.buyPrice) || 0,
            sellPrice: Number(p.sellPrice) || 0,
            barcode: String(p.barcode || '').trim(),
            repName: String(p.repName || '').trim(),
            repPhone: String(p.repPhone || '').trim(),
            'seacrh keyword': tagsStr,
            'seacrh_keyword': tagsStr,
            searchKeyword: tagsStr,
            searchTags: tagsStr,
            datetime: formatDateTime(new Date())
          };
        }),
        'bakir khata': targetCustomers.map(c => ({ ...c, datetime: formatDateTime(new Date()) })),
        category: targetCategories.map(cat => ({ category_name: cat, datetime: formatDateTime(new Date()) })),
        units: targetUnits.map(u => ({ unit_name: u, datetime: formatDateTime(new Date()) })),
        joma: targetPayments.map(p => ({ ...p, datetime: formatDateTime(new Date()) })),
        protinidhi: targetReps.map(r => ({
          id: r.id,
          date: r.date,
          rep_name: r.repName,
          phone: r.phone,
          product_name: r.productName,
          amount: r.amount,
          payment_method: r.paymentMethod,
          memo_no: r.memoNo || '',
          notes: r.notes || '',
          datetime: formatDateTime(new Date())
        })),
        timestamp: new Date().toISOString()
      };

      await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      lastPushTimestampRef.current = Date.now();
      return true;
    } catch (err) {
      console.error("Sync error:", err);
      return false;
    } finally {
      isPushingRef.current = false;
      setIsSyncing(false);
      setSyncTime(getSyncDisplayTime(new Date()));
    }
  };

  // Cart operations
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

  // Prepare Memo Preview
  const handlePreparePrintPreview = () => {
    if (cart.length === 0) {
      showToast('কার্টে কোনো পণ্য নেই!', 'error');
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
        showToast('দয়া করে নতুন ক্রেতার নাম লিখুন', 'error');
        return;
      }
      finalCustomerName = newCustName.trim();
      finalCustomerPhone = newCustPhone.trim() || '01700000000';
    }

    const sub = cartSubtotal;
    const disc = discountInput;
    const tot = cartTotal;
    const paidAmt = cashPaidInput !== '' ? Number(cashPaidInput) : tot;
    const dueAmt = Math.max(0, tot - paidAmt);

    if (!isExisting && !isNew && dueAmt > 0) {
      showToast('নগদ ক্রেতার কোনো বাকি রাখা যাবে না! পুরো টাকা পরিশোধ করতে হবে।', 'error');
      return;
    }

    const draftOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
      rawDate: normalizeDate(new Date()),
      status: dueAmt > 0 ? 'pending' : 'completed',
      profit: tot - (cart.reduce((sum, item) => sum + (item.product.buyPrice * item.quantity), 0))
    };

    setPrintPreviewOrder(draftOrder);
  };

  // Confirm Sale & Push to Sheet
  const handleConfirmAndSubmitSale = async () => {
    if (!printPreviewOrder || isSubmittingSale) return;
    setIsSubmittingSale(true);
    const order = printPreviewOrder;

    // 1. Reduce product stock
    const updatedProducts = products.map(p => {
      const cartItem = order.items.find(ci => ci.product.id === p.id);
      if (cartItem) {
        const reduction = cartItem.isSticks ? (cartItem.quantity / (p.piecesPerPacket || 1)) : cartItem.quantity;
        return { ...p, stock: Math.max(0, p.stock - reduction) };
      }
      return p;
    });

    // 2. Update Customer Due invoice-wise for bakir khata
    let updatedCustomers = [...customers];
    if (order.due > 0) {
      const newBakirEntry: Customer = {
        id: `bakir-${order.invoiceNo}-${Date.now()}`,
        invoiceNo: order.invoiceNo,
        name: order.customerName,
        phone: order.customerPhone,
        address: newCustAddress.trim() || (customers.find(c => c.name === order.customerName)?.address) || 'রায়পুর বাজার',
        dueAmount: order.due,
        lastPurchaseDate: formatDate(new Date()),
        createdAt: formatDate(new Date()),
        status: 'pending'
      };
      updatedCustomers = [newBakirEntry, ...updatedCustomers];
    }

    // 3. Update orders
    const updatedOrders = [order, ...orders];

    setProducts(uniqueById(updatedProducts));
    setCustomers(uniqueById(updatedCustomers));
    setOrders(uniqueById(updatedOrders));
    
    setSuccessModal(order);
    setPrintPreviewOrder(null);
    setCart([]);
    setDiscountInput(0);
    setCashPaidInput('');
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');

    logActivity('sale', `নতুন বিক্রি: ${order.customerName}`, `${order.items.length}টি পণ্য, ইনভয়েস: ${order.invoiceNo}`, order.total);

    // Immediate Sync
    await handleSync(updatedOrders, updatedProducts, updatedCustomers, categoriesList, unitsList, payments, repTransactions);
    setIsSubmittingSale(false);
  };

  // Add Company Purchase / Representative Payment
  const handleAddRepPurchase = async () => {
    const amt = Number(newRepAmount);
    if (!newRepName.trim()) {
      showToast('দয়া করে প্রতিনিধির নাম বা কোম্পানি লিখুন', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('দয়া করে সঠিক ক্রয়ের পরিমাণ (টাকা) লিখুন', 'error');
      return;
    }

    const newRec: RepTransaction = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      repName: newRepName.trim(),
      phone: newRepPhone.trim() || '01700000000',
      productName: newRepProduct.trim() || 'পণ্য ক্রয়',
      amount: amt,
      paymentMethod: newRepMethod,
      memoNo: newRepMemo.trim(),
      notes: newRepNotes.trim(),
      date: formatDate(new Date()),
      rawDate: normalizeDate(new Date()),
      datetime: formatDateTime(new Date())
    };

    const updated = [newRec, ...repTransactions];
    setRepTransactions(updated);
    logActivity('stock_in', `কোম্পানি ক্রয়: ${newRec.repName}`, `${newRec.productName} - ${amt}`, amt);
    showToast(`সফলভাবে ${amt} কোম্পানি ক্রয় সংরক্ষিত হয়েছে!`, 'success');

    setIsAddRepPurchaseOpen(false);
    setNewRepName('');
    setNewRepPhone('');
    setNewRepProduct('');
    setNewRepAmount('');
    setNewRepMemo('');
    setNewRepNotes('');

    await handleSync(orders, products, customers, categoriesList, unitsList, payments, updated);
  };

  // Calculations for Home Metrics
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const totalDueAmount = customers.filter(c => c.dueAmount > 0).reduce((sum, c) => sum + c.dueAmount, 0);

  // Timeframe filtered orders
  const filteredOrders = orders.filter(o => {
    if (timeframe === 'all') return true;
    const normOrderDate = normalizeDate(o.date || o.rawDate);
    const normToday = normalizeDate(new Date());
    
    if (timeframe === 'today') {
      return normOrderDate === normToday;
    }
    
    if (timeframe === 'more') {
      if (!customStartDate && !customEndDate) return true;
      if (customStartDate && normOrderDate < customStartDate) return false;
      if (customEndDate && normOrderDate > customEndDate) return false;
      return true;
    }

    const oDate = new Date(normOrderDate);
    if (isNaN(oDate.getTime())) return false;

    if (timeframe === 'week') {
      return isWithinInterval(oDate, { 
        start: startOfWeek(new Date(), { weekStartsOn: 6 }),
        end: endOfWeek(new Date(), { weekStartsOn: 6 }) 
      });
    }
    if (timeframe === 'month') {
      return isSameMonth(oDate, new Date()) && isSameYear(oDate, new Date());
    }
    return true;
  });

  // Timeframe filtered rep transactions
  const filteredRepTransactions = repTransactions.filter(r => {
    if (timeframe === 'all') return true;
    const rDate = normalizeDate(r.date || r.rawDate || r.datetime);
    const normToday = normalizeDate(new Date());
    if (timeframe === 'today') return rDate === normToday;
    if (timeframe === 'more') {
      if (!customStartDate && !customEndDate) return true;
      if (customStartDate && rDate < customStartDate) return false;
      if (customEndDate && rDate > customEndDate) return false;
      return true;
    }
    const d = new Date(rDate);
    if (isNaN(d.getTime())) return false;
    if (timeframe === 'week') {
      return isWithinInterval(d, {
        start: startOfWeek(new Date(), { weekStartsOn: 6 }),
        end: endOfWeek(new Date(), { weekStartsOn: 6 })
      });
    }
    if (timeframe === 'month') {
      return isSameMonth(d, new Date()) && isSameYear(d, new Date());
    }
    return true;
  });

  // HOME METRICS (Strict User Formulas)
  // order = count of bikri tab invoice no
  const totalOrdersCount = filteredOrders.length;
  // bikri = sum of sales
  const totalSalesAmount = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  // puraton kreta = customer name <> নগদ ক্রেতা
  const oldCustomersCount = filteredOrders.filter(o => o.customerName && o.customerName.trim() !== 'নগদ ক্রেতা').length;
  // notun kreta = customer name = নগদ ক্রেতা
  const newCustomersCount = filteredOrders.filter(o => !o.customerName || o.customerName.trim() === 'নগদ ক্রেতা').length;
  // mot lav = sum of profit
  const totalProfitAmount = filteredOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);
  // protinidhi porishodh
  const totalRepPayment = filteredRepTransactions.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Date-wise history aggregation
  const dateHistoryMap: { [key: string]: DateHistoryRecord } = {};
  orders.forEach(o => {
    const dKey = normalizeDate(o.date || o.rawDate);
    if (!dKey) return;
    
    if (!dateHistoryMap[dKey]) {
      dateHistoryMap[dKey] = {
        date: dKey,
        totalOrders: 0,
        totalSales: 0,
        totalOldCustomers: 0,
        totalNewCustomers: 0,
        totalTotalCustomers: 0,
        totalProfit: 0,
        totalRepPayment: 0,
        totalRemaining: 0
      };
    }
    
    const record = dateHistoryMap[dKey];
    record.totalOrders += 1;
    record.totalSales += (Number(o.total) || 0);
    
    if (o.customerName && o.customerName.trim() !== 'নগদ ক্রেতা') {
      record.totalOldCustomers += 1;
    } else {
      record.totalNewCustomers += 1;
    }
    record.totalTotalCustomers = record.totalOldCustomers + record.totalNewCustomers;
    record.totalProfit += (Number(o.profit) || 0);
  });

  // Include rep payments into daily history table
  repTransactions.forEach(r => {
    const dKey = normalizeDate(r.date || r.rawDate || r.datetime);
    if (!dKey) return;
    if (!dateHistoryMap[dKey]) {
      dateHistoryMap[dKey] = {
        date: dKey,
        totalOrders: 0,
        totalSales: 0,
        totalOldCustomers: 0,
        totalNewCustomers: 0,
        totalTotalCustomers: 0,
        totalProfit: 0,
        totalRepPayment: 0,
        totalRemaining: 0
      };
    }
    dateHistoryMap[dKey].totalRepPayment += (Number(r.amount) || 0);
  });

  // Calculate অবশিষ্ট (বিক্রি - প্রতিনিধি পরিশোধ) for each date
  Object.values(dateHistoryMap).forEach(rec => {
    rec.totalRemaining = rec.totalSales - rec.totalRepPayment;
  });

  const dateHistoryList = Object.values(dateHistoryMap).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Download Hisab Report as ZIP (Excel & PDF)
  const downloadHisabReportZip = async () => {
    try {
      showToast('রিপোর্ট তৈরি হচ্ছে, অপেক্ষা করুন...', 'info');
      const zip = new JSZip();
      const todayDateStr = format(new Date(), 'yyyy-MM-dd');

      // 1. Bikri CSV
      const salesHeader = ['ইনভয়েস নম্বর', 'তারিখ', 'ক্রেতার নাম', 'মোবাইল', 'মোট বিল', 'জমা', 'বাকি', 'পেমেন্ট মাধ্যম', 'লাভ', 'স্ট্যাটাস'];
      const salesRows = orders.map(o => [
        `"${o.invoiceNo || ''}"`,
        `"${o.date || ''}"`,
        `"${(o.customerName || 'নগদ ক্রেতা').replace(/"/g, '""')}"`,
        `"${o.customerPhone || '-'}"`,
        o.total || 0,
        o.paid || 0,
        o.due || 0,
        `"${o.paymentType === 'cash' ? 'নগদ' : o.paymentType === 'credit' ? 'বাকি' : 'বিকাশ'}"`,
        o.profit || 0,
        `"${o.status === 'completed' ? 'পরিশোধিত' : 'বকেয়া'}"`
      ]);
      const salesCsv = '\uFEFF' + [salesHeader.join(','), ...salesRows.map(r => r.join(','))].join('\n');
      zip.file('Bikri_Sales_Report.csv', salesCsv);

      // 2. Daily Summary CSV
      const summaryHeader = ['তারিখ', 'মোট অর্ডার', 'পুরাতন ক্রেতা', 'নতুন ক্রেতা (নগদ)', 'মোট ক্রেতা', 'মোট বিক্রি', 'মোট লাভ', 'প্রতিনিধি পরিশোধ', 'অবশিষ্ট'];
      const summaryRows = dateHistoryList.map(r => [
        `"${r.date}"`,
        r.totalOrders,
        r.totalOldCustomers,
        r.totalNewCustomers,
        r.totalTotalCustomers,
        r.totalSales,
        r.totalProfit,
        r.totalRepPayment,
        (r.totalSales - r.totalRepPayment)
      ]);
      const summaryCsv = '\uFEFF' + [summaryHeader.join(','), ...summaryRows.map(r => r.join(','))].join('\n');
      zip.file('Daily_Summary_Report.csv', summaryCsv);

      // 3. Stock CSV
      const stockHeader = ['পণ্যের নাম', 'ক্যাটাগরি', 'স্টক পরিমাণ', 'একক', 'ক্রয় মূল্য', 'বিক্রয় মূল্য', 'প্রতিনিধির নাম', 'প্রতিনিধির ফোন'];
      const stockRows = products.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.stock,
        `"${p.unit}"`,
        p.buyPrice,
        p.sellPrice,
        `"${p.repName || '-'}"`,
        `"${p.repPhone || '-'}"`
      ]);
      const stockCsv = '\uFEFF' + [stockHeader.join(','), ...stockRows.map(r => r.join(','))].join('\n');
      zip.file('Stock_Inventory_Report.csv', stockCsv);

      // 4. Protinidhi CSV
      const repHeader = ['তারিখ', 'প্রতিনিধি / কোম্পানি', 'মোবাইল', 'পণ্য', 'ক্রয় মূল্য', 'পেমেন্ট মাধ্যম', 'মেমো'];
      const repRows = repTransactions.map(r => [
        `"${r.date}"`,
        `"${r.repName.replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${r.productName.replace(/"/g, '""')}"`,
        r.amount,
        `"${r.paymentMethod}"`,
        `"${r.memoNo || ''}"`
      ]);
      const repCsv = '\uFEFF' + [repHeader.join(','), ...repRows.map(r => r.join(','))].join('\n');
      zip.file('Protinidhi_Purchases_Report.csv', repCsv);

      // 5. PDF Generation
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(17, 63, 51);
      doc.text('Abdus Salam Store - Financial Report', 105, 18, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text('Raipur Bazar, Bagharpara, Jashore | Phone: 01969249225', 105, 24, { align: 'center' });
      doc.text(`Generated: ${format(new Date(), 'dd-MMM-yyyy, hh:mm a')}`, 105, 30, { align: 'center' });

      doc.setDrawColor(27, 122, 94);
      doc.setLineWidth(0.5);
      doc.line(14, 34, 196, 34);

      doc.setFontSize(12);
      doc.setTextColor(27, 122, 94);
      doc.text('Executive Summary', 14, 42);

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total Orders: ${orders.length}`, 16, 50);
      doc.text(`Total Sales: BDT ${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString('en-IN')}`, 16, 56);
      doc.text(`Total Profit: BDT ${orders.reduce((s, o) => s + (o.profit || 0), 0).toLocaleString('en-IN')}`, 16, 62);
      doc.text(`Total Dues: BDT ${customers.reduce((s, c) => s + (c.dueAmount || 0), 0).toLocaleString('en-IN')}`, 110, 50);
      doc.text(`Total Rep Payments: BDT ${repTransactions.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString('en-IN')}`, 110, 56);

      const pdfBlob = doc.output('blob');
      zip.file('Hisab_Report.pdf', pdfBlob);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Abdus_Salam_Store_Report_${todayDateStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast('হিসাব রিপোর্ট (Excel ও PDF) সফলভাবে ডাউনলোড হয়েছে!', 'success');
    } catch (err) {
      console.error(err);
      showToast('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const matchesProductSearch = (product: Product, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const nameLower = product.name.toLowerCase();
    
    // English to Bengali store keyword mappings
    const keywordMap: { [key: string]: string[] } = {
      'dal': ['ডাল'],
      'tel': ['তেল'],
      'oil': ['তেল'],
      'chini': ['চিনি'],
      'sugar': ['চিনি'],
      'ata': ['আটা'],
      'maida': ['ময়দা'],
      'cha': ['চা'],
      'tea': ['চা'],
      'dim': ['ডিম'],
      'egg': ['ডিম'],
      'alu': ['আলু'],
      'potato': ['আলু'],
      'peyaj': ['পেঁয়াজ', 'পেয়াজ'],
      'onion': ['পেঁয়াজ', 'পেয়াজ'],
      'rosun': ['রসুন'],
      'garlic': ['রসুন'],
      'ada': ['আদা'],
      'ginger': ['আদা'],
      'sabun': ['সাবান'],
      'soap': ['সাবান'],
      'cal': ['চাল'],
      'rice': ['চাল']
    };

    const targetTerms = keywordMap[q] ? keywordMap[q] : [q];

    // 1. Check searchKeyword / searchTags from Google Sheet stock tab
    if (product.searchTags && Array.isArray(product.searchTags) && product.searchTags.length > 0) {
      const tagsJoined = product.searchTags.join(' ').toLowerCase();
      if (tagsJoined.includes(q)) return true;
      for (const term of targetTerms) {
        if (tagsJoined.includes(term.toLowerCase())) return true;
      }
    }

    // 2. Tokenize product name ONLY into distinct words (no category check)
    const nameWords = nameLower.split(/[\s\-_()]+/);

    // Check if any target term matches a whole word or exact token in product name
    for (const term of targetTerms) {
      const isMatch = nameWords.some(w => w === term || (w.includes(term) && term.length > 2));
      if (isMatch) {
        // Extra safeguard: if term is 'ডাল', make sure the word isn't part of 'স্যান্ডাল'
        if (term === 'ডাল') {
          if (nameWords.some(w => w === 'স্যান্ডাল' || w === 'sandal' || w.includes('স্যান্ডাল'))) {
            continue;
          }
        }
        return true;
      }
    }

    // 3. Check barcode match
    if (product.barcode && product.barcode.toLowerCase() === q) return true;

    return false;
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-[#F3F4F6] text-gray-900 font-['Hind_Siliguri',sans-serif]">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90%] pointer-events-none animate-fadeIn">
          <div className={`p-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 pointer-events-auto ${
            toast.type === "error" ? "bg-red-900/90 text-white border-red-700" :
            toast.type === "success" ? "bg-emerald-900/90 text-white border-emerald-600" :
            "bg-gray-900/90 text-white border-gray-700"
          }`}>
            {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {toast.type === "info" && <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/60 hover:text-white p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FIXED TOP HEADER */}
      <header className="flex-none h-14 bg-[#113F33] text-white px-3 flex items-center justify-between shadow-md z-30">
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
            <p className="text-[9px] text-emerald-300 font-medium truncate">{STORE_PHONE}</p>
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
            title="গুগল শিট থেকে রিফ্রেশ"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">{syncTime}</span>
          </button>
        </div>
      </header>

      {/* MIDDLE SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain w-full relative">
        
        {/* ================= 1. HOME / DASHBOARD SCREEN ================= */}
        {currentTab === 'home' && (
          <div className="p-3 space-y-3 animate-fadeIn w-full pb-6">
            
            {/* Timeframe Selector Tabs */}
            <div className="flex bg-white rounded-xl p-0.5 shadow-sm border border-emerald-200 text-xs font-bold w-full bg-emerald-50/30">
              {[
                { id: 'today', label: 'আজ' },
                { id: 'week', label: 'গত সপ্তাহ' },
                { id: 'month', label: 'এই মাস' },
                { id: 'all', label: 'সব' },
                { id: 'more', label: 'তারিখ' }
              ].map((tf) => (
                <button 
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as 'today' | 'week' | 'month' | 'all' | 'more')}
                  className={`flex-1 py-2 rounded-lg transition text-center ${timeframe === tf.id ? 'bg-[#113F33] text-white shadow' : 'text-gray-600 hover:bg-emerald-100'}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {timeframe === 'more' && (
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-emerald-200 flex gap-2 text-xs">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 block mb-0.5">হতে</label>
                  <input 
                    type="date" 
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)} 
                    className="w-full p-1.5 border border-emerald-200 rounded-lg text-xs" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 block mb-0.5">পর্যন্ত</label>
                  <input 
                    type="date" 
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)} 
                    className="w-full p-1.5 border border-emerald-200 rounded-lg text-xs" 
                  />
                </div>
              </div>
            )}

            {/* Compact Summary Cards - Aligned Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              {[
                { label: 'অর্ডার সংখ্যা', val: totalOrdersCount, highlight: false },
                { label: 'পুরাতন ক্রেতা', val: oldCustomersCount, highlight: false },
                { label: 'নতুন ক্রেতা', val: newCustomersCount, highlight: false },
                { label: 'মোট ক্রেতা', val: oldCustomersCount + newCustomersCount, highlight: false },
                { label: 'বিক্রি', val: totalSalesAmount.toLocaleString('en-IN'), highlight: false },
                { label: 'মোট লাভ', val: totalProfitAmount.toLocaleString('en-IN'), highlight: false },
                { label: 'প্রতিনিধি পরিশোধ', val: totalRepPayment.toLocaleString('en-IN'), highlight: false },
                { label: 'অবশিষ্ট', val: (totalSalesAmount - totalRepPayment).toLocaleString('en-IN'), highlight: true },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded-xl shadow-sm border text-center transition ${
                    item.highlight 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-white border-emerald-200 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{item.label}</div>
                  <div className={`text-sm font-bold tabular-nums ${item.highlight ? 'text-emerald-900 font-black text-base' : 'text-gray-900'}`}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Compact History Table with borders */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-x-auto w-full text-[10px]">
              <table className="w-full border-collapse">
                <thead className="bg-emerald-50/70 border-b border-emerald-200 font-bold text-gray-800">
                  <tr>
                    <th className="border-r border-emerald-100 py-2.5 px-1.5 text-center">তারিখ</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1 text-center">অর্ডার</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1 text-center">পুরাতন<br/>ক্রেতা</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1 text-center">নতুন<br/>ক্রেতা</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1 text-center">মোট<br/>ক্রেতা</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1.5 text-center">বিক্রি</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1 text-center">লাভ</th>
                    <th className="border-r border-emerald-100 py-2.5 px-1 text-center">প্রতিনিধি<br/>পরিশোধ</th>
                    <th className="py-2.5 px-1.5 text-center text-emerald-900 font-black">অবশিষ্ট</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-emerald-50">
                  {dateHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-gray-400 italic">গুগল শিট থেকে ডাটা লোড হচ্ছে...</td>
                    </tr>
                  ) : dateHistoryList.slice(0, 30).map((r, i) => (
                    <tr key={i} className="text-center items-center hover:bg-emerald-50/40 tabular-nums">
                      <td className="border-r border-emerald-50 py-2 px-1 font-bold text-gray-800">{r.date}</td>
                      <td className="border-r border-emerald-50 py-2">{r.totalOrders}</td>
                      <td className="border-r border-emerald-50 py-2 font-medium">{r.totalOldCustomers}</td>
                      <td className="border-r border-emerald-50 py-2 font-medium">{r.totalNewCustomers}</td>
                      <td className="border-r border-emerald-50 py-2 font-bold">{r.totalTotalCustomers}</td>
                      <td className="border-r border-emerald-50 py-2 font-black text-gray-900">{r.totalSales.toLocaleString('en-IN')}</td>
                      <td className="border-r border-emerald-50 py-2 font-black text-emerald-700">{r.totalProfit.toLocaleString('en-IN')}</td>
                      <td className="border-r border-emerald-50 py-2 text-gray-700 font-medium">{r.totalRepPayment.toLocaleString('en-IN')}</td>
                      <td className="py-2 font-black text-emerald-800 tabular-nums">{(r.totalSales - r.totalRepPayment).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================= 2. POS / SALES SCREEN ================= */}
        {currentTab === 'pos' && (
          <div className="p-3 space-y-3 animate-fadeIn w-full pb-6">
            


            {/* Customer Type Selector */}
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-emerald-100 space-y-2">
              <div className="flex bg-gray-100 rounded-xl p-0.5">
                <button onClick={() => { setSelectedExistingCustomer(''); setNewCustName(''); }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${!selectedExistingCustomer && !newCustName ? 'bg-white shadow text-[#113F33]' : 'text-gray-600'}`}>নগদ ক্রেতা</button>
                <button onClick={() => { setSelectedExistingCustomer(' '); setNewCustName(''); }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${selectedExistingCustomer ? 'bg-white shadow text-[#113F33]' : 'text-gray-600'}`}>পুরাতন খাতা</button>
                <button onClick={() => { setSelectedExistingCustomer(''); setNewCustName(' '); }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${newCustName ? 'bg-white shadow text-[#113F33]' : 'text-gray-600'}`}>নতুন খাতা</button>
              </div>

              {selectedExistingCustomer && (
                <div className="space-y-1">
                  <select 
                    value={selectedExistingCustomer.trim()} 
                    onChange={(e) => setSelectedExistingCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">-- বাকি খাতার ক্রেতা সিলেক্ট করুন --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name} - {c.phone} (বকেয়া: {c.dueAmount})</option>
                    ))}
                  </select>
                </div>
              )}

              {newCustName && (
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <input type="text" placeholder="ক্রেতার নাম" value={newCustName.trim() === '' ? '' : newCustName} onChange={(e) => setNewCustName(e.target.value)} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  <input type="text" placeholder="মোবাইল নম্বর" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  <input type="text" placeholder="ঠিকানা / গ্রাম" value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                </div>
              )}
            </div>

            {/* Search Bar & Category Chips */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  placeholder="পণ্য খুঁজুন (যেমন: তেল, চিনি, সিগারেট, আটা)..."
                  value={posSearchQuery}
                  onChange={(e) => setPosSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B7A5E] shadow-sm"
                />
                {posSearchQuery && (
                  <button onClick={() => setPosSearchQuery('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Horizontal Filter */}
              <div className="flex space-x-1.5 overflow-x-auto p-1 scrollbar-none bg-white rounded-xl border border-gray-100">
                {['সব', ...categoriesList].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition shadow-xs ${
                      selectedCategoryFilter === cat 
                        ? 'bg-[#113F33] text-white' 
                        : 'bg-gray-50 text-gray-700 hover:bg-emerald-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid gap-2 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
              {products
                .filter(p => selectedCategoryFilter === 'সব' || p.category === selectedCategoryFilter)
                .filter(p => matchesProductSearch(p, posSearchQuery))
                .map(product => {
                  const isLow = product.stock <= 5;
                  return (
                    <div 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-2.5 rounded-xl shadow-xs border border-emerald-100 hover:border-emerald-500 transition cursor-pointer flex flex-col justify-between active:scale-95 group"
                    >
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded truncate max-w-[60%]">{product.category}</span>
                          <span className={`px-1.5 py-0.5 rounded ${isLow ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                            {product.stock.toFixed(0)} {product.unit}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 line-clamp-2 mt-1 leading-snug min-h-[2.5em]">{product.name}</h4>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-medium">মূল্য</span>
                          <span className="font-black text-sm text-[#113F33] tabular-nums">{product.sellPrice}</span>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-[#1B7A5E] text-white flex items-center justify-center shadow-xs group-hover:bg-[#113F33] transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
              <button 
                onClick={() => setIsCartModalOpen(true)}
                className="fixed bottom-20 right-4 z-40 bg-[#1B7A5E] hover:bg-[#113F33] text-white py-2.5 px-4 rounded-2xl font-bold shadow-2xl flex items-center gap-2 border-2 border-amber-400 transition hover:scale-105 animate-pulse"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs">{cart.reduce((s, i) => s + i.quantity, 0)} পণ্য | {cartTotal.toLocaleString('en-IN')}</span>
              </button>
            )}

          </div>
        )}

        {/* ================= 3. STOCK SCREEN ================= */}
        {currentTab === 'stock' && (
          <div className="p-3 space-y-3 animate-fadeIn w-full pb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-sm text-gray-900">ইনভেন্টরি ও পণ্য তালিকা ({products.length})</h2>
                <p className="text-[10px] text-gray-500">গুগল শিটের `stock` ট্যাবের সাথে সম্পূর্ণ সিঙ্কড</p>
              </div>
              <button 
                onClick={() => setIsAddProductOpen(true)}
                className="px-3 py-1.5 bg-[#1B7A5E] hover:bg-[#113F33] text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> নতুন পণ্য
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="পণ্য বা প্রতিনিধির নাম দিয়ে খুঁজুন..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B7A5E] shadow-sm"
                />
              </div>
              <div className="flex bg-white rounded-xl p-0.5 border border-gray-200 text-xs">
                <button onClick={() => setStockFilterTab('all')} className={`px-2.5 py-1 rounded-lg font-bold ${stockFilterTab === 'all' ? 'bg-[#113F33] text-white' : 'text-gray-600'}`}>সব</button>
                <button onClick={() => setStockFilterTab('low')} className={`px-2.5 py-1 rounded-lg font-bold ${stockFilterTab === 'low' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}>কম স্টক ({lowStockCount})</button>
              </div>
            </div>

            {/* Stock List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden divide-y divide-emerald-50">
              <div className="p-2.5 bg-emerald-50/50 font-bold text-[10px] text-emerald-900 grid grid-cols-12 gap-1 items-center">
                <div className="col-span-5">পণ্যের নাম ও ক্যাটাগরি</div>
                <div className="col-span-3 text-center">স্টক</div>
                <div className="col-span-4 text-right">ক্রয় / বিক্রয় / প্রতিনিধি</div>
              </div>

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
                      className="p-2.5 grid grid-cols-12 gap-1 items-center text-xs hover:bg-emerald-50/30 transition cursor-pointer"
                    >
                      <div className="col-span-5">
                        <div className="font-bold text-gray-900 line-clamp-1">{product.name}</div>
                        <div className="text-[9px] text-gray-500">{product.category}</div>
                      </div>
                      <div className="col-span-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.stock.toFixed(0)} {product.unit}
                        </span>
                      </div>
                      <div className="col-span-4 text-right">
                        <div className="font-bold text-gray-900">{product.sellPrice}</div>
                        <div className="text-[9px] text-gray-400">ক্রয়: {product.buyPrice} | {product.repName || '-'}</div>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* ================= 4. PROTINIDHI SCREEN (কোম্পানি ক্রয় ও প্রতিনিধি) ================= */}
        {currentTab === 'protinidhi' && (
          <div className="p-3 space-y-3 animate-fadeIn w-full pb-6">
            
            {/* Header & Add Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#1B7A5E]" /> কোম্পানি প্রতিনিধি ও ক্রয় খাতা
                </h2>
                <p className="text-[10px] text-gray-500">কোম্পানি থেকে মাল ক্রয়ের হিসাব ও প্রতিনিধি পরিশোধ</p>
              </div>
              <button 
                onClick={() => setIsAddRepPurchaseOpen(true)}
                className="px-3 py-1.5 bg-[#1B7A5E] hover:bg-[#113F33] text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> + কোম্পানি ক্রয়
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-1.5 w-full">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm text-center">
                <div className="text-[10px] text-gray-500 font-medium">মোট কোম্পানি খরচ</div>
                <div className="text-sm font-black text-gray-900 tabular-nums">
                  {repTransactions.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm text-center">
                <div className="text-[10px] text-gray-500 font-medium">আজকের কেনা</div>
                <div className="text-sm font-black text-emerald-700 tabular-nums">
                  {repTransactions.filter(r => normalizeDate(r.date || r.rawDate) === normalizeDate(new Date())).reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm text-center">
                <div className="text-[10px] text-gray-500 font-medium">প্রতিনিধি সংখ্যা</div>
                <div className="text-sm font-black text-gray-900 tabular-nums">
                  {new Set([...products.map(p => p.repName).filter(Boolean), ...repTransactions.map(r => r.repName).filter(Boolean)]).size} জন
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="প্রতিনিধি বা কোম্পানির নাম দিয়ে খুঁজুন..."
                value={repSearchQuery}
                onChange={(e) => setRepSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-emerald-100 rounded-xl text-xs focus:outline-none focus:border-[#1B7A5E] shadow-sm"
              />
            </div>

            {/* Representatives Directory Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-3 space-y-2">
              <h3 className="font-bold text-xs text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                <Users className="w-3.5 h-3.5 text-[#1B7A5E]" /> কোম্পানি প্রতিনিধিদের ডিরেক্টরি
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from(new Set([
                  ...products.map(p => p.repName).filter(r => r && r !== 'নির্ধারিত নয়'),
                  ...repTransactions.map(r => r.repName).filter(Boolean)
                ])).map((repName) => {
                  const sampleProd = products.find(p => p.repName === repName);
                  const sampleTx = repTransactions.find(r => r.repName === repName);
                  const phone = sampleProd?.repPhone || sampleTx?.phone || '01700000000';
                  const repTotal = repTransactions.filter(r => r.repName === repName).reduce((s, r) => s + r.amount, 0);

                  return (
                    <div key={repName} className="p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-gray-900">{repName}</div>
                        <div className="text-[10px] text-gray-500">{phone}</div>
                        <div className="text-[9px] text-emerald-800 font-semibold mt-0.5">মোট ক্রয়: {repTotal.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <a 
                          href={`tel:${phone}`}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                          title="কল করুন"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            setNewRepName(repName);
                            setNewRepPhone(phone);
                            setIsAddRepPurchaseOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#1B7A5E] text-white font-bold text-[10px] hover:bg-[#113F33] transition"
                        >
                          + ক্রয়
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Protinidhi Transactions History */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="p-2.5 bg-emerald-50/60 border-b border-emerald-100 font-bold text-xs text-emerald-900 flex justify-between items-center">
                <span>কোম্পানি থেকে মাল ক্রয়ের তালিকা ({repTransactions.length})</span>
              </div>
              <div className="divide-y divide-emerald-50 overflow-y-auto max-h-[320px]">
                {repTransactions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 italic">
                    কোনো কোম্পানি ক্রয়ের ডাটা পাওয়া যায়নি
                  </div>
                ) : (
                  repTransactions
                    .filter(r => !repSearchQuery || r.repName.toLowerCase().includes(repSearchQuery.toLowerCase()) || r.productName.toLowerCase().includes(repSearchQuery.toLowerCase()))
                    .map(tx => (
                      <div key={tx.id} className="p-2.5 hover:bg-emerald-50/30 transition flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{tx.repName}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                              {tx.paymentMethod === 'cash' ? 'নগদ' : tx.paymentMethod === 'bkash' ? 'বিকাশ' : 'ব্যাংক'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">{tx.productName}</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">{tx.date} {tx.memoNo ? `• মেমো: ${tx.memoNo}` : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-gray-900 tabular-nums">
                            {tx.amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[9px] text-emerald-700 font-bold">পরিশোধিত</div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= 5. SALES LEDGER ("বাকি খাতা") ================= */}
        {currentTab === 'ledger' && (
          <div className="p-3 space-y-3 animate-fadeIn w-full pb-6">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="ক্রেতার নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                value={ledgerSearchQuery}
                onChange={(e) => setLedgerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-emerald-100 rounded-xl text-xs focus:outline-none focus:border-[#1B7A5E] shadow-sm"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="p-2.5 bg-emerald-50/50 border-b border-emerald-100 font-bold text-[10px] text-emerald-900 grid grid-cols-6 gap-1 items-center text-center">
                <div className="text-left">ইনভয়েস ও নাম</div>
                <div>মোবাইল</div>
                <div>ঠিকানা</div>
                <div>বাকি</div>
                <div className="col-span-2">জমা নিন (0 বাকি)</div>
              </div>

              <div className="divide-y divide-emerald-50 overflow-y-auto">
                {customers
                  .filter(c => c.dueAmount > 0)
                  .filter(c => 
                    c.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || 
                    String(c.phone).includes(ledgerSearchQuery) ||
                    (c.invoiceNo && c.invoiceNo.toLowerCase().includes(ledgerSearchQuery.toLowerCase())) ||
                    c.address.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
                  )
                  .map(customer => (
                    <div key={customer.id} className="p-2.5 grid grid-cols-6 gap-1 items-center text-xs border-b border-emerald-50 hover:bg-emerald-50/30 transition text-center">
                      <div className="text-left truncate">
                        <div className="font-bold text-gray-900 truncate">{customer.name}</div>
                        <div className="text-[9px] text-[#1B7A5E] font-bold">{customer.invoiceNo || 'ইনভয়েস নেই'}</div>
                      </div>
                      <div className="text-gray-600 truncate text-[11px]">{customer.phone}</div>
                      <div className="text-gray-500 truncate text-[10px]">{customer.address}</div>
                      <div className="font-black text-red-600 tabular-nums">{customer.dueAmount.toLocaleString('en-IN')}</div>
                      <div className="flex justify-center col-span-2">
                        <button 
                          onClick={() => { setDepositModalCustomer(customer); setDepositAmountInput(String(customer.dueAmount)); }}
                          className="px-2.5 py-1 rounded-lg bg-[#1B7A5E] text-white font-bold text-[10px] shadow-xs active:scale-95 transition hover:bg-[#113F33]"
                        >
                          সম্পূর্ণ জমা (0 বাকি)
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 6. MORE / SETTINGS SCREEN ================= */}
        {currentTab === 'more' && (
          <div className="p-3 space-y-3 animate-fadeIn w-full pb-6">
            
            {/* Profile Card */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow border border-[#1B7A5E] overflow-hidden flex items-center justify-center flex-shrink-0">
                <img 
                  src="/assets/aistudio/image_2aae7fd3.png" 
                  alt="Store Logo" 
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">{STORE_NAME}</h2>
                <p className="text-[11px] text-gray-500">প্রোপ্রাইটর • মোবাইল: {STORE_PHONE}</p>
                <p className="text-[10px] text-[#1B7A5E] font-medium mt-0.5">{STORE_ADDRESS}</p>
              </div>
            </div>

            {/* Menu Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden divide-y divide-emerald-50 text-xs">
              <button onClick={handleInstallClick} className="w-full p-3 flex items-center justify-between hover:bg-amber-50/40 transition-all border-l-4 border-l-amber-500">
                <div className="flex items-center space-x-3">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-gray-800">অ্যাপ ইনস্টল করুন</span>
                </div>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">{isInstalled ? 'ইন্সটলড' : 'ইন্সটল'}</span>
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

              <button onClick={downloadHisabReportZip} className="w-full p-3 flex items-center justify-between hover:bg-emerald-50/40 transition-all border-l-4 border-l-emerald-600">
                <div className="flex items-center space-x-3">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <span className="font-bold text-gray-800 block text-xs">হিসাব রিপোর্ট (Excel ও PDF)</span>
                    <span className="text-[9px] text-gray-500 block">এক ক্লিকে জিপ ফাইলে এক্সেল ও পিডিএফ রিপোর্ট ডাউনলোড</span>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">ZIP</span>
              </button>

              <button onClick={() => showToast('ব্লুটুথ প্রিন্টার কানেকশন প্রস্তুত হচ্ছে', 'info')} className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center space-x-3">
                  <Printer className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-700">ব্লুটুথ প্রিন্টার সেটিংস</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <button onClick={async () => {
                const success = await handleSync();
                if (success) showToast('ডাটা সফলভাবে ব্যাকআপ নেওয়া হয়েছে!', 'success');
                else showToast('ব্যাকআপ নিতে সমস্যা হয়েছে।', 'error');
              }} className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center space-x-3">
                  <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="font-medium text-gray-700">ক্লাউড ব্যাকআপ সিঙ্ক</span>
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">লাইভ</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col items-center space-y-1">
              <p className="text-[10px] text-gray-400 font-bold">App Version: {BUILD_VERSION}</p>
              <button 
                onClick={() => {
                  localStorage.clear();
                  showToast('ক্যাশ পরিষ্কার করা হয়েছে। রিফ্রেশ হচ্ছে...', 'info');
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }}
                className="text-[10px] text-red-500 border border-red-100 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Clear Local Cache
              </button>
            </div>
          </div>
        )}

      </main>

      {/* FIXED BOTTOM NAVIGATION FOOTER */}
      <nav className="flex-none h-16 bg-[#113F33] text-emerald-100 border-t border-[#1B7A5E] px-1 flex justify-around items-center z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] safe-area-bottom">
        
        <button 
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl transition ${currentTab === 'home' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px]">হোম</span>
        </button>

        <button 
          onClick={() => setCurrentTab('pos')}
          className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl transition relative ${currentTab === 'pos' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px]">বিক্রি</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 right-0.5 w-4 h-4 bg-amber-400 text-gray-900 font-bold text-[9px] rounded-full flex items-center justify-center animate-bounce">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button 
          onClick={() => setCurrentTab('stock')}
          className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl transition relative ${currentTab === 'stock' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">স্টক</span>
          {lowStockCount > 0 && (
            <span className="absolute -top-1 right-0.5 w-4 h-4 bg-amber-400 text-gray-900 font-bold text-[9px] rounded-full flex items-center justify-center">
              {lowStockCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => setCurrentTab('protinidhi')}
          className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl transition ${currentTab === 'protinidhi' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px]">প্রতিনিধি</span>
        </button>

        <button 
          onClick={() => setCurrentTab('ledger')}
          className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl transition ${currentTab === 'ledger' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">বাকি খাতা</span>
        </button>

        <button 
          onClick={() => setCurrentTab('more')}
          className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl transition ${currentTab === 'more' ? 'bg-[#1B7A5E] text-white font-bold shadow' : 'hover:text-white'}`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">আরও</span>
        </button>

      </nav>

      {/* ================= MODALS ================= */}

      {/* 1. Add Company Purchase / Rep Payment Modal */}
      {isAddRepPurchaseOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#1B7A5E]" /> কোম্পানি থেকে মাল ক্রয় ও পরিশোধ
              </h3>
              <button onClick={() => setIsAddRepPurchaseOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-gray-600 font-medium block mb-1">কোম্পানি / প্রতিনিধির নাম</label>
                <input 
                  type="text" 
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  placeholder="যেমন: ফ্রেশ, তীর, আবুল খায়ের, স্কয়ার..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#1B7A5E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-600 font-medium block mb-1">মোবাইল নম্বর</label>
                  <input 
                    type="text" 
                    value={newRepPhone}
                    onChange={(e) => setNewRepPhone(e.target.value)}
                    placeholder="01700000000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium block mb-1">চালান / মেমো নং</label>
                  <input 
                    type="text" 
                    value={newRepMemo}
                    onChange={(e) => setNewRepMemo(e.target.value)}
                    placeholder="ঐচ্ছিক"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 font-medium block mb-1">পণ্যের বিবরণ / ক্রয়কৃত আইটেম</label>
                <input 
                  type="text" 
                  value={newRepProduct}
                  onChange={(e) => setNewRepProduct(e.target.value)}
                  placeholder="যেমন: সয়াবিন তেল ২০ লিটার, আটা ৫ বস্তা..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-600 font-medium block mb-1">পরিশোধিত টাকা</label>
                  <input 
                    type="number" 
                    value={newRepAmount}
                    onChange={(e) => setNewRepAmount(e.target.value)}
                    placeholder="টাকার পরিমাণ..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-black text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium block mb-1">পেমেন্ট মাধ্যম</label>
                  <select 
                    value={newRepMethod}
                    onChange={(e) => setNewRepMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="bank">ব্যাংক (Bank)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              <button 
                onClick={() => setIsAddRepPurchaseOpen(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
              >
                বাতিল
              </button>
              <button 
                onClick={handleAddRepPurchase}
                className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                সেভ ও শিট সিঙ্ক
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cart Modal */}
      {isCartModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#1B7A5E]" />
                <h3 className="font-bold text-sm text-gray-900">কার্টের পণ্য ও বিল</h3>
              </div>
              <button onClick={() => setIsCartModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.map(item => (
                <div key={item.product.id} className="bg-gray-50 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="font-bold text-gray-900 truncate">{item.product.name}</div>
                    <div className="text-[10px] text-gray-500">
                      দর: {item.product.sellPrice} × {item.quantity} = {item.product.sellPrice * item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button onClick={() => updateCartQuantity(item.product.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="font-bold text-xs text-gray-900 w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product.id, 1)} className="w-6 h-6 rounded-lg bg-[#1B7A5E] text-white font-bold flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-700">
                <span>মোট সাবটোটাল:</span>
                <span className="font-bold">{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">ছাড় (Discount):</span>
                <input 
                  type="number" 
                  value={discountInput || ''} 
                  onChange={(e) => setDiscountInput(Number(e.target.value))} 
                  placeholder="0" 
                  className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs" 
                />
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-emerald-200 font-bold text-sm text-[#113F33]">
                <span>সর্বমোট বিল:</span>
                <span className="text-emerald-900 font-black">{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-emerald-200">
                <span className="text-gray-700 font-bold">নগদ প্রদান (Paid):</span>
                <input 
                  type="number" 
                  value={cashPaidInput} 
                  onChange={(e) => setCashPaidInput(e.target.value)} 
                  placeholder={String(cartTotal)} 
                  className="w-24 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-right font-black text-emerald-800 text-xs" 
                />
              </div>
              <div className="flex justify-between text-red-600 font-bold pt-0.5">
                <span>বাকি (Due):</span>
                <span>{Math.max(0, cartTotal - (cashPaidInput !== '' ? Number(cashPaidInput) : cartTotal)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setIsCartModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">আরও পণ্য যোগ</button>
              <button 
                onClick={() => {
                  setIsCartModalOpen(false);
                  handlePreparePrintPreview();
                }}
                className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33] flex items-center justify-center gap-1"
              >
                <Receipt className="w-4 h-4" /> মেমো ও সাবমিট
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#1B7A5E]" /> নতুন পণ্য যোগ করুন
              </h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-gray-600 block mb-0.5">পণ্যের নাম</label>
                <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="যেমন: তীর সয়াবিন তেল ২ লিটার" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-600 block mb-0.5">ক্যাটাগরি</label>
                  <select value={newProductCategory} onChange={(e) => { if (e.target.value === 'ADD_NEW') setIsCategoryModalOpen(true); else setNewProductCategory(e.target.value); }} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="ADD_NEW">+ নতুন ক্যাটাগরি...</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 block mb-0.5">একক</label>
                  <select value={newProductUnit} onChange={(e) => { if (e.target.value === 'ADD_NEW') setIsCategoryModalOpen(true); else setNewProductUnit(e.target.value); }} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                    {unitsList.map(u => <option key={u} value={u}>{u}</option>)}
                    <option value="ADD_NEW">+ নতুন একক...</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-gray-600 block mb-0.5">স্টক</label>
                  <input type="number" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} placeholder="0" className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="text-gray-600 block mb-0.5">ক্রয় মূল্য</label>
                  <input type="number" value={newProductBuy} onChange={(e) => setNewProductBuy(e.target.value)} placeholder="0" className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="text-gray-600 block mb-0.5">বিক্রয় মূল্য</label>
                  <input type="number" value={newProductSell} onChange={(e) => setNewProductSell(e.target.value)} placeholder="0" className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold text-emerald-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-600 block mb-0.5">কোম্পানি / প্রতিনিধি</label>
                  <input type="text" value={newProductRepName} onChange={(e) => setNewProductRepName(e.target.value)} placeholder="প্রতিনিধির নাম" className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-gray-600 block mb-0.5">প্রতিনিধির ফোন</label>
                  <input type="text" value={newProductRepPhone} onChange={(e) => setNewProductRepPhone(e.target.value)} placeholder="01700000000" className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              <button onClick={() => setIsAddProductOpen(false)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">বাতিল</button>
              <button 
                onClick={async () => {
                  if (!newProductName.trim()) {
                    showToast('দয়া করে পণ্যের নাম দিন', 'error');
                    return;
                  }
                  const newProd: Product = {
                    id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: newProductName.trim(),
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
                  const updatedProducts = [newProd, ...products];
                  setProducts(updatedProducts);
                  logActivity('new_product', `নতুন পণ্য: ${newProd.name}`, `ক্যাটাগরি: ${newProd.category}, স্টক: ${newProd.stock}`, newProd.buyPrice * newProd.stock);
                  setIsAddProductOpen(false);
                  showToast('পণ্যটি সফলভাবে সংরক্ষিত হয়েছে!', 'success');
                  await handleSync(orders, updatedProducts, customers, categoriesList, unitsList, payments, repTransactions);
                }}
                className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Product / Restock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#1B7A5E]" /> স্টক আপডেট: {editingProduct.name}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="font-bold text-[#113F33] block">নতুন স্টক যোগ (Stock In):</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="পরিমাণ..."
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl font-black text-emerald-700"
                  />
                  <button 
                    onClick={async () => {
                      const amt = Number(restockAmount);
                      if (isNaN(amt) || amt <= 0) return;
                      const updatedProducts = products.map(p => p.id === editingProduct.id ? { ...p, stock: p.stock + amt } : p);
                      setProducts(updatedProducts);
                      logActivity('stock_in', `স্টক ইন: ${editingProduct.name}`, `${amt} ${editingProduct.unit} যুক্ত`, editingProduct.buyPrice * amt);
                      showToast(`${amt} ${editingProduct.unit} স্টক যোগ করা হয়েছে।`, 'success');
                      setRestockAmount('');
                      await handleSync(orders, updatedProducts, customers, categoriesList, unitsList, payments, repTransactions);
                    }}
                    className="px-4 py-2 bg-[#1B7A5E] text-white rounded-xl font-bold"
                  >
                    যোগ
                  </button>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium">বর্তমান স্টক: {editingProduct.stock} {editingProduct.unit}</p>
              </div>

              <div className="space-y-2">
                <input type="text" placeholder="পণ্যের নাম" value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="ক্রয় মূল্য" value={editProdBuy} onChange={(e) => setEditProdBuy(e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold" />
                  <input type="number" placeholder="বিক্রয় মূল্য" value={editProdSell} onChange={(e) => setEditProdSell(e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-emerald-700" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="প্রতিনিধি" value={editProdRep} onChange={(e) => setEditProdRep(e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  <input type="text" placeholder="ফোন" value={editProdPhone} onChange={(e) => setEditProdPhone(e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
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
                        repPhone: editProdPhone
                      };
                    }
                    return p;
                  });
                  setProducts(updatedProducts);
                  setEditingProduct(null);
                  showToast('পণ্যের তথ্য আপডেট হয়েছে', 'success');
                  await handleSync(orders, updatedProducts, customers, categoriesList, unitsList, payments, repTransactions);
                }}
                className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                আপডেট সেভ
              </button>
              <button 
                onClick={async () => {
                  if (confirm('আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?')) {
                    const updatedProducts = products.filter(p => p.id !== editingProduct.id);
                    setProducts(updatedProducts);
                    setEditingProduct(null);
                    showToast('পণ্যটি মুছে ফেলা হয়েছে', 'info');
                    await handleSync(orders, updatedProducts, customers, categoriesList, unitsList, payments, repTransactions);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Deposit Payment Modal */}
      {depositModalCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#1B7A5E]" /> টাকা জমা নিন
              </h3>
              <button onClick={() => setDepositModalCustomer(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1 border border-gray-200">
              <div className="font-bold text-gray-900">{depositModalCustomer.name} ({depositModalCustomer.phone})</div>
              <div className="text-red-600 font-bold">বর্তমান বকেয়া: {depositModalCustomer.dueAmount.toLocaleString('en-IN')}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-gray-600 block mb-0.5">জমার পরিমাণ (টাকা)</label>
                <input 
                  type="number"
                  value={depositAmountInput}
                  onChange={(e) => setDepositAmountInput(e.target.value)}
                  placeholder="টাকার পরিমাণ..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-0.5">পেমেন্ট মাধ্যম</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setDepositMethod('cash')} className={`py-1.5 rounded-xl font-bold border ${depositMethod === 'cash' ? 'bg-[#1B7A5E] text-white border-[#1B7A5E]' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>নগদ</button>
                  <button onClick={() => setDepositMethod('bkash')} className={`py-1.5 rounded-xl font-bold border ${depositMethod === 'bkash' ? 'bg-pink-600 text-white border-pink-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>বিকাশ</button>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              <button onClick={() => setDepositModalCustomer(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">বাতিল</button>
              <button 
                onClick={async () => {
                  const amt = Number(depositAmountInput);
                  if (isNaN(amt) || amt <= 0) {
                    showToast('দয়া করে সঠিক জমার পরিমাণ লিখুন', 'error');
                    return;
                  }
                  
                  const updatedCustomers: Customer[] = customers.map(c => {
                    if (c.id === depositModalCustomer.id || (depositModalCustomer.invoiceNo && c.invoiceNo === depositModalCustomer.invoiceNo)) {
                      const newDue = Math.max(0, c.dueAmount - amt);
                      return { ...c, dueAmount: newDue, status: newDue > 0 ? 'pending' : 'clear' };
                    }
                    return c;
                  });

                  const newPayment: PaymentRecord = {
                    id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    customerName: depositModalCustomer.name,
                    customerPhone: depositModalCustomer.phone,
                    amount: amt,
                    method: depositMethod,
                    date: formatDate(new Date()),
                    timestamp: new Date().toISOString()
                  };

                  const updatedPayments = [newPayment, ...payments];
                  setCustomers(updatedCustomers);
                  setPayments(updatedPayments);
                  
                  logActivity('payment', `টাকা জমা: ${depositModalCustomer.name}`, `${amt} (${depositMethod}) জমা গ্রহণ`, amt);
                  showToast(`সফলভাবে ${amt} জমা গ্রহণ করা হয়েছে।`, 'success');
                  
                  setDepositModalCustomer(null);
                  setDepositAmountInput('');
                  await handleSync(orders, products, updatedCustomers, categoriesList, unitsList, updatedPayments, repTransactions);
                }}
                className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                জমা নিশ্চিত
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Memo Print Preview Modal */}
      {printPreviewOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#1B7A5E]" /> ক্যাশ মেমো প্রিভিউ
              </h3>
              <button onClick={() => setPrintPreviewOrder(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-[#FFFDF9] border border-dashed border-gray-300 p-3 rounded-xl text-xs font-mono space-y-2 shadow-inner">
              <div className="text-center space-y-0.5">
                <h4 className="font-bold text-sm text-[#113F33]">{STORE_NAME}</h4>
                <p className="text-[10px] text-gray-500">{STORE_ADDRESS} • {STORE_PHONE}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-1 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>ইনভয়েস: {printPreviewOrder.invoiceNo}</span>
                  <span>{printPreviewOrder.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>ক্রেতা: {printPreviewOrder.customerName}</span>
                  <span>মোবাইল: {printPreviewOrder.customerPhone}</span>
                </div>
              </div>

              <div className="space-y-1">
                {printPreviewOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[140px]">{item.product.name}</span>
                    <span>{item.quantity} × {item.product.sellPrice} = {item.product.sellPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-1.5 space-y-0.5">
                <div className="flex justify-between font-bold text-sm text-[#113F33] pt-0.5">
                  <span>সর্বমোট বিল:</span>
                  <span>{printPreviewOrder.total}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>নগদ জমা:</span>
                  <span>{printPreviewOrder.paid}</span>
                </div>
                {printPreviewOrder.due > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>বাকি:</span>
                    <span>{printPreviewOrder.due}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={() => showToast('থার্মাল প্রিন্ট কমান্ড পাঠানো হয়েছে!', 'success')}
                className="py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-200"
              >
                <Printer className="w-3.5 h-3.5" /> প্রিন্ট
              </button>
              <button 
                onClick={handleConfirmAndSubmitSale}
                disabled={isSubmittingSale}
                className="py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs flex items-center justify-center gap-1 shadow hover:bg-[#113F33]"
              >
                <Check className={`w-3.5 h-3.5 ${isSubmittingSale ? 'animate-spin' : ''}`} /> 
                {isSubmittingSale ? 'সিঙ্ক হচ্ছে...' : 'সাবমিট ও সিঙ্ক'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-3 shadow-2xl border border-gray-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-[#1B7A5E] rounded-full flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-gray-900">বিক্রি সফলভাবে শিটে সেভ হয়েছে!</h3>
            <p className="text-xs text-gray-500">ইনভয়েস নম্বর: {successModal.invoiceNo}</p>
            <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between"><span>মোট বিল:</span><span className="font-bold">{successModal.total}</span></div>
              <div className="flex justify-between text-emerald-700 font-bold"><span>জমা:</span><span>{successModal.paid}</span></div>
              {successModal.due > 0 && <div className="flex justify-between text-red-600 font-bold"><span>বাকি:</span><span>{successModal.due}</span></div>}
            </div>
            <button onClick={() => setSuccessModal(null)} className="w-full py-2.5 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]">ঠিক আছে</button>
          </div>
        </div>
      )}

      {/* 8. Category & Unit Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-xs text-gray-900">ক্যাটাগরি ও একক সেটিংস</h3>
              <button onClick={() => { setIsCategoryModalOpen(false); handleSync(); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Category Management */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-700">ক্যাটাগরি যোগ করুন</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCatInput} 
                  onChange={(e) => setNewCatInput(e.target.value)} 
                  placeholder="নতুন ক্যাটাগরি..." 
                  className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" 
                />
                <button 
                  onClick={() => { 
                    if (newCatInput.trim() && !categoriesList.includes(newCatInput.trim())) { 
                      const updated = [...categoriesList, newCatInput.trim()]; 
                      setCategoriesList(updated); 
                      setNewCatInput(''); 
                      handleSync(orders, products, customers, updated, unitsList, payments, repTransactions); 
                      showToast(`ক্যাটাগরি "${newCatInput.trim()}" যোগ হয়েছে!`, 'success');
                    } 
                  }} 
                  className="px-3 py-1.5 bg-[#1B7A5E] text-white rounded-xl text-xs font-bold"
                >
                  যোগ
                </button>
              </div>

              {/* Edit Category Inline */}
              {editingCategory && (
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="text-[10px] font-bold text-emerald-900">ক্যাটাগরি এডিট করুন ({editingCategory.original}):</div>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      value={editingCategory.current} 
                      onChange={(e) => setEditingCategory({ ...editingCategory, current: e.target.value })} 
                      className="flex-1 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs" 
                    />
                    <button 
                      onClick={() => {
                        const newName = editingCategory.current.trim();
                        if (newName && newName !== editingCategory.original) {
                          const updatedCats = categoriesList.map(c => c === editingCategory.original ? newName : c);
                          setCategoriesList(updatedCats);
                          const updatedProds = products.map(p => p.category === editingCategory.original ? { ...p, category: newName } : p);
                          setProducts(updatedProds);
                          handleSync(orders, updatedProds, customers, updatedCats, unitsList, payments, repTransactions);
                          showToast(`ক্যাটাগরি "${editingCategory.original}" আপডেট করে "${newName}" করা হয়েছে!`, 'success');
                        }
                        setEditingCategory(null);
                      }}
                      className="px-2.5 py-1 bg-[#1B7A5E] text-white rounded-lg text-xs font-bold"
                    >
                      আপডেট
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs">বাতিল</button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {categoriesList.map(cat => (
                  <span key={cat} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-medium border border-emerald-100">
                    <span>{cat}</span>
                    <button 
                      onClick={() => setEditingCategory({ original: cat, current: cat })} 
                      className="text-gray-400 hover:text-emerald-700 p-0.5" 
                      title="এডিট / আপডেট"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => { 
                        const updated = categoriesList.filter(c => c !== cat); 
                        setCategoriesList(updated); 
                        handleSync(orders, products, customers, updated, unitsList, payments, repTransactions); 
                        showToast(`ক্যাটাগরি "${cat}" শিট থেকে মুছে ফেলা হয়েছে`, 'info');
                      }} 
                      className="text-red-400 hover:text-red-600 p-0.5" 
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            {/* Unit Management */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-700">একক (Unit) যোগ করুন</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newUnitInput} 
                  onChange={(e) => setNewUnitInput(e.target.value)} 
                  placeholder="নতুন একক..." 
                  className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" 
                />
                <button 
                  onClick={() => { 
                    if (newUnitInput.trim() && !unitsList.includes(newUnitInput.trim())) { 
                      const updated = [...unitsList, newUnitInput.trim()]; 
                      setUnitsList(updated); 
                      setNewUnitInput(''); 
                      handleSync(orders, products, customers, categoriesList, updated, payments, repTransactions); 
                      showToast(`একক "${newUnitInput.trim()}" যোগ হয়েছে!`, 'success');
                    } 
                  }} 
                  className="px-3 py-1.5 bg-[#1B7A5E] text-white rounded-xl text-xs font-bold"
                >
                  যোগ
                </button>
              </div>

              {/* Edit Unit Inline */}
              {editingUnit && (
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 space-y-1.5">
                  <div className="text-[10px] font-bold text-blue-900">একক এডিট / আপডেট করুন ({editingUnit.original}):</div>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      value={editingUnit.current} 
                      onChange={(e) => setEditingUnit({ ...editingUnit, current: e.target.value })} 
                      className="flex-1 px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs" 
                    />
                    <button 
                      onClick={() => {
                        const newName = editingUnit.current.trim();
                        if (newName && newName !== editingUnit.original) {
                          const updatedUnits = unitsList.map(u => u === editingUnit.original ? newName : u);
                          setUnitsList(updatedUnits);
                          const updatedProds = products.map(p => p.unit === editingUnit.original ? { ...p, unit: newName } : p);
                          setProducts(updatedProds);
                          handleSync(orders, updatedProds, customers, categoriesList, updatedUnits, payments, repTransactions);
                          showToast(`একক "${editingUnit.original}" আপডেট করে "${newName}" করা হয়েছে!`, 'success');
                        }
                        setEditingUnit(null);
                      }}
                      className="px-2.5 py-1 bg-blue-700 text-white rounded-lg text-xs font-bold"
                    >
                      আপডেট
                    </button>
                    <button onClick={() => setEditingUnit(null)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs">বাতিল</button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {unitsList.map(u => (
                  <span key={u} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-medium border border-blue-100">
                    <span>{u}</span>
                    <button 
                      onClick={() => setEditingUnit({ original: u, current: u })} 
                      className="text-gray-400 hover:text-blue-700 p-0.5" 
                      title="এডিট / আপডেট"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => { 
                        const updated = unitsList.filter(unit => unit !== u); 
                        setUnitsList(updated); 
                        handleSync(orders, products, customers, categoriesList, updated, payments, repTransactions); 
                        showToast(`একক "${u}" শিট থেকে মুছে ফেলা হয়েছে`, 'info');
                      }} 
                      className="text-red-400 hover:text-red-600 p-0.5" 
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Google Apps Script Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 space-y-3 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1B7A5E]" /> গুগল শিট অটোমেশন কোড (Apps Script)
              </h3>
              <button onClick={() => setIsScriptModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[10px] text-amber-800 space-y-1">
              <p className="font-bold">নতুন আপডেট দেওয়ার নিয়ম:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>গুগল শিটে উপরে <b>Extensions &gt; Apps Script</b> এ যান।</li>
                <li>পূর্বের সব কোড মুছে দিয়ে নিচের কোডটি পেস্ট করে উপরে <b>Save (💾)</b> চাপুন।</li>
                <li>ফাংশন ড্রপডাউনে <b>setupAllSheets</b> সিলেক্ট করে <b>Run</b> চাপুন — এতে <b>protinidhi</b> সহ সব শিট স্বয়ংক্রিয়ভাবে তৈরি হবে!</li>
                <li>উপরে <b>Deploy &gt; Manage Deployments &gt; Edit (পেন্সিল)</b> এ গিয়ে <b>Version: New Version</b> সিলেক্ট করে <b>Deploy</b> চাপুন।</li>
              </ol>
            </div>

            <div className="bg-gray-900 text-emerald-400 p-3 rounded-xl text-[9px] font-mono overflow-y-auto flex-1 select-all space-y-1 border border-gray-700 max-h-[300px]">
              <pre>{`const REQUIRED_SHEETS = {
  'bikri': ['invoice no', 'date', 'customer name', 'customer mobile', 'location', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit', 'datetime'],
  'stock': ['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone', 'searchKeyword', 'datetime'],
  'bakir khata': ['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'createdAt', 'status', 'datetime'],
  'category': ['category_name', 'datetime'],
  'units': ['unit_name', 'datetime'],
  'joma': ['id', 'customerName', 'customerPhone', 'amount', 'method', 'date', 'timestamp', 'datetime'],
  'protinidhi': ['id', 'date', 'rep_name', 'phone', 'product_name', 'amount', 'payment_method', 'memo_no', 'notes', 'datetime']
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('আব্দুস সালাম স্টোর')
    .addItem('সবগুলো শিট ও প্রতিনিধি ট্যাব তৈরি করুন', 'setupAllSheets')
    .addToUi();
}

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllRequiredSheets(ss);
  try {
    SpreadsheetApp.getUi().alert('সাফল্য: protinidhi-সহ সবগুলো শিট ও হেডার সফলভাবে তৈরি ও সাজানো হয়েছে!');
  } catch (e) {}
}

function ensureAllRequiredSheets(ss) {
  Object.keys(REQUIRED_SHEETS).forEach(sheetName => {
    let sheet = getSheetByNameLoose(ss, sheetName);
    const headers = REQUIRED_SHEETS[sheetName];
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
      sheet.setFrozenRows(1);
    } else {
      const data = sheet.getDataRange().getValues();
      if (data.length === 0 || data[0].length === 0 || !data[0][0]) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
        sheet.setFrozenRows(1);
      }
    }
  });
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllRequiredSheets(ss);
  const action = e && e.parameter ? e.parameter.action : 'getData';
  if (action === 'getData' || action === 'setup') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      stock: getSheetData(ss, 'stock'),
      bikri: getSheetData(ss, 'bikri'),
      bakir_khata: getSheetData(ss, 'bakir khata'),
      category: getSheetData(ss, 'category'),
      units: getSheetData(ss, 'units'),
      joma: getSheetData(ss, 'joma'),
      protinidhi: getSheetData(ss, 'protinidhi')
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Abdus Salam Store API Live' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureAllRequiredSheets(ss);
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'syncData') {
      if (data.bikri && data.bikri.length > 0) updateSheet(ss, 'bikri', data.bikri);
      if (data.stock && data.stock.length > 0) updateSheet(ss, 'stock', data.stock);
      if (data['bakir khata'] && data['bakir khata'].length > 0) updateSheet(ss, 'bakir khata', data['bakir khata']);
      if (data.category && data.category.length > 0) updateSheet(ss, 'category', data.category);
      if (data.units && data.units.length > 0) updateSheet(ss, 'units', data.units);
      if (data.joma && data.joma.length > 0) updateSheet(ss, 'joma', data.joma);
      if (data.protinidhi && data.protinidhi.length > 0) updateSheet(ss, 'protinidhi', data.protinidhi);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getSheetByNameLoose(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  const allSheets = ss.getSheets();
  for (let s of allSheets) {
    const sName = s.getName().trim().toLowerCase();
    if (sName === name.toLowerCase()) return s;
    if (name === 'category' && (sName === 'catgeory' || sName === 'categories')) return s;
    if (name === 'bakir khata' && (sName === 'bakir_khata' || sName === 'baki' || sName === 'customers')) return s;
    if (name === 'protinidhi' && (sName === 'representative' || sName === 'rep')) return s;
  }
  return null;
}

function getSheetData(ss, sheetName) {
  let sheet = getSheetByNameLoose(ss, sheetName);
  if (!sheet) { sheet = ss.insertSheet(sheetName); return []; }
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) val = val.toISOString();
      const key = h ? h.toString().toLowerCase().trim() : 'col_' + i;
      obj[key] = val;
    });
    return obj;
  });
}

function updateSheet(ss, sheetName, data) {
  if (!data || !Array.isArray(data) || data.length === 0) return;
  let sheet = getSheetByNameLoose(ss, sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  const lastRow = sheet.getLastRow();
  const headers = Object.keys(data[0]);
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
    sheet.setFrozenRows(1);
  }
  const existingData = sheet.getDataRange().getValues();
  const existingHeaders = existingData.length > 0 ? existingData[0] : headers;
  const existingKeys = new Set();
  let keyColIdx = 0;
  for (let i = 0; i < existingHeaders.length; i++) {
    const h = String(existingHeaders[i]).toLowerCase().trim();
    if (h.includes('invoice') || h === 'id' || h.includes('name')) {
      keyColIdx = i;
      break;
    }
  }
  if (existingData.length > 1) {
    for (let r = 1; r < existingData.length; r++) {
      existingKeys.add(String(existingData[r][keyColIdx]));
    }
  }
  const newRows = [];
  data.forEach(row => {
    const keyValue = String(row[headers[keyColIdx]] || row[headers[0]] || '');
    const valuesArr = headers.map(h => {
      let val = row[h];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val !== undefined ? val : '';
    });
    if (!existingKeys.has(keyValue)) {
      newRows.push(valuesArr);
      existingKeys.add(keyValue);
    }
  });
  if (newRows.length > 0) {
    const targetRow = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(targetRow, 1, newRows.length, headers.length).setValues(newRows);
  }
}`}</pre>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => {
                  const pre = document.querySelector('pre');
                  const code = pre ? pre.innerText : '';
                  navigator.clipboard.writeText(code);
                  showToast('কোড কপি করা হয়েছে!', 'success');
                }}
                className="flex-1 py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs shadow hover:bg-[#113F33]"
              >
                কোড কপি করুন
              </button>
              <button onClick={() => setIsScriptModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* 10. iOS Safari PWA Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl border border-gray-200 text-center">
            <Smartphone className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="font-bold text-sm text-gray-900">আইফোনে অ্যাপ ইনস্টল নিয়ম</h3>
            <p className="text-xs text-gray-600 text-left">Safari ব্রাউজারের নিচে Share Icon এ ট্যাপ করে 'Add to Home Screen' চাপুন।</p>
            <button onClick={() => setShowIOSGuide(false)} className="w-full py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs">বুঝতে পেরেছি</button>
          </div>
        </div>
      )}

      {/* 11. General PWA Instruction Modal */}
      {showPWAInstructionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl border border-gray-200 text-center">
            <Download className="w-8 h-8 text-[#1B7A5E] mx-auto" />
            <h3 className="font-bold text-sm text-gray-900">মোবাইলে অ্যাপ হিসেবে সেভ করুন</h3>
            <p className="text-xs text-gray-600">ব্রাউজারের ৩-ডট (⋮) মেনুতে ক্লিক করে 'Install App' বা 'Add to Home screen' চাপুন।</p>
            <button onClick={() => setShowPWAInstructionModal(false)} className="w-full py-2 rounded-xl bg-[#1B7A5E] text-white font-bold text-xs">ঠিক আছে</button>
          </div>
        </div>
      )}

    </div>
  );
}
