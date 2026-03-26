// src/api/axios.js

import axios from "axios";

const api = axios.create({
  baseURL: "https://the-adiraa.onrender.com",
  // baseURL: "http://192.168.29.223:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;