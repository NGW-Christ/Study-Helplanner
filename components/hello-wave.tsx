
export function HelloWave() {
  return (
    <span 
      className="text-2xl leading-8 -mt-1 inline-block"
      style={{
        animation: 'wave 1.2s ease-in-out infinite',
      }}
    >
      👋
    </span>
  )
}

// Add this to your CSS file:
/*
@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(25deg);
  }
  75% {
    transform: rotate(-25deg);
  }
}
*/
