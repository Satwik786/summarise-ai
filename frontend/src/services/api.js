import axios from "axios";

const api = axios.create({
  baseURL: "http://65.2.59.35:8000",
});

export default api;