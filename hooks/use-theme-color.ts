/**
 * Learn more about light and dark modes:
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_preferred_color_scheme
 */
import { useColorScheme } from './use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'background' | 'text' | 'icon' | 'border' | 'tab' | 'primary'
) {
  const theme = useColorScheme() ?? 'light'
  const colorFromProps = props[theme]

  if (colorFromProps) {
    return colorFromProps
  } else {
    // Default color mappings for web
    const defaultColors = {
      background: theme === 'light' ? '#ffffff' : '#0f172a',
      text: theme === 'light' ? '#1e293b' : '#f8fafc',
      icon: theme === 'light' ? '#64748b' : '#94a3b8',
      border: theme === 'light' ? '#e2e8f0' : '#374151',
      tab: theme === 'light' ? '#f1f5f9' : '#1f2937',
      primary: theme === 'light' ? '#3b82f6' : '#60a5fa'
    }
    
    return defaultColors[colorName]
  }
}
