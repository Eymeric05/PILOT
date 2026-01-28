import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data && data.length > 0) {
    return NextResponse.json({ data }, { status: 200 })
  }

  // Seed a default category if table is empty
  const { data: inserted, error: insertError } = await supabase
    .from("categories")
    .insert({ name: "Divers", icon: "📦" })
    .select()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ data: inserted || [] }, { status: 200 })
}

