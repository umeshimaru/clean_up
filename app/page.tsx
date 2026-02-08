import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            アドネスお掃除管理アプリ
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600">
            ようこそ！掃除管理機能は今後実装予定です。
          </p>
        </div>
      </div>
    </main>
  )
}
