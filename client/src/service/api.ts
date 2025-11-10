import axios from "axios";

const api = axios.create({
  baseURL: "/api/",
  headers: {
    "Accept-Language": "en-US",
  },
  withCredentials: true,
});

export default api;
