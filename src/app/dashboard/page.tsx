"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  LogOut,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";

type Status = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

interface Intake {
  id: string;
  clientName: string;
  clientEmail: string;
  status: Status;
  createdAt: string;
  _count?: {
    documents: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const STATUS_COLORS = {
  PENDING: {
    icon: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  IN_REVIEW: {
    icon: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  APPROVED: {
    icon: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  REJECTED: {
    icon: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
} as const;

const statusConfig: Record<Status, { label: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
  },
  IN_REVIEW: {
    label: "In Review",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Rejected",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "PATIENT") {
      router.push("/queue");
      return;
    }

    setUser(parsedUser);
    fetchIntakes();
  }, [router]);

  const fetchIntakes = async () => {
    try {
      const response = await fetch("/api/intakes");
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const data = await response.json();
      setIntakes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("user");
      router.push("/");
    } catch {
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  // Calculate status counts
  const statusCounts = intakes.reduce(
    (acc, intake) => {
      acc[intake.status]++;
      return acc;
    },
    { PENDING: 0, IN_REVIEW: 0, APPROVED: 0, REJECTED: 0 } as Record<Status, number>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Patient Portal</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Applications</h1>
            <p className="text-muted-foreground">Track your clinical trial enrollment applications</p>
          </div>
          <Button asChild>
            <Link href="/intake" className="gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Link>
          </Button>
        </div>

        {/* Status Cards */}
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

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {intakes.length === 0
                ? "You haven't submitted any applications yet"
                : `${intakes.length} application${intakes.length === 1 ? "" : "s"} submitted`}
            </p>
          </CardHeader>
          <CardContent>
            {intakes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by submitting your first clinical trial enrollment application.
                </p>
                <Button asChild>
                  <Link href="/intake" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Submit Application
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intakes.map((intake) => {
                    const config = statusConfig[intake.status];
                    const colors = STATUS_COLORS[intake.status];
                    return (
                      <TableRow key={intake.id}>
                        <TableCell className="font-mono text-sm">
                          {intake.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">{intake.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(intake.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {intake._count?.documents || 0} file{(intake._count?.documents || 0) !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.border} ${colors.text}`}>
                            <span className={colors.icon}>{config.icon}</span>
                            {config.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link href={`/dashboard/${intake.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
