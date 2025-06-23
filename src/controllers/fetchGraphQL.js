export const fetchGraphQL = async (query) => {
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    throw new Error("Token JWT manquant");
  }

  try {
    const response = await fetch(
      "https://zone01normandie.org/api/graphql-engine/v1/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      }
    );

    // Vérification du statut HTTP
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("GraphQL error:", error);
    return {
      errors: [{ message: error.message }],
    };
  }
};
