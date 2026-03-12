import React from 'react'

type IconMapping = Record<string, string>
type IconSymbolName = keyof typeof MAPPING

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as const

/**
 * An icon component that uses Lucide React icons for web.
 * Icon `name`s are based on SF Symbols and require manual mapping to Lucide icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  className,
  style,
}: {
  name: IconSymbolName
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}) {
  // Import Lucide icons dynamically
  const LucideIcon = require('lucide-react')[MAPPING[name]] as React.ComponentType<any>
  
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in mapping`)
    return null
  }

  return (
    <LucideIcon
      size={size}
      color={color}
      className={className}
      style={style}
    />
  )
}
