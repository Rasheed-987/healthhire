import { useState, useEffect } from "react";
import { X, Send, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
const henryAvatar = "/henry-avatar.png";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'henry';
  timestamp: Date;
}

interface HenryChatProps {
  triggerMessage?: string;
  onClose?: () => void;
  isModal?: boolean;
}

const henryKnowledge: { [key: string]: string } = {
  // Account & Payment
  'cost': 'HealthHire Portal is £70 for lifetime access. No monthly fees!',
  'price': 'HealthHire Portal is £70 for lifetime access. No monthly fees!',
  'payment': 'We accept all major cards, Google Pay, and Apple Pay via Stripe.',
  'refund': 'If you\'re having issues, I can help you troubleshoot or submit a support ticket.',
  
  // Features & Usage  
  'cv': 'Go to Application Documents → CV Generator. I\'ll guide you through it!',
  'interview': 'Visit the Interview Practice section. You can do mock interviews and get expert feedback!',
  'jobs': 'Our Job Finder uses intelligent scoring to match roles with your profile. Higher scores = better fits!',
  'documents': 'You can generate CVs and Supporting Information in the Documents section.',
  
  // NHS Specific
  'visa': 'Look for roles marked with visa sponsorship. We also have guides in Resources Hub!',
  'nhs values': 'NHS values are: compassion, respect, dignity, commitment, quality, integrity. I help weave these into your applications!',
  'band': 'NHS bands range from 1-9, with Band 5-7 being most common for healthcare professionals.',
  
  // General
  'help': 'I\'m here to help! Ask me about features, pricing, NHS guidance, or technical issues.',
  'hello': 'Hello! I\'m Henry, your NHS career helper. How can I assist you today?',
  'hi': 'Hi there! I\'m Henry. What can I help you with on your NHS career journey?'
};

const henryTriggers = {
  'profile_incomplete': 'I notice your profile is 60% complete. Shall I help you finish it?',
  'first_job_search': 'Ready to find your perfect NHS role? I can show you the best filters!',
  'document_generation': 'Creating your first Supporting Information? I have some tips!',
  'interview_prep': 'Nervous about interviews? Let me help you practice NHS-style questions!',
  'payment_hesitation': 'Questions about upgrading? I can explain what you\'ll unlock!'
};

export function HenryChat({ triggerMessage, onClose, isModal = false }: HenryChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Auto-show Henry with trigger message
  useEffect(() => {
    if (triggerMessage) {
      setIsOpen(true);
      addHenryMessage(triggerMessage);
    }
  }, [triggerMessage]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && !triggerMessage) {
      addHenryMessage("Hello! I'm Henry, your NHS career helper. How can I assist you today?");
    }
  }, [isOpen, messages.length, triggerMessage]);

  const addHenryMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender: 'henry',
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
  };

  const findBestResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Exact matches first
    for (const [key, response] of Object.entries(henryKnowledge)) {
      if (input.includes(key)) {
        return response;
      }
    }

    // Fuzzy matches
    if (input.includes('expensive') || input.includes('cheap')) {
      return henryKnowledge['cost'];
    }
    if (input.includes('generate') || input.includes('create')) {
      return henryKnowledge['cv'];
    }
    if (input.includes('practice') || input.includes('mock')) {
      return henryKnowledge['interview'];
    }
    if (input.includes('find') || input.includes('search')) {
      return henryKnowledge['jobs'];
    }

    return "I'm not sure about that specific question. Let me connect you with our support team who can help!";
  };

  const shouldEscalateToHuman = (userMessage: string, attempts: number): boolean => {
    return (
      attempts >= 3 ||
      userMessage.toLowerCase().includes('urgent') ||
      userMessage.toLowerCase().includes('angry') ||
      userMessage.toLowerCase().includes('refund') ||
      userMessage.toLowerCase().includes('cancel') ||
      userMessage.toLowerCase().includes('bug') ||
      userMessage.toLowerCase().includes('broken') ||
      userMessage.toLowerCase().includes('error') ||
      userMessage.toLowerCase().includes('not working') ||
      userMessage.length > 200
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addUserMessage(userMessage);
    setInputValue('');

    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    // Check if we should escalate
    if (shouldEscalateToHuman(userMessage, newAttemptCount)) {
      setShowEscalation(true);
      addHenryMessage("This seems like a complex question. I'd recommend contacting our human support team for the best help!");
      return;
    }

    // Generate Henry's response
    setTimeout(() => {
      const response = findBestResponse(userMessage);
      addHenryMessage(response);
    }, 500);
  };

  const handleEscalateToEmail = () => {
    // In a real app, this would send the conversation to support
    addHenryMessage("I've notified our support team about your question. You'll hear back within 24 hours at your registered email address!");
    setShowEscalation(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // When used in modal mode, always show the chat content
  useEffect(() => {
    if (isModal) {
      setIsOpen(true);
    }
  }, [isModal]);

  // Modal mode renders just the chat content without floating wrapper
  if (isModal) {
    return (
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="henry-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Escalation Button */}
        {showEscalation && (
          <div className="p-4 border-t">
            <Button 
              onClick={handleEscalateToEmail}
              variant="outline"
              className="w-full"
              size="sm"
              data-testid="button-escalate"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Human Support
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Henry anything..."
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-henry"
            />
            <Button 
              onClick={handleSendMessage}
              size="sm"
              disabled={!inputValue.trim()}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default floating widget mode
  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="henry-chat">
      {/* Henry Avatar Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 p-0 shadow-lg animate-bounce"
          data-testid="button-henry-open"
        >
          <img 
            src={henryAvatar} 
            alt="Henry Helper" 
            className="w-12 h-12 rounded-full object-cover"
          />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 h-96 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center space-x-2">
              <img 
                src={henryAvatar} 
                alt="Henry" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-sm">Henry the Helper</h3>
                <p className="text-xs opacity-90">NHS Career Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-auto p-1 text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-henry-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col h-80 p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="henry-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Escalation Button */}
            {showEscalation && (
              <div className="p-4 border-t">
                <Button 
                  onClick={handleEscalateToEmail}
                  variant="outline"
                  className="w-full"
                  size="sm"
                  data-testid="button-escalate"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Human Support
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Henry anything..."
                  className="flex-1 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-henry"
                />
                <Button 
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!inputValue.trim()}
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}