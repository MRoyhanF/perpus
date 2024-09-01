const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const environment = require("../common/environment");
const User = require("../models/user");
const Kunjungan = require("../models/kunjungan");
const Skripsi = require("../models/skripsi");
const Buku = require("../models/buku");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Isemail = require("isemail");
const { Storage } = require("@google-cloud/storage");
const { programStudi, qr } = require("../common/data");
const Peminjaman = require("../models/peminjaman");

const appName = environment.app.name;

const controller = {
  index: function (req, res) {
    return res.status(200).render("pages/index", {
      data: { appName },
    });
  },
  contact: function (req, res) {
    return res.status(200).render("pages/kontak", {
      data: { appName },
    });
  },
  profile: {
    sejarah: function (req, res) {
      return res.status(200).render("pages/profile/sejarah", {
        data: { appName },
      });
    },
    strukturOrganisasi: function (req, res) {
      return res.status(200).render("pages/profile/struktur-organisasi", {
        data: { appName },
      });
    },
    visiMisi: function (req, res) {
      return res.status(200).render("pages/profile/visi-misi", {
        data: { appName },
      });
    },
    tataTertib: function (req, res) {
      return res.status(200).render("pages/profile/tata-tertib", {
        data: { appName },
      });
    },
    akreditasi: function (req, res) {
      return res.status(200).render("pages/profile/akreditasi", {
        data: { appName },
      });
    },
  },
  koleksi: {
    dataBarisBuku: {
      get: async function (req, res) {
        try {
          const books = await Buku.findAll({ where: { isReady: true } });
          return res.status(200).render("pages/koleksi/data-baris-buku", {
            data: {
              appName,
              books,
            },
          });
        } catch (error) {
          return res.status(200).render("pages/koleksi/data-baris-buku", {
            data: {
              appName,
              books: [],
            },
          });
        }
      },
      detail: async function (req, res) {
        try {
          const id = req.params.id;
          const idBuku = parseInt(id);
          if (isNaN(idBuku))
            return res.status(404).render("pages/errors/not-found", {
              data: {
                appName,
              },
            });
          const book = await Buku.findOne({
            where: { id: idBuku, isReady: true },
          });
          return res.status(200).render("pages/koleksi/data-baris-buku-detail", {
            data: {
              appName,
              book,
            },
          });
        } catch (error) {
          return res.status(404).render("pages/errors/not-found", {
            data: {
              appName,
            },
          });
        }
      },
    },
  },
  pelayanan: {
    bukuTamu: {
      get: function (req, res) {
        return res.status(200).render("pages/pelayanan/qr", {
          data: { appName },
        });
      },
      detail: function (req, res) {
        const id = req.params.id;
        const validId = qr.filter((qrcode) => qrcode === id);
        if (validId.length === 0) return res.status(403).redirect("/pelayanan/buku-tamu");
        return res.status(200).render("pages/pelayanan/buku-tamu", {
          data: { appName },
        });
      },
      post: async function (req, res) {
        try {
          const { email, name, nim, programStudi } = req.body;
          if (!email || !name || !nim || !programStudi)
            return res.status(406).json({
              status: 406,
              message: "Terjadi kesalahan pada inputan pengguna",
            });
          const isEmailValid = Isemail.validate(email);
          if (!isEmailValid)
            return res.status(406).json({
              status: 406,
              message: "Email yang dimasukkan tidak valid",
            });
          const todayUTC = new Date();
          const currentUTCOffsetInMilliseconds = todayUTC.getTimezoneOffset() * 60 * 1000;
          const utcPlus7OffsetInMilliseconds = 7 * 60 * 60 * 1000;
          const todayInUTCPlus7 = new Date(todayUTC.getTime() + currentUTCOffsetInMilliseconds + utcPlus7OffsetInMilliseconds);
          const createdBukuTamu = await Kunjungan.create({
            email,
            name,
            nim,
            programStudi,
            time: todayInUTCPlus7,
          });
          if (!createdBukuTamu)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(201).json({
            status: 201,
            message: "Kunjungan ke perpustakaan berhasil dicatat",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    pinjamBuku: {
      get: function (req, res) {
        return res.status(200).render("pages/pelayanan/pinjam-buku", {
          data: { appName },
        });
      },
      detail: async function (req, res) {
        const id = req.params.id;
        const idBuku = parseInt(id);
        if (isNaN(idBuku))
          return res.status(404).render("pages/errors/not-found", {
            data: { appName },
          });
        const book = await Buku.findOne({
          where: { id, isReady: true },
        });
        if (!book)
          return res.status(404).render("pages/errors/not-found", {
            data: { appName },
          });
        return res.status(200).render("pages/pelayanan/pinjam-buku-detail", {
          data: { appName, book },
        });
      },
      post: async function (req, res) {
        try {
          const { idBuku, nim, nama, prodi } = req.body;
          const id = parseInt(idBuku);
          if (isNaN(id))
            return res.status(404).json({
              status: 404,
              message: "Buku tidak ditemukan",
            });
          const buku = await Buku.findOne({ where: { id, isReady: true } });
          if (!buku)
            return res.status(404).json({
              status: 404,
              message: "Buku tidak ditemukan",
            });
          if (buku.dataValues.stock <= 0)
            return res.status(400).json({
              status: 400,
              message: "Stock buku tidak tersedia",
            });
          const peminjamanSaya = await Peminjaman.findAll({
            where: {
              nim,
              status: {
                [Op.or]: ["dipinjam", "pending"],
              },
            },
          });
          if (peminjamanSaya.length >= 3)
            return res.status(400).json({
              status: 400,
              message: "Anda telah meminjam buku sebanyak 3 kali",
            });
          const today = new Date();
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(today.getDate() + 7);
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          const formattedMonth = month < 10 ? `0${month}` : month;
          const formattedDay = day < 10 ? `0${day}` : day;
          const kode_peminjaman = `PJM-${id}-${nim}-${year}${formattedMonth}${formattedDay}`;
          const createdPeminjaman = await Peminjaman.create({
            kode_peminjaman,
            book_id: id,
            nim,
            nama,
            prodi,
            tanggal_peminjaman: today,
            tanggal_pengembalian: threeDaysFromNow,
            status: "pending",
          });
          if (!createdPeminjaman)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          const updateStockBuku = await Buku.update({ stock: buku.dataValues.stock - 1 }, { where: { id: buku.id, isReady: true } });
          if (!updateStockBuku)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(201).json({
            status: 201,
            message: "Berhasil meminjam buku",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    sumbangBuku: {
      get: function (req, res) {
        return res.status(200).render("pages/pelayanan/sumbang-buku", {
          data: { appName },
        });
      },
      post: async function (req, res) {
        try {
          const { judul, jumlah, penulis, kategori, tahun, deskripsi, link } = req.body;
          if (!judul || !jumlah || !penulis || !kategori || !tahun || !deskripsi || !link)
            return res.status(406).json({
              status: 406,
              message: "Terjadi kesalahan pada inputan pengguna",
            });
          const tahunNumber = parseInt(tahun);
          if (isNaN(tahunNumber))
            return res.status(400).json({
              status: 400,
              message: "Tahun buku harus angka",
            });
          const jumlahNumber = parseInt(jumlah);
          if (isNaN(jumlahNumber))
            return res.status(400).json({
              status: 400,
              message: "Jumlah harus angka",
            });
          let url = "/public/images/books/default.jpeg";
          const file = req.file;
          let filePath;
          if (file) {
            const filename = file.filename;
            filePath = path.join(__dirname, "../../public/images/books", filename);
            const fileName = path.basename(filePath);
            url = `/public/images/books/${fileName}`;
          }
          const createdBuku = await Buku.create({
            judul,
            gambar: url,
            deskripsi,
            kategori,
            penulis,
            tahun,
            link,
            isReady: false,
            stock: jumlahNumber,
          });
          if (!createdBuku)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(201).json({
            status: 201,
            message: "Berhasil menambahkan data sumbangan buku",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    referensiJudulSkripsi: async function (req, res) {
      const skripsi = await Skripsi.findAll();
      return res.status(200).render("pages/pelayanan/referensi-judul-skripsi", {
        data: { appName, skripsi },
      });
    },
  },
  login: {
    get: function (req, res) {
      return res.status(200).render("pages/login", {
        data: { appName },
      });
    },
    post: async function (req, res) {
      try {
        const { email, password } = req.body;
        if (!email || !password)
          return res.status(406).json({
            status: 406,
            message: "Terjadi kesalahan pada inputan pengguna",
          });
        const validateEmail = Isemail.validate(email);
        if (!validateEmail)
          return res.status(406).json({
            status: 406,
            message: "Data email yang dimasukkan bukanlah email valid",
          });
        const user = await User.findOne({ where: { email } });
        if (!user)
          return res.status(406).json({
            status: 400,
            message: "Email dan password salah",
          });
        const isPasswordMatch = bcrypt.compareSync(password, user.dataValues.password);
        if (!isPasswordMatch)
          return res.status(406).json({
            status: 400,
            message: "Email dan password salah",
          });
        const token = jwt.sign(
          {
            id: user.dataValues.id,
            email: user.dataValues.email,
          },
          environment.jwt.secret,
          { expiresIn: "30d" }
        );
        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          maxAge: 86400000,
        });
        return res.status(200).json({
          status: 200,
          message: "Login berhasil",
        });
      } catch (error) {
        return res.status(500).json({ status: 500, message: "Terjadi kesalahan pada server" });
      }
    },
  },
  logout: {
    post: async function (req, res) {
      try {
        res.clearCookie("token");
        return res.status(200).json({ status: 200, message: "Logout berhasil" });
      } catch (error) {
        return res.status(500).json({ status: 500, message: "Terjadi kesalahan pada server" });
      }
    },
  },
  admin: {
    get: async function (req, res) {
      const user = await User.findOne({ where: { id: req.user.id } });
      const todayUTC = new Date();
      const currentUTCOffsetInMilliseconds = todayUTC.getTimezoneOffset() * 60 * 1000;
      const utcPlus7OffsetInMilliseconds = 7 * 60 * 60 * 1000;
      const todayInUTCPlus7 = new Date(todayUTC.getTime() + currentUTCOffsetInMilliseconds + utcPlus7OffsetInMilliseconds);
      const startOfDay = new Date(todayInUTCPlus7.getFullYear(), todayInUTCPlus7.getMonth(), todayInUTCPlus7.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(todayInUTCPlus7.getFullYear(), todayInUTCPlus7.getMonth(), todayInUTCPlus7.getDate(), 23, 59, 59, 999);
      const [jumlahTamuHariIni, jumlahSkripsi, jumlahBuku, jumlahSumbanganBuku] = await Promise.all([
        Kunjungan.count({
          where: {
            time: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay,
            },
          },
        }),
        Skripsi.count({}),
        Buku.count({ where: { isReady: true } }),
        Buku.count({ where: { isReady: false } }),
      ]);
      return res.status(200).render("pages/admin/index", {
        data: {
          appName,
          user: user.name,
          dashboard: {
            jumlahTamuHariIni,
            jumlahSkripsi,
            jumlahBuku,
            jumlahSumbanganBuku,
          },
        },
      });
    },
    bukuTamu: {
      get: async function (req, res) {
        const kunjungan = await Kunjungan.findAll();
        const user = await User.findOne({ where: { id: req.user.id } });
        return res.status(200).render("pages/admin/buku-tamu", {
          data: { appName, kunjungan, user: user.name },
        });
      },
      delete: async function (req, res) {
        try {
          const id = req.params.id;
          console.log({ id });
          const kunjungan = await Kunjungan.findOne({ where: { id } });
          if (!kunjungan)
            return res.status(400).json({
              status: 400,
              message: "Data kunjungan tidak ada",
            });
          const deleteKunjungan = await Kunjungan.destroy({ where: { id } });
          console.log({ deleteKunjungan });
          if (!deleteKunjungan)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: `Berhasil menghapus data kunjungan dengan id ${id}`,
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    skripsi: {
      get: async function (req, res) {
        const skripsi = await Skripsi.findAll();
        const user = await User.findOne({ where: { id: req.user.id } });
        return res.status(200).render("pages/admin/skripsi", {
          data: { appName, skripsi, user: user.name },
        });
      },
      add: {
        get: async function (req, res) {
          const user = await User.findOne({ where: { id: req.user.id } });
          return res.status(200).render("pages/admin/skripsi-add", {
            data: { appName, programStudi, user: user.name },
          });
        },
        post: async function (req, res) {
          try {
            const { kode, judul, name, nim, tahun, programStudi } = req.body;
            if (!kode || !judul || !name || !nim || !tahun || !programStudi)
              return res.status(406).json({
                status: 406,
                message: "Terjadi kesalahan pada inputan pengguna",
              });
            const checkKodeAvailable = await Skripsi.findOne({
              where: { kode },
            });
            if (checkKodeAvailable)
              return res.status(400).json({
                status: 400,
                message: "Kode skripsi telah digunakan",
              });
            const createdData = await Skripsi.create({
              kode,
              judul,
              name,
              nim,
              tahun,
              programStudi,
            });
            if (!createdData)
              return res.status(500).json({
                status: 500,
                message: "Terjadi kesalahan pada server",
              });
            return res.status(201).json({
              status: 201,
              message: "Tambah data skripsi berhasil",
            });
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          }
        },
      },
      edit: {
        get: async function (req, res) {
          const kode = req.params.kode;
          const skripsi = await Skripsi.findOne({ where: { kode } });
          if (!skripsi) return res.redirect("/admin/skripsi");
          const user = await User.findOne({ where: { id: req.user.id } });
          return res.status(200).render("pages/admin/skripsi-edit", {
            data: { appName, programStudi, skripsi, user: user.name },
          });
        },
        put: async function (req, res) {
          try {
            const kode = req.params.kode;
            const { judul, name, nim, tahun, programStudi } = req.body;
            if (!judul || !name || !nim || !tahun || !programStudi)
              return res.status(406).json({
                status: 406,
                message: "Terjadi kesalahan pada inputan pengguna",
              });
            const skripsi = await Skripsi.findOne({ where: { kode } });
            if (!skripsi)
              return res.status(400).json({
                status: 400,
                message: `Data skripsi dengan kode ${kode} tidak ada`,
              });
            const updateData = await Skripsi.update({ judul, name, nim, tahun, programStudi }, { where: { kode } });
            if (!updateData)
              return res.status(500).json({
                status: 500,
                message: "Terjadi kesalahan pada server",
              });
            return res.status(200).json({
              status: 200,
              message: "Ubah data skripsi berhasil",
            });
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          }
        },
      },
      delete: async function (req, res) {
        try {
          const kode = req.params.kode;
          const skripsi = await Skripsi.findOne({ where: { kode } });
          if (!skripsi)
            return res.status(400).json({
              status: 400,
              message: "Data skripsi tidak ada",
            });
          const deleteSkripsi = await Skripsi.destroy({ where: { kode } });
          if (!deleteSkripsi)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: `Berhasil menghapus data skripsi dengan kode ${kode}`,
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    buku: {
      get: async function (req, res) {
        const books = await Buku.findAll({ where: { isReady: true } });
        const user = await User.findOne({
          where: { id: req.user.id },
        });
        return res.status(200).render("pages/admin/buku", {
          data: { appName, books, user: user.name },
        });
      },
      add: {
        get: async function (req, res) {
          const user = await User.findOne({
            where: { id: req.user.id },
          });
          return res.status(200).render("pages/admin/buku-add", {
            data: { appName, user: user.name },
          });
        },
        post: async function (req, res) {
          try {
            const { judul, deskripsi, kategori, penulis, tahun, link, stock } = req.body;
            if (!judul || !deskripsi || !kategori || !penulis || !tahun || !link || !stock)
              return res.status(406).json({
                status: 406,
                message: "Terjadi kesalahan pada inputan pengguna",
              });
            const jumlah = parseInt(stock);
            if (isNaN(jumlah))
              return res.status(400).json({
                status: 400,
                message: "Stock harus angka",
              });
            let url = "/public/images/books/default.jpeg";
            const file = req.file;
            let filePath;
            if (file) {
              const filename = file.filename;
              filePath = path.join(__dirname, "../../public/images/books", filename);
              const fileName = path.basename(filePath);
              url = `/public/images/books/${fileName}`;
            }
            const createdBuku = await Buku.create({
              judul,
              deskripsi,
              kategori,
              penulis,
              tahun,
              link,
              stock,
              gambar: url,
              isReady: true,
            });
            if (!createdBuku)
              return res.status(500).json({
                status: 500,
                message: "Terjadi kesalahan pada server",
              });
            return res.status(201).json({
              status: 201,
              message: "Tambah data buku berhasil",
            });
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          }
        },
      },
      edit: {
        get: async function (req, res) {
          const id = req.params.id;
          const idBuku = parseInt(id);
          if (isNaN(idBuku)) return res.redirect("/admin/buku");
          const book = await Buku.findOne({
            where: { id: idBuku, isReady: true },
          });
          if (!book) return res.redirect("/admin/buku");
          const user = await User.findOne({
            where: { id: req.user.id },
          });
          return res.status(200).render("pages/admin/buku-edit", {
            data: { appName, book, user: user.name },
          });
        },
        put: async function (req, res) {
          try {
            const id = req.params.id;
            const { judul, deskripsi, kategori, penulis, tahun, link, stock } = req.body;
            if (!judul || !deskripsi || !kategori || !penulis || !tahun || !link || !stock)
              return res.status(406).json({
                status: 406,
                message: "Terjadi kesalahan pada inputan pengguna",
              });

            const idBuku = parseInt(id);
            if (isNaN(idBuku))
              return res.status(400).json({
                status: 400,
                message: "Buku tidak ditemukan",
              });
            const jumlah = parseInt(stock);
            if (isNaN(jumlah))
              return res.status(400).json({
                status: 400,
                message: "Stock harus angka",
              });
            const buku = await Buku.findOne({
              where: { id: idBuku, isReady: true },
            });
            if (!buku)
              return res.status(400).json({
                status: 400,
                message: "Buku tidak ditemukan",
              });
            const updateBuku = await Buku.update(
              {
                judul: judul || buku.dataValues.judul,
                deskripsi: deskripsi || buku.dataValues.deskripsi,
                kategori: kategori || buku.dataValues.kategori,
                penulis: penulis || buku.dataValues.penulis,
                tahun: tahun || buku.dataValues.tahun,
                link: link || buku.dataValues.link,
                stock: stock || buku.dataValues.stock,
                isReady: true,
              },
              { where: { id: idBuku, isReady: true } }
            );
            if (!updateBuku)
              return res.status(500).json({
                status: 500,
                message: "Terjadi kesalahan pada server",
              });
            return res.status(200).json({
              status: 200,
              message: "Update data buku berhasil",
            });
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          }
        },
      },
      delete: async function (req, res) {
        try {
          const id = req.params.id;
          const idBuku = parseInt(id);
          if (isNaN(idBuku))
            return res.status(400).json({
              status: 400,
              message: "Data buku tidak ada",
            });
          const buku = await Buku.findOne({
            where: { id: idBuku, isReady: true },
          });
          if (!buku)
            return res.status(400).json({
              status: 400,
              message: "Data buku tidak ada",
            });
          const deleteBuku = await Buku.destroy({
            where: { id: idBuku, isReady: true },
          });
          if (!deleteBuku)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: `Berhasil menghapus data buku dengan judul ${buku.dataValues.judul}`,
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    sumbangBuku: {
      get: async function (req, res) {
        const books = await Buku.findAll({ where: { isReady: false } });
        const user = await User.findOne({
          where: { id: req.user.id },
        });
        return res.status(200).render("pages/admin/sumbang-buku", {
          data: { appName, books, user: user.name },
        });
      },
      edit: async function (req, res) {
        try {
          const id = req.params.id;
          const idBuku = parseInt(id);
          if (isNaN(idBuku))
            return res.status(400).json({
              status: 400,
              message: "Buku tidak ditemukan",
            });
          const book = await Buku.findOne({
            where: { id: idBuku, isReady: false },
          });
          if (!book)
            return res.status(400).json({
              status: 400,
              message: "Buku tidak ditemukan",
            });
          const accBuku = await Buku.update({ isReady: true }, { where: { id: book.dataValues.id, isReady: false } });
          if (!accBuku)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: "Berhasil konfirmasi data sumbangan buku",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
      delete: async function (req, res) {
        try {
          const id = req.params.id;
          const idBuku = parseInt(id);
          if (isNaN(idBuku))
            return res.status(400).json({
              status: 400,
              message: "Data buku tidak ada",
            });
          const buku = await Buku.findOne({
            where: { id: idBuku, isReady: false },
          });
          if (!buku)
            return res.status(400).json({
              status: 400,
              message: "Data buku tidak ada",
            });
          const deleteBuku = await Buku.destroy({
            where: { id: idBuku, isReady: false },
          });
          if (!deleteBuku)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: `Berhasil menghapus data buku dengan judul ${buku.dataValues.judul}`,
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    peminjaman: {
      get: async function (req, res) {
        const peminjaman = await Peminjaman.findAll({
          include: {
            model: Buku,
            required: true,
          },
        });
        const user = await User.findOne({
          where: { id: req.user.id },
        });
        return res.status(200).render("pages/admin/peminjaman-buku", {
          data: { appName, peminjaman, user: user.name },
        });
      },
      tambah: async function (req, res) {
        const user = await User.findOne({
          where: { id: req.user.id },
        });
        return res.status(200).render("pages/admin/peminjaman-buku-add", {
          data: { appName, user: user.name },
        });
      },
      detail: async function (req, res) {
        const id = req.params.id;
        const peminjaman = await Peminjaman.findOne({
          where: { id },
          include: {
            model: Buku,
            required: true,
          },
        });
        const user = await User.findOne({
          where: { id: req.user.id },
        });
        return res.status(200).render("pages/admin/peminjaman-buku-edit", {
          data: { appName, peminjaman, user: user.name },
        });
      },
      post: async function (req, res) {
        try {
          const { nim, book_id, tanggal_peminjaman, status } = req.body;
          if (!nim || !book_id || !tanggal_peminjaman || !status)
            return res.status(406).json({
              status: 406,
              message: "Data yang dikirimkan tidak sesuai",
            });
          const id = parseInt(book_id);
          if (isNaN(id))
            return res.status(404).json({
              status: 404,
              message: "Buku tidak ditemukan",
            });
          const buku = await Buku.findOne({ where: { id, isReady: true } });
          if (!buku)
            return res.status(404).json({
              status: 404,
              message: "Buku tidak ditemukan",
            });
          if (buku.dataValues.stock <= 0)
            return res.status(400).json({
              status: 400,
              message: "Stock buku tidak tersedia",
            });
          const peminjamanSaya = await Peminjaman.findAll({
            where: {
              nim,
              status: {
                [Op.or]: ["dipinjam", "pending"],
              },
            },
          });
          if (peminjamanSaya.length >= 3)
            return res.status(400).json({
              status: 400,
              message: "Anda telah meminjam buku sebanyak 3 kali",
            });
          const today = new Date(tanggal_peminjaman);
          const threeDaysFromNow = new Date(tanggal_peminjaman);
          threeDaysFromNow.setDate(today.getDate() + 7);
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          const formattedMonth = month < 10 ? `0${month}` : month;
          const formattedDay = day < 10 ? `0${day}` : day;
          const kode_peminjaman = `PJM-${id}-${nim}-${year}${formattedMonth}${formattedDay}`;
          const createdPeminjaman = await Peminjaman.create({
            kode_peminjaman,
            book_id: id,
            nim,
            tanggal_peminjaman: today,
            tanggal_pengembalian: threeDaysFromNow,
            status,
          });
          if (!createdPeminjaman)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          const updateStockBuku = await Buku.update({ stock: buku.dataValues.stock - 1 }, { where: { id: buku.id, isReady: true } });
          if (!updateStockBuku)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(201).json({
            status: 201,
            message: "Berhasil meminjam buku",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
      put: async function (req, res) {
        try {
          const id = req.params.id;
          const { kode_peminjaman, nim, book_id, tanggal_pengembalian, status } = req.body;
          const idPeminjaman = parseInt(id);
          if (isNaN(idPeminjaman))
            return res.status(400).json({
              status: 400,
              message: "ID Peminjaman harus angka",
            });

          const peminjaman = await Peminjaman.findOne({
            where: {
              id: idPeminjaman,
              kode_peminjaman,
              nim,
              book_id,
            },
          });
          if (!peminjaman)
            return res.status(400).json({
              status: 400,
              message: "Data peminjaman tidak tersedia",
            });

          const buku = await Buku.findOne({ where: { id: book_id } });
          if (!buku)
            return res.status(400).json({
              message: "Data buku tidak tersedia",
            });

          if ((status === "pending" || status === "dipinjam") && (peminjaman.dataValues.status === "selesai" || peminjaman.dataValues.status === "gagal")) {
            if (buku.dataValues.stock <= 0)
              return res.status(400).json({
                status: 400,
                message: "Stock buku sudah habis",
              });
          }

          const updatePeminjaman = await Peminjaman.update(
            {
              status,
              tanggal_dikembalikan: status === "selesai" ? new Date(tanggal_pengembalian) : undefined,
            },
            {
              where: {
                id: idPeminjaman,
                kode_peminjaman,
                nim,
                book_id,
              },
            }
          );

          if (updatePeminjaman[0] === 0)
            return res.status(500).json({
              status: 500,
              message: "Gagal mengupdate data peminjaman",
            });

          if ((peminjaman.dataValues.status === "pending" || peminjaman.dataValues.status === "dipinjam") && (status === "selesai" || status === "gagal")) {
            const updateStockBuku = await Buku.update({ stock: buku.dataValues.stock + 1 }, { where: { id: buku.id } });
            if (updateStockBuku[0] === 0)
              return res.status(500).json({
                status: 500,
                message: "Gagal mengupdate stock buku",
              });
          } else if ((status === "pending" || status === "dipinjam") && (peminjaman.dataValues.status === "selesai" || peminjaman.dataValues.status === "gagal")) {
            if (buku.dataValues.stock - 1 < 0)
              return res.status(400).json({
                status: 400,
                message: "Stock buku tidak mencukupi",
              });
            const updateStockBuku = await Buku.update({ stock: buku.dataValues.stock - 1 }, { where: { id: buku.id } });
            if (updateStockBuku[0] === 0)
              return res.status(500).json({
                status: 500,
                message: "Gagal mengupdate stock buku",
              });
          }

          return res.status(200).json({
            status: 200,
            message: "Berhasil update data peminjaman buku",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
      delete: async function (req, res) {
        try {
          const id = req.params.id;
          const idPeminjaman = parseInt(id);
          if (isNaN(idPeminjaman))
            return res.status(400).json({
              status: 400,
              message: "ID Peminjaman harus angka",
            });
          const peminjaman = await Peminjaman.findOne({
            where: { id: idPeminjaman },
          });
          if (!peminjaman)
            return res.status(400).json({
              status: 400,
              message: "Data peminjaman tidak tersedia",
            });
          const deletePeminjaman = await Peminjaman.destroy({
            where: { id: idPeminjaman },
          });
          if (!deletePeminjaman)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: "Berhasil menghapus data peminjaman",
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
    pengguna: {
      get: async function (req, res) {
        const pengguna = await User.findAll();
        const user = await User.findOne({
          where: { id: req.user.id },
        });
        return res.status(200).render("pages/admin/pengguna", {
          data: { appName, pengguna, user: user.name },
        });
      },
      tambah: {
        get: async function (req, res) {
          const user = await User.findOne({
            where: { id: req.user.id },
          });
          return res.status(200).render("pages/admin/pengguna-add", {
            data: { appName, user: user.name },
          });
        },
        post: async function (req, res) {
          try {
            const user = await User.findOne({
              where: { email: req.body.email },
            });
            if (user)
              return res.status(400).json({
                status: 400,
                message: "Email sudah digunakan",
              });
            const hashPassword = await bcrypt.hash(req.body.password, 10);
            const createdUser = await User.create({
              email: req.body.email,
              password: hashPassword,
              name: req.body.name,
            });
            if (!createdUser)
              return res.status(500).json({
                status: 500,
                message: "Terjadi kesalahan pada server",
              });
            return res.status(201).json({
              status: 201,
              message: "Buat akun admin berhasil",
            });
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          }
        },
      },
      edit: {
        get: async function (req, res) {
          const id = req.params.id;
          const userId = parseInt(id);
          if (isNaN(userId))
            return res.status(400).json({
              status: 400,
              message: "Id admin bukan angka",
            });
          const pengguna = await User.findOne({ where: { id: userId } });
          if (!pengguna) return res.redirect("/admin/pengguna");
          const user = await User.findOne({
            where: { id: req.user.id },
          });
          return res.status(200).render("pages/admin/pengguna-edit", {
            data: { appName, pengguna, user: user.name },
          });
        },
        put: async function (req, res) {
          console.log({ params: req.params.id });
          console.log({ body: req.body });
          const id = req.params.id;
          const userId = parseInt(id);
          if (isNaN(userId))
            return res.status(400).json({
              status: 400,
              message: "Id admin bukan angka",
            });
          const pengguna = await User.findOne({ where: { id: userId } });
          if (!pengguna)
            return res.status(400).json({
              status: 400,
              message: "Data admin tidak ada",
            });
          let hashPassword = null;
          if (!req.body.password) {
            hashPassword = await bcrypt.hash(req.body.password, 10);
          }
          const updatePengguna = await User.update(
            {
              email: req.body.email || pengguna.email,
              password: hashPassword || pengguna.password,
              name: req.body.name || pengguna.name,
            },
            { where: { id: userId } }
          );
          if (!updatePengguna)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: "Berhasil update akun admin",
          });
        },
      },
      delete: async function (req, res) {
        try {
          const id = req.params.id;
          const userId = parseInt(id);
          if (isNaN(userId))
            return res.status(400).json({
              status: 400,
              message: "ID admin bukan angka",
            });
          const user = await User.findOne({ where: { id: userId } });
          if (!user)
            return res.status(400).json({
              status: 400,
              message: "Data admin tidak ada",
            });
          const deleteUser = await User.destroy({ where: { id: userId } });
          if (!deleteUser)
            return res.status(500).json({
              status: 500,
              message: "Terjadi kesalahan pada server",
            });
          return res.status(200).json({
            status: 200,
            message: `Berhasil delete data admin dengan id ${userId}`,
          });
        } catch (error) {
          return res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan pada server",
          });
        }
      },
    },
  },
  book: {
    getAll: async function (req, res) {
      try {
        const books = await Buku.findAll({ where: { isReady: true } });
        if (books.length === 0)
          return res.status(404).json({
            status: 404,
            message: "Buku tidak ditemukan",
          });
        return res.status(200).json({
          status: 200,
          message: "Berhasil mendapatkan data buku",
          data: { books },
        });
      } catch (error) {
        return res.status(500).json({
          status: 500,
          message: "Terjadi kesalahan pada server",
        });
      }
    },
    get: async function (req, res) {
      try {
        const id = req.params.id;
        const idBuku = parseInt(id);
        if (isNaN(idBuku))
          return res.status(400).json({
            status: 400,
            message: "Buku tidak ditemukan",
          });
        const buku = await Buku.findOne({
          where: { id: idBuku, isReady: true },
        });
        if (!buku)
          return res.status(400).json({
            status: 400,
            message: "Buku tidak ditemukan",
          });
        return res.status(200).json({
          status: 200,
          message: "Data buku berhasil ditemukan",
          data: { buku },
        });
      } catch (error) {
        return res.status(500).json({
          status: 500,
          message: "Terjadi kesalahan pada server",
        });
      }
    },
    search: async function (req, res) {
      try {
        const judul = req.params.judul;
        const books = await Buku.findAll({
          where: {
            judul: {
              [Op.like]: `%${judul}%`,
            },
            isReady: true,
          },
        });
        return res.status(200).json({
          status: 200,
          message: "Data buku berhasil ditemukan",
          data: { books },
        });
      } catch (error) {
        return res.status(500).json({
          status: 500,
          message: "Terjadi kesalahan pada server",
        });
      }
    },
  },
  errors: {
    notfound: function (req, res) {
      return res.status(404).render("pages/errors/not-found");
    },
  },
};

module.exports = controller;
