export const GET_FULL_STATS = `
query GetFullStats {
  user {
    id
    login
    email
    auditRatio
    createdAt
    public {
      firstName
      lastName
      profile
    }
    transactions(
      where: { 
        type: { _eq: "xp" }, 
        eventId: { _eq: 303 }
      }, 
      order_by: { createdAt: asc }
    ) {
      id
      type
      amount
      objectId
      createdAt
      path
      object {
        name
        type
      }
    }
    XpTotal: transactions_aggregate(
      where: {
        type: { _eq: "xp" },
        eventId: { _eq: 303 }
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
    level: transactions(
      where: {
        _and: [
          { type: { _eq: "level" } },
          { eventId: { _eq: 303 } }
        ]
      },
      order_by: { amount: desc },
      limit: 1
    ) {
      amount
    }
    skills: transactions(
      where: {
        _and: [
          { type: { _neq: "xp" } },
          { type: { _neq: "level" } },
          { type: { _neq: "up" } },
          { type: { _neq: "down" } }
        ]
      },
      order_by: { createdAt: asc }
    ) {
      type
      amount
      object {
        type
      }
    }
  }
}
`;
