"use client";

import React, { useState } from "react";
import { FaLink } from "react-icons/fa6";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const InviteMembersModal: React.FC<Props> = ({ open, onClose }) => {
  const [input, setInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const validateEmails = (value: string) => {
    const emails = value.split(/[, ]+/).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every((email) => emailRegex.test(email));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Don't show error on typing
  };

  const handleSubmit = () => {
    const isValid = validateEmails(input);
    setHasSubmitted(true);
    setError(!isValid);
    if (isValid) {
      // ✅ Proceed with send
      console.log("Sending invite to:", input);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center w-full">
      <div className="bg-card text-foreground rounded-xl shadow-lg w-full max-w-xl p-6 relative border-b-4 border-brand">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-brand"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-semibold text-brand mb-4">
          Invite Team Members
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invite with email</label>
            <input
              type="text"
              value={input}
              onChange={handleChange}
              placeholder="Enter one or more email addresses"
              className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none ${
                error
                  ? "border-red-500 focus:border-red-500"
                  : "border-border focus:border-brand"
              } bg-card text-foreground`}
            />
            {error && hasSubmitted && (
              <p className="text-red-500 text-xs mt-1">
                Please enter valid email addresses.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Add to team</label>
              <input
                type="text"
                placeholder="Start typing to add Team"
                className="w-full px-4 py-2 border rounded-md border-border bg-card text-sm focus:outline-none focus:border-brand text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Add to projects</label>
              <input
                type="text"
                placeholder="Start typing to add Project"
                className="w-full px-4 py-2 border rounded-md border-border bg-card text-sm focus:outline-none focus:border-brand text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm cursor-pointer text-brand">
              <FaLink className="w-4 h-4" />
              <span>Copy Shareable link</span>
            </div>

            <button
              onClick={handleSubmit}
              className="bg-brand hover:bg-brand/90 text-brand-foreground py-2 px-6 rounded-md text-sm transition"
            >
              Send Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;
