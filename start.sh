#SEARCH=redisearch.Linux-ubuntu20.04-x86_64.2.10.7.zip

#if [ ! -f $SEARCH ]
#then
#    echo "*** Fetch Search module  ***"
#    wget -q https://redismodules.s3.amazonaws.com/redisearch/$SEARCH
#fi 

#!/bin/bash
if [ ! -d ~/.cache/nim ]
then
    mkdir ~/.cache/nim
fi

docker compose up -d
curl -s -o /dev/null --retry 5 --retry-all-errors --retry-delay 3 -f -k -u "redis@redis.com:redis" https://localhost:9443/v1/bootstrap

echo "*** Build Cluster ***"
docker exec -it re1 /opt/redislabs/bin/rladmin cluster create name cluster.local username redis@redis.com password redis
sleep 1
#echo "*** Load Modules ***"
#curl -k -u "redis@redis.com:redis" https://localhost:9443/v1/modules -F module=@$SEARCH
echo "*** Build Target Redis DB ***"
curl -s -o /dev/null -k -u "redis@redis.com:redis" https://localhost:9443/v1/bdbs -H "Content-Type:application/json" -d @redb.json