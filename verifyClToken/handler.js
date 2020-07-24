const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
exports.hello = async (event) => {

	return {
		statusCode: 500,
		body: JSON.stringify("authorized"),
		headers: {}
	}

}