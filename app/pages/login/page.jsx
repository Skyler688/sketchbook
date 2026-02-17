"use client";

import styles from "./style.module.css";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");

  async function login() {
    const result = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });

    const data = await result.json();

    console.log(data);

    if (!data.success) {
      setWarning(data.message);
      return;
    }

    router.push("/");
  }

  return (
    // Note -> I am using ChatGPT to generate the bulk of the html and css, then i manually do the logic and make any changes needed.
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Welcome Back</h1>
        <p className={styles.loginSubtitle}>Sign in to your account</p>
        <p className={styles.loginWarning}>{warning}</p>

        <form className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>

          <button
            disabled={
              username.length < 4 ||
              username.length > 12 ||
              password.length < 8 ||
              password.length > 18
            }
            className={styles.loginButton}
            onClick={(e) => {
              e.preventDefault();
              login();
            }}
          >
            Sign In
          </button>
        </form>

        <p className={styles.loginFooter}>
          Don’t have an account? <a href="/pages/register">Register</a>
        </p>
      </div>
    </div>
  );
}
