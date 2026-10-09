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
    let clearing = false;

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

    const resetNotificationCount = async () => {
      if (clearing) {
        return;
      }

      clearing = true;

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && user) {
          const { error } = await supabase
            .from("notifications")
            .update({
              is_read: true,
            })
            .eq("user_id", user.id)
            .eq("is_read", false);

          if (error) {
            console.error(
              "Unable to reset notification count:",
              error.message
            );
          }
        }

        await PushNotifications.removeAllDeliveredNotifications();
      } catch (error) {
        console.error(
          "Unable to clear delivered notifications:",
          error
        );
      } finally {
        clearing = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void resetNotificationCount();
      }
    };

    const handlePageHide = () => {
      void resetNotificationCount();
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

      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.addEventListener(
        "pagehide",
        handlePageHide
      );

      await registerForPush();
    };

    void setup();

    return () => {
      mounted = false;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "pagehide",
        handlePageHide
      );

      void PushNotifications.removeAllListeners();
    };
  }, []);

  return null;
}
