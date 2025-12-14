import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * DateTimePicker - A controlled datetime picker component
 * @param {string} value - datetime-local format string (e.g., "2024-01-15T14:30")
 * @param {function} onChange - callback receiving datetime-local format string
 * @param {string} id - optional id for the component
 * @param {boolean} required - optional required attribute
 * @param {Date} minDate - optional minimum selectable date
 */
export function DateTimePicker({ value, onChange, id, required, minDate }) {
  const [open, setOpen] = useState(false)

  // Parse the datetime-local string into date and time parts
  const parseValue = (val) => {
    if (!val) return { date: undefined, time: "" }
    const [datePart, timePart] = val.split("T")
    const date = datePart ? new Date(datePart + "T00:00:00") : undefined
    return { date, time: timePart || "" }
  }

  const { date, time } = parseValue(value)

  // Combine date and time into datetime-local format
  const handleDateChange = (newDate) => {
    if (!newDate) {
      onChange("")
      return
    }
    const dateStr = newDate.toISOString().split("T")[0]
    const timeStr = time || "00:00"
    onChange(`${dateStr}T${timeStr}`)
    setOpen(false)
  }

  const handleTimeChange = (e) => {
    const newTime = e.target.value
    if (!date) {
      // If no date selected yet, use today's date
      const today = new Date().toISOString().split("T")[0]
      onChange(`${today}T${newTime}`)
    } else {
      const dateStr = date.toISOString().split("T")[0]
      onChange(`${dateStr}T${newTime}`)
    }
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id ? `${id}-date` : undefined}
            className="flex-1 justify-between font-normal"
          >
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDownIcon className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-3" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateChange}
            disabled={minDate ? { before: minDate } : undefined}
            className="p-2"
            classNames={{
              weekdays: "flex gap-1",
              week: "flex w-full mt-2 gap-1",
              day: "size-9 p-0 text-center",
              weekday: "size-9 flex items-center justify-center text-muted-foreground text-xs font-normal",
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        id={id ? `${id}-time` : undefined}
        value={time}
        onChange={handleTimeChange}
        required={required}
        className="w-28 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </div>
  )
}
