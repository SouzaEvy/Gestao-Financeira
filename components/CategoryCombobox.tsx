"use client";

import React, { useState, useMemo, useRef } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn, getCategoriesGrouped, getCategoryInfo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { CustomCategory } from "@/types";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  customCategories?: CustomCategory[];
  placeholder?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  customCategories = [],
  placeholder = "Selecionar categoria",
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const grouped = getCategoriesGrouped();

  // Flat list for searching
  const allItems = useMemo(() => {
    const custom = customCategories.map((c) => ({
      key: c.name,
      pt: c.name_pt,
      emoji: c.emoji,
      color: c.color,
      group: "⭐ Minhas categorias",
      groupKey: "custom",
    }));
    const builtin = grouped.flatMap((g) =>
      g.items.map((item) => ({
        key: item.key,
        pt: item.pt,
        emoji: item.emoji,
        color: item.color,
        group: `${g.groupEmoji} ${g.groupPt}`,
        groupKey: g.groupKey,
      }))
    );
    return [...custom, ...builtin];
  }, [customCategories, grouped]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allItems.filter((item) => {
      const pt = item.pt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const grp = item.group.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return pt.includes(q) || grp.includes(q) || item.key.toLowerCase().includes(q);
    });
  }, [allItems, search]);

  // Group the filtered results
  const filteredGrouped = useMemo(() => {
    const groups: Record<string, { groupLabel: string; items: typeof filtered }> = {};
    for (const item of filtered) {
      if (!groups[item.groupKey]) {
        groups[item.groupKey] = { groupLabel: item.group, items: [] };
      }
      groups[item.groupKey].items.push(item);
    }
    return Object.values(groups);
  }, [filtered]);

  const selectedItem = allItems.find((i) => i.key === value);
  const selectedInfo = selectedItem ?? getCategoryInfo(value);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none">
              {selectedItem?.emoji ?? ("emoji" in selectedInfo ? selectedInfo.emoji : "📦")}
            </span>
            <span className="truncate">
              {selectedItem?.pt ?? ("pt" in selectedInfo ? selectedInfo.pt : placeholder)}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
          className="w-[340px] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Pesquisar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div
          ref={scrollRef}
          className="max-h-72 overflow-y-auto py-1"
          style={{ overscrollBehavior: "contain" }}
          onWheel={(e) => {
            // Prevent Dialog from eating the wheel event
            e.stopPropagation();
            const el = scrollRef.current;
            if (!el) return;
            el.scrollTop += e.deltaY;
          }}
        >
          {filteredGrouped.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria encontrada
            </div>
          ) : (
            filteredGrouped.map((group, gi) => (
              <div key={group.groupLabel}>
                {gi > 0 && <Separator className="my-1" />}
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.groupLabel}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      onChange(item.key);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                      value === item.key && "bg-sky-500/10 text-sky-400"
                    )}
                  >
                    <span className="text-base leading-none w-5 text-center">{item.emoji}</span>
                    <span className="flex-1 truncate">{item.pt}</span>
                    {value === item.key && (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
