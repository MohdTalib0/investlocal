import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Plus, FileText, Info, CheckCircle } from "lucide-react";
import { authenticatedApiRequest } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";

const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  fundingMin: z.number().min(10000, "Minimum funding must be at least ₹10,000"),
  fundingMax: z.number().min(10000, "Maximum funding must be at least ₹10,000"),
  useOfFunds: z.string().min(20, "Please describe how you'll use the funds"),
  timeline: z.string().optional(),
  expectedRoi: z.string().optional(),
  teamSize: z.number().optional(),
  allowDirectMessages: z.boolean().default(true),
  sharePhoneNumber: z.boolean().default(false),
  emailUpdates: z.boolean().default(false),
}).refine((data) => data.fundingMax >= data.fundingMin, {
  message: "Maximum funding must be greater than or equal to minimum funding",
  path: ["fundingMax"],
});

type CreateListingForm = z.infer<typeof createListingSchema>;

export default function CreateListingPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateListingForm>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      allowDirectMessages: true,
      sharePhoneNumber: false,
      emailUpdates: false,
    },
  });

  const createListing = useMutation({
    mutationFn: async (data: CreateListingForm) => {
      const response = await authenticatedApiRequest("POST", "/api/listings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing published!",
        description: "Your business listing is now live and visible to all investors.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Failed to create listing",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateListingForm) => {
    setIsLoading(true);
    try {
      await createListing.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your listing draft has been saved locally.",
    });
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 pt-12 pb-4">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-4 text-white hover:bg-gray-800"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-white">Create Business Listing</h2>
            <p className="text-sm text-gray-400">Share your opportunity with investors</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6 space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Photos */}
          <div>
            <Label className="block text-sm font-medium text-white mb-3">Business Photos</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gray-800">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Add Photo</p>
              </div>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gray-800">
                <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Add More</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div>
            <Label htmlFor="title">Business Title</Label>
            <Input
              id="title"
              placeholder="e.g., Cloud Kitchen Franchise"
              {...form.register("title")}
              className="mt-2"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => form.setValue("category", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select business category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                <SelectItem value="Tech Startups">Technology</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe your business opportunity, market potential, and why investors should be interested..."
              {...form.register("description")}
              className="mt-2"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Funding Details */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-4">Funding Requirements</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="fundingMin">Min Amount (₹)</Label>
                <Input
                  id="fundingMin"
                  type="number"
                  placeholder="100000"
                  {...form.register("fundingMin", { valueAsNumber: true })}
                  className="mt-2"
                />
                {form.formState.errors.fundingMin && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.fundingMin.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="fundingMax">Max Amount (₹)</Label>
                <Input
                  id="fundingMax"
                  type="number"
                  placeholder="500000"
                  {...form.register("fundingMax", { valueAsNumber: true })}
                  className="mt-2"
                />
                {form.formState.errors.fundingMax && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.fundingMax.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="useOfFunds">Use of Funds</Label>
              <Textarea
                id="useOfFunds"
                rows={3}
                placeholder="Explain how you plan to use the investment funds..."
                {...form.register("useOfFunds")}
                className="mt-2"
              />
              {form.formState.errors.useOfFunds && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.useOfFunds.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  placeholder="6-12 months"
                  {...form.register("timeline")}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="expectedRoi">Expected ROI</Label>
                <Input
                  id="expectedRoi"
                  placeholder="20-25%"
                  {...form.register("expectedRoi")}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                placeholder="8"
                {...form.register("teamSize", { valueAsNumber: true })}
                className="mt-2"
              />
            </div>
          </div>

          {/* Business Plan Upload */}
          <div>
            <Label className="block text-sm font-medium text-white mb-2">Business Plan (Optional)</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gray-800">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-2">Upload your business plan</p>
              <Button type="button" variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-700">
                Choose File
              </Button>
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-4">Contact Preferences</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="allowDirectMessages"
                  checked={form.watch("allowDirectMessages")}
                  onCheckedChange={(checked) => form.setValue("allowDirectMessages", !!checked)}
                />
                <Label htmlFor="allowDirectMessages" className="text-sm text-gray-300">
                  Allow direct messages from verified investors
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="sharePhoneNumber"
                  checked={form.watch("sharePhoneNumber")}
                  onCheckedChange={(checked) => form.setValue("sharePhoneNumber", !!checked)}
                />
                <Label htmlFor="sharePhoneNumber" className="text-sm text-gray-300">
                  Share phone number with interested investors
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="emailUpdates"
                  checked={form.watch("emailUpdates")}
                  onCheckedChange={(checked) => form.setValue("emailUpdates", !!checked)}
                />
                <Label htmlFor="emailUpdates" className="text-sm text-gray-300">
                  Send me investment updates via email
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Publishing..." : "Publish Listing"}
            </Button>
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={saveDraft}
            >
              Save as Draft
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800 font-medium mb-1">Instant Publishing</p>
                <p className="text-sm text-green-700">
                  Your listing will be published immediately and visible to all investors.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
      <BottomNavigation activeTab="add" />
    </div>
  );
}
