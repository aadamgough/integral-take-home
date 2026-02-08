"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const mockIntakes = [
  {
    id: "INT-001",
    clientName: "Sarah Mitchell",
    clientEmail: "sarah.mitchell@email.com",
    submittedAt: "Jan 18, 2026, 02:30 AM",
    status: "PENDING",
    reviewer: null,
  },
  {
    id: "INT-002",
    clientName: "Michael Chen",
    clientEmail: "m.chen@email.com",
    submittedAt: "Jan 17, 2026, 06:15 AM",
    status: "IN_REVIEW",
    reviewer: "Jane Smith",
  },
  {
    id: "INT-003",
    clientName: "Emily Rodriguez",
    clientEmail: "emily.r@email.com",
    submittedAt: "Jan 16, 2026, 01:00 AM",
    status: "APPROVED",
    reviewer: "John Doe",
  },
  {
    id: "INT-004",
    clientName: "James Wilson",
    clientEmail: "j.wilson@email.com",
    submittedAt: "Jan 15, 2026, 08:45 AM",
    status: "REJECTED",
    reviewer: "Jane Smith",
  },
  {
    id: "INT-005",
    clientName: "Amanda Foster",
    clientEmail: "a.foster@email.com",
    submittedAt: "Jan 19, 2026, 12:20 AM",
    status: "PENDING",
    reviewer: null,
  },
];

type Status = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  IN_REVIEW: {
    label: "In Review",
    variant: "default",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    variant: "outline",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export default function QueuePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusCounts = mockIntakes.reduce(
    (acc, intake) => {
      acc[intake.status as Status]++;
      return acc;
    },
    { PENDING: 0, IN_REVIEW: 0, APPROVED: 0, REJECTED: 0 } as Record<Status, number>
  );

  const filteredIntakes = mockIntakes.filter((intake) => {
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
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statusCounts.PENDING}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statusCounts.IN_REVIEW}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statusCounts.APPROVED}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntakes.map((intake) => {
                  const config = statusConfig[intake.status as Status];
                  return (
                    <TableRow key={intake.id}>
                      <TableCell className="font-mono text-sm">{intake.id}</TableCell>
                      <TableCell className="font-medium">{intake.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{intake.clientEmail}</TableCell>
                      <TableCell className="text-muted-foreground">{intake.submittedAt}</TableCell>
                      <TableCell>
                        <Badge
                          variant={config.variant}
                          className="gap-1"
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {intake.reviewer || "—"}
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
