"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  interests?: string;
}

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    interests: "",
  });
  const [avatar, setAvatar] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiRequest<{ user: User }>("/users/me");
        const u = res.user || (res as any);
        setUser(u);
        setFormData({
          name: u.name || "",
          bio: u.bio || "",
          location: u.location || "",
          interests: u.interests || "",
        });
        setAvatar(u.avatar || "");
      } catch (error) {
        // Not authenticated, redirect to login
        router.replace("/auth/login");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Avatar upload handler
  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const data = await apiRequest(`/users/${user!._id}/avatar`, {
        method: "POST",
        body: formData,
      });
      setAvatar((data as any).avatar);
      toast({
        title: "Avatar Updated",
        description: "Your avatar has been updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiRequest(`/users/${user!._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const updatedUser = (response as any).user || response as User;
      setUser(updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      router.push("/profile");
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute left-0 right-0 bottom-0 h-1 bg-red-500 rounded-b"></div>
            <Button
              type="button"
              size="sm"
              className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
              onClick={handleCameraClick}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Where are you based?"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interests">Interests</Label>
          <Input
            id="interests"
            placeholder="What are you interested in?"
            value={formData.interests}
            onChange={e => setFormData({ ...formData, interests: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </form>
    </div>
  );
} 