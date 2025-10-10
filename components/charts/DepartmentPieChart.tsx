
'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DepartmentData {
  departmentName: string
  employeeCount: number
}

interface DepartmentPieChartProps {
  data: DepartmentData[]
}

export default function DepartmentPieChart({ data }: DepartmentPieChartProps) {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
  ]

  const chartData = {
    labels: data.map(item => item.departmentName),
    datasets: [
      {
        label: 'Çalışan Sayısı',
        data: data.map(item => item.employeeCount),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length),
        borderWidth: 2,
        hoverBackgroundColor: colors.slice(0, data.length).map(color => color + '80'),
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} kişi (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Departman Bazında Çalışan Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
