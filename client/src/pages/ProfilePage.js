import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import store from "../stores";
import { setUsername, setToken } from "../stores/UserStore";

function ProfilePage() {
  const history = useHistory();
  const { username } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useSelector((state) => state.user.token);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    let cacheLogin = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!cacheLogin || !cacheLogin.username) {
      history.push("/login");
    } else {
      store.dispatch(setUsername(cacheLogin.username));
      store.dispatch(setToken(cacheLogin.token));
    }
  };

  const goToPost = (postId) => {
    //add postId to history
    history.push(`/post/${postId}`);
  };
  const ProfileInfo = ({ userInfo }) => {
    const { bio, profilePic, postsCount, followersCount, followingCount } =
      userInfo;

    return (
      <div className="px-4 md:px-16 py-1 flex flex-col md:flex-row items-center">
        <img
          className="rounded-full w-20 h-20 md:w-24 md:h-24 mr-0 md:mr-5 mb-3 md:mb-0"
          src={profilePic}
          alt={username}
        />
        <div className="md:flex-grow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg md:text-xl font-bold">{username}</h2>
            <button className="px-3 py-1 md:px-5 md:py-2 border border-gray-300 rounded-md text-sm font-bold">
              Edit Profile
            </button>
          </div>
          <p className="mb-3">{bio}</p>
          <div className="flex justify-between md:justify-start text-sm font-medium">
            <span className="mr-4">{postsCount} posts</span>
            <span className="mr-4">{followersCount} followers</span>
            <span>{followingCount} following</span>
          </div>
        </div>
      </div>
    );
  };
  useEffect(async () => {
    if (token) {
      setLoading(true);
      let images = await getImages();
      // console.log({ images });
      setPosts(images);
      setLoading(false);
    }
  }, [token]);

  async function getImages() {
    try {
      let response = await axios.get(`sdxl/generate/image/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        console.error(error.response.data.message);
      } else {
        console.error("An unexpected error occurred");
      }

      return [];
    }
  }

  const ProfileNavigation = () => {
    return (
      <div className="flex justify-around border-t border-gray-300 mt-4 pt-2">
        <button className="text-gray-500 text-sm sm:text-base md:text-lg font-arial py-1 px-2 sm:py-2 sm:px-3 md:py-3 md:px-4 rounded-md mr-2 sm:mr-3 md:mr-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600">
          POSTS
        </button>
        <button className="text-gray-500 text-sm sm:text-base md:text-lg font-arial py-1 px-2 sm:py-2 sm:px-3 md:py-3 md:px-4 rounded-md mr-2 sm:mr-3 md:mr-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600">
          TAGGED
        </button>
      </div>
    );
  };
  const PostsGrid = ({ posts }) => {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 sm:gap-2 md:gap-3 p-2 sm:p-3 md:p-4 mt-4 mb-10">
        {posts.map((post) => (
          <div key={post.id}>
            <img
              className="object-cover w-full h-full"
              src={post.image}
              onClick={() => goToPost(post.id)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center p-4">
      <ProfileInfo
        userInfo={{
          bio: "Travel enthusiast",
          profilePic: "https://via.placeholder.com/640",
          postsCount: 231,
          followersCount: 5421,
          followingCount: 162,
        }}
      />
      <ProfileNavigation />
      <PostsGrid posts={posts} />
      {loading && (
        <div className="text-2xl font-bold text-gray-500">Loading...</div>
      )}
    </div>
  );
}

export default ProfilePage;
