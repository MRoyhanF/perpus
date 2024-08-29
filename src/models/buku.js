const { DataTypes } = require("sequelize");
const datasource = require("../common/datasource");

const Buku = datasource.define(
    "Buku", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        judul: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        gambar: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        deskripsi: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        kategori: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        penulis: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tahun: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        link: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isReady: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: "buku",
        timestamps: false,
    }
);

module.exports = Buku;