import { supabase } from "@/lib/supabase"

export default async function Home() {
  const { data } = await supabase.from("cleaning_tasks").select("*")
  console.log(data)

  return <div>Supabase Test</div>
}