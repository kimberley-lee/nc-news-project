const db = require("../db/connection");

const fetchArticles = (
  topic,
  sort_by = "created_at",
  order = "desc",
  limit = 10,
  p
) => {
  let orderType = "DESC";
  if (order === "asc") {
    orderType = "ASC";
  }
  const validSortBys = [
    "created_at",
    "topic",
    "title",
    "author",
    "votes",
    "article_img_url",
    "comment_count",
  ];

  if (!validSortBys.includes(sort_by)) {
    return Promise.reject({ status: 400, message: "Invalid input" });
  }

  let queryVal = [];
  let queryStr = `SELECT
    articles.article_id, 
    articles.author, 
    articles.title, 
    articles.topic, 
    articles.created_at, 
    articles.article_img_url, 
    articles.votes, 
    COUNT(comments.article_id)::INT AS comment_count 
    FROM articles 
    LEFT JOIN comments 
    ON comments.article_id = articles.article_id `;

  if (topic) {
    queryVal.push(topic);
    queryStr += `WHERE topic = $1 `;
  }

  queryStr += `GROUP BY articles.article_id `;
  queryStr += `ORDER BY ${sort_by} ${orderType} `;

  if (limit) {
    queryVal.push(limit);
    queryStr += `LIMIT $${queryVal.length} `;
  }
  if (p) {
    const offset = limit * p - limit;
    queryVal.push(offset);
    queryStr += `OFFSET $${queryVal.length};`;
  }
  return db.query(queryStr, queryVal).then(({ rows }) => rows);
};

const fetchArticleById = (id) => {
  return db
    .query(
      `SELECT
      articles.article_id, 
      articles.author, 
      articles.title, 
      articles.topic, 
      articles.body,
      articles.created_at, 
      articles.article_img_url, 
      articles.votes,
      COUNT(comments.article_id)::INT AS comment_count 
    FROM articles
    LEFT JOIN comments
    ON comments.article_id = articles.article_id
    WHERE articles.article_id = $1
    GROUP BY articles.article_id;`,
      [id]
    )
    .then(({ rows }) => {
      return rows.length
        ? rows[0]
        : Promise.reject({ status: 404, message: "Not found" });
    });
};

const checkArticleIDExists = (article_id) => {
  return db
    .query(`SELECT * FROM articles WHERE article_id = $1;`, [article_id])
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, message: "Article ID not found" });
      }
    });
};

const updateArticleById = (id, votes) => {
  return db
    .query(
      `UPDATE articles SET votes = votes + $1 WHERE article_id = $2 RETURNING *;`,
      [votes, id]
    )
    .then(({ rows }) => {
      return rows.length
        ? rows[0]
        : Promise.reject({ status: 404, message: "Not found" });
    });
};

const insertArticle = (
  author,
  title,
  topic,
  body,
  article_img_url = "https://images.pexels.com/photos/6045017/pexels-photo-6045017.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
) => {
  const validKeys = [author, title, topic, body, article_img_url];
  return db
    .query(
      `INSERT INTO articles(author, title, topic, body, article_img_url) VALUES($1, $2, $3, $4, $5) RETURNING *;`,
      validKeys
    )
    .then(({ rows }) => {
      rows[0].comment_count = 0;
      return rows[0];
    });
};

const getTotalCount = (topic, sort_by, order, limit, p) => {
  let queryStr = `SELECT COUNT(article_id)::INT AS total_count FROM articles `;
  const queryValues = [];
  if (topic) {
    queryStr += `WHERE topic = $1;`;
    queryValues.push(topic);
  }
  return db.query(queryStr, queryValues).then(({ rows }) => {
    return rows[0].total_count;
  });
};

const removeArticleById = (article_id) => {
  return db
    .query(`DELETE FROM articles WHERE article_id = $1 RETURNING *`, [
      article_id,
    ])
    .then(({ rows }) => {
      return !rows.length
        ? Promise.reject({ status: 404, message: "Not found" })
        : rows;
    });
};

module.exports = {
  fetchArticleById,
  fetchArticles,
  checkArticleIDExists,
  updateArticleById,
  insertArticle,
  getTotalCount,
  removeArticleById,
};
