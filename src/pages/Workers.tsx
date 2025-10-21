import { useEffect, useState } from 'react';
import { db, WorkerRecord } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Workers = () => {
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.workers.orderBy('date').reverse().toArray();
    setWorkers(data);
  };

  // Performance by shift
  const byShift = workers.reduce((acc, w) => {
    const existing = acc.find(item => item.shift === w.shift);
    if (existing) {
      existing.tasks += w.tasksDone;
      existing.count += 1;
    } else {
      acc.push({ shift: w.shift, tasks: w.tasksDone, count: 1 });
    }
    return acc;
  }, [] as { shift: string; tasks: number; count: number }[])
  .map(s => ({
    shift: s.shift.charAt(0).toUpperCase() + s.shift.slice(1),
    avgTasks: (s.tasks / s.count).toFixed(1)
  }));

  // Performance by worker
  const byWorker = workers.reduce((acc, w) => {
    const existing = acc.find(item => item.name === w.name);
    if (existing) {
      existing.value += w.tasksDone;
    } else {
      acc.push({ name: w.name, value: w.tasksDone });
    }
    return acc;
  }, [] as { name: string; value: number }[])
  .sort((a, b) => b.value - a.value)
  .slice(0, 5);

  const totalTasks = workers.reduce((sum, w) => sum + w.tasksDone, 0);
  const avgTasksPerWorker = workers.length > 0 ? (totalTasks / workers.length).toFixed(1) : 0;

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Worker Performance</h1>
        <p className="text-muted-foreground">Track worker productivity and shift efficiency</p>
      </div>

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Worker Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Tasks per Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTasksPerWorker}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Tasks by Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byShift}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="shift" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar 
                  dataKey="avgTasks" 
                  fill="hsl(var(--chart-1))" 
                  name="Avg Tasks"
                  radius={[8, 8, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Workers by Tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byWorker}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name.split(' ')[0]}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {byWorker.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Worker Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Worker Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Worker Name</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Tasks Completed</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.slice(0, 20).map((worker) => {
                const avgTasks = typeof avgTasksPerWorker === 'string' ? parseFloat(avgTasksPerWorker) : avgTasksPerWorker;
                const performance = worker.tasksDone >= avgTasks ? 'Above Average' : 'Below Average';
                
                return (
                  <TableRow key={worker.id}>
                    <TableCell>{worker.date}</TableCell>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell className="capitalize">{worker.shift}</TableCell>
                    <TableCell className="font-semibold">{worker.tasksDone}</TableCell>
                    <TableCell className={worker.tasksDone >= avgTasks ? 'text-success' : 'text-muted-foreground'}>
                      {performance}
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

export default Workers;
