import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PAGE_TITLE } from "./content/site";
import "./index.css";

document.title = PAGE_TITLE;

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element in index.html");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
