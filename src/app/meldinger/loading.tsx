import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Skeleton variant="rectangular" width={120} height={32} className="rounded" />
          <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
        </div>
      </div>

      <main className="flex-1">
        <div className="h-[calc(100vh-4rem)] bg-white">
          <div className="h-full flex border-t border-gray-200">
            {/* Left Panel - Conversations List */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex-col flex">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" width={100} height={28} />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-1 p-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <Skeleton variant="circular" width={40} height={40} />
                        
                        <div className="flex-1 min-w-0">
                          {/* Name and timestamp */}
                          <div className="flex items-center justify-between mb-1">
                            <Skeleton variant="text" width={120} height={20} />
                            <Skeleton variant="text" width={40} height={16} />
                          </div>
                          
                          {/* Last message preview */}
                          <Skeleton variant="text" width="90%" height={16} />
                          
                          {/* Unread indicator */}
                          <div className="flex items-center justify-between mt-2">
                            <Skeleton variant="text" width={80} height={14} />
                            <Skeleton variant="circular" width={20} height={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Message Thread */}
            <div className="hidden md:flex flex-1 flex-col">
              {/* Message Thread Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton variant="text" width={150} height={20} className="mb-1" />
                    <Skeleton variant="text" width={100} height={16} />
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Message bubbles */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${i % 2 === 0 ? 'order-1' : 'order-2'}`}>
                      <div className={`rounded-lg p-3 ${
                        i % 2 === 0 ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <Skeleton 
                          variant="text" 
                          width="100%" 
                          height={16} 
                          className="mb-1"
                          sx={{ bgcolor: i % 2 === 0 ? 'rgba(255,255,255,0.3)' : undefined }}
                        />
                        <Skeleton 
                          variant="text" 
                          width="80%" 
                          height={16}
                          sx={{ bgcolor: i % 2 === 0 ? 'rgba(255,255,255,0.3)' : undefined }}
                        />
                      </div>
                      <Skeleton variant="text" width={60} height={12} className="mt-1" />
                    </div>
                    {i % 2 === 1 && (
                      <Skeleton variant="circular" width={32} height={32} className="order-1 mr-2 mt-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <Skeleton variant="rectangular" height={40} className="rounded-lg" />
                  </div>
                  <Skeleton variant="rectangular" width={80} height={40} className="rounded-lg" />
                </div>
              </div>
            </div>

            {/* Mobile: Show placeholder when no conversation selected */}
            <div className="md:hidden flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Skeleton variant="circular" width={64} height={64} className="mx-auto mb-4" />
                <Skeleton variant="text" width={150} height={24} className="mb-2" />
                <Skeleton variant="text" width={200} height={20} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}