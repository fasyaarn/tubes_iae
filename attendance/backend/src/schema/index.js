const typeDefs = `#graphql
    type StudentRef {
        id: ID!
        name: String!
        email: String!
    }

    type CourseRef {
        id: ID!
        title: String!
        instructor: String
    }

    type Attendance {
        id: ID!
        student_id: ID!
        course_id: ID!
        date: String!
        status: String!
        notes: String
        created_at: String!
        student: StudentRef
        course: CourseRef
    }

    type Query {
        attendanceLogs: [Attendance!]!
        studentAttendance(student_id: ID!): [Attendance!]!
    }

    type Mutation {
        markAttendance(student_id: ID!, course_id: ID!, date: String!, status: String, notes: String): Attendance!
        updateAttendanceStatus(id: ID!, status: String!, notes: String): Attendance!
        deleteAttendance(id: ID!): Boolean!
        deleteAttendanceByEnrollment(studentId: ID!, courseId: ID!): Boolean!
    }
`;

module.exports = typeDefs;
