import React, { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DailyView from "../DailyView";

export default function DayView() {
  const { initialDate } = useLocalSearchParams();

  return (
    <DailyView
      key={initialDate} // 👈 ensures re-mount on param change
      initialDate={new Date(initialDate.toString())}
      notHome={true}
    />
  );
}
