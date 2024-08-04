import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { FiThumbsUp, FiShare2, FiFlag } from "react-icons/fi";

axios.defaults.baseURL = "https://09ed1e24ce6e.ngrok.app/api";

function PostPage() {
  const history = useHistory();
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const username = useSelector((state) => state.user.username);
  const token = useSelector((state) => state.user.token);

  useEffect(() => {
    if (postId) {
      async function fetchPost() {
        try {
          const response = await axios.get(`/sdxl/task/${postId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(response.data);
          let post = response.data;
          post.image = response.data.imageFullUrl;
          post.title = "Generated Image";
          post.description = response.data.prompt;
          post.artistInfo = {
            username: response.data.username,
            profilePic: "https://via.placeholder.com/300",
          };
          post.price = "100";
          post.royalty = "5";
          post.comments = [];
          setPost(post);
        } catch (error) {
          console.error("An error occurred while fetching post data:", error);
        }
      }
      fetchPost();
    } else {
      // Placeholder post
      setPost({
        artistInfo: {
          username: "Unknown Artist",
          profilePic: "https://via.placeholder.com/300",
        },
        image: "https://via.placeholder.com/640",
        title: "Placeholder Title",
        description: "Placeholder Description",
        price: "100",
        royalty: "5",
        comments: [
          { author: "user1", text: "Amazing art!" },
          { author: "user2", text: "I love this!" },
          { author: "user3", text: "Incredible work!" },
          { author: "user4", text: "This is beautiful!" },
          { author: "user5", text: "Great job!" },
        ],
      });
    }
  }, [postId]);

  if (!post) {
    return <div>Loading...</div>;
  }

  function goToEditPost() {
    history.push(`/edit/${postId}`);
  }

  const { artistInfo, image, title, description, price, royalty, comments } =
    post;

  return (
    <div className="flex flex-col items-center p-4 md:p-2 md:mb-14">
      <div className="flex items-center mb-2 w-full justify-between">
        <div className="flex items-center">
          <img
            className="rounded-full w-12 h-12"
            src={artistInfo.profilePic}
            alt={artistInfo.username}
          />
          <h2 className="text-lg md:text-xl font-bold ml-3">
            {artistInfo.username}
          </h2>
        </div>
        <a
          href={`/profile/${artistInfo.username}`}
          className="text-sm font-medium text-blue-500"
        >
          Back to Profile
        </a>
      </div>
      <div
        className="w-full md:w-2/3 rounded-lg overflow-hidden"
        style={{ maxHeight: "60vh" }}
      >
        <img className="object-cover w-full h-full" src={image} alt={title} />
      </div>
      <div className="w-full md:w-2/3 mt-2">
        <h3 className="text-lg md:text-xl font-bold">{title}</h3>
        <p className="text-sm md:text-base">{description}</p>
        {price && (
          <div className="flex items-center justify-between">
            <span className="text-sm md:text-base font-medium">
              Price: ${price}
            </span>
            <button
              className="px-3 py-1 md:px-5 md:py-2 border border-gray-300 rounded-md text-sm font-bold"
              onClick={goToEditPost}
            >
              Edit
            </button>
            <button className="px-3 py-1 md:px-5 md:py-2 border border-gray-300 rounded-md text-sm font-bold">
              Buy Now
            </button>
          </div>
        )}
        {royalty && (
          <div className="mb-2">
            <span className="text-sm md:text-base font-medium">
              Royalty for Resell: {royalty}%
            </span>
          </div>
        )}
      </div>
      <div className="w-full md:w-2/3 flex justify-between items-center mt-2 mb-4">
        <button className="text-gray-500 text-sm md:text-base font-medium flex items-center">
          <FiThumbsUp className="mr-2" />
          Like
        </button>
        <button className="text-gray-500 text-sm md:text-base font-medium flex items-center">
          <FiShare2 className="mr-2" />
          Share
        </button>
        <button className="text-gray-500 text-sm md:text-base font-medium flex items-center">
          <FiFlag className="mr-2" />
          Report
        </button>
      </div>
      <div
        className="w-full md:w-2/3 overflow-y-auto p-2 border-2 border-gray-300 rounded-md"
        style={{ maxHeight: "10vh" }}
      >
        {comments.map((comment, index) => (
          <div key={index} className="flex flex-col mb-2">
            <span className="text-sm md:text-base font-medium">
              {comment.author}:
            </span>
            <span className="text-sm md:text-base">{comment.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostPage;
