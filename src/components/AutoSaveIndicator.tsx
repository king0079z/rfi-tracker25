import React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

type SaveStatus = 'saving' | 'saved' | 'error' | 'offline';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-600">
            <Check className="h-4 w-4 mr-2" />
            <span>
              {lastSaved
                ? `Last saved ${lastSaved.toLocaleTimeString()}`
                : 'All changes saved'}
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Error saving changes</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center text-yellow-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Working offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="text-sm py-2 px-4 rounded-md bg-background">
      {getStatusDisplay()}
    </div>
  );
}