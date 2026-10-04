import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // ---------------------------------
    // EMAIL CONFIG
    // ---------------------------------

    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (
      !apiKey ||
      !apiKey.startsWith("re_") ||
      /\s/.test(apiKey)
    ) {
      console.error(
        "RESEND_API_KEY is missing or incorrectly formatted."
      );

      return NextResponse.json(
        {
          error:
            "Email service is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    // Create Resend only when this API
    // route is actually called.
    const resend = new Resend(apiKey);

    // ---------------------------------
    // VERIFY SIGNED-IN USER
    // ---------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be signed in.",
        },
        {
          status: 401,
        }
      );
    }

    // ---------------------------------
    // READ REQUEST
    // ---------------------------------

    const body = await request.json();

    const inviteId = Number(body.inviteId);

    if (!inviteId || Number.isNaN(inviteId)) {
      return NextResponse.json(
        {
          error: "Missing or invalid invite ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------
    // LOAD INVITE
    // ---------------------------------

    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from("board_invites")
      .select(
        "id, board_id, email, role, invited_by, accepted"
      )
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        {
          error:
            "Invite not found or you do not have permission to send it.",
        },
        {
          status: 404,
        }
      );
    }

    if (invite.accepted) {
      return NextResponse.json(
        {
          error:
            "This invite has already been accepted.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------
    // LOAD BOARD
    // ---------------------------------

    const {
      data: board,
      error: boardError,
    } = await supabase
      .from("boards")
      .select("id, name, user_id")
      .eq("id", invite.board_id)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        {
          error: "Board not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ---------------------------------
    // VERIFY OWNER
    // ---------------------------------

    if (board.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the board owner can send invites.",
        },
        {
          status: 403,
        }
      );
    }

    if (invite.invited_by !== user.id) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to send this invite.",
        },
        {
          status: 403,
        }
      );
    }

    // ---------------------------------
    // BUILD EMAIL
    // ---------------------------------

    const inviteEmail = invite.email
      .trim()
      .toLowerCase();

    const boardName = board.name;

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      new URL(request.url).origin;

    const inviteUrl =
      `${origin.replace(/\/$/, "")}/protected/invites/${invite.id}`;

    // ---------------------------------
    // SEND EMAIL
    // ---------------------------------

    const inviterEmail =
      user.email?.trim().toLowerCase() || "a TouchBase user";

    const subject =
      `TouchBase invitation: ${boardName}`;

    const plainText = [
      "TouchBase board invitation",
      "",
      `${inviterEmail} invited you to collaborate on the board "${boardName}".`,
      "",
      "Open this secure invitation link:",
      inviteUrl,
      "",
      `This invitation was sent to ${inviteEmail}.`,
      "You must sign in to TouchBase with this same email address to accept it.",
      "",
      "If you were not expecting this invitation, you can safely ignore this email.",
      "",
      "TouchBase",
      "Urban English",
    ].join("\n");

    const {
      data,
      error,
    } = await resend.emails.send({
      from:
        "TouchBase <noreply@urbanenglish.es>",

      to: [inviteEmail],

      subject,

      text: plainText,

      html: `
        <!doctype html>
        <html>
          <body
            style="
              margin: 0;
              padding: 0;
              background: #f8fafc;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
            "
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="background: #f8fafc;"
            >
              <tr>
                <td align="center" style="padding: 32px 16px;">
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      max-width: 560px;
                      background: #ffffff;
                      border: 1px solid #e2e8f0;
                      border-radius: 16px;
                    "
                  >
                    <tr>
                      <td style="padding: 32px;">
                        <p
                          style="
                            margin: 0 0 20px;
                            font-size: 26px;
                            font-weight: 700;
                          "
                        >
                          TouchBase
                        </p>

                        <h1
                          style="
                            margin: 0 0 16px;
                            font-size: 22px;
                            line-height: 1.3;
                          "
                        >
                          Board invitation
                        </h1>

                        <p
                          style="
                            margin: 0 0 12px;
                            color: #475569;
                            font-size: 15px;
                            line-height: 1.6;
                          "
                        >
                          <strong>${escapeHtml(inviterEmail)}</strong>
                          invited you to collaborate on
                          <strong>${escapeHtml(boardName)}</strong>.
                        </p>

                        <p
                          style="
                            margin: 0 0 22px;
                            color: #475569;
                            font-size: 15px;
                            line-height: 1.6;
                          "
                        >
                          This invitation was sent to
                          <strong>${escapeHtml(inviteEmail)}</strong>.
                          Sign in to TouchBase with this same email address
                          before accepting the invitation.
                        </p>

                        <p style="margin: 0 0 24px;">
                          <a
                            href="${inviteUrl}"
                            style="
                              display: inline-block;
                              padding: 12px 20px;
                              background: #1d4ed8;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 8px;
                              font-size: 15px;
                              font-weight: 700;
                            "
                          >
                            Open invitation
                          </a>
                        </p>

                        <p
                          style="
                            margin: 0 0 8px;
                            color: #64748b;
                            font-size: 13px;
                            line-height: 1.5;
                          "
                        >
                          If the button does not work, copy and paste this link
                          into your browser:
                        </p>

                        <p
                          style="
                            margin: 0 0 24px;
                            word-break: break-all;
                            color: #475569;
                            font-size: 12px;
                            line-height: 1.5;
                          "
                        >
                          ${inviteUrl}
                        </p>

                        <p
                          style="
                            margin: 0;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 18px;
                            color: #94a3b8;
                            font-size: 12px;
                            line-height: 1.5;
                          "
                        >
                          If you were not expecting this invitation,
                          you can safely ignore this email.
                          This is a transactional message from TouchBase by Urban English.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Board invite email error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to send invite.",
      },
      {
        status: 500,
      }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
