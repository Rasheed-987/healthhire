import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  onClick: () => void;
  rightContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  iconColor,
  onClick,
  rightContent,
  bottomContent,
  children,
}: DashboardCardProps) {
  return (
    <Card 
      className="card-hover cursor-pointer h-full" 
      onClick={onClick}
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-8 h-full flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          {rightContent}
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        
        <div className="flex-grow"></div>
        
        {bottomContent && (
          <div className="bg-muted rounded-md p-3 mt-4">
            {bottomContent}
          </div>
        )}
        
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
