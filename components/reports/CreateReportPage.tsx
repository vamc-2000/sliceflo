// components/reports/CreateReportPage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReportStore } from "@/stores/reports-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import LabelManager, { Label } from "../teams/LabelManager";
import { ChevronDown, Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { useProjectsStore } from "@/stores/projects-store";
import { RichTextEditor } from "../rich-text-editor";

export default function CreateReportPage({
  onCancel,
  // onSuccess 
}: {
  onCancel?: () => void;
  // onSuccess?: () => void; 
}) {
  const handleCancel = () => {
    onCancel?.();
  };
  // In handleCreate, after successful router.push or just after createReport:
  // onSuccess?.();
  const router = useRouter();
  const { createReport } = useReportStore();
  const projects = useProjectsStore((state) => state.projects);


  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>();
  const [label, setLabel] = useState<string | undefined>();
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [membershipDropdownOpen, setMembershipDropdownOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approveRequests, setApproveRequests] = useState(
    "Me" as "Me" | "All team members"
  );
  const [editTeamPage, setEditTeamPage] = useState("Me" as "Me" | "All team members");
  const [editPrivacy, setEditPrivacy] = useState("Me" as "Me" | "All team members");
  const [labels, setLabels] = useState<Label[]>([]);
  const [inviteMembersApproval, setInviteMembersApproval] = useState(false);
  const [inviteGuestsApproval, setInviteGuestsApproval] = useState(false);
  const [adminsOnlyRemoval, setAdminsOnlyRemoval] = useState(false);
  const [isDeleteActive, setIsDeleteActive] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        identifier: identifier.trim() || undefined,
        projectId,
        label,
        privacy,
      };

      const report = await createReport(payload);

      if (report?.id) {
        router.push(`/reports/${report.id}`);
      }
    } catch (e) {
      console.error("Failed to create report", e);
      setIsSubmitting(false);
    }
  };

  // const handleCancel = () => {
  //   router.back();
  // };

  const handleDeleteReport = () => {

  }

  return (
    <div className="bg-white flex flex-col w-full min-h-full">
      <div className="flex-1 flex flex-col ">
        <div className="w-full px-0 py-3 bg-white">
          <div className=" space-y-2">

            {/* Team Info Section */}
            <div style={{ backgroundColor: '#F2F2F7' }} className="rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-80">
                  <label className="text-sm font-medium text-[#8E8E93] mb-4 h-4">Report name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setName(value);

                      // Auto-generate identifier from first 3 letters
                      const autoIdentifier = value
                        .replace(/\s+/g, "")       // remove spaces
                        .substring(0, 3)           // take first 3 characters
                        .toUpperCase();            // convert to uppercase

                      setIdentifier(autoIdentifier);
                    }}
                    placeholder="e.g. Marketing"
                    className="h-10 bg-white"
                  />
                </div>

                <div className="w-80">
                  <label className="text-sm font-medium text-[#8E8E93] mb-4 h-4">Report identifier</label>
                  <Input
                    type="text"
                    value={identifier}
                    readOnly
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. MAR"
                    className="h-10 bg-[#F2F2F7] cursor-not-allowed text-[#8E8E93] select-none placeholder:text-[#C7C7CC]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-8E8E93 mb-2 block text-[#001F3F]">Report description</label>
              <div className="w-full">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the purpose of this report"
                  className="min-h-25!"
                />
              </div>
            </div>

            {/* Location of Data source */}
            <div className="border border-gray-200 border-l-4 border-l-[#001F3F] rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-[#001F3F] mb-0">Location of Data source</h3>
                  <p className="text-xs text-[#8E8E93] leading-snug w-xl">
                    SliceFlo Dashboards help you visualize data from your tasks.
                    Select locations to source your data from.
                  </p>
                </div>
                <div className="w-87.5">
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-full border-[#8E8E93] rounded">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="max-h-60 overflow-auto px-2 py-0 space-y-1">
                        {projects
                          .filter((project): project is typeof project & { id: string } => Boolean(project.id))
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Label Manager */}
            <LabelManager
              labels={labels}
              onLabelsChange={setLabels}
              title="Labels"
              description="Create and manage labels to categorize and organize tasks, making it easier for your team to filter and track work."
              borderColor="#001F3F"
              dropdownWidth="w-[350px]"
            />

            {/* Select privacy */}
            <div className="border border-gray-200 border-l-4 border-l-[#001F3F] rounded-lg p-4 bg-white">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-[#001F3F] mb-1">Select report&apos;s privacy</h3>
                  <p className="text-xs text-[#8E8E93] leading-snug w-xl">
                    Private reports and their issues are visible only to members and admins. Only admins and
                    owners can invite new users to a private team.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-87.5">
                  <Button
                    data-testid="report-privacy-btn"
                    variant="ghost"
                    onClick={() => setPrivacy('private')}
                    className={`flex-1 rounded border border-[#C7C7CC] transition-all duration-200 ${privacy === 'private'
                      ? 'border-b-2 border-b-[#001F3F] text-[#8E8E93]'
                      : 'text-[#8E8E93]'
                      }`}
                  >
                    Private
                  </Button>
                  <Button
                    data-testid="report-public-btn"
                    variant="ghost"
                    onClick={() => setPrivacy('public')}
                    className={`flex-1 rounded border border-[#C7C7CC] transition-all duration-200 ${privacy === 'public'
                      ? 'border-b-2 border-b-[#001F3F] text-[#8E8E93]'
                      : 'text-[#8E8E93]'
                      }`}
                  >
                    Public
                  </Button>
                </div>
              </div>
            </div>

            {/* Team accessibility & permissions */}
            <div className="border border-gray-200 border-l-4 border-l-[#001F3F] rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setMembershipDropdownOpen(!membershipDropdownOpen)}>
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-[#001F3F] mb-1">Report accessibility & permission settings</h3>
                  <p className="text-xs font-medium text-[#8E8E93] leading-relaxed">
                    Manage your report&apos;s accessibility and membership controls. This includes whoc can edit report details, manage privacy, and approve or restrict member requests.
                  </p>
                </div>
                <Button
                  data-testid="membership-dropdown-btn"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMembershipDropdownOpen(!membershipDropdownOpen)}
                >
                  <ChevronDown
                    size={20}
                    className={`text-[#8E8E93] transition-transform duration-200 ${membershipDropdownOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </Button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${membershipDropdownOpen ? "max-h-250 opacity-100 mt-2 pt-2" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="pt-3 border-t border-[#C7C7CC] space-y-4">
                  {/* Who can approve requests */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8E8E93]">Who can approve requests to join this team?</span>
                    <div className="flex gap-4 w-87.5">
                      <Button
                        data-testid="approve-requests-me-btn"
                        variant="ghost"
                        onClick={() => setApproveRequests('Me')}
                        className={`flex-1 rounded border border-[#C7C7CC] transition-all duration-200 ${approveRequests === 'Me'
                          ? 'border-b-2 border-b-[#001F3F] text-[#8E8E93]'
                          : 'text-[#8E8E93]'
                          }`}
                      >
                        Me
                      </Button>
                      <Button
                        data-testid="approve-requests-all-btn"
                        variant="ghost"
                        onClick={() => setApproveRequests('All team members')}
                        className={`flex-1 rounded border border-[#C7C7CC] transition-all duration-200 ${approveRequests === 'All team members'
                          ? 'border-b-2 border-b-[#001F3F] text-[#8E8E93]'
                          : 'text-[#8E8E93]'
                          }`}
                      >
                        All team members
                      </Button>
                    </div>
                  </div>

                  {/* Who can edit team page */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8E8E93]">Who can edit the team page?</span>
                    <div className="flex gap-4 w-87.5">
                      <Button
                        data-testid="edit-team-page-me-btn"
                        variant="ghost"
                        onClick={() => setEditTeamPage('Me')}
                        className={`flex-1 rounded border border-[#8E8E93] transition-all duration-200 ${editTeamPage === 'Me'
                          ? 'border-b-2 border-b-[#001F3F] text-[#001F3F]'
                          : 'text-[#8E8E93]'
                          }`}
                      >
                        Me
                      </Button>
                      <Button
                        data-testid="edit-team-page-all-btn"
                        variant="ghost"
                        onClick={() => setEditTeamPage('All team members')}
                        className={`flex-1 rounded border border-[#8E8E93] transition-all duration-200 ${editTeamPage === 'All team members'
                          ? 'border-b-2 border-b-[#001F3F] text-[#001F3F]'
                          : 'text-[#8E8E93]'
                          }`}
                      >
                        All team members
                      </Button>
                    </div>
                  </div>

                  {/* Who can edit privacy level */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8E8E93]">Who can edit the team privacy level and delete the team?</span>
                    <div className="flex gap-4 w-[350px]">
                      <Button
                        data-testid="edit-privacy-me-btn"
                        variant="ghost"
                        onClick={() => setEditPrivacy('Me')}
                        className={`flex-1 rounded border border-[#8E8E93] transition-all duration-200 ${editPrivacy === 'Me'
                          ? 'border-b-2 border-b-[#001F3F] text-[#001F3F]'
                          : 'text-[#8E8E93]'
                          }`}
                      >
                        Me
                      </Button>
                      <Button
                        data-testid="edit-privacy-all-btn"
                        variant="ghost"
                        onClick={() => setEditPrivacy('All team members')}
                        className={`flex-1 rounded-sm border border-[#8E8E93] transition-all duration-200 ${editPrivacy === 'All team members'
                          ? 'border-b-2 border-b-[#001F3F] text-[#001F3F]'
                          : 'text-[#8E8E93]'
                          }`}
                      >
                        All team members
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-[#C7C7CC]"></div>

                  {/* Invitations section */}
                  <div className="space-y-0">
                    <h4 className="font-medium text-sm text-[#8E8E93] pb-0">Invitations</h4>
                    <div className="flex justify-between items-center space-y-1">
                      <span className="text-xs text-[#8E8E93]">New members invited to this team must be approved by a team admin</span>
                      <Switch
                        checked={inviteMembersApproval}
                        onCheckedChange={setInviteMembersApproval}
                        className="w-8 h-4"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#8E8E93]">New guests invited to this team must be approved by a team admin</span>
                      <Switch
                        checked={inviteGuestsApproval}
                        onCheckedChange={setInviteGuestsApproval}
                        className="w-8 h-4"
                      />
                    </div>
                  </div>

                  {/* Removals section */}
                  <div className="space-y-0">
                    <h4 className="font-medium text-sm text-[#8E8E93] pb-0">Removals</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#8E8E93]">Only team admins can remove members or guests from this team</span>
                      <Switch
                        checked={adminsOnlyRemoval}
                        onCheckedChange={setAdminsOnlyRemoval}
                        className="w-8 h-4"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Delete Team Section */}
            <div
              className={`border border-gray-200 border-l-4 rounded-lg p-4 transition-all duration-200 ${isDeleteActive
                ? 'border-l-red-500'
                : 'border-l-gray-400 bg-[#F2F2F7]'
                }`}
              style={isDeleteActive ? { backgroundColor: '#FF383C1A' } : {}}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`font-semibold text-sm mb-0 transition-colors duration-200 ${isDeleteActive ? 'text-red-600' : 'text-[#AEAEB2]'
                    }`}>
                    Delete Report
                  </h3>
                  <p className={`text-xs transition-colors duration-200 ${isDeleteActive ? 'text-red-500' : 'text-[#AEAEB2]'
                    }`}>
                    Delete this report
                  </p>
                </div>
                <Button
                  data-testid="delete-team-btn"
                  onClick={handleDeleteReport}
                  disabled={!isDeleteActive}
                  variant={isDeleteActive ? 'destructive' : 'ghost'}
                  className={!isDeleteActive ? 'cursor-not-allowed' : 'text-[#AEAEB2]'}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-x-4 items-center pt-2 pb-0">
              <Button
                data-testid="cancel-team-btn"
                variant="outline"
                // onClick={onBack}
                className='w-32 border-[#8E8E93] text-[#8E8E93]'
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !name.trim() || !projectId}
                className={`w-32 text-white ${isSubmitting || !name.trim() || !projectId
                  ? "bg-[#F2F2F7] text-[#8E8E93]"
                  : "bg-[#001F3F] hover:bg-[#001530]"
                  }`}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

