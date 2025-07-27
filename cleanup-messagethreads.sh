#!/bin/bash

# This script removes rental-related code from MessageThread component

# Remove onRentalConfirmation prop from interface
sed -i '' '/onRentalConfirmation: () => void;/d' src/components/molecules/MessageThread.tsx

# Remove onRentalConfirmation from props destructuring
sed -i '' '/onRentalConfirmation,/d' src/components/molecules/MessageThread.tsx

# Remove showRentalConfirm state
sed -i '' '/const \[showRentalConfirm, setShowRentalConfirm\] = useState(false);/d' src/components/molecules/MessageThread.tsx

# Remove canConfirmRental declaration
sed -i '' '/const canConfirmRental =/,+1d' src/components/molecules/MessageThread.tsx

echo "Cleanup complete"