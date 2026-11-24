import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car, Fuel, Wrench, Receipt, Bell, ShieldCheck, Plus, Download, Upload,
  Trash2, Edit3, CheckCircle2, AlertTriangle, Calendar, Gauge, DollarSign,
  MapPin, FileText, Copy, Search, History, RotateCcw, Database, HardDrive,
  Moon, Sun, Layers, Archive, FileSpreadsheet, FileJson, Info, Sparkles,
  X, Check, Settings, Save, Eye, CloudUpload, ServerOff, Camera,
  Image as ImageIcon, Droplet, Disc, Navigation, Briefcase, TrendingUp,
  Tag, Maximize2, FolderOpen, KeyRound, ExternalLink, RefreshCw, Shield
} from 'lucide-react';

// ============================================================================
// STORAGE KEYS & HELPERS (100% FREE, UNLIMITED, LOCAL-FIRST)
// ============================================================================

const STORAGE_KEY_DATA = 'vlp_free_database_v3';
const STORAGE_KEY_SNAPSHOTS = 'vlp_free_snapshots_v3';
const STORAGE_KEY_THEME = 'vlp_free_theme_v3';
const STORAGE_KEY_PRIVACY_ACK = 'vlp_free_privacy_ack_v3';
const STORAGE_KEY_GDRIVE_CLIENT = 'vlp_free_gdrive_client_v3';

const OIL_VISCOSITY_PRESETS = ['0W-16', '0W-20', '5W-20', '5W-30', '5W-40', '0W-40', '10W-30'];
const BOLT_PATTERN_PRESETS = ['5x114.3', '5x100', '5x120', '6x139.7', '6x135', '4x100', '8x165.1'];

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatNumber = (val, decimals = 0) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const bytesToSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

// Automatic client-side image compression so photos stay crisp and lightweight in localStorage
const compressImageFile = (file, maxDimension = 960, quality = 0.78) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not decode image file'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// CSV PARSING & SERIALIZATION HELPERS
// ============================================================================

const escapeCsvField = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const parseCsvText = (text) => {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      row.push(current.trim());
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
  }
  return rows;
};

// ============================================================================
// SAMPLE STARTER DATABASE
// ============================================================================

