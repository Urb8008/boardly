import {
  NextRequest,
  NextResponse,
} from "next/server";

export async function GET(
  request: NextRequest
) {
  const service =
    request.nextUrl.searchParams.get(
      "service"
    ) || "sheets";

  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin;

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const redirectUri =
    `${appUrl}/api/integrations/google/callback`;

  const scopes: Record<
    string,
    string[]
  > = {
    sheets: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/spreadsheets",
    ],

    gmail: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],

    calendar: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
    ],
  };

  const selectedScopes =
    scopes[service] ||
    scopes.sheets;

  const params =
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope:
        selectedScopes.join(" "),
      state: service,
    });

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(
    authUrl
  );
}