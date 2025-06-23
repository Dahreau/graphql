export const GET_LEVEL = `
  query GetUserLevel {
  user {
        transactions(
        where: { _and: [
            { type: { _eq: "level" } },
            { eventId: { _eq: 303 } }
        ] }
        order_by: { amount: desc }
        limit: 1
        ) {
        amount
        }
    }
}
`;
