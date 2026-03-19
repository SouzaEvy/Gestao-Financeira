"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateRange {
  from: string; // yyyy-MM-dd
  to: string;   // yyyy-MM-dd
}

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  placeholder?: string;
}

const PRESETS = [
  { label: "Este mês", getRange: () => ({ from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(endOfMonth(new Date()), "yyyy-MM-dd") }) },
  { label: "Mês passado", getRange: () => { const d = subMonths(new Date(), 1); return { from: format(startOfMonth(d), "yyyy-MM-dd"), to: format(endOfMonth(d), "yyyy-MM-dd") }; } },
  { label: "Últimos 3 meses", getRange: () => ({ from: format(subMonths(new Date(), 3), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Últimos 6 meses", getRange: () => ({ from: format(subMonths(new Date(), 6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Este ano", getRange: () => ({ from: format(startOfYear(new Date()), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
];

function MiniCalendar({
  year,
  month,
  selected,
  onSelect,
}: {
  year: number;
  month: number; // 0-indexed
  selected: { from: string | null; to: string | null };
  onSelect: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const days: (number | null)[] = [];

  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

  const fmt = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isSelected = (d: number) => fmt(d) === selected.from || fmt(d) === selected.to;
  const isInRange = (d: number) => {
    if (!selected.from || !selected.to) return false;
    const s = fmt(d);
    return s > selected.from && s < selected.to;
  };
  const isToday = (d: number) => fmt(d) === format(new Date(), "yyyy-MM-dd");

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {["D","S","T","Q","Q","S","S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground py-1 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => (
          <div key={i}>
            {d === null ? (
              <div />
            ) : (
              <button
                onClick={() => onSelect(fmt(d))}
                className={cn(
                  "w-full aspect-square text-xs rounded-md flex items-center justify-center transition-all",
                  isSelected(d) && "bg-sky-500 text-white font-semibold",
                  isInRange(d) && !isSelected(d) && "bg-sky-500/20 text-sky-400",
                  isToday(d) && !isSelected(d) && "ring-1 ring-sky-500/50",
                  !isSelected(d) && !isInRange(d) && "hover:bg-accent text-foreground"
                )}
              >
                {d}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DateRangePicker({ value, onChange, placeholder = "Selecionar período" }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const handleDayClick = (date: string) => {
    if (!selecting.from || (selecting.from && selecting.to)) {
      // Start new selection
      setSelecting({ from: date, to: null });
    } else {
      // Complete selection
      const from = selecting.from < date ? selecting.from : date;
      const to = selecting.from < date ? date : selecting.from;
      setSelecting({ from, to });
      onChange({ from, to });
      setOpen(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const displayValue = value
    ? `${format(new Date(value.from + "T12:00:00"), "dd/MM/yyyy")} → ${format(new Date(value.to + "T12:00:00"), "dd/MM/yyyy")}`
    : null;

  const currentMonthLabel = format(new Date(viewYear, viewMonth, 1), "MMMM yyyy", { locale: ptBR });

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSelecting({ from: null, to: null }); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-2 text-sm font-normal",
            value ? "text-foreground border-sky-500/40 bg-sky-500/5" : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[160px]">{displayValue ?? placeholder}</span>
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="ml-1 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-border p-2 space-y-1 min-w-[140px]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">Atalhos</p>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onChange(preset.getRange());
                  setOpen(false);
                }}
                className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-foreground"
              >
                {preset.label}
              </button>
            ))}
            <div className="pt-1 border-t border-border">
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
              >
                Limpar filtro
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium capitalize">{currentMonthLabel}</span>
              <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <MiniCalendar
              year={viewYear}
              month={viewMonth}
              selected={selecting.from ? selecting : { from: value?.from ?? null, to: value?.to ?? null }}
              onSelect={handleDayClick}
            />

            {selecting.from && !selecting.to && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Selecione a data final
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
