import React, { lazy, useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import AlertMessage from "../components/AlertMessage";
import Logo from "../components/Logo";
import store from "../stores";
import { login } from "../server/users";
import { setToken, setUsername } from "../stores/UserStore";

export default function Login() {
  const history = useHistory();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginInfo, setLoginInfo] = useState({ name: "", pwd: "" });
  function handleNameChange(event) {
    // console.log(event.target.value);
    setError(null);
    const newConfig = { ...loginInfo, name: event.target.value };
    setLoginInfo(newConfig);
  }

  function handlePwdChange(event) {
    setError(null);
    const newConfig = { ...loginInfo, pwd: event.target.value };
    setLoginInfo(newConfig);
  }

  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);

    let userFilter = { username: loginInfo.name, pwd: loginInfo.pwd };
    const response = await login(userFilter);
    console.log(response);
    if (response.error) {
      setError({ msg: response.error });
    }
    if (!response.token) {
      setError({ msg: "Unexpected Error" });
    } else {
      let cache = {
        username: loginInfo.name,
        token: response.token,
      };
      localStorage.setItem("loggedInUser", JSON.stringify(cache));
      store.dispatch(setUsername(loginInfo.name));
      store.dispatch(setToken(loginInfo.name));
      history.push("/home");
    }
    setLoading(false);
  };
  return (
    <>
      <div class="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
        <div class="w-full flex items-center justify-center m-2">
          <Logo />
        </div>
        <div class="w-full flex items-center justify-center bg-white rounded-lg shadow dark:border md:mt-0 xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div class="p-6 space-y-4 md:space-y-6 sm:p-8 max-w-3xl mx-auto">
            <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Sign in to your account
            </h1>
            <form class="space-y-4 md:space-y-6" action="#">
              <div>
                <label
                  for="username"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Your username
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="username"
                  required=""
                  value={loginInfo.name}
                  onChange={handleNameChange}
                />
              </div>
              <div>
                <label
                  for="password"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required=""
                  value={loginInfo.pwd}
                  onChange={handlePwdChange}
                />
              </div>
              {/* <div class="flex items-center justify-between">
                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="remember"
                      aria-describedby="remember"
                      type="checkbox"
                      class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                      required=""
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="remember"
                      class="text-gray-500 dark:text-gray-300"
                    >
                      Remember me
                    </label>
                  </div>
                </div>
                <a
                  href="#"
                  class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
                >
                  Forgot password?
                </a>
              </div> */}
              <button
                type="submit"
                onClick={handleClick}
                disabled={isLoading}
                className={`w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                } flex justify-center`}
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : "Sign in"}
              </button>
              {error && <AlertMessage message={error.msg} />}
              <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                Don’t have an account yet?{" "}
                <a
                  href="#"
                  class="font-medium text-blue-600 hover:underline dark:text-blue-500"
                >
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
