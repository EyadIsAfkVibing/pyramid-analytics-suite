import { useEffect, useState } from 'react';
import { Factory, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/cards/KPICard';
import { db, ProductionRecord, InventoryItem, SaleRecord } from '@/lib/db';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prodData = await db.production.toArray();
    const invData = await db.inventory.toArray();
    const salesData = await db.sales.toArray();
    
    setProduction(prodData);
    setInventory(invData);
    setSales(salesData);
    setLoading(false);
  };

  // Calculate KPIs
  const totalProduction = production.reduce((sum, p) => sum + p.quantity, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const lowStockItems = inventory.filter(i => i.stockKg < i.minStockKg).length;
  const deliveryRate = sales.length > 0 
    ? (sales.filter(s => s.delivered).length / sales.length * 100).toFixed(1)
    : 0;

  // Chart data - last 7 days
  const last7Days = production
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const productionChartData = last7Days.reduce((acc, p) => {
    const existing = acc.find(item => item.date === p.date);
    if (existing) {
      existing.quantity += p.quantity;
      existing.target += p.target;
    } else {
      acc.push({ date: p.date.slice(5), quantity: p.quantity, target: p.target });
    }
    return acc;
  }, [] as { date: string; quantity: number; target: number }[]);

  // Revenue by product type
  const revenueByProduct = sales.reduce((acc, s) => {
    const existing = acc.find(item => item.name === s.productType);
    if (existing) {
      existing.value += s.revenue;
    } else {
      acc.push({ name: s.productType, value: s.revenue });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time factory performance metrics</p>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <KPICard
          title="Total Production"
          value={totalProduction.toLocaleString()}
          icon={Factory}
          change={8.5}
          trend="up"
        />
        <KPICard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          change={12.3}
          trend="up"
        />
        <KPICard
          title="Low Stock Alerts"
          value={lowStockItems}
          icon={AlertTriangle}
          trend={lowStockItems > 0 ? 'down' : 'neutral'}
        />
        <KPICard
          title="Delivery Rate"
          value={`${deliveryRate}%`}
          icon={TrendingUp}
          change={2.1}
          trend="up"
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Production Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="quantity" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Actual"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByProduct}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventory.map(item => {
                const percentage = (item.stockKg / (item.minStockKg * 2)) * 100;
                const isLow = item.stockKg < item.minStockKg;
                
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.itemName}</span>
                      <span className={isLow ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                        {item.stockKg}{item.unit} {isLow && '⚠️'}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
