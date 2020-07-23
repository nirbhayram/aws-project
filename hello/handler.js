const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
exports.hello = async (event) => {
	let data = {}
	try {
		var machineId = event.requestContext.authorizer.claims['cognito:username']
		console.log(machineId + "************")
		// var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
		var documentClient = new AWS.DynamoDB.DocumentClient();
		// var params = {
		// 	TableName: "Client",
		// 	Key: {
		// 		clientid: machineId
		// 	}
		// };
		// data = await documentClient.get(params).promise();
		// console.log(data);

		var id = uuidv4()
		var expiry = new Date().getMilliseconds() + 5 * 60 * 1000
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
			body: JSON.stringify({ "id": id }),
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