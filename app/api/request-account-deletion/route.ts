import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Only accept requests from this site's own browser interface.
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    if (!origin || origin !== requestOrigin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "Please sign in and try again." }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey || !apiKey.startsWith("re_") || /\s/.test(apiKey)) {
      console.error("Account deletion request: RESEND_API_KEY is not configured.");
      return NextResponse.json({ error: "Email service is currently unavailable." }, { status: 503 });
    }

    // Do not accept the account email or identity from the client.
    const { data, error } = await new Resend(apiKey).emails.send({
      from: "TouchBase <noreply@urbanenglish.es>",
      to: ["dan@urbanenglish.es"],
      subject: "TouchBase account deletion request",
      text: [
        "A signed-in TouchBase user has requested account deletion.",
        "",
        `Account email: ${user.email}`,
        `Supabase user ID: ${user.id}`,
        `Requested at: ${new Date().toISOString()}`,
        "",
        "This is a notification only. No account or board has been deleted.",
        "Before manual deletion, confirm the request with the account holder,",
        "check all boards they own, and transfer ownership of shared boards.",
      ].join("\n"),
    });

    if (error || !data?.id) {
      console.error("Account deletion request could not be sent:", error);
      return NextResponse.json({ error: "Could not send the request. Please try again later." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion request error:", error);
    return NextResponse.json({ error: "Could not process the request." }, { status: 500 });
  }
}
