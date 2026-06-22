const { dbAll, dbGet, dbRun } = require('../config/db');
const { GraphQLError } = require('graphql');

const resolvers = {
    Article: {
        is_read: async (parent, _, context) => {
            if (!context.user || context.user.role !== 'student') return null;
            const sid = context.user.student_id;
            const read = await dbGet(
                'SELECT id FROM article_reads WHERE article_id = ? AND student_id = ?',
                [parent.id, sid]
            );
            return !!read;
        }
    },
    Query: {
        articles: async () => {
            return await dbAll('SELECT * FROM articles ORDER BY created_at DESC');
        },
        article: async (_, { id }, context) => {
            const article = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
            if (!article) {
                throw new GraphQLError('Article not found', { extensions: { code: 'NOT_FOUND' } });
            }
            return article;
        },
        canAttend: async (_, { courseId, studentId }) => {
            // Find articles associated with this course
            const articles = await dbAll('SELECT id FROM articles WHERE course_id = ?', [courseId]);
            if (articles.length === 0) {
                return {
                    can_attend: true,
                    message: 'No articles required for this course.',
                    articles_required: 0,
                    articles_read: 0
                };
            }

            const articleIds = articles.map(a => a.id);
            // Count how many of those articles the student has read
            // SQLite doesn't natively support array params out-of-the-box in a single ? binding, so build placeholder string
            const placeholders = articleIds.map(() => '?').join(',');
            const reads = await dbAll(
                `SELECT article_id FROM article_reads WHERE student_id = ? AND article_id IN (${placeholders})`,
                [studentId, ...articleIds]
            );

            const can_attend = reads.length >= articleIds.length;
            return {
                can_attend,
                message: can_attend
                    ? 'You have read all required articles.'
                    : 'Please read all required articles for this course before marking attendance.',
                articles_required: articleIds.length,
                articles_read: reads.length
            };
        }
    },
    Mutation: {
        createArticle: async (_, { title, content, course_id }, context) => {
            if (!context.user || context.user.role !== 'admin') {
                throw new GraphQLError('Admin authorization required', { extensions: { code: 'FORBIDDEN' } });
            }
            const created_by = context.user.id;
            const result = await dbRun(
                'INSERT INTO articles (title, content, course_id, created_by) VALUES (?, ?, ?, ?)',
                [title, content, course_id, created_by]
            );
            return await dbGet('SELECT * FROM articles WHERE id = ?', [result.lastID]);
        },
        updateArticle: async (_, { id, title, content, course_id }, context) => {
            if (!context.user || context.user.role !== 'admin') {
                throw new GraphQLError('Admin authorization required', { extensions: { code: 'FORBIDDEN' } });
            }
            const check = await dbGet('SELECT id FROM articles WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Article not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await dbRun(
                'UPDATE articles SET title = ?, content = ?, course_id = ? WHERE id = ?',
                [title, content, course_id, id]
            );
            return await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
        },
        deleteArticle: async (_, { id }, context) => {
            if (!context.user || context.user.role !== 'admin') {
                throw new GraphQLError('Admin authorization required', { extensions: { code: 'FORBIDDEN' } });
            }
            const check = await dbGet('SELECT id FROM articles WHERE id = ?', [id]);
            if (!check) {
                throw new GraphQLError('Article not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await dbRun('DELETE FROM articles WHERE id = ?', [id]);
            return true;
        },
        markAsRead: async (_, { article_id }, context) => {
            if (!context.user || context.user.role !== 'student') {
                throw new GraphQLError('Only students can mark articles as read', { extensions: { code: 'FORBIDDEN' } });
            }
            const sid = context.user.student_id;
            const article = await dbGet('SELECT id FROM articles WHERE id = ?', [article_id]);
            if (!article) {
                throw new GraphQLError('Article not found', { extensions: { code: 'NOT_FOUND' } });
            }

            try {
                await dbRun(
                    'INSERT OR IGNORE INTO article_reads (article_id, student_id) VALUES (?, ?)',
                    [article_id, sid]
                );
                return true;
            } catch (err) {
                throw new GraphQLError(err.message);
            }
        },
        deleteArticleReadsByEnrollment: async (_, { studentId, courseId }) => {
            // Find all articles associated with the course
            const articles = await dbAll('SELECT id FROM articles WHERE course_id = ?', [courseId]);
            if (articles.length > 0) {
                const articleIds = articles.map(a => a.id);
                const placeholders = articleIds.map(() => '?').join(',');
                await dbRun(
                    `DELETE FROM article_reads WHERE student_id = ? AND article_id IN (${placeholders})`,
                    [studentId, ...articleIds]
                );
            }
            return true;
        }
    }
};

module.exports = resolvers;
