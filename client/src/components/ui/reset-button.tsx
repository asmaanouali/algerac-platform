import { X } from "lucide-react"

interface ResetButtonProps {
  show: boolean
  onClick: () => void
  label: string
}

// "Réinitialiser" link for radio groups, which can't be unselected natively.
export function ResetButton({ show, onClick, label }: ResetButtonProps) {
  if (!show) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <X className="h-3 w-3" />
      {label}
    </button>
  )
}
