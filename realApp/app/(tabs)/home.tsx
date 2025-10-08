import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import DailyView from "../../components/DailyView";
import { API_BASE, USE_LOCAL_STORAGE } from '../_layout'


export default function Index() {
  return (
    <DailyView />
  );
}
