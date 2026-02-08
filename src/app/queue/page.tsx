"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  LogOut,
  FileText,
  Loader2,
  Paperclip,
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

type Status = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QueuePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      }
    }
    fetchIntakes();
  }, []);

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

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Intake Review</span>
              </div>
              <Tabs defaultValue="queue" className="hidden sm:block">
                <TabsList>
                  <TabsTrigger value="queue" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Review Queue
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Audit Trail
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Jane Smith</p>
                <p className="text-xs text-muted-foreground">Reviewer</p>
              </div>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground">Manage and review client intake submissions</p>
        </div>

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
            {isLoading ? (
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIntakes.map((intake) => {
                    const config = statusConfig[intake.status as Status];
                    const colors = STATUS_COLORS[intake.status as Status];
                    return (
                      <TableRow key={intake.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{intake.id}</TableCell>
                        <TableCell className="font-medium">{intake.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(intake.createdAt)}</TableCell>
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link href={`/queue/${intake.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredIntakes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No intakes found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
