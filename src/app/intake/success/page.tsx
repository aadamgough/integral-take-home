"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

function IntakeSuccessContent() {
  const searchParams = useSearchParams();
  const referenceNumber = searchParams.get("ref") || "INT-000";

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="pt-12 pb-8 px-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Intake Submitted Successfully</h1>
            <p className="text-muted-foreground">
              Your intake has been received and is now pending review. You will be notified once a
              reviewer processes your submission.
            </p>
          </div>

          <div className="w-full bg-muted/50 rounded-lg py-4 px-6">
            <p className="text-sm text-muted-foreground">Reference Number</p>
            <p className="text-xl font-mono font-bold">{referenceNumber}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" asChild>
              <Link href="/intake">Submit Another</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IntakeSuccessLoading() {
  return (
    <Card className="w-full max-w-lg">
      <CardContent className="pt-12 pb-8 px-8">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntakeSuccessPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Suspense fallback={<IntakeSuccessLoading />}>
        <IntakeSuccessContent />
      </Suspense>
    </div>
  );
}
