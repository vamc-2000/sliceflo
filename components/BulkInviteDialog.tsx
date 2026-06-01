"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, X, CheckCircle2, AlertCircle } from "lucide-react";
import { usePapaParse } from "react-papaparse";
import toast from "react-hot-toast";

interface BulkInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onBulkInvite: (users: BulkInviteUser[]) => Promise<void>;
}

interface BulkInviteUser {
  email: string;
  name?: string;
  role: string;
}

interface ParsedRow {
  email?: string;
  name?: string;
  role?: string;
}

export default function BulkInviteDialog({ open, onClose, onBulkInvite }: BulkInviteDialogProps) {
  const { readString } = usePapaParse();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BulkInviteUser[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = `email,name,role
[email protected],John Doe,MANAGER
[email protected],Jane Smith,ADMIN
[email protected],Bob Johnson,MANAGER`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_invite_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };

    reader.readAsText(uploadedFile);
  };

  // Parse CSV
  const parseCSV = (csvText: string) => {
    readString(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validUsers: BulkInviteUser[] = [];
        const parseErrors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          const email = row.email?.trim();
          const name = row.name?.trim();
          const role = row.role?.trim().toUpperCase() || 'MANAGER';

          // Validate email
          if (!email) {
            parseErrors.push(`Row ${index + 2}: Email is required`);
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            parseErrors.push(`Row ${index + 2}: Invalid email format - ${email}`);
            return;
          }

          // Validate role
          if (!['ADMIN', 'MANAGER'].includes(role)) {
            parseErrors.push(`Row ${index + 2}: Role must be ADMIN or MANAGER`);
            return;
          }

          validUsers.push({ email, name, role });
        });

        setParsedData(validUsers);
        setErrors(parseErrors);

        if (validUsers.length === 0 && parseErrors.length === 0) {
          toast.error('No valid data found in CSV');
        } else if (validUsers.length > 0) {
          toast.success(`${validUsers.length} user(s) ready to invite`);
        }
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
  };

  // Handle bulk invite
  const handleBulkInvite = async () => {
    if (parsedData.length === 0) {
      toast.error('No valid users to invite');
      return;
    }

    setLoading(true);
    try {
      await onBulkInvite(parsedData);
      toast.success(`Successfully invited ${parsedData.length} user(s)`);
      handleClose();
    } catch (error) {
      toast.error('Failed to send bulk invites');
    } finally {
      setLoading(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Bulk Invite Users</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a CSV file to invite multiple users at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Sample */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Need a template?</p>
              <p className="text-xs text-muted-foreground">Download our sample CSV file</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample
            </Button>
          </div>

          {/* CSV Format Info */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-xs font-semibold text-foreground mb-2">Required CSV Format:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>email</strong> (required) - User email address</p>
              <p>• <strong>name</strong> (optional) - User full name</p>
              <p>• <strong>role</strong> (required) - ADMIN or MANAGER</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-upload" className="text-sm font-medium text-foreground">
              Upload CSV File
            </Label>
            <input
              ref={fileInputRef}
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setParsedData([]);
                      setErrors([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files only</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Preview ({parsedData.length} users)
              </Label>
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedData.map((user, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-3 py-2 text-foreground">{user.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">{user.name || '-'}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Errors ({errors.length})
              </Label>
              <div className="max-h-32 overflow-y-auto border border-red-200 rounded-lg bg-red-50 p-3">
                <ul className="text-xs text-red-800 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkInvite}
            disabled={parsedData.length === 0 || loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? 'Sending Invites...' : `Invite ${parsedData.length} User(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
