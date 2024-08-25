const { Sequelize } = require("sequelize");
const environment = require("./environment");

const datasource = new Sequelize(environment.database_url);

module.exports = datasource;