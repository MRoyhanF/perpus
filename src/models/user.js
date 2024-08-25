const { Sequelize, DataTypes } = require("sequelize");
const datasource = require("../common/datasource");

const User = datasource.define(
    "User", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: "users",
        timestamps: false,
    }
);

module.exports = User;