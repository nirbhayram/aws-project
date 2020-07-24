const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
exports.hello = async (event) => {

	console.log(`Generate cl token triggered`);
	let EXPIRY_TIME = 5 //in minutes
	if (!event || !event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims || !event.requestContext.authorizer.claims['cognito:username']) {
		return sendRespone(400, { message: 'username not found in authorized list', event }, {})
	}

	var machineId = event.requestContext.authorizer.claims['cognito:username']
	var createNewToken = await checkCurrentToken(machineId)
	console.log(`machine id ${machineId} createNewToken status ${createNewToken}`);
	if (createNewToken.includes('false')) {
		return sendRespone(200, { token: createNewToken.split(' ')[1], client: machineId }, {})
	}
	if (createNewToken !== 'true') {
		return sendRespone(400, { message: createNewToken }, {})
	}

	var token = generateNewClToken()
	console.log(`token : ${token}`);
	let updateStatus = await updateNewTokenOfClient(machineId, token, EXPIRY_TIME);
	console.log(`update status : ${updateStatus}`);
	if (updateStatus === 'true') {
		return sendRespone(200, { token , client: machineId },{})
	} else {
		return sendRespone(400, { message: updateStatus }, {})
	}
}

const generateNewClToken = ()=>{
	console.log(`Inside generateNewClToken`);
	return `${uuidv4()}${uuidv4()}${uuidv4()}${uuidv4()}`
}

const updateNewTokenOfClient = async (machineId, token, EXPIRY_TIME) => {
	console.log(`Inside updateNewTokenOfClient`);
	var documentClient = new AWS.DynamoDB.DocumentClient();
	var expiry = Date.now() + (EXPIRY_TIME * 60 * 1000)
	console.log(`New expiry set : ${expiry}`);
	var params = {
		TableName: "Client",
		Key: {
			"clientid": machineId
		},
		UpdateExpression: 'set expiry = :e, active_token = :a',
		ExpressionAttributeValues: {
			":e": expiry,
			":a": token
		},
		ReturnValues: "UPDATED_NEW"
	};
	try {
		var data = await documentClient.update(params).promise();
	} catch (error) {
		console.error(error);
		return `Internal error : ${error.message}`
	}
	return 'true';
}

const checkCurrentToken = async (machineId) => {
	console.log(`Inside checkCurrentToken`);
	var documentClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName: "Client",
		Key: {
			clientid: machineId
		}
	};
	try {
		var data = await documentClient.get(params).promise();
	} catch (error) {
		console.error(error);
		return `Internal error : ${error.message}`
	}
	data = data["Item"];
	console.log(`Data received : ${data}`);
	if (!data) {
		return 'Invalid client!'
	}

	var fectExpiry = data["expiry"];
	var fetchId = data["active_token"];
	console.log(`fetch expiry : ${fectExpiry} fetch active token : ${fetchId}`);
	if (fectExpiry && fetchId && Date.now() < fectExpiry) {
		return `false ${fetchId}`
	} else {
		return 'true'
	}
}

const sendRespone = (status, body, header) => {
	return {
		statusCode: status,
		body: JSON.stringify(body),
		headers: header
	}
}
