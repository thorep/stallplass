import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div className="bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Skeleton variant="rectangular" width={120} height={24} className="rounded" />
              <div className="hidden sm:flex items-center space-x-2">
                <Skeleton variant="rectangular" width={200} height={20} className="rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery Skeleton */}
            <div className="relative">
              <Skeleton 
                variant="rectangular" 
                className="aspect-[16/10] rounded-lg w-full" 
              />
            </div>

            {/* Box Info Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="60%" height={36} className="mb-2" />
              <Skeleton variant="text" width="40%" height={24} className="mb-4" />
              <Skeleton variant="rectangular" height={120} className="rounded mb-6" />
              
              {/* Box details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Skeleton variant="text" width="50%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="70%" height={24} />
                </div>
                <div>
                  <Skeleton variant="text" width="50%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="70%" height={24} />
                </div>
                <div>
                  <Skeleton variant="text" width="50%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="70%" height={24} />
                </div>
                <div>
                  <Skeleton variant="text" width="50%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="70%" height={24} />
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="30%" height={28} className="mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={40} className="rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="60%" height={28} className="mb-4" />
              <div className="space-y-3">
                <Skeleton variant="rectangular" height={48} className="rounded" />
                <Skeleton variant="rectangular" height={48} className="rounded" />
              </div>
            </div>

            {/* Stable Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="50%" height={28} className="mb-4" />
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} />
                  </div>
                </div>
                <Skeleton variant="rectangular" height={32} className="rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}