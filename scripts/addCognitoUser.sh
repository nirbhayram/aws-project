USER_POOL_ID=$1
USER_ID=$2
USER_SECRET=$3

{
    aws cognito-idp admin-create-user --user-pool-id ${USER_POOL_ID} --username ${USER_ID} --message-action SUPPRESS --temporary-password ${USER_SECRET}
} || {
    exit 1
}
{
    aws cognito-idp admin-set-user-password --user-pool-id ${USER_POOL_ID} --username ${USER_ID} --password ${USER_SECRET} --permanent
} || {
    exit 1
}
{
    aws dynamodb put-item --table-name "User" --item '{"userid": {"S": "'$USER_ID'"},"balance": {"S": "1000"}}' --return-consumed-capacity TOTAL
} || {
    exit 1
}
