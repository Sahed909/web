import useAuth from "@/utils/useAuth";

function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-extrabold text-blue-600 mb-8">QRMenu</h1>
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Sign out</h2>
        <p className="text-gray-500 mb-8">
          Are you sure you want to sign out of your account?
        </p>

        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all"
          >
            Sign Out
          </button>
          <a
            href="/"
            className="block w-full text-center py-3 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}

export default LogoutPage;
