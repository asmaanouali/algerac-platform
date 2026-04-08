import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// ---------------------------------------------------------------------------
// DatePicker — following https://ui.shadcn.com/docs/components/radix/date-picker
// ---------------------------------------------------------------------------

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  minDate,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon />
          {value ? format(value, "PPP", { locale: fr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={
            minDate
              ? (date) =>
                  date <
                  new Date(
                    minDate.getFullYear(),
                    minDate.getMonth(),
                    minDate.getDate(),
                  )
              : undefined
          }
          initialFocus
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// TimePicker — Select-based time slot picker (shadcn Select composition)
// ---------------------------------------------------------------------------

interface TimePickerProps {
  value?: string // "HH:mm" format
  onChange: (time: string) => void
  placeholder?: string
  className?: string
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Heure",
  className,
}: TimePickerProps) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8) // 08:00 – 18:00
  const minutes = ["00", "15", "30", "45"]

  const timeSlots = hours.flatMap((h) =>
    minutes.map((m) => `${h.toString().padStart(2, "0")}:${m}`),
  )

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[200px]">
        {timeSlots.map((slot) => (
          <SelectItem key={slot} value={slot}>
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ---------------------------------------------------------------------------
// TimeInput — native HTML time input (shadcn Time Picker example style)
// ---------------------------------------------------------------------------

interface TimeInputProps {
  value?: string // "HH:mm" or "HH:mm:ss"
  onChange: (time: string) => void
  label?: string
  className?: string
}

export function TimeInput({
  value,
  onChange,
  label = "Heure",
  className,
}: TimeInputProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && <Label>{label}</Label>}
      <Input
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// StringDatePicker — string-based adapter  ("YYYY-MM-DD" ↔ Date)
// Drop-in replacement for <Input type="date" value={str} onChange={…} />
// ---------------------------------------------------------------------------

interface StringDatePickerProps {
  value?: string // "YYYY-MM-DD"
  onChange: (date: string) => void
  placeholder?: string
  min?: string // "YYYY-MM-DD"
  className?: string
}

export function StringDatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  min,
  className,
}: StringDatePickerProps) {
  const dateValue = value ? new Date(value + "T00:00:00") : undefined
  const minDate = min ? new Date(min + "T00:00:00") : undefined

  return (
    <DatePicker
      value={dateValue}
      onChange={(d) => {
        if (d) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, "0")
          const day = String(d.getDate()).padStart(2, "0")
          onChange(`${y}-${m}-${day}`)
        } else {
          onChange("")
        }
      }}
      placeholder={placeholder}
      minDate={minDate}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
// StringDateTimePicker — string-based adapter ("YYYY-MM-DDTHH:mm" ↔ Date+Time)
// Drop-in replacement for <Input type="datetime-local" value={str} onChange={…} />
// ---------------------------------------------------------------------------

interface StringDateTimePickerProps {
  value?: string // "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  onChange: (datetime: string) => void
  placeholderDate?: string
  placeholderTime?: string
  min?: string
  className?: string
}

export function StringDateTimePicker({
  value,
  onChange,
  placeholderDate = "Sélectionner une date",
  placeholderTime = "Heure",
  min,
  className,
}: StringDateTimePickerProps) {
  const parts = value ? value.split("T") : ["", ""]
  const datePart = parts[0] || ""
  const timePart = (parts[1] || "").slice(0, 5) // "HH:mm"

  const dateValue = datePart ? new Date(datePart + "T00:00:00") : undefined
  const minDate = min ? new Date(min.split("T")[0] + "T00:00:00") : undefined

  const emitChange = (newDate: string, newTime: string) => {
    if (newDate && newTime) {
      onChange(`${newDate}T${newTime}`)
    } else if (newDate) {
      onChange(`${newDate}T${timePart || "09:00"}`)
    } else if (newTime) {
      onChange(`${datePart}T${newTime}`)
    } else {
      onChange("")
    }
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <DatePicker
        value={dateValue}
        onChange={(d) => {
          if (d) {
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            emitChange(`${y}-${m}-${day}`, timePart)
          } else {
            emitChange("", timePart)
          }
        }}
        placeholder={placeholderDate}
        minDate={minDate}
      />
      <TimePicker
        value={timePart || undefined}
        onChange={(t) => emitChange(datePart, t)}
        placeholder={placeholderTime}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MonthYearPicker — two shadcn Select dropdowns for month + year ("YYYY-MM")
// Drop-in replacement for <Input type="month" value={str} onChange={…} />
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface MonthYearPickerProps {
  value?: string // "YYYY-MM"
  onChange: (value: string) => void
  className?: string
}

export function MonthYearPicker({
  value,
  onChange,
  className,
}: MonthYearPickerProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i)

  const selectedMonth = value ? value.split("-")[1] : ""
  const selectedYear = value ? value.split("-")[0] : ""

  const emit = (m: string, y: string) => {
    if (m && y) {
      onChange(`${y}-${m}`)
    }
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={selectedMonth}
        onValueChange={(m) => emit(m, selectedYear || String(currentYear))}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Mois" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MONTH_LABELS.map((label, i) => (
            <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedYear}
        onValueChange={(y) => emit(selectedMonth || "01", y)}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DateTimePicker — convenience composition of DatePicker + TimePicker
// ---------------------------------------------------------------------------

interface DateTimePickerProps {
  dateValue?: Date
  timeValue?: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  minDate?: Date
  datePlaceholder?: string
  timePlaceholder?: string
}

export function DateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate,
  datePlaceholder,
  timePlaceholder,
}: DateTimePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <DatePicker
        value={dateValue}
        onChange={onDateChange}
        placeholder={datePlaceholder}
        minDate={minDate}
      />
      <TimePicker
        value={timeValue}
        onChange={onTimeChange}
        placeholder={timePlaceholder}
      />
    </div>
  )
}
