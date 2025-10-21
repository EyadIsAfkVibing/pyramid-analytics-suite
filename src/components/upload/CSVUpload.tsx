import { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSV, generateSampleCSV, DataType, ParsedData } from '@/lib/csvParser';
import { toast } from 'sonner';

interface CSVUploadProps {
  dataType: DataType;
  onDataImport: (data: any[]) => Promise<void>;
}

export const CSVUpload = ({ dataType, onDataImport }: CSVUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData<any> | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    try {
      const result = await parseCSV(file, dataType);
      setParsedData(result);
      setIsOpen(true);
    } catch (error) {
      toast.error('Failed to parse CSV file');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.errors.length > 0) return;

    setIsUploading(true);
    try {
      await onDataImport(parsedData.data);
      toast.success(`Imported ${parsedData.data.length} records successfully`);
      setIsOpen(false);
      setParsedData(null);
    } catch (error) {
      toast.error('Failed to import data');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const csv = generateSampleCSV(dataType);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}-sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadSample} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Sample
        </Button>
        <Button variant="default" size="sm" disabled={isUploading} asChild>
          <label>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Processing...' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Import CSV Data</DialogTitle>
            <DialogDescription>
              Review the parsed data before importing
            </DialogDescription>
          </DialogHeader>

          {parsedData && (
            <div className="space-y-4">
              {parsedData.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Found {parsedData.errors.length} errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {parsedData.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                      {parsedData.errors.length > 5 && (
                        <li className="text-sm">...and {parsedData.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Found {parsedData.warnings.length} warnings:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {parsedData.warnings.slice(0, 3).map((warning, i) => (
                        <li key={i} className="text-sm">{warning}</li>
                      ))}
                      {parsedData.warnings.length > 3 && (
                        <li className="text-sm">...and {parsedData.warnings.length - 3} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.data.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully parsed {parsedData.data.length} records
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.data.length > 0 && (
                <div className="border rounded-lg overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(parsedData.data[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.data.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-4 py-2">
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.data.length > 10 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                      Showing first 10 of {parsedData.data.length} records
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedData || parsedData.errors.length > 0 || isUploading}
            >
              {isUploading ? 'Importing...' : `Import ${parsedData?.data.length || 0} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};