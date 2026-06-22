const typeDefs = `#graphql
    type Student {
        id: ID!
        name: String!
        email: String!
        phone: String
        address: String
        created_at: String!
    }

    type Query {
        students: [Student!]!
        student(id: ID!): Student
    }

    type Mutation {
        createStudent(name: String!, email: String!, phone: String, address: String): Student!
        createStudentDirect(id: ID!, name: String!, email: String!, phone: String, address: String): Student!
        updateStudent(id: ID!, name: String!, email: String!, phone: String, address: String): Student!
        deleteStudent(id: ID!): Boolean!
    }
`;

module.exports = typeDefs;
