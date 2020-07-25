echo "Enter machine pool id : "
read MACHINE_POOL_ID
if [ -z "${MACHINE_POOL_ID}" ] 
then 
    echo "Value can't be null"
    exit 1
fi

echo ""
echo "Enter machine id : "
read MACHINE_ID
if [ -z "${MACHINE_ID}" ] 
then 
    echo "Value can't be null"
    exit 1
fi

echo ""
echo "Enter machine secret : "
read MACHINE_SECRET
if [ -z "${MACHINE_SECRET}" ] 
then 
    echo "Value can't be null"
    exit 1
fi

{
    aws cognito-idp admin-create-user --user-pool-id ${MACHINE_POOL_ID} --username ${MACHINE_ID} --message-action SUPPRESS --temporary-password ${MACHINE_SECRET}
} || {
    exit 1
}
{
    aws cognito-idp admin-set-user-password --user-pool-id ${MACHINE_POOL_ID} --username ${MACHINE_ID} --password ${MACHINE_SECRET} --permanent
} || {
    exit 1
}
{
    aws dynamodb put-item --table-name "Client" --item '{"clientid": {"S": "'$MACHINE_ID'"}}' --return-consumed-capacity TOTAL
} || {
    exit 1
}
