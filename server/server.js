const dotenv = require("dotenv");

dotenv.config();

const connectToMongoDB = require("../config/mongo-connection");
const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
  });
});
