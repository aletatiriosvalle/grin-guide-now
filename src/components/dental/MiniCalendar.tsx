import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MiniCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  hasAppointment,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: Date;
  onSelect: (d: Date) => void;
  hasAppointment: (d: Date) => boolean;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const weekHeaders = ["D", "L", "M", "X", "J", "V", "S"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: es })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="size-8 grid place-items-center rounded-md hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="size-8 grid place-items-center rounded-md hover:bg-accent"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
        {weekHeaders.map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const isSelected = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          const dot = hasAppointment(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className={cn(
                "relative aspect-square rounded-lg text-sm flex items-center justify-center transition-all",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-soft)]",
                isToday && !isSelected && "ring-1 ring-primary/40",
              )}
            >
              {format(d, "d")}
              {dot && !isSelected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
