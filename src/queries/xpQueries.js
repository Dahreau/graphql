export const GET_XP_GAINS = `
  query GetUserDetailedXp {
    transaction(
      where: { type: { _eq: "xp" }, path: { _niregex: "/(piscine-[^/]+/)" } }
      order_by: { createdAt: desc }
    ) {
      id
      type
      amount
      createdAt
      path
      objectId
    }
  }
`;

export const GET_XP = `	
  query GetUserXp {
    user {
    audit
      xps
    }
  }
`;
