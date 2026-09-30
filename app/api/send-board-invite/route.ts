import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function POST(
  request: Request
) {
  try {
    // ---------------------------------
    // 1. VERIFY SIGNED-IN USER
    // ---------------------------------

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        }
      );
    }

    // ---------------------------------
    // 2. READ REQUEST
    // ---------------------------------

    const body =
      await request.json();

    const inviteId =
      Number(body.inviteId);

    if (
      !inviteId ||
      Number.isNaN(inviteId)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid invite ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------
    // 3. LOAD INVITE FROM DATABASE
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

    if (
      inviteError ||
      !invite
    ) {
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

    // ---------------------------------
    // 4. INVITE MUST STILL BE PENDING
    // ---------------------------------

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
    // 5. LOAD BOARD
    // ---------------------------------

    const {
      data: board,
      error: boardError,
    } = await supabase
      .from("boards")
      .select(
        "id, name, user_id"
      )
      .eq(
        "id",
        invite.board_id
      )
      .single();

    if (
      boardError ||
      !board
    ) {
      return NextResponse.json(
        {
          error:
            "Board not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ---------------------------------
    // 6. VERIFY CALLER OWNS BOARD
    // ---------------------------------

    if (
      board.user_id !==
      user.id
    ) {
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

    // ---------------------------------
    // 7. VERIFY INVITE CREATOR
    // ---------------------------------

    if (
      invite.invited_by !==
      user.id
    ) {
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

    /*
      IMPORTANT:
      We do NOT trust email or boardName
      supplied by the browser.

      Both values come directly from
      Supabase instead.
    */

    const inviteEmail =
      invite.email
        .trim()
        .toLowerCase();

    const boardName =
      board.name;

    // ---------------------------------
    // 8. BUILD INVITE URL
    // ---------------------------------

    const origin =
      new URL(
        request.url
      ).origin;

    const inviteUrl =
      `${origin}/protected/invites/${invite.id}`;

    // ---------------------------------
    // 9. SEND EMAIL
    // ---------------------------------

    const {
      data,
      error,
    } =
      await resend.emails.send({
        from:
          "Boardly <onboarding@resend.dev>",

        to: inviteEmail,

        subject:
          `You've been invited to ${boardName}`,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              max-width: 560px;
              margin: 0 auto;
              padding: 32px;
              color: #0f172a;
            "
          >
            <h1
              style="
                margin-bottom: 16px;
                font-size: 28px;
              "
            >
              Boardly
            </h1>

            <h2
              style="
                margin-bottom: 12px;
                font-size: 22px;
              "
            >
              You've been invited
            </h2>

            <p
              style="
                color: #475569;
                line-height: 1.6;
              "
            >
              You've been invited to collaborate on
              <strong>${escapeHtml(boardName)}</strong>.
            </p>

            <a
              href="${inviteUrl}"
              style="
                display: inline-block;
                margin-top: 20px;
                padding: 12px 20px;
                background: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Accept invite
            </a>

            <p
              style="
                margin-top: 24px;
                color: #94a3b8;
                font-size: 13px;
                line-height: 1.5;
              "
            >
              If you weren't expecting this invitation,
              you can ignore this email.
            </p>
          </div>
        `,
      });

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
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
        error:
          "Unable to send invite.",
      },
      {
        status: 500,
      }
    );
  }
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}