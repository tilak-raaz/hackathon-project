import SignUpForm from "./components/SignUpForm";

const App = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#242424] text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to Our Website</h1>
      <SignUpForm />
    </div>
  );
};

export default App;
