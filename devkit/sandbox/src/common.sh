#!/usr/bin/env /bash

# path to this file
DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)

# safe curl: error when response status code is >400
scurl() {
    curl --silent --show-error --fail "$@" || exit 1
}

# stop sandbox
stop() {
    echo "Stopping 'central-docker-compose'"
    docker compose -f $DIR/central-docker-compose.yml -p sandbox-central down -v;
    echo "Stopping 'nodes-docker-compose'"
    docker compose -f $DIR/nodes-docker-compose.yml -p sandbox-nodes down -v;
    rm -f $DIR/logs;
    echo "Sandbox has stopped!"
}

# start sandbox
start() {
    # stop if already running
    stop

    echo "Starting 'nodes-docker-compose' including 'manager'. Waiting for funding & open channels"

    #  Run docker compose as daemon
    docker compose -f $DIR/nodes-docker-compose.yml -p sandbox-nodes \
        up -d --remove-orphans --build --force-recreate --renew-anon-volumes

    # Extract HOPRD_API_TOKEN from env file
    source $DIR/.env

    logs1=""
    logs2=""
    logs3=""
    logs4=""
    logs5=""
    logs_pluto=""
    logs_error=""
    segmentation_error=""
    pluto=false

    echo "Waiting for exit nodes setup"

    until [[ $logs1 =~ "onOpen" ]]; do
        docker logs sandbox-nodes-exit-1-1 &> $DIR/logs
        logs1=$(cat $DIR/logs)
        sleep 1
    done
    echo "Node 1 running"

    until [[ $logs2 =~ "onOpen" ]]; do
        docker logs sandbox-nodes-exit-2-1 &> $DIR/logs
        logs2=$(cat $DIR/logs)
        sleep 1
    done
    echo "Node 2 running"

    until [[ $logs3 =~ "onOpen" ]]; do
        docker logs sandbox-nodes-exit-3-1 &> $DIR/logs
        logs3=$(cat $DIR/logs)
        sleep 1
    done
    echo "Node 3 running"

    until [[ $logs4 =~ "onOpen" ]]; do
        docker logs sandbox-nodes-exit-4-1 &> $DIR/logs
        logs4=$(cat $DIR/logs)
        sleep 1
    done
    echo "Node 4 running"

    until [[ $logs5 =~ "onOpen" ]]; do
        docker logs sandbox-nodes-exit-5-1 &> $DIR/logs
        logs5=$(cat $DIR/logs)
        sleep 1
    done
    echo "Node 5 running"
    echo "All nodes ready!"

    echo "Waiting for node to find each other and channels to open"
    until [[ $pluto == true ]]; do
        docker logs sandbox-nodes-pluto-1 &> $DIR/logs
        logs_pluto=$(cat $DIR/logs | grep "Terminating this script will clean up the running local cluster" | head -1)
        logs_error=$(cat $DIR/logs | grep "Cleaning up processes" | head -1)
        segmentation_error=$(cat $DIR/logs | grep "Segmentation fault" | head -1)
        # Check for a segmentation fault or if the retries are over
        if [[ ! -z "$logs_error" || ! -z "$segmentation_error" ]]; then
            echo "Unrecoverable error"
            echo "Exiting..."
            stop
            exit
        fi

        [[ ! -z "$logs_pluto" ]] && pluto=true
    done

    echo "Done 'nodes-docker-compose'"

    # # fund funding-service wallet
    # echo "Funding funding-service wallet"
    # scurl "http://127.0.0.1:3030/fund-via-hoprd" \
    #     -H "Content-Type: application/json" \
    #     -d '{
    #         "hoprdEndpoint": "'$HOPRD_API_ENDPOINT_1'",
    #         "hoprdToken": "'$HOPRD_API_TOKEN'",
    #         "nativeAmount": "'$NATIVE_AMOUNT'",
    #         "hoprAmount": "'$HOPR_AMOUNT'",
    #         "recipient": "'$FUNDING_SERVICE_ADDRESS'"
    #     }'

    # get HOPR Token address
    hoprTokenAddress=$(
        scurl -bH "Content-Type: application/json" "http://127.0.0.1:3030/get-hoprd-token-address?hoprdEndpoint=$HOPRD_API_ENDPOINT_1&hoprdToken=$HOPRD_API_TOKEN"
    )
    echo "Received hoprTokenAddress: $hoprTokenAddress"

    echo "Starting 'central-docker-compose'"
    FORCE_SMART_CONTRACT_ADDRESS="$hoprTokenAddress" \
        docker compose -f $DIR/central-docker-compose.yml -p sandbox-central \
        up -d --remove-orphans --build --force-recreate
    echo "Done 'central-docker-compose'"

    exit_code=1
    # add quota to client 'sandbox', try as long as it takes for the DP to become available
    until [[ $exit_code == 0 ]]; do
        echo "Try adding quota to 'sandbox' in 'discovery-platform'"
        curl --silent --show-error --fail "http://127.0.0.1:3030/add-quota" \
            -H "Content-Type: application/json" \
            -H "x-rpch-client: sandbox" \
            -d '{
                "discoveryPlatformEndpoint": "'$DISCOVERY_PLATFORM_ENDPOINT'",
                "client": "sandbox",
                "quota": "500"
            }'
        exit_code=$?
        sleep 1
    done
    echo "Added quota to client 'sandbox' in 'discovery-platform'"

    # add quota to client 'trial'
    echo "Adding quota to 'trial' in 'discovery-platform'"
    curl "http://127.0.0.1:3030/add-quota" \
        -H "Content-Type: application/json" \
        -H "x-rpch-client: trial" \
        -d '{
            "discoveryPlatformEndpoint": "'$DISCOVERY_PLATFORM_ENDPOINT'",
            "client": "trial",
            "quota": "500"
        }'
    echo "Added quota to client 'trial' in 'discovery-platform'"

    # register nodes
    echo "Registering nodes to discovery-platform"
    scurl "http://127.0.0.1:3030/register-nodes" \
        -H "Content-Type: application/json" \
        -d '{
            "discoveryPlatformEndpoint": "'$DISCOVERY_PLATFORM_ENDPOINT'",
            "chainId": "31337",
            "X-Rpch-Client": "trial",
            "hoprdApiEndpoints": [
                "'$HOPRD_API_ENDPOINT_1'",
                "'$HOPRD_API_ENDPOINT_2'",
                "'$HOPRD_API_ENDPOINT_3'",
                "'$HOPRD_API_ENDPOINT_4'",
                "'$HOPRD_API_ENDPOINT_5'"
            ],
            "hoprdApiTokens": [
                "'$HOPRD_API_TOKEN'",
                "'$HOPRD_API_TOKEN'",
                "'$HOPRD_API_TOKEN'",
                "'$HOPRD_API_TOKEN'",
                "'$HOPRD_API_TOKEN'"
            ],
            "exitNodePubKeys": [
                "'$EXIT_NODE_PUB_KEY_1'",
                "'$EXIT_NODE_PUB_KEY_2'",
                "'$EXIT_NODE_PUB_KEY_3'",
                "'$EXIT_NODE_PUB_KEY_4'",
                "'$EXIT_NODE_PUB_KEY_5'"
            ],
            "hasExitNodes": [
                true,
                true,
                true,
                true,
                true
            ]
        }'
    echo "Registered nodes to discovery-platform"

    # check nodes
    hoprAddresses=$(
        scurl "http://127.0.0.1:3030/get-hoprds-addresses" \
            -H "Content-Type: application/json" \
            -d '{
                "hoprdApiEndpoints": [
                    "'$HOPRD_API_ENDPOINT_1'",
                    "'$HOPRD_API_ENDPOINT_2'",
                    "'$HOPRD_API_ENDPOINT_3'",
                    "'$HOPRD_API_ENDPOINT_4'",
                    "'$HOPRD_API_ENDPOINT_5'"
                ],
                "hoprdApiTokens": [
                    "'$HOPRD_API_TOKEN'",
                    "'$HOPRD_API_TOKEN'",
                    "'$HOPRD_API_TOKEN'",
                    "'$HOPRD_API_TOKEN'",
                    "'$HOPRD_API_TOKEN'"
                ]
            }'
    )
    echo "Got node peer IDs"

    peerId1=$(jq -r '.hopr | .[0]' <<< "$hoprAddresses")
    peerId2=$(jq -r '.hopr | .[1]' <<< "$hoprAddresses")
    peerId3=$(jq -r '.hopr | .[2]' <<< "$hoprAddresses")
    peerId4=$(jq -r '.hopr | .[3]' <<< "$hoprAddresses")
    peerId5=$(jq -r '.hopr | .[4]' <<< "$hoprAddresses")

    # check nodes available at DP
    scurl "http://127.0.0.1:3020/api/v1/node/${peerId1}" -H "Accept: application/json" -H "x-rpch-client: trial"
    scurl "http://127.0.0.1:3020/api/v1/node/${peerId2}" -H "Accept: application/json" -H "x-rpch-client: trial"
    scurl "http://127.0.0.1:3020/api/v1/node/${peerId3}" -H "Accept: application/json" -H "x-rpch-client: trial"
    scurl "http://127.0.0.1:3020/api/v1/node/${peerId4}" -H "Accept: application/json" -H "x-rpch-client: trial"
    scurl "http://127.0.0.1:3020/api/v1/node/${peerId5}" -H "Accept: application/json" -H "x-rpch-client: trial"

    # wait until DP returns an entry node
    exit_code=1
    waittime=0
    until [[ $exit_code == 0 ]]; do
        echo "Try fetching entry node from discovery platform, since ${waittime}s"
        curl --silent --show-error --fail "http://127.0.0.1:3020/api/v1/request/entry-node" \
            -H "Accept: application/json" \
            -H "x-rpch-client: trial" \
            -d '{"excludeList":[],"client":"trial"}'
        exit_code=$?
        waittime=$((waittime + 10))
        sleep 10
    done
    echo "Found potential entry node at discovery platform."

    echo "Sandbox has started!"
}
