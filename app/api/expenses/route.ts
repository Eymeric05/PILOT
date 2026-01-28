import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const supabase = getSupabaseServerClient()
  const url = new URL(req.url)
  const userId = url.searchParams.get("userId")
  const householdId = url.searchParams.get("householdId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  let query = supabase.from("expenses").select("*")
  if (householdId) {
    query = query.or(`user_id.eq.${userId},household_id.eq.${householdId}`)
  } else {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.order("expense_date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] }, { status: 200 })
}

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient()
  const body = await req.json().catch(() => null)

  const expense = body?.expense
  const userId: string | null = body?.userId ?? null
  const householdId: string | null = body?.householdId ?? null
  const isRecurring: boolean = Boolean(body?.isRecurring)

  if (!expense || !userId) {
    return NextResponse.json({ error: "Missing expense or userId" }, { status: 400 })
  }

  const expensesToInsert: any[] = []
  const count = isRecurring ? 12 : 1

  for (let i = 0; i < count; i++) {
    const d = new Date(expense.expenseDate)
    d.setMonth(d.getMonth() + i)
    expensesToInsert.push({
      name: expense.name,
      amount: expense.amount,
      category_id: expense.categoryId,
      paid_by: expense.paidBy,
      is_shared: expense.isShared,
      logo_url: expense.logoUrl,
      description: expense.description || null,
      expense_date: d.toISOString(),
      user_id: userId,
      household_id: householdId,
    })
  }

  const { data, error } = await supabase.from("expenses").insert(expensesToInsert).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] }, { status: 200 })
}

export async function DELETE(req: Request) {
  const supabase = getSupabaseServerClient()
  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

