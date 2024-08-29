const User = require("../models/user");
const Kunjungan = require("../models/kunjungan");
const Skripsi = require("../models/skripsi");
const Buku = require("../models/buku");
const Peminjaman = require("../models/peminjaman");

const models = [User, Kunjungan, Skripsi, Buku, Peminjaman];

const dbSync = async(force) => {
    const syncPromises = models.map((model) =>
        model
        .sync({ force })
        .then(() =>
            console.log(`Model ${model.tableName} synchronized with the Database!`)
        )
        .catch((error) =>
            console.error(`ERROR synchronizing Models, message: ${error}`)
        )
    );
    await Promise.all(syncPromises);
};

module.exports = dbSync;