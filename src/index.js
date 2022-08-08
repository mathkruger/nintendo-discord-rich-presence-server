const { api } = require("./api");
const { client } = require("./client");

const mode = (process.argv[process.argv.findIndex(x => x.includes("--mode")) + 1] || "api").trim();

switch(mode) {
    case "api":
        api.listen(process.env.PORT || 3333);
    break;

    case "client":
        client.init();
    break;
}
