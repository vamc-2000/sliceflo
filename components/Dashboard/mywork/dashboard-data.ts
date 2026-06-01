
  import { cn } from "@/lib/utils";

  export const WORKLOAD_STATUSES = [
    { label: "Backlog", count: 0, bg: "bg-orange-400" },
    { label: "Not started", count: 0, bg: "bg-gray-300" },
    { label: "Working on", count: 0, bg: "bg-blue-500" },
    { label: "Completed", count: 0, bg: "bg-green-500" },
    { label: "Canceled", count: 0, bg: "bg-red-500" },
    { label: 'On Hold', count: 0, bg: 'bg-yellow-400' },
    { label: 'In Review', count: 0, bg: 'bg-purple-500' },
    { label: 'Blocked', count: 0, bg: 'bg-pink-500' },
  ];

  export const WORKLOAD_STATUSESs = [
    { label: 'Backlog', count: 0, bg: 'bg-orange-400' },
    { label: 'Not started', count: 0, bg: 'bg-gray-300' },
    { label: 'Working on', count: 0, bg: 'bg-blue-500' },
    { label: 'Completed', count: 0, bg: 'bg-green-500' },
    { label: 'Canceled', count: 0, bg: 'bg-red-500' },
    { label: 'On Hold', count: 0, bg: 'bg-yellow-400' },
    { label: 'In Review', count: 0, bg: 'bg-purple-500' },
    { label: 'Blocked', count: 0, bg: 'bg-pink-500' },
  ];
//project overview
  export const CHART_DATA = [
    { date: "Dec 2", current: 45, previous: 60 },
    { date: "Dec 9", current: 30, previous: 75 },
    { date: "Dec 17", current: 55, previous: 50 },
    { date: "Dec 25", current: 25, previous: 80 },
    { date: "Jan 2", current: 60, previous: 40 },
    { date: "Jan 9", current: 35, previous: 70 },
    { date: "Jan 17", current: 70, previous: 55 },
    { date: "Jan 25", current: 40, previous: 65 },
    { date: "Feb 1", current: 50, previous: 45 },
    { date: "Feb 8", current: 80, previous: 35 },
    { date: "Feb 16", current: 45, previous: 60 },
    { date: "Feb 25", current: 30, previous: 90 },
  ];
  //professional list
  export const PROFESSIONALS = [
    { name: "Kevin H.", initials: "KH", color: "bg-blue-400" },
    { name: "Sarah J.", initials: "SJ", color: "bg-purple-400" },
    { name: "Emily R.", initials: "ER", color: "bg-pink-400" },
    { name: "Michael C.", initials: "MC", color: "bg-orange-400" },
    { name: "David W.", initials: "DW", color: "bg-blue-600" },
    { name: "Jessica L.", initials: "JL", color: "bg-slate-400" },
  ];
//project effeciey client
  export const HIGHLIGHTS = [
    { label: "Avg. Client Rating", value: "7.8 / 10", trend: "up" },
    { label: "Avg. Quotes", value: "730", trend: "down" },
    { label: "Avg. Agent Earnings", value: "$2,309", trend: "up" },
  ];
//project effeciey client
  export const EFFICIENCY_MONTHS = ["January", "February", "March", "April", "May", "June"];

  export const EFFICIENCY_DONUT: Record<string, { segments: { color: string; value: number }[]; total: number }> = {
    January: { total: 186, segments: [{ color: "#1f2937", value: 40 }, { color: "#6b7280", value: 25 }, { color: "#d1d5db", value: 20 }, { color: "#111827", value: 15 }] },
    February: { total: 210, segments: [{ color: "#1f2937", value: 35 }, { color: "#6b7280", value: 30 }, { color: "#d1d5db", value: 22 }, { color: "#111827", value: 13 }] },
    March: { total: 195, segments: [{ color: "#1f2937", value: 45 }, { color: "#6b7280", value: 20 }, { color: "#d1d5db", value: 25 }, { color: "#111827", value: 10 }] },
    April: { total: 230, segments: [{ color: "#1f2937", value: 38 }, { color: "#6b7280", value: 28 }, { color: "#d1d5db", value: 18 }, { color: "#111827", value: 16 }] },
    May: { total: 175, segments: [{ color: "#1f2937", value: 42 }, { color: "#6b7280", value: 22 }, { color: "#d1d5db", value: 24 }, { color: "#111827", value: 12 }] },
    June: { total: 220, segments: [{ color: "#1f2937", value: 36 }, { color: "#6b7280", value: 32 }, { color: "#d1d5db", value: 19 }, { color: "#111827", value: 13 }] },
  };

  export const REMINDERS = [
    { priority: "low", time: "Today, 12:30", title: "Create a design training for beginners.", tag: "Design Education" },
    { priority: "medium", time: "Today, 10:00", title: "Have a meeting with the new design team.", tag: "Meeting" },
    { priority: "high", time: "Tomorrow, 16:30", title: "Respond to customer support emails.", tag: "Customer Support" },
  ];
