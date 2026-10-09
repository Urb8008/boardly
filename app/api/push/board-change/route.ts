import { NextResponse } from "next/server";
import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import { createClient } from "@/lib/supabase/server";

function getFirebaseApp() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim();

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL?.trim();

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, "\n")
      .trim();

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin environment variables are missing."
    );
  }

  return (
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  );
}

type PushTarget = {
  token: string;
  badge_count: number | string;
  title: string;
  body: string;
};

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

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

    const body =
      await request.json();

    const boardId =
      Number(body.boardId);

    if (
      !boardId ||
      Number.isNaN(boardId)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid board ID.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "get_board_push_targets",
      {
        target_board_id:
          boardId,
      }
    );

    if (error) {
      console.error(
        "Unable to load push targets:",
        error.message
      );

      return NextResponse.json(
        {
          error:
            "Unable to load push targets.",
        },
        {
          status: 500,
        }
      );
    }

    const targets =
      (data || []) as PushTarget[];

    if (targets.length === 0) {
      return NextResponse.json({
        sent: 0,
      });
    }

    const firebaseApp =
      getFirebaseApp();

    const messages =
      targets.map(
        (target) => {
          const badgeCount =
            Math.max(
              1,
              Number(
                target.badge_count
              ) || 1
            );

          return {
            token:
              target.token,
            notification: {
              title:
                target.title,
              body:
                target.body,
            },
            data: {
              boardId:
                String(boardId),
              badgeCount:
                String(badgeCount),
              type:
                "board_change",
            },
            android: {
              priority:
                "high" as const,
              notification: {
                notificationCount:
                  badgeCount,
                priority:
                  "high" as const,
                defaultSound:
                  true,
              },
            },
          };
        }
      );

    const result =
      await getMessaging(
        firebaseApp
      ).sendEach(messages);

    result.responses.forEach(
      (response, index) => {
        if (!response.success) {
          console.error(
            "FCM send failed:",
            targets[index]
              ?.token
              ?.slice(0, 12),
            response.error
              ?.message
          );
        }
      }
    );

    return NextResponse.json({
      sent:
        result.successCount,
      failed:
        result.failureCount,
    });
  } catch (error) {
    console.error(
      "Push route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send push notification.",
      },
      {
        status: 500,
      }
    );
  }
}
