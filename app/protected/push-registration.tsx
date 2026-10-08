"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type Token,
} from "@capacitor/push-notifications";

import { createClient } from "@/lib/supabase/client";

export default function PushRegistration() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const supabase = createClient();
    let mounted = true;

    const saveToken = async (token: Token) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !mounted) {
        return;
      }

      const { error } = await supabase
        .from("push_tokens")
        .upsert(
          {
            user_id: user.id,
            token: token.value,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "token",
          }
        );

      if (error) {
        console.error(
          "Unable to save push token:",
          error.message
        );
      }
    };

    const registerForPush = async () => {
      let permission =
        await PushNotifications.checkPermissions();

      if (permission.receive === "prompt") {
        permission =
          await PushNotifications.requestPermissions();
      }

      if (permission.receive !== "granted") {
        return;
      }

      await PushNotifications.register();
    };

    const setup = async () => {
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener(
        "registration",
        (token) => {
          void saveToken(token);
        }
      );

      await PushNotifications.addListener(
        "registrationError",
        (error) => {
          console.error(
            "Push registration error:",
            error
          );
        }
      );

      await registerForPush();
    };

    void setup();

    return () => {
      mounted = false;
      void PushNotifications.removeAllListeners();
    };
  }, []);

  return null;
}
