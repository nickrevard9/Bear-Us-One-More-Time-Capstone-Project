import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import DailyView from "@/app/DailyView";
import { API_BASE, USE_LOCAL_STORAGE } from '../../_layout'
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Index() {
  const { initialDate } = useLocalSearchParams() || null;
  return (
    <DailyView key={initialDate} // 👈 ensures re-mount on param change
      initialDate={initialDate? new Date(initialDate.toString()) : new Date()}/>
  );
}