//achivement data
  export const BAR_DATA = [
    { year: "2022", projects: 35 },
    { year: "2023", projects: 29 },
    { year: "2024", projects: 57 },
  ];
//project effecicny 30 days 
  export const EFFICIENCY_DATA = [
    { month: "Jan", value: 65 },
    { month: "Feb", value: 78 },
    { month: "Mar", value: 55 },
    { month: "Apr", value: 90 },
    { month: "May", value: 72 },
    { month: "Jun", value: 85 },
  ];

  export const STANDUPS = [
    { id: 1, title: "Standup 1" },
    { id: 2, title: "Standup 2" },
    { id: 3, title: "Standup 3" },
    { id: 4, title: "Standup 4" },
    { id: 5, title: "Standup 5" },
    { id: 6, title: "Standup 6" },
    { id: 7, title: "Standup 7" },
  ];

  export const STANDUP_TEXT =
    "In the last 7 days, I've focused on completing design and approval tasks, preparing for upcoming high-priority launches, and ensuring...";

  export const MY_WORK_TASKS: Record<string, { id: string; name: string; project: string }[]> = {
    overdue: [],
    todo: [
      { id: "1", name: "Task Aaa", project: "Project A" },
      { id: "2", name: "Task C", project: "Project CC" },
      { id: "3", name: "Task D", project: "Project A" },
      { id: "4", name: "Task E", project: "Project A" },
      { id: "5", name: "Task F", project: "Project K" },
    ],
    inprogress: [],
    done: [],
  };

  export const TASK_GROUPS = [
    {
      key: "todo",
      label: "To Do",
      labelColor: "text-blue-600",
      borderColor: "border-l-blue-500",
      taskCount: 5,
      subtaskCount: 3,
      tasks: [
        { id: "t1", name: "Changes for Account Settings", assignee: "BM", date: "10 Dec", priority: "high" },
        { id: "t2", name: "Update dashboard UI components", assignee: "KH", date: "12 Dec", priority: "medium" },
        { id: "t3", name: "Fix mobile responsiveness", assignee: "SJ", date: "15 Dec", priority: "low" },
        { id: "t4", name: "Write API documentation", assignee: "ER", date: "18 Dec", priority: "medium" },
        { id: "t5", name: "Review pull requests", assignee: "DW", date: "20 Dec", priority: "high" },
      ],
    },
    {
      key: "inprogress",
      label: "In Progress",
      labelColor: "text-yellow-600",
      borderColor: "border-l-yellow-500",
      taskCount: 3,
      subtaskCount: 1,
      tasks: [
        { id: "i1", name: "Design new landing page", assignee: "MC", date: "08 Dec", priority: "urgent" },
        { id: "i2", name: "Implement authentication flow", assignee: "JL", date: "09 Dec", priority: "high" },
        { id: "i3", name: "Database schema migration", assignee: "TH", date: "11 Dec", priority: "medium" },
      ],
    },
    {
      key: "done",
      label: "Done",
      labelColor: "text-green-600",
      borderColor: "border-l-green-500",
      taskCount: 4,
      subtaskCount: 2,
      tasks: [
        { id: "d1", name: "Setup CI/CD pipeline", assignee: "LP", date: "01 Dec", priority: "high" },
        { id: "d2", name: "Create onboarding flow", assignee: "MS", date: "03 Dec", priority: "medium" },
        { id: "d3", name: "Performance audit report", assignee: "AW", date: "05 Dec", priority: "low" },
        { id: "d4", name: "Fix login bug", assignee: "JB", date: "06 Dec", priority: "urgent" },
      ],
    },
  ];

  export const STARRED_ITEMS = [
    { id: "1", name: "D-Link", project: "Docs", starred: false },
    { id: "2", name: "Task F", project: "Project K", starred: false },
    { id: "3", name: "Task Aaa", project: "Project A", starred: true },
    { id: "4", name: "Platinum Tier", project: "Docs", starred: false },
    { id: "5", name: "Task Q", project: "Project D", starred: false },
  ];

  export const PROJECTS_LIST = [
    { id: "pb", name: "Project B", color: "bg-purple-500" },
    { id: "p2", name: "Project 2", color: "bg-red-500" },
    { id: "p3", name: "Project 3", color: "bg-green-500" },
    { id: "p4", name: "Project 4", color: "bg-blue-600" },
    { id: "p5", name: "Project 5", color: "bg-yellow-400" },
    { id: "p6", name: "Project 6", color: "bg-teal-500" },
  ];

  export const RECENTS = [
    { name: "Task Aaa", sub: "Project A" },
    { name: "D-Link", sub: "Docs" },
    { name: "Task B", sub: "Project B" },
    { name: "Task C", sub: "Project CC" },
    { name: "Task D", sub: "Project A" },
    { name: "Platinum Tier", sub: "Docs" },
    { name: "Task Aaa", sub: "Project A" },
    { name: "D-Link", sub: "Docs" },
    { name: "Task B", sub: "Project B" },
    { name: "Task C", sub: "Project CC" },
    { name: "Task D", sub: "Project A" },
    { name: "Platinum Tier", sub: "Docs" },
  ];

  export const ALL_PROJECTS = [
    { name: "Product Development", client: "Kevin Heal", initials: "KH", color: "bg-blue-400", start: "20/03/2024", deadline: "05/04/2024", status: "active", progress: 30 },
    { name: "New Office Building", client: "Sarah Johnson", initials: "SJ", color: "bg-purple-400", start: "15/03/2024", deadline: "10/04/2024", status: "cancel", progress: 60 },
    { name: "Mobile app design", client: "Michael Chen", initials: "MC", color: "bg-orange-400", start: "10/03/2024", deadline: "01/04/2024", status: "completed", progress: 100 },
    { name: "Website & Blog", client: "Emily Rodriguez", initials: "ER", color: "bg-slate-400", start: "05/03/2024", deadline: "20/03/2024", status: "pending", progress: 50 },
    { name: "Marketing Campaign", client: "David Wilson", initials: "DW", color: "bg-blue-600", start: "01/03/2024", deadline: "15/04/2024", status: "active", progress: 45 },
    { name: "E-commerce Platform", client: "Jessica Lee", initials: "JL", color: "bg-pink-400", start: "25/02/2024", deadline: "10/05/2024", status: "pending", progress: 20 },
    { name: "Brand Identity", client: "Tom Harris", initials: "TH", color: "bg-green-500", start: "18/02/2024", deadline: "01/04/2024", status: "active", progress: 70 },
    { name: "Data Migration", client: "Lisa Park", initials: "LP", color: "bg-yellow-500", start: "10/02/2024", deadline: "25/03/2024", status: "completed", progress: 100 },
    { name: "CRM Integration", client: "Mark Stone", initials: "MS", color: "bg-teal-500", start: "05/02/2024", deadline: "30/03/2024", status: "pending", progress: 35 },
    { name: "SEO Optimization", client: "Anna White", initials: "AW", color: "bg-indigo-400", start: "01/02/2024", deadline: "20/03/2024", status: "active", progress: 55 },
    { name: "Cloud Infrastructure", client: "Jake Brown", initials: "JB", color: "bg-red-400", start: "25/01/2024", deadline: "15/03/2024", status: "cancel", progress: 80 },
    { name: "AI Chatbot", client: "Nina Clark", initials: "NC", color: "bg-cyan-500", start: "20/01/2024", deadline: "10/04/2024", status: "pending", progress: 15 },
  ];

  export const PERSONAL_ITEMS = ALL_PROJECTS.slice(0, 8).map((p) => ({
    id: p.name,
    name: p.name,
    project: p.client,
    status: p.status,
    color: p.color,
    initials: p.initials,
  }));

  export const PROJECT_STATUS_DATA = [
    { label: "Active", value: ALL_PROJECTS.filter(p => p.status === "active").length, color: "#22c55e" },
    { label: "Pending", value: ALL_PROJECTS.filter(p => p.status === "pending").length, color: "#eab308" },
    { label: "Completed", value: ALL_PROJECTS.filter(p => p.status === "completed").length, color: "#3b82f6" },
    { label: "Cancelled", value: ALL_PROJECTS.filter(p => p.status === "cancel").length, color: "#ef4444" },
  ];

  export const TOTAL_PROJECTS = ALL_PROJECTS.length;

  export const ALL_COLUMNS = ["Project Name", "Client Name", "Start Date", "Deadline", "Status", "Progress"];
  export const PAGE_SIZE = 6;

  export const STATUS_STYLES: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cancel: "bg-red-100 text-red-700 border-red-200",
  };

  export const PIE_COLORS: Record<string, string> = {
    'Backlog': '#fb923c',
    'Not started': '#d1d5db',
    'Working on': '#3b82f6',
    'Completed': '#22c55e',
    'Canceled': '#ef4444',
    'On Hold': '#facc15',
    'In Review': '#a855f7',
    'Blocked': '#ec4899',
  };
