"use client";

import styles from "./style.module.css";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password_1, setPassword_1] = useState("");
  const [password_2, setPassword_2] = useState("");
  const [warning, setWarning] = useState("");

  async function register() {
    const result = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password_1 }),
    });

    const data = await result.json();

    if (!data.success) {
      setWarning(data.message);
      return;
    }

    router.push("/");
  }

  const usernameHint =
    username.length > 0 && (username.length < 4 || username.length > 12)
      ? "Username must be between 4 and 12 characters"
      : "";

  let passwordHint = "";
  if (
    password_1.length > 0 &&
    (password_1.length < 8 || password_1.length > 18)
  ) {
    passwordHint = "Password must be between 8 and 18 characters";
  } else if (password_1 !== password_2 && password_2.length > 0) {
    passwordHint = "Passwords must match";
  }

  return (
    // Note -> I am using ChatGPT to generate the bulk of the html and css, then i manually do the logic and make any changes needed.
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Create Account</h1>
        <p className={styles.loginSubtitle}>Sign up to get started</p>
        <p className={styles.loginWarning}>{warning}</p>
        <p className={styles.loginHint}>{usernameHint || passwordHint}</p>

        <form className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Choose a username"
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
              placeholder="Create a password"
              onChange={(e) => {
                setPassword_1(e.target.value);
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              onChange={(e) => {
                setPassword_2(e.target.value);
              }}
            />
          </div>

          <button
            disabled={
              username.length < 4 ||
              username.length > 12 ||
              password_1.length < 8 ||
              password_1.length > 18 ||
              password_1 !== password_2
            }
            className={styles.loginButton}
            onClick={(e) => {
              e.preventDefault();
              register();
            }}
          >
            Register
          </button>
        </form>

        <p className={styles.loginFooter}>
          Already have an account? <a href="/pages/login">Login</a>
        </p>
      </div>
    </div>
  );
}
