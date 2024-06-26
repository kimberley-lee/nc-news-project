const db = require("../db/connection");

const fetchComments = (article_id, limit = 10, p) => {
  let queryStr = `SELECT * FROM comments 
  WHERE comments.article_id = $1 
  ORDER BY comments.created_at DESC `;
  const queryValues = [article_id];

  if (limit) {
    queryValues.push(limit);
    queryStr += `LIMIT $${queryValues.length} `;
  }
  if (p) {
    const offset = limit * p - limit;
    queryValues.push(offset);
    queryStr += `OFFSET $${queryValues.length};`;
  }

  return db.query(queryStr, queryValues).then(({ rows }) => rows);
};

const insertComment = (article_id, body, author) => {
  return db
    .query(
      `INSERT INTO comments(article_id, body, author) VALUES ($1, $2, $3) RETURNING *;`,
      [article_id, body, author]
    )
    .then(({ rows }) => {
      return rows.length
        ? rows[0]
        : Promise.reject({ status: 404, message: "Not found" });
    });
};

const removeComment = (comment_id) => {
  return db
    .query(`DELETE FROM comments WHERE comment_id = $1 RETURNING *;`, [
      comment_id,
    ])
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, message: "Not found" });
      }
    });
};

const updateCommentByCommentId = (id, votes) => {
  return db
    .query(
      `UPDATE comments SET votes = votes + $1 WHERE comment_id = $2 RETURNING *`,
      [votes, id]
    )
    .then(({ rows }) => {
      return rows.length
        ? rows[0]
        : Promise.reject({ status: 404, message: "Not found" });
    });
};

module.exports = {
  fetchComments,
  insertComment,
  removeComment,
  updateCommentByCommentId,
};
