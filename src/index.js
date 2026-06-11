// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/design-system.css";
import App from "./App.js";
import { ThemeProvider } from "./context/ThemeContext.js";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("BlockCred app error:", error, errorInfo);
  }

  reloadApp = () => {
    window.location.reload();
  };

  goHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen d-flex align-items-center justify-content-center px-4"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(45,62,171,0.14), transparent 34%), linear-gradient(135deg, #F8F9FC 0%, #EEF2F7 100%)",
          }}
        >
          <div
            className="bg-white border shadow-lg rounded-4 p-4 p-md-5 text-center"
            style={{
              width: "100%",
              maxWidth: 520,
            }}
          >
            <div
              className="rounded-4 d-inline-flex align-items-center justify-content-center mb-4"
              style={{
                width: 72,
                height: 72,
                background: "linear-gradient(135deg, #2D3EAB, #00B4D8)",
                color: "#fff",
                boxShadow: "0 14px 30px rgba(45,62,171,0.25)",
                fontWeight: 900,
                fontSize: "1.6rem",
              }}
            >
              BC
            </div>

            <h1
              className="fw-bold mb-3"
              style={{
                color: "#0F1B3C",
                letterSpacing: 0,
              }}
            >
              Something went wrong
            </h1>

            <p className="text-muted mb-4">
              BlockCred could not load this page correctly. You can refresh the
              app or return to the home page.
            </p>

            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 fw-bold"
                onClick={this.reloadApp}
              >
                Reload App
              </button>

              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-4 fw-bold"
                onClick={this.goHome}
              >
                Go Home
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre
                className="text-start mt-4 p-3 rounded-4 bg-light border small text-danger"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure public/index.html has <div id=\"root\"></div>.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <AppErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </AppErrorBoundary>
);
