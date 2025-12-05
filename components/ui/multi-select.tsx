'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { Badge } from './badge'
import { Checkbox } from './checkbox'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: { id: number | string; name: string }[]
  selected: (number | string)[]
  onSelectionChange: (selected: (number | string)[]) => void
  placeholder?: string
  allLabel?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = 'Seçiniz...',
  allLabel = 'Tümü',
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (id: number | string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onSelectionChange(newSelected)
  }

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(options.map((opt) => opt.id))
    }
  }

  const handleClear = () => {
    onSelectionChange([])
  }

  const selectedOptions = options.filter((opt) => selected.includes(opt.id))
  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === options.length
      ? allLabel
      : selected.length === 1
      ? selectedOptions[0]?.name
      : `${selected.length} seçili`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 !bg-white" align="start">
        <div className="max-h-60 overflow-auto p-2">
          {/* Select All / Clear */}
          <div className="flex items-center justify-between p-2 border-b mb-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selected.length === options.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </button>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Options */}
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.id)
              return (
                <div
                  key={option.id}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleToggle(option.id)}
                >
                  <Checkbox checked={isSelected} />
                  <span className="text-sm flex-1">{option.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected badges */}
        {selected.length > 0 && selected.length < options.length && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((opt) => (
                <Badge
                  key={opt.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {opt.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggle(opt.id)
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

