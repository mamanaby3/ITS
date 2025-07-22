import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const useAsyncState = (initialState = null) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFunction, options = {}) => {
    const { 
      showError = true, 
      errorMessage = 'Une erreur est survenue',
      successMessage = null,
      onSuccess = null,
      onError = null 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || errorMessage;
      setError(errorMsg);
      
      if (showError) {
        toast.error(errorMsg);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialState);
    setLoading(false);
    setError(null);
  }, [initialState]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
    setError,
    setLoading
  };
};

export default useAsyncState;