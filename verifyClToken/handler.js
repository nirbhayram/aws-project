const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
exports.hello = async (event) => {

	var inputData = JSON.parse(event.body);
	var inputToken = inputData["cltoken"]["token"]
	var inputClient = inputData["cltoken"]["client"]
	var checkToken = await checkClToken(inputToken, inputClient)
	if (checkToken === 'true') {
		return sendRespone(200, { message: 'valid' }, {})
	} else {
		return sendRespone(400, { message: checkToken }, {})
	}
}

const checkClToken = async (clToken, client) => {
	if (clToken && client) {
		var documentClient = new AWS.DynamoDB.DocumentClient();
		var params = {
			TableName: "Client",
			Key: {
				clientid: client
			}
		};
		var data = await documentClient.get(params).promise();
		data = data["Item"];
		if (data) {
			var fectExpiry = data["expiry"];
			var fetchId = data["active_token"];
			if (fectExpiry && fetchId && Date.now() < fectExpiry && fetchId === clToken) {
				return 'true'
			}
			return 'token is expired or invalid'
		} else {
			return 'Invalid client'
		}
	} else {
		return 'client and token feild is required';
	}
}

const sendRespone = (status, body, header) => {
	return {
		statusCode: status,
		body: JSON.stringify(body),
		headers: header
	}
}