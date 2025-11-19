import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileText,
  Video,
  Edit,
  Trash2,
  Plus,
  X,
  Calendar,
  User,
  Clock,
  HelpCircle,
  Newspaper,
  BookOpen,
  Search,
  Lock,
  CreditCard,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Generic schema that can be extended for different content types
const baseContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Please select an icon"),
});

// Content type specific schemas
export const resourceSchema = baseContentSchema.extend({
  type: z.enum(["file", "video"], {
    required_error: "Please select a resource type",
  }),
  videoUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "video") {
    if (!data.videoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Video URL is required for video resources",
        path: ["videoUrl"],
      });
      return false;
    }
    try {
      new URL(data.videoUrl);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid video URL",
        path: ["videoUrl"],
      });
      return false;
    }
  }
});

export const newsSchema = baseContentSchema.extend({
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  readTime: z.string().optional(),
  publishDate: z.string().optional(),
});

export const supportSchema = baseContentSchema.extend({
  // High-level grouping used on the public Support page
  category: z.enum(["general", "account", "technical", "billing"]),
  content: z.array(z.string().min(1, "Content item cannot be empty")).min(1, "At least one content item is required"),
});

type BaseContentData = z.infer<typeof baseContentSchema>;
type ResourceData = z.infer<typeof resourceSchema>;
type NewsData = z.infer<typeof newsSchema>;
type SupportData = z.infer<typeof supportSchema>;

