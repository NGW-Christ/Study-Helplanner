import { type HTMLAttributes } from 'react';

export type ThemedViewProps = HTMLAttributes<HTMLDivElement> & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, className, ...otherProps }: ThemedViewProps) {
  const backgroundColor = lightColor || 'bg-white'
  const darkBackgroundColor = darkColor || 'bg-slate-900'
  
  return (
    <div 
      className={`${backgroundColor} dark:${darkBackgroundColor} ${className || ''}`}
      style={style}
      {...otherProps} 
    />
  )
}
