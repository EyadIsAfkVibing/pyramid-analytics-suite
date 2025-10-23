import { useState } from 'react';
import { HelpCircle, Upload, FileSpreadsheet, Edit, Trash2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export const UserGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        Help Guide
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>User Guide - Data Management</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-100px)]">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">How to Upload Files</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Click the "Upload CSV/Excel" button on any data page</li>
                        <li>Select a CSV (.csv) or Excel (.xlsx, .xls) file from your computer</li>
                        <li>Review the parsed data in the preview dialog</li>
                        <li>Check for any errors or warnings</li>
                        <li>Click "Import" to add the data to your dashboard</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Supported File Types</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>CSV files (.csv)</strong> - Comma-separated values</li>
                        <li><strong>Excel files (.xlsx, .xls)</strong> - Microsoft Excel spreadsheets</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-2">
                        Maximum file size: 20MB
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="format" className="space-y-4 p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Required Fields by Data Type</h3>
                    
                    <div className="space-y-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Production Data</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>date</strong> - Date in YYYY-MM-DD format</li>
                          <li><strong>productType</strong> - Name of the product</li>
                          <li><strong>quantity</strong> - Number produced</li>
                          <li>target - Production target (optional)</li>
                          <li>wasteKg - Waste in kg (optional)</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Inventory Data</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>itemName</strong> - Name of the item</li>
                          <li><strong>stockKg</strong> - Current stock amount</li>
                          <li>minStockKg - Minimum stock level (optional)</li>
                          <li>unit - Unit of measurement (optional, default: kg)</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Sales Data</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>date</strong> - Sale date in YYYY-MM-DD format</li>
                          <li><strong>customer</strong> - Customer name</li>
                          <li><strong>productType</strong> - Product sold</li>
                          <li>amount - Quantity sold (optional)</li>
                          <li>revenue - Revenue amount (optional)</li>
                          <li>delivered - true/false (optional)</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Worker Data</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>date</strong> - Date in YYYY-MM-DD format</li>
                          <li><strong>name</strong> - Worker name</li>
                          <li><strong>shift</strong> - Shift (morning/afternoon/night)</li>
                          <li>tasksDone - Number of tasks completed (optional)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      💡 <strong>Tip:</strong> Download the sample CSV file from any data page to see the exact format required.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manage" className="space-y-4 p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Edit className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Edit Records</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Navigate to the data table on any page</li>
                        <li>Click the edit icon (pencil) next to any record</li>
                        <li>Modify the fields in the dialog</li>
                        <li>Click "Save Changes" to update the record</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-destructive mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Delete Records</h3>
                      <p className="text-sm mb-2">You can delete data in two ways:</p>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          <strong>Delete Individual Records:</strong> Click the delete icon (trash) next to any record in the table
                        </li>
                        <li>
                          <strong>Delete Entire Import:</strong> In the Import History section, click the trash icon next to an import to delete all records from that file at once
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    <p className="text-sm text-destructive">
                      ⚠️ <strong>Warning:</strong> Deletion is permanent and cannot be undone. Make sure to export your data regularly as backup.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4 p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Export to PDF</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Navigate to any data page (Production, Sales, Inventory, Workers)</li>
                        <li>Click the "Export PDF" button</li>
                        <li>The system will generate a PDF with your data and charts</li>
                        <li>The PDF will automatically download to your device</li>
                      </ol>
                      <p className="text-sm text-muted-foreground mt-2">
                        PDF exports include all visible charts and data tables from the current page.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium mb-2">What's Included in PDF Export?</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All visible charts and graphs</li>
                      <li>Summary statistics and KPIs</li>
                      <li>Data tables (up to 50 most recent records)</li>
                      <li>Export date and time</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
