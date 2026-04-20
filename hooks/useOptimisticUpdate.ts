import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  onMutate: (data: T) => Promise<void>;
  onError: (error: Error, originalData: T) => void;
  onSuccess: () => void;
}

export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeUpdate = useCallback(async (
    newData: T,
    options: OptimisticUpdateOptions<T>
  ) => {
    const previousData = data;
    setError(null);
    
    // Optimistic update
    setData(newData);
    setIsPending(true);

    try {
      await options.onMutate(newData);
      options.onSuccess();
    } catch (err) {
      // Rollback on error
      setData(previousData);
      setError(err as Error);
      options.onError(err as Error, previousData);
    } finally {
      setIsPending(false);
    }
  }, [data]);

  return {
    data,
    isPending,
    error,
    executeUpdate,
    setData
  };
}