const createSampleDatabase = () => {
  const v1Id = 'veh-rav4-01';

  const vehicles = [
    {
      id: v1Id,
      archived: false,
      name: 'Daily Commuter',
      year: 2022,
      make: 'Toyota',
      model: 'RAV4 Hybrid',
      trim: 'XSE AWD',
      color: 'Cavalry Blue',
      licensePlate: 'CYKL-842',
      vin: '2T3EWRFV8NW149821',
      odometer: 58420,
      unit: 'km',
      fuelType: '87 Regular Hybrid',
      tireSize: '225/60R18 100H',
      tirePsi: '35 PSI Front / 35 PSI Rear',
      tireBoltPattern: '5x114.3',
      oilViscosity: '0W-16',
      oilCapacity: '4.5 L (4.8 qt)',
      oilFilterPart: 'Toyota 90915-YZZN1',
      airFilterPart: 'Denso 143-3732 (17801-F0020)',
      cabinFilterPart: 'Fram CF12157 (87139-0E040)',
      wiperSizes: '26" Driver / 16" Passenger / 12" Rear',
      batteryGroupSize: 'Group H5 (LN2) AGM',
      sparkPlugPart: 'Denso FC16HR-CY9',
      photoUrl: '',
      notes: 'Winter tires (Blizzak DM-V2 on 5x114.3 steel wheels) swapped every Nov & April.'
    }
  ];

  const fuelLogs = [
    { id: 'fl-101', vehicleId: v1Id, date: '2026-08-22', odometer: 56385, volume: 44.1, pricePerUnit: 1.58, totalCost: 69.68, station: 'Shell V-Power', fullTank: true, notes: 'Highway trip' },
    { id: 'fl-102', vehicleId: v1Id, date: '2026-09-14', odometer: 57120, volume: 40.8, pricePerUnit: 1.51, totalCost: 61.61, station: 'Esso', fullTank: true, notes: 'City hybrid EV driving' },
    { id: 'fl-103', vehicleId: v1Id, date: '2026-10-08', odometer: 57810, volume: 39.2, pricePerUnit: 1.49, totalCost: 58.41, station: 'Costco Gas #512', fullTank: true, notes: '' },
    { id: 'fl-104', vehicleId: v1Id, date: '2026-11-05', odometer: 58420, volume: 37.9, pricePerUnit: 1.52, totalCost: 57.61, station: 'Petro-Canada', fullTank: true, notes: 'Autumn commute' },
  ];

  const maintenanceLogs = [
    {
      id: 'ml-101',
      vehicleId: v1Id,
      date: '2026-09-02',
      odometer: 56800,
      category: 'Oil Change',
      title: 'Full Synthetic 0W-16 Oil & Filter Change',
      partsReplaced: 'Toyota 0W-16 (4.5L), Filter 90915-YZZN1, Crush Washer',
      partsCost: 58.50,
      laborCost: 0,
      totalCost: 58.50,
      shopName: 'DIY Home Garage',
      isDiy: true,
      warranty: 'Parts 12 mo',
      notes: 'Torqued drain plug to 30 ft-lbs. Rotated tires.'
    },
    {
      id: 'ml-102',
      vehicleId: v1Id,
      date: '2026-11-08',
      odometer: 58420,
      category: 'Tires & Alignment',
      title: 'Winter Wheel Swap (5x114.3) + 4-Wheel Alignment',
      partsReplaced: 'Mounted Blizzak DM-V2 Winter Set',
      partsCost: 0,
      laborCost: 119.95,
      totalCost: 119.95,
      shopName: 'St. Catharines Tire & Auto',
      isDiy: false,
      warranty: '12 mo / 20,000 km',
      notes: 'Relearned TPMS sensors; set cold PSI to 35.'
    }
  ];

  const expenseLogs = [
    { id: 'ex-101', vehicleId: v1Id, date: '2026-04-15', category: 'Insurance', title: 'Annual Comprehensive Auto Insurance', cost: 1480.00, notes: 'Paid annually' },
    { id: 'ex-102', vehicleId: v1Id, date: '2026-10-12', category: 'Tolls', title: 'Hwy 407 ETR Transponder Pass', cost: 34.80, notes: '' }
  ];

  const tripLogs = [
    { id: 'tr-101', vehicleId: v1Id, date: '2026-09-18', purpose: 'Client Site Inspection', origin: 'St. Catharines, ON', destination: 'Mississauga, ON', startOdo: 57120, endOdo: 57285, distance: 165, isBusiness: true, notes: 'Roundtrip consulting visit' }
  ];

  const reminders = [
    { id: 'rem-101', vehicleId: v1Id, title: 'Synthetic Oil & Filter Change (0W-16)', category: 'Oil Change', dueOdometer: 64800, dueDate: '2027-03-02', notes: 'Filter 90915-YZZN1' },
    { id: 'rem-102', vehicleId: v1Id, title: 'Engine & Cabin Air Filter Swap', category: 'Filters', dueOdometer: 60000, dueDate: '2026-12-20', notes: 'Denso 143-3732 & Fram CF12157' }
  ];

  return {
    version: '3.0.0',
    lastModified: new Date().toISOString(),
    vehicles,
    fuelLogs,
    maintenanceLogs,
    expenseLogs,
    tripLogs,
    reminders
  };
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Theme & Privacy Banner State
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PRIVACY_ACK) === 'true';
    } catch {
      return false;
    }
  });
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Main Local Database State
  const [db, setDb] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.vehicles)) {
          return {
            ...parsed,
            tripLogs: Array.isArray(parsed.tripLogs) ? parsed.tripLogs : [],
            expenseLogs: Array.isArray(parsed.expenseLogs) ? parsed.expenseLogs : [],
            fuelLogs: Array.isArray(parsed.fuelLogs) ? parsed.fuelLogs : [],
            maintenanceLogs: Array.isArray(parsed.maintenanceLogs) ? parsed.maintenanceLogs : [],
            reminders: Array.isArray(parsed.reminders) ? parsed.reminders : []
          };
        }
      }
    } catch (e) {
      console.error('Failed to load DB:', e);
    }
    return createSampleDatabase();
  });

  // Unlimited Named Restore Points (Snapshots)
  const [snapshots, setSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Navigation & Active Vehicle State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
    const active = db.vehicles.find(v => !v.archived) || db.vehicles[0];
    return active ? active.id : null;
  });

  // Modals & Toast State
  const [vehicleModal, setVehicleModal] = useState({ open: false, editing: null });
  const [fuelModal, setFuelModal] = useState({ open: false, editing: null });
  const [maintModal, setMaintModal] = useState({ open: false, editing: null });
  const [expenseModal, setExpenseModal] = useState({ open: false, editing: null });
  const [tripModal, setTripModal] = useState({ open: false, editing: null });
  const [reminderModal, setReminderModal] = useState({ open: false, editing: null });
  const [snapshotModal, setSnapshotModal] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev && prev.message === message ? null : prev));
    }, 3500);
  };

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(db));
    } catch (e) {
      console.error('Local storage write warning:', e);
      showToast('Device storage full — consider exporting a JSON backup.', 'error');
    }
  }, [db]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots));
    } catch {}
  }, [snapshots]);

  useEffect(() => {
    if (db.vehicles.length === 0) {
      setSelectedVehicleId(null);
      return;
    }
    const exists = db.vehicles.some(v => v.id === selectedVehicleId);
    if (!exists) {
      setSelectedVehicleId(db.vehicles[0].id);
    }
  }, [db.vehicles, selectedVehicleId]);

  const currentVehicle = useMemo(
    () => db.vehicles.find(v => v.id === selectedVehicleId) || null,
    [db.vehicles, selectedVehicleId]
  );

  // ==========================================================================
  // PER-VEHICLE ANALYTICS & ENRICHED LOGS
  // ==========================================================================

  const vehicleFuelLogs = useMemo(() => {
    if (!currentVehicle) return [];
    return db.fuelLogs
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => b.odometer - a.odometer || b.date.localeCompare(a.date));
  }, [db.fuelLogs, currentVehicle]);

  const enrichedFuelLogs = useMemo(() => {
    if (!currentVehicle || vehicleFuelLogs.length === 0) return [];
    const chronological = [...vehicleFuelLogs].sort(
      (a, b) => a.odometer - b.odometer || a.date.localeCompare(b.date)
    );

    return chronological
      .map((log, idx) => {
        if (idx === 0) return { ...log, tripDist: null, mpg: null, l100km: null };
        const prev = chronological[idx - 1];
        const dist = log.odometer - prev.odometer;
        if (dist <= 0 || !log.volume || log.volume <= 0 || !log.fullTank) {
          return { ...log, tripDist: dist > 0 ? dist : null, mpg: null, l100km: null };
        }
        let mpg = null;
        let l100km = null;
        if (currentVehicle.unit === 'mi') {
          mpg = dist / log.volume;
          l100km = 235.215 / mpg;
        } else {
          l100km = (log.volume / dist) * 100;
          mpg = 235.215 / l100km;
        }
        return { ...log, tripDist: dist, mpg, l100km };
      })
      .reverse();
  }, [vehicleFuelLogs, currentVehicle]);

  const vehicleMaintLogs = useMemo(() => {
    if (!currentVehicle) return [];
    return db.maintenanceLogs
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer);
  }, [db.maintenanceLogs, currentVehicle]);

  const vehicleExpenseLogs = useMemo(() => {
    if (!currentVehicle) return [];
    return db.expenseLogs
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.expenseLogs, currentVehicle]);

  const vehicleTripLogs = useMemo(() => {
    if (!currentVehicle) return [];
    return db.tripLogs
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.tripLogs, currentVehicle]);

  const vehicleReminders = useMemo(() => {
    if (!currentVehicle) return [];
    return db.reminders.filter(r => r.vehicleId === currentVehicle.id);
  }, [db.reminders, currentVehicle]);

  const vehicleStats = useMemo(() => {
    if (!currentVehicle) return null;
    const fuelSpend = vehicleFuelLogs.reduce((s, l) => s + (Number(l.totalCost) || 0), 0);
    const maintSpend = vehicleMaintLogs.reduce((s, l) => s + (Number(l.totalCost) || 0), 0);
    const expSpend = vehicleExpenseLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
    const totalSpend = fuelSpend + maintSpend + expSpend;

    const validEff = enrichedFuelLogs.filter(l => l.mpg !== null && l.l100km !== null);
    const avgMpg = validEff.length ? validEff.reduce((s, l) => s + l.mpg, 0) / validEff.length : null;
    const avgL100 = validEff.length ? validEff.reduce((s, l) => s + l.l100km, 0) / validEff.length : null;

    const today = new Date().toISOString().slice(0, 10);
    const dueCount = vehicleReminders.filter(r => {
      const odoDue = r.dueOdometer && currentVehicle.odometer >= r.dueOdometer - 500;
      const dateDue = r.dueDate && r.dueDate <= today;
      return odoDue || dateDue;
    }).length;

    return {
      fuelSpend,
      maintSpend,
      expSpend,
      totalSpend,
      avgMpg,
      avgL100,
      dueCount,
      totalLogs: vehicleFuelLogs.length + vehicleMaintLogs.length + vehicleExpenseLogs.length + vehicleTripLogs.length
    };
  }, [currentVehicle, vehicleFuelLogs, enrichedFuelLogs, vehicleMaintLogs, vehicleExpenseLogs, vehicleTripLogs, vehicleReminders]);

  // ==========================================================================
  // CRUD HANDLERS (UNLIMITED VEHICLES & LOGS)
  // ==========================================================================

  const syncOdometer = (vehicles, vehicleId, odo) => {
    const num = Number(odo);
    if (!num || num <= 0) return vehicles;
    return vehicles.map(v => (v.id === vehicleId && num > (Number(v.odometer) || 0) ? { ...v, odometer: num } : v));
  };

  const handleSaveVehicle = (data) => {
    if (data.id) {
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        vehicles: prev.vehicles.map(v => (v.id === data.id ? { ...v, ...data } : v))
      }));
      showToast('Vehicle profile & specs updated');
    } else {
      const newVeh = { ...data, id: generateId(), archived: false };
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        vehicles: [...prev.vehicles, newVeh]
      }));
      setSelectedVehicleId(newVeh.id);
      showToast(`${newVeh.year} ${newVeh.make} ${newVeh.model} added!`);
    }
    setVehicleModal({ open: false, editing: null });
  };

  const handleQuickVehiclePhotoUpload = async (file) => {
    if (!file || !currentVehicle) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 960, 0.78);
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        vehicles: prev.vehicles.map(v =>
          v.id === currentVehicle.id ? { ...v, photoUrl: compressedDataUrl } : v
        )
      }));
      showToast('Vehicle photo updated');
    } catch (err) {
      showToast('Could not process image file', 'error');
    }
  };

  const handleRemoveVehiclePhoto = () => {
    if (!currentVehicle) return;
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      vehicles: prev.vehicles.map(v =>
        v.id === currentVehicle.id ? { ...v, photoUrl: '' } : v
      )
    }));
    showToast('Vehicle photo removed');
  };

  const handleDeleteVehicle = (veh) => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: `Delete ${veh.year} ${veh.make} ${veh.model}?`,
      message: 'This permanently deletes this vehicle and all of its fuel, maintenance, expense, trip, and reminder logs.',
      onConfirm: () => {
        setDb(prev => ({
          ...prev,
          lastModified: new Date().toISOString(),
          vehicles: prev.vehicles.filter(v => v.id !== veh.id),
          fuelLogs: prev.fuelLogs.filter(l => l.vehicleId !== veh.id),
          maintenanceLogs: prev.maintenanceLogs.filter(l => l.vehicleId !== veh.id),
          expenseLogs: prev.expenseLogs.filter(l => l.vehicleId !== veh.id),
          tripLogs: prev.tripLogs.filter(l => l.vehicleId !== veh.id),
          reminders: prev.reminders.filter(r => r.vehicleId !== veh.id),
        }));
        setConfirmDialog({ open: false });
        showToast('Vehicle removed');
      }
    });
  };

  const handleSaveFuel = (data) => {
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      vehicles: syncOdometer(prev.vehicles, currentVehicle.id, data.odometer),
      fuelLogs: data.id
        ? prev.fuelLogs.map(l => (l.id === data.id ? { ...l, ...data } : l))
        : [{ ...data, id: generateId(), vehicleId: currentVehicle.id }, ...prev.fuelLogs]
    }));
    setFuelModal({ open: false, editing: null });
    showToast(data.id ? 'Fuel fill-up updated' : 'Fuel fill-up logged');
  };

  const handleSaveMaint = (data) => {
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      vehicles: syncOdometer(prev.vehicles, currentVehicle.id, data.odometer),
      maintenanceLogs: data.id
        ? prev.maintenanceLogs.map(l => (l.id === data.id ? { ...l, ...data } : l))
        : [{ ...data, id: generateId(), vehicleId: currentVehicle.id }, ...prev.maintenanceLogs]
    }));
    setMaintModal({ open: false, editing: null });
    showToast(data.id ? 'Service record updated' : 'Maintenance logged');
  };

  const handleSaveExpense = (data) => {
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      expenseLogs: data.id
        ? prev.expenseLogs.map(l => (l.id === data.id ? { ...l, ...data } : l))
        : [{ ...data, id: generateId(), vehicleId: currentVehicle.id }, ...prev.expenseLogs]
    }));
    setExpenseModal({ open: false, editing: null });
    showToast(data.id ? 'Expense updated' : 'Expense logged');
  };

  const handleSaveTrip = (data) => {
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      vehicles: syncOdometer(prev.vehicles, currentVehicle.id, data.endOdo),
      tripLogs: data.id
        ? prev.tripLogs.map(l => (l.id === data.id ? { ...l, ...data } : l))
        : [{ ...data, id: generateId(), vehicleId: currentVehicle.id }, ...prev.tripLogs]
    }));
    setTripModal({ open: false, editing: null });
    showToast(data.id ? 'Trip updated' : 'Trip logged');
  };

  const handleSaveReminder = (data) => {
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      reminders: data.id
        ? prev.reminders.map(r => (r.id === data.id ? { ...r, ...data } : r))
        : [{ ...data, id: generateId(), vehicleId: currentVehicle.id }, ...prev.reminders]
    }));
    setReminderModal({ open: false, editing: null });
    showToast('Service reminder saved');
  };

  const deleteItem = (key, id, label) => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: `Delete ${label}?`,
      message: 'Are you sure you want to delete this entry?',
      onConfirm: () => {
        setDb(prev => ({
          ...prev,
          lastModified: new Date().toISOString(),
          [key]: prev[key].filter(item => item.id !== id)
        }));
        setConfirmDialog({ open: false });
        showToast(`${label} deleted`);
      }
    });
  };

  // ==========================================================================
  // UNLIMITED BACKUP, RESTORE POINTS, CSV/JSON & GOOGLE DRIVE INTEGRATION
  // ==========================================================================

  const createSnapshotInternal = (name, notes = '', type = 'Manual', sourceDb = db) => {
    const serialized = JSON.stringify(sourceDb);
    const totalLogs =
      sourceDb.fuelLogs.length +
      sourceDb.maintenanceLogs.length +
      sourceDb.expenseLogs.length +
      (sourceDb.tripLogs?.length || 0);
    const snap = {
      id: generateId(),
      name: name || `Backup ${new Date().toLocaleString()}`,
      type,
      createdAt: new Date().toISOString(),
      vehicleCount: sourceDb.vehicles.length,
      totalLogs,
      sizeBytes: serialized.length,
      notes,
      data: JSON.parse(serialized)
    };
    setSnapshots(prev => [snap, ...prev]);
    return snap;
  };

  const handleRestoreSnapshot = (snap) => {
    setConfirmDialog({
      open: true,
      danger: false,
      title: `Restore "${snap.name}"?`,
      message: 'Your current data will be replaced with this snapshot. An automatic safety backup of your current state will be saved first.',
      onConfirm: () => {
        createSnapshotInternal(`Safety Backup before "${snap.name}"`, 'Auto-created before restore', 'Auto-Safety', db);
        const restored = JSON.parse(JSON.stringify(snap.data));
        setDb({
          ...restored,
          tripLogs: restored.tripLogs || [],
          expenseLogs: restored.expenseLogs || []
        });
        if (restored.vehicles?.length > 0) setSelectedVehicleId(restored.vehicles[0].id);
        setConfirmDialog({ open: false });
        showToast(`Restored "${snap.name}"`);
      }
    });
  };

  const buildFullBackupJsonString = () => {
    return JSON.stringify(
      {
        app: 'Vehicle Logs Pro',
        exportedAt: new Date().toISOString(),
        database: db,
        restorePoints: snapshots
      },
      null,
      2
    );
  };

  const handleExportJsonFile = () => {
    const jsonStr = buildFullBackupJsonString();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-logs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Full .JSON backup downloaded');
  };

  const handleExportCsvFile = () => {
    const vehMap = Object.fromEntries(db.vehicles.map(v => [v.id, `${v.year} ${v.make} ${v.model}`]));
    const rows = [
      ['RecordType', 'Vehicle', 'Date', 'Odometer', 'TitleOrStation', 'CategoryOrGrade', 'Volume', 'TotalCost', 'Notes']
    ];
    db.fuelLogs.forEach(l => {
      rows.push(['Fuel', vehMap[l.vehicleId] || '', l.date, l.odometer, l.station, l.fullTank ? 'Full Tank' : 'Partial', l.volume, l.totalCost, l.notes]);
    });
    db.maintenanceLogs.forEach(l => {
      rows.push(['Maintenance', vehMap[l.vehicleId] || '', l.date, l.odometer, l.title, l.category, '', l.totalCost, l.notes]);
    });
    db.expenseLogs.forEach(l => {
      rows.push(['Expense', vehMap[l.vehicleId] || '', l.date, '', l.title, l.category, '', l.cost, l.notes]);
    });
    (db.tripLogs || []).forEach(l => {
      rows.push(['Trip', vehMap[l.vehicleId] || '', l.date, l.endOdo, `${l.origin} -> ${l.destination}`, l.purpose, l.distance, '', l.notes]);
    });

    const csv = rows.map(r => r.map(escapeCsvField).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-logs-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('All logs exported to .CSV');
  };

  const handleShareToGoogleDrive = async () => {
    const jsonStr = buildFullBackupJsonString();
    const fileName = `vehicle-logs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([jsonStr], fileName, { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Vehicle Logs Backup',
          text: 'Select "Save to Drive" (Google Drive) to save your backup.',
          files: [file]
        });
        showToast('Backup sent to Share Sheet — choose Google Drive!');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    handleExportJsonFile();
    showToast(`Downloaded "${fileName}" — upload it into your Google Drive app!`);
  };

  const handleImportBackupFile = (file, mode = 'replace') => {
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        createSnapshotInternal(`Safety Backup before importing "${file.name}"`, 'Auto-saved before file import', 'Auto-Safety', db);

        if (isCsv) {
          const rows = parseCsvText(e.target.result);
          if (rows.length < 2) {
            showToast('CSV file has no data rows.', 'error');
            return;
          }
          const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
          const dataRows = rows.slice(1);

          let vehiclesList = [...db.vehicles];
          let defaultVehId = currentVehicle?.id || vehiclesList[0]?.id;
          if (!defaultVehId) {
            const newVeh = {
              id: generateId(),
              archived: false,
              name: 'CSV Imported',
              year: new Date().getFullYear(),
              make: 'Imported',
              model: 'Vehicle',
              trim: '',
              color: '',
              licensePlate: '',
              vin: '',
              odometer: 0,
              unit: 'mi',
              fuelType: 'Gasoline',
              tireSize: '',
              tirePsi: '',
              tireBoltPattern: '',
              oilViscosity: '',
              oilCapacity: '',
              oilFilterPart: '',
              airFilterPart: '',
              cabinFilterPart: '',
              wiperSizes: '',
              batteryGroupSize: '',
              sparkPlugPart: '',
              photoUrl: '',
              notes: 'Created from CSV import'
            };
            vehiclesList = [newVeh];
            defaultVehId = newVeh.id;
          }

          const getCol = (r, keys) => {
            for (const k of keys) {
              const idx = headers.findIndex(h => h.includes(k));
              if (idx !== -1 && r[idx] !== undefined && r[idx] !== '') return r[idx];
            }
            return '';
          };

          const importedFuel = [];
          const importedMaint = [];
          const importedExp = [];

          dataRows.forEach(r => {
            const rType = getCol(r, ['recordtype', 'type']).toLowerCase();
            const date = getCol(r, ['date']) || new Date().toISOString().slice(0, 10);
            const odo = Number(getCol(r, ['odometer', 'mileage'])) || 0;
            const cost = Number(String(getCol(r, ['totalcost', 'cost', 'amount'])).replace(/[^0-9.-]/g, '')) || 0;
            const title = getCol(r, ['titleorstation', 'title', 'station']) || 'Imported Entry';
            const cat = getCol(r, ['categoryorgrade', 'category', 'grade']) || 'General';
            const vol = Number(getCol(r, ['volume', 'gallons', 'liters'])) || 0;
            const notes = getCol(r, ['notes']);

            if (rType.includes('fuel') || vol > 0) {
              importedFuel.push({
                id: generateId(),
                vehicleId: defaultVehId,
                date,
                odometer: odo,
                volume: vol,
                pricePerUnit: vol > 0 ? Number((cost / vol).toFixed(3)) : 0,
                totalCost: cost,
                station: title,
                fullTank: true,
                notes
              });
            } else if (rType.includes('maint') || rType.includes('service')) {
              importedMaint.push({
                id: generateId(),
                vehicleId: defaultVehId,
                date,
                odometer: odo,
                category: cat,
                title,
                partsReplaced: '',
                partsCost: 0,
                laborCost: cost,
                totalCost: cost,
                shopName: '',
                isDiy: false,
                warranty: '',
                notes
              });
            } else {
              importedExp.push({
                id: generateId(),
                vehicleId: defaultVehId,
                date,
                category: cat,
                title,
                cost,
                notes
              });
            }
          });

          if (mode === 'replace') {
            setDb({
              version: '3.0.0',
              lastModified: new Date().toISOString(),
              vehicles: vehiclesList,
              fuelLogs: importedFuel,
              maintenanceLogs: importedMaint,
              expenseLogs: importedExp,
              tripLogs: [],
              reminders: db.reminders
            });
          } else {
            setDb(prev => ({
              ...prev,
              lastModified: new Date().toISOString(),
              vehicles: vehiclesList,
              fuelLogs: [...importedFuel, ...prev.fuelLogs],
              maintenanceLogs: [...importedMaint, ...prev.maintenanceLogs],
              expenseLogs: [...importedExp, ...prev.expenseLogs]
            }));
          }
          setSelectedVehicleId(defaultVehId);
          showToast(`Imported ${importedFuel.length + importedMaint.length + importedExp.length} CSV records`);
          return;
        }

        // JSON Backup Import
        const parsed = JSON.parse(e.target.result);
        const incoming = parsed.database ? parsed.database : parsed;
        if (!incoming || !Array.isArray(incoming.vehicles)) {
          showToast('Invalid JSON backup file.', 'error');
          return;
        }

        if (mode === 'replace') {
          setDb({
            version: '3.0.0',
            lastModified: new Date().toISOString(),
            vehicles: incoming.vehicles || [],
            fuelLogs: incoming.fuelLogs || [],
            maintenanceLogs: incoming.maintenanceLogs || [],
            expenseLogs: incoming.expenseLogs || [],
            tripLogs: incoming.tripLogs || [],
            reminders: incoming.reminders || []
          });
          if (incoming.vehicles.length > 0) setSelectedVehicleId(incoming.vehicles[0].id);
          showToast(`Restored ${incoming.vehicles.length} vehicles from backup`);
        } else {
          const mergeList = (a = [], b = []) => {
            const map = new Map(a.map(item => [item.id, item]));
            b.forEach(item => { if (item?.id) map.set(item.id, item); });
            return Array.from(map.values());
          };
          setDb(prev => ({
            ...prev,
            lastModified: new Date().toISOString(),
            vehicles: mergeList(prev.vehicles, incoming.vehicles),
            fuelLogs: mergeList(prev.fuelLogs, incoming.fuelLogs),
            maintenanceLogs: mergeList(prev.maintenanceLogs, incoming.maintenanceLogs),
            expenseLogs: mergeList(prev.expenseLogs, incoming.expenseLogs),
            tripLogs: mergeList(prev.tripLogs, incoming.tripLogs),
            reminders: mergeList(prev.reminders, incoming.reminders),
          }));
          showToast('Merged backup records with existing garage');
        }
      } catch (err) {
        showToast('Failed to read backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: 'Factory Reset All App Data?',
      message: 'This erases all vehicles, photos, and logs from your phone so you can start completely fresh.',
      onConfirm: () => {
        setDb({
          version: '3.0.0',
          lastModified: new Date().toISOString(),
          vehicles: [],
          fuelLogs: [],
          maintenanceLogs: [],
          expenseLogs: [],
          tripLogs: [],
          reminders: []
        });
        setSelectedVehicleId(null);
        setConfirmDialog({ open: false });
        showToast('All data cleared — fresh garage ready');
      }
    });
  };

  const copyToClipboard = (label, val) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    showToast(`${label} copied`);
  };

  // ==========================================================================
  // THEME TOKENS & BOTTOM NAVIGATION ITEMS
  // ==========================================================================

  const t = darkMode
    ? {
        bg: 'bg-slate-950 text-slate-100',
        header: 'bg-slate-950/90 border-slate-800/90',
        card: 'bg-slate-900/95 border-slate-800',
        cardSub: 'bg-slate-800/60 border-slate-700/70',
        input: 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500',
        muted: 'text-slate-400',
        border: 'border-slate-800',
        hover: 'hover:bg-slate-800/80',
        bottomNav: 'bg-slate-950/95 border-slate-800'
      }
    : {
        bg: 'bg-slate-100 text-slate-900',
        header: 'bg-white/90 border-slate-200',
        card: 'bg-white border-slate-200/90 shadow-sm',
        cardSub: 'bg-slate-50 border-slate-200',
        input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600',
        muted: 'text-slate-500',
        border: 'border-slate-200',
        hover: 'hover:bg-slate-100',
        bottomNav: 'bg-white/95 border-slate-200'
      };

  const bottomTabs = [
    { id: 'overview', label: 'Overview', icon: Gauge, activeBg: 'bg-indigo-600 text-white shadow-indigo-600/30', iconColor: 'text-indigo-400' },
    { id: 'fuel', label: 'Fuel', icon: Fuel, activeBg: 'bg-emerald-600 text-white shadow-emerald-600/30', iconColor: 'text-emerald-400' },
    { id: 'service', label: 'Service', icon: Wrench, activeBg: 'bg-amber-500 text-slate-950 shadow-amber-500/30', iconColor: 'text-amber-400', badge: vehicleStats?.dueCount || 0 },
    { id: 'costs', label: 'Costs/Trips', icon: Receipt, activeBg: 'bg-rose-600 text-white shadow-rose-600/30', iconColor: 'text-rose-400' },
    { id: 'fleet', label: 'Fleet', icon: Layers, activeBg: 'bg-violet-600 text-white shadow-violet-600/30', iconColor: 'text-violet-400' },
    { id: 'backup', label: 'Backup', icon: CloudUpload, activeBg: 'bg-sky-600 text-white shadow-sky-600/30', iconColor: 'text-sky-400' },
  ];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${t.bg}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border bg-slate-900 text-white border-slate-700">
          {toast.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* First-Launch Dismissible Privacy Banner */}
      {!privacyAcknowledged && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-b border-emerald-500/40 text-emerald-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>100% Private & On-Device:</strong> None of your vehicle data is ever shared on the internet or sent to app servers. Everything stays strictly on your phone, and all features are 100% free.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPrivacyModalOpen(true)}
              className="px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold"
            >
              Details
            </button>
            <button
              onClick={() => {
                setPrivacyAcknowledged(true);
                try { localStorage.setItem(STORAGE_KEY_PRIVACY_ACK, 'true'); } catch {}
              }}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* COMPACT TOP HEADER BAR */}
      <header className={`sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-md ${t.header}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2.5">
          {/* Brand + Local Shield */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                  Vehicle Logs
                </span>
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition shrink-0"
                  title="100% On-Device Storage Guarantee"
                >
                  <ServerOff className="w-3 h-3" /> Local Only
                </button>
              </div>
              {db.vehicles.length > 0 ? (
                <select
                  value={currentVehicle?.id || ''}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-indigo-400 outline-none max-w-[200px] sm:max-w-[280px] truncate cursor-pointer"
                >
                  {db.vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                      {v.year} {v.make} {v.model} {v.name ? `(${v.name})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`text-xs ${t.muted}`}>No vehicle selected</span>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {currentVehicle && (
              <>
                <button
                  onClick={() => setFuelModal({ open: true, editing: null })}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1 transition"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>+ Fuel</span>
                </button>
                <button
                  onClick={() => setMaintModal({ open: true, editing: null })}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm flex items-center gap-1 transition"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>+ Service</span>
                </button>
              </>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border ${t.border} ${t.hover} transition`}
              title="Toggle Light / Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA (with pb-28 clearance for fixed bottom bar) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-5 pb-28 space-y-6">
        {!currentVehicle && !['fleet', 'backup'].includes(activeTab) ? (
          <div className={`rounded-3xl border p-8 sm:p-12 text-center space-y-4 ${t.card}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Car className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold">Your Garage is Empty</h2>
            <p className={`max-w-md mx-auto text-xs sm:text-sm ${t.muted}`}>
              Add unlimited vehicles with full OEM part numbers, tire bolt patterns, oil viscosities, and vehicle photos—all stored 100% locally on your phone for free.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setVehicleModal({ open: true, editing: null })}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                <Plus className="w-4 h-4" /> Add Your First Vehicle
              </button>
              <button
                onClick={() => {
                  const sample = createSampleDatabase();
                  setDb(sample);
                  setSelectedVehicleId(sample.vehicles[0].id);
                  showToast('Demo vehicle loaded');
                }}
                className={`px-5 py-2.5 rounded-xl border ${t.border} ${t.hover} text-sm font-semibold flex items-center gap-2`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Load Demo Vehicle
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && currentVehicle && vehicleStats && (
              <OverviewTab
                vehicle={currentVehicle}
                stats={vehicleStats}
                fuelLogs={enrichedFuelLogs}
                maintLogs={vehicleMaintLogs}
                reminders={vehicleReminders}
                onEditVehicle={() => setVehicleModal({ open: true, editing: currentVehicle })}
                onOpenPhotoPreview={(url) => setPhotoPreviewUrl(url)}
                onNavigate={setActiveTab}
                onCopy={copyToClipboard}
                t={t}
              />
            )}

            {activeTab === 'fuel' && currentVehicle && (
              <FuelTab
                vehicle={currentVehicle}
                logs={enrichedFuelLogs}
                stats={vehicleStats}
                onAdd={() => setFuelModal({ open: true, editing: null })}
                onEdit={(log) => setFuelModal({ open: true, editing: log })}
                onDelete={(id) => deleteItem('fuelLogs', id, 'Fuel Log')}
                t={t}
              />
            )}

            {activeTab === 'service' && currentVehicle && (
              <ServiceMaintenanceTab
                vehicle={currentVehicle}
                logs={vehicleMaintLogs}
                reminders={vehicleReminders}
                onUploadPhoto={handleQuickVehiclePhotoUpload}
                onRemovePhoto={handleRemoveVehiclePhoto}
                onOpenPhotoPreview={(url) => setPhotoPreviewUrl(url)}
                onAddLog={() => setMaintModal({ open: true, editing: null })}
                onEditLog={(log) => setMaintModal({ open: true, editing: log })}
                onDeleteLog={(id) => deleteItem('maintenanceLogs', id, 'Service Record')}
                onAddReminder={() => setReminderModal({ open: true, editing: null })}
                onEditReminder={(rem) => setReminderModal({ open: true, editing: rem })}
                onDeleteReminder={(id) => deleteItem('reminders', id, 'Reminder')}
                t={t}
              />
            )}

            {activeTab === 'costs' && currentVehicle && (
              <CostsAndTripsTab
                vehicle={currentVehicle}
                expenses={vehicleExpenseLogs}
                trips={vehicleTripLogs}
                onAddExpense={() => setExpenseModal({ open: true, editing: null })}
                onEditExpense={(exp) => setExpenseModal({ open: true, editing: exp })}
                onDeleteExpense={(id) => deleteItem('expenseLogs', id, 'Expense')}
                onAddTrip={() => setTripModal({ open: true, editing: null })}
                onEditTrip={(tr) => setTripModal({ open: true, editing: tr })}
                onDeleteTrip={(id) => deleteItem('tripLogs', id, 'Trip')}
                t={t}
              />
            )}

            {activeTab === 'fleet' && (
              <FleetTab
                db={db}
                selectedVehicleId={currentVehicle?.id}
                onSelectVehicle={(id) => {
                  setSelectedVehicleId(id);
                  setActiveTab('overview');
                }}
                onAddVehicle={() => setVehicleModal({ open: true, editing: null })}
                onEditVehicle={(v) => setVehicleModal({ open: true, editing: v })}
                onDeleteVehicle={handleDeleteVehicle}
                t={t}
              />
            )}

            {activeTab === 'backup' && (
              <BackupAndDriveTab
                db={db}
                snapshots={snapshots}
                onCreateSnapshot={(name, notes) => {
                  createSnapshotInternal(name, notes, 'Manual', db);
                  showToast(`Restore point "${name}" saved`);
                }}
                onRestoreSnapshot={handleRestoreSnapshot}
                onDeleteSnapshot={(snap) => {
                  setConfirmDialog({
                    open: true,
                    danger: true,
                    title: `Delete "${snap.name}"?`,
                    message: 'Remove this local restore point?',
                    onConfirm: () => {
                      setSnapshots(prev => prev.filter(s => s.id !== snap.id));
                      setConfirmDialog({ open: false });
                      showToast('Restore point deleted');
                    }
                  });
                }}
                onExportJson={handleExportJsonFile}
                onExportCsv={handleExportCsvFile}
                onShareGoogleDrive={handleShareToGoogleDrive}
                onImportBackup={handleImportBackupFile}
                onFactoryReset={handleFactoryReset}
                buildBackupJsonString={buildFullBackupJsonString}
                onRestoreFromDriveData={(parsed) => {
                  const incoming = parsed.database ? parsed.database : parsed;
                  if (!incoming?.vehicles) {
                    showToast('Invalid Drive backup format', 'error');
                    return;
                  }
                  createSnapshotInternal('Safety Backup before Drive Restore', 'Auto-saved', 'Auto-Safety', db);
                  setDb({
                    version: '3.0.0',
                    lastModified: new Date().toISOString(),
                    vehicles: incoming.vehicles || [],
                    fuelLogs: incoming.fuelLogs || [],
                    maintenanceLogs: incoming.maintenanceLogs || [],
                    expenseLogs: incoming.expenseLogs || [],
                    tripLogs: incoming.tripLogs || [],
                    reminders: incoming.reminders || []
                  });
                  if (incoming.vehicles.length > 0) setSelectedVehicleId(incoming.vehicles[0].id);
                  showToast('Restored fleet from Google Drive backup!');
                }}
                showToast={showToast}
                t={t}
              />
            )}
          </>
        )}
      </main>

      {/* ==================================================================== */}
      {/* FIXED BOTTOM NAVIGATION BAR (WITH SAFE AREA INSET)                   */}
      {/* ==================================================================== */}
      <nav
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-lg px-2 pt-2 ${t.bottomNav}`}
      >
        <div className="max-w-3xl mx-auto grid grid-cols-6 gap-1">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                  isActive
                    ? `${tab.activeBg} shadow-md scale-[1.02]`
                    : `${t.muted} ${t.hover}`
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? '' : tab.iconColor}`} />
                <span className="text-[10px] sm:text-xs font-bold tracking-tight truncate max-w-full">
                  {tab.label}
                </span>
                {tab.badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* MODALS                                                               */}
      {/* ==================================================================== */}

      {vehicleModal.open && (
        <VehicleFormModal
          vehicle={vehicleModal.editing}
          onClose={() => setVehicleModal({ open: false, editing: null })}
          onSave={handleSaveVehicle}
          t={t}
          darkMode={darkMode}
        />
      )}

      {fuelModal.open && currentVehicle && (
        <FuelFormModal
          vehicle={currentVehicle}
          log={fuelModal.editing}
          onClose={() => setFuelModal({ open: false, editing: null })}
          onSave={handleSaveFuel}
          t={t}
          darkMode={darkMode}
        />
      )}

      {maintModal.open && currentVehicle && (
        <MaintFormModal
          vehicle={currentVehicle}
          log={maintModal.editing}
          onClose={() => setMaintModal({ open: false, editing: null })}
          onSave={handleSaveMaint}
          t={t}
          darkMode={darkMode}
        />
      )}

      {expenseModal.open && currentVehicle && (
        <ExpenseFormModal
          vehicle={currentVehicle}
          log={expenseModal.editing}
          onClose={() => setExpenseModal({ open: false, editing: null })}
          onSave={handleSaveExpense}
          t={t}
          darkMode={darkMode}
        />
      )}

      {tripModal.open && currentVehicle && (
        <TripFormModal
          vehicle={currentVehicle}
          trip={tripModal.editing}
          onClose={() => setTripModal({ open: false, editing: null })}
          onSave={handleSaveTrip}
          t={t}
          darkMode={darkMode}
        />
      )}

      {reminderModal.open && currentVehicle && (
        <ReminderFormModal
          vehicle={currentVehicle}
          reminder={reminderModal.editing}
          onClose={() => setReminderModal({ open: false, editing: null })}
          onSave={handleSaveReminder}
          t={t}
          darkMode={darkMode}
        />
      )}

      {photoPreviewUrl && (
        <div
          onClick={() => setPhotoPreviewUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-3xl w-full">
            <button
              onClick={() => setPhotoPreviewUrl(null)}
              className="absolute -top-11 right-0 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Close Preview
            </button>
            <img
              src={photoPreviewUrl}
              alt="Vehicle Full View"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {privacyModalOpen && (
        <ModalWrapper
          title="100% On-Device Privacy & Free Forever Guarantee"
          subtitle="Zero servers • Zero accounts • No paywalls"
          onClose={() => setPrivacyModalOpen(false)}
          darkMode={darkMode}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-3">
              <ServerOff className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-extrabold text-emerald-300">
                  Your Data Never Leaves Your Phone Unless You Export It
                </div>
                <p className={t.muted}>
                  Vehicle Logs Pro has zero backend servers, zero analytics trackers, and zero subscriptions. Everything is stored locally on your device.
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${t.cardSub} space-y-2`}>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited vehicles, photos, and logs — 100% free
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct Google Drive backups go straight to your personal Drive
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {confirmDialog.open && (
        <ModalWrapper title={confirmDialog.title} onClose={() => setConfirmDialog({ open: false })} darkMode={darkMode}>
          <div className="space-y-4 text-sm">
            <p className={t.muted}>{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDialog({ open: false })} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold text-xs`}>
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs ${
                  confirmDialog.danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

// ============================================================================
// TAB 1: OVERVIEW (HERO CARD, VIBRANT METRICS, SPECS & COPY BUTTONS)
// ============================================================================

function OverviewTab({ vehicle, stats, fuelLogs, maintLogs, reminders, onEditVehicle, onOpenPhotoPreview, onNavigate, onCopy, t }) {
  const quickCopySpecs = [
    { label: 'VIN', value: vehicle.vin, icon: FileText, color: 'text-indigo-400 bg-indigo-500/15' },
    { label: 'Bolt Pattern', value: vehicle.tireBoltPattern, icon: Disc, color: 'text-sky-400 bg-sky-500/15' },
    { label: 'Oil Viscosity', value: vehicle.oilViscosity, icon: Droplet, color: 'text-amber-400 bg-amber-500/15' },
    { label: 'Oil Filter', value: vehicle.oilFilterPart, icon: Wrench, color: 'text-emerald-400 bg-emerald-500/15' },
    { label: 'Air Filter', value: vehicle.airFilterPart, icon: Sparkles, color: 'text-violet-400 bg-violet-500/15' },
    { label: 'Cabin Filter', value: vehicle.cabinFilterPart, icon: Shield, color: 'text-rose-400 bg-rose-500/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Vehicle Banner */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {vehicle.photoUrl ? (
              <button
                onClick={() => onOpenPhotoPreview(vehicle.photoUrl)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-indigo-400/50 shrink-0 group relative"
              >
                <img src={vehicle.photoUrl} alt={vehicle.model} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('service')}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-500/20 border-2 border-dashed border-indigo-400/50 flex flex-col items-center justify-center text-indigo-300 hover:bg-indigo-500/30 transition shrink-0"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {vehicle.name && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500 text-white">
                    {vehicle.name}
                  </span>
                )}
                {vehicle.licensePlate && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-amber-300">
                    {vehicle.licensePlate}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
              </h1>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span>{vehicle.color || 'Color not set'}</span>
                <span>•</span>
                <span>{vehicle.fuelType || 'Gasoline'}</span>
                {vehicle.tireSize && (
                  <>
                    <span>•</span>
                    <span>Tires: {vehicle.tireSize} ({vehicle.tirePsi || '—'})</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onEditVehicle}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Specs
          </button>
        </div>
      </div>

      {/* Colorful Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-blue-600/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-sky-400">Odometer</span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono">
            {formatNumber(vehicle.odometer)} <span className="text-xs font-normal">{vehicle.unit}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-600/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-400">Fuel Economy</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono">
            {stats.avgMpg
              ? vehicle.unit === 'mi'
                ? `${stats.avgMpg.toFixed(1)} MPG`
                : `${stats.avgL100.toFixed(1)} L/100`
              : '—'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-orange-600/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-400">Maintenance</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono">
            {formatCurrency(stats.maintSpend)}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 to-pink-600/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-rose-400">Total Spend</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono">
            {formatCurrency(stats.totalSpend)}
          </div>
        </div>
      </div>

      {/* Parts Counter Quick-Copy Spec Tiles */}
      <div className={`rounded-2xl border p-5 ${t.card} space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" /> Parts Counter & Quick-Copy Specs
          </h2>
          <span className={`text-xs ${t.muted}`}>Tap any tile to copy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickCopySpecs.map((spec) => {
            const Icon = spec.icon;
            return (
              <button
                key={spec.label}
                onClick={() => onCopy(spec.label, spec.value)}
                disabled={!spec.value}
                className={`p-3.5 rounded-xl border ${t.cardSub} hover:border-indigo-500/50 transition flex items-center justify-between gap-3 text-left disabled:opacity-60`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${spec.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-semibold ${t.muted}`}>{spec.label}</div>
                    <div className="font-mono font-bold text-xs sm:text-sm truncate">
                      {spec.value || 'Not set'}
                    </div>
                  </div>
                </div>
                {spec.value && <Copy className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Extra Hardware Specs Row */}
        <div className={`pt-2 border-t ${t.border} grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs`}>
          <div>
            <span className={t.muted}>Oil Capacity:</span>{' '}
            <strong className="font-mono">{vehicle.oilCapacity || '—'}</strong>
          </div>
          <div>
            <span className={t.muted}>Wipers:</span>{' '}
            <strong>{vehicle.wiperSizes || '—'}</strong>
          </div>
          <div>
            <span className={t.muted}>Battery:</span>{' '}
            <strong>{vehicle.batteryGroupSize || '—'}</strong>
          </div>
          <div>
            <span className={t.muted}>Spark Plugs:</span>{' '}
            <strong className="font-mono">{vehicle.sparkPlugPart || '—'}</strong>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders Preview */}
      <div className={`rounded-2xl border p-5 ${t.card} space-y-3`}>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" /> Service Reminders ({reminders.length})
          </h2>
          <button onClick={() => onNavigate('service')} className="text-xs font-bold text-indigo-400 hover:underline">
            Open Service Tab
          </button>
        </div>
        {reminders.length === 0 ? (
          <p className={`text-xs ${t.muted}`}>No upcoming service reminders scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reminders.slice(0, 4).map(rem => (
              <div key={rem.id} className={`p-3.5 rounded-xl border ${t.cardSub} flex items-center justify-between gap-2`}>
                <div>
                  <div className="font-bold text-xs sm:text-sm">{rem.title}</div>
                  <div className={`text-[11px] ${t.muted}`}>
                    {rem.dueOdometer ? `At ${formatNumber(rem.dueOdometer)} ${vehicle.unit}` : ''}
                    {rem.dueOdometer && rem.dueDate ? ' • ' : ''}
                    {rem.dueDate ? formatDate(rem.dueDate) : ''}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400">
                  {rem.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2: FUEL & EFFICIENCY
// ============================================================================

function FuelTab({ vehicle, logs, stats, onAdd, onEdit, onDelete, t }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Fuel & Efficiency Log</h2>
            <p className="text-xs text-emerald-200/80">
              {logs.length} Fill-Ups • Total Fuel Spend: <strong>{formatCurrency(stats?.fuelSpend || 0)}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Log Fill-Up
        </button>
      </div>

      {logs.length === 0 ? (
        <div className={`rounded-2xl border p-8 text-center text-sm ${t.card} ${t.muted}`}>
          No fill-ups logged yet. Tap "+ Log Fill-Up" to start tracking fuel economy.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className={`rounded-2xl border p-4 ${t.card} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                  <Droplet className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm">{log.station || 'Fuel Station'}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-500/15">
                      {formatNumber(log.odometer)} {vehicle.unit}
                    </span>
                    {log.mpg && (
                      <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        {vehicle.unit === 'mi' ? `${log.mpg.toFixed(1)} MPG` : `${log.l100km.toFixed(1)} L/100km`}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${t.muted}`}>
                    {formatDate(log.date)} • {log.volume} {vehicle.unit === 'mi' ? 'gal' : 'L'} @ {formatCurrency(log.pricePerUnit)}/{vehicle.unit === 'mi' ? 'gal' : 'L'}
                    {log.tripDist ? ` • +${formatNumber(log.tripDist)} ${vehicle.unit}` : ''}
                  </p>
                  {log.notes && <p className={`text-xs ${t.muted}`}>{log.notes}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                <span className="font-mono font-extrabold text-base text-emerald-400">
                  {formatCurrency(log.totalCost)}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(log)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 3: SERVICE / MAINTENANCE (WITH FEATURED VEHICLE PHOTO BANNER)
// ============================================================================

function ServiceMaintenanceTab({
  vehicle, logs, reminders, onUploadPhoto, onRemovePhoto, onOpenPhotoPreview,
  onAddLog, onEditLog, onDeleteLog, onAddReminder, onEditReminder, onDeleteReminder, t
}) {
  const photoInputRef = useRef(null);

  return (
    <div className="space-y-6">
      {/* FEATURED VEHICLE PHOTO BANNER CARD IN MAINTENANCE AREA */}
      <div className={`rounded-3xl border overflow-hidden ${t.card}`}>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadPhoto(f);
            e.target.value = '';
          }}
        />

        {vehicle.photoUrl ? (
          <div className="relative">
            <img
              src={vehicle.photoUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              onClick={() => onOpenPhotoPreview(vehicle.photoUrl)}
              className="w-full h-52 sm:h-64 object-cover cursor-pointer"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent p-4 flex flex-wrap items-end justify-between gap-3">
              <div className="text-white">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  Service Bay Profile
                </span>
                <h2 className="text-lg font-extrabold mt-1">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-xs text-slate-300">
                  Oil: {vehicle.oilViscosity || '—'} • Bolt Pattern: {vehicle.tireBoltPattern || '—'} • Filter: {vehicle.oilFilterPart || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenPhotoPreview(vehicle.photoUrl)}
                  className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700"
                  title="Full Screen Photo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" /> Change Photo
                </button>
                <button
                  onClick={onRemovePhoto}
                  className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-extrabold text-base">
                  {vehicle.year} {vehicle.make} {vehicle.model} — Service Bay
                </h2>
                <p className={`text-xs ${t.muted}`}>
                  Add a photo of your vehicle for quick visual identification in your maintenance log.
                </p>
              </div>
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-md"
            >
              <Camera className="w-4 h-4" /> Add Vehicle Photo
            </button>
          </div>
        )}
      </div>

      {/* Maintenance History Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-extrabold text-base flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" /> Maintenance & Service History ({logs.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddReminder}
            className={`px-3 py-2 rounded-xl border ${t.border} ${t.hover} text-xs font-bold flex items-center gap-1.5`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" /> + Reminder
          </button>
          <button
            onClick={onAddLog}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Log Service
          </button>
        </div>
      </div>

      {/* Service Records List */}
      {logs.length === 0 ? (
        <div className={`rounded-2xl border p-8 text-center text-sm ${t.card} ${t.muted}`}>
          No maintenance records logged yet. Tap "+ Log Service" to record oil changes, brakes, tires, and parts.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className={`rounded-2xl border p-4 sm:p-5 ${t.card} space-y-2.5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-400">
                      {log.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${log.isDiy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                      {log.isDiy ? 'DIY Garage' : log.shopName || 'Service Shop'}
                    </span>
                    <span className={`text-xs font-mono ${t.muted}`}>
                      {formatDate(log.date)} • {formatNumber(log.odometer)} {vehicle.unit}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base">{log.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-base text-amber-400">
                      {formatCurrency(log.totalCost)}
                    </div>
                    {(Number(log.partsCost) > 0 || Number(log.laborCost) > 0) && (
                      <div className={`text-[10px] ${t.muted}`}>
                        Parts {formatCurrency(log.partsCost)} • Labor {formatCurrency(log.laborCost)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onEditLog(log)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteLog(log.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {log.partsReplaced && (
                <div className={`p-2.5 rounded-xl border text-xs ${t.cardSub}`}>
                  <strong>Parts / Fluids:</strong> <span className={t.muted}>{log.partsReplaced}</span>
                </div>
              )}

              {(log.warranty || log.notes) && (
                <div className={`flex flex-wrap justify-between gap-2 text-xs ${t.muted}`}>
                  <span>{log.notes}</span>
                  {log.warranty && <span className="text-emerald-400 font-semibold">Warranty: {log.warranty}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Reminders Sub-section */}
      {reminders.length > 0 && (
        <div className={`rounded-2xl border p-5 ${t.card} space-y-3`}>
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" /> Scheduled Service Reminders
          </h3>
          <div className="space-y-2.5">
            {reminders.map(rem => (
              <div key={rem.id} className={`p-3.5 rounded-xl border ${t.cardSub} flex items-center justify-between gap-3`}>
                <div>
                  <div className="font-bold text-xs sm:text-sm">{rem.title}</div>
                  <div className={`text-xs ${t.muted}`}>
                    {rem.dueOdometer ? `Due at ${formatNumber(rem.dueOdometer)} ${vehicle.unit}` : ''}
                    {rem.dueOdometer && rem.dueDate ? ' • ' : ''}
                    {rem.dueDate ? `Date: ${formatDate(rem.dueDate)}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEditReminder(rem)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteReminder(rem.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 4: COSTS & TRIPS
// ============================================================================

function CostsAndTripsTab({
  vehicle, expenses, trips, onAddExpense, onEditExpense, onDeleteExpense,
  onAddTrip, onEditTrip, onDeleteTrip, t
}) {
  const [subTab, setSubTab] = useState('expenses');

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.cost) || 0), 0);
  const totalTripDist = trips.reduce((s, tr) => s + (Number(tr.distance) || 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/70 via-pink-950/40 to-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Expenses & Trip Mileage Log</h2>
            <p className="text-xs text-rose-200/80">
              Expenses: <strong>{formatCurrency(totalExpenses)}</strong> • Logged Trips: <strong>{formatNumber(totalTripDist)} {vehicle.unit}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddExpense}
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Expense
          </button>
          <button
            onClick={onAddTrip}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" /> + Trip
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            subTab === 'expenses' ? 'bg-rose-600 text-white' : `${t.card} ${t.muted}`
          }`}
        >
          Ownership Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setSubTab('trips')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            subTab === 'trips' ? 'bg-violet-600 text-white' : `${t.card} ${t.muted}`
          }`}
        >
          Trip Mileage Logs ({trips.length})
        </button>
      </div>

      {subTab === 'expenses' ? (
        expenses.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center text-sm ${t.card} ${t.muted}`}>
            No ownership expenses logged yet (Insurance, Registration, Tolls, Parking, Wash/Detailing).
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(exp => (
              <div key={exp.id} className={`rounded-2xl border p-4 ${t.card} flex items-center justify-between gap-3`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{exp.title}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400">
                        {exp.category}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${t.muted}`}>
                      {formatDate(exp.date)} {exp.notes ? `• ${exp.notes}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-rose-400">
                    {formatCurrency(exp.cost)}
                  </span>
                  <button onClick={() => onEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteExpense(exp.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : trips.length === 0 ? (
        <div className={`rounded-2xl border p-8 text-center text-sm ${t.card} ${t.muted}`}>
          No trips logged yet. Tap "+ Trip" to record business or personal mileage.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(tr => (
            <div key={tr.id} className={`rounded-2xl border p-4 ${t.card} flex items-center justify-between gap-3`}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm">{tr.purpose || 'Trip'}</span>
                    {tr.isBusiness && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Business
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${t.muted}`}>
                    {formatDate(tr.date)} • {tr.origin || 'Start'} → {tr.destination || 'Destination'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-violet-400">
                  +{formatNumber(tr.distance)} {vehicle.unit}
                </span>
                <button onClick={() => onEditTrip(tr)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteTrip(tr.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 5: FLEET MANAGEMENT (UNLIMITED VEHICLES)
// ============================================================================

function FleetTab({ db, selectedVehicleId, onSelectVehicle, onAddVehicle, onEditVehicle, onDeleteVehicle, t }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/70 via-indigo-950/50 to-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Your Vehicle Fleet ({db.vehicles.length})</h2>
            <p className="text-xs text-violet-200/80">
              Unlimited vehicles & unlimited logs — 100% free and stored on your phone
            </p>
          </div>
        </div>
        <button
          onClick={onAddVehicle}
          className="px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {db.vehicles.map(v => {
          const isSelected = v.id === selectedVehicleId;
          const logsCount =
            db.fuelLogs.filter(l => l.vehicleId === v.id).length +
            db.maintenanceLogs.filter(l => l.vehicleId === v.id).length +
            db.expenseLogs.filter(l => l.vehicleId === v.id).length +
            (db.tripLogs || []).filter(l => l.vehicleId === v.id).length;

          return (
            <div
              key={v.id}
              className={`rounded-2xl border p-4 sm:p-5 ${t.card} ${isSelected ? 'ring-2 ring-violet-500' : ''} space-y-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt={v.model} className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                      <Car className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-base">{v.year} {v.make} {v.model}</h3>
                    <p className={`text-xs ${t.muted}`}>
                      {v.name ? `${v.name} • ` : ''}{formatNumber(v.odometer)} {v.unit}
                    </p>
                    <p className="text-[11px] font-semibold text-violet-400 mt-0.5">
                      Oil: {v.oilViscosity || '—'} • Bolts: {v.tireBoltPattern || '—'} • {logsCount} Logs
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => onEditVehicle(v)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteVehicle(v)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => onSelectVehicle(v.id)}
                className="w-full py-2 px-4 rounded-xl bg-violet-600/15 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-extrabold transition"
              >
                {isSelected ? 'Active Vehicle — Open Overview' : 'Switch to This Vehicle'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 6: BACKUPS, RESTORE POINTS & GOOGLE DRIVE INTEGRATION
// ============================================================================

function BackupAndDriveTab({
  db, snapshots, onCreateSnapshot, onRestoreSnapshot, onDeleteSnapshot,
  onExportJson, onExportCsv, onShareGoogleDrive, onImportBackup, onFactoryReset,
  buildBackupJsonString, onRestoreFromDriveData, showToast, t
}) {
  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('replace');
  const [snapName, setSnapName] = useState('');

  // Google Drive Direct API OAuth State
  const [gClientId, setGClientId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_GDRIVE_CLIENT) || ''; } catch { return ''; }
  });
  const [gAccessToken, setGAccessToken] = useState('');
  const [gFiles, setGFiles] = useState([]);
  const [gLoading, setGLoading] = useState(false);
  const [showDriveSetup, setShowDriveSetup] = useState(false);

  const handleSaveClientId = (val) => {
    setGClientId(val);
    try { localStorage.setItem(STORAGE_KEY_GDRIVE_CLIENT, val.trim()); } catch {}
  };

  // Load Google Identity Services script dynamically if user enters a Client ID
  const connectGoogleDriveOAuth = () => {
    if (!gClientId.trim()) {
      setShowDriveSetup(true);
      showToast('Enter your Google OAuth Client ID first (see setup guide below).', 'error');
      return;
    }

    const runTokenClient = () => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: gClientId.trim(),
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setGAccessToken(tokenResponse.access_token);
              showToast('Connected to Google Drive!');
              await fetchDriveBackups(tokenResponse.access_token);
            }
          }
        });
        client.requestAccessToken();
      } catch (err) {
        showToast('Could not launch Google Sign-In popup.', 'error');
      }
    };

    if (window.google?.accounts?.oauth2) {
      runTokenClient();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = runTokenClient;
      script.onerror = () => showToast('Failed to load Google Identity script.', 'error');
      document.body.appendChild(script);
    }
  };

  const getOrCreateDriveFolder = async (token) => {
    const query = encodeURIComponent("name='Vehicle Logs Pro Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    if (searchData.files?.length > 0) return searchData.files[0].id;

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Vehicle Logs Pro Backups',
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    const folder = await createRes.json();
    return folder.id;
  };

  const fetchDriveBackups = async (token = gAccessToken) => {
    if (!token) return;
    setGLoading(true);
    try {
      const folderId = await getOrCreateDriveFolder(token);
      const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGFiles(data.files || []);
    } catch {
      showToast('Failed to list Google Drive backups', 'error');
    } finally {
      setGLoading(false);
    }
  };

  const uploadBackupToDriveApi = async () => {
    if (!gAccessToken) {
      connectGoogleDriveOAuth();
      return;
    }
    setGLoading(true);
    try {
      const folderId = await getOrCreateDriveFolder(gAccessToken);
      const fileName = `vehicle-logs-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json'
      };
      const fileContent = buildBackupJsonString();
      const boundary = '-------314159265358979323846';
      const body =
        `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        fileContent +
        `\r\n--${boundary}--`;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gAccessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body
      });
      if (!res.ok) throw new Error('Upload failed');
      showToast('Backup saved directly to Google Drive!');
      await fetchDriveBackups(gAccessToken);
    } catch {
      showToast('Google Drive upload failed — token may have expired, reconnect and retry.', 'error');
      setGAccessToken('');
    } finally {
      setGLoading(false);
    }
  };

  const downloadAndRestoreDriveFile = async (fileId) => {
    if (!gAccessToken) return;
    setGLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${gAccessToken}` }
      });
      const parsed = await res.json();
      onRestoreFromDriveData(parsed);
    } catch {
      showToast('Failed to download backup from Google Drive', 'error');
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3">
        <ServerOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-extrabold text-emerald-300">100% On-Device Storage • Zero App Servers</div>
          <p className={t.muted}>
            Your data is stored locally on your phone and is never shared on the internet. Backups sent to Google Drive go straight from your phone into your personal Google Drive account.
          </p>
        </div>
      </div>

      {/* Google Drive Integration Card */}
      <div className="rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-950/70 via-indigo-950/40 to-slate-900 text-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Google Drive Backup & Sync</h2>
              <p className="text-xs text-sky-200/80">
                Save your vehicle backups directly to your personal Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onShareGoogleDrive}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg"
          >
            <CloudUpload className="w-4 h-4" /> Send to Google Drive (Instant)
          </button>
        </div>

        {/* Direct Google Drive Folder Sync Option */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-sky-500/25 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-sky-300 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4" /> Direct Folder Sync ("Vehicle Logs Pro Backups")
            </span>
            <button
              onClick={() => setShowDriveSetup(!showDriveSetup)}
              className="text-sky-400 hover:underline font-semibold"
            >
              {showDriveSetup ? 'Hide Setup' : 'Configure Client ID'}
            </button>
          </div>

          {showDriveSetup && (
            <div className="space-y-2 pt-1">
              <p className="text-slate-300">
                Optional: Paste a free Google Cloud Web OAuth Client ID (with Google Drive API enabled) to sync directly inside the app without using Android's share sheet:
              </p>
              <input
                type="text"
                value={gClientId}
                onChange={(e) => handleSaveClientId(e.target.value)}
                placeholder="1234567890-xxxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!gAccessToken ? (
              <button
                onClick={connectGoogleDriveOAuth}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" /> Connect Google Drive Account
              </button>
            ) : (
              <>
                <button
                  onClick={uploadBackupToDriveApi}
                  disabled={gLoading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  <CloudUpload className="w-3.5 h-3.5" /> {gLoading ? 'Syncing...' : 'Upload New Backup to Drive'}
                </button>
                <button
                  onClick={() => fetchDriveBackups()}
                  disabled={gLoading}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                </button>
              </>
            )}
          </div>

          {gFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="font-bold text-slate-300">Saved in Your Google Drive:</div>
              {gFiles.map(f => (
                <div key={f.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-bold truncate">{f.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(f.createdTime).toLocaleString()} {f.size ? `• ${bytesToSize(Number(f.size))}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadAndRestoreDriveFile(f.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Local File Export & Restore (.JSON & .CSV) */}
      <div className={`rounded-2xl border p-5 ${t.card} space-y-4`}>
        <h3 className="font-extrabold text-base flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-400" /> Local Device Backups (.JSON & .CSV)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onExportJson}
            className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
          >
            <FileJson className="w-4 h-4" /> Download Full .JSON Backup
          </button>
          <button
            onClick={onExportCsv}
            className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export All Logs (.CSV)
          </button>
        </div>

        {/* Restore from File */}
        <div className={`p-4 rounded-xl border ${t.cardSub} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold">Restore from .JSON or .CSV File</span>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${t.input}`}
            >
              <option value="replace">Full Replace</option>
              <option value="merge">Smart Merge</option>
            </select>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportBackup(file, importMode);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-indigo-500/40 hover:bg-indigo-500/10 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Upload className="w-4 h-4 text-indigo-400" /> Choose .JSON or .CSV Backup File to Restore
          </button>
        </div>
      </div>

      {/* Named Restore Points (Snapshots) */}
      <div className={`rounded-2xl border p-5 ${t.card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" /> On-Device Restore Points ({snapshots.length})
          </h3>
          <button
            onClick={onFactoryReset}
            className="text-xs font-bold text-rose-500 hover:underline"
          >
            Factory Reset All Data
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const label = snapName.trim() || `Snapshot ${new Date().toLocaleDateString()}`;
            onCreateSnapshot(label, '');
            setSnapName('');
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={snapName}
            onChange={(e) => setSnapName(e.target.value)}
            placeholder="Snapshot name (e.g., Before Winter Service)..."
            className={`flex-1 px-3 py-2 rounded-xl border text-xs ${t.input}`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shrink-0"
          >
            + Save Snapshot
          </button>
        </form>

        {snapshots.length === 0 ? (
          <p className={`text-xs ${t.muted}`}>No snapshots saved yet.</p>
        ) : (
          <div className="space-y-2.5">
            {snapshots.map(snap => (
              <div key={snap.id} className={`p-3.5 rounded-xl border ${t.cardSub} flex items-center justify-between gap-3`}>
                <div>
                  <div className="font-bold text-xs sm:text-sm">{snap.name}</div>
                  <div className={`text-[11px] ${t.muted}`}>
                    {new Date(snap.createdAt).toLocaleString()} • {snap.vehicleCount} Vehicles • {snap.totalLogs} Logs
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRestoreSnapshot(snap)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Restore
                  </button>
                  <button onClick={() => onDeleteSnapshot(snap)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODAL WRAPPER & ALL ADD/EDIT FORM MODALS
// ============================================================================

function ModalWrapper({ title, subtitle, onClose, children, darkMode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className={`px-5 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className="font-extrabold text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function VehicleFormModal({ vehicle, onClose, onSave, t, darkMode }) {
  const photoRef = useRef(null);
  const [form, setForm] = useState({
    id: vehicle?.id || '',
    name: vehicle?.name || '',
    year: vehicle?.year || new Date().getFullYear(),
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    trim: vehicle?.trim || '',
    color: vehicle?.color || '',
    licensePlate: vehicle?.licensePlate || '',
    vin: vehicle?.vin || '',
    odometer: vehicle?.odometer ?? '',
    unit: vehicle?.unit || 'mi',
    fuelType: vehicle?.fuelType || '87 Regular',
    tireSize: vehicle?.tireSize || '',
    tirePsi: vehicle?.tirePsi || '',
    tireBoltPattern: vehicle?.tireBoltPattern || '',
    oilViscosity: vehicle?.oilViscosity || '',
    oilCapacity: vehicle?.oilCapacity || '',
    oilFilterPart: vehicle?.oilFilterPart || '',
    airFilterPart: vehicle?.airFilterPart || '',
    cabinFilterPart: vehicle?.cabinFilterPart || '',
    wiperSizes: vehicle?.wiperSizes || '',
    batteryGroupSize: vehicle?.batteryGroupSize || '',
    sparkPlugPart: vehicle?.sparkPlugPart || '',
    photoUrl: vehicle?.photoUrl || '',
    notes: vehicle?.notes || ''
  });

  const handlePhotoSelect = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 960, 0.78);
      setForm(prev => ({ ...prev, photoUrl: dataUrl }));
    } catch {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) return;
    onSave({
      ...form,
      year: Number(form.year) || new Date().getFullYear(),
      odometer: Number(form.odometer) || 0
    });
  };

  return (
    <ModalWrapper
      title={vehicle ? 'Edit Vehicle & Specs' : 'Add Vehicle to Garage'}
      subtitle="All fields stored 100% locally on your phone"
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Vehicle Photo Uploader */}
        <div className={`p-3.5 rounded-2xl border ${t.cardSub} flex items-center justify-between gap-3`}>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhotoSelect(f);
              e.target.value = '';
            }}
          />
          <div className="flex items-center gap-3">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="Vehicle" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="font-bold text-xs">Vehicle Photo</div>
              <div className={`text-[11px] ${t.muted}`}>Shown in Overview & Maintenance</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs"
            >
              {form.photoUrl ? 'Change' : 'Upload Photo'}
            </button>
            {form.photoUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, photoUrl: '' })}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1">Year *</label>
            <input type="number" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Make *</label>
            <input type="text" required placeholder="Toyota" value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Model *</label>
            <input type="text" required placeholder="RAV4" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1">Trim</label>
            <input type="text" placeholder="XSE AWD" value={form.trim} onChange={e => setForm({ ...form, trim: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Nickname</label>
            <input type="text" placeholder="Daily" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Color</label>
            <input type="text" placeholder="Blue" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Current Odometer *</label>
            <input type="number" required value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Unit</label>
            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              <option value="mi">Miles (mi / gal)</option>
              <option value="km">Kilometers (km / L)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">VIN</label>
            <input type="text" value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value.toUpperCase() })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">License Plate</label>
            <input type="text" value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
        </div>

        {/* Oil Viscosity with Quick Presets */}
        <div className={`p-3.5 rounded-2xl border ${t.cardSub} space-y-2`}>
          <label className="block font-bold text-amber-400">Oil Viscosity & Capacity</label>
          <div className="flex flex-wrap gap-1.5">
            {OIL_VISCOSITY_PRESETS.map(visc => (
              <button
                key={visc}
                type="button"
                onClick={() => setForm({ ...form, oilViscosity: visc })}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  form.oilViscosity === visc ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {visc}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <input
              type="text"
              placeholder="Custom Viscosity (e.g. 5W-30)"
              value={form.oilViscosity}
              onChange={e => setForm({ ...form, oilViscosity: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`}
            />
            <input
              type="text"
              placeholder="Capacity (e.g. 4.8 qt / 4.5 L)"
              value={form.oilCapacity}
              onChange={e => setForm({ ...form, oilCapacity: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
            />
          </div>
        </div>

        {/* Tire Bolt Pattern, Size & PSI */}
        <div className={`p-3.5 rounded-2xl border ${t.cardSub} space-y-2`}>
          <label className="block font-bold text-sky-400">Tire Bolt Pattern, Size & PSI</label>
          <div className="flex flex-wrap gap-1.5">
            {BOLT_PATTERN_PRESETS.map(bp => (
              <button
                key={bp}
                type="button"
                onClick={() => setForm({ ...form, tireBoltPattern: bp })}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  form.tireBoltPattern === bp ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {bp}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <input
              type="text"
              placeholder="Bolt Pattern (5x114.3)"
              value={form.tireBoltPattern}
              onChange={e => setForm({ ...form, tireBoltPattern: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`}
            />
            <input
              type="text"
              placeholder="Tire Size (225/60R18)"
              value={form.tireSize}
              onChange={e => setForm({ ...form, tireSize: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
            />
            <input
              type="text"
              placeholder="PSI (35 PSI)"
              value={form.tirePsi}
              onChange={e => setForm({ ...form, tirePsi: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
            />
          </div>
        </div>

        {/* OEM Filter & Hardware Part Numbers */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block font-bold mb-1">Oil Filter #</label>
            <input type="text" value={form.oilFilterPart} onChange={e => setForm({ ...form, oilFilterPart: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Air Filter #</label>
            <input type="text" value={form.airFilterPart} onChange={e => setForm({ ...form, airFilterPart: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Cabin Filter #</label>
            <input type="text" value={form.cabinFilterPart} onChange={e => setForm({ ...form, cabinFilterPart: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block font-bold mb-1">Wiper Sizes</label>
            <input type="text" placeholder='26" / 16"' value={form.wiperSizes} onChange={e => setForm({ ...form, wiperSizes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Battery Group</label>
            <input type="text" placeholder="Group 35 / H5" value={form.batteryGroupSize} onChange={e => setForm({ ...form, batteryGroupSize: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Spark Plug #</label>
            <input type="text" value={form.sparkPlugPart} onChange={e => setForm({ ...form, sparkPlugPart: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-bold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold">Save Vehicle</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function FuelFormModal({ vehicle, log, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState({
    id: log?.id || '',
    date: log?.date || new Date().toISOString().slice(0, 10),
    odometer: log?.odometer ?? vehicle.odometer,
    volume: log?.volume ?? '',
    pricePerUnit: log?.pricePerUnit ?? '',
    totalCost: log?.totalCost ?? '',
    station: log?.station || '',
    fullTank: log?.fullTank ?? true,
    notes: log?.notes || ''
  });

  const handleCalc = (field, value) => {
    const next = { ...form, [field]: value };
    const v = Number(next.volume);
    const p = Number(next.pricePerUnit);
    if (v > 0 && p > 0) next.totalCost = (v * p).toFixed(2);
    setForm(next);
  };

  return (
    <ModalWrapper title={log ? 'Edit Fuel Fill-Up' : 'Log Fuel Fill-Up'} subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} onClose={onClose} darkMode={darkMode}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            odometer: Number(form.odometer) || 0,
            volume: Number(form.volume) || 0,
            pricePerUnit: Number(form.pricePerUnit) || 0,
            totalCost: Number(form.totalCost) || 0
          });
        }}
        className="space-y-4 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Odometer ({vehicle.unit}) *</label>
            <input type="number" required value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1">{vehicle.unit === 'mi' ? 'Gallons *' : 'Liters *'}</label>
            <input type="number" step="0.01" required value={form.volume} onChange={e => handleCalc('volume', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Price / Unit</label>
            <input type="number" step="0.001" value={form.pricePerUnit} onChange={e => handleCalc('pricePerUnit', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Total Cost *</label>
            <input type="number" step="0.01" required value={form.totalCost} onChange={e => setForm({ ...form, totalCost: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block font-bold mb-1">Station</label>
            <input type="text" placeholder="Costco / Shell" value={form.station} onChange={e => setForm({ ...form, station: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <label className="flex items-center gap-2 py-2.5 text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={form.fullTank} onChange={e => setForm({ ...form, fullTank: e.target.checked })} />
            Filled Tank Completely (MPG Calc)
          </label>
        </div>

        <div>
          <label className="block font-bold mb-1">Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-bold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">Save Fill-Up</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function MaintFormModal({ vehicle, log, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState({
    id: log?.id || '',
    date: log?.date || new Date().toISOString().slice(0, 10),
    odometer: log?.odometer ?? vehicle.odometer,
    category: log?.category || 'Oil Change',
    title: log?.title || '',
    partsReplaced: log?.partsReplaced || '',
    partsCost: log?.partsCost ?? '',
    laborCost: log?.laborCost ?? '',
    totalCost: log?.totalCost ?? '',
    shopName: log?.shopName || '',
    isDiy: log?.isDiy ?? false,
    warranty: log?.warranty || '',
    notes: log?.notes || ''
  });

  const updateSplit = (field, val) => {
    const next = { ...form, [field]: val };
    const p = Number(next.partsCost) || 0;
    const l = Number(next.laborCost) || 0;
    if (p > 0 || l > 0) next.totalCost = (p + l).toFixed(2);
    setForm(next);
  };

  return (
    <ModalWrapper title={log ? 'Edit Service Record' : 'Log Maintenance & Service'} subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} onClose={onClose} darkMode={darkMode}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSave({
            ...form,
            odometer: Number(form.odometer) || 0,
            partsCost: Number(form.partsCost) || 0,
            laborCost: Number(form.laborCost) || 0,
            totalCost: Number(form.totalCost) || 0
          });
        }}
        className="space-y-4 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Service Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Odometer ({vehicle.unit}) *</label>
            <input type="number" required value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              <option value="Oil Change">Oil Change</option>
              <option value="Tires & Alignment">Tires & Alignment</option>
              <option value="Brakes">Brakes</option>
              <option value="Filters">Filters</option>
              <option value="Battery & Electrical">Battery & Electrical</option>
              <option value="Fluids & Coolant">Fluids & Coolant</option>
              <option value="Repair">Repair</option>
              <option value="General Service">General Service</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Service Title *</label>
            <input type="text" required placeholder="Synthetic Oil & Filter" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1">Parts & Fluids Used</label>
          <input type="text" placeholder={`e.g. ${vehicle.oilViscosity || '0W-20'} Oil, Filter ${vehicle.oilFilterPart || ''}`} value={form.partsReplaced} onChange={e => setForm({ ...form, partsReplaced: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1">Parts Cost</label>
            <input type="number" step="0.01" value={form.partsCost} onChange={e => updateSplit('partsCost', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Labor Cost</label>
            <input type="number" step="0.01" value={form.laborCost} onChange={e => updateSplit('laborCost', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Total Cost *</label>
            <input type="number" step="0.01" required value={form.totalCost} onChange={e => setForm({ ...form, totalCost: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block font-bold mb-1">Shop Name</label>
            <input type="text" disabled={form.isDiy} placeholder="Shop or Dealer" value={form.isDiy ? 'DIY Home Garage' : form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <label className="flex items-center gap-2 py-2.5 text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={form.isDiy} onChange={e => setForm({ ...form, isDiy: e.target.checked })} />
            DIY Garage Service
          </label>
        </div>

        <div>
          <label className="block font-bold mb-1">Warranty & Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-bold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold">Save Service</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ExpenseFormModal({ vehicle, log, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState({
    id: log?.id || '',
    date: log?.date || new Date().toISOString().slice(0, 10),
    category: log?.category || 'Insurance',
    title: log?.title || '',
    cost: log?.cost ?? '',
    notes: log?.notes || ''
  });

  return (
    <ModalWrapper title={log ? 'Edit Expense' : 'Log Ownership Expense'} subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} onClose={onClose} darkMode={darkMode}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSave({ ...form, cost: Number(form.cost) || 0 });
        }}
        className="space-y-4 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              <option value="Insurance">Insurance</option>
              <option value="Registration">Registration</option>
              <option value="Tolls">Tolls</option>
              <option value="Parking">Parking</option>
              <option value="Wash/Detailing">Wash / Detailing</option>
              <option value="Accessories">Accessories</option>
              <option value="Repairs">Repairs</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-bold mb-1">Description *</label>
          <input type="text" required placeholder="Annual Insurance Renewal" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>
        <div>
          <label className="block font-bold mb-1">Cost *</label>
          <input type="number" step="0.01" required value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>
        <div>
          <label className="block font-bold mb-1">Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-bold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold">Save Expense</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function TripFormModal({ vehicle, trip, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState({
    id: trip?.id || '',
    date: trip?.date || new Date().toISOString().slice(0, 10),
    purpose: trip?.purpose || '',
    origin: trip?.origin || '',
    destination: trip?.destination || '',
    startOdo: trip?.startOdo ?? vehicle.odometer,
    endOdo: trip?.endOdo ?? vehicle.odometer,
    distance: trip?.distance ?? '',
    isBusiness: trip?.isBusiness ?? true,
    notes: trip?.notes || ''
  });

  const handleOdoChange = (field, val) => {
    const next = { ...form, [field]: val };
    const s = Number(next.startOdo);
    const e = Number(next.endOdo);
    if (e >= s && s > 0) next.distance = e - s;
    setForm(next);
  };

  return (
    <ModalWrapper title={trip ? 'Edit Trip Log' : 'Log Mileage Trip'} subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} onClose={onClose} darkMode={darkMode}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const s = Number(form.startOdo) || 0;
          const end = Number(form.endOdo) || 0;
          const dist = Number(form.distance) || Math.max(0, end - s);
          onSave({ ...form, startOdo: s, endOdo: end, distance: dist });
        }}
        className="space-y-4 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Purpose *</label>
            <input type="text" required placeholder="Client Visit / Road Trip" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Origin</label>
            <input type="text" placeholder="Home / Office" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Destination</label>
            <input type="text" placeholder="Client Site" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1">Start Odo</label>
            <input type="number" value={form.startOdo} onChange={e => handleOdoChange('startOdo', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">End Odo</label>
            <input type="number" value={form.endOdo} onChange={e => handleOdoChange('endOdo', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Distance ({vehicle.unit}) *</label>
            <input type="number" required value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
          <input type="checkbox" checked={form.isBusiness} onChange={e => setForm({ ...form, isBusiness: e.target.checked })} />
          Business Mileage Trip
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-bold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold">Save Trip</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ReminderFormModal({ vehicle, reminder, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState({
    id: reminder?.id || '',
    title: reminder?.title || '',
    category: reminder?.category || 'Oil Change',
    dueOdometer: reminder?.dueOdometer ?? vehicle.odometer + 8000,
    dueDate: reminder?.dueDate || '',
    notes: reminder?.notes || ''
  });

  return (
    <ModalWrapper title={reminder ? 'Edit Service Reminder' : 'New Service Reminder'} subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} onClose={onClose} darkMode={darkMode}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSave({ ...form, dueOdometer: form.dueOdometer ? Number(form.dueOdometer) : null });
        }}
        className="space-y-4 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-bold mb-1">Reminder Title *</label>
          <input type="text" required placeholder="Synthetic Oil Change" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1">Due Odometer ({vehicle.unit})</label>
            <input type="number" value={form.dueOdometer} onChange={e => setForm({ ...form, dueOdometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block font-bold mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-bold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold">Save Reminder</button>
        </div>
      </form>
    </ModalWrapper>
  );
}