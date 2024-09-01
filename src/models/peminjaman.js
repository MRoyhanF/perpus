const { DataTypes } = require("sequelize");
const datasource = require("../common/datasource");
const Buku = require('./buku.js')

const Peminjaman = datasource.define(
    "Peminjaman", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nama:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        prodi:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        kode_peminjaman: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nim: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        book_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "buku",
                key: "id",
            },
        },
        tanggal_peminjaman: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        tanggal_pengembalian: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        tanggal_dikembalikan: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'dipinjam', 'selesai', 'gagal'),
            defaultValue: 'pending'
        }
    }, {
        tableName: "peminjaman",
        timestamps: false,
    }
);

Buku.hasMany(Peminjaman, { foreignKey: "book_id", sourceKey: "id" });
Peminjaman.belongsTo(Buku, { foreignKey: "book_id", targetKey: "id" });

module.exports = Peminjaman;