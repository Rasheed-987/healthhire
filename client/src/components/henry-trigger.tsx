import { useState, useEffect } from "react";
import { HenryChat } from "./henry-chat";
import { useSubscription } from "@/hooks/useSubscription";

interface HenryTriggerProps {
  context?: 'profile' | 'jobs' | 'documents' | 'interview' | 'payment' | 'stuck';
  profileCompletion?: number;
  isFirstVisit?: boolean;
}

export function HenryTrigger({ context, profileCompletion, isFirstVisit }: HenryTriggerProps) {
  const [triggerMessage, setTriggerMessage] = useState<string | undefined>();
  const [showHenry, setShowHenry] = useState(false);
  const { isPaid } = useSubscription();

  useEffect(() => {
    // Don't show Henry immediately on first page load
    const timer = setTimeout(() => {
      let message: string | undefined;

      switch (context) {
        case 'profile':
          if (profileCompletion && profileCompletion < 70) {
            message = `I notice your profile is ${profileCompletion}% complete. Shall I help you finish it?`;
          }
          break;
          
        case 'jobs':
          if (isFirstVisit) {
            message = 'Ready to find your perfect NHS role? I can show you the best filters!';
          }
          break;
          
        case 'documents':
          if (!isPaid) {
            message = 'Creating your first Supporting Information? I have some tips!';
          }
          break;
          
        case 'interview':
          message = 'Nervous about interviews? Let me help you practice NHS-style questions!';
          break;
          
        case 'payment':
          if (!isPaid) {
            message = 'Questions about upgrading? I can explain what you\'ll unlock!';
          }
          break;
          
        case 'stuck':
          message = 'Need help? I\'m here to guide you!';
          break;
      }

      if (message) {
        setTriggerMessage(message);
        setShowHenry(true);
      }
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [context, profileCompletion, isFirstVisit, isPaid]);

  if (!showHenry) return null;

  return (
    <HenryChat 
      triggerMessage={triggerMessage}
      onClose={() => setShowHenry(false)}
    />
  );
}