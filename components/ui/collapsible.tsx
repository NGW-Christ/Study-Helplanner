import { PropsWithChildren, useState } from 'react'
import { ThemedText } from '../themed-text'
import { IconSymbol } from './icon-symbol'

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full">
      <button
        className="flex items-center gap-1.5 w-full p-2 text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setIsOpen((value) => !value)}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </button>
      {isOpen && (
        <div className="mt-1.5 ml-6">
          {children}
        </div>
      )}
    </div>
  )
}
