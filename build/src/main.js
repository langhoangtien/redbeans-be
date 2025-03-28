import mongoose from "mongoose";
import config from "./config/index.js";
import app from "./app.js";
mongoose
    .connect(config.dbUri, {
    authSource: "admin",
    user: config.dbUser,
    pass: config.dbPassword,
})
    .then(() => {
    console.log("Connected to database");
    app.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}. Visit http://localhost:${config.port} in your browser.`);
    });
})
    .catch((err) => {
    console.log("Error connecting to database", err);
});
//# sourceMappingURL=main.js.map