  // Footer note
  newLine(1.5);
  drawSubtle(
    "This report reflects the current state of your ThinkATS tenant at generation time.",
  );

  const pdfBytes = await pdfDoc.save();

  // 🔧 Wrap Uint8Array in a Blob so TypeScript is happy with BodyInit
  const pdfBlob = new Blob([pdfBytes]);

  const safeTenantSlug =
    tenantSlug ?? (tenant.id as string | null) ?? "tenant";
  const filename = `thinkats-analytics-summary-${safeTenantSlug}-${range}.pdf`;

  return new Response(pdfBlob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
