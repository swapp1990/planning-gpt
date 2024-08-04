import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import Logo from "./Logo";
import { Link, useHistory } from "react-router-dom";
import { FaCompass, FaHeart, FaPlusSquare, FaPaperPlane } from "react-icons/fa";
import store from "../stores";
import { setUsername, setToken } from "../stores/UserStore";

const Header = () => {
  const history = useHistory();

  const username = useSelector((state) => state.user.username);
  const handleLogout = () => {
    // Clear the cached login information
    localStorage.removeItem("loggedInUser");
    store.dispatch(setUsername("Guest"));
    store.dispatch(setToken(null));
    // Redirect to login page
    history.push("/login");
  };
  const HeaderObj = () => {
    return (
      <div className="bg-white py-2 flex items-center justify-between border-b-2 border-gray-200 fixed w-full top-0 z-50">
        <Logo />

        {/* <div className="hidden md:flex items-center space-x-6">
          <input
            type="text"
            placeholder="Search"
            className="border rounded p-1 text-sm bg-gray-100 text-gray-400"
          />

          <Link to="/new-post" title="Create New Post">
            <FaPlusSquare className="w-6 h-6 text-black hover:text-blue-400" />
          </Link>

          <Link to="/explore" title="Explore">
            <FaCompass className="w-6 h-6 text-black hover:text-blue-400" />
          </Link>

          <Link to="/activity" title="Activity">
            <FaHeart className="w-6 h-6 text-black hover:text-blue-400" />
          </Link>
        </div> */}

        <div className="flex items-center space-x-6">
          {/* <Link to="/direct-messages" title="Direct Messages">
            <FaPaperPlane className="w-6 h-6 text-black hover:text-blue-400 md:hidden" />
          </Link>

          <Link to="/activity" title="Activity">
            <FaHeart className="w-6 h-6 text-black hover:text-blue-400 md:hidden" />
          </Link> */}

          <Link title="Logout" onClick={handleLogout}>
            <div className="flex items-center space-x-2">
              <h2>{username}</h2>
              <img
                src="https://via.placeholder.com/150"
                alt="Profile"
                className="rounded-full w-6 h-6 border-2 hover:border-blue-400"
              />
            </div>
          </Link>
        </div>
      </div>
    );
  };
  return (
    <>
      <HeaderObj />
      {/* <nav class="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div class="px-3 py-3 lg:px-5 lg:pl-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center justify-start">
              <button
                onClick={onToggleSidebar}
                aria-controls="logo-sidebar"
                type="button"
                class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              >
                <span class="sr-only">Open sidebar</span>
                <svg
                  class="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clip-rule="evenodd"
                    fill-rule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>
              <Logo />
            </div>
            <div class="flex items-center">
              <Profile />
            </div>
          </div>
        </div>
      </nav> */}
    </>
  );
};
export default Header;
