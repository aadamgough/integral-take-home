"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Shield,
} from "lucide-react";

const mockIntake = {
  id: "INT-001",
  clientName: "Sarah Mitchell",
  clientEmail: "sarah.mitchell@email.com",
  clientPhone: "(555) 123-4567",
  dateOfBirth: "1985-03-15",
  ssn: "123-45-6789",
  address: "123 Main St, Anytown, CA 90210",
  description: "Seeking enrollment in the Phase 3 clinical trial for diabetes management medication. Previous medical history includes Type 2 diabetes diagnosis in 2020.",
  notes: "Patient has completed initial screening questionnaire and meets preliminary eligibility criteria.",
  status: "PENDING",
  submittedAt: "Jan 18, 2026, 02:30 AM",
  reviewer: null,
};

type Status = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-600",
  },
  IN_REVIEW: {
    label: "In Review",
    variant: "default",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-blue-600",
  },
  APPROVED: {
    label: "Approved",
    variant: "outline",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-600",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
  },
};

function maskData(data: string, type: "phone" | "ssn" | "dob"): string {
  switch (type) {
    case "phone":
      return `***-***-${data.slice(-4)}`;
    case "ssn":
      return `***-**-${data.slice(-4)}`;
    case "dob":
      const year = data.split("-")[0];
      return `**/**/` + year;
    default:
      return data;
  }
}

export default function IntakeDetailPage() {
  const params = useParams();
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [status, setStatus] = useState<Status>(mockIntake.status as Status);

  const config = statusConfig[status];

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as Status);
    // API call will be implemented later
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/queue"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">Intake {params.id}</CardTitle>
                  <Badge variant={config.variant} className="gap-1">
                    {config.icon}
                    {config.label}
                  </Badge>
                </div>
                <CardDescription>
                  Submitted on {mockIntake.submittedAt}
                </CardDescription>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {isPrivileged ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="privacy-toggle" className="text-sm font-medium cursor-pointer">
                    {isPrivileged ? "Privileged View" : "Redacted View"}
                  </Label>
                </div>
                <Switch
                  id="privacy-toggle"
                  checked={isPrivileged}
                  onCheckedChange={setIsPrivileged}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
                {!isPrivileged && (
                  <CardDescription className="flex items-center gap-2 text-yellow-600">
                    <Shield className="h-4 w-4" />
                    Sensitive fields are redacted. Enable privileged view to see full data.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Full Name
                    </div>
                    <p className="font-medium">{mockIntake.clientName}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                    <p className="font-medium">{mockIntake.clientEmail}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone Number
                      {!isPrivileged && <Shield className="h-3 w-3 text-yellow-600" />}
                    </div>
                    <p className={`font-medium ${!isPrivileged ? "font-mono text-muted-foreground" : ""}`}>
                      {isPrivileged ? mockIntake.clientPhone : maskData(mockIntake.clientPhone, "phone")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Date of Birth
                      {!isPrivileged && <Shield className="h-3 w-3 text-yellow-600" />}
                    </div>
                    <p className={`font-medium ${!isPrivileged ? "font-mono text-muted-foreground" : ""}`}>
                      {isPrivileged ? mockIntake.dateOfBirth : maskData(mockIntake.dateOfBirth, "dob")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      Social Security Number
                      {!isPrivileged && <Shield className="h-3 w-3 text-yellow-600" />}
                    </div>
                    <p className={`font-medium ${!isPrivileged ? "font-mono text-muted-foreground" : ""}`}>
                      {isPrivileged ? mockIntake.ssn : maskData(mockIntake.ssn, "ssn")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Address
                    </div>
                    <p className="font-medium">{mockIntake.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description / Medical History</p>
                  <p className="text-sm leading-relaxed">{mockIntake.description}</p>
                </div>
                {mockIntake.notes && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Additional Notes</p>
                    <p className="text-sm leading-relaxed">{mockIntake.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending
                      </span>
                    </SelectItem>
                    <SelectItem value="IN_REVIEW">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        In Review
                      </span>
                    </SelectItem>
                    <SelectItem value="APPROVED">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Approved
                      </span>
                    </SelectItem>
                    <SelectItem value="REJECTED">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Rejected
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                    <div>
                      <p className="font-medium">Intake Created</p>
                      <p className="text-muted-foreground text-xs">Jan 18, 2026, 02:30 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium">Viewed by Jane Smith</p>
                      <p className="text-muted-foreground text-xs">Jan 18, 2026, 09:15 AM</p>
                    </div>
                  </div>
                </div>
                <Button variant="link" className="mt-4 p-0 h-auto" asChild>
                  <Link href={`/queue/${params.id}/audit`}>View Full Audit Trail →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
