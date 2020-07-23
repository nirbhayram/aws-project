MACHINE_POOL_ID=$1
MACHINE_ID=$2
MACHINE_SECRET=$3

aws cognito-idp admin-create-user --user-pool-id ${MACHINE_POOL_ID} --username ${MACHINE_ID} --message-action SUPPRESS --temporary-password ${MACHINE_SECRET}

aws cognito-idp admin-set-user-password --user-pool-id ${MACHINE_POOL_ID} --username ${MACHINE_ID} --password ${MACHINE_SECRET} --permanent

aws dynamodb put-item --table-name "Client" --item '{"clientid": {"S": "'$MACHINE_ID'"}}' --return-consumed-capacity TOTAL