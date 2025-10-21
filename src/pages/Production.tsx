import { useEffect, useState } from 'react';
import { db, ProductionRecord } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Production Tracking</h1>
        <p className="text-muted-foreground">Monitor daily production targets and actual output</p>
      </div>

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
          </CardContent>
        </Card>
      </div>

      {/* Recent Production Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Production Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Waste (kg)</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {production.slice(0, 10).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.productType}</TableCell>
                  <TableCell>{record.quantity}</TableCell>
                  <TableCell>{record.target}</TableCell>
                  <TableCell>{record.wasteKg}</TableCell>
                  <TableCell className={record.quantity >= record.target ? 'text-success' : 'text-destructive'}>
                    {record.target > 0 ? ((record.quantity / record.target) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Production;
