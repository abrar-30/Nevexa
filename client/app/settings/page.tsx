"use client";
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { useTheme, ThemeProvider } from "../../context/ThemeContext";

function SettingsPageContent() {
  const { theme, customColor, setTheme, setCustomColor } = useTheme();
  const [language, setLanguage] = useState("en");

  return (
    <>
      <Navbar />
      <div
        style={{
          background: theme === "dark" ? "#222" : "#f9f9f9",
          color: theme === "dark" ? "#f9f9f9" : "#222",
          minHeight: "100vh",
          padding: "2rem",
          transition: "background 0.3s, color 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 400,
            margin: "0 auto",
            background: theme === "dark" ? "#333" : "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "2rem",
          }}
        >
          <h2 style={{ marginBottom: "1.5rem" }}>Theme Settings</h2>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === "light"}
                onChange={() => setTheme("light")}
                style={{ marginRight: 8 }}
              />
              Light Theme
            </label>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === "dark"}
                onChange={() => setTheme("dark")}
                style={{ marginRight: 8 }}
              />
              Dark Theme
            </label>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input
                type="radio"
                name="theme"
                value="custom"
                checked={theme === "custom"}
                onChange={() => setTheme("custom")}
                style={{ marginRight: 8 }}
              />
              Custom Color Scheme
            </label>
          </div>
          {theme === "custom" && (
            <div style={{ marginTop: "1rem" }}>
              <label>
                Pick your primary color:{" "}
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <div
                style={{
                  marginTop: "1rem",
                  height: 40,
                  borderRadius: 8,
                  background: customColor,
                  border: "1px solid #ccc",
                }}
              />
            </div>
          )}

          <h2 style={{ margin: "2rem 0 1rem" }}>Language Selection</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: "1rem",
              background: theme === "dark" ? "#222" : "#fff",
              color: theme === "dark" ? "#f9f9f9" : "#222",
              marginBottom: "1rem",
            }}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ur">Urdu</option>
            <option value="gu">Gujarati</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <ThemeProvider>
      <SettingsPageContent />
    </ThemeProvider>
  );
}