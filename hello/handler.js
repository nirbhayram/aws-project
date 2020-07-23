exports.hello = async (event) => {
  
  var machineId = event.requestContext.authorizer.claims['cognito:username']

  return {
    statusCode: 200,
    body: JSON.stringify(machineId),
    headers: {}
  }
}