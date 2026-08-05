import axios from "axios";

const api = axios.create({
  baseURL: "http://65.0.168.30:8000",
});

export default api;