"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, FileText, Image, File, AlertCircle } from "lucide-react";

interface FileWithPreview {
  file: File;
  id: string;
  description: string;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="h-5 w-5 text-red-500" />,
  "image/jpeg": <Image className="h-5 w-5 text-blue-500" />,
  "image/png": <Image className="h-5 w-5 text-blue-500" />,
  "image/gif": <Image className="h-5 w-5 text-blue-500" />,
  "image/webp": <Image className="h-5 w-5 text-blue-500" />,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IntakePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024;

    const validFiles: FileWithPreview[] = [];
    Array.from(newFiles).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}`);
        return;
      }
      if (file.size > maxSize) {
        setError(`File too large: ${file.name} (max 10MB)`);
        return;
      }
      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: "",
      });
    });

    setFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const intakeData = {
      clientName: formData.get("fullName") as string,
      clientEmail: formData.get("email") as string,
      clientPhone: formData.get("phone") as string,
      dateOfBirth: formData.get("dob") as string,
      ssn: formData.get("ssn") as string,
      description: formData.get("description") as string,
      notes: formData.get("notes") as string || null,
    };

    try {
      const intakeResponse = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakeData),
      });

      if (!intakeResponse.ok) {
        const data = await intakeResponse.json();
        throw new Error(data.error || "Failed to submit intake");
      }

      const intake = await intakeResponse.json();

      for (const fileItem of files) {
        const docFormData = new FormData();
        docFormData.append("file", fileItem.file);
        docFormData.append("intakeId", intake.id);
        if (fileItem.description) {
          docFormData.append("description", fileItem.description);
        }

        const docResponse = await fetch("/api/documents", {
          method: "POST",
          body: docFormData,
        });

        if (!docResponse.ok) {
          console.error("Failed to upload document:", fileItem.file.name);
        }
      }

      router.push(`/intake/success?ref=${intake.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Clinical Trial Enrollment Application</CardTitle>
            <CardDescription>
              Please provide your personal information below. All fields marked with * are required.
              Your information is encrypted and securely stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ssn">
                    Social Security Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ssn"
                    name="ssn"
                    placeholder="123-45-6789"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Format: XXX-XX-XXXX</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Medical History / Reason for Enrollment <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Please describe your medical history and reason for enrolling in this clinical trial..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information you'd like to provide..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Supporting Documents</Label>
                <p className="text-sm text-muted-foreground">
                  Upload medical records, insurance cards, prescriptions, or ID photos (PDF, images up to 10MB each)
                </p>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPEG, PNG, GIF, WebP, Word (max 10MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="hidden"
                />

                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {files.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        {FILE_TYPE_ICONS[item.file.type] || <File className="h-5 w-5 text-gray-500" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(item.id)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  By submitting this form, you consent to the collection and processing of your
                  personal information in accordance with our privacy policy. Your data will be
                  reviewed by authorized personnel only.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
