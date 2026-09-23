import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery" | "invite" | "magiclink" | "email_change" | null;
  const redirectTo = new URL("/dashboard", request.url);
  const supabase = await createClient();
  let error: { message: string } | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    error = result.error;
  } else {
    error = { message: "Missing confirmation parameters" };
  }

  if (error) {
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "This confirmation link is invalid or expired");
    return NextResponse.redirect(redirectTo);
  }

  if (type === "recovery") redirectTo.pathname = "/reset-password";
  return NextResponse.redirect(redirectTo);
}
