import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AdminUsageManagement = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetData, setResetData] = useState({ userId: '', featureType: '', period: 'daily' });

  // Fetch usage overview
  const { data: usageData, isLoading: loadingUsage, error: usageError } = useQuery({
    queryKey: ["/api/admin/usage-overview"],
    enabled: isAuthenticated,
    retry: true,
  });

  // Fetch reset schedule
  const { data: scheduleData } = useQuery({
    queryKey: ["/api/admin/reset/schedule"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Reset usage mutation
  const resetUsageMutation = useMutation({
    mutationFn: async (data: { userId: string; featureType: string; period: string }) => {
      await apiRequest("POST", "/api/admin/usage/reset", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/usage-overview"] });
      toast({ title: "Success", description: "Usage counters reset successfully" });
      setShowResetModal(false);
      setResetData({ userId: '', featureType: '', period: 'daily' });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Manual reset mutations
  const dailyResetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/reset/daily");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/usage-overview"] });
      toast({ title: "Success", description: "Daily counters reset successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const weeklyResetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/reset/weekly");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/usage-overview"] });
      toast({ title: "Success", description: "Weekly counters reset successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const monthlyResetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/reset/monthly");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/usage-overview"] });
      toast({ title: "Success", description: "Monthly counters reset successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/reset/cleanup");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/usage-overview"] });
      toast({ title: "Success", description: "Expired restrictions cleaned up" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleResetUsage = () => {
    if (!resetData.userId || !resetData.featureType) {
      toast({ title: "Error", description: "Please select user and feature", variant: "destructive" });
      return;
    }
    resetUsageMutation.mutate(resetData);
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loadingUsage) return <div className="p-6 text-center">Loading usage data...</div>;
  if (usageError && !loadingUsage && !usageData) return <div className="p-6 text-center text-red-500">Error: {usageError.message}</div>;

  const users = usageData?.users || [];
  const limits = usageData?.limits || {};

  const featureLabels: Record<string, string> = {
    cv_job_duties: 'CV Job Duties',
    supporting_info: 'Supporting Information',
    cover_letter: 'Cover Letter',
    interview_practice: 'Interview Practice',
    qa_generator: 'QA Generator'
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usage Management</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => dailyResetMutation.mutate()}
            disabled={dailyResetMutation.isPending}
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700"
          >
            {dailyResetMutation.isPending ? 'Resetting...' : 'Reset Daily'}
          </Button>
          <Button
            onClick={() => weeklyResetMutation.mutate()}
            disabled={weeklyResetMutation.isPending}
            variant="outline"
            className="bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700"
          >
            {weeklyResetMutation.isPending ? 'Resetting...' : 'Reset Weekly'}
          </Button>
          <Button
            onClick={() => monthlyResetMutation.mutate()}
            disabled={monthlyResetMutation.isPending}
            variant="outline"
            className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600 hover:border-purple-700"
          >
            {monthlyResetMutation.isPending ? 'Resetting...' : 'Reset Monthly'}
          </Button>
          <Button
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
            variant="secondary"
            className="bg-gray-600 text-white hover:bg-gray-700"
          >
            {cleanupMutation.isPending ? 'Cleaning...' : 'Cleanup'}
          </Button>
        </div>
      </div>

      {/* Reset Schedule */}
      {scheduleData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Daily:</strong> {scheduleData.daily}<br/>
                <strong>Next:</strong> {new Date(scheduleData.nextDaily).toLocaleString()}
              </div>
              <div>
                <strong>Weekly:</strong> {scheduleData.weekly}<br/>
                <strong>Next:</strong> {new Date(scheduleData.nextWeekly).toLocaleString()}
              </div>
              <div>
                <strong>Monthly:</strong> {scheduleData.monthly}<br/>
                <strong>Next:</strong> {new Date(scheduleData.nextMonthly).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Limits Reference */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Feature Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(limits).map(([feature, limits]: [string, any]) => (
              <Card key={feature}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{featureLabels[feature] || feature.replace('_', ' ')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  Daily: {limits.daily} | Weekly: {limits.weekly} | Monthly: {limits.monthly}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Usage Statistics</CardTitle>
          <CardDescription>Track and manage user feature usage across all periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-card">
                <tr>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">CV Job Duties</th>
                  <th className="px-4 py-2 text-left">Supporting Info</th>
                  <th className="px-4 py-2 text-left">Cover Letter</th>
                  <th className="px-4 py-2 text-left">Interview Practice</th>
                  <th className="px-4 py-2 text-left">Q&A Generator</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.userId} className="border-t">
                    <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    
                    {/* CV Job Duties */}
                    <td className="px-4 py-2">
                      {user.usage.cv_job_duties ? (
                        <div className="text-sm">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(getUsagePercentage(user.usage.cv_job_duties.daily, user.usage.cv_job_duties.limits.daily))}`}>
                            {user.usage.cv_job_duties.daily}/{user.usage.cv_job_duties.limits.daily}
                          </div>
                          <div className="text-xs text-gray-500">
                            W: {user.usage.cv_job_duties.weekly}/{user.usage.cv_job_duties.limits.weekly} | 
                            M: {user.usage.cv_job_duties.monthly}/{user.usage.cv_job_duties.limits.monthly}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">0/12</span>
                      )}
                    </td>

                    {/* Supporting Info */}
                    <td className="px-4 py-2">
                      {user.usage.supporting_info ? (
                        <div className="text-sm">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(getUsagePercentage(user.usage.supporting_info.daily, user.usage.supporting_info.limits.daily))}`}>
                            {user.usage.supporting_info.daily}/{user.usage.supporting_info.limits.daily}
                          </div>
                          <div className="text-xs text-gray-500">
                            W: {user.usage.supporting_info.weekly}/{user.usage.supporting_info.limits.weekly} | 
                            M: {user.usage.supporting_info.monthly}/{user.usage.supporting_info.limits.monthly}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">0/8</span>
                      )}
                    </td>

                    {/* Cover Letter */}
                    <td className="px-4 py-2">
                      {user.usage.cover_letter ? (
                        <div className="text-sm">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(getUsagePercentage(user.usage.cover_letter.daily, user.usage.cover_letter.limits.daily))}`}>
                            {user.usage.cover_letter.daily}/{user.usage.cover_letter.limits.daily}
                          </div>
                          <div className="text-xs text-gray-500">
                            W: {user.usage.cover_letter.weekly}/{user.usage.cover_letter.limits.weekly} | 
                            M: {user.usage.cover_letter.monthly}/{user.usage.cover_letter.limits.monthly}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">0/8</span>
                      )}
                    </td>

                    {/* Interview Practice */}
                    <td className="px-4 py-2">
                      {user.usage.interview_practice ? (
                        <div className="text-sm">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(getUsagePercentage(user.usage.interview_practice.daily, user.usage.interview_practice.limits.daily))}`}>
                            {user.usage.interview_practice.daily}/{user.usage.interview_practice.limits.daily}
                          </div>
                          <div className="text-xs text-gray-500">
                            W: {user.usage.interview_practice.weekly}/{user.usage.interview_practice.limits.weekly} | 
                            M: {user.usage.interview_practice.monthly}/{user.usage.interview_practice.limits.monthly}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">0/15</span>
                      )}
                    </td>

                    {/* Q&A Generator */}
                    <td className="px-4 py-2">
                      {user.usage.qa_generator ? (
                        <div className="text-sm">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(getUsagePercentage(user.usage.qa_generator.daily, user.usage.qa_generator.limits.daily))}`}>
                            {user.usage.qa_generator.daily}/{user.usage.qa_generator.limits.daily}
                          </div>
                          <div className="text-xs text-gray-500">
                            W: {user.usage.qa_generator.weekly}/{user.usage.qa_generator.limits.weekly} | 
                            M: {user.usage.qa_generator.monthly}/{user.usage.qa_generator.limits.monthly}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">0/8</span>
                      )}
                    </td>

                    <td className="px-4 py-2">
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetModal(true);
                        }}
                        variant="link"
                        className="text-blue-600 hover:text-blue-900 p-0 h-auto"
                      >
                        Reset Usage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Reset Usage for {selectedUser.firstName} {selectedUser.lastName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feature:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={resetData.featureType}
                  onChange={(e) => setResetData({ ...resetData, featureType: e.target.value })}
                >
                  <option value="">Select Feature</option>
                  <option value="cv_job_duties">CV Job Duties</option>
                  <option value="supporting_info">Supporting Information</option>
                  <option value="cover_letter">Cover Letter</option>
                  <option value="interview_practice">Interview Practice</option>
                  <option value="qa_generator">Q&A Generator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={resetData.period}
                  onChange={(e) => setResetData({ ...resetData, period: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedUser(null);
                    setResetData({ userId: '', featureType: '', period: 'daily' });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setResetData({ ...resetData, userId: selectedUser.userId });
                    handleResetUsage();
                  }}
                  disabled={resetUsageMutation.isPending}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {resetUsageMutation.isPending ? 'Resetting...' : 'Reset'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUsageManagement;