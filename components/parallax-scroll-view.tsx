import { type PropsWithChildren, ReactElement, useEffect, useRef, useState } from 'react';

const HEADER_HEIGHT = 250

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollY(scrollRef.current.scrollTop)
      }
    }

    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const headerTransform = () => {
    const translateY = Math.max(0, Math.min(scrollY, HEADER_HEIGHT))
    const scale = Math.max(0.75, Math.min(1, 1 + (scrollY / HEADER_HEIGHT)))
    
    return {
      transform: `translateY(${translateY * 0.5}px) scale(${scale})`,
    }
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-slate-900"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div
        className="sticky top-0 z-10 w-full h-[250px] overflow-hidden"
        style={{
          ...headerTransform(),
          backgroundColor: headerBackgroundColor.light,
        }}
      >
        {headerImage}
      </div>
      <div className="flex-1 p-8 gap-4 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
