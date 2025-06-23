// controllers/loginController.js
const signUrl = "https://zone01normandie.org/api/auth/signin";

export async function loginHandler(username, password, router) {
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(signUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    console.log("Status de la réponse:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API:", errorText);

      // Erreur spécifique pour 403
      if (response.status === 403) {
        throw new Error("Utilisateur inexistant ou mot de passe incorrect");
      }

      // Erreur générique pour d'autres codes d'erreur
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    // Récupération du texte brut
    const rawToken = await response.text();
    console.log("Token brut reçu:", rawToken);

    // Nettoyage minimal
    const jwt = rawToken.trim().replace(/['"]+/g, "");

    // Vérification rapide
    if (jwt.split(".").length !== 3) {
      console.error("Format JWT invalide après nettoyage:", jwt);
      throw new Error("Format de token invalide");
    }

    console.log("Token nettoyé:", jwt.substring(0, 20) + "...");
    localStorage.setItem("jwtToken", jwt);

    // Vérification immédiate dans le storage
    const storedToken = localStorage.getItem("jwtToken");
    console.log(
      "Token stocké:",
      storedToken ? storedToken.substring(0, 20) + "..." : "null"
    );

    router.push("/home");
  } catch (error) {
    console.error("Échec de la connexion:", error);
    throw error; // Renvoie l'erreur pour qu'elle soit capturée dans RenderLogin
  }
}
