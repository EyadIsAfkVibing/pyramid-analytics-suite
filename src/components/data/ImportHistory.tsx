import { useState, useEffect } from 'react';
import { Trash2, FileSpreadsheet, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db, ImportBatch } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ImportHistoryProps {
  dataType: string;
  onImportDeleted: () => void;
}

export const ImportHistory = ({ dataType, onImportDeleted }: ImportHistoryProps) => {
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportBatch | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadImports();
  }, [dataType]);

  const loadImports = async () => {
    const allImports = await db.importBatches
      .where('dataType')
      .equals(dataType)
      .reverse()
      .sortBy('importedAt');
    setImports(allImports);
  };

  const handleDeleteImport = async () => {
    if (!selectedImport?.id) return;

    setIsDeleting(true);
    try {
      // Delete all records associated with this import batch
      switch (dataType) {
        case 'production':
          await db.production.where('importBatchId').equals(selectedImport.id).delete();
          break;
        case 'inventory':
          await db.inventory.where('importBatchId').equals(selectedImport.id).delete();
          break;
        case 'sales':
          await db.sales.where('importBatchId').equals(selectedImport.id).delete();
          break;
        case 'workers':
          await db.workers.where('importBatchId').equals(selectedImport.id).delete();
          break;
      }

      // Delete the import batch record
      await db.importBatches.delete(selectedImport.id);

      toast.success(`Deleted ${selectedImport.recordCount} records from "${selectedImport.fileName}"`);
      setIsDeleteDialogOpen(false);
      setSelectedImport(null);
      loadImports();
      onImportDeleted();
    } catch (error) {
      toast.error('Failed to delete import');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (imports.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Import History</h3>
        <div className="space-y-2">
          {imports.map((importBatch) => (
            <div
              key={importBatch.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{importBatch.fileName}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(importBatch.importedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                    <span>{importBatch.recordCount} records</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedImport(importBatch);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Import?</DialogTitle>
            <DialogDescription>
              This will delete all {selectedImport?.recordCount} records imported from "{selectedImport?.fileName}".
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. All records from this import will be permanently deleted.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImport}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
