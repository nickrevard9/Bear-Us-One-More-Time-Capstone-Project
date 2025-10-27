import React from 'react';
import { useRouter }  from "expo-router"
import { ToggleGroup as ToggleGroupBase, Text, ToggleGroupSingleProps, styled } from 'tamagui'
import { Edit3, Plus, CalendarDays, Calendar1, Sun } from "@tamagui/lucide-icons"


const Item = styled(
  ToggleGroupBase.Item,
  {
    variants: {
      active: {
        false: {},
        true: {
          backgroundColor: '$accent10',
          color: '$color1',
        },
      },
    },
  },
)

type ModeToggleProps = {
  mode: "day" | "month";
};

export default function ModeToggle ({ mode }: ModeToggleProps) {
    const router = useRouter();

    return (
        <ToggleGroupBase orientation="horizontal" type="single" unstyled justify={"center"} disableDeactivation={true} size="$7" defaultValue="day">
                <Item value="day" aria-label="day" active={mode == "day"} disabled={mode == "day"} onPress={() => router.back()}>
                    <Text>Day</Text>
                </Item>
                <Item value="month" aria-label="month" active={mode == "month"} disabled={mode == "month"} onPress={() => router.push('/home/calendar')}>
                    <Text>Month</Text>
                </Item>
        </ToggleGroupBase>
    );
};