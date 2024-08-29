const dotenv = require("dotenv");

dotenv.config();

const environment = {
    app: {
        name: process.env.APP_NAME || "PERPUS",
    },
    port: Number(process.env.PORT) || 3000,
    database_url: process.env.DATABASE_URL || "",
    jwt: {
        secret: process.env.JWT_SECRET || "secret",
    },
};

module.exports = environment;