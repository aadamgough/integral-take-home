"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatFileSize, maskData } from "@/lib/utils";
import {
  STATUS_COLORS,
  getAuditActionInfo,
  AUDIT_ACTIONS,
  type Status,
} from "@/lib/constants";
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
  FileText,
  Shield,
  Loader2,
  File,
  Image,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface Intake {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;
  description: string;
  notes: string | null;
  status: string;
  createdAt: string;
  submittedBy: { id: string; name: string; email: string };
  reviewer: { id: string; name: string; email: string } | null;
  documents: Document[];
  auditLogs: AuditLog[];
}

export default function IntakeDetailPage() {
  const params = useParams();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [status, setStatus] = useState<Status>("PENDING");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  const fetchIntake = useCallback(async (options: { showLoading?: boolean; skipAudit?: boolean } = {}) => {
    const { showLoading = true, skipAudit = false } = options;
    if (showLoading) setIsLoading(true);
    try {
      const url = skipAudit 
        ? `/api/intakes/${params.id}?skipAudit=true` 
        : `/api/intakes/${params.id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setIntake(data);
        setStatus(data.status as Status);
      }
    } catch (error) {
      console.error("Failed to fetch intake:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchIntake();
  }, [fetchIntake]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as Status);
  };

  const handleViewModeToggle = async (privileged: boolean) => {
    setIsPrivileged(privileged);
    if (!intake) return;
    
    try {
      await fetch(`/api/intakes/${intake.id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: privileged ? AUDIT_ACTIONS.VIEW_MODE_PRIVILEGED : AUDIT_ACTIONS.VIEW_MODE_REDACTED,
          details: { viewMode: privileged ? "privileged" : "redacted" },
        }),
      });
      await fetchIntake({ showLoading: false, skipAudit: true });
    } catch (error) {
      console.error("Failed to log view mode change:", error);
    }
  };

  const handleSaveChanges = async () => {
    if (!intake) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/intakes/${intake.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchIntake({ showLoading: false, skipAudit: true });
      }
    } catch (error) {
      console.error("Failed to update intake:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDoc = intake?.documents[selectedDocIndex];
  const isViewable = selectedDoc && (selectedDoc.fileType.startsWith("image/") || selectedDoc.fileType === "application/pdf");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!intake) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Intake not found.</p>
          <Link href="/queue" className="text-primary hover:underline">
            Back to Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link
                href="/queue"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Queue
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="font-semibold">{intake.clientName}</h1>
            </div>

            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">
                    <span className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${STATUS_COLORS.PENDING.icon}`} />
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value="IN_REVIEW">
                    <span className="flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${STATUS_COLORS.IN_REVIEW.icon}`} />
                      In Review
                    </span>
                  </SelectItem>
                  <SelectItem value="APPROVED">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${STATUS_COLORS.APPROVED.icon}`} />
                      Approved
                    </span>
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    <span className="flex items-center gap-2">
                      <XCircle className={`h-4 w-4 ${STATUS_COLORS.REJECTED.icon}`} />
                      Rejected
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {status !== intake.status && (
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              )}
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
                {isPrivileged ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="privacy-toggle" className="text-sm cursor-pointer">
                  {isPrivileged ? "Privileged" : "Redacted"}
                </Label>
                <Switch
                  id="privacy-toggle"
                  checked={isPrivileged}
                  onCheckedChange={handleViewModeToggle}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          <div className="flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                    {intake.documents.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({intake.documents.length})
                      </span>
                    )}
                  </CardTitle>
                  {intake.documents.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedDocIndex((i) => Math.max(0, i - 1))}
                        disabled={selectedDocIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                        {selectedDocIndex + 1} of {intake.documents.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedDocIndex((i) => Math.min(intake.documents.length - 1, i + 1))}
                        disabled={selectedDocIndex === intake.documents.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                {intake.documents.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No documents uploaded</p>
                      <p className="text-sm">Patient has not uploaded any supporting documents</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    {selectedDoc && (
                      <div className="mb-3 flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          {selectedDoc.fileType.startsWith("image/") ? (
                            <Image className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{selectedDoc.fileName}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({formatFileSize(selectedDoc.fileSize)})
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0" asChild>
                          <a href={`/api/documents/${selectedDoc.id}`} download={selectedDoc.fileName}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    )}
                    <div className="flex-1 border rounded-lg overflow-hidden bg-muted/30 min-h-0">
                      {selectedDoc && isViewable ? (
                        <iframe
                          src={`/api/documents/${selectedDoc.id}`}
                          className="w-full h-full"
                          title={selectedDoc.fileName}
                        />
                      ) : selectedDoc ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <File className="h-16 w-16 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">{selectedDoc.fileName}</p>
                            <p className="text-sm mb-4">Preview not available for this file type</p>
                            <Button asChild>
                              <a href={`/api/documents/${selectedDoc.id}`} download={selectedDoc.fileName}>
                                <Download className="h-4 w-4 mr-2" />
                                Download File
                              </a>
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {intake.documents.length > 1 && (
                      <div className="mt-3">
                        <ScrollArea className="w-full">
                          <div className="flex gap-2 pb-2">
                            {intake.documents.map((doc, index) => (
                              <button
                                key={doc.id}
                                onClick={() => setSelectedDocIndex(index)}
                                className={`shrink-0 p-2 rounded-lg border transition-colors ${
                                  index === selectedDocIndex
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {doc.fileType.startsWith("image/") ? (
                                    <Image className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-xs max-w-[100px] truncate">{doc.fileName}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6 min-h-0 overflow-auto">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Submission Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reference</p>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{intake.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                    <p className="font-medium">{intake.submittedBy.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="font-medium">{formatDateTime(intake.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reviewer</p>
                    <p className="font-medium">{intake.reviewer?.name || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                  {!isPrivileged && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Shield className="h-3 w-3" />
                      PII Redacted
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" /> Full Name
                    </p>
                    <p className="font-medium">{intake.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium">{intake.clientEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Phone className="h-3 w-3" /> Phone
                      {!isPrivileged && <Shield className="h-3 w-3 text-yellow-600" />}
                    </p>
                    <p className={`font-medium ${!isPrivileged ? "font-mono text-muted-foreground" : ""}`}>
                      {isPrivileged ? intake.clientPhone : maskData(intake.clientPhone, "phone")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3" /> Date of Birth
                      {!isPrivileged && <Shield className="h-3 w-3 text-yellow-600" />}
                    </p>
                    <p className={`font-medium ${!isPrivileged ? "font-mono text-muted-foreground" : ""}`}>
                      {isPrivileged ? intake.dateOfBirth : maskData(intake.dateOfBirth, "dob")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <CreditCard className="h-3 w-3" /> SSN
                      {!isPrivileged && <Shield className="h-3 w-3 text-yellow-600" />}
                    </p>
                    <p className={`font-medium ${!isPrivileged ? "font-mono text-muted-foreground" : ""}`}>
                      {isPrivileged ? intake.ssn : maskData(intake.ssn, "ssn")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Medical History & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Description / Medical History</p>
                  <p className="text-sm leading-relaxed">{intake.description}</p>
                </div>
                {intake.notes && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Additional Notes</p>
                    <p className="text-sm leading-relaxed">{intake.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Activity Log</CardTitle>
                  {intake.auditLogs.length > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/intakes/${intake.id}/audit/export`} download>
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-auto">
                  {intake.auditLogs.map((log) => {
                    const actionInfo = getAuditActionInfo(log.action);
                    return (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className={`w-2 h-2 mt-1.5 rounded-full ${actionInfo.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{actionInfo.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {log.user.name} • {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {intake.auditLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
