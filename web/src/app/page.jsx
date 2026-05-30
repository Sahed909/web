export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl mb-6 shadow-xl shadow-blue-200">
        🍽️
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
        QRMenu
      </h1>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        A smart QR-based restaurant ordering system. Scan a QR code at a
        restaurant to view the menu and place your order.
      </p>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
        <p className="text-sm text-gray-500 italic">
          Use the mobile app to manage your restaurant or scan a QR code to
          order.
        </p>
      </div>
    </div>
  );
}
