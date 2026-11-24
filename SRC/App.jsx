import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car, Fuel, Wrench, Receipt, Bell, BarChart3, ShieldCheck, Plus,
  Search, Filter, Download, Upload, History, RotateCcw, Trash2,
  Edit3, CheckCircle2, AlertTriangle, AlertCircle, Gauge, Calendar,
  DollarSign, Droplets, MapPin, Tag, ChevronRight, ChevronDown,
  Moon, Sun, Layers, Archive, FileSpreadsheet, FileJson, Info,
  Sparkles, X, Check, ArrowUpRight, ArrowDownRight, Settings,
  Truck, Bike, Ship, Cpu, HelpCircle, Save, RefreshCw, Eye
} from 'lucide-react';

// ============================================================================
// UTILITY FUNCTIONS & CONSTANTS
// ============================================================================

const STORAGE_KEY_DATA = 'vlp_database_v1';
const STORAGE_KEY_SNAPSHOTS = 'vlp_snapshots_v1';
const STORAGE_KEY_THEME = 'vlp_theme_v1';

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatNumber = (val, decimals = 0) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const bytesToSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const VEHICLE_TYPES = [
  { id: 'car', label: 'Car / SUV', icon: Car },
  { id: 'truck', label: 'Truck / Van', icon: Truck },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'marine', label: 'Boat / RV', icon: Ship },
  { id: 'equipment', label: 'Equipment', icon: Cpu },
];

const SERVICE_CATEGORIES = [
  'Oil Change', 'Tires & Alignment', 'Brakes', 'Engine & Drivetrain',
  'Transmission', 'Battery & Electrical', 'Fluid Flush', 'Filters',
  'Suspension & Steering', 'Inspection & Emissions', 'Body & Glass', 'Other'
];

const EXPENSE_CATEGORIES = [
  'Insurance', 'Registration & Taxes', 'Tolls & Parking',
  'Car Wash & Detailing', 'Accessories & Mods', 'Roadside Assistance',
  'Business Trip', 'Personal Trip', 'Other'
];

// ============================================================================
// SAMPLE DATA GENERATOR (3 RICH VEHICLES + LOGS + REMINDERS + SNAPSHOTS)
// ============================================================================

const createSampleDatabase = () => {
  const v1Id = 'veh-rav4-01';
  const v2Id = 'veh-f250-02';
  const v3Id = 'veh-mt09-03';

  const vehicles = [
    {
      id: v1Id,
      archived: false,
      type: 'car',
      year: 2022,
      make: 'Toyota',
      model: 'RAV4 Hybrid',
      trim: 'XSE AWD',
      nickname: 'Daily Commuter',
      vin: '2T3EWRFV8NW149821',
      licensePlate: 'CYKL-842',
      region: 'ON, Canada',
      color: 'Cavalry Blue / Midnight Black',
      unit: 'km',
      odometer: 58420,
      purchaseDate: '2022-04-15',
      purchasePrice: 43800,
      engineSpec: '2.5L Dynamic Force 4-Cyl + Dual Electric Motors (219 HP)',
      drivetrain: 'Electronic On-Demand AWD / eCVT',
      tireSize: '225/60R18 100H',
      tirePsi: '35 PSI Front / 35 PSI Rear',
      oilType: '0W-16 Full Synthetic (4.5 L)',
      oilFilterPart: 'Toyota 90915-YZZN1',
      airFilterPart: 'Denso 143-3732 (17801-F0020)',
      cabinFilterPart: 'Fram CF12157 (87139-0E040)',
      fuelFilterPart: 'In-Tank Lifetime Assembly',
      insuranceProvider: 'Intact Insurance',
      insurancePolicy: 'POL-8849201-ON',
      registrationExpiry: '2027-04-30',
      notes: 'Primary family commuter. Winter tires (Blizzak DM-V2 on 17" steelies) swapped every Nov & April. Use Top Tier 87 Octane only.'
    },
    {
      id: v2Id,
      archived: false,
      type: 'truck',
      year: 2020,
      make: 'Ford',
      model: 'F-250 Super Duty',
      trim: 'Lariat Tremor 6.7L PowerStroke',
      nickname: 'Heavy Hauler',
      vin: '1FT7W2BT5LEC90314',
      licensePlate: 'TRK-9910',
      region: 'ON, Canada',
      color: 'Antimatter Blue',
      unit: 'mi',
      odometer: 74650,
      purchaseDate: '2020-09-10',
      purchasePrice: 68500,
      engineSpec: '6.7L Power Stroke V8 Turbo Diesel (475 HP / 1,050 lb-ft)',
      drivetrain: '4WD / TorqShift 10-Speed Auto / 3.55 E-Locker',
      tireSize: 'LT285/75R18E Goodyear Wrangler Duratrac',
      tirePsi: '65 PSI Front / 70 PSI Rear (Unloaded)',
      oilType: '5W-40 Full Synthetic CK-4 Diesel (13.0 Qts)',
      oilFilterPart: 'Motorcraft FL-2124-S',
      airFilterPart: 'Motorcraft FA-1927',
      cabinFilterPart: 'Motorcraft FP-79',
      fuelFilterPart: 'Motorcraft FD-4625AA (Dual Kit)',
      insuranceProvider: 'Aviva Commercial/Personal',
      insurancePolicy: 'AV-4410293',
      registrationExpiry: '2027-01-31',
      notes: 'Used for towing 9,500 lb travel trailer. Drain water separator monthly. Add Hot Shot’s Secret EDT every fill-up.'
    },
    {
      id: v3Id,
      archived: false,
      type: 'motorcycle',
      year: 2023,
      make: 'Yamaha',
      model: 'MT-09 SP',
      trim: 'SP Ohlins Edition',
      nickname: 'Weekend Canyon Carver',
      vin: 'JYARN75E2PA004192',
      licensePlate: '92M-84',
      region: 'ON, Canada',
      color: 'Icon Performance (Liquid Metal / Raven)',
      unit: 'km',
      odometer: 11280,
      purchaseDate: '2023-05-20',
      purchasePrice: 13499,
      engineSpec: '890cc CP3 Liquid-Cooled Inline-3 DOHC (117 HP)',
      drivetrain: '6-Speed w/ Quickshifter Up/Down / 525 Chain',
      tireSize: '120/70ZR17 Front | 180/55ZR17 Rear (Bridgestone S22)',
      tirePsi: '36 PSI Front / 42 PSI Rear',
      oilType: '10W-40 Yamalube Full Synthetic (2.7 L w/ filter)',
      oilFilterPart: 'Yamaha 5GH-13440-80-00',
      airFilterPart: 'Yamaha B7N-14451-00-00',
      cabinFilterPart: 'N/A',
      fuelFilterPart: 'Internal Pump Strainer',
      insuranceProvider: 'Riders Plus',
      insurancePolicy: 'RP-772109',
      registrationExpiry: '2027-05-31',
      notes: 'Clean and lube chain every 600 km with Maxima Chain Wax. Requires 91+ Octane Premium fuel. Stored on battery tender Nov–March.'
    }
  ];

  const fuelLogs = [
    // RAV4 Fuel Logs (km & L)
    { id: 'fl-101', vehicleId: v1Id, date: '2026-08-04', odometer: 55610, volume: 42.5, pricePerUnit: 1.54, totalCost: 65.45, grade: '87 Regular', station: 'Costco Gas #512', fullTank: true, drivingType: 'Mixed', notes: 'Normal commute + weekend trip' },
    { id: 'fl-102', vehicleId: v1Id, date: '2026-08-22', odometer: 56385, volume: 44.1, pricePerUnit: 1.58, totalCost: 69.68, grade: '87 Regular', station: 'Shell V-Power', fullTank: true, drivingType: 'Highway', notes: 'Highway run to Toronto & back' },
    { id: 'fl-103', vehicleId: v1Id, date: '2026-09-14', odometer: 57120, volume: 40.8, pricePerUnit: 1.51, totalCost: 61.61, grade: '87 Regular', station: 'Esso', fullTank: true, drivingType: 'City', notes: 'Mostly city hybrid EV mode' },
    { id: 'fl-104', vehicleId: v1Id, date: '2026-10-08', odometer: 57810, volume: 39.2, pricePerUnit: 1.49, totalCost: 58.41, grade: '87 Regular', station: 'Costco Gas #512', fullTank: true, drivingType: 'Mixed', notes: '' },
    { id: 'fl-105', vehicleId: v1Id, date: '2026-11-05', odometer: 58420, volume: 37.9, pricePerUnit: 1.52, totalCost: 57.61, grade: '87 Regular', station: 'Petro-Canada', fullTank: true, drivingType: 'City', notes: 'Cooler autumn temps lowering MPG slightly' },

    // F-250 Diesel Logs (mi & gal)
    { id: 'fl-201', vehicleId: v2Id, date: '2026-07-18', odometer: 72410, volume: 28.4, pricePerUnit: 3.89, totalCost: 110.48, grade: 'ULSD Diesel #2', station: 'Flying J Travel Center', fullTank: true, drivingType: 'Towing', notes: 'Towing 9,500 lb trailer into mountains' },
    { id: 'fl-202', vehicleId: v2Id, date: '2026-08-19', odometer: 72980, volume: 31.2, pricePerUnit: 3.79, totalCost: 118.25, grade: 'ULSD Diesel #2', station: 'Love’s Travel Stop', fullTank: true, drivingType: 'Highway', notes: 'Unloaded highway cruise at 68 mph' },
    { id: 'fl-203', vehicleId: v2Id, date: '2026-09-25', odometer: 73590, volume: 32.0, pricePerUnit: 3.85, totalCost: 123.20, grade: 'ULSD Diesel #2', station: 'Shell Diesel', fullTank: true, drivingType: 'Mixed', notes: 'Added 4oz Hot Shot EDT' },
    { id: 'fl-204', vehicleId: v2Id, date: '2026-10-29', odometer: 74150, volume: 30.8, pricePerUnit: 3.95, totalCost: 121.66, grade: 'ULSD Diesel #2', station: 'Pilot Travel Center', fullTank: true, drivingType: 'Towing', notes: 'Autumn camping trip haul' },
    { id: 'fl-205', vehicleId: v2Id, date: '2026-11-18', odometer: 74650, volume: 27.5, pricePerUnit: 3.92, totalCost: 107.80, grade: 'ULSD Diesel #2', station: 'Costco Diesel', fullTank: true, drivingType: 'Mixed', notes: 'Winterized diesel blend started' },

    // MT-09 SP Motorcycle Logs (km & L)
    { id: 'fl-301', vehicleId: v3Id, date: '2026-08-10', odometer: 10420, volume: 11.4, pricePerUnit: 1.79, totalCost: 20.41, grade: '91 Premium Non-Ethanol', station: 'Shell V-Power', fullTank: true, drivingType: 'Mixed', notes: 'Niagara Escarpment twisties' },
    { id: 'fl-302', vehicleId: v3Id, date: '2026-09-06', odometer: 10860, volume: 11.9, pricePerUnit: 1.76, totalCost: 20.94, grade: '91 Premium Non-Ethanol', station: 'Shell V-Power', fullTank: true, drivingType: 'Highway', notes: 'Spirited Sunday morning ride' },
    { id: 'fl-303', vehicleId: v3Id, date: '2026-10-19', odometer: 11280, volume: 11.6, pricePerUnit: 1.74, totalCost: 20.18, grade: '91 Premium Non-Ethanol', station: 'Esso Synergy 93', fullTank: true, drivingType: 'Mixed', notes: 'Final fill before winter storage w/ Sta-Bil' },
  ];

  const maintenanceLogs = [
    {
      id: 'ml-101',
      vehicleId: v1Id,
      date: '2026-09-02',
      odometer: 56800,
      category: 'Oil Change',
      title: 'Synthetic Oil & Filter Change + Tire Rotation',
      partsReplaced: 'Toyota 0W-16 Full Synthetic (4.5L), Filter 90915-YZZN1, Crush Washer 90430-12031',
      partsCost: 58.50,
      laborCost: 0,
      totalCost: 58.50,
      shopName: 'DIY Home Garage',
      isDiy: true,
      warranty: 'Parts 12 mo',
      nextDueOdometer: 64800,
      nextDueDate: '2027-03-02',
      notes: 'Torqued drain plug to 30 ft-lbs. Rotated tires front-to-rear, inspected brake pads (7mm remaining).'
    },
    {
      id: 'ml-102',
      vehicleId: v1Id,
      date: '2026-11-08',
      odometer: 58420,
      category: 'Tires & Alignment',
      title: 'Winter Wheel & Tire Swap + 4-Wheel Alignment',
      partsReplaced: 'Mounted Blizzak DM-V2 225/65R17 Winter Set',
      partsCost: 0,
      laborCost: 119.95,
      totalCost: 119.95,
      shopName: 'St. Catharines Tire & Auto',
      isDiy: false,
      warranty: 'Alignment 12 mo / 20,000 km',
      nextDueOdometer: 66000,
      nextDueDate: '2027-04-15',
      notes: 'Relearned TPMS sensors. Toe adjusted slightly on front right.'
    },
    {
      id: 'ml-201',
      vehicleId: v2Id,
      date: '2026-08-28',
      odometer: 73100,
      category: 'Fluid Flush',
      title: 'Diesel Oil, Dual Fuel Filters & Air Filter Service',
      partsReplaced: '13 Qts Rotella T6 5W-40, Motorcraft FL-2124-S, FD-4625AA Dual Fuel Filters, FA-1927 Air Filter',
      partsCost: 234.00,
      laborCost: 0,
      totalCost: 234.00,
      shopName: 'DIY Driveway Service',
      isDiy: true,
      warranty: 'Motorcraft 24 mo',
      nextDueOdometer: 78100,
      nextDueDate: '2027-02-28',
      notes: 'Primed fuel system 6 key cycles before cranking. Zero leaks.'
    },
    {
      id: 'ml-202',
      vehicleId: v2Id,
      date: '2026-10-12',
      odometer: 73950,
      category: 'Brakes',
      title: 'Front Severe-Duty Brake Pads & Rotors',
      partsReplaced: 'PowerStop Z36 Truck & Tow Front Rotor & Carbon-Fiber Ceramic Pad Kit',
      partsCost: 445.00,
      laborCost: 210.00,
      totalCost: 655.00,
      shopName: 'Niagara Diesel & Fleet',
      isDiy: false,
      warranty: '36 mo / 36,000 mi',
      nextDueOdometer: 115000,
      nextDueDate: '2029-10-12',
      notes: 'Cleaned and greased caliper slide pins with Sil-Glyde. Bedded pads per spec.'
    },
    {
      id: 'ml-301',
      vehicleId: v3Id,
      date: '2026-10-20',
      odometer: 11280,
      category: 'Oil Change',
      title: 'End-of-Season Oil Change & Winterization',
      partsReplaced: 'Yamalube Full Synthetic 10W-40 (3L), Yamaha Filter 5GH-13440-80-00, Crush Washer',
      partsCost: 64.00,
      laborCost: 0,
      totalCost: 64.00,
      shopName: 'DIY Moto Bench',
      isDiy: true,
      warranty: 'N/A',
      nextDueOdometer: 16280,
      nextDueDate: '2027-10-20',
      notes: 'Cleaned chain, applied Maxima Chain Wax, inflated tires to 42 PSI, hooked up Optimate 4 tender.'
    }
  ];

  const expenseLogs = [
    { id: 'ex-101', vehicleId: v1Id, date: '2026-04-15', odometer: 51200, category: 'Insurance', title: 'Annual Auto Insurance Renewal', cost: 1480.00, isBusiness: false, notes: 'Paid in full for 5% discount' },
    { id: 'ex-102', vehicleId: v1Id, date: '2026-09-18', odometer: 57250, category: 'Business Trip', title: 'Client Site Visit - Mississauga Roundtrip', cost: 24.50, isBusiness: true, notes: '165 km business mileage + Hwy 407 ETR toll' },
    { id: 'ex-201', vehicleId: v2Id, date: '2026-01-25', odometer: 68200, category: 'Registration & Taxes', title: 'Commercial/Heavy Truck Plate Renewal', cost: 265.00, isBusiness: true, notes: 'Annual sticker/registration' },
    { id: 'ex-202', vehicleId: v2Id, date: '2026-09-05', odometer: 73250, category: 'Accessories & Mods', title: 'B&W Turnoverball Gooseneck Hitch', cost: 689.00, isBusiness: false, notes: 'Installed in bed for future fifth-wheel/gooseneck' },
    { id: 'ex-301', vehicleId: v3Id, date: '2026-05-20', odometer: 8900, category: 'Insurance', title: 'Motorcycle Annual Policy', cost: 890.00, isBusiness: false, notes: 'Full coverage w/ $500 deductible' },
  ];

  const reminders = [
    {
      id: 'rem-101',
      vehicleId: v1Id,
      title: 'Synthetic Oil & Filter Change (0W-16)',
      category: 'Oil Change',
      dueOdometer: 64800,
      lastOdometer: 56800,
      dueDate: '2027-03-02',
      notes: 'Use Toyota 90915-YZZN1 filter'
    },
    {
      id: 'rem-102',
      vehicleId: v1Id,
      title: 'Engine & Cabin Air Filter Replacement',
      category: 'Filters',
      dueOdometer: 60000,
      lastOdometer: 45000,
      dueDate: '2026-12-15',
      notes: 'Due soon! Order Denso 143-3732 & Fram CF12157'
    },
    {
      id: 'rem-201',
      vehicleId: v2Id,
      title: 'Diesel Oil & Fuel Filter Service',
      category: 'Oil Change',
      dueOdometer: 78100,
      lastOdometer: 73100,
      dueDate: '2027-02-28',
      notes: '5,000 mi severe towing interval'
    },
    {
      id: 'rem-202',
      vehicleId: v2Id,
      title: 'Front & Rear Differential Fluid Change',
      category: 'Fluid Flush',
      dueOdometer: 75000,
      lastOdometer: 45000,
      dueDate: '2026-12-01',
      notes: '75W-140 Synthetic rear, 75W-90 front'
    },
    {
      id: 'rem-301',
      vehicleId: v3Id,
      title: 'Brake Fluid Flush (Front & Rear DOT 4)',
      category: 'Fluid Flush',
      dueOdometer: 15000,
      lastOdometer: 0,
      dueDate: '2027-04-01',
      notes: 'Spring prep before riding season'
    }
  ];

  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    vehicles,
    fuelLogs,
    maintenanceLogs,
    expenseLogs,
    reminders
  };
};

