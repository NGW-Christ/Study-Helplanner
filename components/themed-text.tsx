import { type HTMLAttributes } from 'react';

export type ThemedTextProps = HTMLAttributes<HTMLSpanElement> & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

export function ThemedText({
  style,
  lightColor,
  darkColor: propDarkColor,
  type = 'default',
  as: Component = 'span',
  className,
  ...rest
}: ThemedTextProps) {
  const color = lightColor || 'text-slate-900'
  const darkColor = propDarkColor || 'text-slate-100'

  const getTypographyClasses = () => {
    switch (type) {
      case 'title':
        return 'text-2xl font-bold leading-8'
      case 'defaultSemiBold':
        return 'text-base font-semibold leading-6'
      case 'subtitle':
        return 'text-xl font-bold leading-6'
      case 'link':
        return 'text-base leading-7 text-blue-500 hover:text-blue-600'
      default:
        return 'text-base leading-6'
    }
  }

  return (
    <Component
      className={`${color} dark:${darkColor} ${getTypographyClasses()} ${className || ''}`}
      style={style}
      {...rest}
    />
  )
}
