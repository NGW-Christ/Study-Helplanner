import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  totalRequests: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    totalRequests: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for custom performance events
    const handlePerformanceEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      setMetrics(prev => {
        const newMetrics = { ...prev };
        
        switch (type) {
          case 'api_response':
            newMetrics.apiResponseTime = data.duration;
            newMetrics.totalRequests++;
            break;
          case 'cache_hit':
            newMetrics.cacheHitRate = (prev.cacheHitRate * 0.9) + (1 * 0.1); // Moving average
            break;
          case 'cache_miss':
            newMetrics.cacheHitRate = (prev.cacheHitRate * 0.9) + (0 * 0.1);
            break;
          case 'api_error':
            newMetrics.errorRate = (prev.errorRate * 0.9) + (1 * 0.1);
            break;
          case 'api_success':
            newMetrics.errorRate = (prev.errorRate * 0.9) + (0 * 0.1);
            break;
        }
        
        return newMetrics;
      });
    };

    window.addEventListener('performance', handlePerformanceEvent as EventListener);
    return () => window.removeEventListener('performance', handlePerformanceEvent as EventListener);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-slate-800 text-white p-2 rounded-lg text-xs opacity-50 hover:opacity-100"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-lg text-xs max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Performance</h3>
        <button onClick={() => setIsVisible(false)} className="text-slate-400">×</button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>API Response:</span>
          <span className={metrics.apiResponseTime > 2000 ? 'text-red-400' : 'text-green-400'}>
            {metrics.apiResponseTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Hit Rate:</span>
          <span className={metrics.cacheHitRate > 0.5 ? 'text-green-400' : 'text-yellow-400'}>
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Error Rate:</span>
          <span className={metrics.errorRate > 0.1 ? 'text-red-400' : 'text-green-400'}>
            {(metrics.errorRate * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Total Requests:</span>
          <span>{metrics.totalRequests}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to emit performance events
export const emitPerformanceEvent = (type: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    window.dispatchEvent(new CustomEvent('performance', {
      detail: { type, data }
    }));
  }
};
