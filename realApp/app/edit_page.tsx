import React, { useEffect, useState } from "react";
import Reporter from "./Reporter"
import { useLocalSearchParams } from "expo-router";


export default function EditPage() {
    const { log_id } = useLocalSearchParams();
  return (
    <Reporter log_id={parseInt(log_id)} key={log_id} />
  );
}
