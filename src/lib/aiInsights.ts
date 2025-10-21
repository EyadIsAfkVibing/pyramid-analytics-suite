import { ProductionRecord, InventoryItem, SaleRecord, WorkerRecord } from './db';

export interface Anomaly {
  issue: string;
  evidence: string;
  likelyCauses: string[];
  immediateAction: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Forecast {
  item: string;
  daysToDepletion: number;
  confidence: number;
  type: 'inventory' | 'production';
}

export interface Recommendation {
  action: string;
  estimatedImpact: string;
  difficulty: 'low' | 'medium' | 'high';
  priority: number;
}

export interface Insights {
  anomalies: Anomaly[];
  forecasts: Forecast[];
  recommendations: Recommendation[];
  summary: string;
}

// Calculate moving average
const movingAverage = (data: number[], window: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
};

// Detect anomalies in data
export const detectAnomalies = (
  production: ProductionRecord[],
  inventory: InventoryItem[],
  workers: WorkerRecord[]
): Anomaly[] => {
  const anomalies: Anomaly[] = [];

  // Sort production by date
  const sortedProduction = [...production].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedProduction.length >= 14) {
    // Get last 7 days and previous 7 days
    const recentProduction = sortedProduction.slice(-7);
    const previousProduction = sortedProduction.slice(-14, -7);

    const recentAvg = recentProduction.reduce((sum, p) => sum + p.quantity, 0) / recentProduction.length;
    const previousAvg = previousProduction.reduce((sum, p) => sum + p.quantity, 0) / previousProduction.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    // Production decrease anomaly
    if (change < -10) {
      anomalies.push({
        issue: `Production decreased ${Math.abs(change).toFixed(1)}% week-over-week`,
        evidence: `Average daily output: ${Math.round(recentAvg)} units (prev: ${Math.round(previousAvg)} units)`,
        likelyCauses: [
          'Material shortage or supply chain issues',
          'Equipment maintenance or downtime',
          'Worker absenteeism or shift changes'
        ],
        immediateAction: 'Review material stock levels and equipment status',
        severity: change < -20 ? 'high' : 'medium'
      });
    }

    // Waste percentage anomaly
    const recentWaste = recentProduction.reduce((sum, p) => sum + p.wasteKg, 0) / recentProduction.reduce((sum, p) => sum + p.quantity, 0);
    const previousWaste = previousProduction.reduce((sum, p) => sum + p.wasteKg, 0) / previousProduction.reduce((sum, p) => sum + p.quantity, 0);

    if (recentWaste > previousWaste * 1.2) {
      anomalies.push({
        issue: 'Waste levels increased significantly',
        evidence: `Current waste rate: ${(recentWaste * 100).toFixed(1)}kg per 100 units (prev: ${(previousWaste * 100).toFixed(1)}kg)`,
        likelyCauses: [
          'Quality control issues',
          'Raw material quality degradation',
          'Operator training needed'
        ],
        immediateAction: 'Conduct quality inspection and operator review',
        severity: 'medium'
      });
    }
  }

  // Inventory anomalies
  inventory.forEach(item => {
    if (item.stockKg < item.minStockKg) {
      anomalies.push({
        issue: `${item.itemName} stock critically low`,
        evidence: `Current: ${item.stockKg}${item.unit}, Minimum: ${item.minStockKg}${item.unit}`,
        likelyCauses: [
          'Increased consumption rate',
          'Delayed supplier delivery',
          'Inventory forecasting error'
        ],
        immediateAction: `Reorder ${item.itemName} immediately - production may be affected`,
        severity: 'high'
      });
    }
  });

  return anomalies;
};

// Generate forecasts
export const generateForecasts = (
  production: ProductionRecord[],
  inventory: InventoryItem[]
): Forecast[] => {
  const forecasts: Forecast[] = [];

  // Inventory depletion forecast
  inventory.forEach(item => {
    if (item.stockKg > 0) {
      // Estimate daily consumption (simplified)
      const avgDailyConsumption = item.minStockKg * 0.05; // 5% of min stock per day
      const daysToDepletion = item.stockKg / Math.max(avgDailyConsumption, 0.1);
      
      if (daysToDepletion < 30) {
        forecasts.push({
          item: item.itemName,
          daysToDepletion: Math.round(daysToDepletion),
          confidence: 0.75,
          type: 'inventory'
        });
      }
    }
  });

  // Production trend forecast
  if (production.length >= 7) {
    const recent = production.slice(-7);
    const quantities = recent.map(p => p.quantity);
    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;

    // Simple linear regression
    const xMean = 3; // middle of 0-6
    const yMean = avgQuantity;
    
    let numerator = 0;
    let denominator = 0;
    quantities.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) ** 2;
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const trend = slope < -5 ? 'declining' : slope > 5 ? 'increasing' : 'stable';

    if (trend !== 'stable') {
      forecasts.push({
        item: 'Production Trend',
        daysToDepletion: 0, // Not applicable
        confidence: 0.65,
        type: 'production'
      });
    }
  }

  return forecasts;
};

// Generate recommendations
export const generateRecommendations = (
  anomalies: Anomaly[],
  forecasts: Forecast[]
): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Based on anomalies
  anomalies.forEach((anomaly, index) => {
    if (anomaly.severity === 'high') {
      recommendations.push({
        action: anomaly.immediateAction,
        estimatedImpact: 'Critical - prevent production stoppage',
        difficulty: 'low',
        priority: 1
      });
    }
  });

  // Based on forecasts
  forecasts.forEach(forecast => {
    if (forecast.type === 'inventory' && forecast.daysToDepletion < 14) {
      recommendations.push({
        action: `Order ${forecast.item} within next 3 days`,
        estimatedImpact: `Maintain ${Math.round(forecast.daysToDepletion)} days buffer stock`,
        difficulty: 'low',
        priority: 2
      });
    }
  });

  // General recommendations
  if (anomalies.length === 0 && forecasts.length === 0) {
    recommendations.push({
      action: 'Continue current operations - all metrics healthy',
      estimatedImpact: 'Maintain efficiency and quality standards',
      difficulty: 'low',
      priority: 3
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
};

// Main insights generator
export const generateInsights = (
  production: ProductionRecord[],
  inventory: InventoryItem[],
  sales: SaleRecord[],
  workers: WorkerRecord[]
): Insights => {
  const anomalies = detectAnomalies(production, inventory, workers);
  const forecasts = generateForecasts(production, inventory);
  const recommendations = generateRecommendations(anomalies, forecasts);

  // Generate summary
  let summary = 'Factory operations overview: ';
  if (anomalies.length === 0) {
    summary += 'All systems operating normally. ';
  } else {
    summary += `${anomalies.length} issue${anomalies.length > 1 ? 's' : ''} detected requiring attention. `;
  }
  
  if (forecasts.length > 0) {
    summary += `${forecasts.length} forecast alert${forecasts.length > 1 ? 's' : ''} for inventory management. `;
  }

  return {
    anomalies,
    forecasts,
    recommendations,
    summary
  };
};
