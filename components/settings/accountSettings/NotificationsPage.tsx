
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "@/components/ui/sonner";
import { SettingsCard } from "@/components/settings/SettingsCard";
import NotificationItem from "./NotificationItem";
import NotificationGroup from "./NotificationGroup";
import { format } from "date-fns";
// Icons
import BellIcon from "@/public/images/Bell.png";
import MailBox from "@/public/images/MailBox.png";
import { EmailNotificationIcon } from "@/public/icons/emailNotification";
import { SlackIcon } from "@/public/icons/slackIcon";
import { TeamsIcon } from "@/public/icons/teamsIcon";
import { SmartNotifcationIcon } from "@/public/icons/SmartNotifcationIcon";
import { GeneralNotificationIcon } from "@/public/icons/GeneralNotificationIcon";
import { Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfileStore } from "@/stores/profile-store";
import { Calendar } from "@/components/ui/calendar";
import { useAccountStore } from "@/stores/account-store";
import { useSearchParams } from 'next/navigation';

type MailboxNotificationKey =
  | "assignments"
  | "statusChanges"
  | "commentsAndReplies"
  | "mentions"
  | "reactions"
  | "subscriptions"
  | "documentChanges"
  | "updates"
  | "remindersAndDeadlines"
  | "appsAndIntegrations";

const NOTIFICATION_ITEMS: Array<{
  key: MailboxNotificationKey;
  label: string;
  desc: string;
}> = [
  {
    key: "assignments",
    label: "Assignments",
    desc: "Assignments, unassignments, and membership changes",
  },
  {
    key: "statusChanges",
    label: "Status changes",
    desc: "Changes to the status, priority, and blocking relationships of issues",
  },
  {
    key: "commentsAndReplies",
    label: "Comments and replies",
    desc: "Comments, replies, and thread resolutions",
  },
  {
    key: "mentions",
    label: "Mentions",
    desc: "Mentions in comments or content",
  },
  {
    key: "reactions",
    label: "Reactions",
    desc: "Emoji reactions to your content",
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    desc: "Issues, projects, initiatives, teams, and views you're subscribed to",
  },
  {
    key: "documentChanges",
    label: "Document changes",
    desc: "Changes to document content, location, and subscriptions",
  },
  {
    key: "updates",
    label: "Updates",
    desc: "New project & initiative updates and reminders to post an update",
  },
  {
    key: "remindersAndDeadlines",
    label: "Reminders and deadlines",
    desc: "Reminders, due dates, and SLA updates",
  },
  {
    key: "appsAndIntegrations",
    label: "Apps and integrations",
    desc: "Requests related to OAuth apps and integrations",
  },
] as const;

