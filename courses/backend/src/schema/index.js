const typeDefs = `#graphql
    type ArticleRef {
        id: ID!
        title: String!
        content: String!
        course_id: ID
        created_by: ID
        created_at: String!
        is_read: Boolean
    }

    type Course {
        id: ID!
        title: String!
        description: String
        instructor: String
        credits: Int!
        created_at: String!
        article: ArticleRef
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

