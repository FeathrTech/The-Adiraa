import { useEffect } from "react";
import { socket } from "../utils/socket";

export const useRealtime = (event, callback) => {
  useEffect(() => {
    if (!event || !callback) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
};

// 🔥 optional helper for emit
useRealtime.emit = (event, data) => {
  socket.emit(event, data);
};
