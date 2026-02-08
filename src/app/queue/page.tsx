"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, subMinutes, subHours, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn, formatDateTime } from "@/lib/utils";
import {
  STATUS_COLORS,
  getStatusConfig,
  getAuditActionInfo,
  TIME_RANGE_OPTIONS,
  STORAGE_KEYS,
  type Status,
  type TimeRangePreset,
} from "@/lib/constants";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  LogOut,
  FileText,
  Loader2,
  Paperclip,
  History,
  Download,
  User,
  CalendarIcon,
} from "lucide-react";

interface Intake {
  id: string;
  clientName: string;
  clientEmail: string;
  status: string;
  createdAt: string;
  reviewer: { id: string; name: string; email: string } | null;
  _count: { documents: number };
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  intake: { id: string; clientName: string; clientEmail: string; status: string };
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
}

type ViewMode = "queue" | "audit";

export default function QueuePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("queue");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [isLoadingIntakes, setIsLoadingIntakes] = useState(true);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");
  const [auditReviewerFilter, setAuditReviewerFilter] = useState<string>("all");
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [computedDateRange, setComputedDateRange] = useState<{ startDate: string; endDate: string }>({ startDate: "", endDate: "" });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // Use localStorage for initial render to avoid flash
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === "REVIEWER") {
          setCurrentUser(parsed);
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }

    // Verify auth state with server (source of truth)
    async function verifyAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          localStorage.removeItem(STORAGE_KEYS.USER);
          router.push("/");
          return;
        }
        const user = await response.json();
        if (user.role !== "REVIEWER") {
          router.push("/dashboard");
          return;
        }
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        router.push("/");
      }
    }
    verifyAuth();
  }, [router]);

  useEffect(() => {
    const now = new Date();
    
    if (timeRangePreset === "all") {
      setComputedDateRange({ startDate: "", endDate: "" });
      return;
    }
    
    if (timeRangePreset === "custom" && customDateRange?.from) {
      setComputedDateRange({
        startDate: format(customDateRange.from, "yyyy-MM-dd"),
        endDate: customDateRange.to ? format(customDateRange.to, "yyyy-MM-dd") : format(customDateRange.from, "yyyy-MM-dd"),
      });
      return;
    }
    
    if (timeRangePreset === "custom" && !customDateRange?.from) {
      return;
    }
    
    let startDate: Date;
    switch (timeRangePreset) {
      case "30min":
        startDate = subMinutes(now, 30);
        break;
      case "1hour":
        startDate = subHours(now, 1);
        break;
      case "3hours":
        startDate = subHours(now, 3);
        break;
      case "6hours":
        startDate = subHours(now, 6);
        break;
      case "24hours":
        startDate = subHours(now, 24);
        break;
      case "3days":
        startDate = subDays(now, 3);
        break;
      case "week":
        startDate = subDays(now, 7);
        break;
      case "14days":
        startDate = subDays(now, 14);
        break;
      case "30days":
        startDate = subDays(now, 30);
        break;
      default:
        setComputedDateRange({ startDate: "", endDate: "" });
        return;
    }
    
    setComputedDateRange({
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  }, [timeRangePreset, customDateRange]);

  const { startDate: auditStartDate, endDate: auditEndDate } = computedDateRange;

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomDateRange(range);
  };

  const handleTimeRangeChange = (value: string) => {
    const preset = value as TimeRangePreset;
    if (preset === "custom") {
      setIsCalendarOpen(true);
    } else {
      setTimeRangePreset(preset);
      setCustomDateRange(undefined);
      setIsCalendarOpen(false);
    }
  };

  const getTimeRangeDisplayLabel = (): string => {
    if (timeRangePreset === "custom" && customDateRange?.from) {
      const fromStr = format(customDateRange.from, "MMM d, yyyy");
      const toStr = customDateRange.to ? format(customDateRange.to, "MMM d, yyyy") : fromStr;
      return fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
    }
    return TIME_RANGE_OPTIONS.find(o => o.value === timeRangePreset)?.label || "Time";
  };

  useEffect(() => {
    async function fetchIntakes() {
      try {
        const response = await fetch("/api/intakes");
        if (response.ok) {
          const data = await response.json();
          setIntakes(data);
        }
      } catch (error) {
        console.error("Failed to fetch intakes:", error);
      } finally {
        setIsLoadingIntakes(false);
      }
    }
    fetchIntakes();
  }, []);

  useEffect(() => {
    if (viewMode !== "audit") return;

    async function fetchAuditLogs() {
      setIsLoadingAudit(true);
      try {
        const params = new URLSearchParams();
        if (auditSearch) params.set("search", auditSearch);
        if (auditActionFilter !== "all") params.set("action", auditActionFilter);
        if (auditReviewerFilter !== "all") params.set("reviewer", auditReviewerFilter);
        if (auditStartDate) params.set("startDate", auditStartDate);
        if (auditEndDate) params.set("endDate", auditEndDate);

        const response = await fetch(`/api/audit-logs?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data.auditLogs);
          setReviewers(data.reviewers);
          setActionTypes(data.actionTypes);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoadingAudit(false);
      }
    }
    fetchAuditLogs();
  }, [viewMode, auditSearch, auditActionFilter, auditReviewerFilter, computedDateRange]);

  // Queue filtering
  const statusCounts = intakes.reduce(
    (acc, intake) => {
      acc[intake.status as Status]++;
      return acc;
    },
    { PENDING: 0, IN_REVIEW: 0, APPROVED: 0, REJECTED: 0 } as Record<Status, number>
  );

  const filteredIntakes = intakes.filter((intake) => {
    const matchesSearch =
      searchQuery === "" ||
      intake.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || intake.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getExportUrl = () => {
    const params = new URLSearchParams();
    if (auditSearch) params.set("search", auditSearch);
    if (auditActionFilter !== "all") params.set("action", auditActionFilter);
    if (auditReviewerFilter !== "all") params.set("reviewer", auditReviewerFilter);
    if (auditStartDate) params.set("startDate", auditStartDate);
    if (auditEndDate) params.set("endDate", auditEndDate);
    return `/api/audit-logs/export?${params.toString()}`;
  };

  const clearAuditFilters = () => {
    setAuditSearch("");
    setAuditActionFilter("all");
    setAuditReviewerFilter("all");
    setTimeRangePreset("all");
    setCustomDateRange(undefined);
  };

  const hasActiveFilters = auditSearch || auditActionFilter !== "all" || auditReviewerFilter !== "all" || timeRangePreset !== "all";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Intake Review</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{currentUser?.name || "Loading..."}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.role === "REVIEWER" ? "Reviewer" : "Patient"}</p>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <LogOut className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {viewMode === "queue" ? "Review Queue" : "Audit Trail"}
            </h1>
            <p className="text-muted-foreground">
              {viewMode === "queue"
                ? "Manage and review client intake submissions"
                : "View and export activity logs for compliance reporting"}
            </p>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="queue" className="gap-2">
                <FileText className="h-4 w-4" />
                Queue
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <History className="h-4 w-4" />
                Audit Trail
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === "queue" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  <Clock className={`h-4 w-4 ${STATUS_COLORS.PENDING.icon}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statusCounts.PENDING}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
                  <AlertCircle className={`h-4 w-4 ${STATUS_COLORS.IN_REVIEW.icon}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statusCounts.IN_REVIEW}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                  <CheckCircle2 className={`h-4 w-4 ${STATUS_COLORS.APPROVED.icon}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statusCounts.APPROVED}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                  <XCircle className={`h-4 w-4 ${STATUS_COLORS.REJECTED.icon}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statusCounts.REJECTED}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Intake Submissions</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredIntakes.length} intakes found
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, ID, or email..."
                        className="pl-9 w-full sm:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingIntakes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Docs</TableHead>
                        <TableHead>Reviewer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIntakes.map((intake) => {
                        const config = getStatusConfig(intake.status as Status);
                        const colors = STATUS_COLORS[intake.status as Status];
                        return (
                          <TableRow 
                            key={intake.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/queue/${intake.id}`)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">{intake.id}</TableCell>
                            <TableCell className="font-medium">{intake.clientName}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDateTime(intake.createdAt)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.border} ${colors.text}`}>
                                <span className={colors.icon}>{config.icon}</span>
                                {config.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              {intake._count.documents > 0 && (
                                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                  <Paperclip className="h-3 w-3" />
                                  {intake._count.documents}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {intake.reviewer?.name || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredIntakes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No intakes found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Activity Logs</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {auditLogs.length} log entries
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAuditFilters}>
                        Clear filters
                      </Button>
                    )}
                    <Button variant="outline" asChild>
                      <a href={getExportUrl()} download>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </a>
                    </Button>
                  </div>
                </div>
                {/* Search and Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by reviewer, patient, or application ID..."
                      className="pl-9"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                    />
                  </div>
                  <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {actionTypes.map((action) => (
                        <SelectItem key={action} value={action}>
                          {getAuditActionInfo(action).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={auditReviewerFilter} onValueChange={setAuditReviewerFilter}>
                    <SelectTrigger className="w-[180px]">
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {reviewers.map((reviewer) => (
                        <SelectItem key={reviewer.id} value={reviewer.id}>
                          {reviewer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timeRangePreset} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className={cn(
                      "w-[160px]",
                      timeRangePreset === "custom" && customDateRange?.from && "w-[240px]"
                    )}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span className="truncate">{getTimeRangeDisplayLabel()}</span>
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {TIME_RANGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <DialogContent className="sm:max-w-fit" showCloseButton={false}>
                      <DialogHeader>
                        <DialogTitle>Select date range</DialogTitle>
                      </DialogHeader>
                      <Calendar
                        mode="range"
                        defaultMonth={customDateRange?.from}
                        selected={customDateRange}
                        onSelect={handleCustomDateSelect}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date()}
                      />
                      <DialogFooter className="flex-row justify-between sm:justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setCustomDateRange(undefined);
                          }}
                        >
                          Clear
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsCalendarOpen(false);
                              setCustomDateRange(undefined);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              setTimeRangePreset("custom");
                              setIsCalendarOpen(false);
                            }}
                            disabled={!customDateRange?.from}
                          >
                            Apply
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAudit ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead className="w-[180px]">Activity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const actionInfo = getAuditActionInfo(log.action);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${actionInfo.color}`} />
                              <span className="font-medium">{actionInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.user.name}</p>
                              <p className="text-xs text-muted-foreground">{log.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link 
                              href={`/queue/${log.intake.id}`}
                              className="font-mono text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {log.intake.id.slice(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell>{log.intake.clientName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {log.details ? (
                              <span title={log.details}>{log.details}</span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No audit logs found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
