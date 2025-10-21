import { useEffect, useState } from 'react';
import { db, SaleRecord } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown } from 'lucide-react';
import { CSVUpload } from '@/components/upload/CSVUpload';
import { exportToPDF, captureChartImage } from '@/lib/pdfExport';
import { toast } from 'sonner';

const Sales = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.sales.orderBy('date').reverse().toArray();
    setSales(data);
  };

  // Revenue calculations
  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const deliveredCount = sales.filter(s => s.delivered).length;
  const deliveryRate = sales.length > 0 ? ((deliveredCount / sales.length) * 100).toFixed(1) : 0;

  // Last 14 days revenue trend
  const recentSales = sales
    .slice(0, 50)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dailyRevenue = recentSales.reduce((acc, s) => {
    const existing = acc.find(item => item.date === s.date);
    if (existing) {
      existing.revenue += s.revenue;
      existing.amount += s.amount;
    } else {
      acc.push({ date: s.date.slice(5), revenue: s.revenue, amount: s.amount });
    }
    return acc;
  }, [] as { date: string; revenue: number; amount: number }[]);

  // Revenue by customer
  const byCustomer = sales.reduce((acc, s) => {
    const existing = acc.find(item => item.name === s.customer);
    if (existing) {
      existing.value += s.revenue;
    } else {
      acc.push({ name: s.customer, value: s.revenue });
    }
    return acc;
  }, [] as { name: string; value: number }[])
  .sort((a, b) => b.value - a.value)
  .slice(0, 5); // Top 5 customers

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handleImport = async (data: Omit<SaleRecord, 'id'>[]) => {
    await db.sales.bulkAdd(data);
    loadData();
  };

  const handleExport = async () => {
    const chartImages = await Promise.all([
      captureChartImage('revenue-chart').then(img => img ? { title: 'Revenue Trend', dataUrl: img } : null),
      captureChartImage('customer-chart').then(img => img ? { title: 'Top Customers', dataUrl: img } : null),
    ]);

    await exportToPDF({
      title: 'Sales Report',
      dateRange: `Last ${sales.length} records`,
      data: sales.slice(0, 15).map(s => ({
        Date: s.date,
        Customer: s.customer,
        Product: s.productType,
        Quantity: s.amount,
        Revenue: `$${s.revenue.toLocaleString()}`,
        Status: s.delivered ? 'Delivered' : 'Pending',
      })),
      columns: [
        { header: 'Date', key: 'Date', width: 30 },
        { header: 'Customer', key: 'Customer', width: 40 },
        { header: 'Product', key: 'Product', width: 40 },
        { header: 'Qty', key: 'Quantity', width: 20 },
        { header: 'Revenue', key: 'Revenue', width: 30 },
        { header: 'Status', key: 'Status', width: 25 },
      ],
      chartImages: chartImages.filter(Boolean) as any[],
    });
    toast.success('Report exported to PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Analytics</h1>
          <p className="text-muted-foreground">Track revenue, customers, and delivery performance</p>
        </div>
        <div className="flex gap-2">
          <CSVUpload dataType="sales" onDataImport={handleImport} />
          <Button onClick={handleExport} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${(totalRevenue / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">{deliveredCount} of {sales.length} delivered</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="revenue-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenue}>
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
                  dataKey="revenue" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div id="customer-chart">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                  data={byCustomer}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name.split(' ')[0]}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {byCustomer.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 15).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell className="font-medium">{sale.customer}</TableCell>
                  <TableCell>{sale.productType}</TableCell>
                  <TableCell>{sale.amount}</TableCell>
                  <TableCell className="font-semibold">${sale.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    {sale.delivered ? (
                      <Badge className="bg-success text-success-foreground">Delivered</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
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

export default Sales;
