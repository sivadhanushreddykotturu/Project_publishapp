import { Suspense } from "react";
import { NewProjectForm } from "@/components/client/NewProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-[26px] font-semibold tracking-tight text-ink-950">
        Start a new test
      </h2>
      <p className="mt-2 text-[15px] text-ink-500">
        Pick a track and tell us about the app. We generate the invoice and
        prepare your tester workflow.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="py-12 text-center text-ink-400">Loading form...</div>}>
          <NewProjectForm />
        </Suspense>
      </div>
    </div>
  );
}
