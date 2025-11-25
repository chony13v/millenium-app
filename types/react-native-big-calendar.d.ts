declare module "react-native-big-calendar" {
  import * as React from "react";
  import { ViewStyle } from "react-native";

  export type Event = {
    title: string;
    start: Date;
    end: Date;
    id?: string;
    color?: string;
  };

  export interface CalendarProps {
    events: Event[];
    height: number;
    mode?: "day" | "3days" | "week" | "month";
    locale?: string;
    weekStartsOn?: number;
    swipeEnabled?: boolean;
    onPressEvent?: (event: Event) => void;
    onPressCell?: (date: Date) => void;
    eventCellStyle?:
      | ViewStyle
      | ((event: Event) => ViewStyle | undefined | null);
  }

  export const Calendar: React.FC<CalendarProps>;
}