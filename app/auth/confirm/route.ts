import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery" | "invite" | "magiclink" | "email_change" | null;
  const redirectTo = new URL("/dashboard", request.url);

  if (!tokenHash || !type) {
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "Invalid confirmation link");
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "This confirmation link is invalid or expired");
    return NextResponse.redirect(redirectTo);
  }

  if (type === "recovery") {
    redirectTo.pathname = "/reset-password";
  }

  return NextResponse.redirect(redirectTo);
}
