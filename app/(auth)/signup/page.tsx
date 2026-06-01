'use client';

import Image from "next/image";
import Link from "next/link";
import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailFormSchema, verifyOtpRequestSchema, type VerifyOtpData, type EmailFormData } from "@/schemas/auth-schema";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "@/stores/auth-store";
import { isExistingUser } from "@/lib/utils";
import { loginRequest } from "@/lib/msalconfig";
import { toast } from "@/components/ui/sonner";
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import Layout from "@/components/layout/AuthPageLayout";
import { access } from "fs";
import { getAutoDetectData } from "@/utils/device-info";

const GOOGLEClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [isMsalReady, setIsMsalReady] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const [showOtpForm, setShowOtpForm] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const [isCheckingExistingAuth, setIsCheckingExistingAuth] = useState(true);

  const router = useRouter();
  const { instance, inProgress } = useMsal();
  const { register, setCredentials, verifyOtp, checkUserAuth, signupEmail, setSignupEmail, refreshToken, token, isHydrated } = useAuthStore();

  // const isExistingUser = user?.isExistingUser ?? false;

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
    if (signupEmail) {
      form.setValue("email", signupEmail);
      setShowEmailForm(true);
      toast("info", {
        title: "Welcome back!",
        description: `Let's get you signed up with ${signupEmail}`,
      });
      setSignupEmail(null); // clear it so it doesn't persist unnecessarily
    }
  }, [signupEmail, form, setSignupEmail]);

  useEffect(() => {
    if (inProgress === "none") {
      setIsMsalReady(true);
    }
  }, [inProgress]);

  useEffect(() => {
    if (!showOtpForm || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtpForm, timeLeft]);

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const credentials = { provider: "local" as const, email: data.email };
      const res = await register(credentials);

      if (signupEmail) {
        setSignupEmail(data.email);
        setSubmittedEmail(data.email);
      } else {
        sessionStorage.setItem("signupEmail", data.email);
        setSubmittedEmail(data.email);
      }
      toast("success", {
        title: "Email registered successfully!",
      });
      setEmailSent(true);
      setIsExistingUser(res.isExistingUser ?? false);
    } catch (error: any) {
      toast("error", {
        title: "Signup failed",
        description: error?.response?.data?.message || "Something went wrong. Please try again.",
        primaryAction: {
          label: "Retry",
          onClick: () => handleEmailSubmit(data),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignup = () => {
    setShowEmailForm(false);
    setEmailSent(false);
    setShowOtpForm(false);
    form.reset();
    otpForm.reset();
  };

  const handleOtpSubmit = async (data: VerifyOtpData) => {
    setIsOtpLoading(true);
    try {
      const result = await verifyOtp(data);

      // Only show success and navigate if API call succeeds
      toast("success", {
        title: "OTP verified successfully!",
        description: "Redirecting you to your workspace...",
      });

      if (isExistingUser) {
        const { isQuestionnaireCompleted } = await checkUserAuth(result.token);
        if (isQuestionnaireCompleted)
          router.push('/dashboard');
        else
          router.push('/onboarding');
      } else
        router.push('/onboarding');
    } catch (error: any) {
      console.error("OTP verification error:", error);

      // Handle different error scenarios
      toast("error", {
        title: "OTP verification failed",
        description: error?.message || "Please check the code and try again.",
      });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleGoogleSignup = useCallback(
    async (credentialResponse: CredentialResponse) => {
      console.log("Google signup response:", credentialResponse);
      setGoogleLoading(true);
      try {
        if (!credentialResponse.credential) throw new Error("Google credential is missing");

        const decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
        console.log("decoded token", decodedToken);

        const credentials = {
          provider: "google" as const,
          email: decodedToken.email,
          idToken: credentialResponse.credential,
          accessToken: credentialResponse.credential,
        };

        const result = await register(credentials);

        if (!result || !result.token) {
          toast("error", {
            title: "Google signup failed",
            description: "No token received. Please try again.",
          });

          setGoogleLoading(false);
          return;
        }

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

        toast("success", {
          title: "Signed up with Google!",
          description: `Welcome, ${decodedToken.name}!`,
        });

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
      } catch (error: any) {
        console.error("Navigation or authentication error:", error);
        toast("error", {
          title: "Google signup failed",
          description: error?.response?.data?.message || "Something went wrong. Please try again.",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    [register, setCredentials, router, checkUserAuth]
  );

  const handleMicrosoftSignup = async () => {
    if (!isMsalReady) {
      toast("warning", {
        title: "Microsoft auth not ready",
        description: "Please wait a moment and try again.",
      });
      return;
    }
    setMsLoading(true);

    try {
      const response = await instance.loginPopup(loginRequest);

      const credentials = {
        provider: "microsoft" as const,
        email: response.account?.username ?? "",
        accessToken: response.accessToken ?? "",
      };

      const result = await register(credentials);
      console.log("Microsoft signup result:", result);

      const { isQuestionnaireCompleted } = await checkUserAuth(result.token);
      console.log("Is questions completed", isQuestionnaireCompleted);

      localStorage.setItem("authToken", result?.token ?? "");
      toast("success", {
        title: "Signed up with Microsoft!",
        description: `Welcome, ${response.account?.name ?? response.account?.username}!`,
      });

      if (result.isExistingUser) {
        const { isQuestionnaireCompleted } = await checkUserAuth(result.token);
        if (isQuestionnaireCompleted)
          router.push('/dashboard');
        else
          router.push('/onboarding');
      } else
        router.push('/onboarding');

    } catch (error: any) {
      toast("error", {
        title: "Microsoft signup failed",
        description: error?.response?.data?.message || "Something went wrong. Please try again.",
        primaryAction: {
          label: "Retry",
          onClick: () => handleMicrosoftSignup(),
        },
      });
    } finally {
      setMsLoading(false);
    }
  };

  if (isCheckingExistingAuth) {
    return (
      <Layout>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#001F3F]" />
        </div>
      </Layout>
    );
  }

  if (emailSent) {
    return (
      <Layout
      >
        <div className="flex flex-col justify-center items-center space-y-4">
          <div className="w-full text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#001F3F] mb-4">
              Check your email
            </h2>
            <p className="text-sm text-[#001F3F] mb-6">
              We&apos;ve sent you a temporary security code. Please check your{" "}
              <span className="font-semibold text-black break-all">{form.getValues("email") || submittedEmail}</span> inbox.
            </p>

            <Button
              onClick={() => {
                otpForm.setValue("email", form.getValues("email") || submittedEmail);
                setShowOtpForm(true);
                setEmailSent(false);
              }}
              className="w-full bg-[#74869A] text-white px-4 py-2 hover:bg-[#001F3F]/90 text-sm font-semibold whitespace-normal h-auto min-h-10 flex items-center justify-center"
            >
              Continue to enter code
            </Button>

            <Link
              href="/signup"
              onClick={handleBackToSignup}
              className="block mt-4 text-xs underline text-gray-500 hover:text-[#001F3F] transition-colors"
            >
              Back to Login Options
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {/* <Toaster position="top-right" richColors expand={true} /> */}
      <GoogleOAuthProvider clientId={GOOGLEClientId}>
        <Layout
          showTopRightReg
          footerContent={
            showOtpForm ? (
              <div className="text-xs font-bold">This code would be valid for 30 seconds*</div>
            ) : (
              !showEmailForm ? (
                <>
                  By creating account you agree to our{" "}
                  <Link href="/terms" className="font-bold underline hover:text-[#001F3F] transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-bold underline hover:text-[#001F3F] transition-colors">
                    Privacy Policy
                  </Link>.
                </>
              ) : null
            )
          }
        >
          {showOtpForm ? (
            <div className="flex flex-col justify-center items-center space-y-4">
              <div className="w-full text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-[#001F3F] mb-4">
                  Check your email
                </h2>
                <p className="text-sm text-[#001F3F] mb-6">
                  We&apos;ve sent you a temporary security code. Please check your{" "}
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
                      maxLength={6}
                      className="border-[#B0B0B0] h-10 text-lg tracking-widest "
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
                    className="w-full bg-[#8392A5] text-white h-10 hover:bg-[#001F3F]/90 disabled:bg-[#8392A5] disabled:cursor-not-allowed transition-colors"
                  >
                    {isOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isOtpLoading ? "Verifying..." : "Continue"}
                  </Button>
                </form>

                <Link
                  href="/signup"
                  onClick={handleBackToSignup}
                  className="block mt-4 text-xs underline text-[#7A869A] hover:text-[#001F3F] transition-colors"
                >
                  Back to login options
                </Link>
              </div>
            </div>
          ) : emailSent ? (
            <div className="flex flex-col justify-center items-center">
              <div className="w-full text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-[#001F3F] mb-4">Check your email</h2>
                <p className="text-sm text-[#001F3F] mb-6">
                  We&apos;ve sent you a temporary security code. Please check your{" "}
                  <span className="font-semibold text-black break-all">{form.getValues("email")}</span> inbox.
                </p>
                <Button
                  onClick={() => router.push(`/signup/password?email=${encodeURIComponent(form.getValues("email") || submittedEmail)}`)}
                  className="w-full bg-[#001F3F] text-white h-10 hover:bg-[#001F3F]/90 rounded-md"
                >
                  Continue
                </Button>
                <Link
                  href="/login"
                  className="block mt-4 text-xs underline text-gray-500 hover:text-[#001F3F]"
                >
                  Back to Sign Up
                </Link>
              </div>
            </div>
          ) : showEmailForm ? (
            <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="w-full  px-1 py-1">
              <Label
                htmlFor="email"
                className={`font-normal text-sm mb-1 ${form.formState.errors.email ? "text-[#D04545]" : "text-[#6B7280]"
                  }`}
              >
                Work Email is required
              </Label>
              <div className="relative space-y-2 mb-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-[#8392A5]" />
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
                disabled={!form.formState.isValid || isLoading}
                className={`w-full h-10 transition-colors duration-200 rounded-md ${form.formState.isValid && !isLoading
                  ? "bg-[#001F3F] text-white hover:bg-[#001F3F]/90"
                  : "bg-[#8392A5] text-white cursor-not-allowed"
                  }`}
              >
                {isLoading ? "Logging in..." : "Next"}
              </button>
              <div className="text-center text-xs font-normal mt-4">
                <Link
                  href="/signup"
                  onClick={handleBackToSignup}
                  className="text-[#7A869A] font-medium text-xs underline hover:underline"
                >
                  Back to login options
                </Link>
              </div>

            </form>

          ) : (
            <div className="grid grid-cols-1 gap-4 mt-1">
              <div className="relative w-full h-10 group">
                {/* Invisible real Google button */}
                <div className="absolute inset-0 opacity-0 z-10 overflow-hidden">
                  <GoogleLogin
                    onSuccess={handleGoogleSignup}
                    onError={() => toast("error", { title: "Google signup failed", description: "Please try again." })}
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
                  className="w-full h-10 border-[#8E8E93] text-[#001F3F] text-sm rounded-md flex items-center justify-center gap-2 font-medium group-hover:bg-accent group-hover:text-accent-foreground dark:group-hover:bg-input/50 transition-colors"
                >
                  <span>{googleLoading ? "Signing up..." : "Sign up with Google"}</span>
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Image
                      src="/images/login/google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  )}
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleMicrosoftSignup}
                disabled={isLoading || msLoading || !isMsalReady}
                className="w-full h-10 border border-[#8E8E93] text-[#001F3F] text-sm rounded-md flex items-center justify-center gap-2 font-medium"
                variant="outline"
              >
                <span>Sign up with Microsoft</span>
                <Image src="/images/login/microsoftLogo.svg" alt="Microsoft" width={20} height={20} className="h-5 w-5" />
              </Button>


              <Button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full h-10 border-[#8E8E93] text-[#001F3F] font-medium"
                variant="outline"
              >
                Sign up with Email
              </Button>
            </div>
          )}
        </Layout>
      </GoogleOAuthProvider>
    </>
  );
}