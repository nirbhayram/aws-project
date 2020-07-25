echo "Enter user pool id : "
read USER_POOL_ID
if [ -z "${USER_POOL_ID}" ] 
then 
    echo "Value can't be null"
    exit 1
fi

echo ""
echo "Enter user id : "
read USER_ID
if [ -z "${USER_ID}" ] 
then 
    echo "Value can't be null"
    exit 1
fi

echo ""
echo "Enter user secret : "
read USER_SECRET
if [ -z "${USER_SECRET}" ] 
then 
    echo "Value can't be null"
    exit 1
fi

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
