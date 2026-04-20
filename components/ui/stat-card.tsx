import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }: {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'purple'
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('p-2 rounded-lg', colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
