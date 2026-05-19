"use client"

import { X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface IndustrialModalHeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  onClose: () => void
}

export function IndustrialModalHeader({ title, subtitle, icon: Icon, onClose }: IndustrialModalHeaderProps) {
  return (
    <header className="p-6 border-b border-border flex justify-between items-center bg-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary border border-primary/20">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest leading-none text-foreground italic">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1.5">{subtitle}</p>
          )}
        </div>
      </div>
      <button 
        onClick={onClose} 
        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground outline-none"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </header>
  )
}
