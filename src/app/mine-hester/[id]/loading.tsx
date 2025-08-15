import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Skeleton variant="rectangular" width={120} height={32} className="rounded" />
          <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton variant="rectangular" width={180} height={40} className="rounded" />
            <Skeleton variant="rectangular" width={120} height={40} className="rounded" />
          </div>

          {/* Horse Images Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            {/* Main Image */}
            <Skeleton 
              variant="rectangular" 
              className="w-full h-64 md:h-80 rounded-lg mb-4" 
            />
            
            {/* Thumbnail Gallery */}
            <div className="space-y-3">
              <Skeleton variant="text" width={150} height={20} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    className="aspect-square rounded-lg" 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" width={180} height={28} />
                </div>
                <Skeleton variant="rectangular" width={80} height={32} className="rounded" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" width={36} height={36} className="rounded-lg" />
                  <div className="flex-1">
                    <Skeleton variant="text" width={60} height={16} />
                    <Skeleton variant="text" width={120} height={20} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" width={36} height={36} className="rounded-lg" />
                  <div className="flex-1">
                    <Skeleton variant="text" width={40} height={16} />
                    <Skeleton variant="text" width={100} height={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Characteristics Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" width={160} height={28} />
                </div>
                <Skeleton variant="rectangular" width={80} height={32} className="rounded" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="rectangular" width={36} height={36} className="rounded-lg" />
                    <div className="flex-1">
                      <Skeleton variant="text" width={50} height={16} />
                      <Skeleton variant="text" width={80} height={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" width={100} height={28} />
                </div>
                <Skeleton variant="rectangular" width={80} height={32} className="rounded" />
              </div>
              
              <div className="space-y-3">
                <Skeleton variant="text" width="100%" height={24} />
                <Skeleton variant="text" width="95%" height={24} />
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="70%" height={24} />
              </div>
            </div>
          </div>

          {/* Horse Sharing Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" width={120} height={28} />
                </div>
              </div>
              <Skeleton variant="rectangular" height={80} className="rounded" />
            </div>
          </div>

          {/* Stable Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" width={140} height={28} />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" width={48} height={48} className="rounded" />
                  <div className="flex-1">
                    <Skeleton variant="text" width={150} height={20} />
                    <Skeleton variant="text" width={100} height={16} />
                  </div>
                </div>
                <Skeleton variant="rectangular" height={40} className="rounded" />
              </div>
            </div>
          </div>

          {/* Log Categories */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={20} height={20} />
                    <Skeleton variant="text" width={120} height={28} />
                  </div>
                  <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
                </div>
                
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton variant="text" width={150} height={20} />
                        <Skeleton variant="text" width={80} height={16} />
                      </div>
                      <Skeleton variant="text" width="90%" height={16} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Metadata Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton variant="text" width={180} height={28} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" width={80} height={16} />
                  <Skeleton variant="text" width={100} height={16} />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" width={90} height={16} />
                  <Skeleton variant="text" width={100} height={16} />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" width={40} height={16} />
                  <Skeleton variant="text" width={120} height={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}