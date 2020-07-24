const AWS = require('aws-sdk');
exports.hello = async (event) => {
	console.log('verify token triggered');
	var inputData = JSON.parse(event.body);
	if (!inputData['amount']) {
		return sendRespone(400, { message: 'amount is required' }, {})
	}
	if (!inputData["cltoken"]) {
		return sendRespone(400, { message: 'checkToken is missing' }, {})
	}
	if (!event || !event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims || !event.requestContext.authorizer.claims['cognito:username']) {
		return sendRespone(400, { message: 'username not found in authorized list', event }, {})
	}

	var userid = event.requestContext.authorizer.claims['cognito:username']
	var amount = inputData['amount']
	var inputToken = inputData["cltoken"]["token"]
	var inputClient = inputData["cltoken"]["client"]
	var checkToken = await checkClToken(inputToken, inputClient)
	console.log(`useid ${userid} inputtoken ${inputToken} amount ${amount} inputclient ${inputClient} checktoken ${checkToken}`);
	if (checkToken === 'true') {
		let transactionStatus = await transactAmount(amount, userid)
		console.log(`transaction status ${transactionStatus}`);
		if (transactionStatus === 'true') {
			let clearClTokenStatus = await clearClToken(inputClient);
			if (clearClTokenStatus === 'true') {
				return sendRespone(200, { message: 'transaction completed!' }, {})
			} else {
				return sendRespone(400, { message: clearClTokenStatus }, {})
			}
		} else {
			return sendRespone(400, { message: transactionStatus }, {})
		}
	} else {
		return sendRespone(400, { message: checkToken }, {})
	}
}

const clearClToken = async (machineId) => {
	console.log(`Inside clearClToken`);
	var documentClient = new AWS.DynamoDB.DocumentClient();
	var expiry = Date.now() - 10;
	console.log(`New expiry set : ${expiry}`);
	var params = {
		TableName: "Client",
		Key: {
			"clientid": machineId
		},
		UpdateExpression: 'set expiry = :e',
		ExpressionAttributeValues: {
			":e": expiry
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

const transactAmount = async (amount, user) => {
	console.log(`inside transact amount`);
	var documentClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName: "User",
		Key: {
			userid: user
		}
	};
	try {
		var data = await documentClient.get(params).promise();
	} catch (error) {
		console.error(error)
		return `internal error : ${error.message}`
	}
	data = data["Item"];
	console.log(`data of user ${data}`);
	if (!data) {
		return 'invalid userid'
	}
	var currentBalance = data['balance']
	console.log(`current balance ${currentBalance}`);
	if (!currentBalance || currentBalance < amount) {
		return 'insufficient balance'
	}

	let remainingBalance = currentBalance - amount;
	console.log(`remaining balance ${remainingBalance}`);
	var params = {
		TableName: "User",
		Key: {
			"userid": user
		},
		UpdateExpression: 'set balance = :b',
		ExpressionAttributeValues: {
			":b": remainingBalance
		},
		ReturnValues: "UPDATED_NEW"
	};
	try {
		data = await documentClient.update(params).promise();
	} catch (error) {
		console.error(error);
		return `internal error : ${error.message}`
	}
	console.log(`Final data after the transaction updated ${data}`);
	return 'true'
}

const checkClToken = async (clToken, client) => {
	console.log(`Inside check cl token`);
	console.log(`cltoken ${clToken} client ${client}`);
	if (clToken && client) {
		var documentClient = new AWS.DynamoDB.DocumentClient();
		var params = {
			TableName: "Client",
			Key: {
				clientid: client
			}
		};
		try {
			var data = await documentClient.get(params).promise();
		} catch (error) {
			console.error(error);
			return `internal error : ${error.message}`
		}
		data = data["Item"];
		console.log(`data of the client ${data}`);
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