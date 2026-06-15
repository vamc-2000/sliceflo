// app/(auth)/login/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../../lib/msalconfig";
import { toast } from "@/components/ui/sonner";
import { User, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginRequest, VerifyOtpRequest } from "@/types/auth.types";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailFormSchema, verifyOtpRequestSchema, type VerifyOtpData, type EmailFormData } from "@/schemas/auth-schema";
import { getAutoDetectData } from "@/utils/device-info";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);

  const authStore = useAuthStore();
  const { user, login, register, isLoading, setCredentials, verifyOtp, checkUserAuth, token, isHydrated, refreshToken } = authStore;

  const [isCheckingExistingAuth, setIsCheckingExistingAuth] = useState(true);
  const [previouslyLoggedInEmail, setPreviouslyLoggedInEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("previouslyLoggedInEmail");
      if (email) {
        setPreviouslyLoggedInEmail(email);
      }
    }
  }, []);

  const [otp, setOtp] = useState("");
  const router = useRouter();
  const { instance, inProgress } = useMsal();
  const [msalLoading, setMsalLoading] = useState<boolean>(false);
  const [isMsalReady, setIsMsalReady] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [otpError, setOtpError] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);


  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<VerifyOtpData>({
    resolver: zodResolver(verifyOtpRequestSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  useEffect(() => {
    if (!isHydrated) return;

    const verifyExistingAuth = async () => {
      if (token) {
        try {
          const { isQuestionnaireCompleted } = await checkUserAuth(token);
          if (isQuestionnaireCompleted) {
            router.replace('/dashboard');
          } else {
            router.replace('/onboarding');
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          setIsCheckingExistingAuth(false);
        }
      } else {
        setIsCheckingExistingAuth(false);
      }
    };
    verifyExistingAuth();
  }, [isHydrated, token, router, checkUserAuth]);

  useEffect(() => {
    if (!showOtpForm || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtpForm, timeLeft]);

  useEffect(() => {
    if (inProgress === "none") {
      setIsMsalReady(true);
    }
  }, [inProgress, instance]);

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsEmailLoading(true);
    try {
      const credentials: LoginRequest = {
        provider: "local",
        email: data.email,
      };

      await login(credentials); // attempt login first

      toast("success", {
        title: "Verification code sent!",
        description: `We've sent a code to ${data.email}`,
      });
      setSubmittedEmail(data.email);
      setShowEmailSent(true);
      setShowEmailForm(false);

    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast("info", {
          title: "No account found",
          description: "Redirecting you to signup...",
          primaryAction: {
            label: "Sign Up",
            onClick: () => router.push("/signup"),
          },
        });
        authStore.setSignupEmail(data.email); //Save email before navigating
        router.push("/signup");
        return;
      }

      if (err?.response?.status === 404 && err?.response?.data?.message === "No workspace found for user") {
        toast("info", {
          title: "No workspace found",
          description: "Redirecting you to create your account...",
        });
        authStore.setSignupEmail(data.email);
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push("/signup");
        return;
      }

      else {
        console.error("Login failed:", err);
        toast("error", {
          title: "Failed to send code",
          description: err?.response?.data?.message || "Something went wrong. Please try again.",
          primaryAction: {
            label: "Retry",
            onClick: () => handleEmailSubmit(data),
          },
        });
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleContinueToEnterCode = () => {
    otpForm.setValue("email", form.getValues("email") || submittedEmail);
    setShowEmailSent(false);
    setShowOtpForm(true);
  };

  const handleOtpSubmit = async (data: VerifyOtpData) => {
    setIsOtpLoading(true);
    try {
      const verificationData: VerifyOtpRequest = {
        email: data.email,
        otp: data.otp,
      };

      const result = await verifyOtp(verificationData);
      // toast("success", {
      //   title: "OTP verified successfully",
      //   description: "Redirecting you to your workspace...",
      // });


      localStorage.setItem("authToken", result.token);

      const { isQuestionnaireCompleted } = await checkUserAuth(result.token);

      console.log("isQuestionnaireCompleted response is ", isQuestionnaireCompleted);

      if (isQuestionnaireCompleted) {
        console.log("Navigating to dashboard...");
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace("/dashboard");
      } else {
        console.log("Navigating to onboarding...");
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace("/onboarding");
      }

    } catch (err: any) {
      toast("error", {
        title: "Invalid OTP",
        description: err?.response?.data?.message || "Please check the code and try again.",
      });
      setOtpError("Invalid OTP. Please try again.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowEmailForm(false);
    setShowEmailSent(false);
    setShowOtpForm(false);
    setEmail("");
    setOtp("");
    setEmailError("");
    setOtpError("");
  };

  const handleGoogleLogin = useCallback(
    async (credentialResponse: CredentialResponse) => {
      setGoogleLoading(true);
      console.log("Google login response:", credentialResponse);
      let decodedToken: any = null;
      try {
        if (!credentialResponse.credential) {
          throw new Error("No credential received from Google");
        }
        decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));

        const credentials: LoginRequest = {
          provider: "google",
          email: decodedToken.email,
          idToken: credentialResponse.credential,
          accessToken: credentialResponse.credential,
        };

        const result = await login(credentials);
        console.log("Google login successful:", result);

        if (!result || !result.token) {
          toast("error", {
            title: "No token received from Google signup. Please try again.",
          });

          // setGoogleLoading(false);
          return;
        }

        // Set cookie FIRST
        document.cookie = `authToken=${result.token}; path=/; max-age=2592000; SameSite=Lax`;
        localStorage.setItem("authToken", result.token);

        const decodedAuthToken = JSON.parse(atob(result.token.split('.')[1]));

        setCredentials({
          token: result.token,
          user: {
            id: decodedAuthToken.userId,
            email: decodedAuthToken.email,
            name: decodedToken.name,
            provider: "google",
            isExistingUser: result.isExistingUser,
          },
        });
        // toast("success", { title: "Logged in successfully with Google" });
        // Wait briefly for cookie to be set before navigation
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Before check user auth:", result.token);
        console.log("isExistingUser: ", result.isExistingUser);

        const data = await getAutoDetectData();
        const currentUser = useAuthStore.getState().user;

        if (result.isExistingUser) {
          const { isQuestionnaireCompleted } = await checkUserAuth(result.token);
          if (isQuestionnaireCompleted) {
            const response = await refreshToken(data);
            const token = response.token;
            console.log("Refresh Token: ", token);
            useAuthStore.getState().setCredentials({
              token,
              user: currentUser ?? undefined
            });
            router.push('/dashboard');
          }
          else
            router.push('/onboarding');
        } else
          router.push('/onboarding');

      } catch (err: any) {
        console.error("Failed Google login:", err);
        if (err?.response?.status === 404 && err?.response?.data?.message === "No workspace found for user") {
          toast("info", {
            title: "Creating your account...",
            description: "Please wait.",
          });

          try {
            const regCredentials = {
              provider: "google" as const,
              email: decodedToken.email,
              idToken: credentialResponse.credential,
              accessToken: credentialResponse.credential,
            };
            const regResult = await register(regCredentials);
            if (!regResult || !regResult.token) throw new Error("No token received");

            document.cookie = `authToken=${regResult.token}; path=/; max-age=2592000; SameSite=Lax`;
            localStorage.setItem("authToken", regResult.token);

            const decodedAuthToken = JSON.parse(atob(regResult.token.split('.')[1]));
            setCredentials({
              token: regResult.token,
              user: {
                id: decodedAuthToken.userId,
                email: decodedAuthToken.email,
                name: decodedToken.name,
                provider: "google",
              },
            });
            // toast("success", { title: "Account created successfully with Google" });
            await new Promise(resolve => setTimeout(resolve, 100));
            router.push('/onboarding');
          } catch (regErr: any) {
            console.error("Auto registration failed:", regErr);
            toast("error", {
              title: "Signup failed",
              description: regErr?.response?.data?.message || "Please try again or go to the signup page.",
            });
          }
          return;
        }

        toast("error", {
          title: "Google login failed",
          description: err?.response?.data?.message || "Please try again.",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    [login, setCredentials, router]
  );

  const handleMicrosoftLogin = async () => {
    if (!isMsalReady) {
      toast("warning", {
        title: "Microsoft auth not ready",
        description: "Please wait a moment and try again.",
      });
      return;
    }

    setMsalLoading(true);
    try {
      const response = await instance.loginPopup(loginRequest);

      console.log("Microsoft login successful:", response);

      const credentials = {
        provider: "microsoft" as const,
        email: response.account?.username ?? "",
        accessToken: response.accessToken ?? "",
      };

      const result = await login(credentials);
      console.log("Microsoft login result:", result);

      localStorage.setItem("authToken", result?.token ?? "");
      // toast("success", {
      //   title: "Microsoft login successful!",
      //   description: `Welcome, ${response.account?.name ?? response.account?.username}!`,
      // });

      const { isQuestionnaireCompleted } = await checkUserAuth();

      if (isQuestionnaireCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      console.error("Failed Microsoft login:", err);
      toast("error", {
        title: "Microsoft login failed",
        description: err?.response?.data?.message || "Something went wrong. Please try again.",
        primaryAction: {
          label: "Retry",
          onClick: () => handleMicrosoftLogin(),
        },
      });
    } finally {
      setMsalLoading(false);
    }
  };

  if (isCheckingExistingAuth) {
    return (
      <AuthPageLayout>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#001F3F]" />
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      showTopRightCTA
      footerContent={
        !showEmailForm && !showEmailSent && !showOtpForm && (
          <>
            By creating account you agree to our{" "}
            <Link href="/terms" className="font-bold underline hover:text-[#001F3F] transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold underline hover:text-[#001F3F] transition-colors">
              Privacy Policy
            </Link>
            .
          </>
        )
      }
    >
      {showEmailSent ? (
        <div className="flex flex-col justify-center items-center space-y-4">
          <div className="w-full text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#001F3F] mb-4">
              Check your email
            </h2>
            <p className="text-sm text-[#001F3F] mb-6">
              We've sent you a temporary security code. Please check your{" "}
              <span className="font-semibold text-black break-all">{form.getValues("email") || submittedEmail}</span> inbox.
            </p>

            <Button
              onClick={handleContinueToEnterCode}
              className="w-full bg-[#001F3F] text-white px-4 py-2 hover:bg-[#001F3F]/90 mb-4 text-sm font-semibold whitespace-normal h-auto min-h-10 flex items-center justify-center"
            >
              Continue to enter security code
            </Button>

            {/* <Link
              href="/login"
              onClick={handleBackToLogin}
              className="text-xs underline text-gray-500 hover:text-[#001F3F] transition-colors"
            >
              Back to login options
            </Link> */}
          </div>
        </div>
      ) : showOtpForm ? (
        <div className="flex flex-col justify-center items-center space-y-4">
          <div className="w-full text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#001F3F] mb-4">
              Check your email
            </h2>
            <p className="text-sm text-[#001F3F] mb-6">
              We've sent you a temporary security code. Please check your {""}
              <span className="font-semibold text-black break-all">{form.getValues("email")}</span> inbox.
            </p>

            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-[#6B7280] font-normal text-sm text-left block">
                  Enter code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="X X X X X X"
                  {...otpForm.register("otp")}
                  required
                  maxLength={6}
                  className="border-[#B0B0B0] h-10 text-lg tracking-widest"
                />
                <div className="flex justify-between items-center">
                  <div className="text-[#FF9500] text-sm font-medium">
                    00:{timeLeft.toString().padStart(2, '0')} s
                  </div>
                  <button
                    type="button"
                    disabled={timeLeft > 0}
                    className={`text-orange-500 text-sm underline hover:no-underline ${timeLeft > 0 ? "opacity-50 cursor-not-allowed no-underline" : ""}`}
                    onClick={() => {
                      setTimeLeft(30);
                      toast("info", {
                        title: "Resending code...",
                        description: `A new code will be sent to ${submittedEmail || form.getValues("email")}`,
                      });
                    }}
                  >
                    Resend security code
                  </button>
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-red-500 text-sm mt-1">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isOtpLoading || !otpForm.formState.isValid}
                className="w-full bg-[#001F3F] text-white h-10 hover:bg-[#001F3F]/90 disabled:bg-[#8392A5] disabled:cursor-not-allowed transition-colors"
              >
                {isOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isOtpLoading ? "Verifying..." : "Continue"}
              </Button>
            </form>
            {/* <Link
              href="/login"
              onClick={handleBackToLogin}
              className="block mt-4 text-xs underline text-gray-500 hover:text-[#001F3F] transition-colors"
            >
              Back to login options
            </Link> */}

            <p className="text-xs text-gray-500 mt-4">
              This code would be valid for 10 minutes*
            </p>
          </div>
        </div>
      ) : !showEmailForm ? (
        <div className="w-full">
          <div className="space-y-4">
            <div className="relative w-full h-10 group">
              {/* Invisible real Google button that handles login */}
              <div className="absolute inset-0 opacity-0 z-10 overflow-hidden">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => toast("error", { title: "Google login failed" })}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="384"
                />
              </div>

              {/* Visible custom button matching Microsoft/Email style */}
              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                className="w-full h-10 border-[#001F3F] text-[#001F3F] font-medium flex items-center justify-center gap-2 group-hover:bg-accent group-hover:text-accent-foreground dark:group-hover:bg-input/50 transition-colors"
              >
                {googleLoading ? "Signing in..." : "Sign in with Google"}
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image
                    src="/images/login/google.svg"
                    alt="Google"
                    width={18}
                    height={18}
                    className="h-4 w-4"
                  />
                )}
              </Button>
            </div>

            {previouslyLoggedInEmail && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 py-1 px-2.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/80 rounded-full w-fit mx-auto shadow-sm transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span>Previously logged in:</span>
                <span className="font-semibold text-[#001F3F] dark:text-neutral-200">{previouslyLoggedInEmail}</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={isLoading || msalLoading || !isMsalReady}
              variant="outline"
              className="w-full h-10 border-[#001F3F] text-[#001F3F] font-medium relative flex items-center justify-center"
            >
              {/* CENTER TEXT */}
              <span className="flex items-center gap-2 text-[#001F3F] font-medium">
                {msalLoading ? "Logging in..." : "Sign in with Microsoft"}
                {msalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {!msalLoading && (
                  <Image
                    src="/images/login/microsoftLogo.svg"
                    alt="Microsoft"
                    width={18}
                    height={18}
                    className="h-4 w-4"
                  />
                )}
              </span>
            </Button>
            <Button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full h-10 border-[#001F3F] text-[#001F3F] font-medium"
              variant="outline"
            >
              Sign in with Email
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <Label
              htmlFor="email"
              className={`font-normal text-sm mb-1 ${form.formState.errors.email ? "text-[#D04545]" : "text-[#6B7280]"
                }`}
            >
              Work Email is required
            </Label>
            <div className="relative">
              <User className={`absolute left-3 top-3 h-4 w-4  ${form.formState.isValid && !isEmailLoading
                ? "text-[#34C759]"
                : "text-[#8392A5]"
                }`} />
              <Input
                id="email"
                type="email"
                placeholder="Enter your work email address..."
                className={`pl-9 w-full h-10 text-sm border ${form.formState.errors.email
                  ? "border-[#D04545] focus-visible:ring-red-200"
                  : "border-[#B0B0B0] focus-visible:ring-[#001F3F]"
                  }`}
                {...form.register("email")}
                required
              />
            </div>
            <div
              className={`min-h-[20px] mb-3 transition-all duration-300 ${form.formState.errors.email ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                }`}
            >
              {form.formState.errors.email && (
                <p className="text-[#D04545] text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!form.formState.isValid || isEmailLoading}
              className={`w-full h-10 transition-colors duration-200 rounded-md ${form.formState.isValid && !isEmailLoading
                ? "bg-[#001F3F] text-white hover:bg-[#001F3F]/90"
                : "bg-[#8392A5] text-white cursor-not-allowed"
                }`}
            >
              {isEmailLoading ? "Sending Code..." : "Flow with Sliceflo"}
            </button>
          </form>
          {/* <Button
            variant="ghost"
            onClick={() => setShowEmailForm(false)}
            className="w-full mt-2 text-gray-500  underline cursor-pointer "
          >
            Back to login options
          </Button> */}
        </div>
      )}
    </AuthPageLayout>
  );
}
