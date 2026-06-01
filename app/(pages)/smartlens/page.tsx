// app/(pages)/smartlens/page.tsx
"use client";
import { LandingPage } from "@/components/LandingPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useRouter } from "next/navigation";

export default function SmartLensPage() {
  const router = useRouter();

  return (
    <div className="overflow-hidden h-full">
      <div className="border-b">
        <Breadcrumbs />
      </div>
      <div className="h-full overflow-auto p-6">
        <LandingPage
          title="Enhance Your Visual Experience with Smart Lens"
          description="AI-powered image recognition and real-time insights at your fingertips."
          extraText="Transform how you interact with the world around you"
          imageSrc="/images/docs-image.png"
          imageAlt="SmartLens illustration"
          buttonText="Create a SmartLens"
          onButtonClick={() => router.push("/smartlens/create")}
        />
      </div>
    </div>
  );
}
