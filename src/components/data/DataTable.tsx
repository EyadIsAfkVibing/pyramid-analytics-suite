import { useState } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface DataTableProps<T extends { id?: number }> {
  data: T[];
  columns: {
    key: string;
    label: string;
    format?: (value: any) => string;
  }[];
  dataType: 'production' | 'inventory' | 'sales' | 'workers';
  onDataChange: () => void;
}

export function DataTable<T extends { id?: number }>({
  data,
  columns,
  dataType,
  onDataChange,
}: DataTableProps<T>) {
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<T>>({});
  const [deleteRecord, setDeleteRecord] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (record: T) => {
    setEditingRecord(record);
    setEditedValues(record);
  };

  const handleSave = async () => {
    if (!editingRecord?.id) return;

    try {
      switch (dataType) {
        case 'production':
          await db.production.update(editingRecord.id, editedValues);
          break;
        case 'inventory':
          await db.inventory.update(editingRecord.id, editedValues);
          break;
        case 'sales':
          await db.sales.update(editingRecord.id, editedValues);
          break;
        case 'workers':
          await db.workers.update(editingRecord.id, editedValues);
          break;
      }
      toast.success('Record updated successfully');
      setEditingRecord(null);
      onDataChange();
    } catch (error) {
      toast.error('Failed to update record');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord?.id) return;

    setIsDeleting(true);
    try {
      switch (dataType) {
        case 'production':
          await db.production.delete(deleteRecord.id);
          break;
        case 'inventory':
          await db.inventory.delete(deleteRecord.id);
          break;
        case 'sales':
          await db.sales.delete(deleteRecord.id);
          break;
        case 'workers':
          await db.workers.delete(deleteRecord.id);
          break;
      }
      toast.success('Record deleted successfully');
      setDeleteRecord(null);
      onDataChange();
    } catch (error) {
      toast.error('Failed to delete record');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available. Upload a file to get started.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 50).map((record, i) => (
              <tr key={i} className="border-t hover:bg-muted/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.format
                      ? col.format((record as any)[col.key])
                      : String((record as any)[col.key] ?? '-')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteRecord(record)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 50 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/50">
            Showing 50 of {data.length} records
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Make changes to the record below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editingRecord &&
              columns.map((col) => (
                <div key={col.key} className="space-y-2">
                  <label className="text-sm font-medium">{col.label}</label>
                  <Input
                    value={String((editedValues as any)[col.key] ?? '')}
                    onChange={(e) =>
                      setEditedValues({
                        ...editedValues,
                        [col.key]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record?
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The record will be permanently deleted.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRecord(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
