export type AppVariant = "admin" | "user";

export const APP_VARIANT: AppVariant =
  process.env.EXPO_PUBLIC_APP_VARIANT === "user" ? "user" : "admin";

export const IS_USER_APP = APP_VARIANT === "user";

