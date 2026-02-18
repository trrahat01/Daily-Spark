import React from "react";
import { Redirect, Slot } from "expo-router";
import { IS_USER_APP } from "@/lib/app-variant";

export default function AdminLayout() {
  if (IS_USER_APP) {
    return <Redirect href="/(tabs)" />;
  }

  return <Slot />;
}

