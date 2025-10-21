import Dexie, { Table } from 'dexie';

// Data models
export interface ProductionRecord {
  id?: number;
  date: string;
  productType: string;
  quantity: number;
  target: number;
  wasteKg: number;
  orderId?: number | null;
}

export interface InventoryItem {
  id?: number;
  itemName: string;
  stockKg: number;
  minStockKg: number;
  unit: string;
  lastUpdated: string;
}

export interface SaleRecord {
  id?: number;
  date: string;
  customer: string;
  productType: string;
  amount: number;
  revenue: number;
  delivered: boolean;
}

export interface WorkerRecord {
  id?: number;
  name: string;
  shift: string;
  tasksDone: number;
  date: string;
}

// Database class
export class PyramidsFactoryDB extends Dexie {
  production!: Table<ProductionRecord>;
  inventory!: Table<InventoryItem>;
  sales!: Table<SaleRecord>;
  workers!: Table<WorkerRecord>;

  constructor() {
    super('PyramidsFactoryDB');
    this.version(1).stores({
      production: '++id, date, productType',
      inventory: '++id, itemName',
      sales: '++id, date, customer',
      workers: '++id, name, date, shift'
    });
  }
}

export const db = new PyramidsFactoryDB();

// Initialize with demo data
export const initializeDemoData = async () => {
  const productionCount = await db.production.count();
  
  if (productionCount === 0) {
    // Generate 30 days of demo data
    const today = new Date();
    const productTypes = ['Standard Shutter', 'Premium Shutter', 'Custom Shutter'];
    const customers = ['Nile Builders', 'Cairo Construction', 'Delta Projects', 'Pyramid Developments', 'Sphinx Properties'];
    const workerNames = ['Mohamed Ali', 'Ahmed Hassan', 'Fatima Nasser', 'Omar Khaled', 'Sarah Ibrahim'];
    const shifts = ['morning', 'afternoon', 'night'];

    const production: ProductionRecord[] = [];
    const sales: SaleRecord[] = [];
    const workers: WorkerRecord[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Production data
      productTypes.forEach(type => {
        const target = type === 'Premium Shutter' ? 150 : 200;
        const quantity = Math.floor(target * (0.85 + Math.random() * 0.2)); // 85-105% of target
        production.push({
          date: dateStr,
          productType: type,
          quantity,
          target,
          wasteKg: Math.floor(5 + Math.random() * 10)
        });

        // Sales data (70% chance for each product type)
        if (Math.random() > 0.3) {
          sales.push({
            date: dateStr,
            customer: customers[Math.floor(Math.random() * customers.length)],
            productType: type,
            amount: Math.floor(10 + Math.random() * 30),
            revenue: Math.floor(10000 + Math.random() * 20000),
            delivered: Math.random() > 0.2
          });
        }
      });

      // Worker data (3 workers per shift)
      shifts.forEach(shift => {
        for (let w = 0; w < 3; w++) {
          workers.push({
            name: workerNames[Math.floor(Math.random() * workerNames.length)],
            shift,
            tasksDone: Math.floor(10 + Math.random() * 15),
            date: dateStr
          });
        }
      });
    }

    // Inventory data
    const inventory: InventoryItem[] = [
      { itemName: 'Aluminum Sheets', stockKg: 1200, minStockKg: 500, unit: 'kg', lastUpdated: new Date().toISOString() },
      { itemName: 'Paint', stockKg: 350, minStockKg: 200, unit: 'L', lastUpdated: new Date().toISOString() },
      { itemName: 'Screws & Fasteners', stockKg: 450, minStockKg: 100, unit: 'kg', lastUpdated: new Date().toISOString() },
      { itemName: 'Packaging Material', stockKg: 280, minStockKg: 150, unit: 'kg', lastUpdated: new Date().toISOString() },
      { itemName: 'Lubricants', stockKg: 95, minStockKg: 50, unit: 'L', lastUpdated: new Date().toISOString() }
    ];

    // Add to database
    await db.production.bulkAdd(production);
    await db.sales.bulkAdd(sales);
    await db.workers.bulkAdd(workers);
    await db.inventory.bulkAdd(inventory);

    console.log('Demo data initialized');
  }
};
