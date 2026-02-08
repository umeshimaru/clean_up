import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: appUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!appUser?.is_admin) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}