const createSampleSnapshots = (db) => {
  const serialized = JSON.stringify(db);
  return [
    {
      id: 'snap-sample-1',
      name: 'Mid-2026 Summer Fleet Baseline',
      type: 'Manual',
      createdAt: '2026-07-01T14:30:00.000Z',
      vehicleCount: db.vehicles.length,
      totalLogs: db.fuelLogs.length + db.maintenanceLogs.length + db.expenseLogs.length,
      sizeBytes: serialized.length,
      notes: 'Created before summer towing trips and autumn brake service.',
      data: db
    },
    {
      id: 'snap-sample-2',
      name: 'Pre-Winterization Full Backup',
      type: 'Manual',
      createdAt: '2026-11-10T09:15:00.000Z',
      vehicleCount: db.vehicles.length,
      totalLogs: db.fuelLogs.length + db.maintenanceLogs.length + db.expenseLogs.length,
      sizeBytes: serialized.length,
      notes: 'All 3 vehicles updated after winter tire swap & motorcycle storage.',
      data: db
    }
  ];
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Main Database state
  const [db, setDb] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load DB from localStorage', e);
    }
    return createSampleDatabase();
  });

  // Restore Points (Snapshots) state
  const [snapshots, setSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load snapshots', e);
    }
    const initialDb = createSampleDatabase();
    return createSampleSnapshots(initialDb);
  });

  // Navigation & Selection states
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | fuel | maintenance | expenses | reminders | analytics | specs | fleet | backups
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
    const active = db.vehicles.filter(v => !v.archived);
    return active[0]?.id || db.vehicles[0]?.id || '';
  });
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Modals state
  const [vehicleModal, setVehicleModal] = useState({ open: false, editing: null });
  const [fuelModal, setFuelModal] = useState({ open: false, editing: null });
  const [maintModal, setMaintModal] = useState({ open: false, editing: null });
  const [expenseModal, setExpenseModal] = useState({ open: false, editing: null });
  const [reminderModal, setReminderModal] = useState({ open: false, editing: null });
  const [snapshotModal, setSnapshotModal] = useState({ open: false });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false });
  const [previewSnapshot, setPreviewSnapshot] = useState(null);

  // Persist DB & Theme & Snapshots
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(db));
    } catch (e) {
      showToast('Storage quota warning: Consider exporting a JSON backup.', 'error');
    }
  }, [db]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed saving snapshots', e);
    }
  }, [snapshots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev && Date.now() - prev.id >= 3200 ? null : prev));
    }, 3500);
  };

  // Ensure valid selected vehicle
  const activeVehicles = useMemo(() => db.vehicles.filter(v => showArchived || !v.archived), [db.vehicles, showArchived]);
  const currentVehicle = useMemo(() => {
    return db.vehicles.find(v => v.id === selectedVehicleId) || activeVehicles[0] || db.vehicles[0] || null;
  }, [db.vehicles, selectedVehicleId, activeVehicles]);

  useEffect(() => {
    if (currentVehicle && currentVehicle.id !== selectedVehicleId) {
      setSelectedVehicleId(currentVehicle.id);
    }
  }, [currentVehicle, selectedVehicleId]);

  // ============================================================================
  // COMPUTED METRICS FOR CURRENT VEHICLE & FLEET
  // ============================================================================

  // Fuel logs enriched with trip distance, MPG, L/100km, km/L, cost per distance
  const enrichedVehicleFuelLogs = useMemo(() => {
    if (!currentVehicle) return [];
    const logs = [...db.fuelLogs]
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => a.odometer - b.odometer || a.date.localeCompare(b.date));

    const enriched = logs.map((log, idx) => {
      const prev = idx > 0 ? logs[idx - 1] : null;
      const tripDist = prev ? Math.max(0, log.odometer - prev.odometer) : 0;
      let mpg = null;
      let l100km = null;
      let kml = null;
      let costPerDist = null;

      if (tripDist > 0 && log.volume > 0 && log.fullTank) {
        if (currentVehicle.unit === 'mi') {
          mpg = tripDist / log.volume;
          l100km = 235.215 / mpg;
          kml = mpg * 0.425144;
        } else {
          kml = tripDist / log.volume;
          l100km = (log.volume / tripDist) * 100;
          mpg = 235.215 / l100km;
        }
        costPerDist = log.totalCost / tripDist;
      }

      return { ...log, tripDist, mpg, l100km, kml, costPerDist };
    });

    return enriched.reverse(); // Newest first for tables
  }, [db.fuelLogs, currentVehicle]);

  const vehicleMaintLogs = useMemo(() => {
    if (!currentVehicle) return [];
    return [...db.maintenanceLogs]
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer);
  }, [db.maintenanceLogs, currentVehicle]);

  const vehicleExpenseLogs = useMemo(() => {
    if (!currentVehicle) return [];
    return [...db.expenseLogs]
      .filter(l => l.vehicleId === currentVehicle.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.expenseLogs, currentVehicle]);

  const vehicleReminders = useMemo(() => {
    if (!currentVehicle) return [];
    return db.reminders
      .filter(r => r.vehicleId === currentVehicle.id)
      .map(r => enrichReminderStatus(r, currentVehicle.odometer));
  }, [db.reminders, currentVehicle]);

  function enrichReminderStatus(rem, currentOdo) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let odoRemaining = null;
    let odoProgress = 0;
    let odoStatus = 'ok';

    if (rem.dueOdometer) {
      odoRemaining = rem.dueOdometer - currentOdo;
      const startOdo = rem.lastOdometer ?? Math.max(0, rem.dueOdometer - 8000);
      const span = Math.max(1, rem.dueOdometer - startOdo);
      odoProgress = Math.min(100, Math.max(0, ((currentOdo - startOdo) / span) * 100));
      if (odoRemaining <= 0) odoStatus = 'overdue';
      else if (odoRemaining <= 1000) odoStatus = 'due_soon';
    }

    let daysRemaining = null;
    let dateStatus = 'ok';
    if (rem.dueDate) {
      const due = new Date(rem.dueDate + 'T00:00:00');
      daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) dateStatus = 'overdue';
      else if (daysRemaining <= 30) dateStatus = 'due_soon';
    }

    let overallStatus = 'ok';
    if (odoStatus === 'overdue' || dateStatus === 'overdue') overallStatus = 'overdue';
    else if (odoStatus === 'due_soon' || dateStatus === 'due_soon') overallStatus = 'due_soon';

    return { ...rem, odoRemaining, odoProgress, daysRemaining, overallStatus };
  }

  // Vehicle summary KPI stats
  const vehicleStats = useMemo(() => {
    if (!currentVehicle) return null;
    const fuelSpend = enrichedVehicleFuelLogs.reduce((s, l) => s + (Number(l.totalCost) || 0), 0);
    const maintSpend = vehicleMaintLogs.reduce((s, l) => s + (Number(l.totalCost) || 0), 0);
    const expSpend = vehicleExpenseLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
    const totalSpend = fuelSpend + maintSpend + expSpend;

    const validEffLogs = enrichedVehicleFuelLogs.filter(l => l.mpg !== null);
    const avgMpg = validEffLogs.length
      ? validEffLogs.reduce((s, l) => s + l.mpg, 0) / validEffLogs.length
      : 0;
    const avgL100 = validEffLogs.length
      ? validEffLogs.reduce((s, l) => s + l.l100km, 0) / validEffLogs.length
      : 0;

    const totalTrackedDist = enrichedVehicleFuelLogs.reduce((s, l) => s + l.tripDist, 0);
    const costPerUnitDist = totalTrackedDist > 0 ? totalSpend / totalTrackedDist : 0;

    return {
      fuelSpend,
      maintSpend,
      expSpend,
      totalSpend,
      avgMpg,
      avgL100,
      totalTrackedDist,
      costPerUnitDist,
      dueCount: vehicleReminders.filter(r => r.overallStatus !== 'ok').length
    };
  }, [currentVehicle, enrichedVehicleFuelLogs, vehicleMaintLogs, vehicleExpenseLogs, vehicleReminders]);

  // Fleet-wide stats
  const fleetStats = useMemo(() => {
    const totalPurchaseValue = db.vehicles.reduce((s, v) => s + (Number(v.purchasePrice) || 0), 0);
    const totalFuel = db.fuelLogs.reduce((s, l) => s + (Number(l.totalCost) || 0), 0);
    const totalMaint = db.maintenanceLogs.reduce((s, l) => s + (Number(l.totalCost) || 0), 0);
    const totalExp = db.expenseLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
    const allReminders = db.reminders.map(r => {
      const v = db.vehicles.find(veh => veh.id === r.vehicleId);
      return { ...enrichReminderStatus(r, v?.odometer || 0), vehicleName: v ? `${v.year} ${v.make} ${v.model}` : 'Unknown', unit: v?.unit || 'mi' };
    });

    return {
      vehicleCount: db.vehicles.length,
      activeCount: db.vehicles.filter(v => !v.archived).length,
      totalPurchaseValue,
      totalFuel,
      totalMaint,
      totalExp,
      totalLifetimeSpend: totalFuel + totalMaint + totalExp,
      allReminders,
      alertReminders: allReminders.filter(r => r.overallStatus !== 'ok')
    };
  }, [db]);

  // ============================================================================
  // CRUD HANDLERS & ODOMETER AUTO-SYNC
  // ============================================================================

  const syncVehicleOdometer = (vehicleId, newOdo) => {
    const odoNum = Number(newOdo);
    if (!odoNum) return;
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      vehicles: prev.vehicles.map(v =>
        v.id === vehicleId && odoNum > v.odometer ? { ...v, odometer: odoNum } : v
      )
    }));
  };

  const handleSaveVehicle = (vehData) => {
    if (vehData.id) {
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        vehicles: prev.vehicles.map(v => (v.id === vehData.id ? vehData : v))
      }));
      showToast('Vehicle profile updated');
    } else {
      const newVeh = { ...vehData, id: generateId(), archived: false };
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        vehicles: [...prev.vehicles, newVeh]
      }));
      setSelectedVehicleId(newVeh.id);
      showToast(`Added ${newVeh.year} ${newVeh.make} ${newVeh.model}`);
    }
    setVehicleModal({ open: false, editing: null });
  };

  const handleToggleArchiveVehicle = (vehId) => {
    setDb(prev => ({
      ...prev,
      lastModified: new Date().toISOString(),
      vehicles: prev.vehicles.map(v => (v.id === vehId ? { ...v, archived: !v.archived } : v))
    }));
    showToast('Vehicle archive status updated');
  };

  const handleDeleteVehicle = (veh) => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: `Delete ${veh.year} ${veh.make} ${veh.model}?`,
      message: 'This will permanently delete this vehicle and all of its fuel, maintenance, expense logs, and reminders. Consider creating a Restore Point first.',
      onConfirm: () => {
        setDb(prev => ({
          ...prev,
          lastModified: new Date().toISOString(),
          vehicles: prev.vehicles.filter(v => v.id !== veh.id),
          fuelLogs: prev.fuelLogs.filter(l => l.vehicleId !== veh.id),
          maintenanceLogs: prev.maintenanceLogs.filter(l => l.vehicleId !== veh.id),
          expenseLogs: prev.expenseLogs.filter(l => l.vehicleId !== veh.id),
          reminders: prev.reminders.filter(r => r.vehicleId !== veh.id),
        }));
        showToast('Vehicle and associated logs deleted');
        setConfirmDialog({ open: false });
      }
    });
  };

  const handleSaveFuelLog = (logData) => {
    const entry = {
      ...logData,
      vehicleId: currentVehicle.id,
      odometer: Number(logData.odometer),
      volume: Number(logData.volume),
      pricePerUnit: Number(logData.pricePerUnit),
      totalCost: Number(logData.totalCost),
    };

    if (entry.id) {
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        fuelLogs: prev.fuelLogs.map(l => (l.id === entry.id ? entry : l))
      }));
      showToast('Fuel log updated');
    } else {
      entry.id = generateId();
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        fuelLogs: [...prev.fuelLogs, entry]
      }));
      showToast('Fuel fill-up logged');
    }
    syncVehicleOdometer(currentVehicle.id, entry.odometer);
    setFuelModal({ open: false, editing: null });
  };

  const handleSaveMaintLog = (logData, autoCreateReminder) => {
    const entry = {
      ...logData,
      vehicleId: currentVehicle.id,
      odometer: Number(logData.odometer),
      partsCost: Number(logData.partsCost) || 0,
      laborCost: Number(logData.laborCost) || 0,
      totalCost: Number(logData.totalCost) || 0,
      nextDueOdometer: logData.nextDueOdometer ? Number(logData.nextDueOdometer) : null,
    };

    setDb(prev => {
      const updatedLogs = entry.id
        ? prev.maintenanceLogs.map(l => (l.id === entry.id ? entry : l))
        : [...prev.maintenanceLogs, { ...entry, id: generateId() }];

      let updatedReminders = [...prev.reminders];
      if (autoCreateReminder && (entry.nextDueOdometer || entry.nextDueDate)) {
        updatedReminders.push({
          id: generateId(),
          vehicleId: currentVehicle.id,
          title: `Next: ${entry.title}`,
          category: entry.category,
          lastOdometer: entry.odometer,
          dueOdometer: entry.nextDueOdometer || null,
          dueDate: entry.nextDueDate || null,
          notes: `Auto-scheduled from service on ${entry.date}`
        });
      }

      return {
        ...prev,
        lastModified: new Date().toISOString(),
        maintenanceLogs: updatedLogs,
        reminders: updatedReminders
      };
    });

    syncVehicleOdometer(currentVehicle.id, entry.odometer);
    showToast(entry.id ? 'Service record updated' : 'Maintenance record saved');
    setMaintModal({ open: false, editing: null });
  };

  const handleSaveExpenseLog = (logData) => {
    const entry = {
      ...logData,
      vehicleId: currentVehicle.id,
      odometer: logData.odometer ? Number(logData.odometer) : null,
      cost: Number(logData.cost) || 0,
    };

    if (entry.id) {
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        expenseLogs: prev.expenseLogs.map(l => (l.id === entry.id ? entry : l))
      }));
      showToast('Expense updated');
    } else {
      entry.id = generateId();
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        expenseLogs: [...prev.expenseLogs, entry]
      }));
      showToast('Expense logged');
    }
    if (entry.odometer) syncVehicleOdometer(currentVehicle.id, entry.odometer);
    setExpenseModal({ open: false, editing: null });
  };

  const handleSaveReminder = (remData) => {
    const entry = {
      ...remData,
      vehicleId: currentVehicle.id,
      lastOdometer: remData.lastOdometer ? Number(remData.lastOdometer) : currentVehicle.odometer,
      dueOdometer: remData.dueOdometer ? Number(remData.dueOdometer) : null,
    };

    if (entry.id) {
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        reminders: prev.reminders.map(r => (r.id === entry.id ? entry : r))
      }));
      showToast('Reminder updated');
    } else {
      entry.id = generateId();
      setDb(prev => ({
        ...prev,
        lastModified: new Date().toISOString(),
        reminders: [...prev.reminders, entry]
      }));
      showToast('Service reminder created');
    }
    setReminderModal({ open: false, editing: null });
  };

  const handleCompleteReminder = (rem) => {
    // Open maintenance modal pre-filled with this reminder and remove/advance reminder
    setMaintModal({
      open: true,
      editing: {
        date: new Date().toISOString().split('T')[0],
        odometer: currentVehicle.odometer,
        category: rem.category || 'Oil Change',
        title: rem.title.replace(/^Next:\s*/i, ''),
        partsReplaced: '',
        partsCost: 0,
        laborCost: 0,
        totalCost: 0,
        shopName: 'DIY Home Garage',
        isDiy: true,
        warranty: '',
        nextDueOdometer: rem.dueOdometer ? currentVehicle.odometer + (rem.dueOdometer - (rem.lastOdometer || currentVehicle.odometer)) : '',
        nextDueDate: '',
        notes: rem.notes || ''
      }
    });
    setDb(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== rem.id)
    }));
    showToast('Log the completed service below');
  };

  const deleteRecord = (collectionKey, id, label) => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: `Delete ${label}?`,
      message: 'This entry will be permanently removed from your active database.',
      onConfirm: () => {
        setDb(prev => ({
          ...prev,
          lastModified: new Date().toISOString(),
          [collectionKey]: prev[collectionKey].filter(item => item.id !== id)
        }));
        showToast(`${label} deleted`);
        setConfirmDialog({ open: false });
      }
    });
  };

  // ============================================================================
  // BACKUP, SNAPSHOTS & RESTORE POINT SYSTEM
  // ============================================================================

  const createSnapshot = (name, notes = '', type = 'Manual', targetDb = db) => {
    const serialized = JSON.stringify(targetDb);
    const snap = {
      id: generateId(),
      name: name || `Snapshot ${new Date().toLocaleString()}`,
      type,
      createdAt: new Date().toISOString(),
      vehicleCount: targetDb.vehicles.length,
      totalLogs: targetDb.fuelLogs.length + targetDb.maintenanceLogs.length + targetDb.expenseLogs.length,
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
      message: `Your current database will be replaced with this snapshot from ${new Date(snap.createdAt).toLocaleString()}. An automatic "Pre-Restore Safety Snapshot" of your current data will be saved first.`,
      onConfirm: () => {
        createSnapshot(
          `Auto Safety Backup (Before restoring "${snap.name}")`,
          'Automatically generated safety restore point.',
          'Auto-Safety',
          db
        );
        const restored = JSON.parse(JSON.stringify(snap.data));
        setDb({ ...restored, lastModified: new Date().toISOString() });
        if (restored.vehicles?.[0]) {
          setSelectedVehicleId(restored.vehicles[0].id);
        }
        setConfirmDialog({ open: false });
        setPreviewSnapshot(null);
        showToast(`Restored "${snap.name}" successfully!`);
      }
    });
  };

  const handleDeleteSnapshot = (snap) => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: `Delete Restore Point "${snap.name}"?`,
      message: 'This saved snapshot will be permanently removed from browser storage.',
      onConfirm: () => {
        setSnapshots(prev => prev.filter(s => s.id !== snap.id));
        setConfirmDialog({ open: false });
        showToast('Restore point deleted');
      }
    });
  };

  const handleExportJson = () => {
    const payload = {
      app: 'Vehicle Logs Pro',
      exportedAt: new Date().toISOString(),
      database: db,
      snapshots
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `VehicleLogsPro_Backup_${dateStamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Full JSON backup downloaded');
  };

  const handleExportCsv = (type) => {
    if (!currentVehicle) return;
    let rows = [];
    let filename = `${currentVehicle.year}_${currentVehicle.make}_${currentVehicle.model}_${type}.csv`.replace(/\s+/g, '_');

    if (type === 'fuel') {
      rows.push(['Date', 'Odometer', 'Trip Distance', 'Volume', 'Price/Unit', 'Total Cost', 'Grade', 'Station', 'Full Tank', 'Driving Type', 'MPG', 'L/100km', 'Notes']);
      enrichedVehicleFuelLogs.forEach(l => {
        rows.push([
          l.date, l.odometer, l.tripDist, l.volume, l.pricePerUnit, l.totalCost,
          l.grade, `"${(l.station || '').replace(/"/g, '""')}"`, l.fullTank ? 'Yes' : 'No',
          l.drivingType, l.mpg ? l.mpg.toFixed(2) : '', l.l100km ? l.l100km.toFixed(2) : '',
          `"${(l.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    } else if (type === 'maintenance') {
      rows.push(['Date', 'Odometer', 'Category', 'Title', 'Parts Replaced', 'Parts Cost', 'Labor Cost', 'Total Cost', 'Shop/DIY', 'Warranty', 'Next Due Odo', 'Next Due Date', 'Notes']);
      vehicleMaintLogs.forEach(l => {
        rows.push([
          l.date, l.odometer, l.category, `"${l.title.replace(/"/g, '""')}"`,
          `"${(l.partsReplaced || '').replace(/"/g, '""')}"`, l.partsCost, l.laborCost, l.totalCost,
          `"${(l.shopName || '').replace(/"/g, '""')}"`, `"${(l.warranty || '').replace(/"/g, '""')}"`,
          l.nextDueOdometer || '', l.nextDueDate || '', `"${(l.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    } else if (type === 'expenses') {
      rows.push(['Date', 'Odometer', 'Category', 'Title', 'Cost', 'Business Use', 'Notes']);
      vehicleExpenseLogs.forEach(l => {
        rows.push([
          l.date, l.odometer || '', l.category, `"${l.title.replace(/"/g, '""')}"`,
          l.cost, l.isBusiness ? 'Business' : 'Personal', `"${(l.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    }

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${type} CSV`);
  };

  const handleImportJson = (parsedJson, mode = 'overwrite') => {
    const incomingDb = parsedJson.database ? parsedJson.database : parsedJson;
    if (!incomingDb || !Array.isArray(incomingDb.vehicles)) {
      showToast('Invalid backup file format: Missing vehicles array.', 'error');
      return;
    }

    createSnapshot(
      'Auto Safety Backup (Before File Import)',
      'Saved automatically prior to importing JSON backup.',
      'Auto-Safety',
      db
    );

    if (mode === 'overwrite') {
      setDb({
        version: incomingDb.version || '1.0.0',
        lastModified: new Date().toISOString(),
        vehicles: incomingDb.vehicles || [],
        fuelLogs: incomingDb.fuelLogs || [],
        maintenanceLogs: incomingDb.maintenanceLogs || [],
        expenseLogs: incomingDb.expenseLogs || [],
        reminders: incomingDb.reminders || [],
      });
      if (Array.isArray(parsedJson.snapshots) && parsedJson.snapshots.length > 0) {
        setSnapshots(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const novel = parsedJson.snapshots.filter(s => !existingIds.has(s.id));
          return [...novel, ...prev];
        });
      }
      if (incomingDb.vehicles[0]) setSelectedVehicleId(incomingDb.vehicles[0].id);
      showToast(`Restored ${incomingDb.vehicles.length} vehicles from backup!`);
    } else {
      // Merge unique IDs
      setDb(prev => {
        const mergeById = (arr1, arr2 = []) => {
          const map = new Map(arr1.map(item => [item.id, item]));
          arr2.forEach(item => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          return Array.from(map.values());
        };
        return {
          ...prev,
          lastModified: new Date().toISOString(),
          vehicles: mergeById(prev.vehicles, incomingDb.vehicles),
          fuelLogs: mergeById(prev.fuelLogs, incomingDb.fuelLogs),
          maintenanceLogs: mergeById(prev.maintenanceLogs, incomingDb.maintenanceLogs),
          expenseLogs: mergeById(prev.expenseLogs, incomingDb.expenseLogs),
          reminders: mergeById(prev.reminders, incomingDb.reminders),
        };
      });
      showToast('Merged backup records into current fleet!');
    }
  };

  const handleClearSampleData = () => {
    setConfirmDialog({
      open: true,
      danger: true,
      title: 'Clear All Data & Start Fresh?',
      message: 'This will remove all sample vehicles, logs, and reminders so you can start with an empty garage. A safety snapshot will be created first just in case.',
      onConfirm: () => {
        createSnapshot('Safety Backup Before Reset', 'Created before clearing data.', 'Auto-Safety', db);
        const emptyDb = {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          vehicles: [],
          fuelLogs: [],
          maintenanceLogs: [],
          expenseLogs: [],
          reminders: []
        };
        setDb(emptyDb);
        setSelectedVehicleId('');
        setConfirmDialog({ open: false });
        setVehicleModal({ open: true, editing: null });
        showToast('Garage cleared. Add your first vehicle!');
      }
    });
  };

  const handleResetToSampleData = () => {
    setConfirmDialog({
      open: true,
      danger: false,
      title: 'Load Demo Fleet Data?',
      message: 'This will load the 3 sample vehicles (Toyota RAV4 Hybrid, Ford F-250 PowerStroke, Yamaha MT-09 SP) with full service histories.',
      onConfirm: () => {
        const sample = createSampleDatabase();
        setDb(sample);
        setSelectedVehicleId(sample.vehicles[0].id);
        setConfirmDialog({ open: false });
        showToast('Demo fleet loaded');
      }
    });
  };

  // ============================================================================
  // THEME CLASSES HELPER
  // ============================================================================

  const t = {
    bg: darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
    sidebar: darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200',
    card: darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    cardSub: darkMode ? 'bg-slate-800/60 border-slate-700/70' : 'bg-slate-100/80 border-slate-200',
    input: darkMode
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-blue-600/20',
    muted: darkMode ? 'text-slate-400' : 'text-slate-500',
    border: darkMode ? 'border-slate-800' : 'border-slate-200',
    hover: darkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100',
  };

  const navItems = [
    { id: 'dashboard', label: 'Vehicle Overview', icon: Gauge },
    { id: 'fuel', label: 'Fuel & Efficiency', icon: Fuel, count: enrichedVehicleFuelLogs.length },
    { id: 'maintenance', label: 'Maintenance & Parts', icon: Wrench, count: vehicleMaintLogs.length },
    { id: 'expenses', label: 'Expenses & Trips', icon: Receipt, count: vehicleExpenseLogs.length },
    { id: 'reminders', label: 'Service Reminders', icon: Bell, alert: vehicleStats?.dueCount || 0 },
    { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'specs', label: 'Specs & Part Numbers', icon: Settings },
    { id: 'fleet', label: 'All Vehicles Fleet', icon: Layers, count: db.vehicles.length },
    { id: 'backups', label: 'Backups & Restore', icon: ShieldCheck, count: snapshots.length },
  ];

  const getVehicleIcon = (type) => {
    const found = VEHICLE_TYPES.find(vt => vt.id === type);
    const IconComp = found ? found.icon : Car;
    return <IconComp className="w-5 h-5" />;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 ${t.bg}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-bounce bg-slate-900/95 border-blue-500/50 text-white">
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r ${t.sidebar} flex flex-col justify-between z-20`}>
        <div>
          {/* Brand Header */}
          <div className={`p-4 lg:p-5 border-b ${t.border} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight">Vehicle Logs</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/30">
                    Pro
                  </span>
                </div>
                <p className={`text-xs ${t.muted}`}>Fleet & Service Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border ${t.border} ${t.hover} transition`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          {/* Active Vehicle Switcher Card */}
          <div className={`p-4 border-b ${t.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.muted}`}>
                Active Vehicle ({activeVehicles.length})
              </span>
              <button
                onClick={() => setVehicleModal({ open: true, editing: null })}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Vehicle
              </button>
            </div>

            {activeVehicles.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={currentVehicle?.id || ''}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold border outline-none transition ${t.input}`}
                >
                  {activeVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} {v.nickname ? `(${v.nickname})` : ''}
                    </option>
                  ))}
                </select>

                {currentVehicle && (
                  <div className={`p-3 rounded-xl border ${t.cardSub} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/15 text-blue-500 shrink-0">
                        {getVehicleIcon(currentVehicle.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {currentVehicle.licensePlate || 'No Plate'} • {currentVehicle.trim || currentVehicle.model}
                        </div>
                        <div className={`text-xs font-mono ${t.muted}`}>
                          {formatNumber(currentVehicle.odometer)} {currentVehicle.unit}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setVehicleModal({ open: true, editing: currentVehicle })}
                      className={`p-1.5 rounded-lg ${t.hover} ${t.muted}`}
                      title="Edit Vehicle Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setVehicleModal({ open: true, editing: null })}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-blue-500/40 text-blue-500 text-sm font-semibold hover:bg-blue-500/10 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Your First Vehicle
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : `${t.muted} ${t.hover}`
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.alert > 0 && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-blue-600' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {item.alert}
                    </span>
                  )}
                  {!item.alert && item.count !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-blue-500 text-white' : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Quick Backup */}
        <div className={`hidden lg:block p-4 border-t ${t.border}`}>
          <div className={`p-3 rounded-xl border ${t.cardSub} space-y-2.5`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Data Protection
              </span>
              <span className={`text-[11px] ${t.muted}`}>{snapshots.length} Snapshots</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSnapshotModal({ open: true })}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Snapshot
              </button>
              <button
                onClick={handleExportJson}
                className={`px-2.5 py-1.5 rounded-lg border ${t.border} ${t.hover} text-xs font-semibold transition flex items-center justify-center gap-1`}
              >
                <Download className="w-3.5 h-3.5" /> .JSON
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Action Bar */}
        <header className={`sticky top-0 z-10 backdrop-blur-md border-b ${t.border} ${darkMode ? 'bg-slate-950/85' : 'bg-slate-50/85'} px-4 sm:px-6 py-3.5`}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                {navItems.find(n => n.id === activeTab)?.label}
                {currentVehicle && !['fleet', 'backups'].includes(activeTab) && (
                  <span className={`text-xs font-normal px-2.5 py-0.5 rounded-full border ${t.cardSub}`}>
                    {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
                  </span>
                )}
              </h1>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {currentVehicle && (
                <>
                  <button
                    onClick={() => setFuelModal({ open: true, editing: null })}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Fuel className="w-4 h-4" /> Log Fuel
                  </button>
                  <button
                    onClick={() => setMaintModal({ open: true, editing: null })}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Wrench className="w-4 h-4" /> Log Service
                  </button>
                  <button
                    onClick={() => setExpenseModal({ open: true, editing: null })}
                    className={`px-3 py-2 rounded-xl border ${t.border} ${t.hover} text-xs sm:text-sm font-semibold transition flex items-center gap-1.5`}
                  >
                    <Receipt className="w-4 h-4" /> Log Expense
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('backups')}
                className={`px-3 py-2 rounded-xl border ${t.border} ${t.hover} text-xs sm:text-sm font-semibold transition flex items-center gap-1.5`}
                title="Manage Restore Points & JSON Backups"
              >
                <History className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Restore Points</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Empty State if no vehicle exists */}
          {!currentVehicle && !['fleet', 'backups'].includes(activeTab) ? (
            <div className={`rounded-2xl border p-10 text-center space-y-4 ${t.card}`}>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mx-auto">
                <Car className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Your Garage is Empty</h2>
              <p className={`max-w-md mx-auto text-sm ${t.muted}`}>
                Add your first vehicle with detailed specifications, part numbers, and odometer tracking—or restore from a backup.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => setVehicleModal({ open: true, editing: null })}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Vehicle
                </button>
                <button
                  onClick={handleResetToSampleData}
                  className={`px-5 py-2.5 rounded-xl border ${t.border} ${t.hover} text-sm font-semibold flex items-center gap-2`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> Load Demo Fleet
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: VEHICLE OVERVIEW DASHBOARD */}
              {activeTab === 'dashboard' && currentVehicle && vehicleStats && (
                <DashboardView
                  vehicle={currentVehicle}
                  stats={vehicleStats}
                  fuelLogs={enrichedVehicleFuelLogs}
                  maintLogs={vehicleMaintLogs}
                  expenseLogs={vehicleExpenseLogs}
                  reminders={vehicleReminders}
                  onNavigate={setActiveTab}
                  onCompleteReminder={handleCompleteReminder}
                  onEditVehicle={() => setVehicleModal({ open: true, editing: currentVehicle })}
                  t={t}
                  darkMode={darkMode}
                />
              )}

              {/* TAB 2: FUEL & EFFICIENCY */}
              {activeTab === 'fuel' && currentVehicle && (
                <FuelLogsView
                  vehicle={currentVehicle}
                  logs={enrichedVehicleFuelLogs}
                  onAdd={() => setFuelModal({ open: true, editing: null })}
                  onEdit={(log) => setFuelModal({ open: true, editing: log })}
                  onDelete={(id) => deleteRecord('fuelLogs', id, 'Fuel Log')}
                  onExportCsv={() => handleExportCsv('fuel')}
                  t={t}
                />
              )}

              {/* TAB 3: MAINTENANCE & PARTS */}
              {activeTab === 'maintenance' && currentVehicle && (
                <MaintenanceLogsView
                  vehicle={currentVehicle}
                  logs={vehicleMaintLogs}
                  onAdd={() => setMaintModal({ open: true, editing: null })}
                  onEdit={(log) => setMaintModal({ open: true, editing: log })}
                  onDelete={(id) => deleteRecord('maintenanceLogs', id, 'Maintenance Record')}
                  onExportCsv={() => handleExportCsv('maintenance')}
                  t={t}
                />
              )}

              {/* TAB 4: EXPENSES & TRIPS */}
              {activeTab === 'expenses' && currentVehicle && (
                <ExpenseLogsView
                  vehicle={currentVehicle}
                  logs={vehicleExpenseLogs}
                  onAdd={() => setExpenseModal({ open: true, editing: null })}
                  onEdit={(log) => setExpenseModal({ open: true, editing: log })}
                  onDelete={(id) => deleteRecord('expenseLogs', id, 'Expense Log')}
                  onExportCsv={() => handleExportCsv('expenses')}
                  t={t}
                />
              )}

              {/* TAB 5: REMINDERS */}
              {activeTab === 'reminders' && currentVehicle && (
                <RemindersView
                  vehicle={currentVehicle}
                  reminders={vehicleReminders}
                  onAdd={() => setReminderModal({ open: true, editing: null })}
                  onEdit={(rem) => setReminderModal({ open: true, editing: rem })}
                  onComplete={handleCompleteReminder}
                  onDelete={(id) => deleteRecord('reminders', id, 'Reminder')}
                  t={t}
                />
              )}

              {/* TAB 6: ANALYTICS & CHARTS */}
              {activeTab === 'analytics' && currentVehicle && vehicleStats && (
                <AnalyticsView
                  vehicle={currentVehicle}
                  stats={vehicleStats}
                  fuelLogs={enrichedVehicleFuelLogs}
                  maintLogs={vehicleMaintLogs}
                  expenseLogs={vehicleExpenseLogs}
                  t={t}
                  darkMode={darkMode}
                />
              )}

              {/* TAB 7: SPECS & PART NUMBERS */}
              {activeTab === 'specs' && currentVehicle && (
                <SpecsView
                  vehicle={currentVehicle}
                  onEdit={() => setVehicleModal({ open: true, editing: currentVehicle })}
                  showToast={showToast}
                  t={t}
                />
              )}

              {/* TAB 8: ALL VEHICLES FLEET OVERVIEW */}
              {activeTab === 'fleet' && (
                <FleetOverviewView
                  db={db}
                  fleetStats={fleetStats}
                  selectedVehicleId={currentVehicle?.id}
                  showArchived={showArchived}
                  onToggleShowArchived={() => setShowArchived(!showArchived)}
                  onSelectVehicle={(id) => {
                    setSelectedVehicleId(id);
                    setActiveTab('dashboard');
                  }}
                  onAddVehicle={() => setVehicleModal({ open: true, editing: null })}
                  onEditVehicle={(v) => setVehicleModal({ open: true, editing: v })}
                  onArchiveVehicle={handleToggleArchiveVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onClearSampleData={handleClearSampleData}
                  onResetSampleData={handleResetToSampleData}
                  t={t}
                />
              )}

              {/* TAB 9: BACKUPS & RESTORE POINTS */}
              {activeTab === 'backups' && (
                <BackupRestoreView
                  db={db}
                  snapshots={snapshots}
                  onOpenCreateSnapshot={() => setSnapshotModal({ open: true })}
                  onRestoreSnapshot={handleRestoreSnapshot}
                  onDeleteSnapshot={handleDeleteSnapshot}
                  onPreviewSnapshot={setPreviewSnapshot}
                  onExportJson={handleExportJson}
                  onImportJson={handleImportJson}
                  onClearSampleData={handleClearSampleData}
                  onResetSampleData={handleResetToSampleData}
                  showToast={showToast}
                  t={t}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODALS */}
      {/* ==================================================================== */}

      {vehicleModal.open && (
        <VehicleFormModal
          initial={vehicleModal.editing}
          onClose={() => setVehicleModal({ open: false, editing: null })}
          onSave={handleSaveVehicle}
          t={t}
          darkMode={darkMode}
        />
      )}

      {fuelModal.open && currentVehicle && (
        <FuelFormModal
          vehicle={currentVehicle}
          initial={fuelModal.editing}
          onClose={() => setFuelModal({ open: false, editing: null })}
          onSave={handleSaveFuelLog}
          t={t}
          darkMode={darkMode}
        />
      )}

      {maintModal.open && currentVehicle && (
        <MaintenanceFormModal
          vehicle={currentVehicle}
          initial={maintModal.editing}
          onClose={() => setMaintModal({ open: false, editing: null })}
          onSave={handleSaveMaintLog}
          t={t}
          darkMode={darkMode}
        />
      )}

      {expenseModal.open && currentVehicle && (
        <ExpenseFormModal
          vehicle={currentVehicle}
          initial={expenseModal.editing}
          onClose={() => setExpenseModal({ open: false, editing: null })}
          onSave={handleSaveExpenseLog}
          t={t}
          darkMode={darkMode}
        />
      )}

      {reminderModal.open && currentVehicle && (
        <ReminderFormModal
          vehicle={currentVehicle}
          initial={reminderModal.editing}
          onClose={() => setReminderModal({ open: false, editing: null })}
          onSave={handleSaveReminder}
          t={t}
          darkMode={darkMode}
        />
      )}

      {snapshotModal.open && (
        <CreateSnapshotModal
          db={db}
          onClose={() => setSnapshotModal({ open: false })}
          onCreate={(name, notes) => {
            createSnapshot(name, notes, 'Manual', db);
            setSnapshotModal({ open: false });
            showToast(`Restore point "${name}" saved!`);
          }}
          t={t}
          darkMode={darkMode}
        />
      )}

      {previewSnapshot && (
        <PreviewSnapshotModal
          snapshot={previewSnapshot}
          onClose={() => setPreviewSnapshot(null)}
          onRestore={() => handleRestoreSnapshot(previewSnapshot)}
          t={t}
          darkMode={darkMode}
        />
      )}

      {confirmDialog.open && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          danger={confirmDialog.danger}
          onCancel={() => setConfirmDialog({ open: false })}
          onConfirm={confirmDialog.onConfirm}
          t={t}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// ============================================================================
// VIEW 1: VEHICLE OVERVIEW DASHBOARD
// ============================================================================

function DashboardView({
  vehicle, stats, fuelLogs, maintLogs, expenseLogs, reminders,
  onNavigate, onCompleteReminder, onEditVehicle, t, darkMode
}) {
  const effDisplay = vehicle.unit === 'mi'
    ? (stats.avgMpg > 0 ? `${stats.avgMpg.toFixed(1)} MPG` : '—')
    : (stats.avgL100 > 0 ? `${stats.avgL100.toFixed(1)} L/100km` : '—');

  const recentActivity = useMemo(() => {
    const combined = [
      ...fuelLogs.map(f => ({
        id: f.id, type: 'Fuel', date: f.date, odo: f.odometer,
        title: `${f.volume} ${vehicle.unit === 'mi' ? 'gal' : 'L'} • ${f.station || f.grade}`,
        cost: f.totalCost, badgeColor: 'bg-blue-500/15 text-blue-500'
      })),
      ...maintLogs.map(m => ({
        id: m.id, type: 'Service', date: m.date, odo: m.odometer,
        title: m.title,
        cost: m.totalCost, badgeColor: 'bg-indigo-500/15 text-indigo-500'
      })),
      ...expenseLogs.map(e => ({
        id: e.id, type: 'Expense', date: e.date, odo: e.odometer,
        title: `${e.category}: ${e.title}`,
        cost: e.cost, badgeColor: 'bg-amber-500/15 text-amber-500'
      }))
    ];
    return combined.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [fuelLogs, maintLogs, expenseLogs, vehicle.unit]);

  return (
    <div className="space-y-6">
      {/* Vehicle Hero Banner */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${t.card} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-600 text-white">
                {vehicle.year}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {vehicle.make} {vehicle.model} {vehicle.trim}
              </h2>
              {vehicle.nickname && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${t.cardSub}`}>
                  “{vehicle.nickname}”
                </span>
              )}
            </div>
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm ${t.muted}`}>
              <span>VIN: <strong className="font-mono">{vehicle.vin || 'Not recorded'}</strong></span>
              <span>Plate: <strong>{vehicle.licensePlate || '—'}</strong> ({vehicle.region || '—'})</span>
              <span>Color: <strong>{vehicle.color || '—'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2.5 rounded-xl border ${t.cardSub} text-right`}>
              <div className={`text-[11px] uppercase font-semibold tracking-wider ${t.muted}`}>Current Odometer</div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-blue-500">
                {formatNumber(vehicle.odometer)} <span className="text-sm font-sans font-semibold">{vehicle.unit}</span>
              </div>
            </div>
            <button
              onClick={onEditVehicle}
              className={`p-3 rounded-xl border ${t.border} ${t.hover} transition`}
              title="Edit Vehicle Profile"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Spec Strip */}
        <div className={`mt-5 pt-4 border-t ${t.border} grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs`}>
          <div>
            <span className={t.muted}>Oil Spec:</span>
            <div className="font-semibold truncate">{vehicle.oilType || '—'}</div>
          </div>
          <div>
            <span className={t.muted}>Oil Filter:</span>
            <div className="font-mono font-semibold truncate">{vehicle.oilFilterPart || '—'}</div>
          </div>
          <div>
            <span className={t.muted}>Tire Size & PSI:</span>
            <div className="font-semibold truncate">{vehicle.tireSize || '—'} ({vehicle.tirePsi || '—'})</div>
          </div>
          <div>
            <span className={t.muted}>Registration Exp:</span>
            <div className="font-semibold">{formatDate(vehicle.registrationExpiry)}</div>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>Avg Fuel Economy</span>
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500"><Droplets className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-extrabold">{effDisplay}</div>
          <div className={`mt-1 text-xs ${t.muted}`}>
            {vehicle.unit === 'mi'
              ? (stats.avgL100 > 0 ? `${stats.avgL100.toFixed(1)} L/100km` : 'Log 2+ full tanks')
              : (stats.avgMpg > 0 ? `${stats.avgMpg.toFixed(1)} US MPG` : 'Log 2+ full tanks')}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>Total Tracked Spend</span>
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-500"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-extrabold">{formatCurrency(stats.totalSpend)}</div>
          <div className={`mt-1 text-xs ${t.muted}`}>
            Fuel {formatCurrency(stats.fuelSpend)} • Service {formatCurrency(stats.maintSpend)}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>Operating Cost / {vehicle.unit}</span>
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-500"><Gauge className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-extrabold">
            {stats.costPerUnitDist > 0 ? `$${stats.costPerUnitDist.toFixed(2)}` : '—'}
            <span className={`text-xs font-normal ${t.muted}`}> /{vehicle.unit}</span>
          </div>
          <div className={`mt-1 text-xs ${t.muted}`}>
            Across {formatNumber(stats.totalTrackedDist)} tracked {vehicle.unit}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>Service Reminders</span>
            <div className={`p-2 rounded-lg ${stats.dueCount > 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-500/15 text-slate-400'}`}>
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold">
            {stats.dueCount > 0 ? `${stats.dueCount} Action Needed` : 'All Up to Date'}
          </div>
          <div className={`mt-1 text-xs ${t.muted}`}>
            {reminders.length} active schedule items
          </div>
        </div>
      </div>

      {/* Two-Column Activity & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Maintenance Reminders */}
        <div className={`lg:col-span-5 rounded-2xl border p-5 ${t.card} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" /> Maintenance Schedule
              </h3>
              <button
                onClick={() => onNavigate('reminders')}
                className="text-xs font-semibold text-blue-500 hover:underline"
              >
                View All
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className={`text-sm py-8 text-center ${t.muted}`}>No maintenance reminders configured yet.</p>
            ) : (
              <div className="space-y-3">
                {reminders.slice(0, 4).map(rem => (
                  <div key={rem.id} className={`p-3.5 rounded-xl border ${t.cardSub} space-y-2`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold">{rem.title}</div>
                        <div className={`text-xs ${t.muted}`}>
                          {rem.dueOdometer ? `Due at ${formatNumber(rem.dueOdometer)} ${vehicle.unit}` : ''}
                          {rem.dueOdometer && rem.dueDate ? ' • ' : ''}
                          {rem.dueDate ? `By ${formatDate(rem.dueDate)}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={rem.overallStatus} />
                    </div>

                    {rem.dueOdometer && (
                      <div className="w-full h-1.5 rounded-full bg-slate-700/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rem.overallStatus === 'overdue' ? 'bg-rose-500'
                              : rem.overallStatus === 'due_soon' ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${rem.odoProgress}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[11px] font-medium ${t.muted}`}>
                        {rem.odoRemaining !== null
                          ? (rem.odoRemaining <= 0
                            ? `${formatNumber(Math.abs(rem.odoRemaining))} ${vehicle.unit} overdue`
                            : `${formatNumber(rem.odoRemaining)} ${vehicle.unit} remaining`)
                          : ''}
                      </span>
                      <button
                        onClick={() => onCompleteReminder(rem)}
                        className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Log Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Vehicle History */}
        <div className={`lg:col-span-7 rounded-2xl border p-5 ${t.card}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" /> Recent Vehicle Activity
            </h3>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-blue-500 hover:underline"
            >
              Cost Breakdown
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <p className={`text-sm py-8 text-center ${t.muted}`}>No logs recorded for this vehicle yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {recentActivity.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${item.badgeColor}`}>
                      {item.type}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div className={`text-xs ${t.muted}`}>
                        {formatDate(item.date)} {item.odo ? `• ${formatNumber(item.odo)} ${vehicle.unit}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-mono font-bold shrink-0">
                    {formatCurrency(item.cost)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 2: FUEL & EFFICIENCY LOGS
// ============================================================================

function FuelLogsView({ vehicle, logs, onAdd, onEdit, onDelete, onExportCsv, t }) {
  const [search, setSearch] = useState('');
  const [driveFilter, setDriveFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchesDrive = driveFilter === 'ALL' || l.drivingType === driveFilter;
      const q = search.toLowerCase();
      const matchesQuery = !q ||
        (l.station || '').toLowerCase().includes(q) ||
        (l.grade || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q);
      return matchesDrive && matchesQuery;
    });
  }, [logs, search, driveFilter]);

  const volUnit = vehicle.unit === 'mi' ? 'gal' : 'L';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`rounded-2xl border p-4 ${t.card} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${t.muted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station, octane, notes..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none ${t.input}`}
            />
          </div>
          <select
            value={driveFilter}
            onChange={(e) => setDriveFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm outline-none ${t.input}`}
          >
            <option value="ALL">All Driving Types</option>
            <option value="City">City</option>
            <option value="Highway">Highway</option>
            <option value="Mixed">Mixed</option>
            <option value="Towing">Towing / Hauling</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className={`px-3 py-2 rounded-xl border ${t.border} ${t.hover} text-xs font-semibold flex items-center gap-1.5`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Fill-Up
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${t.border} text-[11px] uppercase tracking-wider ${t.muted}`}>
                <th className="py-3.5 px-4">Date & Odometer</th>
                <th className="py-3.5 px-4">Trip</th>
                <th className="py-3.5 px-4">Volume & Price</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Efficiency</th>
                <th className="py-3.5 px-4">Station & Grade</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-10 text-center ${t.muted}`}>
                    No fuel logs match your criteria. Click "Add Fill-Up" to record one.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className={`${t.hover} transition`}>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold">{formatDate(log.date)}</div>
                      <div className={`text-xs font-mono ${t.muted}`}>{formatNumber(log.odometer)} {vehicle.unit}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                      {log.tripDist > 0 ? `+${formatNumber(log.tripDist)} ${vehicle.unit}` : 'Initial'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold">{log.volume.toFixed(2)} {volUnit}</div>
                      <div className={`text-xs ${t.muted}`}>{formatCurrency(log.pricePerUnit)}/{volUnit}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                      {formatCurrency(log.totalCost)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.mpg !== null ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-500">
                            {vehicle.unit === 'mi'
                              ? `${log.mpg.toFixed(1)} MPG`
                              : `${log.l100km.toFixed(1)} L/100km`}
                          </span>
                          <div className={`text-[11px] mt-0.5 ${t.muted}`}>
                            {vehicle.unit === 'mi'
                              ? `${log.l100km.toFixed(1)} L/100km`
                              : `${log.mpg.toFixed(1)} MPG`}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-xs ${t.muted}`}>
                          {log.fullTank ? 'Baseline fill' : 'Partial fill'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-xs">{log.station || '—'}</div>
                      <div className={`text-xs ${t.muted}`}>
                        {log.grade} • <span className="text-blue-400">{log.drivingType}</span>
                      </div>
                      {log.notes && <div className={`text-[11px] italic truncate max-w-[200px] ${t.muted}`}>{log.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onEdit(log)}
                        className={`p-1.5 rounded-lg ${t.hover} text-blue-500`}
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(log.id)}
                        className={`p-1.5 rounded-lg ${t.hover} text-rose-500 ml-1`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 3: MAINTENANCE & PARTS LOGS
// ============================================================================

function MaintenanceLogsView({ vehicle, logs, onAdd, onEdit, onDelete, onExportCsv, t }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchesCat = catFilter === 'ALL' || l.category === catFilter;
      const q = search.toLowerCase();
      const matchesQuery = !q ||
        l.title.toLowerCase().includes(q) ||
        (l.partsReplaced || '').toLowerCase().includes(q) ||
        (l.shopName || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [logs, search, catFilter]);

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${t.card} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${t.muted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service, part numbers, shop..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none ${t.input}`}
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm outline-none ${t.input}`}
          >
            <option value="ALL">All Service Categories</option>
            {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className={`px-3 py-2 rounded-xl border ${t.border} ${t.hover} text-xs font-semibold flex items-center gap-1.5`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log Service
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center ${t.card} ${t.muted}`}>
            No maintenance records found. Track oil changes, part numbers, warranties, and DIY work here.
          </div>
        ) : (
          filtered.map(log => (
            <div key={log.id} className={`rounded-2xl border p-5 ${t.card} transition`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/15 text-indigo-400">
                      {log.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      log.isDiy ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      {log.isDiy ? 'DIY Service' : log.shopName || 'Shop Service'}
                    </span>
                    <span className={`text-xs ${t.muted}`}>
                      {formatDate(log.date)} • <strong className="font-mono">{formatNumber(log.odometer)} {vehicle.unit}</strong>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold">{log.title}</h3>

                  {log.partsReplaced && (
                    <div className={`p-3 rounded-xl border ${t.cardSub} text-xs`}>
                      <span className={`font-semibold uppercase tracking-wider block mb-0.5 ${t.muted}`}>
                        Parts & Fluids Installed:
                      </span>
                      <span className="font-mono">{log.partsReplaced}</span>
                    </div>
                  )}

                  {log.notes && (
                    <p className={`text-xs sm:text-sm ${t.muted}`}>{log.notes}</p>
                  )}

                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1 ${t.muted}`}>
                    {log.warranty && <span>Warranty: <strong>{log.warranty}</strong></span>}
                    {log.nextDueOdometer && (
                      <span>Next Due Odo: <strong className="font-mono">{formatNumber(log.nextDueOdometer)} {vehicle.unit}</strong></span>
                    )}
                    {log.nextDueDate && <span>Next Due Date: <strong>{formatDate(log.nextDueDate)}</strong></span>}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-mono font-extrabold">{formatCurrency(log.totalCost)}</div>
                    <div className={`text-[11px] ${t.muted}`}>
                      Parts {formatCurrency(log.partsCost)} • Labor {formatCurrency(log.laborCost)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(log)}
                      className={`p-2 rounded-lg border ${t.border} ${t.hover} text-blue-500`}
                      title="Edit Service"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(log.id)}
                      className={`p-2 rounded-lg border ${t.border} ${t.hover} text-rose-500`}
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 4: EXPENSES & TRIPS
// ============================================================================

function ExpenseLogsView({ vehicle, logs, onAdd, onEdit, onDelete, onExportCsv, t }) {
  const [filterBiz, setFilterBiz] = useState('ALL');

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterBiz === 'BUSINESS') return l.isBusiness;
      if (filterBiz === 'PERSONAL') return !l.isBusiness;
      return true;
    });
  }, [logs, filterBiz]);

  const totalBiz = logs.filter(l => l.isBusiness).reduce((s, l) => s + Number(l.cost || 0), 0);
  const totalPers = logs.filter(l => !l.isBusiness).reduce((s, l) => s + Number(l.cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-4 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Total Other Expenses</div>
          <div className="text-xl font-extrabold mt-1">{formatCurrency(totalBiz + totalPers)}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Business / Tax Deductible</div>
          <div className="text-xl font-extrabold mt-1 text-emerald-500">{formatCurrency(totalBiz)}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Personal Expenses</div>
          <div className="text-xl font-extrabold mt-1">{formatCurrency(totalPers)}</div>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${t.card} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          {['ALL', 'BUSINESS', 'PERSONAL'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterBiz(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterBiz === mode ? 'bg-blue-600 text-white' : `${t.cardSub} ${t.muted}`
              }`}
            >
              {mode === 'ALL' ? 'All Records' : mode === 'BUSINESS' ? 'Business Tagged' : 'Personal'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className={`px-3 py-2 rounded-xl border ${t.border} ${t.hover} text-xs font-semibold flex items-center gap-1.5`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Expense / Trip
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${t.border} text-[11px] uppercase tracking-wider ${t.muted}`}>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category & Description</th>
                <th className="py-3.5 px-4">Odometer</th>
                <th className="py-3.5 px-4">Tag</th>
                <th className="py-3.5 px-4">Cost</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-10 text-center ${t.muted}`}>No expenses recorded yet.</td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className={t.hover}>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium">{formatDate(log.date)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold">{log.title}</div>
                      <div className={`text-xs ${t.muted}`}>{log.category} {log.notes ? `• ${log.notes}` : ''}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                      {log.odometer ? `${formatNumber(log.odometer)} ${vehicle.unit}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        log.isBusiness ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        {log.isBusiness ? 'Business' : 'Personal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">{formatCurrency(log.cost)}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button onClick={() => onEdit(log)} className={`p-1.5 rounded-lg ${t.hover} text-blue-500`}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(log.id)} className={`p-1.5 rounded-lg ${t.hover} text-rose-500 ml-1`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 5: SERVICE REMINDERS
// ============================================================================

function RemindersView({ vehicle, reminders, onAdd, onEdit, onComplete, onDelete, t }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${t.card} flex items-center justify-between`}>
        <div>
          <h3 className="font-bold">Maintenance Intervals & Alerts</h3>
          <p className={`text-xs ${t.muted}`}>
            Current Odometer: <strong className="font-mono">{formatNumber(vehicle.odometer)} {vehicle.unit}</strong>
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {reminders.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${t.card} ${t.muted}`}>
          No active maintenance reminders. Create one for oil changes, tire rotations, inspections, or fluid flushes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map(rem => (
            <div key={rem.id} className={`rounded-2xl border p-5 ${t.card} flex flex-col justify-between space-y-4`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">{rem.category}</span>
                    <h4 className="text-base font-bold mt-0.5">{rem.title}</h4>
                  </div>
                  <StatusBadge status={rem.overallStatus} />
                </div>

                {rem.dueOdometer && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className={t.muted}>Target: {formatNumber(rem.dueOdometer)} {vehicle.unit}</span>
                      <span className="font-mono font-semibold">
                        {rem.odoRemaining <= 0
                          ? `Overdue by ${formatNumber(Math.abs(rem.odoRemaining))} ${vehicle.unit}`
                          : `${formatNumber(rem.odoRemaining)} ${vehicle.unit} left`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-700/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          rem.overallStatus === 'overdue' ? 'bg-rose-500'
                            : rem.overallStatus === 'due_soon' ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${rem.odoProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {rem.dueDate && (
                  <div className={`text-xs flex items-center gap-1.5 pt-1 ${t.muted}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    Due Date: <strong>{formatDate(rem.dueDate)}</strong>
                    {rem.daysRemaining !== null && (
                      <span>({rem.daysRemaining <= 0 ? `${Math.abs(rem.daysRemaining)} days overdue` : `in ${rem.daysRemaining} days`})</span>
                    )}
                  </div>
                )}

                {rem.notes && <p className={`text-xs ${t.muted}`}>{rem.notes}</p>}
              </div>

              <div className={`pt-3 border-t ${t.border} flex items-center justify-between`}>
                <button
                  onClick={() => onComplete(rem)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete & Log Service
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(rem)} className={`p-1.5 rounded-lg ${t.hover} text-blue-500`}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(rem.id)} className={`p-1.5 rounded-lg ${t.hover} text-rose-500`}>
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
// VIEW 6: ANALYTICS & INTERACTIVE SVG CHARTS
// ============================================================================

function AnalyticsView({ vehicle, stats, fuelLogs, maintLogs, expenseLogs, t, darkMode }) {
  const chronologicalEffLogs = useMemo(() => {
    return [...fuelLogs].reverse().filter(l => l.mpg !== null);
  }, [fuelLogs]);

  const total = Math.max(1, stats.totalSpend);
  const fuelPct = (stats.fuelSpend / total) * 100;
  const maintPct = (stats.maintSpend / total) * 100;
  const expPct = (stats.expSpend / total) * 100;

  return (
    <div className="space-y-6">
      {/* Spend Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-5 rounded-2xl border p-6 ${t.card} flex flex-col justify-between`}>
          <div>
            <h3 className="font-bold text-base mb-1">Total Ownership Cost Split</h3>
            <p className={`text-xs mb-5 ${t.muted}`}>Cumulative tracked expenses for this vehicle</p>

            <div className="text-3xl font-extrabold mb-4">{formatCurrency(stats.totalSpend)}</div>

            {/* Stacked Horizontal Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-800/40 mb-6">
              <div style={{ width: `${fuelPct}%` }} className="bg-blue-500" title="Fuel" />
              <div style={{ width: `${maintPct}%` }} className="bg-indigo-500" title="Maintenance" />
              <div style={{ width: `${expPct}%` }} className="bg-amber-500" title="Other Expenses" />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" /> Fuel & Energy
                </span>
                <span className="font-mono font-bold">{formatCurrency(stats.fuelSpend)} ({fuelPct.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" /> Maintenance & Repairs
                </span>
                <span className="font-mono font-bold">{formatCurrency(stats.maintSpend)} ({maintPct.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> Insurance, Mods & Trips
                </span>
                <span className="font-mono font-bold">{formatCurrency(stats.expSpend)} ({expPct.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t ${t.border} flex justify-between text-xs ${t.muted}`}>
            <span>Purchase Price: <strong>{formatCurrency(vehicle.purchasePrice)}</strong></span>
            <span>All-In Total: <strong>{formatCurrency((Number(vehicle.purchasePrice) || 0) + stats.totalSpend)}</strong></span>
          </div>
        </div>

        {/* Fuel Efficiency Trend SVG Chart */}
        <div className={`lg:col-span-7 rounded-2xl border p-6 ${t.card}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">
                Fuel Economy Trend ({vehicle.unit === 'mi' ? 'MPG' : 'L/100km'})
              </h3>
              <p className={`text-xs ${t.muted}`}>
                {vehicle.unit === 'mi' ? 'Higher is better' : 'Lower is better'} • Full-tank fill-ups
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500">
                Avg: {vehicle.unit === 'mi' ? `${stats.avgMpg.toFixed(1)} MPG` : `${stats.avgL100.toFixed(1)} L/100km`}
              </span>
            </div>
          </div>

          {chronologicalEffLogs.length < 2 ? (
            <div className={`h-56 flex items-center justify-center text-sm ${t.muted}`}>
              Log at least 3 full-tank fill-ups to render the efficiency trend line.
            </div>
          ) : (
            <EfficiencySvgChart
              logs={chronologicalEffLogs}
              unit={vehicle.unit}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>

      {/* Fuel Price Per Unit Trend */}
      <div className={`rounded-2xl border p-6 ${t.card}`}>
        <h3 className="font-bold text-base mb-1">Fuel Price History ($ / {vehicle.unit === 'mi' ? 'Gallon' : 'Liter'})</h3>
        <p className={`text-xs mb-4 ${t.muted}`}>Pump price fluctuations across logged fill-ups</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[...fuelLogs].reverse().slice(-5).map(log => (
            <div key={log.id} className={`p-3.5 rounded-xl border ${t.cardSub}`}>
              <div className={`text-xs ${t.muted}`}>{formatDate(log.date)}</div>
              <div className="text-lg font-mono font-extrabold mt-1">{formatCurrency(log.pricePerUnit)}</div>
              <div className={`text-[11px] truncate ${t.muted}`}>{log.station || log.grade}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EfficiencySvgChart({ logs, unit, darkMode }) {
  const values = logs.map(l => (unit === 'mi' ? l.mpg : l.l100km));
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const range = Math.max(0.1, maxVal - minVal);

  const width = 600;
  const height = 210;
  const padX = 40;
  const padY = 24;

  const points = logs.map((log, i) => {
    const val = unit === 'mi' ? log.mpg : log.l100km;
    const x = padX + (i / Math.max(1, logs.length - 1)) * (width - padX * 2);
    const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
    return { x, y, val, date: log.date, drivingType: log.drivingType };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${height - padY} ${polylinePoints} ${points[points.length - 1].x},${height - padY}`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
        <defs>
          <linearGradient id="effAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padY + ratio * (height - padY * 2);
          const labelVal = maxVal - ratio * range;
          return (
            <g key={idx}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                strokeDasharray="4 4"
              />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill={darkMode ? '#94a3b8' : '#64748b'}
              >
                {labelVal.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Area & Line */}
        <polygon points={areaPoints} fill="url(#effAreaGrad)" />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />

        {/* Data Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#10b981" stroke={darkMode ? '#0f172a' : '#ffffff'} strokeWidth="2" />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill={darkMode ? '#f8fafc' : '#0f172a'}
            >
              {p.val.toFixed(1)}
            </text>
            <text
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              fontSize="9"
              fill={darkMode ? '#94a3b8' : '#64748b'}
            >
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// VIEW 7: SPECIFICATIONS & PART NUMBERS SHEET
// ============================================================================

function SpecsView({ vehicle, onEdit, showToast, t }) {
  const copyText = (label, value) => {
    if (!value || value === 'N/A') return;
    navigator.clipboard?.writeText(value);
    showToast(`Copied ${label}: ${value}`);
  };

  const specSections = [
    {
      title: 'Identification & Registration',
      items: [
        { label: 'VIN / Chassis Number', value: vehicle.vin, mono: true, copyable: true },
        { label: 'License Plate', value: vehicle.licensePlate, mono: true, copyable: true },
        { label: 'State / Province', value: vehicle.region },
        { label: 'Exterior / Interior Color', value: vehicle.color },
        { label: 'Registration Expiry', value: formatDate(vehicle.registrationExpiry) },
        { label: 'Purchase Date & Price', value: `${formatDate(vehicle.purchaseDate)} • ${formatCurrency(vehicle.purchasePrice)}` },
      ]
    },
    {
      title: 'Powertrain, Tires & Fluids',
      items: [
        { label: 'Engine / Motor Spec', value: vehicle.engineSpec },
        { label: 'Drivetrain & Transmission', value: vehicle.drivetrain },
        { label: 'Tire Size & Load Rating', value: vehicle.tireSize, copyable: true },
        { label: 'Recommended Tire PSI', value: vehicle.tirePsi },
        { label: 'Engine Oil Spec & Capacity', value: vehicle.oilType, copyable: true },
      ]
    },
    {
      title: 'OEM & Replacement Part Numbers',
      items: [
        { label: 'Oil Filter Part #', value: vehicle.oilFilterPart, mono: true, copyable: true },
        { label: 'Engine Air Filter Part #', value: vehicle.airFilterPart, mono: true, copyable: true },
        { label: 'Cabin Air Filter Part #', value: vehicle.cabinFilterPart, mono: true, copyable: true },
        { label: 'Fuel Filter Part #', value: vehicle.fuelFilterPart, mono: true, copyable: true },
      ]
    },
    {
      title: 'Insurance & Coverage',
      items: [
        { label: 'Insurance Provider', value: vehicle.insuranceProvider },
        { label: 'Policy Number', value: vehicle.insurancePolicy, mono: true, copyable: true },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${t.card} flex items-center justify-between`}>
        <div>
          <h2 className="text-lg font-bold">Technical Glovebox & Part Numbers</h2>
          <p className={`text-xs ${t.muted}`}>Click any highlighted part number or VIN to copy to clipboard</p>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
        >
          <Edit3 className="w-4 h-4" /> Edit All Specs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {specSections.map(sec => (
          <div key={sec.title} className={`rounded-2xl border p-5 ${t.card} space-y-3`}>
            <h3 className="font-bold text-sm uppercase tracking-wider text-blue-500">{sec.title}</h3>
            <div className="divide-y divide-slate-800/30">
              {sec.items.map(item => (
                <div key={item.label} className="py-2.5 flex items-center justify-between gap-4">
                  <span className={`text-xs ${t.muted}`}>{item.label}</span>
                  <button
                    type="button"
                    disabled={!item.copyable || !item.value}
                    onClick={() => copyText(item.label, item.value)}
                    className={`text-xs sm:text-sm font-semibold text-right ${item.mono ? 'font-mono' : ''} ${
                      item.copyable && item.value ? 'hover:text-blue-400 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {item.value || '—'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {vehicle.notes && (
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <h3 className="font-bold text-sm uppercase tracking-wider text-blue-500 mb-2">Owner Notes & Torque Specs</h3>
          <p className="text-sm whitespace-pre-line">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VIEW 8: ALL VEHICLES FLEET OVERVIEW
// ============================================================================

function FleetOverviewView({
  db, fleetStats, selectedVehicleId, showArchived, onToggleShowArchived,
  onSelectVehicle, onAddVehicle, onEditVehicle, onArchiveVehicle, onDeleteVehicle,
  onClearSampleData, onResetSampleData, t
}) {
  const visibleVehicles = db.vehicles.filter(v => showArchived || !v.archived);

  return (
    <div className="space-y-6">
      {/* Fleet KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Total Fleet Size</div>
          <div className="text-2xl font-extrabold mt-2">{fleetStats.activeCount} Active</div>
          <div className={`text-xs mt-1 ${t.muted}`}>{fleetStats.vehicleCount} total including archived</div>
        </div>
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Fleet Purchase Value</div>
          <div className="text-2xl font-extrabold mt-2">{formatCurrency(fleetStats.totalPurchaseValue)}</div>
          <div className={`text-xs mt-1 ${t.muted}`}>Combined acquisition cost</div>
        </div>
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Lifetime Fleet Spend</div>
          <div className="text-2xl font-extrabold mt-2 text-blue-500">{formatCurrency(fleetStats.totalLifetimeSpend)}</div>
          <div className={`text-xs mt-1 ${t.muted}`}>
            Fuel {formatCurrency(fleetStats.totalFuel)} • Service {formatCurrency(fleetStats.totalMaint)}
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <div className={`text-xs font-semibold uppercase ${t.muted}`}>Fleet Alerts</div>
          <div className="text-2xl font-extrabold mt-2 text-amber-500">
            {fleetStats.alertReminders.length} Due / Overdue
          </div>
          <div className={`text-xs mt-1 ${t.muted}`}>Across all active vehicles</div>
        </div>
      </div>

      {/* Fleet Controls */}
      <div className={`rounded-2xl border p-4 ${t.card} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddVehicle}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add New Vehicle
          </button>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={onToggleShowArchived}
              className="rounded border-slate-600"
            />
            Show Archived Vehicles
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetSampleData}
            className={`px-3 py-1.5 rounded-xl border ${t.border} ${t.hover} text-xs font-semibold flex items-center gap-1.5`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Load Demo Data
          </button>
          <button
            onClick={onClearSampleData}
            className={`px-3 py-1.5 rounded-xl border ${t.border} ${t.hover} text-xs font-semibold text-rose-500 flex items-center gap-1.5`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All / Start Fresh
          </button>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleVehicles.map(v => {
          const vFuel = db.fuelLogs.filter(l => l.vehicleId === v.id).reduce((s, l) => s + Number(l.totalCost || 0), 0);
          const vMaint = db.maintenanceLogs.filter(l => l.vehicleId === v.id).reduce((s, l) => s + Number(l.totalCost || 0), 0);
          const vExp = db.expenseLogs.filter(l => l.vehicleId === v.id).reduce((s, l) => s + Number(l.cost || 0), 0);
          const isSelected = v.id === selectedVehicleId;

          return (
            <div
              key={v.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition ${t.card} ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              } ${v.archived ? 'opacity-65' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-500">
                        {v.year}
                      </span>
                      {v.archived && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-500/20 text-slate-400">
                          Archived
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold mt-1">{v.make} {v.model}</h3>
                    <p className={`text-xs ${t.muted}`}>{v.trim} {v.nickname ? `• “${v.nickname}”` : ''}</p>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-blue-500">{formatNumber(v.odometer)}</div>
                    <div className={`text-[11px] ${t.muted}`}>{v.unit}</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${t.cardSub} space-y-1.5 text-xs mb-4`}>
                  <div className="flex justify-between">
                    <span className={t.muted}>License Plate:</span>
                    <span className="font-mono font-semibold">{v.licensePlate || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={t.muted}>Oil / Filter:</span>
                    <span className="font-mono truncate max-w-[150px]">{v.oilFilterPart || v.oilType || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={t.muted}>Total Tracked Spend:</span>
                    <span className="font-mono font-bold">{formatCurrency(vFuel + vMaint + vExp)}</span>
                  </div>
                </div>
              </div>

              <div className={`pt-3 border-t ${t.border} flex items-center justify-between gap-2`}>
                <button
                  onClick={() => onSelectVehicle(v.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  Open Dashboard
                </button>
                <button
                  onClick={() => onEditVehicle(v)}
                  className={`p-2 rounded-xl border ${t.border} ${t.hover}`}
                  title="Edit Vehicle"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onArchiveVehicle(v.id)}
                  className={`p-2 rounded-xl border ${t.border} ${t.hover}`}
                  title={v.archived ? 'Unarchive Vehicle' : 'Archive Vehicle'}
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteVehicle(v)}
                  className={`p-2 rounded-xl border ${t.border} ${t.hover} text-rose-500`}
                  title="Delete Vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 9: BACKUPS & RESTORE POINTS MANAGER
// ============================================================================

function BackupRestoreView({
  db, snapshots, onOpenCreateSnapshot, onRestoreSnapshot, onDeleteSnapshot,
  onPreviewSnapshot, onExportJson, onImportJson, onClearSampleData,
  onResetSampleData, showToast, t
}) {
  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('overwrite'); // overwrite | merge
  const [isDragging, setIsDragging] = useState(false);

  const currentDbSize = useMemo(() => JSON.stringify(db).length, [db]);
  const totalLogsCount = db.fuelLogs.length + db.maintenanceLogs.length + db.expenseLogs.length;

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        onImportJson(parsed, importMode);
      } catch (err) {
        showToast('Could not parse JSON file. Ensure it is a valid Vehicle Logs backup.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Status & Quick Backup Bar */}
      <div className={`rounded-2xl border p-6 ${t.card}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg sm:text-xl font-bold">Fleet Backup & Restore Point Vault</h2>
            </div>
            <p className={`text-xs sm:text-sm ${t.muted}`}>
              Active Database: <strong>{db.vehicles.length} Vehicles</strong> • <strong>{totalLogsCount} Logs</strong> • <strong>{db.reminders.length} Reminders</strong> ({bytesToSize(currentDbSize)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenCreateSnapshot}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Create Restore Point
            </button>
            <button
              onClick={onExportJson}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" /> Download .JSON Backup
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column: In-App Snapshots vs External File Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* In-App Restore Points List */}
        <div className={`lg:col-span-7 rounded-2xl border p-5 ${t.card} space-y-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-500" /> Saved Restore Points ({snapshots.length})
              </h3>
              <p className={`text-xs ${t.muted}`}>
                Point-in-time snapshots saved locally in your browser. Restoring automatically creates a safety backup first.
              </p>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className={`p-8 rounded-xl border border-dashed ${t.border} text-center ${t.muted} text-sm`}>
              No restore points saved yet. Click "Create Restore Point" before major edits or imports.
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map(snap => (
                <div key={snap.id} className={`p-4 rounded-xl border ${t.cardSub} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm">{snap.name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        snap.type === 'Auto-Safety'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {snap.type}
                      </span>
                    </div>
                    <div className={`text-xs ${t.muted}`}>
                      {new Date(snap.createdAt).toLocaleString()} • {snap.vehicleCount} vehicles • {snap.totalLogs} logs • {bytesToSize(snap.sizeBytes)}
                    </div>
                    {snap.notes && <div className={`text-xs italic ${t.muted}`}>{snap.notes}</div>}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onPreviewSnapshot(snap)}
                      className={`px-2.5 py-1.5 rounded-lg border ${t.border} ${t.hover} text-xs font-semibold flex items-center gap-1`}
                      title="Inspect Snapshot Contents"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </button>
                    <button
                      onClick={() => onRestoreSnapshot(snap)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                    <button
                      onClick={() => onDeleteSnapshot(snap)}
                      className={`p-1.5 rounded-lg ${t.hover} text-rose-500`}
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Import / Restore Dropzone + Database Utilities */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`rounded-2xl border p-5 ${t.card} space-y-4`}>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" /> Restore from .JSON File
              </h3>
              <p className={`text-xs ${t.muted}`}>
                Import a previously exported Vehicle Logs Pro backup file.
              </p>
            </div>

            {/* Import Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('overwrite')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  importMode === 'overwrite'
                    ? 'border-blue-500 bg-blue-500/10'
                    : `${t.border} ${t.muted}`
                }`}
              >
                <div className="text-xs font-bold">Full Replace</div>
                <div className="text-[11px] opacity-80">Overwrite current garage</div>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  importMode === 'merge'
                    ? 'border-blue-500 bg-blue-500/10'
                    : `${t.border} ${t.muted}`
                }`}
              >
                <div className="text-xs font-bold">Smart Merge</div>
                <div className="text-[11px] opacity-80">Add new IDs without deleting</div>
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : `${t.border} hover:border-blue-500/60`
              }`}
            >
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm font-semibold">Click to select or drag & drop .JSON backup</div>
              <div className={`text-xs mt-1 ${t.muted}`}>
                An automatic safety restore point will be saved before applying changes.
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  processFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Sample Data & Reset Controls */}
          <div className={`rounded-2xl border p-5 ${t.card} space-y-3`}>
            <h3 className="font-bold text-sm uppercase tracking-wider text-amber-500">Database Utilities</h3>
            <p className={`text-xs ${t.muted}`}>
              Quickly clear pre-loaded demo vehicles to begin entering your own fleet, or reload sample data anytime.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onClearSampleData}
                className="px-3.5 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-500 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Sample Data / Start Fresh
              </button>
              <button
                onClick={onResetSampleData}
                className={`px-3.5 py-2 rounded-xl border ${t.border} ${t.hover} text-xs font-semibold flex items-center gap-1.5`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Restore Demo Fleet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE STATUS BADGE
// ============================================================================

function StatusBadge({ status }) {
  if (status === 'overdue') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-500 flex items-center gap-1 shrink-0">
        <AlertCircle className="w-3 h-3" /> Overdue
      </span>
    );
  }
  if (status === 'due_soon') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-500 flex items-center gap-1 shrink-0">
        <AlertTriangle className="w-3 h-3" /> Due Soon
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-500 flex items-center gap-1 shrink-0">
      <CheckCircle2 className="w-3 h-3" /> OK
    </span>
  );
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

function ModalWrapper({ title, subtitle, onClose, children, darkMode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-500/15 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function VehicleFormModal({ initial, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState(
    initial || {
      type: 'car',
      year: new Date().getFullYear(),
      make: '',
      model: '',
      trim: '',
      nickname: '',
      vin: '',
      licensePlate: '',
      region: '',
      color: '',
      unit: 'mi',
      odometer: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: '',
      engineSpec: '',
      drivetrain: '',
      tireSize: '',
      tirePsi: '',
      oilType: '',
      oilFilterPart: '',
      airFilterPart: '',
      cabinFilterPart: '',
      fuelFilterPart: '',
      insuranceProvider: '',
      insurancePolicy: '',
      registrationExpiry: '',
      notes: ''
    }
  );

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) return;
    onSave({
      ...form,
      year: Number(form.year) || new Date().getFullYear(),
      odometer: Number(form.odometer) || 0,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : 0,
    });
  };

  return (
    <ModalWrapper
      title={initial ? 'Edit Vehicle Profile & Part Numbers' : 'Add Vehicle to Fleet'}
      subtitle="Store comprehensive mechanical specs, OEM filter numbers, and registration details"
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Basic Identity */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-3">1. Core Identity & Odometer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Vehicle Type</label>
              <select value={form.type} onChange={e => setField('type', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
                {VEHICLE_TYPES.map(vt => <option key={vt.id} value={vt.id}>{vt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Year *</label>
              <input type="number" required value={form.year} onChange={e => setField('year', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Distance Unit</label>
              <select value={form.unit} onChange={e => setField('unit', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
                <option value="mi">Miles (mi / MPG)</option>
                <option value="km">Kilometers (km / L/100km)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Make *</label>
              <input type="text" required placeholder="e.g. Toyota" value={form.make} onChange={e => setField('make', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Model *</label>
              <input type="text" required placeholder="e.g. Tacoma" value={form.model} onChange={e => setField('model', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Trim / Edition</label>
              <input type="text" placeholder="e.g. TRD Off-Road" value={form.trim} onChange={e => setField('trim', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Nickname</label>
              <input type="text" placeholder="e.g. Overland Rig" value={form.nickname} onChange={e => setField('nickname', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Current Odometer ({form.unit})</label>
              <input type="number" value={form.odometer} onChange={e => setField('odometer', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Color</label>
              <input type="text" placeholder="e.g. Lunar Rock" value={form.color} onChange={e => setField('color', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
          </div>
        </div>

        {/* VIN, Plate & Ownership */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-3">2. VIN, Plate & Insurance</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">VIN (17-Character)</label>
              <input type="text" placeholder="17-char VIN" value={form.vin} onChange={e => setField('vin', e.target.value.toUpperCase())} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">License Plate</label>
              <input type="text" placeholder="ABC-1234" value={form.licensePlate} onChange={e => setField('licensePlate', e.target.value.toUpperCase())} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">State / Province</label>
              <input type="text" placeholder="ON, Canada / TX, USA" value={form.region} onChange={e => setField('region', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Registration Expiry</label>
              <input type="date" value={form.registrationExpiry} onChange={e => setField('registrationExpiry', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Purchase Price ($)</label>
              <input type="number" step="0.01" placeholder="35000" value={form.purchasePrice} onChange={e => setField('purchasePrice', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => setField('purchaseDate', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Insurance Provider</label>
              <input type="text" value={form.insuranceProvider} onChange={e => setField('insuranceProvider', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Insurance Policy #</label>
              <input type="text" value={form.insurancePolicy} onChange={e => setField('insurancePolicy', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
          </div>
        </div>

        {/* Mechanical Specs & Part Numbers */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-3">3. Mechanical Specs & Filter Part Numbers</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Engine / Powertrain Spec</label>
              <input type="text" placeholder="e.g. 3.5L V6 DOHC (278 HP)" value={form.engineSpec} onChange={e => setField('engineSpec', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Drivetrain / Transmission</label>
              <input type="text" placeholder="e.g. 4WD / 6-Speed Auto" value={form.drivetrain} onChange={e => setField('drivetrain', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tire Size</label>
              <input type="text" placeholder="e.g. 265/70R16" value={form.tireSize} onChange={e => setField('tireSize', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Recommended Tire PSI</label>
              <input type="text" placeholder="e.g. 35 PSI F / 35 PSI R" value={form.tirePsi} onChange={e => setField('tirePsi', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Oil Viscosity & Capacity</label>
              <input type="text" placeholder="e.g. 0W-20 Full Synthetic (6.2 Qts)" value={form.oilType} onChange={e => setField('oilType', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Oil Filter Part #</label>
              <input type="text" placeholder="e.g. Toyota 04152-YZZA1" value={form.oilFilterPart} onChange={e => setField('oilFilterPart', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Engine Air Filter Part #</label>
              <input type="text" value={form.airFilterPart} onChange={e => setField('airFilterPart', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Cabin Air Filter Part #</label>
              <input type="text" value={form.cabinFilterPart} onChange={e => setField('cabinFilterPart', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Fuel Filter Part #</label>
              <input type="text" value={form.fuelFilterPart} onChange={e => setField('fuelFilterPart', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Custom Notes / Torque Specs</label>
              <textarea rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">
            {initial ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function FuelFormModal({ vehicle, initial, onClose, onSave, t, darkMode }) {
  const volUnit = vehicle.unit === 'mi' ? 'Gallons' : 'Liters';
  const [form, setForm] = useState(
    initial || {
      date: new Date().toISOString().split('T')[0],
      odometer: vehicle.odometer,
      volume: '',
      pricePerUnit: '',
      totalCost: '',
      grade: '87 Regular',
      station: '',
      fullTank: true,
      drivingType: 'Mixed',
      notes: ''
    }
  );

  const handleVolumeOrPriceChange = (field, value) => {
    const updated = { ...form, [field]: value };
    const v = parseFloat(updated.volume);
    const p = parseFloat(updated.pricePerUnit);
    if (!isNaN(v) && !isNaN(p)) {
      updated.totalCost = (v * p).toFixed(2);
    }
    setForm(updated);
  };

  const handleTotalChange = (value) => {
    const updated = { ...form, totalCost: value };
    const v = parseFloat(updated.volume);
    const tot = parseFloat(value);
    if (!isNaN(v) && v > 0 && !isNaN(tot)) {
      updated.pricePerUnit = (tot / v).toFixed(3);
    }
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <ModalWrapper
      title={initial ? 'Edit Fuel Fill-Up' : `Log Fuel — ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      subtitle={`Odometer in ${vehicle.unit} • Fuel volume in ${volUnit}`}
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Odometer ({vehicle.unit}) *</label>
            <input type="number" required value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Volume ({volUnit}) *</label>
            <input type="number" step="0.001" required placeholder="e.g. 14.5" value={form.volume} onChange={e => handleVolumeOrPriceChange('volume', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Price per {vehicle.unit === 'mi' ? 'Gal' : 'Liter'} ($)</label>
            <input type="number" step="0.001" placeholder="e.g. 3.499" value={form.pricePerUnit} onChange={e => handleVolumeOrPriceChange('pricePerUnit', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Total Cost ($) *</label>
            <input type="number" step="0.01" required placeholder="e.g. 50.74" value={form.totalCost} onChange={e => handleTotalChange(e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Fuel Grade / Octane</label>
            <input type="text" placeholder="87 Regular / 91 Premium / ULSD Diesel" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Station / Location</label>
            <input type="text" placeholder="e.g. Shell / Costco" value={form.station} onChange={e => setForm({ ...form, station: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Primary Driving Type</label>
            <select value={form.drivingType} onChange={e => setForm({ ...form, drivingType: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              <option value="Mixed">Mixed City / Highway</option>
              <option value="City">City / Stop & Go</option>
              <option value="Highway">Highway Cruise</option>
              <option value="Towing">Towing / Heavy Load</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.fullTank}
            onChange={e => setForm({ ...form, fullTank: e.target.checked })}
            className="rounded border-slate-600"
          />
          Filled tank completely (required for accurate MPG / L/100km calculation)
        </label>

        <div>
          <label className="block text-xs font-semibold mb-1">Notes</label>
          <input type="text" placeholder="Optional trip or additive notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Save Fill-Up</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function MaintenanceFormModal({ vehicle, initial, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState(
    initial || {
      date: new Date().toISOString().split('T')[0],
      odometer: vehicle.odometer,
      category: 'Oil Change',
      title: '',
      partsReplaced: '',
      partsCost: '',
      laborCost: '',
      totalCost: '',
      shopName: 'DIY Home Garage',
      isDiy: true,
      warranty: '',
      nextDueOdometer: '',
      nextDueDate: '',
      notes: ''
    }
  );
  const [autoReminder, setAutoReminder] = useState(!initial?.id);

  const updateCost = (field, val) => {
    const next = { ...form, [field]: val };
    const p = parseFloat(next.partsCost) || 0;
    const l = parseFloat(next.laborCost) || 0;
    next.totalCost = (p + l).toFixed(2);
    setForm(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, autoReminder);
  };

  return (
    <ModalWrapper
      title={initial?.id ? 'Edit Maintenance Record' : `Log Service — ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      subtitle="Track parts replaced, part numbers, warranty, and next due intervals"
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Odometer ({vehicle.unit}) *</label>
            <input type="number" required value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Service Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold mb-1">Service Title *</label>
            <input type="text" required placeholder="e.g. Full Synthetic Oil Change & Filter" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold mb-1">Parts Replaced & Part Numbers</label>
            <input type="text" placeholder="e.g. Mobil 1 0W-20 (5 Qts), OEM Filter 90915-YZZN1" value={form.partsReplaced} onChange={e => setForm({ ...form, partsReplaced: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Parts Cost ($)</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.partsCost} onChange={e => updateCost('partsCost', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Labor Cost ($)</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.laborCost} onChange={e => updateCost('laborCost', e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Total Cost ($)</label>
            <input type="number" step="0.01" required placeholder="0.00" value={form.totalCost} onChange={e => setForm({ ...form, totalCost: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${t.input}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Shop / Mechanic Name</label>
            <input type="text" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Warranty</label>
            <input type="text" placeholder="e.g. 24 mo / 24,000 mi" value={form.warranty} onChange={e => setForm({ ...form, warranty: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDiy}
            onChange={e => setForm({ ...form, isDiy: e.target.checked, shopName: e.target.checked ? 'DIY Home Garage' : '' })}
            className="rounded border-slate-600"
          />
          Performed DIY (Self-Service)
        </label>

        <div className={`p-3.5 rounded-xl border ${t.cardSub} space-y-3`}>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Next Service Interval (Optional)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Next Due Odometer ({vehicle.unit})</label>
              <input type="number" placeholder="e.g. 65000" value={form.nextDueOdometer || ''} onChange={e => setForm({ ...form, nextDueOdometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Next Due Date</label>
              <input type="date" value={form.nextDueDate || ''} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
            </div>
          </div>
          {!initial?.id && (
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={autoReminder} onChange={e => setAutoReminder(e.target.checked)} className="rounded border-slate-600" />
              Automatically create a Service Reminder from these next-due targets
            </label>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Detailed Notes & Torque Specs</label>
          <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Save Service Record</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ExpenseFormModal({ vehicle, initial, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState(
    initial || {
      date: new Date().toISOString().split('T')[0],
      odometer: vehicle.odometer,
      category: 'Insurance',
      title: '',
      cost: '',
      isBusiness: false,
      notes: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <ModalWrapper
      title={initial ? 'Edit Expense / Trip' : `Log Expense or Trip — ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Title / Purpose *</label>
            <input type="text" required placeholder="e.g. Annual Policy Renewal / Highway Toll" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Cost ($) *</label>
            <input type="number" step="0.01" required placeholder="0.00" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Odometer ({vehicle.unit})</label>
            <input type="number" value={form.odometer || ''} onChange={e => setForm({ ...form, odometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input type="checkbox" checked={form.isBusiness} onChange={e => setForm({ ...form, isBusiness: e.target.checked })} className="rounded border-slate-600" />
          Tag as Business / Tax-Deductible Expense
        </label>

        <div>
          <label className="block text-xs font-semibold mb-1">Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Save Expense</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ReminderFormModal({ vehicle, initial, onClose, onSave, t, darkMode }) {
  const [form, setForm] = useState(
    initial || {
      title: '',
      category: 'Oil Change',
      lastOdometer: vehicle.odometer,
      dueOdometer: vehicle.odometer + (vehicle.unit === 'mi' ? 5000 : 8000),
      dueDate: '',
      notes: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <ModalWrapper
      title={initial ? 'Edit Service Reminder' : `Create Maintenance Reminder — ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      subtitle={`Current Odometer: ${formatNumber(vehicle.odometer)} ${vehicle.unit}`}
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Reminder Title *</label>
            <input type="text" required placeholder="e.g. Rotate Tires & Inspect Brakes" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
              {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Due Date (Optional)</label>
            <input type="date" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Baseline Odometer ({vehicle.unit})</label>
            <input type="number" value={form.lastOdometer || ''} onChange={e => setForm({ ...form, lastOdometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Due At Odometer ({vehicle.unit})</label>
            <input type="number" value={form.dueOdometer || ''} onChange={e => setForm({ ...form, dueOdometer: e.target.value })} className={`w-full px-3 py-2 rounded-xl border font-mono ${t.input}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Notes / Part Numbers Needed</label>
            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${t.input}`} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Save Reminder</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function CreateSnapshotModal({ db, onClose, onCreate, t, darkMode }) {
  const [name, setName] = useState(`Fleet Backup — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), notes.trim());
  };

  return (
    <ModalWrapper
      title="Create Named Restore Point"
      subtitle={`Captures all ${db.vehicles.length} vehicles, logs, part numbers, and reminders`}
      onClose={onClose}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-semibold mb-1">Restore Point Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Before Major Engine Service / 2026 Tax Close"
            value={name}
            onChange={e => setName(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Describe what changed or why this snapshot was taken..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
          />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5">
            <Save className="w-4 h-4" /> Save Restore Point
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function PreviewSnapshotModal({ snapshot, onClose, onRestore, t, darkMode }) {
  const sData = snapshot.data || {};
  return (
    <ModalWrapper
      title={`Inspect Snapshot: ${snapshot.name}`}
      subtitle={`Created ${new Date(snapshot.createdAt).toLocaleString()} • ${bytesToSize(snapshot.sizeBytes)}`}
      onClose={onClose}
      darkMode={darkMode}
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${t.cardSub}`}>
            <div className={`text-xs ${t.muted}`}>Vehicles</div>
            <div className="text-lg font-bold">{sData.vehicles?.length || 0}</div>
          </div>
          <div className={`p-3 rounded-xl border ${t.cardSub}`}>
            <div className={`text-xs ${t.muted}`}>Fuel Logs</div>
            <div className="text-lg font-bold">{sData.fuelLogs?.length || 0}</div>
          </div>
          <div className={`p-3 rounded-xl border ${t.cardSub}`}>
            <div className={`text-xs ${t.muted}`}>Service Logs</div>
            <div className="text-lg font-bold">{sData.maintenanceLogs?.length || 0}</div>
          </div>
          <div className={`p-3 rounded-xl border ${t.cardSub}`}>
            <div className={`text-xs ${t.muted}`}>Reminders</div>
            <div className="text-lg font-bold">{sData.reminders?.length || 0}</div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">Vehicles Included in Snapshot</h4>
          <div className="space-y-2">
            {(sData.vehicles || []).map(v => (
              <div key={v.id} className={`p-3 rounded-xl border ${t.cardSub} flex items-center justify-between`}>
                <div>
                  <div className="font-bold">{v.year} {v.make} {v.model} {v.trim}</div>
                  <div className={`text-xs ${t.muted}`}>VIN: {v.vin || '—'} • Plate: {v.licensePlate || '—'}</div>
                </div>
                <div className="font-mono text-xs font-bold">{formatNumber(v.odometer)} {v.unit}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/40">
          <button onClick={onClose} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} font-semibold`}>Close</button>
          <button onClick={onRestore} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> Restore This Snapshot
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ConfirmModal({ title, message, danger, onCancel, onConfirm, t, darkMode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${danger ? 'bg-rose-500/15 text-rose-500' : 'bg-blue-500/15 text-blue-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className={`text-xs sm:text-sm mt-1 ${t.muted}`}>{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className={`px-4 py-2 rounded-xl border ${t.border} ${t.hover} text-xs sm:text-sm font-semibold`}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold ${
              danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}