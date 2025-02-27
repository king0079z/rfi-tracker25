import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DataMigrationTool from '@/components/DataMigrationTool';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DataMigrationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-status');
        const data = await response.json();
        
        if (response.ok && data.user && data.user.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          // Redirect non-admin users
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Data Migration to Azure Database</h1>
      <DataMigrationTool />
    </div>
  );
}