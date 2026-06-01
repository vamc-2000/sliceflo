



"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Pencil, RotateCw, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { SettingsCard } from "@/components/settings/SettingsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SecurityPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [invitationLinkEnabled, setInvitationLinkEnabled] = useState(false);
  const [remoteSupportEnabled, setRemoteSupportEnabled] = useState(false);
  const [invitationLink] = useState(
    "https://sliceflo.app/workspace-october/join/254fd3c58dc7f83d0c99ac6ac3fcbb2e?s=5"
  );
  const [domains, setDomains] = useState([
    { id: 1, name: "amelitas.com", addedOn: "November 1, 2025" },
  ]);
  const [selectedDuration, setSelectedDuration] = useState("1 month");
  const [supportValidUntil, setSupportValidUntil] = useState("");

  // Add Domain Inline States
  const [showAddDomainForm, setShowAddDomainForm] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [editingDomainId, setEditingDomainId] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Calculate expiry date based on duration
  const calculateExpiryDate = (duration: string) => {
    const now = new Date();

    switch (duration) {
      case "1 day":
        now.setDate(now.getDate() + 1);
        break;
      case "1 week":
        now.setDate(now.getDate() + 7);
        break;
      case "1 month":
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        break;
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return now.toLocaleString("en-US", options);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast("success", { title: "Success", description: "Link copied to clipboard!" });
  };

  const handleRegenerateLink = () => {
    toast("success", { title: "Success", description: "Invitation link regenerated!" });
  };
  const handleEditDomain = (domain: any) => {
    setShowAddDomainForm(true); // Open the form
    setEditingDomainId(domain.id);
    setNewDomainName(domain.name);
    // Optional: If you have the email stored, set it here too
    setVerificationEmail(domain.verificationEmail || "");
  };

  const handleAddDomain = () => {
    if (!newDomainName.trim()) {
      toast("error", { title: "Error", description: "Please enter a domain name" });
      return;
    }

    if (!verificationEmail.trim()) {
      toast("error", { title: "Error", description: "Please enter a verification email" });
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomainName)) {
      toast("error", { title: "Error", description: "Please enter a valid domain name (e.g., example.com)" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(verificationEmail)) {
      toast("error", { title: "Error", description: "Please enter a valid email address" });
      return;
    }

    // Check if domain already exists
    if (domains.some((d) => d.name.toLowerCase() === newDomainName.toLowerCase())) {
      toast("error", { title: "Error", description: "This domain is already added" });
      return;
    }

    const newDomain = {
      id: Date.now(),
      name: newDomainName.toLowerCase(),
      addedOn: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    setDomains([...domains, newDomain]);
    setNewDomainName("");
    setVerificationEmail("");
    setShowAddDomainForm(false);
    toast("success", { title: "Success", description: `Domain "${newDomainName}" added successfully!` });
  };
  const handleSaveDomain = () => {
    // Validation
    if (!newDomainName.trim() || !verificationEmail.trim()) {
      toast("error", { title: "Error", description: "Please fill in both fields" });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(verificationEmail)) {
      toast("error", { title: "Error", description: "Please enter a valid email address" });
      return;
    }

    if (editingDomainId) {
      // MODE: UPDATE EXISTING
      setDomains(domains.map(d =>
        d.id === editingDomainId ? { ...d, name: newDomainName.toLowerCase() } : d
      ));
      toast("success", { title: "Success", description: "Domain updated successfully" });
    } else {
      // MODE: ADD NEW
      // Check for duplicates only when adding new
      if (domains.some((d) => d.name.toLowerCase() === newDomainName.toLowerCase())) {
        toast("error", { title: "Error", description: "This domain is already added" });
        return;
      }

      const newEntry = {
        id: Date.now(),
        name: newDomainName.toLowerCase(),
        addedOn: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      };
      setDomains([...domains, newEntry]);
      toast("success", { title: "Success", description: "Domain added successfully" });
    }

    // Reset form and close
    setShowAddDomainForm(false);
    setEditingDomainId(null);
    setNewDomainName("");
    setVerificationEmail("");
  };


  const handleCancelAddDomain = () => {
    setNewDomainName("");
    setVerificationEmail("");
    setShowAddDomainForm(false);
  };

  const handleDeleteDomain = (id: number) => {
    setDomains(domains.filter((d) => d.id !== id));
    toast("success", { title: "Success", description: "Domain removed!" });
  };

  // Phase 1: Click "Add Domain" -> Show Verification UI
  const handleInitiateVerification = () => {
    if (!newDomainName.trim() || !verificationEmail.trim()) {
      toast("error", { title: "Error", description: "Please fill in both fields" });
      return;
    }
    // Logic to trigger backend email would go here
    setIsVerifying(true);
    toast("success", { title: "Success", description: `Verification code sent to ${verificationEmail}` });
  };

  // Phase 2: Click "Verify" -> Actually save the domain
  const handleVerifyAndSave = () => {
    if (verificationCode.length !== 6) {
      toast("error", { title: "Error", description: "Please enter a valid 6-digit code" });
      return;
    }

    // Reuse your save logic
    const newEntry = {
      id: Date.now(),
      name: newDomainName.toLowerCase(),
      addedOn: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    setDomains([...domains, newEntry]);
    resetForm();
    toast("success", { title: "Success", description: "Domain verified and added!" });
  };

  const resetForm = () => {
    setShowAddDomainForm(false);
    setIsVerifying(false);
    setEditingDomainId(null);
    setNewDomainName("");
    setVerificationEmail("");
    setVerificationCode("");
  };



  return (
    <div className="w-full space-y-3">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-[var(--primary)] tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace security settings</p>
      </div>

      <div className="space-y-2">
        {/* Invitation Link */}
        <SettingsCard
          id="invitation"
          title="Invitation Link"
          subtitle={invitationLinkEnabled ? "Link is active" : "Link is disabled"}
          isActive={activeSection === "invitation"}
          onToggle={() => setActiveSection((prev) => (prev === "invitation" ? null : "invitation"))}
          showChevron={false}
          actionButton={
            <Switch
              checked={invitationLinkEnabled}
              onCheckedChange={setInvitationLinkEnabled}
            />
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Generate a unique link to let anyone with access join your workspace easily
            </p>
            {invitationLinkEnabled && (
              <div className="flex gap-2">
                <Input value={invitationLink} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleRegenerateLink}>
                  <RotateCw size={16} />
                </Button>
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Allowed Email Domains */}
        <SettingsCard
          id="domains"
          title="Allowed Email Domains"
          subtitle={`${domains.length} domain${domains.length !== 1 ? 's' : ''} configured`}
          isActive={activeSection === "domains"}
          onToggle={() => setActiveSection((prev) => (prev === "domains" ? null : "domains"))}
          showChevron={true}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Users with emails from the listed domains can automatically join this workspace.
            </p>
            {!showAddDomainForm && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddDomainForm(true);
                    setIsVerifying(false); // Reset verification state when opening
                  }}
                >
                  + Add Domain
                </Button>
              </div>
            )}

            {showAddDomainForm && (
              <div className="bg-muted/30 border rounded-lg p-4 space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase opacity-60">Domain</Label>
                    <Input value={newDomainName} readOnly className="bg-muted/50 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase opacity-60">Verification Email</Label>
                    <Input
                      placeholder="email@company.com"
                      value={verificationEmail}
                      className="h-9"
                      onChange={(e) => {
                        const email = e.target.value;
                        setVerificationEmail(email);
                        if (email.includes('@')) setNewDomainName(email.split('@')[1].toLowerCase());
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                  <Button
                    size="sm"
                    onClick={handleInitiateVerification}
                    className="bg-primary text-white"
                  >
                    Add Domain
                  </Button>
                </div>
              </div>
            )}
            {/* Domain List */}
            <div className="space-y-2 mt-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border">
                      <span className="text-lg font-semibold text-gray-600">
                        {domain.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">{domain.name}</p>
                      <p className="text-xs text-muted-foreground">Added on: {domain.addedOn}</p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS GROUP */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditDomain(domain)}
                      className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-gray-100"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SettingsCard>
        <Dialog open={isVerifying} onOpenChange={setIsVerifying}>
          <DialogContent className="sm:max-w-[550px] p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Verification Code</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                A 6-digit code has been sent to <span className="font-semibold text-foreground">{verificationEmail}</span>.
                It will expire in 5 minutes.
              </p>
            </DialogHeader>

            <div className="py-6">
              <Input
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="tracking-[1em] text-center font-mono text-2xl h-14 border-2 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsVerifying(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndSave}
                className="bg-primary text-white px-8 h-10"
              >
                Verify
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
