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
          <div className="flex justify-between items-center">
            <Skeleton variant="rectangular" width={100} height={24} className="rounded" />
            <Skeleton variant="rectangular" width={120} height={36} className="rounded" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery Skeleton */}
            <div className="relative">
              <Skeleton 
                variant="rectangular" 
                className="aspect-[16/10] rounded-md w-full" 
              />
            </div>

            {/* Stable Info Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="70%" height={36} className="mb-2" />
              <Skeleton variant="text" width="50%" height={24} className="mb-6" />
              <Skeleton variant="rectangular" height={120} className="rounded mb-6" />
              
              {/* Stable details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <Skeleton variant="text" width="40%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="80%" height={24} />
                </div>
                <div>
                  <Skeleton variant="text" width="40%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="80%" height={24} />
                </div>
                <div>
                  <Skeleton variant="text" width="40%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="80%" height={24} />
                </div>
                <div>
                  <Skeleton variant="text" width="40%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="80%" height={24} />
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="30%" height={28} className="mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={40} className="rounded" />
                ))}
              </div>
            </div>

            {/* Available Boxes Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="40%" height={28} className="mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <Skeleton variant="text" width="60%" height={24} className="mb-2" />
                    <Skeleton variant="text" width="40%" height={20} className="mb-3" />
                    <Skeleton variant="rectangular" height={36} className="rounded" />
                  </div>
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

            {/* Quick Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="50%" height={28} className="mb-4" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="30%" height={20} />
                </div>
                <div className="flex justify-between">
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="30%" height={20} />
                </div>
                <div className="flex justify-between">
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="30%" height={20} />
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton variant="text" width="40%" height={28} className="mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <Skeleton variant="text" width="70%" height={20} className="mb-1" />
                    <Skeleton variant="text" width="50%" height={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}