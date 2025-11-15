// app/admin/sourcing/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSourcedCandidate(formData: FormData) {
  const fullName = (formData.get("fullName") as string | null)?.trim();
  const email = (formData.get("email") as string | null)
    ?.trim()
    .toLowerCase();
  const phone =
    (formData.get("phone") as string | null)?.trim() || null;
  const location =
    (formData.get("location") as string | null)?.trim() || null;
  const source =
    (formData.get("source") as string | null)?.trim() || "sourcing";
  const rawProfile =
    (formData.get("rawProfile") as string | null)?.trim() || null;
  const jobId =
    (formData.get("jobId") as string | null)?.trim() || null;

  if (!fullName || !email) {
    return {
      success: false,
      error: "Full name and email are required.",
    };
  }

  try {
    await prisma.candidate.create({
      data: {
        fullname: fullName, // matches your Prisma schema field
        email,
        phone,
        location,
        source,
        rawText: rawProfile,
        ...(jobId
          ? {
              job: {
                connect: { id: jobId },
              },
            }
          : {}),
      },
    });

    // Refresh admin lists
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/sourcing");

    return { success: true };
  } catch (error) {
    console.error("createSourcedCandidate error", error);
    return {
      success: false,
      error: "Failed to save candidate. Please try again.",
    };
  }
}
