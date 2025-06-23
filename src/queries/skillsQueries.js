export const GET_SKILLS = `
    query GetSkills {
        user {
            transactions(
            where: {
                _and: [
                { type: { _neq: "xp" } },
                { type: { _neq: "level" } },
                { type: { _neq: "up" } },
                { type: { _neq: "down" } }
                ]
            }
            order_by: { createdAt: asc }
            ) {
                type
                amount
            }
        }
    }
`;
