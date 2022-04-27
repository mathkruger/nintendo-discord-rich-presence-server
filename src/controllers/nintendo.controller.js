const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = {
    async getUserPresence(request, response) {
        try {
            const { dummyUserId } = request.query;
            const command = `nxapi nso friends --user ${dummyUserId} --json`;
            console.log(command);
            const output = await exec(command);
            const jsonOutput = JSON.parse(output.stdout.trim());
            return response.json(jsonOutput[0].presence);
        } catch (error) {
            console.log(error)
            return response.status(500).send({
                success: false,
                error
            });
        }
    },
}