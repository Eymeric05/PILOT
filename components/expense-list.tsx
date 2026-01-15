"use client"

import { useState, useEffect } from "react"  
import { Expense, Category, UserRole } from "@/types" 
import { formatAmount } from "@/lib/expense-utils"
import { getClearbitLogoUrl, getGoogleFaviconUrl } from "@/lib/logo-utils"
import { Users, X } from "lucide-react"
import Image from "next/image"

function LogoDisplay({ logoUrl, name }: { logoUrl: string | null | undefined; name: string }) {
  const [useFallback, setUseFallback] = useState(false)
  const [useInitial, setUseInitial] = useState(false)

  if (useInitial) {
    return <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white font-semibold text-sm">{name.charAt(0)}</div>
  }

  const imageUrl = useFallback ? getGoogleFaviconUrl(name) : (logoUrl || getClearbitLogoUrl(name))

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden border border-subtle-30">
      <Image 
        src={imageUrl} 
        alt={name} 
        width={40} 
        height={40} 
        unoptimized 
        className="object-contain"
        onError={() => useFallback ? setUseInitial(true) : setUseFallback(true)}
      />
    </div>
  )
}

export function ExpenseList({ expenses, categories, currentUser, onDelete }: any) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-2.5">
      {expenses.map((expense: any, index: number) => (
        <div 
          key={expense.id} 
          className="flex items-center gap-3 rounded-2xl bg-card border border-subtle p-4 h-20
                     transition-all duration-200 ease-out shadow-none
                     hover:bg-card-hover hover:-translate-y-0.5"
          style={{
            animation: mounted ? `fade-in 0.3s ease-out ${index * 50}ms both, slide-in-from-bottom 0.3s ease-out ${index * 50}ms both` : 'none',
          }}
        >
          <LogoDisplay logoUrl={expense.logoUrl} name={expense.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium tracking-tight truncate">{expense.name}</p>
              {expense.isShared && <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </div>
            {expense.categoryId && categories.find((c: Category) => c.id === expense.categoryId) && (
              <p className="text-xs text-muted-foreground tracking-tight mt-0.5">
                {categories.find((c: Category) => c.id === expense.categoryId)?.icon} {categories.find((c: Category) => c.id === expense.categoryId)?.name}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold tracking-tight">{formatAmount(expense.amount)}</p>
          </div>
          {onDelete && (
            <button 
              onClick={() => onDelete(expense.id)} 
              className="p-1.5 rounded-lg hover:bg-muted transition-colors duration-150 shrink-0"
              aria-label="Supprimer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}