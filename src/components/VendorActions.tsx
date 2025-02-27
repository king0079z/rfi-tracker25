import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { PrintableReport } from './PrintableReport';

interface VendorActionsProps {
  vendorId: number;
  vendorName: string;
}

export function VendorActions({ vendorId, vendorName }: VendorActionsProps) {
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`/api/evaluations/vendor/${vendorId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export evaluation');

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
        : `${vendorName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_evaluation.xlsx`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "The evaluation has been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`/api/evaluations/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch evaluations');

      const data = await response.json();
      if (data.evaluations && data.evaluations.length > 0) {
        setEvaluations(data.evaluations);
        setIsPrintDialogOpen(true);
      } else {
        toast({
          title: "No Evaluations",
          description: "There are no evaluations available for this vendor yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Error",
        description: "Failed to load evaluation data for printing.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          title="Export Evaluation"
        >
          <FileDown className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrint}
          title="Print Evaluation Report"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>

      <PrintableReport
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        vendorName={vendorName}
        evaluations={evaluations}
      />
    </>
  );
}