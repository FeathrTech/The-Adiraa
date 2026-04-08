import { io } from "socket.io-client";

export const socket = io("https://the-adiraa.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
});