import { io } from "socket.io-client";

export const socket = io("https://the-adiraa.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
});

// export const socket = io("http://192.168.29.223:5000", {
//   transports: ["websocket"],
//   autoConnect: true,
// });