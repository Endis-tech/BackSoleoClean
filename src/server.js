import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const { PORT = 4000, MONGO_URI } = process.env;

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch(err => {
    console.error("Error al conectar a la base de datos", err);
    process.exit(1);
  });
