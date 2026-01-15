"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSelectorProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    onDateChange(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    onDateChange(newDate)
  }

  const monthName = monthNames[currentDate.getMonth()]
  const year = currentDate.getFullYear()

  return (
    <div className="flex items-center justify-between py-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousMonth}
        className="h-11 w-11"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight">
          {monthName} {year}
        </h2>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        className="h-11 w-11"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
