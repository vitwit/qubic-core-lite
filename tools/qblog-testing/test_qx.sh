#!/bin/bash

# Test if contract function calls work at all by testing QX (contract 1)
# QX should exist on any Qubic node

QUBIC_NODE_IP="127.0.0.1"
QUBIC_NODE_PORT="31841"

echo "Testing QX contract (index 1) to verify contract calls work..."
echo "Calling QX GetFees function (should return fee structure)..."

# QX function 1 is typically GetFees or similar
# Try with minimal output structure
qubic-cli -nodeip $QUBIC_NODE_IP -nodeport $QUBIC_NODE_PORT \
    -callcontractfunction 1 1 \
    "{}" \
    "{ uint64 }"

echo -e "\n----------------------------------------\n"
echo "If this also returns 8 bytes, contract calls don't work on this node."
echo "If this returns more data, QBlog (contract 19) doesn't exist on this node."
