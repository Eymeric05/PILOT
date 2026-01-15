"use client"

import { useState } from "react"  
import { Expense, Category, UserRole } from "@/types" 
import { formatAmount } from "@/lib/expense-utils"
import { getClearbitLogoUrl, getGoogleFaviconUrl } from "@/lib/logo-utils"
import { Users, X } from "lucide-react"
import Image from "next/image"

function LogoDisplay({ logoUrl, name }: { logoUrl: string | null | undefined; name: string }) {
  const [useFallback, setUseFallback] = useState(false)
  const [useInitial, setUseInitial] = useState(false)

  if (useInitial) {
    return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white font-bold">{name.charAt(0)}</div>
  }

  const imageUrl = useFallback ? getGoogleFaviconUrl(name) : (logoUrl || getClearbitLogoUrl(name))

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted overflow-hidden">
      <Image 
        src={imageUrl} 
        alt={name} 
        width={32} 
        height={32} 
        unoptimized 
        className="object-contain"
        onError={() => useFallback ? setUseInitial(true) : setUseFallback(true)}
      />
    </div>
  )
}

export function ExpenseList({ expenses, categories, currentUser, onDelete }: any) {
  return (
    <div className="space-y-3">
      {expenses.map((expense: any) => (
        <div key={expense.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <LogoDisplay logoUrl={expense.logoUrl} name={expense.name} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{expense.name}</p>
              {expense.isShared && <Users className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">{formatAmount(expense.amount)}</p>
          </div>
          {onDelete && <button onClick={() => onDelete(expense.id)} className="p-1"><X className="h-4 w-4" /></button>}
        </div>
      ))}
    </div>
  )
}