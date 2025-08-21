import { useState, useEffect, useRef, useCallback } from "react";

const useMessageTimeout = (initialMessage = '') => {
  const [message, setMessage] = useState(initialMessage);
  const timeoutRef = useRef(null);

  const setMessageWithTimeout = useCallback((newMessage) => {
    setMessage(newMessage);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 3000);
  
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [message, setMessageWithTimeout];
};

export default useMessageTimeout;