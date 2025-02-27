import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle, Download, Upload, Database } from 'lucide-react';

export default function DataMigrationTool() {
  const [isExporting, setIsExporting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [exportedData, setExportedData] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('export');

  const handleExportData = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/export-data');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to export data');
      }
      
      setExportedData(result.data);
      setActiveTab('migrate');
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message || 'An error occurred while exporting data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMigrateData = async () => {
    if (!exportedData) {
      setError('No data to migrate. Please export data first.');
      return;
    }
    
    setIsMigrating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceData: exportedData }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to migrate data');
      }
      
      setMigrationResult(result);
      setActiveTab('result');
    } catch (err) {
      console.error('Error migrating data:', err);
      setError(err.message || 'An error occurred while migrating data');
    } finally {
      setIsMigrating(false);
    }
  };

  const downloadExportedData = () => {
    if (!exportedData) return;
    
    const dataStr = JSON.stringify(exportedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfi-evaluation-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result as string);
        setExportedData(data);
        setActiveTab('migrate');
      } catch (err) {
        setError('Invalid JSON file. Please upload a valid export file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Data Migration Tool</CardTitle>
        <CardDescription>
          Migrate your RFI Evaluation System data to the Azure database
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">1. Export Data</TabsTrigger>
          <TabsTrigger value="migrate" disabled={!exportedData}>2. Migrate Data</TabsTrigger>
          <TabsTrigger value="result" disabled={!migrationResult}>3. Results</TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="export">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-medium">Export Data from Current Database</h3>
                <p className="text-sm text-muted-foreground">
                  This will export all data from your current database for migration.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleExportData} 
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Export Data
                    </>
                  )}
                </Button>
                
                {exportedData && (
                  <Button 
                    variant="outline" 
                    onClick={downloadExportedData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Export
                  </Button>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-medium">Upload Exported Data</h3>
                <p className="text-sm text-muted-foreground">
                  If you already have an export file, you can upload it here.
                </p>
              </div>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="migrate">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-medium">Migrate Data to Azure Database</h3>
                <p className="text-sm text-muted-foreground">
                  This will migrate all exported data to your Azure database.
                </p>
              </div>
              
              {exportedData && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Data Summary:</h4>
                  <ul className="text-sm space-y-1">
                    <li>Vendors: {exportedData.vendors?.length || 0}</li>
                    <li>Users: {exportedData.users?.length || 0}</li>
                    <li>Evaluators: {exportedData.evaluators?.length || 0}</li>
                    <li>Evaluations: {exportedData.evaluations?.length || 0}</li>
                    <li>Comments: {exportedData.comments?.length || 0}</li>
                    <li>Documents: {exportedData.documents?.length || 0}</li>
                    <li>Chat Messages: {exportedData.chatMessages?.length || 0}</li>
                    <li>Vendor Votes: {exportedData.vendorVotes?.length || 0}</li>
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleMigrateData} 
                  disabled={isMigrating || !exportedData}
                  className="flex items-center gap-2"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Start Migration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="result">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium">Migration Completed</h3>
              </div>
              
              {migrationResult && migrationResult.results && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Migration Results:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(migrationResult.results).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>
                          {value.success} succeeded, {value.failed} failed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your data has been successfully migrated to the Azure database.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Return to Dashboard
        </Button>
        
        {activeTab === 'migrate' && exportedData && (
          <Button onClick={handleMigrateData} disabled={isMigrating}>
            {isMigrating ? 'Migrating...' : 'Start Migration'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}