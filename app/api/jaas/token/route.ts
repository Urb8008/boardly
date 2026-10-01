import { createClient } from "@/lib/supabase/server";
import { importPKCS8, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const boardId = Number(body.boardId);
    const roomName =
      typeof body.roomName === "string"
        ? body.roomName.trim()
        : "";

    if (
      !Number.isInteger(boardId) ||
      boardId <= 0 ||
      !roomName
    ) {
      return NextResponse.json(
        { error: "Invalid board or room." },
        { status: 400 }
      );
    }

    const { data: canAccess, error: accessError } =
      await supabase.rpc("can_access_board", {
        target_board_id: boardId,
      });

    if (accessError || !canAccess) {
      return NextResponse.json(
        { error: "You do not have access to this board." },
        { status: 403 }
      );
    }

    const appId = process.env.JAAS_APP_ID;
    const keyId = process.env.JAAS_KEY_ID;
    const privateKeyBase64 =
      process.env.JAAS_PRIVATE_KEY_BASE64;

    if (!appId || !keyId || !privateKeyBase64) {
      console.error("Missing JaaS environment variables.");

      return NextResponse.json(
        { error: "Video calling is not configured." },
        { status: 500 }
      );
    }

   const privateKeyPem = Buffer.from(
  privateKeyBase64.trim(),
  "base64"
)
  .toString("utf8")
  .replace(/^\uFEFF/, "")
  .trim();

console.log(
  "JaaS key format:",
  privateKeyPem.startsWith("-----BEGIN PRIVATE KEY-----"),
  privateKeyPem.endsWith("-----END PRIVATE KEY-----")
);

const privateKey = await importPKCS8(
  privateKeyPem,
  "RS256"
);

    const now = Math.floor(Date.now() / 1000);

    const displayName =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      (typeof user.user_metadata?.name === "string" &&
        user.user_metadata.name.trim()) ||
      user.email?.split("@")[0] ||
      "ToutchBase user";

    const token = await new SignJWT({
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: roomName,
      context: {
        user: {
          id: user.id,
          name: displayName,
          email: user.email ?? "",
          moderator: true,
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          "outbound-call": false,
        },
        room: {
          regex: false,
        },
      },
    })
      .setProtectedHeader({
        alg: "RS256",
        kid: keyId,
        typ: "JWT",
      })
      .setNotBefore(now - 10)
      .setExpirationTime(now + 60 * 60 * 2)
      .sign(privateKey);

    return NextResponse.json({
      token,
      appId,
      roomName,
    });
  } catch (error) {
    console.error("JaaS token error:", error);

    return NextResponse.json(
      { error: "Could not create video token." },
      { status: 500 }
    );
  }
}
