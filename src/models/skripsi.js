const { DataTypes } = require("sequelize");
const datasource = require("../common/datasource");

const Skripsi = datasource.define(
    "Skripsi", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        kode: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        judul: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nim: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tahun: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        programStudi: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: "skripsi",
        timestamps: false,
    }
);

module.exports = Skripsi;