import { useEffect, useState } from 'react';
import { db, ProductionRecord } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileDown } from 'lucide-react';
import { FileUpload } from '@/components/upload/FileUpload';
import { ImportHistory } from '@/components/data/ImportHistory';
import { UserGuide } from '@/components/help/UserGuide';
import { DataTable } from '@/components/data/DataTable';
import { exportToPDF, captureChartImage } from '@/lib/pdfExport';
import { toast } from 'sonner';

const Production = () => {
  const [production, setProduction] = useState<ProductionRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.production.orderBy('date').reverse().toArray();
    setProduction(data);
  };

  // Last 14 days production
  const recentProduction = production
    .slice(0, 42) // 14 days * 3 product types
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dailyData = recentProduction.reduce((acc, p) => {
    const existing = acc.find(item => item.date === p.date);
    if (existing) {
      existing.quantity += p.quantity;
      existing.target += p.target;
      existing.waste += p.wasteKg;
    } else {
      acc.push({ 
        date: p.date.slice(5), 
        quantity: p.quantity, 
        target: p.target,
        waste: p.wasteKg
      });
    }
    return acc;
  }, [] as { date: string; quantity: number; target: number; waste: number }[]);

  // Production by type
  const byType = production.reduce((acc, p) => {
    const existing = acc.find(item => item.name === p.productType);
    if (existing) {
      existing.value += p.quantity;
    } else {
      acc.push({ name: p.productType, value: p.quantity });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  // Calculate efficiency
  const totalTarget = production.reduce((sum, p) => sum + p.target, 0);
  const totalActual = production.reduce((sum, p) => sum + p.quantity, 0);
  const efficiency = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 0;

  const productionColumns = [
    { key: 'date', label: 'Date', format: (val: string) => val.slice(0, 10) },
    { key: 'productType', label: 'Product Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'target', label: 'Target' },
    { key: 'wasteKg', label: 'Waste (kg)' },
  ];

  const handleExport = async () => {
    const chartImages = await Promise.all([
      captureChartImage('production-chart').then(img => img ? { title: 'Production vs Target', dataUrl: img } : null),
      captureChartImage('waste-chart').then(img => img ? { title: 'Waste Analysis', dataUrl: img } : null),
    ]);

    await exportToPDF({
      title: 'Production Report',
      dateRange: `Last ${production.length} records`,
      data: production.slice(0, 10).map(p => ({
        Date: p.date,
        Product: p.productType,
        Quantity: p.quantity,
        Target: p.target,
        'Waste (kg)': p.wasteKg,
      })),
      columns: [
        { header: 'Date', key: 'Date', width: 30 },
        { header: 'Product', key: 'Product', width: 50 },
        { header: 'Quantity', key: 'Quantity', width: 25 },
        { header: 'Target', key: 'Target', width: 25 },
        { header: 'Waste (kg)', key: 'Waste (kg)', width: 30 },
      ],
      chartImages: chartImages.filter(Boolean) as any[],
    });
    toast.success('Report exported to PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Production Tracking</h1>
          <p className="text-muted-foreground">Monitor daily production targets and actual output</p>
        </div>
        <div className="flex gap-2">
          <UserGuide />
          <FileUpload dataType="production" onDataImport={loadData} />
          <Button onClick={handleExport} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Import History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6">
            <ImportHistory dataType="production" onImportDeleted={loadData} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Efficiency Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Overall Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{efficiency}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              {totalActual.toLocaleString()} units produced out of {totalTarget.toLocaleString()} target
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Production vs Target (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="production-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
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
                <Bar dataKey="target" fill="hsl(var(--chart-2))" name="Target" radius={[8, 8, 0, 0]} />
                <Bar dataKey="quantity" fill="hsl(var(--chart-1))" name="Actual" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production by Product Type</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Waste Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="waste-chart">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyData}>
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
                  dataKey="waste" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Waste (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={production}
            columns={productionColumns}
            dataType="production"
            onDataChange={loadData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Production;
