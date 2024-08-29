const schedule = require("node-schedule");
const Peminjaman = require('../models/peminjaman')
const Book = require('../models/buku')

const Scheduler = () => {
    schedule.scheduleJob("* * * * *", async function() {
        const peminjaman = await Peminjaman.findAll({ where: { status: 'pending' } })
        await Promise.all(
            peminjaman.map(async(item) => {
                const book = await Book.findOne({ where: { id: item.book_id } });
                const today = new Date();
                const satuHariSetelah = new Date(item.tanggal_peminjaman);
                satuHariSetelah.setDate(satuHariSetelah.getDate() + 3);
                if (today > satuHariSetelah) {
                    const updatePeminjaman = Peminjaman.update({ status: "gagal" }, { where: { id: item.id, status: "pending" } });
                    const updateBook = Book.update({ stock: book.dataValues.stock + 1 }, { where: { id: item.book_id } });
                    await Promise.all([updatePeminjaman, updateBook]);
                }
            })
        );
        console.log('Sheduler berhasil dijalankan')
    });
}

module.exports = Scheduler;