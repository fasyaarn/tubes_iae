const typeDefs = `#graphql
    type User {
        id: ID!
        name: String!
        email: String!
        role: String!
        created_at: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        me: User
    }

    type Mutation {
        login(email: String!, password: String!): AuthPayload!
        register(name: String!, email: String!, password: String!, phone: String, address: String): AuthPayload!
    }
`;

module.exports = typeDefs;