const NotificationsPage = () => {
  const { user } = useProfileStore();
  const userName = user?.name || "User";
  const userEmail = user?.email || "vamshi@pengwintech.com";

  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState({ hours: 9, minutes: 0 });
  // GET NOTIFICATION SETTINGS AND ACTIONS FROM ACCOUNT STORE
  const {
    notificationSettings,
    setNotificationSettings,
    muteNotifications,
    resumeNotifications,
    storeNotification,
    clearStoredNotifications,
    muteNotificationsCall,
    unMuteNotificationsCall,
  } = useAccountStore();
  // USE STORE VALUES FOR MUTE STATE
  const isMuted = notificationSettings.isMuted;
  const muteUntil = notificationSettings.muteUntil;
  const storedNotifications = notificationSettings.storedNotifications;


  const updateGeneralSettings = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value,
      },
    }));
  };

  const updateEmailSettings = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value,
      },
    }));
  };

  const updateMailboxSettings = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      mailbox: {
        ...prev.mailbox,
        [key]: value,
      },
    }));
  };

  const updateSlackSettings = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      slack: {
        ...prev.slack,
        [key]: value,
      },
    }));
  };

  const updateTeamsSettings = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [key]: value,
      },
    }));
  };

  const updateSmartSettings = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      smart: {
        ...prev.smart,
        [key]: value,
      },
    }));
  };
  // Integration state
  const [integrations, setIntegrations] = useState({
    slack: { isConnected: false },
    teams: { isConnected: false },
  });

  // Handle mute expiration using useEffect
  useEffect(() => {
    if (isMuted && muteUntil) {
      const now = new Date();
      const end = new Date(muteUntil);

      if (now >= end) {
        handleResumeNotifications();
      } else {
        // Set timeout to auto-resume when time expires
        const timeoutDuration = end.getTime() - now.getTime();
        const timeout = setTimeout(() => {
          handleResumeNotifications();
        }, timeoutDuration);

        return () => clearTimeout(timeout);
      }
    }
  }, [isMuted, muteUntil]);

  // Auto-open Mailbox section + scroll to it
  // useEffect(() => {
  //   const shouldOpenMailbox = searchParams.get('mailbox') === 'true';
  //   if (shouldOpenMailbox) {
  //     setActiveSection('mailbox');

  //     // ✅ Scroll to Mailbox card after a brief delay (for animation)
  //     setTimeout(() => {
  //       const mailboxCards = document.querySelectorAll('[data-testid="settings-card"]');
  //       const mailboxCard = Array.from(mailboxCards).find(card =>
  //         card.textContent?.includes('Mailbox Notifications')
  //       );
  //       if (mailboxCard) {
  //         mailboxCard.scrollIntoView({
  //           behavior: 'smooth',
  //           block: 'start',
  //           inline: 'nearest'
  //         });

  //         // Optional: Add highlight effect
  //         mailboxCard.style.border = '2px solid var(--primary)';
  //         mailboxCard.style.boxShadow = '0 0 0 3px rgba(0, 31, 63, 0.1)';
  //         setTimeout(() => {
  //           mailboxCard.style.border = '';
  //           mailboxCard.style.boxShadow = '';
  //         }, 2000);
  //       }
  //     }, 300); // Small delay for activeSection animation
  //   }
  // }, [searchParams]);

  useEffect(() => {
    const shouldOpenMailbox = searchParams.get('mailbox') === 'true';
    if (shouldOpenMailbox) {
      setActiveSection('mailbox');

      setTimeout(() => {
        const mailboxCard = document.getElementById('mailbox');

        if (mailboxCard) {
          mailboxCard.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Highlight
          // mailboxCard.style.outline = '3px solid var(--primary)';
          mailboxCard.style.outlineOffset = '2px';
          setTimeout(() => {
            mailboxCard.style.outline = '';
            mailboxCard.style.outlineOffset = '';
          }, 2500);

          console.log('✅ Precise scroll to Mailbox executed');
        }
      }, 500);
    }
  }, [searchParams]);

  const handleSlackConnect = () => {
    setIntegrations((prev) => ({
      ...prev,
      slack: { ...prev.slack, isConnected: !prev.slack.isConnected },
    }));
    toast("success", { title: "Success", description: integrations.slack.isConnected ? "Slack disconnected" : "Slack connected" });
  };


  const handleTeamsConnect = () => {
    setIntegrations((prev) => ({
      ...prev,
      teams: { ...prev.teams, isConnected: !prev.teams.isConnected },
    }));
    toast("success", { title: "Success", description: integrations.teams.isConnected ? "Teams disconnected" : "Teams connected" });
  };
  const DURATION_OPTIONS = [
    { label: "30 minutes", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "4 hours", value: 240 },
    { label: "Until tomorrow", value: "tomorrow" },
    { label: "Until next week", value: "nextWeek" },
    { label: "Custom date", value: "custom" }, // For future custom date feature
  ];
  // Helper function to format mute until date
  const getMutedUntil = (value: string): string => {
    try {
      return format(new Date(value), "dd/MM/yyyy, h:mm a");
    } catch {
      return "";
    }
  };
  const handleMuteDuration = async (value: number | string) => {
    setSelected(value);

    if (value === "custom") {
      setCustomDatePickerOpen(true);
      return;
    }

    const now = new Date();
    let muteUntilDate: Date;

    if (value === "tomorrow") {
      muteUntilDate = new Date(now);
      muteUntilDate.setDate(now.getDate() + 1);
      muteUntilDate.setHours(9, 0, 0, 0);
    } else if (value === "nextWeek") {
      muteUntilDate = new Date(now);
      muteUntilDate.setDate(now.getDate() + 7);
      muteUntilDate.setHours(9, 0, 0, 0);
    } else if (typeof value === "number") {
      muteUntilDate = new Date(now.getTime() + value * 60000);
    } else {
      return;
    }

    try {
      setIsLoading(true);
      // Store the mute until date
      const muteUntilISO = muteUntilDate.toISOString();
      // Backup current settings before muting
      const settingsBackup = {
        notificationLevel: notificationSettings.notificationLevel,
        notificationTiming: notificationSettings.notificationTiming,
      };

      // USE STORE ACTION TO MUTE
      muteNotifications(muteUntilISO, settingsBackup);

      // Call API
      // await muteNotificationsCall();
      // You can add API call here
      // await muteNotificationsCall();

      toast("success", { title: "Success", description: `Notifications muted until ${getMutedUntil(muteUntilISO)}` });
    } catch (error) {
      console.error("Error muting notifications:", error);
      toast("error", { title: "Error", description: "Failed to mute notifications" });
      setSelected(null);
    } finally {
      setIsLoading(false);
    }
  };


  const handleResumeNotifications = async () => {
    try {
      setIsLoading(true);

      // USE STORE ACTION TO RESUME
      resumeNotifications();

      // Call API
      await unMuteNotificationsCall();

      setSelected(null);

      // Send stored notifications if any
      const allStoredNotifications = Object.values(storedNotifications).flat(2);
      if (allStoredNotifications.length > 0) {
        allStoredNotifications.forEach((msg: any) => {
          setTimeout(() => toast("info", { title: "Notification", description: msg }), 0);
        });
        // Clear stored notifications from store
        clearStoredNotifications();
      }

      toast("success", { title: "Success", description: "Notifications resumed" });
    } catch (error) {
      console.error("Error resuming notifications:", error);
      toast("error", { title: "Error", description: "Failed to resume notifications" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom date confirmation
  const handleCustomDateConfirm = async () => {
    if (!customDate) return;

    try {
      setIsLoading(true);

      // Combine date and time
      const finalDate = new Date(customDate);
      finalDate.setHours(customTime.hours, customTime.minutes, 0, 0);

      const muteUntilCustom = finalDate.toISOString();

      // Backup current settings before muting
      const settingsBackup = {
        notificationLevel: notificationSettings.notificationLevel,
        notificationTiming: notificationSettings.notificationTiming,
      };

      // USE STORE ACTION TO MUTE
      muteNotifications(muteUntilCustom, settingsBackup);

      setSelected("custom");
      setCustomDatePickerOpen(false);

      // Call API
      await muteNotificationsCall();

      toast("success", { title: "Success", description: `Notifications muted until ${getMutedUntil(muteUntilCustom)}` });
    } catch (error) {
      console.error("Error setting custom mute time:", error);
      toast("error", { title: "Error", description: "Failed to set custom mute time" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full space-y-4">
      {/* Mute Notifications Card */}
      <Card className="border border-border rounded-lg overflow-hidden shadow-sm border-l-[4px] border-l-primary bg-card">
        <div className="flex items-start gap-4 p-1">
          {/* Left: Icon */}
          <div className="flex-shrink-0 pt-1">
            <Image
              src={BellIcon}
              alt="Bell Icon"
              width={45}
              height={45}
              className="w-[54px] h-[54px]"
              style={{ objectFit: 'contain' }}
            />
          </div>

          {/* Right: Content */}
          <div className="flex-1 space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-foreground">
                Mute all notifications for:
              </h3>
              {isMuted && muteUntil && (
                <span className="text-[12px] font-medium text-muted-foreground">
                  Muted till {getMutedUntil(muteUntil)}
                </span>
              )}
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value.toString()}
                    disabled={isLoading || isMuted}
                    onClick={() => handleMuteDuration(opt.value)}
                    variant="outline"
                    size="sm"
                    className={`h-8 px-5 text-[12px] font-semibold transition-all rounded-lg border border-border ${selected === opt.value
                      ? "bg-primary text-primary-foreground border-b-[4px] border-b-primary shadow-sm translate-y-[1px]"
                      : "bg-background text-foreground hover:bg-muted hover:border-border"
                      }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              {/* Resume Button */}
              {isMuted && (
                <Button
                  onClick={handleResumeNotifications}
                  disabled={isLoading}
                  size="sm"
                  className="ml-auto bg-[#C00F0C] hover:bg-[#A00D0A] text-white font-bold text-[13px] px-5 h-8 rounded-lg flex items-center gap-2 shadow-sm"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Resume notifications
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Date Picker Dialog */}
      <Dialog open={customDatePickerOpen} onOpenChange={setCustomDatePickerOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary font-semibold">
              Select Date and Time
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left: Date Picker */}
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-medium mb-3 text-primary">Select Date</h4>
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={setCustomDate}
                disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border bg-card"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                }}
              />
            </div>

            {/* Right: Time Picker */}
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-medium mb-3 text-primary">Select Time</h4>

              {customDate && (
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-primary">
                      {String(customTime.hours).padStart(2, '0')}:{String(customTime.minutes).padStart(2, '0')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {customTime.hours >= 12 ? 'PM' : 'AM'}
                    </p>
                  </div>

                  {/* Hour Selector */}
                  <div className="w-full">
                    <label className="text-xs text-muted-foreground mb-1 block">Hours</label>
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={customTime.hours}
                      onChange={(e) => setCustomTime(prev => ({ ...prev, hours: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>00</span>
                      <span>12</span>
                      <span>23</span>
                    </div>
                  </div>

                  {/* Minute Selector */}
                  <div className="w-full">
                    <label className="text-xs text-muted-foreground mb-1 block">Minutes</label>
                    <input
                      type="range"
                      min="0"
                      max="59"
                      value={customTime.minutes}
                      onChange={(e) => setCustomTime(prev => ({ ...prev, minutes: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>00</span>
                      <span>30</span>
                      <span>59</span>
                    </div>
                  </div>

                  {/* Quick Time Buttons */}
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {[
                      { label: "9 AM", h: 9, m: 0 },
                      { label: "12 PM", h: 12, m: 0 },
                      { label: "3 PM", h: 15, m: 0 },
                      { label: "6 PM", h: 18, m: 0 },
                      { label: "9 PM", h: 21, m: 0 },
                      { label: "12 AM", h: 0, m: 0 },
                    ].map((time) => (
                      <Button
                        key={time.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomTime({ hours: time.h, minutes: time.m })}
                        className="text-xs"
                      >
                        {time.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!customDate && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <Clock className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setCustomDatePickerOpen(false);
                setSelected(null);
              }}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomDateConfirm}
              disabled={!customDate || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <SettingsCard
        id="general"
        title="General"
        subtitle="General notification settings"
        icon={<GeneralNotificationIcon />}
        isActive={activeSection === "general"}
        onToggle={() => setActiveSection((prev) => (prev === "general" ? null : "general"))}
      >
        <div className="space-y-5 pl-11">
          <NotificationItem
            label="Invite accepted"
            description="Email when invitees accept an invite"
            checked={notificationSettings.general?.invitedaccepted || false}
            onChange={(checked) =>
              updateGeneralSettings("invitedaccepted", checked)}

            disabled={isMuted}
          />
          <NotificationItem
            label="Privacy & Legal updates"
            description="Email when privacy policies or terms of service change"
            checked={notificationSettings.general?.privacyLegal || false}
            onChange={(checked) =>
              updateGeneralSettings("privacyLegal", checked)}

            disabled={isMuted}
          />
          <NotificationItem
            label="Data Processing updates agreements (DPA)"
            description="Email when our DPA changes"
            checked={notificationSettings.general?.dataProcessing}
            onChange={(checked) =>
              updateGeneralSettings("dataProcessing", checked)}

            disabled={isMuted}
          />
          <NotificationItem
            label="Changelog newsletters"
            description="Twice a month email highlighting new features and improvements"
            checked={notificationSettings.general?.changelog}
            onChange={(checked) =>
              updateGeneralSettings("changelog", checked)}
            disabled={isMuted}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        id="email"
        title="Email notifications"
        subtitle="Email notification settings"
        icon={<EmailNotificationIcon />}
        isActive={activeSection === "email"}
        onToggle={() => setActiveSection((prev) => (prev === "email" ? null : "email"))}
      >
        <div className="space-y-5 pl-11">
          {/* Main Toggle - Enable email notifications */}
          <NotificationItem
            label="Enable email notifications"
            description={`Email notifications to ${userEmail}`}
            checked={notificationSettings.email?.enabled || false}
            onChange={(checked) => updateEmailSettings("enabled", checked)}
            disabled={isMuted}
          />

          {/* Sub-toggles - Indented to align with label text (after switch) */}
          <div className="ml-11 space-y-5">
            <NotificationItem
              label="Delay low priority emails outside of work hours until the next work day"
              checked={notificationSettings.email?.delayLowPriority || false}
              onChange={(checked) => updateEmailSettings("delayLowPriority", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Immediately notify if an issue assigned to you is marked urgent or breaches SLA"
              checked={notificationSettings.email?.immediatelyNotifyUrgent || false}
              onChange={(checked) => updateEmailSettings("immediatelyNotifyUrgent", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Assignments"
              description="Assignments, unassignments, and membership changes"
              checked={notificationSettings.email?.assignments || false}
              onChange={(checked) => updateEmailSettings("assignments", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Status changes"
              description="Changes to the status, priority, and blocking relationships of issues"
              checked={notificationSettings.email?.statusChanges || false}
              onChange={(checked) => updateEmailSettings("statusChanges", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Comments and replies"
              description="Comments, replies, and thread resolutions"
              checked={notificationSettings.email?.commentsAndReplies || false}
              onChange={(checked) => updateEmailSettings("commentsAndReplies", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Mentions"
              description="Mentions in comments or content"
              checked={notificationSettings.email?.mentions || false}
              onChange={(checked) => updateEmailSettings("mentions", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Reactions"
              description="Emoji reactions to your content"
              checked={notificationSettings.email?.reactions || false}
              onChange={(checked) => updateEmailSettings("reactions", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Subscriptions"
              description="Issues, projects, initiatives, teams, and views you're subscribed to"
              checked={notificationSettings.email?.subscriptions || false}
              onChange={(checked) => updateEmailSettings("subscriptions", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Document changes"
              description="Changes to document content, location, and subscriptions"
              checked={notificationSettings.email?.documentChanges || false}
              onChange={(checked) => updateEmailSettings("documentChanges", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Updates"
              description="New project & initiative updates and reminders to post an update"
              checked={notificationSettings.email?.updates || false}
              onChange={(checked) => updateEmailSettings("updates", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Reminders and deadlines"
              description="Reminders, due dates, and SLA updates"
              checked={notificationSettings.email?.remindersAndDeadlines || false}
              onChange={(checked) => updateEmailSettings("remindersAndDeadlines", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />

            <NotificationItem
              label="Apps and integrations"
              description="Requests related to OAuth apps and integrations"
              checked={notificationSettings.email?.appsAndIntegrations || false}
              onChange={(checked) => updateEmailSettings("appsAndIntegrations", checked)}
              disabled={isMuted || !notificationSettings.email?.enabled}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Mailbox Notifications Card */}
      <SettingsCard
        id="mailbox"
        data-testid={`settings-card-mailbox`}
        title="Mailbox Notifications"
        subtitle="Mailbox notification settings"
        icon={<Image src={MailBox} alt="Mail Box" width={40} height={40} className="w-10 h-10" />}
        isActive={activeSection === "mailbox"}
        onToggle={() => setActiveSection((prev) => (prev === "mailbox" ? null : "mailbox"))}
      >
        <div className="space-y-5 pl-11">
          {/* Main Toggle - Mailbox notifications */}
          <NotificationItem
            label="Mailbox notifications"
            description={`Mailbox notifications to ${userEmail}`}
            checked={notificationSettings.mailbox?.enabled || false}
            onChange={(checked) => updateMailboxSettings("enabled", checked)}
            disabled={isMuted}
          />

          {/* Sub-toggles - Indented to align with label text */}
          <div className="ml-11 space-y-5">
            {NOTIFICATION_ITEMS.map((item) => (
              <NotificationItem
                key={item.key}
                label={item.label}
                description={item.desc}
                checked={notificationSettings.mailbox?.[item.key] || false}
                onChange={(checked) => updateMailboxSettings(item.key, checked)}
                disabled={isMuted || !notificationSettings.mailbox?.enabled}
              />
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* Slack Notifications */}
      <SettingsCard
        id="slack"
        title="Slack notifications"
        subtitle="Slack notification setting"
        icon={<SlackIcon />}
        isActive={activeSection === "slack"}
        onToggle={() => setActiveSection((prev) => (prev === "slack" ? null : "slack"))}
        actionButton={
          <Button
            onClick={handleSlackConnect}
            variant="default"
            disabled={isLoading}
            className={
              integrations.slack.isConnected
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              integrations.slack.isConnected ? "Connected" : "Connect"
            )}
          </Button>
        }
      >
        <div className="space-y-5 pl-11">
          {/* Main Toggle - Slack notifications */}
          <NotificationItem
            label="Slack notifications"
            description={`Slack notifications to ${userEmail}`}
            checked={notificationSettings.slack?.enabled || false}
            onChange={(checked) => updateSlackSettings("enabled", checked)}
            disabled={isMuted}
          />

          {/* Sub-toggles - Indented to align with label text */}
          <div className="ml-11 space-y-5">
            {NOTIFICATION_ITEMS.map((item) => {
              const slackKey = item.key as keyof typeof notificationSettings.slack;
              return (
                <NotificationItem
                  key={item.key}
                  label={item.label}
                  description={item.desc}
                  checked={
                    (notificationSettings.slack?.[slackKey] as boolean | undefined) || false
                  }
                  onChange={(checked) => updateSlackSettings(item.key, checked)}
                  disabled={isMuted || !notificationSettings.slack?.enabled}
                />
              );
            })}
          </div>
        </div>
      </SettingsCard>


      {/* Microsoft Teams Notifications */}
      <SettingsCard
        id="teams"
        title="Microsoft Teams notifications"
        subtitle="Microsoft Teams notification settings"
        icon={<TeamsIcon />}
        isActive={activeSection === "teams"}
        onToggle={() => setActiveSection((prev) => (prev === "teams" ? null : "teams"))}
        actionButton={
          <Button
            onClick={handleTeamsConnect}
            variant="default"
            disabled={isLoading}
            className={
              integrations.teams.isConnected
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              integrations.teams.isConnected ? "Connected" : "Connect"
            )}
          </Button>
        }
      >
        <div className="space-y-5 pl-11">
          {/* Main Toggle - Microsoft Teams notifications */}
          <NotificationItem
            label="Microsoft Teams notifications"
            description={`Microsoft Teams notifications to ${userEmail}`}
            checked={notificationSettings.teams?.enabled || false}
            onChange={(checked) => updateTeamsSettings("enabled", checked)}
            disabled={isMuted}
          />

          {/* Sub-toggles - Indented to align with label text */}
          <div className="ml-11 space-y-5">
            {NOTIFICATION_ITEMS.map((item) => {
              const teamsKey = item.key as keyof typeof notificationSettings.teams;
              return (
                <NotificationItem
                  key={item.key}
                  label={item.label}
                  description={item.desc}
                  checked={
                    (notificationSettings.teams?.[teamsKey] as boolean | undefined) || false
                  }
                  onChange={(checked) => updateTeamsSettings(item.key, checked)}
                  disabled={isMuted || !notificationSettings.teams?.enabled}
                />
              );
            })}
          </div>
        </div>
      </SettingsCard>


      {/* Smart Notifications */}
      <SettingsCard
        id="smart"
        title="Smart notifications"
        subtitle="Smart notification settings"
        icon={<SmartNotifcationIcon />}
        isActive={activeSection === "smart"}
        onToggle={() => setActiveSection((prev) => (prev === "smart" ? null : "smart"))}
      >
        <div className="space-y-5 pl-11">
          <NotificationItem
            label="Summarize daily all notification"
            checked={notificationSettings.smart?.summarizeDaily || false}
            onChange={(checked) => updateSmartSettings("summarizeDaily", checked)}
            disabled={isMuted}
          />

          <NotificationItem
            label="Summarize only where I'm mentioned"
            checked={notificationSettings.smart?.summarizeMentionsOnly || false}
            onChange={(checked) => updateSmartSettings("summarizeMentionsOnly", checked)}
            disabled={isMuted}
          />

          <NotificationItem
            label="3"
            checked={notificationSettings.smart?.option3 || false}
            onChange={(checked) => updateSmartSettings("option3", checked)}
            disabled={isMuted}
          />

          <NotificationItem
            label="4"
            checked={notificationSettings.smart?.option4 || false}
            onChange={(checked) => updateSmartSettings("option4", checked)}
            disabled={isMuted}
          />
        </div>
      </SettingsCard>


    </div>
  );
};

export default NotificationsPage;






