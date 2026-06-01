"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import iconMap from "@/lib/iconMap";
import { toast } from "@/components/ui/sonner";
import ImageUploadModal from "../../onboarding/ImageUploadModal";
import Image from "next/image";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useProfileStore } from "@/stores/profile-store";
import { Loader2 } from "lucide-react";

const Trash = iconMap["trash"];

export const departmentOptions = [
  { value: "HR & Recruiting", label: "HR & Recruiting" },
  { value: "Account Management", label: "Account Management" },
  { value: "Business Development", label: "Business Development" },
  { value: "Content Creation", label: "Content Creation" },
  { value: "Product & Design", label: "Product & Design" },
  { value: "Development", label: "Development" },
  { value: "Finance", label: "Finance" },
  { value: "Sales & Accounting", label: "Sales & Accounting" },
  { value: "IT & Engineering & Support", label: "IT & Engineering & Support" },
  { value: "Marketing", label: "Marketing" },
  { value: "Supply Chain", label: "Supply Chain" },
  { value: "Logistics", label: "Logistics" },
  { value: "Operations", label: "Operations" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Others", label: "Others" },



];
export const industryOptions = [
  { value: "Consumer Services", label: "Consumer Services" },
  { value: "Education", label: "Education" },
  { value: "Finance & Accounting", label: "Finance & Accounting" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Retail", label: "Retail" },
  { value: "Beauty", label: "Beauty" },
  { value: "Automotive", label: "Automotive" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Chemicals", label: "Chemicals" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Construction", label: "Construction" },
  { value: "Software", label: "Software" },
  { value: "Energy", label: "Energy" },
  { value: "Logistics", label: "Logistics" },
  { value: "Aerospace", label: "Aerospace" },
  { value: "Others", label: "Others" },
];

const skillsList = [
  "Research",
  "AB Testing",
  "Wireframes",
  "Prototypes",
  "Lo-fi Wireframes",
  "Sticker sheet",
  "Construction",
  "Project Management",
];

const isValidPhone = (phone: string) => /^\+\d{1,3}\s?\d{4,14}(?:x.+)?$/.test(phone);

const ProfileSettingsPage = () => {
  const [activeSection, setActiveSection] = useState<"personal" | "job" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [phoneError, setPhoneError] = useState<{ workPhone?: string; personalPhone?: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = React.useState(false); // New state for save action only

  const {
    user: profile,
    isLoading,
    fetchUserProfile,
    updateUserProfile,
    uploadUserProfilePicture
  } = useProfileStore();

  //  'localProfile' consistently
  const [localProfile, setLocalProfile] = useState({
    name: "",
    email: "",
    workPhone: "",
    personalPhone: "",
    about: "",
    jobRole: "",
    department: "",
    industry: "",
    skills: [] as string[],
    profilePictureUrl: "",
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";
  const profilePictureUrl = profile?.profilePictureUrl || localProfile.profilePictureUrl;
  const fullProfileUrl = profilePictureUrl
    ? profilePictureUrl.startsWith("http")
      ? profilePictureUrl
      : `${s3BaseUrl.replace(/\/$/, "")}/${profilePictureUrl}`
    : "";

  useEffect(() => {
    fetchUserProfile();
  }, []);

  //  profile data correctly
  useEffect(() => {
    if (profile) {
      console.log(" Profile data received:", profile);
      setLocalProfile({
        name: profile.name || "",
        email: profile.email || "",
        workPhone: profile.workPhone || "",
        personalPhone: profile.personalPhone || "",
        about: profile.about || "",
        jobRole: profile.jobRole || "",
        department: profile.department || "",
        industry: profile.industry || "",
        skills: profile.skills || [],
        profilePictureUrl: profile.profilePictureUrl || "",
      });
      setSelectedSkills(profile.skills || []);
      setHasChanges(false);
    }
  }, [profile]);

  const handleInputChange = (field: keyof typeof localProfile, value: string | string[]) => {
    setLocalProfile((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);

    if (field === "workPhone" || field === "personalPhone") {
      const error = value && typeof value === "string" && !isValidPhone(value)
        ? "Invalid phone number. Use +xx xxxx xxxx"
        : undefined;
      setPhoneError((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSave = async () => {
    // Move validation checks BEFORE setting isSaving
    if (!hasChanges) return;

    if (phoneError.workPhone || phoneError.personalPhone) {
      toast("error", { title: "Error", description: "Please fix phone number errors" });
      return;
    }

    // Build payload first
    const payload: any = {};

    if (localProfile.name !== profile?.name) payload.name = localProfile.name;
    if (localProfile.workPhone !== profile?.workPhone) payload.workPhone = localProfile.workPhone;
    if (localProfile.personalPhone !== profile?.personalPhone) payload.personalPhone = localProfile.personalPhone;
    if (localProfile.about !== profile?.about) payload.about = localProfile.about;
    if (localProfile.jobRole !== profile?.jobRole) payload.jobRole = localProfile.jobRole;
    if (localProfile.department !== profile?.department) payload.department = localProfile.department;
    if (localProfile.industry !== profile?.industry) payload.industry = localProfile.industry;
    if (JSON.stringify(localProfile.skills) !== JSON.stringify(profile?.skills)) {
      payload.skills = localProfile.skills;
    }

    if (Object.keys(payload).length === 0) {
      alert("No changes to save");
      return;
    }


    setIsSaving(true);

    try {
      await updateUserProfile(payload);
      await fetchUserProfile();
      toast("success", { title: "Success", description: "Profile updated successfully" });
      setHasChanges(false);
    } catch (error) {
      console.error("Update failed:", error);
      toast("error", { title: "Error", description: "Failed to update profile" });
    } finally {
      setIsSaving(false); // Always reset isSaving in finally block
    }
  };


  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      await uploadUserProfilePicture(file);
      await fetchUserProfile();
      setIsModalOpen(false);
      toast("success", { title: "Success", description: "Profile picture updated successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast("error", { title: "Error", description: "Failed to upload picture" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    try {
      setIsUploading(true);
      // Try null first as it's more explicit for many backends
      await updateUserProfile({ profilePictureUrl: null as any });
      await fetchUserProfile();
      toast("success", { title: "Success", description: "Profile picture removed successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      toast("error", { title: "Error", description: "Failed to remove profile picture" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Personal Details Card */}
      <SettingsCard
        id="personal"
        title="Personal Details"
        subtitle={[localProfile.name || "User", localProfile.workPhone, localProfile.personalPhone].filter(Boolean).join(", ")}
        icon={
          <Avatar className="w-10 h-10">
            <AvatarImage src={fullProfileUrl || undefined} alt={localProfile.name} />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {localProfile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        }
        isActive={activeSection === "personal"}
        onToggle={() => setActiveSection((prev) => (prev === "personal" ? null : "personal"))}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="relative w-24 h-24">
              <Avatar className="w-24 h-24">
                <AvatarImage src={fullProfileUrl || undefined} />
                <AvatarFallback className="bg-[#E5E5EA] text-white text-2xl">
                  {localProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Loading Spinner Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-card/80 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--foreground)" }} />
                </div>
              )}

              {/* Delete Button - Hidden during upload */}
              {(profile?.profilePictureUrl || localProfile.profilePictureUrl) && !isUploading && (
                <button
                  onClick={handleDeletePicture}
                  disabled={isUploading}
                  className="absolute bottom-0 left-0 w-6 h-6 rounded-full shadow flex items-center justify-center bg-card hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash size={12} className="text-red-600" />
                </button>
              )}

              {/* Upload Button - Hidden during upload */}
              {!isUploading && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  +
                </button>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground mt-2 text-center text-zinc-400">
              {isUploading
                ? "Uploading..."
                : profilePictureUrl
                  ? "Change image"
                  : "Pick up a photo"}
              <br />
              up to 4 MB
            </p>
          </div>

          {/* Form Section */}
          <div className="flex-1 space-y-4">
            {/* Display Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <Label htmlFor="name" className="text-[14px] font-medium leading-[100%] text-foreground">
                Display Name
              </Label>
              <Input
                id="name"
                placeholder="This name will appear to other users"
                value={localProfile.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="md:col-span-2"
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <Label htmlFor="email" className="text-[14px] font-medium leading-[100%] text-foreground">
                Email 
              </Label>
              <Input
                id="email"
                value={localProfile.email}
                disabled
                className="md:col-span-2 bg-muted cursor-not-allowed border-none"
              />
            </div>

            {/* Work Phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label htmlFor="workPhone" className="text-[14px] font-medium leading-[100%] text-foreground mt-2">
                Work Phone
              </Label>
              <div className="md:col-span-2">
                <Input
                  id="workPhone"
                  placeholder="+xx xxxx xxxx"
                  value={localProfile.workPhone}
                  onChange={(e) => handleInputChange("workPhone", e.target.value)}
                  className={phoneError.workPhone ? "border-red-500" : ""}
                />
                {phoneError.workPhone && (
                  <p className="text-xs text-red-500 mt-1">{phoneError.workPhone}</p>
                )}
              </div>
            </div>

            {/* Personal Phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label htmlFor="personalPhone" className="text-[14px] font-medium leading-[100%] text-foreground mt-2">
                Personal Phone
              </Label>
              <div className="md:col-span-2">
                <Input
                  id="personalPhone"
                  placeholder="+xx xxxxxxxxxx"
                  value={localProfile.personalPhone}
                  onChange={(e) => handleInputChange("personalPhone", e.target.value)}
                  className={phoneError.personalPhone ? "border-red-500" : ""}
                />
                {phoneError.personalPhone && (
                  <p className="text-xs text-red-500 mt-1">{phoneError.personalPhone}</p>
                )}
              </div>
            </div>

            {/* About Me */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <Label htmlFor="about" className="text-[14px] font-medium leading-[100%] text-foreground mt-2">
                About Me
              </Label>
              <Textarea
                id="about"
                placeholder="Say something about you..."
                rows={5}
                value={localProfile.about}
                onChange={(e) => handleInputChange("about", e.target.value)}
                className="md:col-span-2 resize-none"
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Job Role & Skills Card */}
      <SettingsCard
        id="job"
        title="Job Role & Skills"
        subtitle={[localProfile.industry, localProfile.department, localProfile.jobRole].filter(Boolean).join(", ")}
        icon={
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
            <Image
              src="/Learning.png"
              alt="Learning"
              fill
              className="object-cover rounded-full"
            />
          </div>
        }
        isActive={activeSection === "job"}
        onToggle={() => setActiveSection((prev) => (prev === "job" ? null : "job"))}
      >
        <div className="space-y-4">

          {/* Industry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Label
              htmlFor="industry"
              className="text-[14px] font-medium leading-[100%] text-foreground"
            >
              Industry 
            </Label>
            <div className="md:col-span-2">
              <Select
                value={localProfile.industry}
                onValueChange={(value) => handleInputChange("industry", value)}
              >
                <SelectTrigger className="w-full font-inter text-[14px] font-normal leading-5">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Label
              htmlFor="department"
              className="text-[14px] font-medium leading-[100%] text-foreground"
            >
              Department
            </Label>
            <div className="md:col-span-2">
              <Select
                value={localProfile.department}
                onValueChange={(value) => handleInputChange("department", value)}
              >
                <SelectTrigger className="w-full font-inter text-[14px] font-normal leading-5">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Role */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Label
              htmlFor="jobRole"
              className="text-[14px] font-medium leading-[100%] text-foreground"
            >
              Job Role 
            </Label>
            <Input
              id="jobRole"
              placeholder="What's your job role?"
              value={localProfile.jobRole}
              onChange={(e) => handleInputChange("jobRole", e.target.value)}
              className="md:col-span-2 font-inter text-[16px] font-normal leading-5"
            />
          </div>

          {/* Skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <Label className="text-[14px] font-medium leading-[100%] text-foreground mt-2">
              Skills 
            </Label>
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-card">
                {selectedSkills.map((skill, idx) => (
                  <Badge key={idx} variant="default" className="bg-primary text-white font-inter text-[12px]">
                    {skill}
                    <button
                      onClick={() => {
                        const updated = selectedSkills.filter((s) => s !== skill);
                        setSelectedSkills(updated);
                        handleInputChange("skills", updated);
                      }}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  placeholder={selectedSkills.length === 0 ? "Type to add" : ""}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const newSkills = inputValue
                        .split(/[\s,]+/)
                        .map((s) => s.trim())
                        .filter((s) => s && !selectedSkills.includes(s));

                      if (newSkills.length > 0) {
                        const updated = [...selectedSkills, ...newSkills];
                        setSelectedSkills(updated);
                        handleInputChange("skills", updated);
                      }
                      setInputValue("");
                    }
                  }}
                  className="flex-1 outline-none text-sm min-w-[120px] font-inter"
                />
              </div>

              {/* Skills Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {skillsList.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <Button
                      key={skill}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updated = isSelected
                          ? selectedSkills.filter((s) => s !== skill)
                          : [...selectedSkills, skill];
                        setSelectedSkills(updated);
                        handleInputChange("skills", updated);
                      }}
                      className={`font-inter text-[12px] font-medium leading-4 ${isSelected ? "bg-primary text-primary-foreground" : "text-foreground"
                        }`}
                    >
                      {skill}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </SettingsCard>


      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges || !!phoneError.workPhone || !!phoneError.personalPhone}
          className="font-inter text-[14px] font-medium leading-5 px-8 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ letterSpacing: "0" }}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving.." : "Save"}
        </Button>
      </div>



      {/* Image Upload Modal */}
      <ImageUploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSelect={handleFileSelect}
        initialImage={fullProfileUrl}
      />
    </div>
  );
};

export default ProfileSettingsPage;

