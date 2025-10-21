import { useEffect, useState } from 'react';
import { db, InventoryItem } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileDown } from 'lucide-react';
import { CSVUpload } from '@/components/upload/CSVUpload';
import { exportToPDF, captureChartImage } from '@/lib/pdfExport';
import { toast } from 'sonner';

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.inventory.toArray();
    setInventory(data);
  };

  const chartData = inventory.map(item => ({
    name: item.itemName,
    current: item.stockKg,
    minimum: item.minStockKg
  }));

  const lowStockCount = inventory.filter(i => i.stockKg < i.minStockKg).length;
  const totalValue = inventory.reduce((sum, i) => sum + i.stockKg, 0);

  const handleImport = async (data: Omit<InventoryItem, 'id'>[]) => {
    await db.inventory.bulkAdd(data);
    loadData();
  };

  const handleExport = async () => {
    const chartImages = await Promise.all([
      captureChartImage('stock-chart').then(img => img ? { title: 'Stock Levels', dataUrl: img } : null),
    ]);

    await exportToPDF({
      title: 'Inventory Report',
      dateRange: `${inventory.length} items`,
      data: inventory.map(item => ({
        Item: item.itemName,
        'Current Stock': `${item.stockKg} ${item.unit}`,
        'Min Stock': `${item.minStockKg} ${item.unit}`,
        Status: item.stockKg < item.minStockKg ? 'Low Stock' : 'OK',
      })),
      columns: [
        { header: 'Item', key: 'Item', width: 50 },
        { header: 'Current', key: 'Current Stock', width: 35 },
        { header: 'Minimum', key: 'Min Stock', width: 35 },
        { header: 'Status', key: 'Status', width: 30 },
      ],
      chartImages: chartImages.filter(Boolean) as any[],
    });
    toast.success('Report exported to PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor stock levels and material availability</p>
        </div>
        <div className="flex gap-2">
          <CSVUpload dataType="inventory" onDataImport={handleImport} />
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
            <CardTitle className="text-sm">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-destructive' : 'text-success'}`}>
              {lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Combined units</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stock Levels Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="stock-chart">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="current" fill="hsl(var(--chart-1))" name="Current Stock" radius={[8, 8, 0, 0]} />
                <Bar dataKey="minimum" fill="hsl(var(--chart-2))" name="Minimum Required" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Minimum Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const isLow = item.stockKg < item.minStockKg;
                const percentage = (item.stockKg / item.minStockKg) * 100;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {isLow && <AlertTriangle className="inline h-4 w-4 mr-2 text-destructive" />}
                      {item.itemName}
                    </TableCell>
                    <TableCell className={isLow ? 'text-destructive font-semibold' : ''}>
                      {item.stockKg}
                    </TableCell>
                    <TableCell>{item.minStockKg}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive">Critical</Badge>
                      ) : percentage < 150 ? (
                        <Badge variant="secondary">Low</Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Healthy</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;