import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  Save, 
  X, 
  Globe, 
  BarChart3, 
  FileText,
  RefreshCw
} from "lucide-react";

interface ContentItem {
  id: string;
  contentKey: string;
  title: string;
  content: string;
  contentType: string;
  lastEditedBy: string;
  updatedAt: string;
}

interface EditingContent {
  title: string;
  content: string;
}

export default function ContentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("homepage");
  const [editingContent, setEditingContent] = useState<{[key: string]: EditingContent}>({});
  const [isEditing, setIsEditing] = useState<{[key: string]: boolean}>({});

  // Fetch content data
  const { data: contentData, isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/admin/content"],
    retry: false,
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ contentKey, title, content }: { contentKey: string; title: string; content: string }) => {
      const response = await apiRequest('PUT', `/api/admin/content/${contentKey}`, {
        title,
        content,
        contentType: contentData?.find(item => item.contentKey === contentKey)?.contentType || 'text'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({
        title: "Content Updated",
        description: "Your changes have been saved successfully",
      });
      setEditingContent({});
      setIsEditing({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (contentKey: string, currentTitle: string, currentContent: string) => {
    setEditingContent({
      ...editingContent,
      [contentKey]: { title: currentTitle, content: currentContent }
    });
    setIsEditing({ ...isEditing, [contentKey]: true });
  };

  const handleSave = (contentKey: string) => {
    const edited = editingContent[contentKey];
    if (edited) {
      updateContentMutation.mutate({
        contentKey,
        title: edited.title,
        content: edited.content
      });
    }
  };

  const handleCancel = (contentKey: string) => {
    const newEditingContent = { ...editingContent };
    const newIsEditing = { ...isEditing };
    delete newEditingContent[contentKey];
    delete newIsEditing[contentKey];
    setEditingContent(newEditingContent);
    setIsEditing(newIsEditing);
  };

  const updateEditingField = (contentKey: string, field: 'title' | 'content', value: string) => {
    setEditingContent({
      ...editingContent,
      [contentKey]: {
        ...editingContent[contentKey],
        [field]: value
      }
    });
  };

  const getPageIcon = (page: string) => {
    switch (page) {
      case 'homepage': return <Globe className="h-4 w-4" />;
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const groupContentByPage = (content: ContentItem[]) => {
    const grouped: {[key: string]: ContentItem[]} = {};
    content.forEach(item => {
      const page = item.contentKey.includes('homepage') ? 'homepage' : 
                   item.contentKey.includes('dashboard') ? 'dashboard' : 'other';
      if (!grouped[page]) grouped[page] = [];
      grouped[page].push(item);
    });
    return grouped;
  };

  const renderContentSection = (item: ContentItem) => {
    const isCurrentlyEditing = isEditing[item.contentKey];
    const editing = editingContent[item.contentKey];

    return (
      <Card key={item.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {isCurrentlyEditing ? (
                  <Input
                    value={editing?.title || item.title}
                    onChange={(e) => updateEditingField(item.contentKey, 'title', e.target.value)}
                    className="font-semibold"
                    data-testid={`input-title-${item.contentKey}`}
                  />
                ) : (
                  item.title
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.contentKey}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Last edited by {item.lastEditedBy}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentlyEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(item.contentKey)}
                    data-testid={`button-cancel-${item.contentKey}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(item.contentKey)}
                    disabled={updateContentMutation.isPending}
                    data-testid={`button-save-${item.contentKey}`}
                  >
                    {updateContentMutation.isPending ? (
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
                  onClick={() => handleEdit(item.contentKey, item.title, item.content)}
                  data-testid={`button-edit-${item.contentKey}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isCurrentlyEditing ? (
            <Textarea
              value={editing?.content || item.content}
              onChange={(e) => updateEditingField(item.contentKey, 'content', e.target.value)}
              rows={4}
              className="min-h-[100px]"
              data-testid={`textarea-content-${item.contentKey}`}
            />
          ) : (
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
            </div>
          )}
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

  const groupedContent = contentData ? groupContentByPage(contentData) : {};
  const pages = Object.keys(groupedContent);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Edit content across different pages of your platform. Changes will appear immediately for users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              {pages.map(page => (
                <TabsTrigger key={page} value={page} className="flex items-center gap-2">
                  {getPageIcon(page)}
                  <span className="capitalize">{page}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {pages.map(page => (
              <TabsContent key={page} value={page} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    {getPageIcon(page)}
                    <h3 className="text-lg font-semibold capitalize">
                      {page} Content Sections
                    </h3>
                    <Badge variant="secondary">
                      {groupedContent[page]?.length || 0} sections
                    </Badge>
                  </div>
                  
                  {groupedContent[page]?.map(renderContentSection)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}