import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import SubmissionStatus from "@/components/SubmissionStatus";

export const metadata: Metadata = { title: "Submission status", robots: { index: false } };

export default function StatusPage() {
  return (
    <>
      <PageHead kicker="Thanks for submitting" title="Submission status" />
      <section className="wrap">
        <SubmissionStatus />
      </section>
    </>
  );
}
