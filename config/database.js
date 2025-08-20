// config/database.js
const { Sequelize } = require('sequelize');
const dbConfig = require('./dbConfig');

// Initialize a new Sequelize instance using the values from dbconfig.js
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: true, // Set to true if you want to see SQL queries in the console
  }
);

// Optional: Test the database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = sequelize;
