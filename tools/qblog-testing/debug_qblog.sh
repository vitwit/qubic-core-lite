#!/bin/bash

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

QUBIC_NODE_IP=${QUBIC_NODE_IP:-"127.0.0.1"}
QUBIC_NODE_PORT=${QUBIC_NODE_PORT:-"31841"}
QBLOG_CONTRACT_INDEX=${QBLOG_CONTRACT_INDEX:-"19"}
# Use qubic-cli from PATH
QUBIC_CLI_PATH="qubic-cli"

# 1. Probe with uint32 (4 bytes)
echo "Probing with uint32 (4 bytes)..."
$QUBIC_CLI_PATH -enabletestcontracts -nodeip $QUBIC_NODE_IP -nodeport $QUBIC_NODE_PORT \
    -callcontractfunction $QBLOG_CONTRACT_INDEX 5 \
    "{ 0uint32 }" \
    "{ uint32 }"

echo -e "\n----------------------------------------\n"

# 2. Probe with empty array (0 bytes)
echo "Probing with [0;sint8] (0 bytes)..."
$QUBIC_CLI_PATH -enabletestcontracts -nodeip $QUBIC_NODE_IP -nodeport $QUBIC_NODE_PORT \
    -callcontractfunction $QBLOG_CONTRACT_INDEX 5 \
    "{ 0uint32 }" \
    "{ [0;sint8] }"
