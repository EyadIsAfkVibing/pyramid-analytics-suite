import Papa from 'papaparse';
import { ProductionRecord, InventoryItem, SaleRecord, WorkerRecord } from './db';

export type DataType = 'production' | 'inventory' | 'sales' | 'workers';

export interface ParsedData<T> {
  data: T[];
  errors: string[];
  warnings: string[];
}

export const parseCSV = <T>(
  file: File,
  type: DataType
): Promise<ParsedData<T>> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = parseDataByType(results.data, type);
        resolve(parsed as ParsedData<T>);
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          warnings: [],
        });
      },
    });
  });
};

const parseDataByType = (data: any[], type: DataType): ParsedData<any> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed: any[] = [];

  switch (type) {
    case 'production':
      data.forEach((row, index) => {
        if (!row.date || !row.productType || !row.quantity) {
          errors.push(`Row ${index + 1}: Missing required fields (date, productType, quantity)`);
          return;
        }
        
        const record: Omit<ProductionRecord, 'id'> = {
          date: new Date(row.date).toISOString(),
          productType: row.productType,
          quantity: parseFloat(row.quantity) || 0,
          target: parseFloat(row.target) || 0,
          wasteKg: parseFloat(row.wasteKg) || 0,
          orderId: row.orderId ? parseInt(row.orderId) : null,
        };
        
        if (record.quantity > record.target && record.target > 0) {
          warnings.push(`Row ${index + 1}: Quantity exceeds target`);
        }
        
        parsed.push(record);
      });
      break;

    case 'inventory':
      data.forEach((row, index) => {
        if (!row.itemName || !row.stockKg) {
          errors.push(`Row ${index + 1}: Missing required fields (itemName, stockKg)`);
          return;
        }
        
        const record: Omit<InventoryItem, 'id'> = {
          itemName: row.itemName,
          stockKg: parseFloat(row.stockKg) || 0,
          minStockKg: parseFloat(row.minStockKg) || 0,
          unit: row.unit || 'kg',
          lastUpdated: row.lastUpdated ? new Date(row.lastUpdated).toISOString() : new Date().toISOString(),
        };
        
        if (record.stockKg < record.minStockKg) {
          warnings.push(`Row ${index + 1}: ${row.itemName} is below minimum stock`);
        }
        
        parsed.push(record);
      });
      break;

    case 'sales':
      data.forEach((row, index) => {
        if (!row.date || !row.customer || !row.productType) {
          errors.push(`Row ${index + 1}: Missing required fields (date, customer, productType)`);
          return;
        }
        
        const record: Omit<SaleRecord, 'id'> = {
          date: new Date(row.date).toISOString(),
          customer: row.customer,
          productType: row.productType,
          amount: parseFloat(row.amount) || 0,
          revenue: parseFloat(row.revenue) || 0,
          delivered: row.delivered === 'true' || row.delivered === true,
        };
        
        parsed.push(record);
      });
      break;

    case 'workers':
      data.forEach((row, index) => {
        if (!row.date || !row.name || !row.shift) {
          errors.push(`Row ${index + 1}: Missing required fields (date, name, shift)`);
          return;
        }
        
        const record: Omit<WorkerRecord, 'id'> = {
          date: new Date(row.date).toISOString(),
          name: row.name,
          shift: row.shift,
          tasksDone: parseInt(row.tasksDone) || 0,
        };
        
        parsed.push(record);
      });
      break;
  }

  return { data: parsed, errors, warnings };
};

export const generateSampleCSV = (type: DataType): string => {
  const templates = {
    production: 'date,productType,quantity,target,wasteKg,orderId\n2025-10-01,Standard Shutter,180,200,7.5,\n2025-10-02,Premium Shutter,95,100,3.2,',
    inventory: 'itemName,stockKg,minStockKg,unit,lastUpdated\nAluminum Sheets,1200,500,kg,2025-10-01T08:00:00Z\nPaint,150,100,L,2025-10-01T08:00:00Z',
    sales: 'date,customer,productType,amount,revenue,delivered\n2025-10-01,ABC Corp,Standard Shutter,50,6000,true\n2025-10-02,XYZ Ltd,Premium Shutter,30,4500,false',
    workers: 'date,name,shift,tasksDone\n2025-10-01,John Doe,morning,15\n2025-10-01,Jane Smith,afternoon,18',
  };
  
  return templates[type];
};