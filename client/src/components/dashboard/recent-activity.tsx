import { formatDistanceToNow } from "date-fns";
import type { Application } from "@shared/schema";

interface RecentActivityProps {
  applications: Application[];
}

const statusColors: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground",
  applied: "bg-secondary/10 text-secondary",
  interview: "bg-accent/10 text-accent", 
  offered: "bg-green-100 text-green-800",
  rejected: "bg-destructive/10 text-destructive"
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  applied: "Applied", 
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected"
};

export default function RecentActivity({ applications }: RecentActivityProps) {
  if (!applications || applications.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8" data-testid="recent-activity">
        <h3 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No recent activity yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start by completing your profile or applying to your first job
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8 mb-8" data-testid="recent-activity">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
        <button 
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {/* View all activity logic would go here */}}
          data-testid="button-view-all"
        >
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {applications.slice(0, 3).map((application) => (
          <div key={application.id} className="flex items-center space-x-4" data-testid={`activity-${application.id}`}>
            {/* NHS-themed icon placeholder */}
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground" data-testid={`text-job-title-${application.id}`}>
                Applied to {application.jobTitle}
              </p>
              <p className="text-xs text-muted-foreground" data-testid={`text-employer-${application.id}`}>
                {application.employer} • {formatDistanceToNow(new Date(application.createdAt || new Date()), { addSuffix: true })}
              </p>
            </div>
            <div 
              className={`px-3 py-1 text-xs rounded-full ${statusColors[application.status] || statusColors.draft}`}
              data-testid={`status-${application.id}`}
            >
              {statusLabels[application.status] || 'Unknown'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
