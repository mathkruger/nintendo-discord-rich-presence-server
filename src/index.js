const { api } = require("./api");
const { client } = require("./client/client");
const { login } = require("./client/login");

const mode = (process.argv[2] || "api").trim();

switch(mode) {
    case "api":
        api.listen(process.env.PORT || 3333);
    break;

    case "client":
        client.init();
    break;

    case "login":
        login(process.argv[3]);
    break;
}
