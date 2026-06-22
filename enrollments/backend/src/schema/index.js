const typeDefs = `#graphql
    type StudentRef {
        id: ID!
        name: String!
        email: String!
        phone: String
        address: String
    }

    type CourseRef {
        id: ID!
        title: String!
        description: String
        instructor: String
        credits: Int!
    }

    type Enrollment {
        id: ID!
        student_id: ID!
        course_id: ID!
        status: String!
        enrolled_at: String!
        student: StudentRef
        course: CourseRef
    }

    type Query {
        enrollments: [Enrollment!]!
        studentEnrollments(student_id: ID!): [Enrollment!]!
    }

    type Mutation {
        createEnrollment(student_id: ID!, course_id: ID!, status: String): Enrollment!
        updateEnrollmentStatus(id: ID!, status: String!): Enrollment!
        deleteEnrollment(id: ID!): Boolean!
    }
`;

module.exports = typeDefs;
