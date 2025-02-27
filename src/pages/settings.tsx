import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  canAccessChat: boolean;
  canPrintReports: boolean;
  canExportData: boolean;
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    chatEnabled: true,
    directDecisionEnabled: true,
    printEnabled: true,
    exportEnabled: true,
  });

  const fetchSettings = async (token: string) => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          chatEnabled: data.chatEnabled,
          directDecisionEnabled: data.directDecisionEnabled,
          printEnabled: data.printEnabled,
          exportEnabled: data.exportEnabled,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    }
  };

  const handleSettingChange = async (setting: 'chatEnabled' | 'directDecisionEnabled' | 'printEnabled' | 'exportEnabled', value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Store the previous state
      const previousSettings = { ...settings };

      // Optimistically update the UI
      setSettings(prev => ({ ...prev, [setting]: value }));

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          [setting]: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        toast.success('Settings updated successfully');
      } else {
        // Revert to previous state if the request fails
        setSettings(previousSettings);
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update settings');
      }
    } catch (error) {
      // Revert to previous state on error
      setSettings(settings);
      console.error('Error updating settings:', error);
      toast.error('Error updating settings');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success('User role updated successfully');
      } else {
        toast.error(data.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Error updating user role');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!(payload?.role === 'ADMIN' || payload?.email === 'admin@admin.com')) {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
      return;
    }

    fetchSettings(token);

    const fetchUsers = async () => {
      try {
        const [usersResponse, pendingResponse] = await Promise.all([
          fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/admin/users/pending', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (usersResponse.ok && pendingResponse.ok) {
          const usersData = await usersResponse.json();
          const pendingData = await pendingResponse.json();
          setUsers(usersData.users);
          setPendingUsers(pendingData.users);
        } else {
          const errorData = await usersResponse.json();
          toast.error(errorData.message || 'You do not have permission to access this page');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Error loading users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const handleApprovalChange = async (userId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the users list if the user exists there
        setUsers(users.map(user => 
          user.id === userId ? { ...user, approvalStatus: status } : user
        ));
        
        // Remove the user from pending users list
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        
        // If approved, add the user to the main users list if not already there
        if (status === 'APPROVED' && !users.find(u => u.id === userId)) {
          const approvedUser = pendingUsers.find(u => u.id === userId);
          if (approvedUser) {
            setUsers([...users, { ...approvedUser, approvalStatus: status }]);
          }
        }
        
        toast.success(`User ${status.toLowerCase()} successfully`);
      } else {
        toast.error(data.message || `Failed to ${status.toLowerCase()} user`);
      }
    } catch (error) {
      console.error('Error updating user approval status:', error);
      toast.error('Error updating user approval status');
    }
  };

  const handleUserPermissionChange = async (userId: number, permission: 'canAccessChat' | 'canPrintReports' | 'canExportData', value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permission, value }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, [permission]: value } : user
        ));
        toast.success('User permissions updated successfully');
      } else {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, [permission]: !value } : user
        ));
        toast.error(data.message || 'Failed to update user permissions');
      }
    } catch (error) {
      console.error('Error updating user permissions:', error);
      toast.error('Error updating user permissions');
      setUsers(users.map(user => 
        user.id === userId ? { ...user, [permission]: !value } : user
      ));
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  // Filter rejected users
  const rejectedUsers = users.filter(user => user.approvalStatus === 'REJECTED');
  const activeAndPendingUsers = users.filter(user => user.approvalStatus !== 'REJECTED');

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-6">
        {rejectedUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rejected Users</CardTitle>
              <CardDescription>
                Previously rejected users that can be reactivated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                            onClick={() => handleApprovalChange(user.id, 'APPROVED')}
                          >
                            Reactivate Account
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        {pendingUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>
                New users waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                              onClick={() => handleApprovalChange(user.id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                              onClick={() => handleApprovalChange(user.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure global system features and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Vendor Chat</h3>
                    <p className="text-sm text-gray-500">
                      Enable or disable chat functionality globally
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatEnabled}
                    onCheckedChange={(checked) => handleSettingChange('chatEnabled', checked)}
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">User Management</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage user roles and permissions
                  </p>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Chat Access</TableHead>
                          <TableHead>Print Reports</TableHead>
                          <TableHead>Export Data</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                                  <SelectItem value="DECISION_MAKER">Decision Maker</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {user.approvalStatus === 'PENDING' ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                    onClick={() => handleApprovalChange(user.id, 'APPROVED')}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    onClick={() => handleApprovalChange(user.id, 'REJECTED')}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.approvalStatus === 'APPROVED' 
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {user.approvalStatus}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.canAccessChat}
                                onCheckedChange={(checked) => {
                                  handleUserPermissionChange(user.id, 'canAccessChat', checked);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.canPrintReports}
                                onCheckedChange={(checked) => {
                                  handleUserPermissionChange(user.id, 'canPrintReports', checked);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={user.canExportData}
                                onCheckedChange={(checked) => {
                                  handleUserPermissionChange(user.id, 'canExportData', checked);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-20"
                                  >
                                    Remove
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {user.name} from the system? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Direct Decision Making</h3>
                  <p className="text-sm text-gray-500">
                    Enable or disable direct decision making functionality
                  </p>
                </div>
                <Switch
                  checked={settings.directDecisionEnabled}
                  onCheckedChange={(checked) => handleSettingChange('directDecisionEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Print Reports</h3>
                  <p className="text-sm text-gray-500">
                    Enable or disable report printing functionality
                  </p>
                </div>
                <Switch
                  checked={settings.printEnabled}
                  onCheckedChange={(checked) => handleSettingChange('printEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Export Data</h3>
                  <p className="text-sm text-gray-500">
                    Enable or disable data export functionality
                  </p>
                </div>
                <Switch
                  checked={settings.exportEnabled}
                  onCheckedChange={(checked) => handleSettingChange('exportEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Database Migration</h3>
                  <p className="text-sm text-gray-500">
                    Migrate data to Azure Database
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin/data-migration')}
                  className="flex items-center gap-2"
                >
                  Manage Migration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}