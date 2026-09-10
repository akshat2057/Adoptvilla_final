import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./workspace.css";
import { installMockApi } from "./mockApi.js";
import DogAssistant from "./components/DogAssistant.jsx";

installMockApi();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <App />
      <DogAssistant />
    </>
  </React.StrictMode>
);