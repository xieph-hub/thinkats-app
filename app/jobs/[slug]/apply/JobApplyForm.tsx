// app/jobs/[slug]/apply/JobApplyForm.tsx
"use client";

import { useState } from "react";

type JobApplyFormProps = {
  slug: string;
  jobTitle: string;
};

export default function JobApplyForm({ slug, jobTitle }: JobApplyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // 
