"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatDateTime, formatDateLong, formatFileSize } from "@/lib/utils";
import { STATUS_COLORS, getStatusConfig, STORAGE_KEYS, type Status } from "@/lib/constants";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  createdAt: string;
  description?: string;
}

interface Intake {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;
  description: string;
  notes?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PatientIntakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntake = useCallback(async () => {
    try {
      const response = await fetch(`/api/intakes/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Application not found");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to view this application");
        }
        throw new Error("Failed to fetch application details");
      }
      const data = await response.json();
      setIntake(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!storedUser) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "PATIENT") {
      router.push("/queue");
      return;
    }

    fetchIntake();
  }, [router, fetchIntake]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !intake) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error || "Application not found"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Application {intake.id.slice(0, 8).toUpperCase()}
          </h1>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${STATUS_COLORS[intake.status].bg} ${STATUS_COLORS[intake.status].border} ${STATUS_COLORS[intake.status].text}`}>
            <span className={STATUS_COLORS[intake.status].icon}>{getStatusConfig(intake.status, "md").icon}</span>
            {getStatusConfig(intake.status).label}
          </span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Application Details</CardTitle>
          
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{intake.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{intake.clientEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{intake.clientPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{formatDateLong(intake.dateOfBirth)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Medical Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Medical History / Reason for Enrollment</p>
                  <p className="text-sm">{intake.description}</p>
                </div>
                {intake.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                    <p className="text-sm">{intake.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Submission Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Submitted On</p>
                  <p className="font-medium">{formatDateTime(intake.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDateTime(intake.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {intake.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No documents were uploaded with this application.
              </p>
            ) : (
              <div className="space-y-3">
                {intake.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)} • Uploaded {formatDateTime(doc.createdAt)}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
