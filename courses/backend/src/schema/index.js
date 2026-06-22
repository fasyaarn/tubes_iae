const typeDefs = `#graphql
    type Course {
        id: ID!
        title: String!
        description: String
        instructor: String
        credits: Int!
        created_at: String!
    }

    type Query {
        courses: [Course!]!
        course(id: ID!): Course
    }

    type Mutation {
        createCourse(title: String!, description: String, instructor: String, credits: Int): Course!
        updateCourse(id: ID!, title: String!, description: String, instructor: String, credits: Int): Course!
        deleteCourse(id: ID!): Boolean!
    }
`;

module.exports = typeDefs;
