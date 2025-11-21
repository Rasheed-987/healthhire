import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HenryHelper } from "@/components/HenryHelper";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "react-phone-input-2/lib/style.css";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  User,
  Award,
  Star,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  BookOpen,
  Check,
  Circle,
  Edit,
  ChevronRight,
  FileText,
  Mail,
  Award as CertificateIcon,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import React from "react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UserWithProfile, DashboardData } from "@shared/schema";
import PhoneInput from "react-phone-input-2";
import { FullscreenLoader } from "@/components/fullscreen-loader";

const workExperienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  employer: z.string().min(1, "Employer is required"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  duties: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  qualification: z.string().min(1, "Qualification is required"),
  institution: z.string().min(1, "Institution is required"),
  location: z.string().optional(),
  year: z.string().optional(),
  grade: z.string().optional(),
});

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  provider: z.string().min(1, "Provider is required"),
  completionDate: z.string().min(1, "Completion date is required"),
  certificateUrl: z.string().optional(),
});

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be at most 30 characters")
    .regex(/^[A-Za-z\s'-]+$/, "First name can only contain letters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name must be at most 30 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Last name can only contain letters"),
  profession: z
    .string()
    .min(2, "Profession must be at least 2 characters")
    .max(50, "Profession must be at most 50 characters")
    .regex(/^[A-Za-z\s,.'-]+$/, "Profession should contain letters only"),
  registrationNumber: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  phone: z
    .string()
    .min(6, "Phone number must be at least 6 digits")
    .max(20, "Phone number is too long")
    .regex(/^[0-9+\s()-]+$/, "Phone number contains invalid characters"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be at most 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "City should contain only letters"),
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be at most 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Country should contain only letters"),
  yearsExperience: z.coerce.number().optional(),
  visaStatus: z.string().optional(),
  skills: z
    .array(
      z
        .string()
        .min(2, "Skill must be at least 2 characters")
        .max(50, "Skill must be at most 50 characters")
        .regex(/^[A-Za-z\s,'-]+$/, "Skill should contain only letters")
    )
    .optional()
    .default([]),
  workExperience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  courses: z.array(courseSchema).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const deleteWorkExperience = useMutation({
    mutationFn: async (index: number) => {
      await apiRequest("DELETE", `/api/auth/user/work-experience/${index}`);
    },
    // use the mutation variables provided to onSuccess so we know which index was deleted
    onSuccess: (_data, variables) => {
      // variables is the index we passed to mutate(originalIndex)
      removeWork(variables as number);
      toast({
        title: "Deleted",
        description: "Work experience removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete work experience.",
        variant: "destructive",
      });
    },
  });

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Use on401: "returnNull" to handle unauthenticated state gracefully
  const { data: user, isLoading } = useQuery<UserWithProfile>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      profession: "",
      registrationNumber: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      yearsExperience: undefined,
      visaStatus: "",
      skills: [],
      workExperience: [],
      education: [],
      courses: [],
    },
  });

  const {
    fields: skillsFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray<any, "skills">({
    control: form.control as any,
    name: "skills",
  });

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
    swap: swapWorkExperience,
  } = useFieldArray({
    control: form.control,
    name: "workExperience",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const {
    fields: coursesFields,
    append: appendCourse,
    remove: removeCourse,
  } = useFieldArray({
    control: form.control,
    name: "courses",
  });

  // Update form values when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profession: user.profile?.profession || "",
        registrationNumber: user.profile?.registrationNumber || "",
        email: user.profile?.email || user.email || "",
        phone: user.profile?.phone || "",
        city: user.profile?.city || "",
        country: user.profile?.country || "",
        yearsExperience: user.profile?.yearsExperience || undefined,
        visaStatus: user.profile?.visaStatus || "",
        skills: (user.profile?.skills as string[]) || [],
        workExperience:
          (user.profile?.workExperience as any[])?.map((exp: any) => ({
            ...exp,
            duties:
              exp.duties ||
              (exp.description
                ? exp.description.split("\n").filter((d: string) => d.trim())
                : []),
          })) || [],
        education:
          (user.profile?.education as any[])?.map((edu: any) => ({
            qualification: edu.qualification || edu.degree || "",
            institution: edu.institution || "",
            location: edu.location || "",
            year:
              edu.year || (edu.endDate && edu.endDate.substring(0, 4)) || "",
            grade: edu.grade || "",
          })) || [],
        courses: (user.profile?.courses as any[]) || [],
      });
    }
  }, [user, form]);
  ``
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if minimum required fields are filled (Personal Information section)
  const isMinimumFieldsFilled = () => {
    const values = form.getValues();
    return !!(
      values.firstName?.trim() &&
      values.lastName?.trim() &&
      values.profession?.trim() &&
      values.email?.trim() &&
      values.phone?.trim() &&
      values.city?.trim() &&
      values.country?.trim()
    );
  };

  // Watch form values to enable/disable save button
  const watchedFields = form.watch([
    "firstName",
    "lastName",
    "profession",
    "email",
    "phone",
    "city",
    "country"
  ]);
  const canSave = isMinimumFieldsFilled();

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
    console.log("Submitting profile data:", data);
  };

  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);

    // Scroll to first error field - prioritize Personal Information (required fields)
    if (errors.firstName || errors.lastName || errors.profession || errors.email || errors.phone || errors.city || errors.country) {
      document.getElementById("personal-info")?.scrollIntoView({ behavior: "smooth" });
    } else if (errors.skills) {
      document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" });
    } else if (errors.workExperience) {
      document.getElementById("work-experience")?.scrollIntoView({ behavior: "smooth" });
    } else if (errors.education) {
      document.getElementById("education")?.scrollIntoView({ behavior: "smooth" });
    } else if (errors.courses) {
      document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  if (isLoading) {
    return <FullscreenLoader show={isLoading} />;
  }

  console.log(form.formState.errors);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8">
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

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Candidate Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete at least the Personal Information section to save your profile.
            Other sections are optional and can be added later.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-8"
              >
                {/* Personal Information */}
                <Card id="personal-info">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Registered Nurse, Doctor, Healthcare Assistant"
                              data-testid="input-profession"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Registration Number (GMC/NMC/HCPC)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., 12AB345C"
                              data-testid="input-registration-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="your.email@example.com"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <PhoneInput
                                country={"gb"} // default country
                                value={field.value}
                                onChange={(value) => field.onChange(value)}
                                inputClass="!w-full !h-10 !border !border-gray-300  !rounded-md !pl-12"
                                containerClass="!w-full"
                                enableSearch={true}
                                inputProps={{
                                  name: "phone",
                                  required: true,
                                  autoFocus: false,
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., London, Manchester"
                                data-testid="input-city"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., United Kingdom"
                                data-testid="input-country"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Section */}
                <Card id="skills">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="w-5 h-5" />
                      <span>Key Skills</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add up to 7 key skills relevant to your profession
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillsFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <FormField
                          control={form.control}
                          name={`skills.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Patient Care, Medication Administration"
                                  data-testid={`input-skill-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeSkill(index)}
                          data-testid={`button-remove-skill-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {skillsFields.length < 7 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendSkill("" as any)}
                        className="w-full"
                        data-testid="button-add-skill"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Skill
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Work Experience Section */}
                <Card id="work-experience">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span>Work Experience</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Recommend only 3 relevant roles (recent only). Include
                      more if relevant, otherwise risk CV being too long.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      const orderedWork = workFields
                        .map((field, i) => {
                          const rawEnd = form.getValues(
                            `workExperience.${i}.endDate`
                          ) as string | undefined;
                          const isCurrentFlag = !!form.getValues(
                            `workExperience.${i}.current`
                          );
                          // logic for current status
                          const normEnd =
                            typeof rawEnd === "string"
                              ? rawEnd.trim().toLowerCase()
                              : "";
                          let isCurrent = false;
                          if (isCurrentFlag) {
                            isCurrent = true;
                          } else if (!rawEnd) {
                            isCurrent = true;
                          } else if (
                            normEnd === "present" ||
                            normEnd === "current"
                          ) {
                            isCurrent = true;
                          } else {
                            // is endDate in the future?
                            // Accept YYYY-MM, YYYY-MM-DD
                            const d = new Date(rawEnd);
                            if (
                              d.toString() !== "Invalid Date" &&
                              d > new Date()
                            ) {
                              isCurrent = true;
                            }
                          }
                          const startDate = form.getValues(
                            `workExperience.${i}.startDate`
                          ) as string | undefined;
                          return {
                            field,
                            originalIndex: i,
                            isCurrent,
                            startDate: startDate || "",
                          };
                        })
                        // .sort((a, b) => {
                        //   if (a.isCurrent && !b.isCurrent) return -1;
                        //   if (!a.isCurrent && b.isCurrent) return 1;
                        //   return (b.startDate || "").localeCompare(
                        //     a.startDate || ""
                        //   );
                        // });

                      return orderedWork.map(
                        ({ field, originalIndex, isCurrent }) => (
                          <div
                            key={field.id}
                            className="border rounded-lg p-4 space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">Experience</h4>
                                {/* <Badge
                                  variant={isCurrent ? "default" : "secondary"}
                                  className={
                                    isCurrent
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : ""
                                  }
                                >
                                  {isCurrent ? "Current" : "Previous"}
                                </Badge> */}
                              </div>
                              <div className="flex gap-2">
                                {/* Swap Up */}
                                {originalIndex > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => swapWorkExperience(originalIndex, originalIndex - 1)}
                                    aria-label="Move up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>
                                )}
                                {/* Swap Down */}
                                {originalIndex < workFields.length - 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => swapWorkExperience(originalIndex, originalIndex + 1)}
                                    aria-label="Move down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>
                                )}
                                {/* Delete Button */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={deleteWorkExperience.isPending}
                                  onClick={() => deleteWorkExperience.mutate(originalIndex)}
                                  aria-label="Delete experience"
                                >
                                  {deleteWorkExperience.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`workExperience.${originalIndex}.jobTitle`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Job Title</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="e.g., Staff Nurse"
                                        data-testid={`input-work-title-${originalIndex}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`workExperience.${originalIndex}.employer`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Employer</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="e.g., NHS Foundation Trust"
                                        data-testid={`input-work-employer-${originalIndex}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`workExperience.${originalIndex}.location`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g., London, UK"
                                      data-testid={`input-work-location-${originalIndex}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`workExperience.${originalIndex}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="month"
                                        data-testid={`input-work-start-${originalIndex}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`workExperience.${originalIndex}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="month"
                                        disabled={form.watch(`workExperience.${originalIndex}.current`)}
                                        placeholder={form.watch(`workExperience.${originalIndex}.current`) ? "Present" : ""}
                                        data-testid={`input-work-end-${originalIndex}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Currently Working Checkbox */}
                            <FormField
                              control={form.control}
                              name={`workExperience.${originalIndex}.current`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value || false}
                                      onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if (checked) {
                                          // Clear end date when marking as current
                                          form.setValue(`workExperience.${originalIndex}.endDate`, "");
                                        }
                                      }}
                                      data-testid={`checkbox-work-current-${originalIndex}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    Currently working here
                                  </FormLabel>
                                </FormItem>
                              )}
                            />

                            {/* Duties Section */}
                            <div className="space-y-3">
                              <FormLabel>
                                Key Duties & Responsibilities
                              </FormLabel>

                              {/* Henry Helper Integration */}
                              <HenryHelper
                                jobTitle={
                                  form.watch(
                                    `workExperience.${originalIndex}.jobTitle`
                                  ) || ""
                                }
                                onAcceptDuties={(duties) => {
                                  // Save scroll position
                                  const scrollY = window.scrollY;

                                  form.clearErrors();

                                  // Update form silently
                                  form.setValue(
                                    `workExperience.${originalIndex}.duties`,
                                    duties,
                                    {
                                      shouldDirty: true,
                                      shouldTouch: false,
                                      shouldValidate: false, // ✅ don't trigger validation
                                    }
                                  );

                                  // Prevent scroll jump caused by rerender
                                  requestAnimationFrame(() => {
                                    window.scrollTo({
                                      top: scrollY,
                                      behavior: "instant",
                                    });
                                  });
                                }}
                                disabled={
                                  !form
                                    .watch(
                                      `workExperience.${originalIndex}.jobTitle`
                                    )
                                    ?.trim()
                                }
                              />

                              {(
                                form.watch(
                                  `workExperience.${originalIndex}.duties`
                                ) || []
                              ).map((_, dutyIndex) => (
                                <div key={dutyIndex} className="flex gap-2">
                                  <FormField
                                    control={form.control}
                                    name={`workExperience.${originalIndex}.duties.${dutyIndex}`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="e.g., Provide compassionate patient care in acute medical settings"
                                            data-testid={`input-work-duty-${originalIndex}-${dutyIndex}`}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const currentDuties =
                                        form.getValues(
                                          `workExperience.${originalIndex}.duties`
                                        ) || [];
                                      const newDuties = currentDuties.filter(
                                        (_, i) => i !== dutyIndex
                                      );
                                      form.setValue(
                                        `workExperience.${originalIndex}.duties`,
                                        newDuties
                                      );
                                    }}
                                    data-testid={`button-remove-duty-${originalIndex}-${dutyIndex}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentDuties =
                                    form.getValues(
                                      `workExperience.${originalIndex}.duties`
                                    ) || [];
                                  form.setValue(
                                    `workExperience.${originalIndex}.duties`,
                                    [...currentDuties, ""]
                                  );
                                }}
                                className="w-full"
                                data-testid={`button-add-duty-${originalIndex}`}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Duty
                              </Button>
                            </div>
                          </div>
                        )
                      );
                    })()}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Add new experience (not marked as current by default)
                        appendWork({
                          jobTitle: "",
                          employer: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          current: false,
                          duties: [""],
                        });
                      }}
                      className="w-full"
                      data-testid="button-add-work"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Work Experience
                    </Button>
                  </CardContent>
                </Card>

                {/* Education Section */}
                <Card id="education">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>Education</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      You don't need to include all, just relevant ones. Include
                      your highest level of education.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {educationFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Education {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEducation(index)}
                            data-testid={`button-remove-education-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`education.${index}.qualification`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Degree/Qualification</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., BSc Nursing"
                                    data-testid={`input-education-qualification-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`education.${index}.institution`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Institution</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., University of Manchester"
                                    data-testid={`input-education-institution-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`education.${index}.location`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Manchester, UK"
                                  data-testid={`input-education-location-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`education.${index}.year`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year Completed</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., 2021"
                                    data-testid={`input-education-year-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`education.${index}.grade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grade/Classification</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., First Class Honours"
                                    data-testid={`input-education-grade-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* <FormField
                            control={form.control}
                            name={`education.${index}.grade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grade/Result</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., First Class Honours" data-testid={`input-education-grade-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          /> */}
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        appendEducation({
                          qualification: "",
                          institution: "",
                          location: "",
                          year: "",
                          grade: "",
                        })
                      }
                      className="w-full"
                      data-testid="button-add-education"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </CardContent>
                </Card>

                {/* Courses Section */}
                <Card id="courses">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5" />
                      <span>Courses & Certifications</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Only include max of 5 relevant courses and certifications.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {coursesFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Course {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(index)}
                            data-testid={`button-remove-course-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`courses.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Course Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Advanced Life Support"
                                    data-testid={`input-course-name-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`courses.${index}.provider`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Resuscitation Council UK"
                                    data-testid={`input-course-provider-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`courses.${index}.completionDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Completion Date</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="month"
                                    data-testid={`input-course-completion-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* <FormField
                            control={form.control}
                            name={`courses.${index}.certificateUrl`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Certificate URL (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="https://..." data-testid={`input-course-url-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          /> */}
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        appendCourse({
                          name: "",
                          provider: "",
                          completionDate: "",
                          certificateUrl: "",
                        })
                      }
                      className="w-full"
                      data-testid="button-add-course"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Course/Certification
                    </Button>
                  </CardContent>
                </Card>

                {!canSave && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Required:</strong> Please complete the Personal Information section
                      (First Name, Last Name, Profession, Email, Phone, City, Country) to enable saving.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSave || updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Profile"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? <ProfilePhotoUpload user={user as any} /> : null}
              </CardContent>
            </Card>

            {/* Profile Overview */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Profile Overview</CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    data-testid="badge-completion-count"
                  >
                    {(() => {
                      const sections = [
                        form.watch("firstName") &&
                        form.watch("lastName") &&
                        form.watch("profession") &&
                        form.watch("email") &&
                        form.watch("phone"),
                        skillsFields.length > 0,
                        workFields.length > 0,
                        educationFields.length > 0,
                        coursesFields.length > 0,
                      ];
                      const completed = sections.filter(Boolean).length;
                      return `${completed} of 5 sections complete`;
                    })()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Complete the sections below to improve matches and recruiter
                  visibility.
                </p>
                {(() => {
                  const sections = [
                    {
                      name: "Personal Information",
                      completed:
                        form.watch("firstName") &&
                        form.watch("lastName") &&
                        form.watch("profession") &&
                        form.watch("email") &&
                        form.watch("phone"),
                      anchor: "personal-info",
                    },
                    {
                      name: "Key Skills",
                      completed: skillsFields.length > 0,
                      anchor: "skills",
                    },
                    {
                      name: "Work Experience",
                      completed: workFields.length > 0,
                      anchor: "work-experience",
                    },
                    {
                      name: "Education",
                      completed: educationFields.length > 0,
                      anchor: "education",
                    },
                    {
                      name: "Courses & Certifications",
                      completed: coursesFields.length > 0,
                      anchor: "courses",
                    },
                  ];
                  const firstIncomplete = sections.find(
                    (section) => !section.completed
                  );
                  return firstIncomplete ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        const element = document.getElementById(
                          firstIncomplete.anchor
                        );
                        element?.scrollIntoView({ behavior: "smooth" });
                      }}
                      data-testid="button-continue-profile"
                    >
                      Continue profile
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : null;
                })()}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Personal Information */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {form.watch("firstName") &&
                        form.watch("lastName") &&
                        form.watch("profession") &&
                        form.watch("email") &&
                        form.watch("phone") ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Complete"
                        />
                      ) : (
                        <Circle
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Needs attention"
                        />
                      )}
                      <span className="text-sm font-medium">
                        Personal Information
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document
                          .getElementById("personal-info")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-edit-personal-info"
                      aria-label={
                        form.watch("firstName") &&
                          form.watch("lastName") &&
                          form.watch("profession") &&
                          form.watch("email") &&
                          form.watch("phone")
                          ? "Edit Personal Information"
                          : "Add Personal Information"
                      }
                    >
                      {form.watch("firstName") &&
                        form.watch("lastName") &&
                        form.watch("profession") &&
                        form.watch("email") &&
                        form.watch("phone") ? (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Key Skills */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {skillsFields.length > 0 ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Complete"
                        />
                      ) : (
                        <Circle
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Needs attention"
                        />
                      )}
                      <span className="text-sm font-medium">Key Skills</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document
                          .getElementById("skills")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-edit-skills"
                      aria-label={
                        skillsFields.length > 0
                          ? "Edit Key Skills"
                          : "Add Key Skills"
                      }
                    >
                      {skillsFields.length > 0 ? (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Work Experience */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {workFields.length > 0 ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Complete"
                        />
                      ) : (
                        <Circle
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Needs attention"
                        />
                      )}
                      <span className="text-sm font-medium">
                        Work Experience
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document
                          .getElementById("work-experience")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-edit-work-experience"
                      aria-label={
                        workFields.length > 0
                          ? "Edit Work Experience"
                          : "Add Work Experience"
                      }
                    >
                      {workFields.length > 0 ? (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Education */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {educationFields.length > 0 ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Complete"
                        />
                      ) : (
                        <Circle
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Needs attention"
                        />
                      )}
                      <span className="text-sm font-medium">Education</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document
                          .getElementById("education")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-edit-education"
                      aria-label={
                        educationFields.length > 0
                          ? "Edit Education"
                          : "Add Education"
                      }
                    >
                      {educationFields.length > 0 ? (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Courses & Certifications */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {coursesFields.length > 0 ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Complete"
                        />
                      ) : (
                        <Circle
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Needs attention"
                        />
                      )}
                      <span className="text-sm font-medium">
                        Courses & Certifications
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document
                          .getElementById("courses")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-edit-courses"
                      aria-label={
                        coursesFields.length > 0
                          ? "Edit Courses & Certifications"
                          : "Add Courses & Certifications"
                      }
                    >
                      {coursesFields.length > 0 ? (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
