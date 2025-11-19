import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  BarChart3,
  FileText,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  Calendar,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  Save,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Crown,
  Star,
  AlertTriangle,
  Database,
  Activity,
  UserX,
  RotateCcw,
  Mail,
  Ban,
  Check,
  X,
  Gauge,
  UserPlus,
  ChevronDown,
  BookOpen,
  Newspaper,
  HelpCircle,
  Video,
  CheckCircle,
  Book,
  User as UserIcon,
} from "lucide-react";
import AdminUsageManagement from "@/components/admin/UsageManagement";
import UserInvitation from "@/components/admin/UserInvitation";
import AdminContentManager, { resourceSchema, newsSchema, supportSchema } from "@/components/admin/AdminContentManager";

// Types
interface AdminDashboardStats {
  totalUsers: string;
  freeUsers: string;
  premiumUsers: string;
  activeUsers: string;
  adminInfo?: {
    role: string;
    isMasterAdmin: boolean;
    isSecondaryAdmin: boolean;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  adminRole?: string;
  subscriptionStatus: string;
  createdAt: string;
  lastLoginAt?: string;
  profileCompletion?: number;
  type: "applicant" | "employer";
  approvalStatus: "pending" | "approved" | "rejected";
  approvalDate?: string;
  isSuspended?: boolean;
  suspendedBy?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  previousSubscriptionStatus?: string;
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface SystemHealth {
  dbStatus: string;
  aiServiceStatus: string;
  paymentServiceStatus: string;
  errorCount: number;
  avgResponseTime: number;
  uptime: string;
}

interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalApplications: number;
  documentsGenerated: number;
  interviewsCompleted: number;
  avgProfileCompletion: number;
  revenueThisMonth: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter states
  const [userFilter, setUserFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAction, setUserAction] = useState<string | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Suspension dialog state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");

  // Check if user is admin
  // Use on401: "returnNull" to handle unauthenticated state gracefully
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  const isUserAdmin =
    currentUser &&
    typeof currentUser === "object" &&
    "isAdmin" in currentUser &&
    currentUser.isAdmin;

  // Admin data queries
  const { data: dashboardStats } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!isUserAdmin,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!isUserAdmin,
  });

  const { data: systemHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system-health"],
    enabled: !!isUserAdmin,
  });

  const { data: gdprRequests } = useQuery<{ requests: any[] }>({
    queryKey: ["/api/admin/gdpr-requests"],
    enabled: !!isUserAdmin,
  });

  const { data: analytics } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: !!isUserAdmin,
  });

  // Fetch resources
  const { data: resources } = useQuery<any[]>({
    queryKey: ["/api/admin/resources"],
    enabled: !!isUserAdmin,
  });

  // Fetch news
  const { data: news } = useQuery<any[]>({
    queryKey: ["/api/admin/news"],
    enabled: !!isUserAdmin,
  });

  // Fetch support content
  const { data: support } = useQuery<any[]>({
    queryKey: ["/api/admin/support"],
    enabled: !!isUserAdmin,
  });

  // User management mutations
  const updateEmployerStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: string;
      status: "approved" | "rejected";
    }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/approval`, {
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Employer status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async ({
      userId,
      adminRole,
    }: {
      userId: string;
      adminRole: string;
    }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/make-admin`, {
        adminRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User admin status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/users/${userId}/revoke-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin access revoked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/suspend`, {
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User suspended successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/users/${userId}/unsuspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User unsuspended successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete confirmation handlers
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Suspension dialog handlers
  const handleSuspendClick = (user: User) => {
    setUserToSuspend(user);
    setSuspensionReason("");
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = () => {
    if (userToSuspend) {
      suspendUserMutation.mutate({
        userId: userToSuspend.id,
        reason: suspensionReason || undefined,
      });
      setSuspendDialogOpen(false);
      setUserToSuspend(null);
      setSuspensionReason("");
    }
  };

  const handleSuspendCancel = () => {
    setSuspendDialogOpen(false);
    setUserToSuspend(null);
    setSuspensionReason("");
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: any;
    }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setIsEditingUser(false);
      setEditedUser({});
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit user handlers
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      type: user.type,
      subscriptionStatus: user.subscriptionStatus,
      approvalStatus: user.approvalStatus,
    });
    setIsEditingUser(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    const updates: any = {};

    // Only include changed fields
    if (editedUser.firstName !== selectedUser.firstName) {
      updates.firstName = editedUser.firstName;
    }
    if (editedUser.lastName !== selectedUser.lastName) {
      updates.lastName = editedUser.lastName;
    }
    if (editedUser.email !== selectedUser.email) {
      updates.email = editedUser.email;
    }
    if (editedUser.type !== selectedUser.type) {
      updates.type = editedUser.type;
    }
    if (editedUser.subscriptionStatus !== selectedUser.subscriptionStatus) {
      updates.subscriptionStatus = editedUser.subscriptionStatus;
    }
    if (editedUser.approvalStatus !== selectedUser.approvalStatus) {
      updates.approvalStatus = editedUser.approvalStatus;
    }

    if (Object.keys(updates).length > 0) {
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    } else {
      setIsEditingUser(false);
      setEditedUser({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditingUser(false);
    setEditedUser({});
  };

  const updateGdprRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      adminNotes,
    }: {
      requestId: string;
      status: string;
      adminNotes?: string;
    }) => {
      await apiRequest("PATCH", `/api/admin/gdpr-requests/${requestId}`, {
        status,
        adminNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gdpr-requests"] });
      toast({
        title: "Success",
        description: "GDPR request updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter functions
  const filteredUsers =
    users?.filter(
      (user) =>
        user.email.toLowerCase().includes(userFilter.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(userFilter.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(userFilter.toLowerCase())
    ) || [];

  // Show loading until we know user info
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="text-muted-foreground text-sm">
            Loading admin dashboard...
          </span>
        </div>
      </div>
    );
  }

  // Wait until user data finishes loading before showing access checks
  if (isUserLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="text-muted-foreground text-sm">
            Loading admin dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You don't have permission to access this area
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="w-full"
              data-testid="admin-login-button"
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl font-bold flex items-center gap-2"
                data-testid="admin-title"
              >
                <Shield className="h-8 w-8 text-primary" />
                Admin Control Center
              </h1>
              <p className="text-muted-foreground mt-2">
                Complete platform management and control
              </p>
            </div>
            {dashboardStats?.adminInfo && (
              <Badge variant="outline" className="flex items-center gap-2">
                {dashboardStats.adminInfo.isMasterAdmin ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Star className="h-4 w-4 text-blue-500" />
                )}
                {dashboardStats.adminInfo.role.replace("_", " ").toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.freeUsers || 0} free,{" "}
                {dashboardStats?.premiumUsers || 0} premium
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.activeUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-applications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.totalApplications || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total submitted</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-documents">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.documentsGenerated || 0}
              </div>
              <p className="text-xs text-muted-foreground">AI generated</p>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="users"
          className="space-y-6"
          data-testid="admin-tabs"
        >
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="invitations" data-testid="tab-invitations">
              <UserPlus className="h-4 w-4 mr-2" />
              User Invitations
            </TabsTrigger>
            <TabsTrigger value="usage" data-testid="tab-usage">
              <Gauge className="h-4 w-4 mr-2" />
              Usage Limits
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">
              <Database className="h-4 w-4 mr-2" />
              Data & GDPR
            </TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system">
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </TabsTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Dynamic Content
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <TabsTrigger value="resources" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Resources
                  </TabsTrigger>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <TabsTrigger value="news" className="w-full justify-start">
                    <Newspaper className="h-4 w-4 mr-2" />
                    News
                  </TabsTrigger>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <TabsTrigger value="support" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Support
                  </TabsTrigger>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user accounts, permissions, and access levels
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-64"
                      data-testid="input-user-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.isAdmin && (
                              <Badge variant="outline" className="text-primary">
                                <Shield className="h-3 w-3 mr-1" />
                                {user.adminRole?.replace("_", " ") || "Admin"}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {user.isSuspended ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : (
                              <Badge
                                variant={
                                  user.subscriptionStatus === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {user.subscriptionStatus === "paid"
                                  ? "Premium"
                                  : "Free"}
                              </Badge>
                            )}
                            {user.type === "employer" && (
                              <Badge
                                variant={
                                  user.approvalStatus === "approved"
                                    ? "default"
                                    : user.approvalStatus === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {user.approvalStatus.charAt(0).toUpperCase() +
                                  user.approvalStatus.slice(1)}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              Profile: {user.profileCompletion || 0}%
                            </Badge>
                            {user.lastLoginAt && (
                              <Badge variant="outline">
                                Last:{" "}
                                {new Date(
                                  user.lastLoginAt
                                ).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            data-testid={`user-details-${user.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            data-testid={`user-edit-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Employer Approval/Rejection Buttons */}
                          {user.type === "employer" &&
                            user.approvalStatus === "pending" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    updateEmployerStatusMutation.mutate({
                                      userId: user.id,
                                      status: "approved",
                                    })
                                  }
                                  data-testid={`approve-employer-${user.id}`}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    updateEmployerStatusMutation.mutate({
                                      userId: user.id,
                                      status: "rejected",
                                    })
                                  }
                                  data-testid={`reject-employer-${user.id}`}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                          {dashboardStats?.adminInfo?.isMasterAdmin && (
                            <Button
                              variant={user.isAdmin ? "destructive" : "default"}
                              size="sm"
                              onClick={() => {
                                if (user.isAdmin) {
                                  revokeAdminMutation.mutate(user.id);
                                } else {
                                  makeAdminMutation.mutate({
                                    userId: user.id,
                                    adminRole: "secondary_admin",
                                  });
                                }
                              }}
                              disabled={
                                makeAdminMutation.isPending ||
                                revokeAdminMutation.isPending
                              }
                              data-testid={`${
                                user.isAdmin ? "revoke" : "make"
                              }-admin-${user.id}`}
                            >
                              {user.isAdmin ? (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            variant={user.isSuspended ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (user.isSuspended) {
                                unsuspendUserMutation.mutate(user.id);
                              } else {
                                handleSuspendClick(user);
                              }
                            }}
                            data-testid={`${
                              user.isSuspended ? "unsuspend" : "suspend"
                            }-user-${user.id}`}
                          >
                            {user.isSuspended ? (
                              <>
                                <Unlock className="h-4 w-4 mr-1" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </>
                            )}
                          </Button>

                          {dashboardStats?.adminInfo?.isMasterAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              data-testid={`delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <UserInvitation />
          </TabsContent>

          {/* Usage Limits Tab */}
          <TabsContent value="usage" className="space-y-6">
            <AdminUsageManagement />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Profile Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.avgProfileCompletion || 0}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Interviews Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.interviewsCompleted || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Documents Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.documentsGenerated || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    £{analytics?.revenueThisMonth || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {isEditingUser ? "Edit User" : "User Details"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setIsEditingUser(false);
                        setEditedUser({});
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingUser ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-firstName">First Name</Label>
                          <Input
                            id="edit-firstName"
                            value={editedUser.firstName || ""}
                            onChange={(e) =>
                              setEditedUser((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-lastName">Last Name</Label>
                          <Input
                            id="edit-lastName"
                            value={editedUser.lastName || ""}
                            onChange={(e) =>
                              setEditedUser((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            placeholder="Enter last name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editedUser.email || ""}
                            onChange={(e) =>
                              setEditedUser((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-userType">User Type</Label>
                          <Select
                            value={editedUser.type || "applicant"}
                            onValueChange={(value: "applicant" | "employer") =>
                              setEditedUser((prev) => ({
                                ...prev,
                                type: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select user type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applicant">
                                Healthcare Professional
                              </SelectItem>
                              <SelectItem value="employer">Employer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-subscription">
                            Subscription Status
                          </Label>
                          <Select
                            value={editedUser.subscriptionStatus || "free"}
                            onValueChange={(value: "free" | "paid") =>
                              setEditedUser((prev) => ({
                                ...prev,
                                subscriptionStatus: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subscription status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="paid">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {editedUser.type === "employer" && (
                          <div>
                            <Label htmlFor="edit-approval">
                              Approval Status
                            </Label>
                            <Select
                              value={editedUser.approvalStatus || "pending"}
                              onValueChange={(
                                value: "pending" | "approved" | "rejected"
                              ) =>
                                setEditedUser((prev) => ({
                                  ...prev,
                                  approvalStatus: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select approval status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">
                                  Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleSaveUser}
                          disabled={updateUserMutation.isPending}
                        >
                          {updateUserMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input value={selectedUser.email} readOnly />
                        </div>
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={`${selectedUser.firstName || ""} ${
                              selectedUser.lastName || ""
                            }`}
                            readOnly
                          />
                        </div>
                        <div>
                          <Label>User Type</Label>
                          <Input
                            value={
                              selectedUser.type === "applicant"
                                ? "Healthcare Professional"
                                : "Employer"
                            }
                            readOnly
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          {selectedUser.isSuspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge
                              variant={
                                selectedUser.subscriptionStatus === "paid"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {selectedUser.subscriptionStatus === "paid"
                                ? "Premium"
                                : "Free"}
                            </Badge>
                          )}
                        </div>
                        {selectedUser.isSuspended && (
                          <div>
                            <Label>Suspended At</Label>
                            <div className="text-sm">
                              {selectedUser.suspendedAt
                                ? new Date(
                                    selectedUser.suspendedAt
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </div>
                          </div>
                        )}
                        {selectedUser.suspensionReason && (
                          <div>
                            <Label>Suspension Reason</Label>
                            <div className="text-sm">
                              {selectedUser.suspensionReason}
                            </div>
                          </div>
                        )}
                        {selectedUser.type === "employer" && (
                          <div>
                            <Label>Approval Status</Label>
                            <Badge
                              variant={
                                selectedUser.approvalStatus === "approved"
                                  ? "default"
                                  : selectedUser.approvalStatus === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {selectedUser.approvalStatus
                                ?.charAt(0)
                                .toUpperCase() +
                                selectedUser.approvalStatus?.slice(1) ||
                                "Pending"}
                            </Badge>
                          </div>
                        )}
                        <div>
                          <Label>Profile Completion</Label>
                          <div className="text-sm font-medium">
                            {selectedUser.profileCompletion || 0}%
                          </div>
                        </div>
                        <div>
                          <Label>Created At</Label>
                          <div className="text-sm">
                            {new Date(
                              selectedUser.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <Label>Last Login</Label>
                          <div className="text-sm">
                            {selectedUser.lastLoginAt
                              ? new Date(
                                  selectedUser.lastLoginAt
                                ).toLocaleDateString()
                              : "Never"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={() => handleEditUser(selectedUser)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </Button>
                        {!selectedUser.isSuspended && (
                          <Button
                            onClick={() =>
                              updateUserMutation.mutate({
                                userId: selectedUser.id,
                                updates: {
                                  subscriptionStatus:
                                    selectedUser.subscriptionStatus === "paid"
                                      ? "free"
                                      : "paid",
                                },
                              })
                            }
                          >
                            {selectedUser.subscriptionStatus === "paid"
                              ? "Remove Premium"
                              : "Grant Premium"}
                          </Button>
                        )}
                        <Button
                          variant={
                            selectedUser.isSuspended ? "default" : "outline"
                          }
                          onClick={() => {
                            if (selectedUser.isSuspended) {
                              unsuspendUserMutation.mutate(selectedUser.id);
                            } else {
                              handleSuspendClick(selectedUser);
                            }
                          }}
                        >
                          {selectedUser.isSuspended ? (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Unsuspend User
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend User
                            </>
                          )}
                        </Button>
                        {dashboardStats?.adminInfo?.isMasterAdmin && (
                          <Button
                            variant={
                              selectedUser.isAdmin ? "destructive" : "default"
                            }
                            onClick={() => {
                              if (selectedUser.isAdmin) {
                                revokeAdminMutation.mutate(selectedUser.id);
                              } else {
                                makeAdminMutation.mutate({
                                  userId: selectedUser.id,
                                  adminRole: "secondary_admin",
                                });
                              }
                            }}
                            disabled={
                              makeAdminMutation.isPending ||
                              revokeAdminMutation.isPending
                            }
                          >
                            {selectedUser.isAdmin ? (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Remove Admin Access
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Grant Admin Access
                              </>
                            )}
                          </Button>
                        )}
                        {dashboardStats?.adminInfo?.isMasterAdmin && (
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteClick(selectedUser)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          


          {/* Data & GDPR Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>GDPR Requests</CardTitle>
                  <CardDescription>
                    Manage data subject requests and compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Pending Requests</span>
                    <Badge variant="secondary">
                      {gdprRequests?.requests?.filter(
                        (r) => r.status === "pending"
                      ).length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed This Month</span>
                    <Badge variant="outline">
                      {gdprRequests?.requests?.filter((r) => {
                        if (!r.completedDate) return false;
                        const completedDate = new Date(r.completedDate);
                        const now = new Date();
                        return (
                          completedDate.getMonth() === now.getMonth() &&
                          completedDate.getFullYear() === now.getFullYear()
                        );
                      }).length || 0}
                    </Badge>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All User Data
                  </Button>
                </CardContent>
              </Card>

              {/* GDPR Requests List */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent GDPR Requests</CardTitle>
                  <CardDescription>
                    Review and manage user data rights requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gdprRequests?.requests?.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                request.status === "pending"
                                  ? "secondary"
                                  : request.status === "completed"
                                  ? "default"
                                  : request.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {request.status}
                            </Badge>
                            <span className="font-medium">
                              {request.type.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {request.userEmail} • {request.referenceId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(
                              request.submittedDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateGdprRequestMutation.mutate({
                                    requestId: request.id,
                                    status: "completed",
                                    adminNotes:
                                      "Request approved and completed",
                                  })
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  updateGdprRequestMutation.mutate({
                                    requestId: request.id,
                                    status: "rejected",
                                    adminNotes: "Request rejected",
                                  })
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No GDPR requests found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Analytics</CardTitle>
                  <CardDescription>
                    Storage usage and data insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Users</span>
                    <span className="font-medium">
                      {dashboardStats?.totalUsers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Profiles</span>
                    <span className="font-medium">
                      {analytics?.activeUsers || 0}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Database Statistics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Real-time system health monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database</span>
                      <Badge
                        variant={
                          systemHealth?.dbStatus === "healthy"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {systemHealth?.dbStatus || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI Service</span>
                      <Badge
                        variant={
                          systemHealth?.aiServiceStatus === "healthy"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {systemHealth?.aiServiceStatus || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment System</span>
                      <Badge
                        variant={
                          systemHealth?.paymentServiceStatus === "healthy"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {systemHealth?.paymentServiceStatus || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>System Uptime</span>
                      <span className="text-sm font-medium">
                        {systemHealth?.uptime || "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    System performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Error Count (24h)</span>
                      <Badge
                        variant={
                          !systemHealth?.errorCount ||
                          systemHealth.errorCount < 10
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {systemHealth?.errorCount || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Avg Response Time</span>
                      <span className="text-sm font-medium">
                        {systemHealth?.avgResponseTime || 0}ms
                      </span>
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Error Logs
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Activity className="h-4 w-4 mr-2" />
                      View System Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <AdminContentManager
              contentType="resources"
              title="Admin Resource Manager"
              description="Manage learning resources, guides, and documentation"
              data={resources || []}
              isLoading={false}
              schema={resourceSchema}
              iconOptions={[
                { name: "guide", label: "Guide", icon: FileText },
                { name: "video", label: "Video", icon: Video },
              ]}
              apiEndpoint="/api/admin/resources"
              queryKey={["/api/admin/resources"]}
              renderCustomFields={(form, editingItem, selectedFile, handleFileChange) => (
                <>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select resource type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="file">File (PDF/DOCX)</SelectItem>
                            <SelectItem value="video">Video (YouTube/Vimeo)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("type") === "file" && (
                    <div>
                      <Label>Upload File {!editingItem && "*"}</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="border rounded-lg p-2 w-full"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                      {editingItem?.fileUrl && !selectedFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Current file: {editingItem.title || 'Uploaded file'}
                        </p>
                      )}
                    </div>
                  )}

                  {form.watch("type") === "video" && (
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://youtube.com/..."
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
              renderItemBadges={(item) => (
                <>
                  <Badge variant="outline" className="text-xs">
                    {item.type === 'file' ? 'File' : 'Video'}
                  </Badge>
                  {item.createdAt && (
                    <Badge variant="outline" className="text-xs">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </Badge>
                  )}
                </>
              )}
              handleFileUpload={async (file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileType', 'resource_file');
                
                const response = await apiRequest("POST", "/api/admin/resources/upload", formData);
                return response.json();
              }}
            />
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <AdminContentManager
              contentType="news"
              title="News & Announcements"
              description="Manage platform news, updates, and announcements"
              data={news || []}
              isLoading={false}
              schema={newsSchema}
              iconOptions={[
                { name: "news", label: "News", icon: Newspaper },
                { name: "announcement", label: "Announcement", icon: HelpCircle },
                { name: "update", label: "Update", icon: CheckCircle },
              ]}
              apiEndpoint="/api/admin/news"
              queryKey={["/api/admin/news"]}
              renderCustomFields={(form) => (
                <>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Platform Update, Pay & Benefits and Immigration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. feature" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="important">Important</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="readTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Read Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 2 min read" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter the full news content"
                            className="w-full h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publishDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publish Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              renderItemBadges={(item) => (
                <>
                  {item.publishDate && (
                    <Badge variant="outline" className="text-xs">
                      Publish: {new Date(item.publishDate).toLocaleDateString()}
                    </Badge>
                  )}
                  {item.createdAt && (
                    <Badge variant="outline" className="text-xs">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </Badge>
                  )}
                </>
              )}
            />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <AdminContentManager
              contentType="support"
              title="Support Management"
              description="Manage support content, FAQs, and help documentation"
              data={support || []}
              isLoading={false}
              schema={supportSchema}
              iconOptions={[
                // Fallback options (dynamic set is provided in the manager based on category)
                { name: "profile", label: "Profile", icon: UserIcon },
                { name: "search", label: "Search", icon: Search },
                { name: "documents", label: "Documents", icon: FileText },
              ]}
              apiEndpoint="/api/admin/support"
              queryKey={["/api/admin/support"]}
              renderCustomFields={(form) => (
                <>
                  {/* Category used for grouping on Support page */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select support category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field}: any) => (
                      <FormItem>
                        <FormLabel>Content Items *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value?.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const newContent = [...(field.value || [])];
                                    newContent[index] = e.target.value;
                                    field.onChange(newContent);
                                  }}
                                  placeholder={`Content item ${index + 1}`}
                                  className="flex-1"
                                />
                                {field.value.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newContent = field.value.filter((_, i) => i !== index);
                                      field.onChange(newContent);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                field.onChange([...(field.value || []), ""]);
                              }}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Content Item
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              renderItemBadges={(item) => (
                <>
                  <Badge variant="default" className="text-xs capitalize">
                    {item.category || "general"}
                  </Badge>
                  {item.createdAt && (
                    <Badge variant="outline" className="text-xs">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </Badge>
                  )}
                </>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone and will permanently remove:
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Name:</strong> {userToDelete.firstName}{" "}
                    {userToDelete.lastName}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Email:</strong> {userToDelete.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Type:</strong> {userToDelete.type}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong> {userToDelete.subscriptionStatus}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm text-destructive">
                    <strong>Warning:</strong> This will delete all user data
                    including applications, documents, interview sessions, and
                    usage tracking data.
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspension Confirmation Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Suspend User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend this user? They will be unable to
              access their account until unsuspended.
            </DialogDescription>
          </DialogHeader>

          {userToSuspend && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Name:</strong> {userToSuspend.firstName}{" "}
                    {userToSuspend.lastName}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Email:</strong> {userToSuspend.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Type:</strong> {userToSuspend.type}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong> {userToSuspend.subscriptionStatus}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="suspension-reason">
                  Suspension Reason (Optional)
                </Label>
                <Textarea
                  id="suspension-reason"
                  placeholder="Enter reason for suspension..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm text-destructive">
                    <strong>Warning:</strong> This will immediately suspend the
                    user's account and log them out of all sessions.
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleSuspendCancel}
              disabled={suspendUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendConfirm}
              disabled={suspendUserMutation.isPending}
            >
              {suspendUserMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suspending...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
