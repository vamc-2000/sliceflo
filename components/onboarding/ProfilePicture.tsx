"use client";

import { FC, useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Ellipse from "@/public/images/onboarding/Ellipse";
import AddImage from "@/public/images/onboarding/Addimage";
import iconMap from "@/lib/iconMap";
import Image from "next/image";
import { useProfileStore } from "@/stores/profile-store";

import OnboardBackground from "./OnboardLayout";
import ImageUploadModal from "./ImageUploadModal";

interface ProfilePictureProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  showDots?: boolean;
}

const ProfilePicture: FC<ProfilePictureProps> = ({
  onNext,
  onBack,
  currentStep = 0,
  totalSteps = 0,
  showDots = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand store
  const { user, updateUserProfile, uploadUserProfilePicture, fetchUserProfile } = useProfileStore();

  // Local state for form and preview
  const [localFullName, setLocalFullName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(Date.now());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const UserIcon = iconMap["user2"];

  useEffect(() => {
    const initProfile = async () => {
      try {
        const data = await fetchUserProfile();
        console.log("Profile fetched:", data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    initProfile();
  }, []);

  const initialized = useRef(false);
  const initializedImage = useRef(false);

  useEffect(() => {
    if (user && !initialized.current) {
      setLocalFullName(user.name || "");
      initialized.current = true;  // mark initialized
    }
    if (!initializedImage.current && user?.profilePictureUrl) {
      // LOG: show profilePictureUrl and what you will use for preview
      console.log("Initializing avatar preview with (should be absolute URL):", user.profilePictureUrl);
      setAvatarPreview(user.profilePictureUrl); // Don't format, use as is
      setImageKey(Date.now());
      initializedImage.current = true;
    }
  }, [user]);

  // Open file selection dialog
  const handleUploadClick = () => {
    setIsModalOpen(true);
  };

  const handleFileSelect = async (file: File) => {
  try {
    setUploadError(null);
    setIsUploading(true);

    // Validate file
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size must be less than 4MB");
      setIsUploading(false);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only image files (JPEG, PNG, GIF, WebP) are allowed");
      setIsUploading(false);
      return;
    }

    // Upload to backend
    const response = await uploadUserProfilePicture(file);
    console.log("Upload response:", response);

    // If API returns only s3Key, construct full CloudFront URL manually
    if (response?.s3Key) {
      const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";
      const normalizedBase = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const normalizedKey = response.s3Key.startsWith("/")
        ? response.s3Key.slice(1)
        : response.s3Key;

      const fullUrl = `${normalizedBase}/${normalizedKey}`;

      // Update preview immediately
      setAvatarPreview(fullUrl);
      setImageKey(Date.now());

    } 
    setIsUploading(false);
  } catch (error: any) {
    console.error("Upload error:", error);
    setUploadError(error.message || "Failed to upload profile picture");
    setIsUploading(false);
  }
};


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  // Save name and profile picture to backend/profile store on next
  const handleNext = async () => {
    const trimmedName = localFullName.trim();
    if (!trimmedName) {
      setUploadError("Please enter your name");
      return;
    }

    try {
      // Patch profile with updated name and picture
      await updateUserProfile({
        name: trimmedName,
        profilePictureUrl: avatarPreview || user?.profilePictureUrl,
        // onboardingStep: currentStep,
      });
      onNext();
    } catch (error) {
      setUploadError("Failed to update profile");
    }
  };

  // LOG: what will actually be rendered as the avatar image source
  if (avatarPreview) {
    console.log("Rendering avatar image with src:", avatarPreview);
  }

  return (
    <>
      <OnboardBackground
        showDots={showDots}
        currentStep={currentStep}
        totalSteps={totalSteps}
        allowClickNavigation={false}
        rightIllustration={
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src="/images/onboarding/ProfilePicture.svg"
              alt="Profile setup illustration"
              width={500}
              height={500}
              priority
              className="w-full h-full object-cover"
            />
          </div>
        }
      >
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-8">
              Select your Profile picture
            </h1>

            {/* Error message */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Picture and upload button */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative flex-shrink-0">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <Ellipse className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {avatarPreview ? (
                      <Image
                        key={imageKey}
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover rounded-full"
                        width={96}
                        height={96}
                        unoptimized
                        priority
                      />
                    ) : (
                      UserIcon && <UserIcon size={32} className="text-[#6B7280]" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="absolute -bottom-1 -right-1 cursor-pointer hover:scale-110 transition-transform"
                    disabled={isUploading}
                  >
                    <AddImage className="w-6 h-6 sm:w-8 sm:h-8" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001F3F]"></div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                {avatarPreview ? (
                  <p className="text-sm text-gray-600 leading-relaxed">Change image</p>
                ) : (
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">Upload image (up to 4MB)</p>
                )}
              </div>
            </div>
          </div>

          {/* Name input */}
          <div className="mb-8">
            <label className="block text-base font-semibold text-gray-900 mb-3">What is your full name?</label>
            <Input
              type="text"
              placeholder="Name Surname"
              value={localFullName}
              onChange={(e) => setLocalFullName(e.target.value)}
              disabled={isUploading}
              className="h-12 text-sm border-0 border-b border-gray-300 rounded-none focus:outline-none focus:ring-0 focus:border-[#001F3F] bg-transparent px-0"
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handleNext}
              disabled={!localFullName.trim() || isUploading}
              className={`px-8 py-3 text-sm font-medium rounded-lg transition-all min-w-[120px] ml-auto ${localFullName.trim() && !isUploading
                ? "bg-[#001F3F] hover:bg-[#01172C] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isUploading ? "Processing..." : "Next"}
            </Button>
          </div>
        </div>
      </OnboardBackground>

      <ImageUploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSelect={handleFileSelect}
        initialImage={avatarPreview || user?.profilePictureUrl}
      />
    </>
  );
};

export default ProfilePicture;
