export const GET_PROFILE_INFOS = `
  query GetUserInfos {
    user {
      id
      firstName
      lastName
      email
      auditRatio
      xps {
      amount
      }
    }
  }
`;
