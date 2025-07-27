import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, DollarSign, MessageSquare, Upload, X } from "lucide-react";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { insertPostSchema } from "@shared/schema";

const postSchema = insertPostSchema.extend({
  images: z.array(z.string()).optional().default([]),
  attachments: z.array(z.string()).optional().default([]),
});

type PostFormData = z.infer<typeof postSchema>;

const categories = [
  "Tech Startups",
  "Food & Beverage", 
  "Retail",
  "Education",
  "Healthcare",
  "Manufacturing",
  "Agriculture",
  "Services",
  "Real Estate",
  "Other"
];

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postType, setPostType] = useState<'investment' | 'community'>('investment');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      postType: 'investment',
      title: "",
      content: "",
      category: "",
      images: [],
      attachments: [],
      fundingMin: 0,
      fundingMax: 0,
      useOfFunds: "",
      timeline: "",
      expectedRoi: "",
      teamSize: 1,
      businessPlan: "",
    },
  });

  const createPost = useMutation({
    mutationFn: async (data: PostFormData) => {
      const response = await authenticatedApiRequest("POST", "/api/posts", {
        ...data,
        postType,
        images: uploadedImages,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${postType === 'investment' ? 'Investment opportunity' : 'Community post'} created successfully! It will be reviewed by admins.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you would upload to a file storage service
      // For now, we'll just add placeholder URLs
      const newImages = Array.from(files).map((file, index) => 
        `placeholder-image-${Date.now()}-${index}.jpg`
      );
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PostFormData) => {
    // Filter out investment-specific fields for community posts
    if (postType === 'community') {
      const { fundingMin, fundingMax, useOfFunds, timeline, expectedRoi, teamSize, businessPlan, ...communityData } = data;
      createPost.mutate({
        ...communityData,
        postType: 'community'
      });
    } else {
      createPost.mutate({
        ...data,
        postType: 'investment'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Post</h1>
            <p className="text-gray-600 dark:text-gray-400">Share an investment opportunity or community post</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post Type</CardTitle>
            <CardDescription>
              Choose the type of post you want to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={postType} onValueChange={(value) => setPostType(value as 'investment' | 'community')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="investment" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Investment Opportunity
                </TabsTrigger>
                <TabsTrigger value="community" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Community Post
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Common fields */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={postType === 'investment' 
                                ? "e.g., Seeking ₹5L for Tech Startup in Lucknow" 
                                : "e.g., Looking for business advice"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={postType === 'investment' 
                                ? "Describe your business idea, market opportunity, and why investors should be interested..."
                                : "Share your thoughts, ask questions, or start a discussion..."}
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Investment-specific fields */}
                    <TabsContent value="investment" className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fundingMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Funding (₹)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="50000"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fundingMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Funding (₹)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="500000"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="useOfFunds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Use of Funds</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="How will you use the investment? e.g., Product development, Marketing, Inventory..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="timeline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timeline</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 6 months" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expectedRoi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected ROI</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 15-20%" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="teamSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Size</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="3"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="businessPlan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Plan (URL)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Image upload */}
                    <div className="space-y-4">
                      <Label>Images</Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Upload images to showcase your {postType === 'investment' ? 'business' : 'post'}
                          </div>
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="max-w-xs"
                          />
                        </div>
                      </div>
                      
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative">
                              <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500">Image {index + 1}</span>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/dashboard")}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPost.isPending}
                      >
                        {createPost.isPending 
                          ? "Creating..." 
                          : `Create ${postType === 'investment' ? 'Investment Post' : 'Community Post'}`
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}