// components/renderLogin.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginHandler } from "@/controllers/loginController";

export default function RenderLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // État pour l'erreur
  const [loading, setLoading] = useState(false); // État de chargement
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Réinitialiser l'erreur avant chaque soumission
    setLoading(true);

    try {
      // Appel à loginHandler et redirection en cas de succès
      await loginHandler(username, password, router);
    } catch (err) {
      // Gérer l'erreur ici, afficher le message d'erreur spécifique
      setError(err.message || "Une erreur est survenue, veuillez réessayer");
    } finally {
      setLoading(false); // Terminer l'état de chargement
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Affichage de l'erreur si elle existe */}
      {error && <p className="error-message">{error}</p>}

      <style jsx>{`
        .login {
          max-width: 400px;
          margin: 50px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 500;
        }
        input {
          padding: 8px;
          font-size: 14px;
          margin-top: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 10px;
          font-size: 16px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button[disabled] {
          background: #aaa;
          cursor: not-allowed;
        }
        .error-message {
          margin-top: 12px;
          color: red;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
