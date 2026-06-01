"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { useAuthStore } from "@/stores/auth-store";


interface WelcomePageProps {
    onNext: () => void;
}

import { useEffect, useState } from "react";

export default function WelcomePage({ onNext }: WelcomePageProps) {
    const { user, isAuthenticated } = useAuthStore();
    const [email, setEmail] = useState<string | null>(null);

 useEffect(() => {
        // Priority order for getting email:
        // 1. From auth store user object
        // 2. From sessionStorage (backup)
        // 3. From localStorage (backup)
        
        if (user?.email) {
            setEmail(user.email);
            console.log("Email from auth store:", user.email);
        } else {
            // Fallback to sessionStorage
            const signupEmail = sessionStorage.getItem("signupEmail");
            if (signupEmail) {
                setEmail(signupEmail);
                console.log("Email from sessionStorage:", signupEmail);
            } else {
                // Additional fallback - check localStorage for user data
                const storedUser = localStorage.getItem("auth-storage");
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        if (parsedUser?.state?.user?.email) {
                            setEmail(parsedUser.state.user.email);
                            console.log("Email from localStorage:", parsedUser.state.user.email);
                        }
                    } catch (error) {
                        console.error("Error parsing stored user data:", error);
                    }
                }
            }
        }
    }, [user]);

    // Debug log to see what's in the auth store
    useEffect(() => {
        console.log("Auth Store Debug:", {
            isAuthenticated,
            user,
            userEmail: user?.email,
        });
    }, [isAuthenticated, user]);
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Background Image */}
            <Image
                src="/images/loginbackground.jpeg"
                alt="Background"
                fill
                priority
                quality={100}
                className="object-cover pointer-events-none"
            />
            <div className="main-container">
                <div className="absolute text-md text-gray-600 mt-5 mx-auto items-center justify-center text-center w-full">
                    <Label className="text-sm text-gray-400 mt-5">Logged in as</Label> <br />
                    <Label className="text-sm text-orange-600 mt-5">{email || "Loading..."} </Label>
                </div>
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-1">
                    <div className="w-full max-w-md overflow-hidden">
                        <Image
                            src="/images/circleLogo.svg"
                            alt="Small Logo"
                            width={80}
                            height={80}
                            className="m-auto"
                        />
                        <h1 className=" sm:text-4xl font-bold text-gray-700 dark:text-gray-200 my-4 text-center">
                            Welcome to SliceFlo
                        </h1>
                        <div className="text-md text-gray-600 mb-6 text-center">
                            <span>
                                {" "}
                                SliceFlo is a purpose-built platform for modern teams. Simplify task management, team
                                collaboration, and project execution—all in one place.{" "}
                            </span>
                        </div>
                        <Button
                            onClick={() => onNext()}
                            className="w-full bg-[#001F3F] text-white h-10 hover:bg-[#001F3F]/90 rounded-md"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
