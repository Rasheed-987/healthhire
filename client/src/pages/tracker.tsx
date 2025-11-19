import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  BarChart3,
  Crown,
  Lock,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Trash2,
  LucideGrip,
} from "lucide-react";
import type { Application } from "@shared/schema";
import { RotatingStatsBar } from "@/components/rotating-stats-bar";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { FEATURES } from "@shared/schema";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FullscreenLoader } from "@/components/fullscreen-loader";

import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const APPLICATION_STATUSES = [
  { id: "draft", label: "Draft", color: "bg-gray-100 text-gray-800", count: 0 },
  {
    id: "applied",
    label: "Applied",
    color: "bg-blue-100 text-blue-800",
    count: 0,
  },
  {
    id: "interview",
    label: "Interview",
    color: "bg-yellow-100 text-yellow-800",
    count: 0,
  },
  {
    id: "offered",
    label: "Offered",
    color: "bg-green-100 text-green-800",
    count: 0,
  },
  {
    id: "rejected",
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    count: 0,
  },
];

// Sortable Application Card Component with Notes
function SortableApplicationCard({
  application,
}: {
  application: Application;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(application.notes || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Mutation to update notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ notes }: { notes: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/applications/${application.id}/notes`,
        { notes }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Notes Updated",
        description: "Your application notes have been saved.",
      });
      setIsEditingNotes(false);
    },
    onError: (error) => {
      console.error("Error updating notes:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ notes: notesValue });
  };

  // Mutation to delete application (no optimistic removal; rely on DB and refetch)
  const deleteApplicationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/applications/${application.id}`);
      return response.json();
    },
    onSuccess: () => {
      // After deletion, refetch from server so the DB state is authoritative
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Deleted", description: "Application deleted." });
    },
    onError: (error) => {
      console.error("Failed to delete application:", error);
      toast({ title: "Error", description: "Failed to delete application.", variant: "destructive" });
    },
  });

  const handleCancelNotes = () => {
    setNotesValue(application.notes || "");
    setIsEditingNotes(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`dark:bg-[#0C1322] rounded-lg border py-4 px-2 mb-3 hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg z-50" : ""
      }`}
      data-testid={`application-card-${application.id}`}
    >
      {/* Drag handle */}
      <div {...listeners} className="cursor-move mb-3 flex justify-center">
        <LucideGrip className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      </div>

      <div className="space-y-2">
        <h4
          className="font-semibold text-foreground truncate"
          data-testid={`text-job-title-${application.id}`}
        >
          {application.jobTitle}
        </h4>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span className="truncate">{application.employer}</span>
        </div>

        {application.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{application.location}</span>
          </div>
        )}

        {application.salary && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>{application.salary}</span>
          </div>
        )}

        {/* Notes Section */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Edit3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Notes</span>
            </div>
            
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
                className="h-6 px-2 text-xs"
                data-testid={`button-edit-notes-${application.id}`}
              >
                {application.notes ? "Edit" : "Add"}
              </Button>
            )}
          </div>
           
          {isEditingNotes ? (
            <div className="space-y-0">
              <textarea
                value={notesValue}
                onChange={(e) => {
                  const text = e.target.value;
                  const words = text.trim().split(/\s+/);
                  if (words.length <= 50) {
                    setNotesValue(text);
                  }
                }}
                placeholder="Add personal notes about this application (max 50 words)..."
                className="w-full dark:bg-[#0C1322] h-16 text-xs p-2 border border-gray-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid={`textarea-notes-${application.id}`}
              />
              <div className="text-[10px]  text-muted-foreground text-right">
                {notesValue.trim() === ""
                  ? "0"
                  : notesValue.trim().split(/\s+/).length}{" "}
                / 50 words
              </div>
              <div className="flex gap-1 pt-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={updateNotesMutation.isPending}
                  className="h-6 px-2 text-xs"
                  data-testid={`button-save-notes-${application.id}`}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelNotes}
                  className="h-6 px-2 text-xs"
                  data-testid={`button-cancel-notes-${application.id}`}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[16px]">
              {application.notes ? (
                <div
                  className="relative group"
                  title={application.notes} // shows full notes on hover (native tooltip)
                >
                  <p
                    className="
          text-xs text-gray-600 
          whitespace-pre-wrap break-words 
          line-clamp-2 
          cursor-pointer 
          transition-all
        "
                  >
                    {application.notes}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Click "Add" to add notes...
                </p>
              )}
            </div>
          )}
        </div>
          <div className="pt-2 border-t flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
           
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  deleteApplicationMutation.mutate();
                }}
                className="h-6 px-2 text-xs text-red-600"
                data-testid={`button-delete-application-${application.id}`}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        <div className="flex items-center justify-between pt-2">
          {application.appliedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(application.appliedAt)}</span>
            </div>
          )}

          {application.interviewDate && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Clock className="h-3 w-3" />
              <span>Interview: {formatDate(application.interviewDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  status,
  applications,
}: {
  status: (typeof APPLICATION_STATUSES)[0];
  applications: Application[];
}) {
  const filteredApplications =
    applications?.filter((app: Application) => app?.status === status?.id) ||
    [];

  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${status.id}`,
  });

  const style = {
    backgroundColor: isOver ? "rgba(59, 130, 246, 0.1)" : undefined,
    borderColor: isOver ? "rgb(59, 130, 246)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`xl:min-h-[300px] bg-muted/30 rounded-lg py-4 border-2 border-dashed transition-colors ${
        isOver ? "border-blue-500" : "border-transparent"
      }`}
      data-testid={`column-${status.id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{status.label}</h3>
          <Badge variant="secondary" data-testid={`badge-count-${status.id}`}>
            {filteredApplications.length}
          </Badge>
        </div>
      </div>

      <SortableContext
        items={filteredApplications.map((app) => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <SortableApplicationCard
              key={application.id}
              application={application}
            />
          ))}
          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No applications</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// Add Application Form Component
function AddApplicationForm({
  open,
  onOpenChange,
  isPaid,
  currentApplicationCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPaid: boolean;
  currentApplicationCount: number;
}) {
  const [formData, setFormData] = useState({
    jobTitle: "",
    employer: "",
    location: "",
    salary: "",
    status: "draft" as const,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addApplication = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/weekly-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Application Added",
        description: "Your job application has been added to the tracker.",
      });
      setFormData({
        jobTitle: "",
        employer: "",
        location: "",
        salary: "",
        status: "draft",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check free tier limit
    if (!isPaid && currentApplicationCount >= 3) {
      toast({
        title: "Limit Reached",
        description:
          "Free users can track up to 3 applications. Upgrade to track unlimited applications.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.jobTitle || !formData.employer) {
      toast({
        title: "Missing Information",
        description: "Please fill in job title and employer.",
        variant: "destructive",
      });
      return;
    }
    addApplication.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="add-application-dialog">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
          <DialogDescription>
            Track a new job application in your kanban board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
              placeholder="e.g., Band 6 Staff Nurse"
              data-testid="input-job-title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer">Employer *</Label>
            <Input
              id="employer"
              value={formData.employer}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, employer: e.target.value }))
              }
              placeholder="e.g., London NHS Foundation Trust"
              data-testid="input-employer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="e.g., London, UK"
              data-testid="input-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary Range</Label>
            <Input
              id="salary"
              value={formData.salary}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, salary: e.target.value }))
              }
              placeholder="e.g., £28,407 - £34,581"
              data-testid="input-salary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addApplication.isPending}
              data-testid="button-add-application"
            >
              {addApplication.isPending ? "Adding..." : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ApplicationTracker() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { canAccessFeature, isPaid } = useSubscription();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const {
    data: applications = [],
    isLoading: isApplicationsLoading,
    error,
  } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Handle errors with useEffect
  useEffect(() => {
    if (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Update application status mutation
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/applications/${id}`, {
        status,
      });
      return response.json();
    },
    // Optimistic update for instant UI feedback
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/applications"] });
      const previous = queryClient.getQueryData<Application[]>([
        "/api/applications",
      ]);
      queryClient.setQueryData<Application[] | undefined>(
        ["/api/applications"],
        (old) =>
          (old || []).map((app) =>
            app.id === id
              ? { ...app, status: status as Application["status"] }
              : app
          )
      );
      return { previous } as { previous?: Application[] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/weekly-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/applications"], context.previous);
      }
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    },
  });

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: { active: { id: string | number } }) {
    setActiveId(event.active.id as string);
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Check if dropped on a droppable column
      if (over.id.toString().startsWith("droppable-")) {
        const statusId = over.id.toString().replace("droppable-", "");
        const targetStatus = APPLICATION_STATUSES.find(
          (status) => status.id === statusId
        );

        if (targetStatus) {
          // Immediate optimistic update to avoid snap-back animation
          queryClient.setQueryData<Application[] | undefined>(
            ["/api/applications"],
            (old) =>
              (old || []).map((app) =>
                app.id === (active.id as string)
                  ? { ...app, status: targetStatus.id as Application["status"] }
                  : app
              )
          );
          updateApplicationStatus.mutate({
            id: active.id as string,
            status: targetStatus.id,
          });
        }
      }
      // Check if dropped on another application (for reordering within same column)
      else {
        const targetApp = applications?.find(
          (app: Application) => app.id === over.id
        );
        if (targetApp) {
          const sourceApp = applications?.find(
            (app: Application) => app.id === active.id
          );
          // Only update if moving to different status
          if (sourceApp && sourceApp.status !== targetApp.status) {
            // Immediate optimistic update to avoid snap-back animation
            queryClient.setQueryData<Application[] | undefined>(
              ["/api/applications"],
              (old) =>
                (old || []).map((app) =>
                  app.id === (active.id as string)
                    ? {
                        ...app,
                        status: targetApp.status as Application["status"],
                      }
                    : app
                )
            );
            updateApplicationStatus.mutate({
              id: active.id as string,
              status: targetApp.status,
            });
          }
        }
      }
    }
    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  // Calculate statistics
  const stats = {
    total: applications?.length || 0,
    applied:
      applications?.filter((app: Application) => app.status === "applied")
        .length || 0,
    interviews:
      applications?.filter((app: Application) => app.status === "interview")
        .length || 0,
    offers:
      applications?.filter((app: Application) => app.status === "offered")
        .length || 0,
    successRate:
      applications?.length > 0
        ? Math.round(
            ((applications?.filter(
              (app: Application) => app.status === "offered"
            ).length || 0) /
              applications.length) *
              100
          )
        : 0,
  };

  // Check if user has reached the free tier limit
  const hasReachedFreeLimit = !isPaid && stats.total >= 3;

  if (isLoading || isApplicationsLoading) {
    return <FullscreenLoader show={isLoading || isApplicationsLoading} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="tracker-page">
      <Header />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              📋 Job Tracker {!isPaid && "(Limited Access)"}
              {!isPaid && (
                <Crown className="inline h-6 w-6 text-yellow-600 ml-2" />
              )}
            </h1>
            <p className="text-muted-foreground">
              {isPaid
                ? "Manage your NHS job applications with our kanban board and analytics dashboard."
                : "Track up to 3 job applications - upgrade for unlimited tracking"}
            </p>
            {!isPaid && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="text-yellow-700 border-yellow-300 bg-yellow-50"
                >
                  Free Tier: {stats.total}/3 applications used
                </Badge>
              </div>
            )}
          </div>
          <Button
            onClick={
              !hasReachedFreeLimit ? () => setIsAddDialogOpen(true) : undefined
            }
            disabled={hasReachedFreeLimit}
            className="flex items-center gap-2"
            data-testid="button-add-new-application"
          >
            <Plus className="h-4 w-4" />
            {hasReachedFreeLimit
              ? "Add Application (Limit Reached)"
              : "Add Application"}
            {hasReachedFreeLimit && <Lock className="inline h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Weekly Activity Stats Bar */}
        <RotatingStatsBar />

        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-primary"
                data-testid="stat-total-applications"
              >
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-blue-600"
                data-testid="stat-applied"
              >
                {stats.applied}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-yellow-600"
                data-testid="stat-interviews"
              >
                {stats.interviews}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-green-600"
                data-testid="stat-offers"
              >
                {stats.offers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-accent"
                data-testid="stat-success-rate"
              >
                {`${stats.successRate}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        {true ? (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-3"
              data-testid="kanban-board"
            >
              {APPLICATION_STATUSES.map((status) => (
                <DroppableColumn
                  key={status.id}
                  status={status}
                  applications={applications || []}
                />
              ))}
            </div>
            <DragOverlay>
              {(() => {
                const app = (applications || []).find(
                  (a: Application) => a.id === activeId
                );
                if (!app) return null;
                return (
                  <div className="dark:bg-[#0C1322] rounded-lg border py-4 px-2 mb-3 shadow-xl opacity-90">
                    <h4 className="font-semibold text-foreground truncate">
                      {app.jobTitle}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span className="truncate">{app.employer}</span>
                    </div>
                    {app.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="truncate">{app.location}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </DragOverlay>
          </DndContext>
        ) : (
          <>
            {/* Preview Kanban Board */}
            <div
              className="grid grid-cols-1 lg:grid-cols-5 gap-6 opacity-60 mb-6"
              data-testid="kanban-board-preview"
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Draft</CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-800"
                    >
                      2
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-white rounded-lg border p-3 cursor-not-allowed">
                    <h4 className="font-semibold text-sm">
                      Band 6 Staff Nurse
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      London NHS Trust
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 cursor-not-allowed">
                    <h4 className="font-semibold text-sm">
                      Clinical Specialist
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Birmingham Hospital
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Applied
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-white rounded-lg border p-3 cursor-not-allowed">
                    <h4 className="font-semibold text-sm">Senior Nurse</h4>
                    <p className="text-xs text-muted-foreground">
                      Manchester Trust
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 cursor-not-allowed">
                    <h4 className="font-semibold text-sm">Ward Manager</h4>
                    <p className="text-xs text-muted-foreground">
                      Leeds Teaching
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Interview
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      2
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-white rounded-lg border p-3 cursor-not-allowed">
                    <h4 className="font-semibold text-sm">
                      Band 7 Charge Nurse
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Oxford Health
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Offered
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-white rounded-lg border p-3 cursor-not-allowed">
                    <h4 className="font-semibold text-sm">Staff Nurse</h4>
                    <p className="text-xs text-muted-foreground">
                      Cambridge Trust
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Rejected
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800"
                    >
                      0
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No applications</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Prompt */}
            <UpgradePrompt feature="Job Tracker" />
          </>
        )}

        {/* Add Application Dialog */}
        <AddApplicationForm
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          isPaid={isPaid}
          currentApplicationCount={stats.total}
        />

        {/* Free Tier Limit Warning */}
        {hasReachedFreeLimit && (
          <div className="mb-6">
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Crown className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Free Tier Limit Reached
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You're tracking 3/3 applications on the free tier. Upgrade
                      to track unlimited job applications with advanced
                      analytics and features.
                    </p>
                    <Button
                      onClick={() => setLocation("/pricing")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                      data-testid="button-upgrade-tracker-limit"
                    >
                      Upgrade Now - £70 One-Time
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
