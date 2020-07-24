const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
exports.hello = async (event) => {

	let EXPIRY_TIME = 5 //in minutes
	let data = {}
	try {
		var machineId = event.requestContext.authorizer.claims['cognito:username']
		console.log(machineId + "************")
		var documentClient = new AWS.DynamoDB.DocumentClient();
		var params = {
			TableName: "Client",
			Key: {
				clientid: machineId
			}
		};
		data = await documentClient.get(params).promise();
		console.log(data);
		data = data["Item"];

		var fectExpiry = data["expiry"];
		var fetchId = data["active_token"];
		if (fectExpiry && Date.now() < fectExpiry) {
			return {
				statusCode: 200,
				body: JSON.stringify({ "token": fetchId, "client": machineId }),
				headers: {}
			}
		}

		var id = uuidv4()
		var expiry = Date.now() + (EXPIRY_TIME * 60 * 1000)
		var params = {
			TableName: "Client",
			Key: {
				"clientid": machineId
			},
			UpdateExpression: 'set expiry = :e, active_token = :a',
			ExpressionAttributeValues: {
				":e": expiry,
				":a": id
			},
			ReturnValues: "UPDATED_NEW"
		};
		data = await documentClient.update(params).promise();
		console.log(data);
		return {
			statusCode: 200,
			body: JSON.stringify({ "token": id, "client": machineId }),
			headers: {}
		}
	} catch (error) {
		console.log(error)
		return {
			statusCode: 500,
			body: JSON.stringify("error"),
			headers: {}
		}
	}

}