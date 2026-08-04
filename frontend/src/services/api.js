import axios from "axios";

const api = axios.create({
  baseURL: "http://13.126.92.49:8000",
});

export default api;