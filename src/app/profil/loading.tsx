import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Skeleton variant="rectangular" width={120} height={32} className="rounded" />
          <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Skeleton variant="text" width={180} height={40} className="mb-2" />
          <Skeleton variant="text" width={300} height={24} />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-indigo-500">
              <div className="flex items-center">
                <Skeleton variant="circular" width={20} height={20} className="mr-2" />
                <Skeleton variant="text" width={60} height={20} />
              </div>
            </div>
            <div className="py-2 px-1">
              <div className="flex items-center">
                <Skeleton variant="circular" width={20} height={20} className="mr-2" />
                <Skeleton variant="text" width={80} height={20} />
              </div>
            </div>
          </nav>
        </div>

        <div className="space-y-6">
          {/* Main Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton variant="text" width={180} height={32} />
              <Skeleton variant="rectangular" width={80} height={32} className="rounded" />
            </div>

            {/* Personal Information Section */}
            <div className="border-b border-slate-200 pb-8">
              <Skeleton variant="text" width={200} height={28} className="mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form fields */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={i === 5 || i === 6 ? "md:col-span-2" : ""}>
                    <Skeleton variant="text" width={100} height={20} className="mb-2" />
                    <Skeleton variant="rectangular" height={40} className="rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Email Confirmation Alert */}
            <div className="my-8">
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Skeleton variant="circular" width={16} height={16} className="mr-2" />
                      <Skeleton variant="text" width={250} height={20} />
                    </div>
                    <Skeleton variant="text" width="90%" height={16} className="mb-1" />
                    <Skeleton variant="text" width="80%" height={16} />
                  </div>
                  <Skeleton variant="rectangular" width={100} height={32} className="rounded ml-4" />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="pb-8">
              <Skeleton variant="text" width={180} height={28} className="mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={i <= 2 ? "md:col-span-2" : ""}>
                    <Skeleton variant="text" width={120} height={20} className="mb-2" />
                    <Skeleton variant="rectangular" height={40} className="rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton variant="text" width={150} height={32} className="mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg">
                  <Skeleton variant="text" width={80} height={24} className="mb-1" />
                  <Skeleton variant="text" width={150} height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton variant="text" width={100} height={24} className="mb-4" />
                <div className="space-y-2">
                  <Skeleton variant="text" width={80} height={16} />
                  <Skeleton variant="text" width={90} height={16} />
                  <Skeleton variant="text" width={70} height={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}