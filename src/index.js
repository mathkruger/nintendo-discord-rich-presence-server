const { api } = require("./api");
const { client } = require("./client");

const mode = (process.argv.find(x => x.includes("--mode")) || "--mode api").replace("--mode", "").trim();


switch(mode) {
    case "api":
        api.listen(process.env.PORT || 3333);
    break;

    case "client":
        client.init();
    break;
}
