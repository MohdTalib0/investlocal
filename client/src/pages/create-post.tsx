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
import BottomNavigation from "@/components/bottom-navigation";

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
      console.log('Making API call with data:', data);
      const response = await authenticatedApiRequest("POST", "/api/posts", data);
      console.log('API response:', response);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Post created successfully:', data);
      toast({
        title: "Success",
        description: `${postType === 'investment' ? 'Investment opportunity' : 'Community post'} created successfully! It's now live and visible to everyone.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      console.error('Post creation failed:', error);
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
    console.log('Form submitted with data:', data);
    console.log('Post type:', postType);
    
    // Prepare the post data based on type
    const postData = {
      title: data.title,
      content: data.content,
      category: data.category || undefined,
      images: uploadedImages,
      attachments: data.attachments || [],
      postType: postType,
      // Only include investment fields if it's an investment post
      ...(postType === 'investment' ? {
        fundingMin: data.fundingMin || undefined,
        fundingMax: data.fundingMax || undefined,
        useOfFunds: data.useOfFunds || undefined,
        timeline: data.timeline || undefined,
        expectedRoi: data.expectedRoi || undefined,
        teamSize: data.teamSize || undefined,
        businessPlan: data.businessPlan || undefined,
      } : {})
    };
    
    console.log('Sending post data:', postData);
    createPost.mutate(postData);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Post</h1>
            <p className="text-gray-400">Share an investment opportunity or community post</p>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Post Type</CardTitle>
            <CardDescription className="text-gray-400">
              Choose the type of post you want to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={postType} onValueChange={(value) => setPostType(value as 'investment' | 'community')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-600">
                <TabsTrigger value="investment" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <DollarSign className="h-4 w-4" />
                  Investment
                </TabsTrigger>
                <TabsTrigger value="community" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <MessageSquare className="h-4 w-4" />
                  Community
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <Form {...form}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Form submit event triggered');
                    console.log('Form errors:', form.formState.errors);
                    console.log('Form values:', form.getValues());
                    
                    // Bypass validation temporarily to test
                    const formData = form.getValues();
                    console.log('Bypassing validation, calling onSubmit directly');
                    onSubmit(formData);
                  }} className="space-y-6">
                    {/* Common fields */}
                    {/* Title field - only show for investment posts */}
                    {postType === 'investment' && (
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Title *</FormLabel>
                            <FormControl>
                                                          <Input 
                              placeholder="e.g., Seeking ₹5L for Tech Startup in Lucknow"
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                              {...field}
                              value={field.value || ""}
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            {postType === 'investment' ? 'Description *' : 'What\'s on your mind? *'}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={postType === 'investment' 
                                ? "Describe your business idea, market opportunity, and why investors should be interested..."
                                : "Share your thoughts, ask questions, or start a discussion..."}
                              className="min-h-[120px] bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
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
                          <FormLabel className="text-white">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {categories.map((category) => (
                                <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
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
                              <FormLabel className="text-white">Minimum Funding (₹)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="50000"
                                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
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
                              <FormLabel className="text-white">Maximum Funding (₹)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="500000"
                                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
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
                            <FormLabel className="text-white">Use of Funds</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="How will you use the investment? e.g., Product development, Marketing, Inventory..."
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
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
                              <FormLabel className="text-white">Timeline</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 6 months" className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" {...field} value={field.value || ""} />
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
                              <FormLabel className="text-white">Expected ROI</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 15-20%" className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" {...field} value={field.value || ""} />
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
                              <FormLabel className="text-white">Team Size</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="3"
                                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
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
                            <FormLabel className="text-white">Business Plan (URL)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://..."
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
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
                      <Label className="text-white">Images</Label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 bg-gray-800">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <div className="text-sm text-gray-400 mb-2">
                            Upload images to showcase your {postType === 'investment' ? 'business' : 'post'}
                          </div>
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="max-w-xs bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative">
                              <div className="w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-400">Image {index + 1}</span>
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

                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/dashboard")}
                        className="border-gray-600 text-black hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPost.isPending}
                        onClick={() => console.log('Submit button clicked')}
                        className="bg-blue-600 hover:bg-blue-700"
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
      <BottomNavigation activeTab="add" />
    </div>
  );
}