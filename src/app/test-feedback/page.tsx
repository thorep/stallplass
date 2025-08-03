export default function TestFeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-h1 font-bold mb-8">Test Feedback Components</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-h2 mb-4">Feedback Button (Bottom Right)</h2>
          <p className="text-body text-gray-600">
            Check the bottom-right corner of the screen for the floating feedback button.
            It expands on click to show options for reporting bugs or suggesting improvements.
          </p>
        </div>
        
        <div>
          <h2 className="text-h2 mb-4">Header Pill (In Navigation)</h2>
          <p className="text-body text-gray-600 mb-4">
            The header includes a pill-shaped button with &ldquo;Meld feil eller forbedring&rdquo; text.
            On mobile, it shows as &ldquo;Feedback&rdquo; to save space.
          </p>
        </div>
      </div>
    </div>
  );
}