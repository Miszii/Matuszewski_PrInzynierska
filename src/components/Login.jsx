import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Input from "@mui/material/Input";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

function Auth({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    if (registered && !validatePassword(password)) {
      alert(
        "Hasło musi mieć od 8 do 64 znaków i zawierać co najmniej jedną małą literę, wielką literę, cyfrę oraz znak specjalny."
      );
      return;
    }

    const endpoint = registered ? "/register" : "/login";

    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        email,
        password,
      });

      if (!registered) {
        localStorage.setItem("token", response.data.token);
        setIsAuthenticated(true);
        navigate("/");
      } else {
        alert("Rejestracja zakończona sukcesem!");
        setRegistered(false);
      }
    } catch (error) {
      console.error("Szczegóły błędu:", error);
      alert("Błąd: " + (error.response?.data?.error || "Nieznany błąd"));
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-6 text-[#051094]">
        {registered ? "Rejestracja" : "Logowanie"}
      </h1>
      <AuthForm
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        registered={registered}
        submit={submit}
      />
      <FormSwitch registered={registered} setRegistered={setRegistered} />
    </div>
  );
}

function AuthForm({
  email,
  password,
  setEmail,
  setPassword,
  registered,
  submit,
}) {
  return (
    <form
      onSubmit={submit}
      className="bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto"
    >
      <FormInput label="Email" type="email" value={email} setValue={setEmail} />
      <FormInput
        label="Hasło"
        type="password"
        value={password}
        setValue={setPassword}
      />

      {registered && (
        <small className="text-gray-500">
          Hasło musi mieć od 8 do 64 znaków, w tym co najmniej jedną małą
          literę, wielką literę, cyfrę oraz znak specjalny.
        </small>
      )}

      <div className="text-center mt-4">
        <button
          type="submit"
          className="bg-[#051094] text-white py-2 px-4 rounded hover:bg-blue-800 transition duration-200"
        >
          {registered ? "Zarejestruj" : "Zaloguj"}
        </button>
      </div>
    </form>
  );
}

function FormInput({ label, type, value, setValue }) {
  const [showPassword, setShowPassword] = useState(false);
  const formType = type === "password";

  return (
    <div className="form-group mb-4">
      <label className="block font-semibold text-[#051094] mb-2">
        {label}:
      </label>
      <Input
        type={formType && showPassword ? "text" : type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        className="w-full p-2 border border-gray-300 rounded"
        endAdornment={
          formType && (
            <InputAdornment position="end">
              <IconButton
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          )
        }
      />
    </div>
  );
}

function FormSwitch({ registered, setRegistered }) {
  return (
    <div className="text-center mt-4">
      <button
        onClick={() => setRegistered(!registered)}
        className="text-[#051094] underline"
      >
        {registered
          ? "Masz już konto? Zaloguj się"
          : "Nie masz konta? Zarejestruj się"}
      </button>
    </div>
  );
}

function validatePassword(password) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;
  return passwordRegex.test(password);
}

export default Auth;
