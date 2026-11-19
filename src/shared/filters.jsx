import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button, Calendar, DropdownMenu, Popover } from "@hc1com/design-system";

/** Multi-select filter: a button that opens checkbox items, plus Select all. */
export function MultiFilter({ label, options, selected, onChange }) {
  const all = selected.length === options.length;
  const summary = all ? "All" : selected.length === 0 ? "None" : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="sm">
          {label}: {summary} <ChevronDown />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content size="md" align="start">
        <DropdownMenu.CheckboxItem checked={all} onCheckedChange={() => onChange(all ? [] : options)} onSelect={e => e.preventDefault()}>
          Select all
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.Separator />
        {options.map(o => (
          <DropdownMenu.CheckboxItem
            key={o}
            checked={selected.includes(o)}
            onCheckedChange={() => onChange(selected.includes(o) ? selected.filter(v => v !== o) : [...selected, o])}
            onSelect={e => e.preventDefault()}
          >
            {o}
          </DropdownMenu.CheckboxItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

const shortDate = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Date range filter: a button like the other filters that opens a range calendar. */
export function DateRangeFilter({ label, shortLabel, from, to, defaultMonth, onChange }) {
  const [open, setOpen] = useState(false);
  const summary = from && to ? `${shortDate(from)} – ${shortDate(to)}` : from ? `From ${shortDate(from)}` : to ? `Until ${shortDate(to)}` : "Any";
  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom">
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm">
          {from || to ? shortLabel ?? label : label}: {summary} <ChevronDown />
        </Button>
      </Popover.Trigger>
      <Popover.Content ariaLabel={label}>
        <div className="flex flex-col gap-12">
          <Calendar
            mode="range"
            defaultMonth={from ?? defaultMonth}
            selected={{ from, to }}
            onSelect={r => onChange(r?.from, r?.to)}
          />
          {(from || to) && (
            <Button variant="ghost" size="sm" className="self-end" onClick={() => { onChange(undefined, undefined); setOpen(false); }}>
              Clear dates
            </Button>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}


export const toIso = d => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
