import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  Save, 
  X, 
  Brain, 
  MessageSquare, 
  Settings,
  RefreshCw,
  Thermometer,
  Hash
} from "lucide-react";

interface AiPrompt {
  id: string;
  promptKey: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  lastEditedBy: string;
  updatedAt: string;
}

interface EditingPrompt {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
}

export default function PromptManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [editingPrompts, setEditingPrompts] = useState<{[key: string]: EditingPrompt}>({});
  const [isEditing, setIsEditing] = useState<{[key: string]: boolean}>({});

  // Fetch prompts data
  const { data: promptsData, isLoading } = useQuery<AiPrompt[]>({
    queryKey: ["/api/admin/prompts"],
    retry: false,
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async ({ promptKey, promptData }: { promptKey: string; promptData: EditingPrompt }) => {
      const response = await apiRequest('PUT', `/api/admin/prompts/${promptKey}`, promptData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
      toast({
        title: "Prompt Updated",
        description: "AI prompt configuration has been saved successfully",
      });
      setEditingPrompts({});
      setIsEditing({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update AI prompt",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (promptKey: string, prompt: AiPrompt) => {
    setEditingPrompts({
      ...editingPrompts,
      [promptKey]: {
        name: prompt.name,
        description: prompt.description,
        systemPrompt: prompt.systemPrompt,
        userPromptTemplate: prompt.userPromptTemplate,
        temperature: prompt.temperature,
        maxTokens: prompt.maxTokens,
        isActive: prompt.isActive
      }
    });
    setIsEditing({ ...isEditing, [promptKey]: true });
  };

  const handleSave = (promptKey: string) => {
    const edited = editingPrompts[promptKey];
    if (edited) {
      updatePromptMutation.mutate({
        promptKey,
        promptData: edited
      });
    }
  };

  const handleCancel = (promptKey: string) => {
    const newEditingPrompts = { ...editingPrompts };
    const newIsEditing = { ...isEditing };
    delete newEditingPrompts[promptKey];
    delete newIsEditing[promptKey];
    setEditingPrompts(newEditingPrompts);
    setIsEditing(newIsEditing);
  };

  const updatePromptField = (promptKey: string, field: keyof EditingPrompt, value: any) => {
    setEditingPrompts({
      ...editingPrompts,
      [promptKey]: {
        ...editingPrompts[promptKey],
        [field]: value
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cv_generation': return <MessageSquare className="h-4 w-4" />;
      case 'interview': return <Brain className="h-4 w-4" />;
      case 'job_matching': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const groupPromptsByCategory = (prompts: AiPrompt[]) => {
    const grouped: {[key: string]: AiPrompt[]} = {};
    prompts.forEach(prompt => {
      if (!grouped[prompt.category]) grouped[prompt.category] = [];
      grouped[prompt.category].push(prompt);
    });
    return grouped;
  };

  const getFilteredPrompts = () => {
    if (!promptsData) return [];
    if (activeTab === "all") return promptsData;
    return promptsData.filter(prompt => prompt.category === activeTab);
  };

  const renderPromptCard = (prompt: AiPrompt) => {
    const isCurrentlyEditing = isEditing[prompt.promptKey];
    const editing = editingPrompts[prompt.promptKey];

    return (
      <Card key={prompt.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(prompt.category)}
                <CardTitle className="text-lg">
                  {isCurrentlyEditing ? (
                    <Input
                      value={editing?.name || prompt.name}
                      onChange={(e) => updatePromptField(prompt.promptKey, 'name', e.target.value)}
                      className="font-semibold"
                      data-testid={`input-name-${prompt.promptKey}`}
                    />
                  ) : (
                    prompt.name
                  )}
                </CardTitle>
                <Badge variant={prompt.isActive ? "default" : "secondary"}>
                  {prompt.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>
                {isCurrentlyEditing ? (
                  <Input
                    value={editing?.description || prompt.description}
                    onChange={(e) => updatePromptField(prompt.promptKey, 'description', e.target.value)}
                    placeholder="Brief description of this prompt..."
                    data-testid={`input-description-${prompt.promptKey}`}
                  />
                ) : (
                  prompt.description
                )}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Key: {prompt.promptKey}</span>
                <span>Last edited by {prompt.lastEditedBy}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentlyEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(prompt.promptKey)}
                    data-testid={`button-cancel-${prompt.promptKey}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(prompt.promptKey)}
                    disabled={updatePromptMutation.isPending}
                    data-testid={`button-save-${prompt.promptKey}`}
                  >
                    {updatePromptMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(prompt.promptKey, prompt)}
                  data-testid={`button-edit-${prompt.promptKey}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activation Switch */}
          {isCurrentlyEditing && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Active</span>
              </div>
              <Switch
                checked={editing?.isActive ?? prompt.isActive}
                onCheckedChange={(checked) => updatePromptField(prompt.promptKey, 'isActive', checked)}
                data-testid={`switch-active-${prompt.promptKey}`}
              />
            </div>
          )}

          {/* AI Configuration */}
          {isCurrentlyEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  <label className="text-sm font-medium">Temperature: {editing?.temperature ?? prompt.temperature}</label>
                </div>
                <Slider
                  value={[editing?.temperature ?? prompt.temperature]}
                  onValueChange={([value]) => updatePromptField(prompt.promptKey, 'temperature', value)}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                  data-testid={`slider-temperature-${prompt.promptKey}`}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <label className="text-sm font-medium">Max Tokens</label>
                </div>
                <Input
                  type="number"
                  value={editing?.maxTokens ?? prompt.maxTokens}
                  onChange={(e) => updatePromptField(prompt.promptKey, 'maxTokens', parseInt(e.target.value))}
                  min={1}
                  max={4000}
                  data-testid={`input-tokens-${prompt.promptKey}`}
                />
              </div>
            </div>
          )}

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">System Prompt</label>
            {isCurrentlyEditing ? (
              <Textarea
                value={editing?.systemPrompt || prompt.systemPrompt}
                onChange={(e) => updatePromptField(prompt.promptKey, 'systemPrompt', e.target.value)}
                rows={4}
                placeholder="System instructions for the AI..."
                data-testid={`textarea-system-${prompt.promptKey}`}
              />
            ) : (
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{prompt.systemPrompt}</p>
              </div>
            )}
          </div>

          {/* User Prompt Template */}
          <div className="space-y-2">
            <label className="text-sm font-medium">User Prompt Template</label>
            {isCurrentlyEditing ? (
              <Textarea
                value={editing?.userPromptTemplate || prompt.userPromptTemplate}
                onChange={(e) => updatePromptField(prompt.promptKey, 'userPromptTemplate', e.target.value)}
                rows={3}
                placeholder="Template for user inputs (use {variables} for placeholders)..."
                data-testid={`textarea-template-${prompt.promptKey}`}
              />
            ) : (
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{prompt.userPromptTemplate}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const categories = promptsData ? Array.from(new Set(promptsData.map(p => p.category))) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Prompt Management</CardTitle>
          <CardDescription>
            Configure AI prompts used throughout the platform. Adjust temperature, token limits, and prompt content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Prompts</TabsTrigger>
              {categories.slice(0, 3).map(category => (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category.replace('_', ' ')}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    {activeTab === "all" ? "All AI Prompts" : `${activeTab.replace('_', ' ')} Prompts`.replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <Badge variant="secondary">
                    {getFilteredPrompts().length} prompts
                  </Badge>
                </div>
                
                {getFilteredPrompts().map(renderPromptCard)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}