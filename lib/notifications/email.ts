type AppointmentEmailInput = {
  customerName: string;
  customerEmail?: string | null;
  businessName: string;
  serviceName?: string | null;
  startAt: string;
  endAt: string;
  status: string;
};

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

  const statusLabel = input.status.charAt(0).toUpperCase() + input.status.slice(1);
  const subject = `${input.businessName}: Appointment ${statusLabel}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211b">
      <h2>${subject}</h2>
      <p>Hi ${input.customerName},</p>
      <p>Your appointment with <strong>${input.businessName}</strong> is <strong>${statusLabel.toLowerCase()}</strong>.</p>
      <p><strong>Service:</strong> ${input.serviceName || "Appointment"}<br/>
      <strong>Date & time:</strong> ${formatDate(input.startAt)}<br/>
      <strong>End time:</strong> ${formatDate(input.endAt)}</p>
      <p>Thank you for choosing ${input.businessName}.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.customerEmail], subject, html }),
  });

  if (!response.ok) {
    console.error("Appointment email failed", await response.text());
    return { sent: false, skipped: false };
  }

  return { sent: true, skipped: false };
}
