const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { authentication, noAuthentication } = require("../libs/authenticate");
const upload = require("../libs/multer.js");

router
    .get("/", controller.index)
    .get("/contact", controller.contact)


// PROFILE
.get("/profile/sejarah", controller.profile.sejarah)
    .get("/profile/struktur-organisasi", controller.profile.strukturOrganisasi)
    .get("/profile/visi-misi", controller.profile.visiMisi)
    .get("/profile/tata-tertib", controller.profile.tataTertib)
    .get("/profile/akreditasi", controller.profile.akreditasi)

// KOLEKSI
.get("/koleksi/data-baris-buku", controller.koleksi.dataBarisBuku.get)
    .get("/koleksi/data-baris-buku/:id", controller.koleksi.dataBarisBuku.detail)

// PELAYANAN
.get("/pelayanan/buku-tamu", controller.pelayanan.bukuTamu.get)
    .get("/pelayanan/buku-tamu/:id", controller.pelayanan.bukuTamu.detail)
    .post("/pelayanan/buku-tamu", controller.pelayanan.bukuTamu.post)
    .get("/pelayanan/pinjam-buku", controller.pelayanan.pinjamBuku.get)
    .get("/pelayanan/pinjam-buku/:id", controller.pelayanan.pinjamBuku.detail)
    .post("/pelayanan/pinjam-buku", controller.pelayanan.pinjamBuku.post)
    .get("/pelayanan/sumbang-buku", controller.pelayanan.sumbangBuku.get)
    .post(
        "/pelayanan/sumbang-buku",
        upload.single("image"),
        controller.pelayanan.sumbangBuku.post
    )
    .get(
        "/pelayanan/referensi-judul-skripsi",
        controller.pelayanan.referensiJudulSkripsi
    )

// BUKU
.get("/books", controller.book.getAll)
    .get("/books/search/:judul", controller.book.search)
    .get("/books/:id", controller.book.get)

// AUTH
.get("/login", noAuthentication, controller.login.get)
    .post("/login", noAuthentication, controller.login.post)
    .post("/logout", authentication, controller.logout.post)

// ADMIN
.get("/admin", authentication, controller.admin.get)

// BUKU TAMU
.get("/admin/buku-tamu", authentication, controller.admin.bukuTamu.get)
    .delete("/admin/buku-tamu/:id", authentication, controller.admin.bukuTamu.delete)

// SKRIPSI
.get("/admin/skripsi", authentication, controller.admin.skripsi.get)
    .get("/admin/skripsi/add", authentication, controller.admin.skripsi.add.get)
    .post("/admin/skripsi/add", authentication, controller.admin.skripsi.add.post)
    .get(
        "/admin/skripsi/:kode",
        authentication,
        controller.admin.skripsi.edit.get
    )
    .put(
        "/admin/skripsi/:kode",
        authentication,
        controller.admin.skripsi.edit.put
    )
    .delete(
        "/admin/skripsi/:kode",
        authentication,
        controller.admin.skripsi.delete
    )

// BUKU
.get("/admin/buku", authentication, controller.admin.buku.get)
    .get("/admin/buku/add", authentication, controller.admin.buku.add.get)
    .post(
        "/admin/buku/add",
        authentication,
        upload.single("image"),
        controller.admin.buku.add.post
    )
    .get("/admin/buku/:id", authentication, controller.admin.buku.edit.get)
    .put("/admin/buku/:id", authentication, controller.admin.buku.edit.put)
    .delete("/admin/buku/:id", authentication, controller.admin.buku.delete)

// SUMBANG BUKU
.get("/admin/sumbang-buku", authentication, controller.admin.sumbangBuku.get)
    .patch(
        "/admin/sumbang-buku/:id",
        authentication,
        controller.admin.sumbangBuku.edit
    )
    .delete(
        "/admin/sumbang-buku/:id",
        authentication,
        controller.admin.sumbangBuku.delete
    )

// PEMINJAMAN
.get(
        "/admin/peminjaman-buku",
        authentication,
        controller.admin.peminjaman.get
    )
    .get(
        "/admin/peminjaman-buku/add",
        authentication,
        controller.admin.peminjaman.tambah
    )
    .post(
        "/admin/peminjaman-buku",
        authentication,
        controller.admin.peminjaman.post
    )
    .get(
        "/admin/peminjaman-buku/:id",
        authentication,
        controller.admin.peminjaman.detail
    )
    .put(
        "/admin/peminjaman-buku/:id",
        authentication,
        controller.admin.peminjaman.put
    )
    .delete(
        "/admin/peminjaman-buku/:id",
        authentication,
        controller.admin.peminjaman.delete
    )

// PENGGUNA
.get("/admin/pengguna", authentication, controller.admin.pengguna.get)
    .get("/admin/pengguna/add", authentication, controller.admin.pengguna.tambah.get)
    .get("/admin/pengguna/:id", authentication, controller.admin.pengguna.edit.get)
    .post("/admin/pengguna/add", authentication, controller.admin.pengguna.tambah.post)
    .put("/admin/pengguna/:id", authentication, controller.admin.pengguna.edit.put)
    .delete("/admin/pengguna/:id", authentication, controller.admin.pengguna.delete)

.all("*", controller.errors.notfound);

module.exports = router;