"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import gsap from "gsap"

interface MonthSelectorProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ]

  const titleRef = useRef<HTMLHeadingElement>(null)

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

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { scale: 1.2, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
      )
    }
  }, [monthName, year])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="flex items-center justify-between py-6 mb-6"
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-14 w-14 rounded-2xl glass hover:bg-primary/10 hover:border-primary/30 border-2 border-border/30 transition-all duration-300"
        >
          <motion.div
            whileHover={{ x: -4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.div>
        </Button>
      </motion.div>
      
      <motion.div
        key={`${monthName}-${year}`}
        className="text-center glass rounded-2xl px-8 py-4 border-2 border-border/30"
      >
        <h2 ref={titleRef} className="text-3xl font-bold tracking-tight text-gradient">
          {monthName} {year}
        </h2>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-14 w-14 rounded-2xl glass hover:bg-primary/10 hover:border-primary/30 border-2 border-border/30 transition-all duration-300"
        >
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <ChevronRight className="h-6 w-6" />
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  )
}
