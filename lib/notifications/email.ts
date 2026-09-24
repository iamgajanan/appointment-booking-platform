type AppointmentEmailInput = {
  customerName: string;
  customerEmail?: string | null;
  businessName: string;
  serviceName?: string | null;
  startAt: string;
  endAt: string;
  status: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export async function sendAppointmentEmail(input: AppointmentEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from || !input.customerEmail) {
    return { sent: false, skipped: true };
  }

  const customerName = escapeHtml(input.customerName);
  const businessName = escapeHtml(input.businessName);
  const serviceName = escapeHtml(input.serviceName || "Appointment");
  const statusLabel = escapeHtml(input.status.charAt(0).toUpperCase() + input.status.slice(1));
  const subject = `${input.businessName}: Appointment ${input.status.charAt(0).toUpperCase() + input.status.slice(1)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211b">
      <h2>${escapeHtml(subject)}</h2>
      <p>Hi ${customerName},</p>
      <p>Your appointment with <strong>${businessName}</strong> is <strong>${statusLabel.toLowerCase()}</strong>.</p>
      <p><strong>Service:</strong> ${serviceName}<br/>
      <strong>Date & time:</strong> ${formatDate(input.startAt)}<br/>
      <strong>End time:</strong> ${formatDate(input.endAt)}</p>
      <p>Thank you for choosing ${businessName}.</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.customerEmail], subject, html }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Appointment email failed", response.status);
      return { sent: false, skipped: false };
    }

    return { sent: true, skipped: false };
  } catch (error) {
    console.error("Appointment email request failed", error instanceof Error ? error.message : "Unknown error");
    return { sent: false, skipped: false };
  }
}
