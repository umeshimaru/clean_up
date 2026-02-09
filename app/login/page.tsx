import LoginCard from '@/components/LoginCard'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoginCard />
    </main>
  )
}
