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

      {/* Back Link Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Skeleton variant="rectangular" width={150} height={24} className="rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2">
            {/* Photo Gallery Skeleton */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main large image */}
                <Skeleton 
                  variant="rectangular" 
                  className="md:col-span-2 h-64 md:h-80 rounded-lg" 
                />
                {/* Smaller images */}
                <Skeleton variant="rectangular" className="h-48 rounded-lg" />
                <Skeleton variant="rectangular" className="h-48 rounded-lg" />
              </div>
            </div>

            {/* Title and Badge Section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton variant="rectangular" width={120} height={28} className="rounded-full" />
              </div>
              <Skeleton variant="text" width="70%" height={40} className="mb-2" />
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <Skeleton variant="text" width="30%" height={32} className="mb-3" />
              <div className="space-y-3">
                <Skeleton variant="text" width="100%" height={24} />
                <Skeleton variant="text" width="95%" height={24} />
                <Skeleton variant="text" width="90%" height={24} />
                <Skeleton variant="text" width="85%" height={24} />
                <Skeleton variant="text" width="70%" height={24} />
              </div>
            </div>

            {/* Service Areas Section */}
            <div className="mb-8">
              <Skeleton variant="text" width="40%" height={32} className="mb-3" />
              <div className="flex items-start">
                <Skeleton variant="circular" width={20} height={20} className="mr-2 mt-0.5" />
                <Skeleton variant="text" width="60%" height={24} />
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              {/* Price Section */}
              <div className="mb-6">
                <Skeleton variant="text" width="30%" height={28} className="mb-2" />
                <Skeleton variant="text" width="60%" height={36} />
              </div>

              {/* Service Provider Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="rectangular" width={80} height={32} className="rounded" />
                </div>
                <div className="flex items-center mb-3">
                  <Skeleton variant="circular" width={32} height={32} className="mr-3" />
                  <div className="flex-1">
                    <Skeleton variant="text" width="80%" height={20} className="mb-1" />
                    <Skeleton variant="text" width="60%" height={16} />
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3">
                <Skeleton variant="rectangular" width="100%" height={48} className="rounded" />
                <Skeleton variant="rectangular" width="100%" height={48} className="rounded" />
                <Skeleton variant="rectangular" width="100%" height={48} className="rounded" />
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex items-center">
                  <Skeleton variant="circular" width={16} height={16} className="mr-2" />
                  <Skeleton variant="text" width="70%" height={20} />
                </div>
                <div className="flex items-center">
                  <Skeleton variant="circular" width={16} height={16} className="mr-2" />
                  <Skeleton variant="text" width="60%" height={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}