interface IconOption {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminContentManagerProps {
  contentType: "resources" | "news" | "support";
  title: string;
  description: string;
  data: any[];
  isLoading?: boolean;
  schema: z.ZodSchema<any>;
  iconOptions: IconOption[];
  apiEndpoint: string;
  queryKey: string[];
  renderCustomFields?: (form: any, editingItem: any, selectedFile: File | null, handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => React.ReactNode;
  renderItemBadges?: (item: any) => React.ReactNode;
  handleFileUpload?: (file: File) => Promise<{ url?: string; filePath?: string }>;
}

export default function AdminContentManager({
  contentType,
  title,
  description,
  data,
  isLoading,
  schema,
  iconOptions,
  apiEndpoint,
  queryKey,
  renderCustomFields,
  renderItemBadges,
  handleFileUpload,
}: AdminContentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form setup
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(contentType),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", apiEndpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: `${getContentTypeLabel(contentType)} ${editingItem ? 'updated' : 'created'} successfully`,
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to save ${contentType.slice(0, -1)}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `${apiEndpoint}/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: `${getContentTypeLabel(contentType)} updated successfully`,
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to update ${contentType.slice(0, -1)}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${apiEndpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: `${getContentTypeLabel(contentType)} deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${contentType.slice(0, -1)}`,
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleAddNew = () => {
    setEditingItem(null);
    setSelectedFile(null);
    form.reset(getDefaultValues(contentType));
    setShowCreateForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setSelectedFile(null);
    form.reset({
      title: item.title || "",
      description: item.description || "",
      icon: item.icon || "",
      ...getEditFormValues(contentType, item),
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
      deleteMutation.mutate(id);
  
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingItem(null);
    setSelectedFile(null);
    form.reset();
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingItem(null);
    setSelectedFile(null);
    form.reset();
    setUploading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (formData: any) => {
    setUploading(true);
    try {
      let submitData = { ...formData };

      // Handle file upload if needed
      if (contentType === "resources" && formData.type === "file" && handleFileUpload) {
        if (!selectedFile && !editingItem?.fileUrl) {
          throw new Error("Please select a file to upload");
        }
        
        if (selectedFile) {
          const uploadResult = await handleFileUpload(selectedFile);
          submitData.fileUrl = uploadResult.url || uploadResult.filePath;
        } else if (editingItem?.fileUrl) {
          submitData.fileUrl = editingItem.fileUrl;
        }
      }

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Header with Add New Button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">{getContentTypeLabel(contentType)}</h3>
          <Button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New {getContentTypeLabel(contentType, true)}
          </Button>
        </div>

        {/* Create/Edit Form - conditionally shown */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingItem ? `Edit ${getContentTypeLabel(contentType, true)}` : `Create New ${getContentTypeLabel(contentType, true)}`}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {/* Base fields */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter title" className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter description"
                            className="w-full h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon *</FormLabel>
                        <FormControl>
                          <div className="flex gap-3 flex-wrap">
                            {getIconOptionsForContext(contentType, (form as any).watch("category") as string, iconOptions).map(({ name, label, icon: Icon }) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => field.onChange(name)}
                                className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm ${
                                  field.value === name
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300"
                                }`}
                              >
                                <Icon className="w-4 h-4" /> {label}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom fields for each content type */}
                  {renderCustomFields && renderCustomFields(form, editingItem, selectedFile, handleFileChange)}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={uploading || createMutation.isPending || updateMutation.isPending}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                    >
                      {uploading || createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingItem
                        ? `Update ${getContentTypeLabel(contentType, true)}`
                        : `Save ${getContentTypeLabel(contentType, true)}`}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Content List */}
        <div className="space-y-4">
          {data && data.length > 0 ? (
            data.map((item: any) => {
              const IconComponent = resolveIconComponent(item.icon, contentType, iconOptions, item.category);
              return (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        <div className="flex gap-2 mt-2">
                          {renderItemBadges ? renderItemBadges(item) : (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {getContentTypeLabel(contentType, true)}
                              </Badge>
                              {item.createdAt && (
                                <Badge variant="outline" className="text-xs">
                                  Created: {new Date(item.createdAt).toLocaleDateString()}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(getDefaultIcon(contentType), { 
                  className: "w-8 h-8 text-gray-400" 
                })}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {contentType} found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first {contentType.slice(0, -1)}.
              </p>
              <Button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First {getContentTypeLabel(contentType, true)}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getDefaultValues(contentType: string) {
  const base = {
    title: "",
    description: "",
    icon: "",
  };

  switch (contentType) {
    case "resources":
      return { ...base, type: "file", videoUrl: "" };
    case "news":
      return { ...base, content: "", category: "", type: "", priority: "", readTime: "", publishDate: "" };
    case "support":
      return { ...base, category: "general", content: [""] };
    default:
      return base;
  }
}

function getEditFormValues(contentType: string, item: any) {
  switch (contentType) {
    case "resources":
      return {
        type: item.type || "file",
        videoUrl: item.videoUrl || "",
      };
    case "news":
      return {
        content: item.content || "",
        category: item.category || "",
        type: item.type || "",
        priority: item.priority || "",
        readTime: item.readTime || item.read_time || "",
        publishDate: item.publishDate || item.publishedAt ? new Date(item.publishDate || item.publishedAt).toISOString().split('T')[0] : "",
      };
    case "support":
      return {
        category: item.category || "general",
        content: Array.isArray(item.content) ? item.content : [item.content || ""],
      };
    default:
      return {};
  }
}

function getContentTypeLabel(contentType: string, singular = false) {
  const labels = {
    resources: singular ? "Resource" : "Resources",
    news: singular ? "News Article" : "News",
    support: singular ? "Support Article" : "Support",
  };
  return labels[contentType as keyof typeof labels] || contentType;
}

function getDefaultIcon(contentType: string) {
  const icons = {
    resources: BookOpen,
    news: Newspaper,
    support: HelpCircle,
  };
  return icons[contentType as keyof typeof icons] || FileText;
}

// Dynamic icon options based on selected category (for Support content)
function getIconOptionsForContext(
  contentType: string,
  selectedCategory: string | undefined,
  defaultOptions: { name: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
) {
  if (contentType !== "support") return defaultOptions;

  switch (selectedCategory) {
    case "general":
      return [
        { name: "profile", label: "Profile", icon: User },
        { name: "search", label: "Search", icon: Search },
        { name: "documents", label: "Documents", icon: FileText },
      ];
    case "account":
      return [
        { name: "privacy", label: "Privacy", icon: Lock },
        { name: "account", label: "Account", icon: Users },
      ];
    case "technical":
      return [
        { name: "troubleshooting", label: "Troubleshooting", icon: AlertTriangle },
      ];
    case "billing":
      return [
        { name: "payments", label: "Payments", icon: CreditCard },
      ];
    default:
      return defaultOptions;
  }
}

function resolveIconComponent(
  name: string,
  contentType: string,
  defaultOptions: { name: string; label: string; icon: React.ComponentType<{ className?: string }> }[],
  selectedCategory?: string
) {
  // Look in dynamic options for support first (using item's category if available)
  const dynamic = getIconOptionsForContext(contentType, selectedCategory, defaultOptions).find(o => o.name === name)?.icon;
  if (dynamic) return dynamic;
  // Then look in provided defaults
  const fromDefault = defaultOptions.find(o => o.name === name)?.icon;
  return fromDefault || getDefaultIcon(contentType);
}