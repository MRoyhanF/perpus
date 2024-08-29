const { DataTypes } = require("sequelize");
const datasource = require("../common/datasource");

const Kunjungan = datasource.define(
    "Kunjungan", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nim: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        programStudi: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        tableName: "kunjungan",
        timestamps: false,
    }
);

module.exports = Kunjungan;