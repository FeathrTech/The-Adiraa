import { io } from "socket.io-client";

export const socket = io("http://192.168.29.223:5000", {
  transports: ["websocket"],
  autoConnect: true,
});
