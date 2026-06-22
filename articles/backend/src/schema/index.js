const typeDefs = `#graphql
    type Article {
        id: ID!
        title: String!
        content: String!
        course_id: ID
        created_by: ID
        created_at: String!
        is_read: Boolean
    }

    type CanAttendPayload {
        can_attend: Boolean!
        message: String!
        articles_required: Int!
        articles_read: Int!
    }

    type Query {
        articles: [Article!]!
        article(id: ID!): Article
        canAttend(courseId: ID!, studentId: ID!): CanAttendPayload!
    }

    type Mutation {
        createArticle(title: String!, content: String!, course_id: ID!): Article!
        updateArticle(id: ID!, title: String!, content: String!, course_id: ID!): Article!
        deleteArticle(id: ID!): Boolean!
        markAsRead(article_id: ID!): Boolean!
        deleteArticleReadsByEnrollment(studentId: ID!, courseId: ID!): Boolean!
    }
`;

module.exports = typeDefs;
