import { Button } from "@/components/ui/button";
import { LucideIcon, Crown } from "lucide-react";
import { useLocation } from "wouter";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";

interface SectionCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  value?: number | string | null;
  label?: string | null;
  valueColor?: string | null;
  actionText: string;
  actionSubtext: string;
  href: string;
  isPremium?: boolean;
  feature?: string | null;
}

export default function SectionCard({
  id,
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  value,
  valueColor,
  actionText,
  actionSubtext,
  href,
  isPremium = false,
  feature = null
}: SectionCardProps) {
  const [, setLocation] = useLocation();
  const { isPaid } = useSubscription();
  
  const isLocked = isPremium && !isPaid;
  
  const handleCardClick = () => {
    // Allow navigation to all pages - locked features will show preview modes
    const routeMap: { [key: string]: string } = {
      '/profile': '/profile',
      '/jobs': '/jobs', 
      '/documents': '/documents',
      '/resources': '/resources',
      '/practice': '/interview-practice',
      '/qa': '/qa-generator',
      '/tracker': '/tracker',
      '/news': '/news'
    };
    
    const actualRoute = routeMap[href] || href;
    setLocation(actualRoute);
  };

  const handleButtonClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    // Execute action logic would go here
  };

  return (
    <div 
      className={`group relative cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-full ${
        isLocked ? 'opacity-75' : ''
      }`}
      onClick={handleCardClick}
      data-testid={`card-${id}`}
    >
      {/* Background with gradient and glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-800/80 dark:to-gray-900/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300"></div>
      
      {/* Animated background glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl"></div>
      </div>
      
      {/* Card content */}
      <div className="relative p-8 h-full flex flex-col">
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-6 right-6">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm transition-all duration-300 ${
              isPaid 
                ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' 
                : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
            }`}>
              <Crown className="w-3 h-3" />
              {isPaid ? 'Premium' : 'Unlock'}
            </div>
          </div>
        )}
        
        {/* Icon with enhanced styling */}
        <div className="flex items-start justify-between mb-8">
          <div className={`relative w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
            {/* Subtle glow effect behind icon */}
            <div className={`absolute inset-0 ${iconBg} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
            <Icon className={`relative w-8 h-8 ${iconColor} group-hover:scale-110 transition-transform duration-300`} />
          </div>
        </div>
        
        {/* Title with better typography */}
        <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300" data-testid={`text-${id}-title`}>
          {title}
        </h3>
        
        {/* Description with improved spacing */}
        <p className="text-muted-foreground mb-6 leading-relaxed" data-testid={`text-${id}-description`}>
          {description}
        </p>
        
        {/* Enhanced action area */}
        <div className="relative mt-auto">
          <div className="bg-gradient-to-r from-muted/80 to-muted/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 group-hover:border-primary/20 transition-all duration-300">
            {/* Action text with improved styling */}
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300" data-testid={`text-${id}-action`}>
                {actionText}
              </p>
              {!isLocked && (
                <div className="ml-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed" data-testid={`text-${id}-subtext`}>
              {actionSubtext}
            </p>
            
            {/* Upgrade Button for Locked Features with better styling */}
            {isLocked && (
              <Button 
                size="sm" 
                className="w-full mt-4 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation('/pricing');
                }}
                data-testid={`button-upgrade-${id}`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Unlock
              </Button>
            )}
          </div>
          
          {/* Subtle bottom accent line */}
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
      
      {/* Corner accent decoration */}
      <div className="absolute top-0 left-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 left-4 w-1 h-1 bg-primary rounded-full animate-ping"></div>
      </div>
    </div>
  );
}
